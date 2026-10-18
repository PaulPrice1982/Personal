import type { Rates } from './settings.js';
import type { ISODate } from './dates.js';
import type { CountedBooking } from './bookings.js';
import {
  monthlyOverage,
  overageWalk,
  type MonthlyOverage,
  type OverageBasis,
  type OverageWalkRow,
} from './overage.js';

// One-off (ad-hoc project) engagements. A one-off client has no retainer
// package: no frequency, no allowance and no annual or monthly fee. Every
// counted day bills on its own at the STANDARD day and half-day rates, and a
// chargeable cancellation bills its tier fraction of that day, exactly as an
// over-allowance day does under a retainer. Implemented as a zero-allowance
// walk with the standard rates in the additional-rate seats, so the walk, the
// cancellation tiers, the allowance/billable bases and the month grouping
// stay on the one tested path.

export type EngagementType = 'retainer' | 'one_off';

export const ENGAGEMENT_TYPES: readonly EngagementType[] = ['retainer', 'one_off'];

export const ENGAGEMENT_LABELS: Record<EngagementType, string> = {
  retainer: 'Retainer',
  one_off: 'One-off project',
};

export function oneOffBillingRates(rates: Rates): Rates {
  return {
    ...rates,
    additionalDayRate: rates.dayRate,
    additionalHalfDayRate: rates.halfDayRate,
  };
}

// Per-booking charge lines for a one-off engagement: one dated booking per
// line at the standard rate (or the stated tier percentage for a chargeable
// cancellation). Every row's `over` equals its counted value because there is
// no allowance to consume.
export function oneOffWalk(
  bookings: readonly CountedBooking[],
  rates: Rates,
  engagementStart: ISODate | null,
  engagementEnd: ISODate | null,
  basis: OverageBasis = 'allowance',
): OverageWalkRow[] {
  return overageWalk(bookings, 0, oneOffBillingRates(rates), engagementStart, engagementEnd, basis);
}

export function monthlyOneOffCharges(
  bookings: readonly CountedBooking[],
  rates: Rates,
  engagementStart: ISODate | null,
  engagementEnd: ISODate | null,
  monthEnds: readonly ISODate[],
  basis: OverageBasis = 'allowance',
): MonthlyOverage[] {
  return monthlyOverage(
    bookings,
    0,
    oneOffBillingRates(rates),
    engagementStart,
    engagementEnd,
    monthEnds,
    basis,
  );
}
