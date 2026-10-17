import { workingDaysStrictlyBetween, type ISODate } from './dates.js';

// Booking delivery states and counting rules (spec section 9).
// Day value: 1 for a full day, 0.5 for a half day, 0 on a bank holiday or with
// no allocation. Three counting bases:
//  - allowance/forecast basis: planned + unconfirmed + delivered + cancelled late
//  - billable basis: delivered + cancelled late
//  - capacity basis (the week is freed by any cancellation): planned +
//    unconfirmed + delivered

export type DeliveryState =
  | 'planned'
  | 'unconfirmed'
  | 'delivered'
  | 'cancelled_in_time'
  | 'cancelled_late'
  | 'cancelled_by_consultant'
  | 'moved';

export interface BookingInput {
  date: ISODate;
  halfDay?: boolean;
  isBankHoliday?: boolean;
  allocation?: string; // client name or Leave / Detent / Admin / BD / Other
  deliveredConfirmed?: boolean; // explicit "yes, this day happened"
  cancelledOn?: ISODate;
  cancelledByConsultant?: boolean;
  movedToBookingId?: string; // old booking of a moved day: only the new date counts
}

export function dayValue(b: Pick<BookingInput, 'halfDay' | 'isBankHoliday' | 'allocation'>): number {
  if (b.isBankHoliday || !b.allocation) return 0;
  return b.halfDay ? 0.5 : 1;
}

export function isLateCancellation(
  bookingDate: ISODate,
  cancelledOn: ISODate,
  windowWorkingDays: number,
  bankHolidays: ReadonlySet<ISODate> = new Set(),
): boolean {
  if (cancelledOn >= bookingDate) return true;
  return workingDaysStrictlyBetween(cancelledOn, bookingDate, bankHolidays) < windowWorkingDays;
}

export function deliveryState(
  b: BookingInput,
  asAt: ISODate,
  lateCancellationWorkingDays: number,
  bankHolidays: ReadonlySet<ISODate> = new Set(),
): DeliveryState {
  if (b.movedToBookingId) return 'moved';
  if (b.cancelledOn) {
    if (b.cancelledByConsultant) return 'cancelled_by_consultant';
    return isLateCancellation(b.date, b.cancelledOn, lateCancellationWorkingDays, bankHolidays)
      ? 'cancelled_late'
      : 'cancelled_in_time';
  }
  if (b.deliveredConfirmed) return 'delivered';
  return b.date < asAt ? 'unconfirmed' : 'planned';
}

export function countsAgainstAllowance(s: DeliveryState): boolean {
  return s === 'planned' || s === 'unconfirmed' || s === 'delivered' || s === 'cancelled_late';
}

export function countsAsBillable(s: DeliveryState): boolean {
  return s === 'delivered' || s === 'cancelled_late';
}

export function countsAgainstCapacity(s: DeliveryState): boolean {
  return s === 'planned' || s === 'unconfirmed' || s === 'delivered';
}

export interface CountedBooking {
  date: ISODate;
  value: number;      // day value (0.5 or 1; 0 is dropped)
  state: DeliveryState;
}

export interface ClientTermUsage {
  booked: number;        // allowance basis
  delivered: number;     // billable basis
  cancelled: number;     // freed days (in time or by consultant)
  unconfirmedPast: number;
}

export function termUsage(
  bookings: readonly CountedBooking[],
  termStart: ISODate | null,
  termEnd: ISODate | null,
): ClientTermUsage {
  const inTerm = bookings.filter(
    (b) => (termStart === null || b.date >= termStart) && (termEnd === null || b.date <= termEnd),
  );
  const sum = (pred: (s: DeliveryState) => boolean) =>
    inTerm.filter((b) => pred(b.state)).reduce((acc, b) => acc + b.value, 0);
  return {
    booked: sum(countsAgainstAllowance),
    delivered: sum(countsAsBillable),
    cancelled: sum((s) => s === 'cancelled_in_time' || s === 'cancelled_by_consultant'),
    unconfirmedPast: sum((s) => s === 'unconfirmed'),
  };
}
