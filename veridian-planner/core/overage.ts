import type { Rates } from './settings.js';
import type { ISODate } from './dates.js';
import type { CountedBooking } from './bookings.js';
import { countedValue, countsAgainstAllowance, countsAsBillable } from './bookings.js';
import { pennies } from './money.js';

// Overage (spec sections 6-7; review F-003/F-005). Each over-allowance
// booking is priced on its own, walked in date order: a full day at the
// additional day rate, a half day (or the over-allowance half of a straddling
// day) at the additional half-day rate, any other fraction at that fraction
// of the additional day rate, and a chargeable cancellation at its tier
// percentage of the over-allowance price of that day. Two bases: 'allowance'
// (forecast: planned + unconfirmed + delivered + chargeable cancellations)
// and 'billable' (invoicing: delivered + chargeable cancellations only), so
// the Xero export never bills undelivered days.

const EPSILON = 1e-9;

export type OverageBasis = 'allowance' | 'billable';

// Aggregate rate-card charge for a number of over-allowance days (dashboard
// summaries, T08/T19): whole days at the additional day rate plus one
// additional half day for a trailing half.
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

// The price of one booking's over-allowance portion (F-003).
export function bookingOverageCharge(b: CountedBooking, over: number, rates: Rates): number {
  if (over <= EPSILON) return 0;
  const isHalf = Math.abs(b.value - 0.5) < EPSILON;
  if (b.state === 'cancelled_late') {
    // The tier fraction of that day's over-allowance price.
    const perDay = isHalf ? rates.additionalHalfDayRate / 0.5 : rates.additionalDayRate;
    return pennies(over * perDay);
  }
  if (isHalf) return pennies((over / 0.5) * rates.additionalHalfDayRate);
  if (Math.abs(over - 1) < EPSILON) return rates.additionalDayRate;
  if (Math.abs(over - 0.5) < EPSILON) return rates.additionalHalfDayRate; // A06 straddle
  return pennies(over * rates.additionalDayRate); // other fractional straddles
}

export interface OverageWalkRow {
  booking: CountedBooking;
  over: number;
  charge: number;
}

// Walk the term's bookings in date order (stable on input order within a
// date), consuming the allowance and pricing each over-allowance portion.
// These rows are the overage lines on statements and in Billing: one dated
// booking at a stated rate.
export function overageWalk(
  bookings: readonly CountedBooking[],
  allowanceDays: number,
  rates: Rates,
  termStart: ISODate | null,
  termEnd: ISODate | null,
  basis: OverageBasis = 'allowance',
): OverageWalkRow[] {
  const pred = basis === 'allowance' ? countsAgainstAllowance : countsAsBillable;
  const inTerm = bookings
    .map((b, i) => ({ b, i }))
    .filter(
      ({ b }) =>
        pred(b.state) &&
        (termStart === null || b.date >= termStart) &&
        (termEnd === null || b.date <= termEnd),
    )
    .sort((x, y) => (x.b.date < y.b.date ? -1 : x.b.date > y.b.date ? 1 : x.i - y.i));

  let remaining = allowanceDays;
  return inTerm.map(({ b }) => {
    const v = countedValue(b);
    const within = Math.max(0, Math.min(remaining, v));
    remaining -= within;
    const over = v - within;
    return { booking: b, over, charge: bookingOverageCharge(b, over, rates) };
  });
}

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
  basis: OverageBasis = 'allowance',
): MonthlyOverage[] {
  const walk = overageWalk(bookings, allowanceDays, rates, termStart, termEnd, basis);
  let cumulativeOverDays = 0;
  let cumulativeCharge = 0;
  let previousMonthEnd: ISODate | null = null;
  return monthEnds.map((monthEnd) => {
    const rows = walk.filter(
      (w) =>
        w.booking.date <= monthEnd &&
        (previousMonthEnd === null || w.booking.date > previousMonthEnd),
    );
    const monthlyCharge = pennies(rows.reduce((a, w) => a + w.charge, 0));
    cumulativeOverDays += rows.reduce((a, w) => a + w.over, 0);
    cumulativeCharge = pennies(cumulativeCharge + monthlyCharge);
    previousMonthEnd = monthEnd;
    return { monthEnd, cumulativeOverDays, cumulativeCharge, monthlyCharge };
  });
}
