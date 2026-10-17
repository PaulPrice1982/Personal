import type { Rates } from './settings.js';

// Retainer packages (spec section 5; spreadsheet Lists + Retainer Calculator).
// Units per year are derived from working weeks = 52 - leaveDays / 5.

export type Frequency =
  | '1 day a week'
  | '2 days a week'
  | '1 day a fortnight'
  | '1 day a month'
  | '1 day every 6 weeks'
  | 'Half day a month';

export type UnitType = 'Day' | 'Half day';

export const FREQUENCIES: readonly Frequency[] = [
  '1 day a week',
  '2 days a week',
  '1 day a fortnight',
  '1 day a month',
  '1 day every 6 weeks',
  'Half day a month',
];

export function workingWeeks(leaveDays: number): number {
  return 52 - leaveDays / 5;
}

export function unitsPerYear(freq: Frequency, workingWks: number): number {
  switch (freq) {
    case '1 day a week':
      return workingWks;
    case '2 days a week':
      return workingWks * 2;
    case '1 day a fortnight':
      return Math.round(workingWks / 2);
    case '1 day a month':
      return 12;
    case '1 day every 6 weeks':
      return Math.round(workingWks / 6);
    case 'Half day a month':
      return 12;
  }
}

export function unitType(freq: Frequency): UnitType {
  return freq === 'Half day a month' ? 'Half day' : 'Day';
}

export interface PackagePricing {
  frequency: Frequency;
  unitsPerYear: number;
  unitType: UnitType;
  allowanceDays: number;
  annualFee: number;
  monthlyFee: number;
}

export function pricePackage(freq: Frequency, rates: Rates, workingWks: number): PackagePricing {
  const units = unitsPerYear(freq, workingWks);
  const ut = unitType(freq);
  const allowanceDays = ut === 'Half day' ? units * 0.5 : units;
  const annualFee = ut === 'Half day' ? units * rates.halfDayRate : units * rates.dayRate;
  return {
    frequency: freq,
    unitsPerYear: units,
    unitType: ut,
    allowanceDays,
    annualFee,
    monthlyFee: annualFee / 12,
  };
}
