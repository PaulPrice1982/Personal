import { daysBetween, type ISODate } from './dates.js';

// Booking delivery states and counting rules (spec section 9, with the
// cancellation schedule from the Veridian consultancy agreement, confirmed
// 17/10/2026). Day value: 1 for a full day, 0.5 for a half day, 0 on a bank
// holiday or with no allocation. Three counting bases:
//  - allowance/forecast basis: planned + unconfirmed + delivered + chargeable
//    cancellations at their charge fraction
//  - billable basis: delivered + chargeable cancellations at their fraction
//  - capacity basis (the day itself is freed by any cancellation): planned +
//    unconfirmed + delivered
//
// Cancellation charges: a client cancellation charges a percentage of the
// day by written notice given before the booked date: under 14 days 100%,
// 14 to 44 days 75%, 45 to 89 days 50%, 90 days or more free. Moving a
// booked date counts as a cancellation unless a replacement date is agreed
// (a Moved booking records the agreed replacement, so only the new date
// counts). Days the consultant cannot deliver are rescheduled or not
// charged.

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

export interface CancellationTier {
  minNoticeDays: number;   // calendar days of written notice before the date
  chargeFraction: number;  // share of the day charged
}

// Schedule 1 section 8.4 of the consultancy agreement.
export const DEFAULT_CANCELLATION_TIERS: readonly CancellationTier[] = [
  { minNoticeDays: 90, chargeFraction: 0 },
  { minNoticeDays: 45, chargeFraction: 0.5 },
  { minNoticeDays: 14, chargeFraction: 0.75 },
  { minNoticeDays: 0, chargeFraction: 1 },
];

export function cancellationChargeFraction(
  bookingDate: ISODate,
  cancelledOn: ISODate,
  tiers: readonly CancellationTier[] = DEFAULT_CANCELLATION_TIERS,
): number {
  const notice = Math.max(0, daysBetween(cancelledOn, bookingDate));
  const sorted = tiers.slice().sort((a, b) => b.minNoticeDays - a.minNoticeDays);
  for (const tier of sorted) {
    if (notice >= tier.minNoticeDays) return tier.chargeFraction;
  }
  return 1;
}

export function deliveryState(
  b: BookingInput,
  asAt: ISODate,
  tiers: readonly CancellationTier[] = DEFAULT_CANCELLATION_TIERS,
): DeliveryState {
  if (b.movedToBookingId) return 'moved';
  if (b.cancelledOn) {
    if (b.cancelledByConsultant) return 'cancelled_by_consultant';
    return cancellationChargeFraction(b.date, b.cancelledOn, tiers) > 0
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
  // Chargeable cancellations carry the tier's share of the day (1 when the
  // state is not a cancellation).
  chargeFraction?: number;
}

// The share of a booking's value that counts on the allowance and billable
// bases: full for worked/booked days, the cancellation tier's fraction for a
// chargeable cancellation.
export function countedValue(b: CountedBooking): number {
  if (b.state === 'cancelled_late') return b.value * (b.chargeFraction ?? 1);
  return b.value;
}

export interface ClientTermUsage {
  booked: number;        // allowance basis
  delivered: number;     // billable basis
  cancelled: number;     // freed days (no charge, or by the consultant)
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
    inTerm.filter((b) => pred(b.state)).reduce((acc, b) => acc + countedValue(b), 0);
  return {
    booked: sum(countsAgainstAllowance),
    delivered: sum(countsAsBillable),
    cancelled: inTerm
      .filter((b) => b.state === 'cancelled_in_time' || b.state === 'cancelled_by_consultant')
      .reduce((acc, b) => acc + b.value, 0),
    unconfirmedPast: sum((s) => s === 'unconfirmed'),
  };
}
