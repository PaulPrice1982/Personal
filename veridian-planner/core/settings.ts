import type { ISODate } from './dates.js';

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
  lateCancellationWorkingDays: number; // default 2
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
    lateCancellationWorkingDays: 2,
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
const RESERVED = new Set(['leave', 'detent', 'admin / bd', 'admin/bd', 'other']);

export function validateClientName(name: string): { ok: boolean; reason?: string } {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, reason: 'Client name is required' };
  if (RESERVED.has(trimmed.toLowerCase())) {
    return { ok: false, reason: `"${trimmed}" is a reserved allocation name` };
  }
  return { ok: true };
}
