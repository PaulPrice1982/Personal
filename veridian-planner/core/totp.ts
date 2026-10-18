// TOTP (RFC 6238) for authenticator apps such as Microsoft Authenticator,
// replacing the emailed six-digit login code. The core stays dependency-free:
// the HMAC-SHA1 primitive is injected (the app passes node:crypto's
// createHmac; the tests do the same), and the RFC 4226/6238 test vectors pin
// the maths. The app remains responsible for rate limiting code attempts,
// encrypting the stored secret at rest and persisting the last accepted step
// per user so a code can never be replayed.

export type HmacSha1 = (key: Uint8Array, message: Uint8Array) => Uint8Array;

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(bytes: Uint8Array): string {
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(buffer << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Uint8Array {
  const cleaned = s.toUpperCase().replace(/[\s=]/g, '');
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of cleaned) {
    const v = BASE32_ALPHABET.indexOf(ch);
    if (v === -1) throw new Error(`Invalid base32 character: ${ch}`);
    buffer = (buffer << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

// RFC 4226 HOTP: 8-byte big-endian counter, HMAC-SHA1, dynamic truncation.
export function hotp(hmac: HmacSha1, secret: Uint8Array, counter: number, digits = 6): string {
  if (!Number.isInteger(counter) || counter < 0) {
    throw new Error(`Invalid HOTP counter: ${counter}`);
  }
  const message = new Uint8Array(8);
  let high = Math.floor(counter / 2 ** 32);
  let low = counter >>> 0;
  for (let i = 7; i >= 4; i--) {
    message[i] = low & 255;
    low = Math.floor(low / 256);
  }
  for (let i = 3; i >= 0; i--) {
    message[i] = high & 255;
    high = Math.floor(high / 256);
  }
  const digest = hmac(secret, message);
  const offset = (digest[digest.length - 1] as number) & 0x0f;
  const binCode =
    (((digest[offset] as number) & 0x7f) << 24) |
    (((digest[offset + 1] as number) & 0xff) << 16) |
    (((digest[offset + 2] as number) & 0xff) << 8) |
    ((digest[offset + 3] as number) & 0xff);
  return String(binCode % 10 ** digits).padStart(digits, '0');
}

export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;

export function totpStep(unixMillis: number, stepSeconds = TOTP_STEP_SECONDS): number {
  return Math.floor(unixMillis / 1000 / stepSeconds);
}

export function totpCode(
  hmac: HmacSha1,
  secret: Uint8Array,
  unixMillis: number,
  digits = TOTP_DIGITS,
  stepSeconds = TOTP_STEP_SECONDS,
): string {
  return hotp(hmac, secret, totpStep(unixMillis, stepSeconds), digits);
}

export interface TotpVerification {
  ok: boolean;
  // The step the code matched, to persist as the user's last accepted step.
  step?: number;
}

function constantTimeDigitsEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Accept the current step and one step either side (clock skew), never a step
// at or before the last accepted one (replay). Codes arrive as the user typed
// them, so spaces are tolerated; anything that is not exactly `digits` digits
// is refused without touching the secret.
export function verifyTotp(
  hmac: HmacSha1,
  secret: Uint8Array,
  code: string,
  unixMillis: number,
  lastUsedStep: number | null,
  digits = TOTP_DIGITS,
  stepSeconds = TOTP_STEP_SECONDS,
): TotpVerification {
  const typed = code.replace(/\s+/g, '');
  if (!new RegExp(`^\\d{${digits}}$`).test(typed)) return { ok: false };
  const current = totpStep(unixMillis, stepSeconds);
  for (const step of [current, current - 1, current + 1]) {
    if (step < 0) continue;
    if (lastUsedStep !== null && step <= lastUsedStep) continue;
    if (constantTimeDigitsEqual(hotp(hmac, secret, step, digits), typed)) {
      return { ok: true, step };
    }
  }
  return { ok: false };
}

// The otpauth:// URI encoded into the enrolment QR code. Microsoft
// Authenticator (and every RFC-compliant app) reads issuer, account, secret,
// digits and period from it.
export function otpauthUri(
  issuer: string,
  account: string,
  secretBase32: string,
  digits = TOTP_DIGITS,
  periodSeconds = TOTP_STEP_SECONDS,
): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: String(digits),
    period: String(periodSeconds),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

// Recovery codes guard against a lost phone: ten single-use codes shown once
// at enrolment, stored hashed. Formatting only; the app supplies the random
// bytes and the hashing.
export function formatRecoveryCode(bytes: Uint8Array): string {
  if (bytes.length < 10) throw new Error('Recovery code needs at least 10 random bytes');
  const raw = base32Encode(bytes.slice(0, 10)).toLowerCase(); // 16 characters
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

export function normaliseRecoveryCode(typed: string): string {
  return typed.toLowerCase().replace(/[\s-]/g, '');
}
