import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  base32Decode,
  base32Encode,
  formatRecoveryCode,
  hotp,
  normaliseRecoveryCode,
  otpauthUri,
  totpCode,
  totpStep,
  verifyTotp,
  type HmacSha1,
} from '../core/totp.js';

const hmacSha1: HmacSha1 = (key, message) =>
  new Uint8Array(createHmac('sha1', Buffer.from(key)).update(Buffer.from(message)).digest());

// RFC 4226 / RFC 6238 reference secret: ASCII "12345678901234567890".
const SECRET = new TextEncoder().encode('12345678901234567890');

describe('base32', () => {
  it('round-trips the RFC secret', () => {
    expect(base32Encode(SECRET)).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    expect(base32Decode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')).toEqual(SECRET);
  });

  it('tolerates lower case, spaces and padding when decoding', () => {
    expect(base32Decode('gezd gnbv gy3t qojq gezd gnbv gy3t qojq==')).toEqual(SECRET);
  });

  it('rejects characters outside the alphabet', () => {
    expect(() => base32Decode('GEZ1')).toThrow(/Invalid base32/);
  });
});

describe('HOTP (RFC 4226 appendix D)', () => {
  const expected = [
    '755224', '287082', '359152', '969429', '338314',
    '254676', '287922', '162583', '399871', '520489',
  ];
  it('matches all ten reference counters', () => {
    expected.forEach((code, counter) => {
      expect(hotp(hmacSha1, SECRET, counter)).toBe(code);
    });
  });
  it('rejects a negative or fractional counter', () => {
    expect(() => hotp(hmacSha1, SECRET, -1)).toThrow(/counter/);
    expect(() => hotp(hmacSha1, SECRET, 1.5)).toThrow(/counter/);
  });
});

describe('TOTP (RFC 6238 appendix B, SHA1 rows)', () => {
  const vectors: Array<[number, string]> = [
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
    [20000000000, '65353130'],
  ];
  it('matches all six reference times at 8 digits', () => {
    for (const [seconds, code] of vectors) {
      expect(totpCode(hmacSha1, SECRET, seconds * 1000, 8)).toBe(code);
    }
  });
});

describe('verifyTotp', () => {
  const now = 1_111_111_111_000; // step 37037037
  const step = totpStep(now);
  const current = totpCode(hmacSha1, SECRET, now);

  it('accepts the current code and reports its step', () => {
    expect(verifyTotp(hmacSha1, SECRET, current, now, null)).toEqual({ ok: true, step });
  });

  it('accepts one step of clock skew either side', () => {
    const previous = hotp(hmacSha1, SECRET, step - 1);
    const next = hotp(hmacSha1, SECRET, step + 1);
    expect(verifyTotp(hmacSha1, SECRET, previous, now, null).ok).toBe(true);
    expect(verifyTotp(hmacSha1, SECRET, next, now, null).ok).toBe(true);
  });

  it('refuses a replayed code (step at or before the last accepted one)', () => {
    expect(verifyTotp(hmacSha1, SECRET, current, now, step).ok).toBe(false);
    const previous = hotp(hmacSha1, SECRET, step - 1);
    expect(verifyTotp(hmacSha1, SECRET, previous, now, step - 1).ok).toBe(false);
    // A genuinely newer code still passes.
    const next = hotp(hmacSha1, SECRET, step + 1);
    expect(verifyTotp(hmacSha1, SECRET, next, now, step)).toEqual({ ok: true, step: step + 1 });
  });

  it('tolerates typed spaces but refuses anything that is not six digits', () => {
    const spaced = `${current.slice(0, 3)} ${current.slice(3)}`;
    expect(verifyTotp(hmacSha1, SECRET, spaced, now, null).ok).toBe(true);
    expect(verifyTotp(hmacSha1, SECRET, '12345', now, null).ok).toBe(false);
    expect(verifyTotp(hmacSha1, SECRET, 'abcdef', now, null).ok).toBe(false);
    expect(verifyTotp(hmacSha1, SECRET, `${current}7`, now, null).ok).toBe(false);
  });

  it('refuses a wrong code', () => {
    const wrong = current === '000000' ? '000001' : '000000';
    expect(verifyTotp(hmacSha1, SECRET, wrong, now, null).ok).toBe(false);
  });
});

describe('otpauth URI', () => {
  it('encodes issuer, account, secret, digits and period', () => {
    const uri = otpauthUri('Veridian Scheduler', 'paul@veridian-partners.com', 'GEZDGNBV');
    expect(uri).toBe(
      'otpauth://totp/Veridian%20Scheduler:paul%40veridian-partners.com?secret=GEZDGNBV&issuer=Veridian+Scheduler&algorithm=SHA1&digits=6&period=30',
    );
  });
});

describe('recovery codes', () => {
  it('formats 10 random bytes as four dashed groups and normalises typing back', () => {
    const code = formatRecoveryCode(new Uint8Array([49, 50, 51, 52, 53, 54, 55, 56, 57, 48]));
    expect(code).toMatch(/^[a-z2-7]{4}-[a-z2-7]{4}-[a-z2-7]{4}-[a-z2-7]{4}$/);
    expect(normaliseRecoveryCode(code.toUpperCase().replace(/-/g, ' '))).toBe(
      code.replace(/-/g, ''),
    );
  });
  it('refuses too few random bytes', () => {
    expect(() => formatRecoveryCode(new Uint8Array(4))).toThrow(/10 random bytes/);
  });
});
