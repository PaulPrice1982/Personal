# Veridian Planner: application-layer obligations from the 17/10/2026 review

The engine, schema, tokens and tests in this pack already carry the review's
fixes (F-001, F-002, F-003, F-005 basis, F-006, F-009, F-010, F-015, F-016
tokens, F-004/F-008 helpers, and the schema for F-007/F-011/F-012/F-013/
F-014). This file lists what the APPLICATION must do with them. Each item
names its finding.

## Replace and migrate

1. Replace `core/` and `tests/` with this pack's versions, byte for byte, and
   adopt `prisma/schema.prisma`. Run the three SQL migrations in
   `prisma/migrations/` (F-007 email index, F-011 booking slot indexes and
   CHECK, F-014 append-only triggers) against the database, in that order,
   after `prisma migrate` has applied the schema changes. F-011's file says
   how to check for existing duplicate bookings first. All 112 pack tests
   must pass unmodified; pin vitest at ^4.1.12 and commit a lockfile, using
   npm ci in CI (F-015).

## Dates and time zones (F-004)

2. Every "today" or `asAt` comes from `todayIn(user.timeZone)` (now in
   `core/dates.ts`), never from `new Date().toISOString().slice(0, 10)`. Add
   a grep check to CI that no business date is built that way in app, server
   or job code.
3. Settings gains a Time zone select (IANA names via
   `Intl.supportedValuesOf('timeZone')`), defaulting from the browser on
   invite acceptance; `User.timeZone` defaults to Europe/London.
4. Per-user jobs (Friday reminder, statement day, renewals) evaluate the
   user's local date and time. The ICS importer converts events to the
   user's zone before the 09:00 to 17:30 window, the 3-hour rule and the
   booking date.

## Overage and billing (F-003, F-005, F-006)

5. Overage lines on statements and in Billing come from `overageWalk`: one
   dated booking per line at a stated rate (or stated percentage for a
   cancellation). Billing and the statement overage line use
   `monthlyOverage(..., 'billable')`; Forecast and Home keep the default
   allowance basis. Label them "Overage billed" and "Overage forecast".
6. The Billing export for a month is blocked while the client has
   unconfirmed days in it, with the message "Confirm or cancel N unconfirmed
   days in MONTH before exporting." (real count and month), the same way A21
   blocks statements.
7. Build `CountedBooking` rows with `toCountedBooking`, from the STORED
   `Booking.deliveryState` and `Booking.cancellationChargeFraction` (set
   once, at cancellation, from the tiers in force then). Never recompute a
   past cancellation against today's tiers. A `cancelled_late` booking
   without a stored fraction now throws.
8. Retainer invoice lines and the statement's retainer fee follow
   `feeFallsInMonth` (F-002) so forecast and billing agree, and use
   `monthlyFeeSchedule(annualFee)` for the twelve amounts so the year sums
   exactly to the contract (F-010).

## Billing data flow (F-012, F-014)

9. `BillingSummary` is per user per entity per month; `BillingLine` rows are
   the only source of the Xero CSV. On export, set `exportedAt` and every
   line's `lockedAt` in one transaction. A later change to a booking or
   expense behind a locked line creates an adjustment line in the next open
   month, never an edit (the F-014 trigger enforces this).
10. Every Billing, monday and Statement query filters by the session user
    unless the role is ADMIN. Route all tenant-scoped queries (Booking,
    Client, Expense, Scenario, Statement, Contract, Billing, Monday,
    Calendar) through one unit-tested helper, `scopedWhere(session)`, and
    check record ownership before every mutation.
11. The authorisation helper writes an AuditLog row with outcome 'denied'
    whenever a request is refused for ownership or role. Users are disabled,
    never deleted.

## Authentication (F-007, F-013)

12. Normalise every email (`NFKC`, trim, lower case) at every entry point:
    login, magic link, reset, invite create and accept, profile change,
    rate-limit keys and LoginEvent writes. Key rate limits on normalised
    email AND client IP, taking the IP from the platform's trusted proxy
    header only.
13. One-time codes are bound to the login attempt: a random attempt id in an
    HttpOnly SameSite=Lax cookie set when the password step succeeds, stored
    on the code row, and required at verification.
14. The magic-link browser nonce is stored as a SHA-256 hash
    (`browserNonceHash`); the raw value lives only in an HttpOnly cookie.
15. Invites and password resets use `AuthToken` rows: 32 random bytes,
    base64url in the link, SHA-256 stored, invite 7 days, reset 1 hour,
    single use. Remove any reset path through OneTimeCode.
16. The outbound bookings ICS feed is addressed by a random token whose
    SHA-256 is `User.icsFeedTokenHash`; regenerating rotates the hash so the
    old URL returns 404.
17. On password change keep only the changing session; on reset and on
    "This wasn't me" revoke every session and trusted device; in the same
    transaction mark unused AuthToken, OneTimeCode and MagicLink rows used.
    Use `User.lockedUntil` for the 15-minute lockout.

## Bookings (F-011)

18. Booking create, update and move run the existence check and write in a
    Serializable transaction; reject a half day when a live full day exists;
    map the unique violation to "You already have a booking on DATE (SLOT).
    Move or cancel it first." with the real date and slot.

## Expenses (F-008)

19. Drop any reliance on a stored running mileage total. On create, edit or
    delete of a mileage expense, recompute every unbilled mileage expense
    for that user in that tax year (`ukTaxYearStart`) in one transaction,
    walking by date then createdAt through `mileageCost`. A billed row whose
    cost would change gets an adjustment expense dated today instead.
    Mileage rates, threshold and the receipt limit are per-user settings
    (now in SettingsHistory), shown under Settings, Expenses.

## Tokens and components (F-016)

20. `--warning` is a fill only, always with `--ink` text. Warning and
    Unconfirmed badges use `--warning-bg` with `--warning-text`. Form
    control borders use `--border-input`; `--hairline` is for table dividers
    only. Never place `--muted` text on `--secondary`. In Recharts, give
    series 2 to 4 a 1px `--pine` stroke and distinct patterns (hatch for
    pencilled weighted, dots for overage) so adjacent segments separate at
    3:1. Keep `tests/contrast.test.ts` green: it is acceptance test A35.

## Settings (F-010)

21. The Settings save calls `validateSettings` and rejects the save with its
    field messages when any come back.

## Interim security controls (review section 7; apply as written)

22. Contract templates: admin upload only; reject files over 5 MB, ZIPs
    expanding beyond 50 MB, and any file containing word/vbaProject.bin,
    customXml external relationships or TargetMode="External". Do not
    enable docxtemplater's angular expression parser.
23. Statement PDFs render from a fixed internal template; in Playwright,
    abort every non-data: request and HTML-escape all ICS, client and notes
    text.
24. ICS fetching: https only; resolve DNS and reject private, loopback,
    link-local and metadata ranges (IPv4 and IPv6) before connecting and
    after each of at most 3 redirects; 10-second timeout; 5 MB cap; at most
    1,000 RRULE occurrences per event within a 15-month window.

## Not to implement (owner decisions, review section 6)

The review's S1 to S8 (magic-link cross-device wording, pro-rated billing
attribution, AU mileage defaults, shared-client field list, post-billing
adjustments policy wording, reserved-name list confirmation, fractional
allowance rounding) are for Paul to decide. Do not build them; the defaults
already in the pack stand until he says otherwise.
