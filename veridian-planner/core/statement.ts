import { eomonth, minDate, startOfMonth, type ISODate } from './dates.js';
import type { CountedBooking } from './bookings.js';
import { countedValue, countsAgainstAllowance, countsAsBillable } from './bookings.js';
import { pennies } from './money.js';

// Client usage statement for one month (spec section 14; Client Statement sheet).

export interface StatementInputs {
  statementMonth: ISODate; // any date in the month
  bookings: readonly CountedBooking[]; // this client's bookings (all dates)
  allowanceDays: number;
  annualFee: number;
  monthlyFee: number;
  currentTermStart: ISODate | null;
  currentTermEnd: ISODate | null;
  rechargeableExpensesThisMonth: number;
}

export interface Statement {
  monthStart: ISODate;
  monthEnd: ISODate;
  daysThisMonth: number;
  deliveredThisMonth: number;
  usedThisTermToMonthEnd: number;
  remainingAtMonthEnd: number;
  bookedAheadInTerm: number;
  daysAtRiskOfExpiring: number;
  valueOfOneDay: number;
  valueOfDaysAtRisk: number;
  retainerFeeThisMonth: number;
  rechargeableExpensesThisMonth: number;
  datesThisMonth: CountedBooking[];
}

export function buildStatement(i: StatementInputs): Statement {
  const monthStart = startOfMonth(i.statementMonth);
  const monthEnd = eomonth(i.statementMonth, 0);

  const counted = i.bookings.filter((b) => countsAgainstAllowance(b.state));
  const inMonth = (b: CountedBooking) => b.date >= monthStart && b.date <= monthEnd;

  const daysThisMonth = counted.filter(inMonth).reduce((a, b) => a + countedValue(b), 0);
  const deliveredThisMonth = i.bookings
    .filter((b) => countsAsBillable(b.state) && inMonth(b))
    .reduce((a, b) => a + countedValue(b), 0);

  const usedUpper = i.currentTermEnd ? minDate(monthEnd, i.currentTermEnd) : monthEnd;
  const usedThisTermToMonthEnd = counted
    .filter(
      (b) =>
        (i.currentTermStart === null || b.date >= i.currentTermStart) && b.date <= usedUpper,
    )
    .reduce((a, b) => a + countedValue(b), 0);

  const remainingAtMonthEnd = Math.max(0, i.allowanceDays - usedThisTermToMonthEnd);

  const bookedAheadInTerm = counted
    .filter(
      (b) => b.date > monthEnd && (i.currentTermEnd === null || b.date <= i.currentTermEnd),
    )
    .reduce((a, b) => a + countedValue(b), 0);

  const daysAtRiskOfExpiring = Math.max(0, remainingAtMonthEnd - bookedAheadInTerm);
  const valueOfOneDay = i.allowanceDays === 0 ? 0 : pennies(i.annualFee / i.allowanceDays);

  // The dated list shows the month's counted days plus any cancelled/moved
  // entries (statuses carry text); listing is capped by the caller's renderer.
  const datesThisMonth = i.bookings
    .filter(inMonth)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return {
    monthStart,
    monthEnd,
    daysThisMonth,
    deliveredThisMonth,
    usedThisTermToMonthEnd,
    remainingAtMonthEnd,
    bookedAheadInTerm,
    daysAtRiskOfExpiring,
    valueOfOneDay,
    valueOfDaysAtRisk: pennies(daysAtRiskOfExpiring * valueOfOneDay),
    retainerFeeThisMonth: i.monthlyFee,
    rechargeableExpensesThisMonth: i.rechargeableExpensesThisMonth,
    datesThisMonth,
  };
}
