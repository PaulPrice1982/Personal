// Review F-003 / F-005: overage priced booking by booking, on the allowance
// or billable basis. Every overage line equals a rate on the card, or a
// stated percentage of one.
import { describe, expect, it } from 'vitest';
import {
  defaultSettings,
  eomonth,
  monthlyOverage,
  overageWalk,
  type CountedBooking,
} from '../core/index.js';

const S = defaultSettings('2026-10-17');
const jan12 = (): CountedBooking[] =>
  Array.from({ length: 12 }, (_, i) => ({
    date: `2027-01-${String(i + 1).padStart(2, '0')}`,
    value: 1,
    state: 'delivered' as const,
  }));
const TERM = ['2027-01-01', '2027-12-31'] as const;

describe('F-003 booking-by-booking pricing', () => {
  it('two half days over allowance, Feb and Mar: £1,050 each', () => {
    const b = [
      ...jan12(),
      { date: '2027-02-03', value: 0.5, state: 'delivered' as const },
      { date: '2027-03-03', value: 0.5, state: 'delivered' as const },
    ];
    const rows = monthlyOverage(b, 12, S.rates, ...TERM, ['2027-01-31', '2027-02-28', '2027-03-31']);
    expect(rows.map((r) => r.monthlyCharge)).toEqual([0, 1050, 1050]);
  });
  it('a full day cancelled at 75% over allowance: 75% of £1,750 = £1,312.50', () => {
    const b = [...jan12(), { date: '2027-02-10', value: 1, state: 'cancelled_late' as const, chargeFraction: 0.75 }];
    expect(monthlyOverage(b, 12, S.rates, ...TERM, ['2027-02-28'])[0]!.monthlyCharge).toBe(1312.5);
  });
  it('the same day at the 50% tier: £875', () => {
    const b = [...jan12(), { date: '2027-02-10', value: 1, state: 'cancelled_late' as const, chargeFraction: 0.5 }];
    expect(monthlyOverage(b, 12, S.rates, ...TERM, ['2027-02-28'])[0]!.monthlyCharge).toBe(875);
  });
  it('11.5 days used, then a full day: the straddling half costs £1,050 (A06)', () => {
    const b = [
      ...jan12().slice(0, 11),
      { date: '2027-01-20', value: 0.5, state: 'delivered' as const },
      { date: '2027-01-21', value: 1, state: 'delivered' as const },
    ];
    expect(monthlyOverage(b, 12, S.rates, ...TERM, ['2027-01-31'])[0]!.monthlyCharge).toBe(1050);
  });
  it('T21 unchanged: Jan £0, Feb £5,250, Mar £1,050, total £6,300', () => {
    const b: CountedBooking[] = [];
    for (let d = 1; d <= 12; d++) b.push({ date: `2027-01-${String(d).padStart(2, '0')}`, value: 1, state: 'planned' });
    for (let d = 1; d <= 3; d++) b.push({ date: `2027-02-0${d}`, value: 1, state: 'planned' });
    b.push({ date: '2027-03-01', value: 0.5, state: 'planned' });
    const rows = monthlyOverage(b, 12, S.rates, ...TERM, ['2027-01-31', '2027-02-28', '2027-03-31']);
    expect(rows.map((r) => r.monthlyCharge)).toEqual([0, 5250, 1050]);
    expect(rows[2]!.cumulativeCharge).toBe(6300);
  });
  it('every walk row carries the booking, its over portion and its charge', () => {
    const b = [...jan12(), { date: '2027-02-01', value: 1, state: 'delivered' as const }];
    const walk = overageWalk(b, 12, S.rates, ...TERM);
    expect(walk).toHaveLength(13);
    expect(walk[11]!.over).toBe(0);
    expect(walk[12]!.over).toBe(1);
    expect(walk[12]!.charge).toBe(1750);
  });
});

describe('F-005 billable basis for billing', () => {
  it('12 used, then 1 delivered and 1 planned: allowance £3,500, billable £1,750', () => {
    const b: CountedBooking[] = [
      ...jan12(),
      { date: '2027-02-01', value: 1, state: 'delivered' },
      { date: '2027-02-02', value: 1, state: 'planned' },
    ];
    expect(monthlyOverage(b, 12, S.rates, ...TERM, ['2027-02-28'], 'allowance')[0]!.cumulativeCharge).toBe(3500);
    expect(monthlyOverage(b, 12, S.rates, ...TERM, ['2027-02-28'], 'billable')[0]!.cumulativeCharge).toBe(1750);
  });
  it('planned and unconfirmed days are never billed as overage', () => {
    const b: CountedBooking[] = [
      ...jan12(),
      { date: '2027-02-10', value: 1, state: 'planned' },
      { date: '2027-02-11', value: 1, state: 'unconfirmed' },
    ];
    expect(monthlyOverage(b, 12, S.rates, ...TERM, ['2027-02-28'], 'billable')[0]!.monthlyCharge).toBe(0);
  });
});

describe('months add up to the term total', () => {
  it('summed monthly charges equal the final cumulative charge', () => {
    const b = [
      ...jan12(),
      { date: '2027-02-03', value: 1, state: 'delivered' as const },
      { date: '2027-05-03', value: 0.5, state: 'delivered' as const },
    ];
    const ends = Array.from({ length: 12 }, (_, m) => eomonth('2027-01-01', m));
    const rows = monthlyOverage(b, 12, S.rates, ...TERM, ends);
    expect(rows.reduce((a, r) => a + r.monthlyCharge, 0)).toBe(rows[11]!.cumulativeCharge);
    expect(rows[11]!.cumulativeCharge).toBe(2800);
  });
});
