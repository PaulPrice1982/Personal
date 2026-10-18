import { describe, expect, it } from 'vitest';
import { monthlyOneOffCharges, oneOffBillingRates, oneOffWalk, ENGAGEMENT_LABELS } from '../core/oneoff.js';
import { toCountedBooking } from '../core/bookings.js';
import { PAUL_DEFAULT_RATES } from '../core/settings.js';

// One-off (ad-hoc project) engagements: no allowance, no annual fee, every
// counted day billed at the STANDARD rates, cancellations at their tier
// fraction of the standard price.

const ASAT = '2026-10-18';
const rates = PAUL_DEFAULT_RATES; // day 1500, half 900, additional 1750/1050

describe('one-off engagements', () => {
  it('bills a delivered full day at the standard day rate, not the additional rate', () => {
    const rows = oneOffWalk(
      [toCountedBooking({ date: '2026-09-01', allocation: 'Acme', deliveredConfirmed: true }, ASAT)],
      rates,
      null,
      null,
      'billable',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.over).toBe(1);
    expect(rows[0]?.charge).toBe(1500);
  });

  it('bills a half day at the standard half-day rate', () => {
    const rows = oneOffWalk(
      [
        toCountedBooking(
          { date: '2026-09-02', halfDay: true, allocation: 'Acme', deliveredConfirmed: true },
          ASAT,
        ),
      ],
      rates,
      null,
      null,
      'billable',
    );
    expect(rows[0]?.charge).toBe(900);
  });

  it('charges a late cancellation at its tier fraction of the standard day', () => {
    // 20 days written notice: 75% tier.
    const rows = oneOffWalk(
      [toCountedBooking({ date: '2026-09-30', allocation: 'Acme', cancelledOn: '2026-09-10' }, ASAT)],
      rates,
      null,
      null,
      'billable',
    );
    expect(rows[0]?.booking.state).toBe('cancelled_late');
    expect(rows[0]?.charge).toBe(1125); // 0.75 * 1500
  });

  it('charges nothing for an in-time cancellation or a consultant cancellation', () => {
    const rows = oneOffWalk(
      [
        toCountedBooking({ date: '2026-12-31', allocation: 'Acme', cancelledOn: '2026-09-01' }, ASAT),
        toCountedBooking(
          { date: '2026-11-02', allocation: 'Acme', cancelledOn: '2026-10-30', cancelledByConsultant: true },
          ASAT,
        ),
      ],
      rates,
      null,
      null,
      'billable',
    );
    expect(rows).toHaveLength(0);
  });

  it('excludes planned and unconfirmed days on the billable basis but counts them on the allowance basis', () => {
    const bookings = [
      toCountedBooking({ date: '2026-10-01', allocation: 'Acme' }, ASAT), // past: unconfirmed
      toCountedBooking({ date: '2026-11-01', allocation: 'Acme' }, ASAT), // future: planned
      toCountedBooking({ date: '2026-09-01', allocation: 'Acme', deliveredConfirmed: true }, ASAT),
    ];
    expect(oneOffWalk(bookings, rates, null, null, 'billable')).toHaveLength(1);
    const forecast = oneOffWalk(bookings, rates, null, null, 'allowance');
    expect(forecast).toHaveLength(3);
    expect(forecast.reduce((a, r) => a + r.charge, 0)).toBe(4500);
  });

  it('drops bank-holiday and unallocated days (zero value)', () => {
    const rows = oneOffWalk(
      [toCountedBooking({ date: '2026-12-25', allocation: 'Acme', isBankHoliday: true, deliveredConfirmed: true }, ASAT)],
      rates,
      null,
      null,
      'billable',
    );
    expect(rows[0]?.over).toBe(0);
    expect(rows[0]?.charge).toBe(0);
  });

  it('respects the engagement window', () => {
    const rows = oneOffWalk(
      [
        toCountedBooking({ date: '2026-08-31', allocation: 'Acme', deliveredConfirmed: true }, ASAT),
        toCountedBooking({ date: '2026-09-15', allocation: 'Acme', deliveredConfirmed: true }, ASAT),
      ],
      rates,
      '2026-09-01',
      '2026-09-30',
      'billable',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.booking.date).toBe('2026-09-15');
  });

  it('groups monthly charges with cumulative totals', () => {
    const months = monthlyOneOffCharges(
      [
        toCountedBooking({ date: '2026-09-10', allocation: 'Acme', deliveredConfirmed: true }, ASAT),
        toCountedBooking(
          { date: '2026-10-05', halfDay: true, allocation: 'Acme', deliveredConfirmed: true },
          ASAT,
        ),
      ],
      rates,
      null,
      null,
      ['2026-09-30', '2026-10-31'],
      'billable',
    );
    expect(months[0]?.monthlyCharge).toBe(1500);
    expect(months[1]?.monthlyCharge).toBe(900);
    expect(months[1]?.cumulativeCharge).toBe(2400);
    expect(months[1]?.cumulativeOverDays).toBe(1.5);
  });

  it('maps the standard rates into the additional seats without touching the originals', () => {
    const mapped = oneOffBillingRates(rates);
    expect(mapped.additionalDayRate).toBe(rates.dayRate);
    expect(mapped.additionalHalfDayRate).toBe(rates.halfDayRate);
    expect(rates.additionalDayRate).toBe(1750);
    expect(ENGAGEMENT_LABELS.one_off).toBe('One-off project');
  });
});
