// Section 23.2: the additional tests the app must pass. The pure-logic ones
// are pinned here; the app-level ones (auth, UI, feeds, exports) are listed in
// the build brief as acceptance tests for the application layer.
import { describe, expect, it } from 'vitest';
import {
  annualCapacity,
  contractStatus,
  convert,
  countsAgainstAllowance,
  countsAgainstCapacity,
  cancellationChargeFraction,
  countedValue,
  countsAsBillable,
  dayValue,
  defaultSettings,
  deliveryState,
  mileageCost,
  netCost,
  overageCharge,
  overageDays,
  pencilledProbability,
  pricePackage,
  receiptMissing,
  splitBookedDay,
  termPosition,
  termUsage,
  weeklyVeridianCapacity,
  workingWeeks,
  type CountedBooking,
} from '../core/index.js';

const S = defaultSettings('2026-10-17');

describe('A01 2/2/1 split, 30 leave, 8 bank holidays', () => {
  it('Veridian 92, Detent 84, Other 46', () => {
    const cap = annualCapacity({
      veridianPerWeek: 2,
      detentPerWeek: 2,
      otherPerWeek: 1,
      leaveDays: 30,
      bankHolidays: 8,
    });
    expect(cap.veridian).toBe(92);
    expect(cap.detent).toBe(84);
    expect(cap.other).toBe(46);
  });
});

describe('A02 bank holiday absorption cascade: Detent, then Other, then Veridian', () => {
  it('no Detent days: Other absorbs', () => {
    const cap = annualCapacity({
      veridianPerWeek: 4,
      detentPerWeek: 0,
      otherPerWeek: 1,
      leaveDays: 30,
      bankHolidays: 8,
    });
    expect(cap.detent).toBe(0);
    expect(cap.other).toBe(52 - 6 - 8); // 38
    expect(cap.veridian).toBe(208 - 24); // untouched by BH
  });
  it('no Detent or Other days: Veridian absorbs', () => {
    const cap = annualCapacity({
      veridianPerWeek: 5,
      detentPerWeek: 0,
      otherPerWeek: 0,
      leaveDays: 30,
      bankHolidays: 8,
    });
    expect(cap.veridian).toBe(260 - 30 - 8); // 222
  });
});

describe('A03 split changed from a date: earlier weeks keep the old split', () => {
  it('weekly capacity follows the split in force for that week', () => {
    // Weeks before the change computed at 3 Veridian days, after at 2.
    expect(weeklyVeridianCapacity(5, 0, 3)).toBe(3);
    expect(weeklyVeridianCapacity(5, 0, 2)).toBe(2);
  });
});

describe('A04 Nick: AUD 2,800, weekly client', () => {
  const nickRates = {
    currency: 'AUD',
    dayRate: 2800,
    halfDayRate: 1680,
    additionalDayRate: 3266,
    additionalHalfDayRate: 1960,
  };
  it('AUD 128,800 a year, AUD 10,733 a month', () => {
    const p = pricePackage('1 day a week', nickRates, workingWeeks(30));
    expect(p.annualFee).toBe(128800);
    expect(p.monthlyFee).toBeCloseTo(10733.33, 2);
  });
  it('GBP total at the day\'s rate', () => {
    expect(convert(128800, 0.52)).toBeCloseTo(66976, 6);
  });
});

describe('A05 client starting 15/03/2027, monthly', () => {
  it('allowance term runs 15/03/2027 to 14/03/2028', () => {
    const pos = termPosition('2027-03-15', '2027-06-01');
    expect(pos.currentTermStart).toBe('2027-03-15');
    expect(pos.currentTermEnd).toBe('2028-03-14');
  });
});

describe('A06 full day booked with 0.5 allowance left', () => {
  it('0.5 in allowance, 0.5 at the additional half day rate', () => {
    const split = splitBookedDay(0.5, 1);
    expect(split.withinAllowance).toBe(0.5);
    expect(split.over).toBe(0.5);
    expect(overageCharge(split.over, S.rates)).toBe(1050);
  });
});

describe('A07 shared client: Paul 8, Nick 5 of 12', () => {
  it('1 day over, billed by Veridian Revenue Partners Limited', () => {
    const bookings: CountedBooking[] = [];
    for (let d = 1; d <= 8; d++)
      bookings.push({ date: `2027-01-${String(d).padStart(2, '0')}`, value: 1, state: 'delivered' });
    for (let d = 1; d <= 5; d++)
      bookings.push({ date: `2027-02-0${d}`, value: 1, state: 'delivered' });
    const usage = termUsage(bookings, '2027-01-01', '2027-12-31');
    const over = overageDays(usage.booked, 12);
    expect(over).toBe(1);
    expect(overageCharge(over, S.rates)).toBe(1750); // VRP Ltd rates
  });
});

describe('A08 term ends with 4 days unused: expire; new term full allowance', () => {
  it('bookings in the old term do not count against the new one', () => {
    const bookings: CountedBooking[] = [
      { date: '2026-05-01', value: 1, state: 'delivered' },
      { date: '2026-06-01', value: 1, state: 'delivered' },
    ];
    const newTerm = termUsage(bookings, '2027-01-01', '2027-12-31');
    expect(newTerm.booked).toBe(0);
  });
});

describe('A09 late notice: warning; renewal stands', () => {
  it('status is late_notice and the renewal date holds', () => {
    const pos = termPosition('2026-01-01', '2026-10-17');
    const st = contractStatus(pos, '2026-10-10'); // deadline was 03/10/2026
    expect(st.kind).toBe('late_notice');
    expect(st.date).toBe(pos.renewalDate);
  });
});

describe('A10 / A11 cancellation charges (consultancy agreement schedule 1 s8.4)', () => {
  // Confirmed 17/10/2026: these tiers supersede the spec's assumed binary
  // 2-working-day window. Charge by written notice before the booked date.
  it('under 14 days notice: 100% of the day; counts against allowance; billable if over', () => {
    expect(cancellationChargeFraction('2026-12-09', '2026-12-08')).toBe(1);
    const state = deliveryState(
      { date: '2026-12-09', allocation: 'Client A', cancelledOn: '2026-12-08' },
      '2026-12-15',
    );
    expect(state).toBe('cancelled_late');
    expect(countsAgainstAllowance(state)).toBe(true);
    expect(countsAsBillable(state)).toBe(true);
    expect(countsAgainstCapacity(state)).toBe(false); // the day itself is freed
  });
  it('14 to 44 days: 75%; 45 to 89 days: 50%', () => {
    expect(cancellationChargeFraction('2026-12-09', '2026-11-25')).toBe(0.75); // 14 days
    expect(cancellationChargeFraction('2026-12-09', '2026-11-01')).toBe(0.75); // 38 days
    expect(cancellationChargeFraction('2026-12-09', '2026-10-25')).toBe(0.5);  // 45 days
    expect(cancellationChargeFraction('2027-03-09', '2026-12-10')).toBe(0.5);  // 89 days
    const partCharged: CountedBooking = {
      date: '2026-12-09',
      value: 1,
      state: 'cancelled_late',
      chargeFraction: 0.75,
    };
    expect(countedValue(partCharged)).toBe(0.75);
  });
  it('90 days or more: no charge; capacity freed; not counted', () => {
    expect(cancellationChargeFraction('2027-03-09', '2026-12-09')).toBe(0); // 90 days
    const state = deliveryState(
      { date: '2027-03-09', allocation: 'Client A', cancelledOn: '2026-12-09' },
      '2026-12-15',
    );
    expect(state).toBe('cancelled_in_time');
    expect(countsAgainstAllowance(state)).toBe(false);
  });
  it('cancellation by the consultant never counts against the client', () => {
    const state = deliveryState(
      {
        date: '2026-12-09',
        allocation: 'Client A',
        cancelledOn: '2026-12-08',
        cancelledByConsultant: true,
      },
      '2026-12-15',
    );
    expect(state).toBe('cancelled_by_consultant');
    expect(countsAgainstAllowance(state)).toBe(false);
    expect(countsAsBillable(state)).toBe(false);
  });
});

describe('A12 day moved to a new date', () => {
  it('old booking linked; only the new date counts', () => {
    const oldState = deliveryState(
      { date: '2026-12-09', allocation: 'Client A', movedToBookingId: 'bk_new' },
      '2026-12-15',
    );
    expect(oldState).toBe('moved');
    expect(countsAgainstAllowance(oldState)).toBe(false);
    const newState = deliveryState(
      { date: '2026-12-18', allocation: 'Client A' },
      '2026-12-15',
    );
    expect(countsAgainstAllowance(newState)).toBe(true);
  });
});

describe('A18 monday stage probability', () => {
  it('pencilled with stage probability 60% weights at 0.6; Won becomes committed', () => {
    const pencilled = {
      status: 'Pencilled' as const,
      monthlyFee: 1000,
      liveFrom: '2026-11-01',
      liveTo: null,
      mondayStageProbability: 0.6,
    };
    expect(pencilledProbability(pencilled, 0.5)).toBe(0.6);
    expect(pencilledProbability({ ...pencilled, status: 'Signed' }, 0.5)).toBe(1);
    expect(
      pencilledProbability({ ...pencilled, mondayStageProbability: undefined }, 0.5),
    ).toBe(0.5);
  });
});

describe('A19 mileage crossing 10,000 miles in the tax year', () => {
  const rates = { high: 0.45, low: 0.25, thresholdMiles: 10000 };
  it('45p up to 10,000, 25p after', () => {
    expect(mileageCost(100, 9950, rates)).toBeCloseTo(50 * 0.45 + 50 * 0.25, 10);
    expect(mileageCost(100, 0, rates)).toBeCloseTo(45, 10);
    expect(mileageCost(100, 10000, rates)).toBeCloseTo(25, 10);
  });
});

describe('A20 expense with no receipt above £25', () => {
  const mileage = { high: 0.45, low: 0.25, thresholdMiles: 10000 };
  it('warning and alert', () => {
    const e = { category: 'Travel', amountExVat: 30, rechargeable: true };
    expect(receiptMissing(e, netCost(e, mileage), 25)).toBe(true);
    const small = { category: 'Travel', amountExVat: 20, rechargeable: true };
    expect(receiptMissing(small, netCost(small, mileage), 25)).toBe(false);
    const withReceipt = { ...e, receiptRef: 'R-001' };
    expect(receiptMissing(withReceipt, netCost(withReceipt, mileage), 25)).toBe(false);
  });
});

describe('booking day values', () => {
  it('bank holidays and empty days count zero', () => {
    expect(dayValue({ allocation: 'Client A', isBankHoliday: true })).toBe(0);
    expect(dayValue({})).toBe(0);
    expect(dayValue({ allocation: 'Client A', halfDay: true })).toBe(0.5);
    expect(dayValue({ allocation: 'Client A' })).toBe(1);
  });
});
