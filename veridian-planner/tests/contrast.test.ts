// Review F-016 / acceptance A35: WCAG 2.2 contrast on the declared token
// pairs, computed from app/tokens.css. Text pairs need 4.5:1, non-text 3.0:1.
// The prohibited pairs are asserted as failing, so nobody promotes them.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../app/tokens.css'),
  'utf8',
);

function token(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${name} not found`);
  return m[1]!.toLowerCase();
}

function luminance(hex: string): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const WHITE = '#ffffff';

describe('A35 text pairs reach 4.5:1', () => {
  const pairs: [string, string][] = [
    ['ink', 'paper'],
    ['ink', 'surface'],
    ['ink', 'ivory'],
    ['muted', 'paper'],
    ['muted', 'surface'],
    ['warning-text', 'paper'],
    ['warning-text', 'surface'],
    ['warning-text', 'warning-bg'],
    ['success', 'paper'],
    ['danger', 'paper'],
    ['info', 'paper'],
  ];
  for (const [fg, bg] of pairs) {
    it(`${fg} on ${bg}`, () => {
      expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
    });
  }
  it('white on pine (buttons, sidebar)', () => {
    expect(ratio(WHITE, token('pine'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(WHITE, token('deep-pine'))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('A35 non-text pairs reach 3.0:1', () => {
  it('input borders on surface', () => {
    expect(ratio(token('border-input'), token('surface'))).toBeGreaterThanOrEqual(3.0);
  });
  it('the sage active bar on deep pine', () => {
    expect(ratio(token('sage'), token('deep-pine'))).toBeGreaterThanOrEqual(3.0);
  });
});

describe('prohibited pairs stay prohibited (documented failures)', () => {
  it('warning is never text on light grounds', () => {
    expect(ratio(token('warning'), token('paper'))).toBeLessThan(4.5);
    expect(ratio(token('warning'), token('surface'))).toBeLessThan(4.5);
  });
  it('sage, sage-light and secondary need strokes or patterns on paper', () => {
    expect(ratio(token('sage'), token('paper'))).toBeLessThan(3.0);
    expect(ratio(token('sage-light'), token('paper'))).toBeLessThan(3.0);
    expect(ratio(token('secondary'), token('paper'))).toBeLessThan(3.0);
  });
  it('hairline is for table dividers, not input borders', () => {
    expect(ratio(token('hairline'), token('surface'))).toBeLessThan(3.0);
  });
  it('muted never sits on secondary', () => {
    expect(ratio(token('muted'), token('secondary'))).toBeLessThan(4.5);
  });
});
