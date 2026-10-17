// Review F-002, F-004, F-006, F-008, F-009, F-010, F-017: the edge cases
// that carry money and dates, previously uncovered by the shipped suite.
import { describe, expect, it } from 'vitest';
import {
  annualCapacity,
  buildForecast,
  cancellationChargeFraction,
  countedValue,
  defaultSettings,
  edate,
  feeFallsInMonth,
  forecastTotals,
  mileageCost,
  monthlyFeeSchedule,
  rechargeAmount,
  toCountedBooking,
  todayIn,
  toSerial,
  ukTaxYearStart,
  validateClientName,
  validateSettings,
  weekStrip,
} from '../core/index.js';

const S = defaultSettings('2026-10-17');

describe('F-002 forecast fees across a mid-month term', () => {
  const zeros: number[] = [];
  const run = (start: string) =>
    forecastTotals(
      buildForecast({
        forecastStart: start,
        clients: [{ status: 'Signed', monthlyFee: 1500, liveFrom: '2026-03-15', liveTo: '2027-03-14' }],
        defaultProbability: 0.5,
        monthlyOverageCharges: zeros,
        monthlyRechargeableExpenses: zeros,
        monthlyClientDays: zeros,
        monthlyCapacityDays: zeros,
      }),
    ).signed;
  it('a 12-month term from 15/03 forecasts exactly 12 fees (£18,000)', () => {
    expect(run('2026-03-01') + run('2027-03-01')).toBe(18000);
  });
  it('T20-style month-start clients keep their months', () => {
    expect(feeFallsInMonth({ liveFrom: '2026-01-01', liveTo: '2026-11-30' }, '2026-11-01')).toBe(true);
    expect(feeFallsInMonth({ liveFrom: '2026-01-01', liveTo: '2026-11-30' }, '2026-12-01')).toBe(false);
    expect(feeFallsInMonth({ liveFrom: '2027-03-01', liveTo: null }, '2027-02-01')).toBe(false);
    expect(feeFallsInMonth({ liveFrom: '2027-03-01', liveTo: null }, '2027-03-01')).toBe(true);
  });
  it('a 31/01 start bills every month, including February', () => {
    let n = 0;
    for (let m = 0; m < 12; m++) {
      if (feeFallsInMonth({ liveFrom: '2027-01-31', liveTo: '2028-01-30' }, edate('2027-01-01', m))) n++;
    }
    expect(n).toBe(12);
  });
});

describe('F-006 chargeFraction can never default', () => {
  it('a late cancellation without an explicit fraction throws', () => {
    expect(() => countedValue({ date: '2027-02-10', value: 1, state: 'cancelled_late' })).toThrow();
  });
  it('toCountedBooking carries the tier fraction', () => {
    expect(
      toCountedBooking({ date: '2026-12-09', allocation: 'A', cancelledOn: '2026-11-01' }, '2026-12-15'),
    ).toEqual({ date: '2026-12-09', value: 1, state: 'cancelled_late', chargeFraction: 0.75 });
    expect(
      toCountedBooking({ date: '2026-12-09', allocation: 'A', deliveredConfirmed: true }, '2026-12-15')
        .chargeFraction,
    ).toBeUndefined();
  });
});

describe('F-004 / F-008 user dates', () => {
  it('Sydney is a day ahead of London at 21:30 UTC', () => {
    const now = new Date('2026-10-18T21:30:00Z');
    expect(todayIn('Australia/Sydney', now)).toBe('2026-10-19');
    expect(todayIn('Europe/London', now)).toBe('2026-10-18');
  });
  it('London BST: 00:30 local on 25/10/2026 is still 25/10', () => {
    expect(todayIn('Europe/London', new Date('2026-10-24T23:30:00Z'))).toBe('2026-10-25');
  });
  it('the UK tax year starts 6 April', () => {
    expect(ukTaxYearStart('2027-04-05')).toBe('2026-04-06');
    expect(ukTaxYearStart('2027-04-06')).toBe('2027-04-06');
  });
  it('a back-dated trip recomputed in date order equals one continuous claim', () => {
    // Trips of 6,000 then 3,950 miles, then a back-dated 100-mile trip that
    // comes first in date order: walking the ledger afresh matches
    // mileageCost(10050, 0) in total, and the crossing lands mid-trip.
    const mileage = { high: 0.45, low: 0.25, thresholdMiles: 10000 };
    const orderedMiles = [100, 6000, 3950];
    let running = 0;
    let total = 0;
    for (const miles of orderedMiles) {
      total += mileageCost(miles, running, mileage);
      running += miles;
    }
    expect(total).toBeCloseTo(mileageCost(10050, 0, mileage), 10);
    expect(mileageCost(3950, 6100, mileage)).toBeCloseTo(3900 * 0.45 + 50 * 0.25, 10);
  });
});

describe('F-009 reserved client names', () => {
  it('rejects every reserved variant, keeps real names', () => {
    for (const n of ['Leave', 'detent', 'Admin / BD', 'Other', 'Bank holiday', 'Admin  / BD', 'Admin-BD', 'Leave​', 'Leаve']) {
      expect(validateClientName(n).ok).toBe(false);
    }
    for (const n of ['Acme Software', 'Leaver Ltd', 'Othello Partners', 'Café Détente']) {
      expect(validateClientName(n).ok).toBe(true);
    }
  });
});

describe('F-010 money and input validation', () => {
  it('an impossible date is rejected, not rolled forward', () => {
    expect(() => toSerial('2026-02-30')).toThrow();
  });
  it('a charge fraction above 1 is rejected', () => {
    expect(() =>
      cancellationChargeFraction('2026-12-09', '2026-12-08', [{ minNoticeDays: 0, chargeFraction: 3 }]),
    ).toThrow();
  });
  it('10% markup on £200 is exactly £220.00', () => {
    expect(rechargeAmount(200, true, 0.1)).toBe(220);
  });
  it('twelve rounded monthly fees sum to exactly the annual fee', () => {
    const fees = monthlyFeeSchedule(128800);
    expect(fees).toHaveLength(12);
    expect(Math.round(fees.reduce((a, f) => a + f * 100, 0))).toBe(12880000);
    expect(fees[0]).toBe(10733.33);
  });
  it('validateSettings rejects a bad tier and bad rates', () => {
    const bad = {
      ...S,
      cancellationTiers: [{ minNoticeDays: 0, chargeFraction: 3 }],
    };
    expect(validateSettings(bad).length).toBeGreaterThan(0);
    expect(validateSettings({ ...S, rates: { ...S.rates, dayRate: -1 } }).length).toBeGreaterThan(0);
    expect(validateSettings(S)).toEqual([]);
  });
});

describe('F-017 capacity cascade and the scenario week strip', () => {
  it('Detent 1 and Other 1 day a week, leave 30, 8 bank holidays', () => {
    const cap = annualCapacity({
      veridianPerWeek: 3,
      detentPerWeek: 1,
      otherPerWeek: 1,
      leaveDays: 30,
      bankHolidays: 8,
    });
    expect(cap.detent).toBe(52 - 6 - 8); // absorbs min(8, 46)
    expect(cap.other).toBe(46);
    expect(cap.veridian).toBe(138);
  });
  it('A22: a weekly scenario client makes two 2.5-day weeks Overbooked', () => {
    const week = { workingDays: 5, leave: 0, detent: 0, adminBd: 0, other: 0, clientDays: 2.5 };
    expect(weekStrip([week, week], [1, 1], 3)).toEqual(['Overbooked', 'Overbooked']);
  });
});
