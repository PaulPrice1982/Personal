import type { ISODate } from './dates.js';
import { DEFAULT_CANCELLATION_TIERS, type CancellationTier } from './bookings.js';

// Per-user rates. Rates are effective-dated in the data model; the core takes
// the already-resolved values for the period being computed. Contracts keep
// the rate they were signed at (resolved by the caller).
export interface Rates {
  currency: string;          // 'GBP', 'AUD', ...
  dayRate: number;           // retainer day rate
  halfDayRate: number;       // retainer half day rate
  additionalDayRate: number; // days above allowance
  additionalHalfDayRate: number; // half days above allowance (also a trailing half)
}

export interface CapacitySettings {
  veridianPerWeek: number;
  detentPerWeek: number;
  otherPerWeek: number;
  leaveDays: number;      // annual leave on a 5-day-week basis, shared pro rata
  bankHolidays: number;   // count in the planning year (absorbed Detent, then Other, then Veridian)
}

export interface Thresholds {
  amber: number; // Thin: selective only (utilisation >= amber)
  red: number;   // STOP: no new clients (utilisation >= red)
}

export const DEFAULT_THRESHOLDS: Thresholds = { amber: 0.8, red: 0.95 };

export const PAUL_DEFAULT_RATES: Rates = {
  currency: 'GBP',
  dayRate: 1500,
  halfDayRate: 900,
  additionalDayRate: 1750,
  additionalHalfDayRate: 1050,
};

export interface PlannerSettings {
  rates: Rates;
  capacity: CapacitySettings;
  thresholds: Thresholds;
  noticeDays: number;              // before renewal (default 90)
  termMonths: number;              // contract term (default 12, auto-renews)
  // Client cancellation charges by written notice (consultancy agreement
  // schedule 1 section 8.4): under 14 days 100%, 14-44 75%, 45-89 50%,
  // 90 or more free.
  cancellationTiers: readonly CancellationTier[];
  defaultWinProbability: number;   // pencilled with no probability (default 0.5)
  expenseMarkup: number;           // recharge = net * (1 + markup)
  mileageRateHigh: number;         // 45p up to the threshold
  mileageRateLow: number;          // 25p after
  mileageThresholdMiles: number;   // 10,000 per tax year
  receiptRequiredOver: number;     // receipts required for expenses over this (net)
  asAt: ISODate;
}

export function defaultSettings(asAt: ISODate): PlannerSettings {
  return {
    rates: PAUL_DEFAULT_RATES,
    capacity: {
      veridianPerWeek: 3,
      detentPerWeek: 2,
      otherPerWeek: 0,
      leaveDays: 30,
      bankHolidays: 8,
    },
    thresholds: DEFAULT_THRESHOLDS,
    noticeDays: 90,
    termMonths: 12,
    cancellationTiers: DEFAULT_CANCELLATION_TIERS,
    defaultWinProbability: 0.5,
    expenseMarkup: 0,
    mileageRateHigh: 0.45,
    mileageRateLow: 0.25,
    mileageThresholdMiles: 10000,
    receiptRequiredOver: 25,
    asAt,
  };
}

// Reserved allocation names: a client may not take these (test T17).
// Review F-009: the check survives spacing, punctuation, invisible characters
// and mixed-script look-alikes, and includes "Bank holiday".
const RESERVED_KEYS = new Set(['leave', 'detent', 'adminbd', 'other', 'bankholiday']);

export function validateClientName(name: string): { ok: boolean; reason?: string } {
  const cleaned = name.normalize('NFKC').replace(/\p{Cf}/gu, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return { ok: false, reason: 'Client name is required' };
  if (/\p{Script=Latin}/u.test(cleaned) && /[\p{Script=Cyrillic}\p{Script=Greek}]/u.test(cleaned)) {
    return { ok: false, reason: 'Client name mixes alphabets. Retype it using one alphabet.' };
  }
  const key = cleaned.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  if (RESERVED_KEYS.has(key)) {
    return { ok: false, reason: `"${cleaned}" is a reserved allocation name` };
  }
  return { ok: true };
}

// Review F-010: a mistyped or tampered setting must be rejected at save time,
// never accepted silently. Returns one message per problem; empty means valid.
export function validateSettings(s: PlannerSettings): string[] {
  const messages: string[] = [];
  const rates = [
    ['Day rate', s.rates.dayRate],
    ['Half day rate', s.rates.halfDayRate],
    ['Additional day rate', s.rates.additionalDayRate],
    ['Additional half day rate', s.rates.additionalHalfDayRate],
  ] as const;
  for (const [label, value] of rates) {
    if (value < 0 || value > 100000) messages.push(`${label} must be between 0 and 100,000`);
  }
  const { veridianPerWeek, detentPerWeek, otherPerWeek, leaveDays } = s.capacity;
  if (veridianPerWeek < 0 || detentPerWeek < 0 || otherPerWeek < 0) {
    messages.push('Days per week cannot be negative');
  }
  if (veridianPerWeek + detentPerWeek + otherPerWeek > 5) {
    messages.push('Days per week across the businesses cannot exceed 5');
  }
  if (leaveDays < 0 || leaveDays > 260) messages.push('Leave days must be between 0 and 260');
  const { amber, red } = s.thresholds;
  if (amber < 0 || amber > 1 || red < 0 || red > 1 || amber >= red) {
    messages.push('Thresholds must be between 0 and 1, with amber below red');
  }
  let hasZeroTier = false;
  for (const tier of s.cancellationTiers) {
    if (tier.chargeFraction < 0 || tier.chargeFraction > 1) {
      messages.push('A cancellation charge must be between 0% and 100%');
    }
    if (tier.minNoticeDays < 0) messages.push('Cancellation notice days cannot be negative');
    if (tier.minNoticeDays === 0) hasZeroTier = true;
  }
  if (!hasZeroTier) messages.push('Cancellation tiers must include a tier from 0 days notice');
  if (s.expenseMarkup < 0 || s.expenseMarkup > 1) {
    messages.push('Expense markup must be between 0% and 100%');
  }
  return messages;
}
