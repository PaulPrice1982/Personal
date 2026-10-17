import type { Rates } from './settings.js';
import { minDate, type ISODate } from './dates.js';
import type { CountedBooking } from './bookings.js';
import { countsAgainstAllowance } from './bookings.js';

// Overage (spec sections 6-7; Retainer Calculator R/S, Overage by Month).
// Charge for D over-allowance days: whole days at the additional day rate,
// plus one additional half day for a trailing half.

const EPSILON = 1e-9;

export function overageCharge(overDays: number, rates: Rates): number {
  if (overDays <= EPSILON) return 0;
  const whole = Math.floor(overDays + EPSILON);
  const fraction = overDays - whole;
  return whole * rates.additionalDayRate + (fraction > EPSILON ? rates.additionalHalfDayRate : 0);
}

export function overageDays(bookedDays: number, allowanceDays: number): number {
  return Math.max(0, bookedDays - allowanceDays);
}

// A06: a full day booked with half a day of allowance left splits into half a
// day within allowance and half a day at the additional half day rate.
export function splitBookedDay(remainingAllowance: number, value: number): {
  withinAllowance: number;
  over: number;
} {
  const within = Math.max(0, Math.min(remainingAllowance, value));
  return { withinAllowance: within, over: value - within };
}

// Cumulative booked days (allowance basis, walked in date order) within the
// current term up to each month end; cumulative charge from that; monthly
// overage = the increase in cumulative charge (so months add to the term total).
export interface MonthlyOverage {
  monthEnd: ISODate;
  cumulativeOverDays: number;
  cumulativeCharge: number;
  monthlyCharge: number;
}

export function monthlyOverage(
  bookings: readonly CountedBooking[],
  allowanceDays: number,
  rates: Rates,
  termStart: ISODate | null,
  termEnd: ISODate | null,
  monthEnds: readonly ISODate[],
): MonthlyOverage[] {
  const counted = bookings
    .filter((b) => countsAgainstAllowance(b.state))
    .filter((b) => termStart === null || b.date >= termStart)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let previousCharge = 0;
  return monthEnds.map((monthEnd) => {
    const upTo = termEnd === null ? monthEnd : minDate(monthEnd, termEnd);
    const booked = counted
      .filter((b) => b.date <= upTo)
      .reduce((acc, b) => acc + b.value, 0);
    const over = Math.max(0, booked - allowanceDays);
    const charge = overageCharge(over, rates);
    const row = {
      monthEnd,
      cumulativeOverDays: over,
      cumulativeCharge: charge,
      monthlyCharge: charge - previousCharge,
    };
    previousCharge = charge;
    return row;
  });
}
