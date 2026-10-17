// Section 23.1: the 27 scenarios verified in the Veridian Retainer Model
// spreadsheet (106 checks, all passing there). These tests pin the domain
// core to the same numbers.
import { describe, expect, it } from 'vitest';
import {
  annualCapacity,
  buildForecast,
  buildStatement,
  capacityStatus,
  clientAlert,
  contractStatus,
  countsAgainstCapacity,
  dayValue,
  defaultSettings,
  deliveryState,
  forecastTotals,
  monthlyOverage,
  netCost,
  overageCharge,
  overageDays,
  pricePackage,
  rechargeAmount,
  revenueAtFullCapacity,
  runScenario,
  summariseWeek,
  termPosition,
  termUsage,
  validateClientName,
  weeklyVeridianCapacity,
  weekStatus,
  workingWeeks,
  type CountedBooking,
  type ForecastClient,
} from '../core/index.js';

const S = defaultSettings('2026-10-17');
const WW = workingWeeks(30); // 46

describe('T01 baseline capacity', () => {
  const cap = annualCapacity(S.capacity);
  it('Veridian 138, Detent 84', () => {
    expect(cap.veridian).toBe(138);
    expect(cap.detent).toBe(84);
  });
  it('£207,000 at full capacity', () => {
    expect(revenueAtFullCapacity(cap.veridian, S.rates.dayRate)).toBe(207000);
  });
});

describe('T02 price every package', () => {
  const p = (f: Parameters<typeof pricePackage>[0]) => pricePackage(f, S.rates, WW);
  it('1 day a week: 46 days £69,000 (£5,750/m)', () => {
    const r = p('1 day a week');
    expect(r.allowanceDays).toBe(46);
    expect(r.annualFee).toBe(69000);
    expect(r.monthlyFee).toBe(5750);
  });
  it('2 days a week: 92 £138,000 (£11,500)', () => {
    const r = p('2 days a week');
    expect(r.allowanceDays).toBe(92);
    expect(r.annualFee).toBe(138000);
    expect(r.monthlyFee).toBe(11500);
  });
  it('1 day a fortnight: 23 £34,500 (£2,875)', () => {
    const r = p('1 day a fortnight');
    expect(r.allowanceDays).toBe(23);
    expect(r.annualFee).toBe(34500);
    expect(r.monthlyFee).toBe(2875);
  });
  it('1 day a month: 12 £18,000 (£1,500)', () => {
    const r = p('1 day a month');
    expect(r.allowanceDays).toBe(12);
    expect(r.annualFee).toBe(18000);
    expect(r.monthlyFee).toBe(1500);
  });
  it('1 day every 6 weeks: 8 £12,000 (£1,000)', () => {
    const r = p('1 day every 6 weeks');
    expect(r.allowanceDays).toBe(8);
    expect(r.annualFee).toBe(12000);
    expect(r.monthlyFee).toBe(1000);
  });
  it('half day a month: 6 days £10,800 (£900)', () => {
    const r = p('Half day a month');
    expect(r.allowanceDays).toBe(6);
    expect(r.annualFee).toBe(10800);
    expect(r.monthlyFee).toBe(900);
  });
});

describe('T03 leave booking', () => {
  it('5 days and one half day of leave: booked 5.5, remaining 24.5', () => {
    const booked =
      5 * dayValue({ allocation: 'Leave' }) + dayValue({ allocation: 'Leave', halfDay: true });
    expect(booked).toBe(5.5);
    expect(30 - booked).toBe(24.5);
  });
});

describe('T04 half-day client booking in a week with half a day of leave', () => {
  it('client days 0.5; unallocated 4.0', () => {
    const w = summariseWeek(
      { workingDays: 5, leave: 0.5, detent: 0, adminBd: 0, other: 0, clientDays: 0.5 },
      3,
    );
    expect(w.clientDays).toBe(0.5);
    expect(w.unallocated).toBe(4);
  });
});

describe('T05 / T07 week statuses', () => {
  it('4 client days in a week: Overbooked', () => {
    expect(weekStatus(4, 3)).toBe('Overbooked');
  });
  it('week fully on leave: Off', () => {
    expect(weeklyVeridianCapacity(5, 5, 3)).toBe(0);
    expect(weekStatus(0, 0)).toBe('Off');
  });
});

describe('T06 Christmas week with a Detent day', () => {
  it('working days 3; Veridian capacity 3; Detent 1', () => {
    const w = summariseWeek(
      { workingDays: 3, leave: 0, detent: 1, adminBd: 0, other: 0, clientDays: 0 },
      3,
    );
    expect(w.workingDays).toBe(3);
    expect(w.veridianCapacity).toBe(3);
    expect(w.detent).toBe(1);
  });
});

describe('T08 monthly client with 15.5 days', () => {
  it('overage 3.5; £6,300; Over allowance', () => {
    const over = overageDays(15.5, 12);
    expect(over).toBe(3.5);
    expect(overageCharge(over, S.rates)).toBe(6300);
    expect(
      clientAlert({
        overageDays: over,
        unconfirmedPastDays: 0,
        allowanceDays: 12,
        remainingDays: 12 - 15.5,
        asAt: S.asAt,
      }),
    ).toBe('Over allowance');
  });
});

describe('T09 start 01/11/2026, notice 01/06/2027', () => {
  const pos = termPosition('2026-11-01', S.asAt);
  it('term end 31/10/2027; renewal 01/11/2027; deadline 03/08/2027', () => {
    expect(pos.currentTermEnd).toBe('2027-10-31');
    expect(pos.renewalDate).toBe('2027-11-01');
    expect(pos.noticeDeadline).toBe('2027-08-03');
  });
  it('"Ends 31/10/2027"', () => {
    expect(contractStatus(pos, '2027-06-01').label).toBe('Ends 31/10/2027');
  });
});

describe('T10 start 01/03/2025, as at 17/10/2026, notice 15/12/2026', () => {
  const pos = termPosition('2025-03-01', '2026-10-17');
  it('term 01/03/2026 to 28/02/2027; deadline 01/12/2026', () => {
    expect(pos.currentTermStart).toBe('2026-03-01');
    expect(pos.currentTermEnd).toBe('2027-02-28');
    expect(pos.noticeDeadline).toBe('2026-12-01');
  });
  it('late notice, renews 01/03/2027', () => {
    const st = contractStatus(pos, '2026-12-15');
    expect(st.kind).toBe('late_notice');
    expect(st.label).toBe('Late notice: renews 01/03/2027');
  });
});

describe('T11 / T12 client alerts', () => {
  it('term ending in 14 days, nothing used: Unused days at risk', () => {
    expect(
      clientAlert({
        overageDays: 0,
        unconfirmedPastDays: 0,
        allowanceDays: 12,
        remainingDays: 12,
        asAt: '2026-10-17',
        currentTermEnd: '2026-10-31',
        noticeDeadline: '2026-08-03',
      }),
    ).toBe('Unused days at risk');
  });
  it('11 of 12 days used: Nearly used', () => {
    expect(
      clientAlert({
        overageDays: 0,
        unconfirmedPastDays: 0,
        allowanceDays: 12,
        remainingDays: 1,
        asAt: '2026-10-17',
        currentTermEnd: '2027-06-30',
        noticeDeadline: '2027-04-01',
      }),
    ).toBe('Nearly used');
  });
});

describe('T13 / T14 dashboard utilisation', () => {
  it('162 of 138 signed: 117%, STOP, -24 days to sell', () => {
    const u = 162 / 138;
    expect(Math.round(u * 100)).toBe(117);
    expect(capacityStatus(u, S.thresholds)).toBe('STOP: no new clients');
    expect(138 - 162).toBe(-24);
  });
  it('116 signed, 23 pencilled: Thin now; STOP if pencilled signs', () => {
    expect(capacityStatus(116 / 138, S.thresholds)).toBe('Thin: selective only');
    expect(capacityStatus((116 + 23) / 138, S.thresholds)).toBe('STOP: no new clients');
  });
});

describe('T15 / T16 capacity variants', () => {
  it('leave 25: Veridian 141; weekly package 47 days', () => {
    expect(annualCapacity({ ...S.capacity, leaveDays: 25 }).veridian).toBe(141);
    expect(pricePackage('1 day a week', S.rates, workingWeeks(25)).allowanceDays).toBe(47);
  });
  it('2 Veridian / 3 Detent: Veridian 92; Detent 130', () => {
    const cap = annualCapacity({ ...S.capacity, veridianPerWeek: 2, detentPerWeek: 3 });
    expect(cap.veridian).toBe(92);
    expect(cap.detent).toBe(130);
  });
});

describe('T17 reserved names', () => {
  it('client named "Leave" rejected', () => {
    expect(validateClientName('Leave').ok).toBe(false);
    expect(validateClientName('detent').ok).toBe(false);
    expect(validateClientName('Admin / BD').ok).toBe(false);
    expect(validateClientName('Other').ok).toBe(false);
    expect(validateClientName('Acme Software').ok).toBe(true);
  });
});

describe('T18 delivery counting as at 15/12/2026', () => {
  const asAt = '2026-12-15';
  const mk = (date: string, opts: Partial<Parameters<typeof deliveryState>[0]> = {}) => {
    const b = { date, allocation: 'Client A', ...opts };
    return { date, value: dayValue(b), state: deliveryState(b, asAt) };
  };
  const bookings: CountedBooking[] = [
    mk('2026-12-07', { deliveredConfirmed: true }),
    mk('2026-12-08', { deliveredConfirmed: true }),
    mk('2026-12-09', { cancelledOn: '2026-09-01' }), // 99 days notice: no charge
    mk('2026-12-10', {}), // past, unconfirmed
    mk('2026-12-21', {}), // future, planned
  ];
  const usage = termUsage(bookings, null, null);
  it('counted 4; delivered 2; cancelled 1; unconfirmed 1', () => {
    expect(usage.booked).toBe(4);
    expect(usage.delivered).toBe(2);
    expect(usage.cancelled).toBe(1);
    expect(usage.unconfirmedPast).toBe(1);
  });
  it('alert "Confirm past days"', () => {
    expect(
      clientAlert({
        overageDays: 0,
        unconfirmedPastDays: usage.unconfirmedPast,
        allowanceDays: 46,
        remainingDays: 42,
        asAt,
      }),
    ).toBe('Confirm past days');
  });
  it('cancelled day frees the week (3 client days that week)', () => {
    const week = bookings.filter((b) => b.date >= '2026-12-07' && b.date <= '2026-12-13');
    const clientDays = week
      .filter((b) => countsAgainstCapacity(b.state))
      .reduce((a, b) => a + b.value, 0);
    expect(clientDays).toBe(3);
  });
});

describe('T19 forecast vs billable overage', () => {
  it('monthly client, 14 booked, 13 delivered: forecast £3,500; billable £1,750', () => {
    expect(overageCharge(overageDays(14, 12), S.rates)).toBe(3500);
    expect(overageCharge(overageDays(13, 12), S.rates)).toBe(1750);
  });
});

describe('T20 twelve-month forecast', () => {
  const clients: ForecastClient[] = [
    { status: 'Signed', monthlyFee: 5750, liveFrom: '2026-11-01', liveTo: null }, // weekly
    { status: 'Signed', monthlyFee: 1500, liveFrom: '2026-11-01', liveTo: null }, // monthly ongoing
    { status: 'Signed', monthlyFee: 1500, liveFrom: '2027-03-01', liveTo: null }, // starts March
    { status: 'Signed', monthlyFee: 1500, liveFrom: '2026-01-01', liveTo: '2026-11-30' }, // ends on time in Nov
    { status: 'Pencilled', monthlyFee: 1500, liveFrom: '2026-11-01', liveTo: null }, // no probability
  ];
  const zeros = Array(12).fill(0) as number[];
  const rows = buildForecast({
    forecastStart: '2026-11-01',
    clients,
    defaultProbability: 0.5,
    monthlyOverageCharges: zeros,
    monthlyRechargeableExpenses: zeros,
    monthlyClientDays: zeros,
    monthlyCapacityDays: zeros,
  });
  const totals = forecastTotals(rows);
  it('Nov £8,750, Dec £7,250, Mar £8,750 signed', () => {
    expect(rows[0]!.signed).toBe(8750);
    expect(rows[1]!.signed).toBe(7250);
    expect(rows[4]!.signed).toBe(8750);
  });
  it('12 months £100,500 signed; pencilled £18,000, weighted £9,000', () => {
    expect(totals.signed).toBe(100500);
    expect(totals.pencilled).toBe(18000);
    expect(totals.pencilledWeighted).toBe(9000);
  });
});

describe('T21 overage spread by month', () => {
  // Monthly client (allowance 12): 12 days in Jan, 3 in Feb, half in Mar.
  const bookings: CountedBooking[] = [];
  for (let d = 1; d <= 12; d++)
    bookings.push({ date: `2027-01-${String(d).padStart(2, '0')}`, value: 1, state: 'planned' });
  for (let d = 1; d <= 3; d++)
    bookings.push({ date: `2027-02-0${d}`, value: 1, state: 'planned' });
  bookings.push({ date: '2027-03-01', value: 0.5, state: 'planned' });

  const rows = monthlyOverage(
    bookings,
    12,
    S.rates,
    '2027-01-01',
    '2027-12-31',
    ['2027-01-31', '2027-02-28', '2027-03-31'],
  );
  it('Jan £0, Feb £5,250, Mar £1,050; total equals calculator £6,300', () => {
    expect(rows.map((r) => r.monthlyCharge)).toEqual([0, 5250, 1050]);
    expect(rows[2]!.cumulativeCharge).toBe(6300);
    expect(rows.reduce((a, r) => a + r.monthlyCharge, 0)).toBe(6300);
  });
  it('12 client days in Jan', () => {
    expect(
      bookings.filter((b) => b.date <= '2027-01-31').reduce((a, b) => a + b.value, 0),
    ).toBe(12);
  });
});

describe('T22 expenses', () => {
  const mileage = { high: 0.45, low: 0.25, thresholdMiles: 10000 };
  const travel = netCost(
    { category: 'Travel', amountExVat: 200, rechargeable: true },
    mileage,
  );
  const miles = netCost(
    { category: 'Mileage', miles: 100, milesAlreadyThisTaxYear: 0, rechargeable: true },
    mileage,
  );
  const other = netCost(
    { category: 'Other', amountExVat: 150, rechargeable: false },
    mileage,
  );
  it('Jan recharge £245 at cost', () => {
    const total =
      rechargeAmount(travel, true, 0) + rechargeAmount(miles, true, 0) + rechargeAmount(other, false, 0);
    expect(total).toBe(245);
  });
  it('with 10% markup £269.50', () => {
    const total =
      rechargeAmount(travel, true, 0.1) +
      rechargeAmount(miles, true, 0.1) +
      rechargeAmount(other, false, 0.1);
    expect(total).toBeCloseTo(269.5, 10);
  });
});

describe('T23 statement for January, client with 12 days in Jan', () => {
  const bookings: CountedBooking[] = [];
  // 12 weekdays 04/01/2027 .. 27/01/2027 (Mon-Thu pattern is irrelevant; use 12 dates)
  const dates = ['04', '05', '06', '07', '11', '12', '13', '14', '18', '19', '25', '27'];
  for (const d of dates) bookings.push({ date: `2027-01-${d}`, value: 1, state: 'planned' });
  bookings.push({ date: '2027-02-10', value: 1, state: 'planned' });
  bookings.push({ date: '2027-02-24', value: 1, state: 'planned' });
  bookings.push({ date: '2027-03-03', value: 1, state: 'planned' });
  bookings.push({ date: '2027-03-17', value: 0.5, state: 'planned' });

  const st = buildStatement({
    statementMonth: '2027-01-15',
    bookings,
    allowanceDays: 12,
    annualFee: 18000,
    monthlyFee: 1500,
    currentTermStart: '2027-01-01',
    currentTermEnd: '2027-12-31',
    rechargeableExpensesThisMonth: 0,
  });
  it('12 this month; 12 used; 0 remaining; 3.5 booked ahead', () => {
    expect(st.daysThisMonth).toBe(12);
    expect(st.usedThisTermToMonthEnd).toBe(12);
    expect(st.remainingAtMonthEnd).toBe(0);
    expect(st.bookedAheadInTerm).toBe(3.5);
  });
  it('dated list runs 04/01 to 27/01 with 12 entries', () => {
    expect(st.datesThisMonth).toHaveLength(12);
    expect(st.datesThisMonth[0]!.date).toBe('2027-01-04');
    expect(st.datesThisMonth[11]!.date).toBe('2027-01-27');
  });
});

describe('T24 statement for an unused weekly client', () => {
  const st = buildStatement({
    statementMonth: '2026-11-15',
    bookings: [],
    allowanceDays: 46,
    annualFee: 69000,
    monthlyFee: 5750,
    currentTermStart: '2026-11-02',
    currentTermEnd: '2027-11-01',
    rechargeableExpensesThisMonth: 245,
  });
  it('46 days at risk; £1,500 a day; £69,000 at risk; £5,750 fee; £245 expenses', () => {
    expect(st.daysAtRiskOfExpiring).toBe(46);
    expect(st.valueOfOneDay).toBe(1500);
    expect(st.valueOfDaysAtRisk).toBe(69000);
    expect(st.retainerFeeThisMonth).toBe(5750);
    expect(st.rechargeableExpensesThisMonth).toBe(245);
  });
});

describe('T25-T27 what-if scenarios', () => {
  const base = {
    includePencilled: false,
    veridianDaysPerWeek: 3,
    rates: S.rates,
    signedDaysToday: 92,
    pencilledDaysToday: 0,
    signedRevenueToday: 138000,
    pencilledRevenueToday: 0,
    newClients: [],
  };
  it('T25 add a weekly client to 92 signed days', () => {
    const r = runScenario(
      { ...base, newClients: [{ name: 'New co', frequency: '1 day a week' }] },
      S,
    );
    expect(r.capacityDays).toBe(138);
    expect(r.committedDays).toBe(138);
    expect(r.utilisation).toBeCloseTo(1, 10);
    expect(r.verdict).toBe('No: over the stop threshold');
    expect(r.weeklyFit).toBe('Fits in 3 days a week');
    expect(r.totalAnnualRevenue).toBe(207000);
  });
  it('T26 add a monthly client instead: 75%, fits comfortably', () => {
    const r = runScenario(
      { ...base, newClients: [{ name: 'New co', frequency: '1 day a month' }] },
      S,
    );
    expect(Math.round(r.utilisation * 100)).toBe(75);
    expect(r.verdict).toBe('Yes: fits comfortably');
  });
  it('T27 4 Veridian days a week, pencilled included: capacity 184; pencilled 12', () => {
    const r = runScenario(
      { ...base, veridianDaysPerWeek: 4, includePencilled: true, pencilledDaysToday: 12 },
      S,
    );
    expect(r.capacityDays).toBe(184);
    expect(r.committedDays).toBe(92 + 12);
  });
});
