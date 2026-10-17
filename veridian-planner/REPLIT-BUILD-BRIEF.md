# Veridian Planner, Phase 1: build brief

A new Replit app, separate from the veridian-partners.com website, to run at
**app.veridian-partners.com** (CNAME to Replit). The website only gets a /login
page and a footer "Consultant login" link; nothing else on the site changes.

This brief condenses Veridian_Planner_Build_Spec v2.0 (17/10/2026). The
numerical rules are already implemented and tested in `core/` (61 vitest tests
mirroring the spreadsheet's 27 scenarios and the spec's additional tests, all
passing). **Copy `core/` in unchanged and build the app around it.** Where the
app and the old spreadsheet differ, the spec wins; where this brief and `core/`
tests differ, the tests win.

## Stack (confirmed)

- TypeScript, Next.js (App Router), PostgreSQL (Replit managed Postgres), Prisma
  (`prisma/schema.prisma` in this pack is the data model; extend, don't trim).
- Tailwind CSS with `app/tokens.css` variables; shadcn/ui (sidebar, command,
  sheet, dialog, table, toast); cmdk palette; FullCalendar themed to tokens;
  Recharts; Lucide icons at 1.5px stroke. Confirmed decision: the app uses the
  same design, branding and colours as the veridian-partners.com website
  (deep pine / pine / sage / ivory / paper palette in `app/tokens.css`; GFS
  Didot for the wordmark and large titles, Georgia for reading text, Figtree
  for interface text). Self-host the fonts (Fontsource), do not load from
  Google at runtime.
- Auth built per section "Login security" below (own implementation or Auth.js
  extended); Argon2id for passwords; Cloudflare Turnstile or similar.
- Email: Postmark or Resend, sending from mail.veridian-partners.com once SPF,
  DKIM and DMARC are set (ask Paul to add the DNS records the provider shows).
- Documents: docxtemplater for contracts; statements rendered from HTML to PDF
  with Playwright; files in Replit object storage.
- Scheduled jobs: ICS feed polling (15 min), renewals, delivery reminders
  (Friday confirm-last-week), statements (3rd working day), alerts, backups.

## Users and visibility

- Roles: Admin (Paul, paul@veridian-partners.com) and Partner (Nick Boyle and
  future partners). Invite-only; no self sign-up. Nothing hard-codes one
  person: every rate, split and calendar is per-user.
- Partners never see each other's clients, bookings, expenses or revenue.
  They do see each other's **free/busy** by default (a setting, default on).
- Admin sees everything, including the team forecast view (converted to GBP at
  the ECB daily rate via the Frankfurter API).

## The engine (already written: `core/`)

- `packages.ts` retainer packages and pricing; working weeks = 52 − leave/5.
- `capacity.ts` annual capacity (leave shared pro rata; bank holidays absorbed
  Detent first, then Other, then Veridian), weekly capacity and week statuses
  (Off / Overbooked / Full / Thin / Open), utilisation thresholds (Thin ≥ 80%,
  STOP ≥ 95%).
- `terms.ts` 12-month auto-renewing terms, notice deadline = renewal − 90 days,
  late-notice handling. Unused days expire at term end.
- `bookings.ts` delivery states (Planned / Unconfirmed / Delivered / Cancelled
  in time / Cancelled late / Cancelled by consultant / Moved), the three
  counting bases (allowance, billable, capacity), and the cancellation charge
  tiers from the consultancy agreement: by written notice before the booked
  date, under 14 days charges 100% of the day, 14 to 44 days 75%, 45 to 89
  days 50%, 90 days or more free. A chargeable cancellation counts its
  fraction on the allowance and billable bases; every cancellation frees the
  calendar day itself. Moving a date is a cancellation unless a replacement
  date is agreed (the app's Move action records the replacement, so only the
  new date counts). Days the consultant cannot deliver are rescheduled or
  not charged.
- `overage.ts` overage walked in date order; whole days at the additional day
  rate, a trailing half at the additional half-day rate; monthly overage =
  delta of cumulative charges.
- `alerts.ts` client alert priority: Over allowance → Confirm past days →
  Nearly used (≤10% left) → Unused days at risk → Notice deadline soon → OK.
- `forecast.ts` 12-month forecast (signed in full for live months; pencilled
  weighted by client probability, else monday stage probability, else 0.5).
- `statement.ts` monthly client usage statement numbers.
- `whatif.ts` scenarios (never touch real data; "Make pencilled" copies in).
- `expenses.ts` mileage 45p/25p with the 10,000-mile tax-year threshold,
  recharge = net × (1 + markup), receipts required over £25.

Run `npm test` in the pack to see all 61 checks pass before building; keep the
suite green in CI for every change.

## Pages (left sidebar, top to bottom)

Layout per spec section 20: ONE persistent left sidebar (240px expanded, 64px
rail collapsed; collapsed below 1280px, remembered per user), **no top bar
anywhere** (A36). Sidebar: Veridian lockup (Sealed V mark when collapsed) →
search/commands (Cmd+K hint) → Home, Calendar, Clients, Forecast, What if,
Statements, Expenses, Billing, Contracts → admin group (Team, Partners, Audit
log) → pinned bottom: Alerts (count badge), Settings, avatar (Sign out).
Active item: pine-tinted background, 3px sage bar left, weight 600. Page
header inside the content area (title left, primary action and filters right,
scrolls with content). Detail drawer from the right (440px) for editing a
booking, client or expense; Escape closes. Content fluid with 32px padding;
reading pages cap at 880px. Under 768px the sidebar is a slide-out drawer from
a floating bottom-left button; mobile priorities: today's calendar, confirm
delivered days, capture an expense, check capacity.

1. **Home**: personal dashboard. Capacity summary (signed/pencilled days vs
   Veridian capacity, utilisation, status), leave remaining, client table
   (allowance, booked, remaining, alert), weekly status strip, unconfirmed
   past days call-to-action, next 3/12-month committed revenue.
2. **Calendar**: day / work week / month / list views; all-day banner
   bookings; half days as AM/PM (max two per date); drag to move with a
   non-drag "Move to date" alternative (A34); Outlook busy blocks shown
   read-only (meetings ≥3h block a full day, <3h a half day, within
   09:00–17:30; tentative blocks nothing; overlapping Veridian and Detent
   meetings get clash markers and count busy once). WCAG 2.2 AA.
3. **Clients**: list + detail. Package, term dates, notice status, allowance
   usage bar, bookings, expenses, statements, contracts. Client create
   rejects reserved names (Leave, Detent, Admin / BD, Other). A client
   belongs to one entity; shared clients are always billed by Veridian
   Revenue Partners Limited (confirmed decision), whoever delivers the days.
4. **Forecast**: the 12-month table plus a stacked bar chart (signed,
   pencilled weighted, overage, expenses) with the utilisation line (amber
   80%, red 95%). Team view (admin only) converts to GBP.
5. **What if**: saved scenarios, compare up to three side by side, week strip
   showing any Overbooked weeks a scenario creates, "Make pencilled".
6. **Statements**: month picker per client; preview; branded PDF; email after
   review (locked versions; editing a delivered day after sending flags it
   and offers version 2).
7. **Expenses**: capture (category, client, VAT per entity registration,
   foreign currency at the day's ECB rate, receipt upload, mileage with the
   ledger), recharge preview, month list with "billed" lock.
8. **Billing**: monthly summary per entity; Xero CSV export with columns
   *ContactName, EmailAddress, *InvoiceNumber, *InvoiceDate, *DueDate,
   Description, *Quantity, *UnitAmount, *AccountCode, *TaxType, Currency.
   Retainer, overage and expense lines separate (A32). Exported lines lock.
9. **Contracts**: generate DOCX + PDF from the entity's Word templates with
   {{field}} merges and {{#optional}} sections, versioned, SOW supported.
   Only templates belonging to the client's entity are offered (A31).
10. **Settings**: rates (effective-dated; contracts keep signed rates), weekly
    split (effective-dated; earlier weeks keep the old split), leave and leave
    year, bank holiday country (gov.uk JSON for GB, Nager.Date for AU),
    cancellation charge tiers, statement day, reminders, ICS links (two per
    user, encrypted), app→Outlook private ICS feed URL, monday connection
    (token, board, stage→probability mapping), email alert preferences (the
    new-device alert cannot be switched off).
11. **Admin**: Team (invite partner, disable), Partners (free/busy defaults),
    Audit log.

Interaction (build the command palette FIRST): Cmd+K jumps to any page,
client or date; creates a booking, client, expense or scenario; confirms last
week's days. Keyboard: G then C / G then H, N, E, [ , T, arrows between
weeks, Escape. Inline editing in tables with an Undo toast (6s). Empty states
explain the next step. Skeletons over 300ms, 150–200ms ease-out motion,
respect reduced motion. UK formats (DD/MM/YYYY, £1,500), tabular figures,
negatives in parentheses.

## Login security (spec section 4)

- Password (Argon2id, min 12 chars, HIBP range-API check) + emailed 6-digit
  code (10 min, 5 attempts, then invalidated; 5 wrong codes with a correct
  password locks the account 15 minutes and emails an alert, A24).
- Magic link alternative: 15 minutes, single use, same-browser nonce; opened
  elsewhere it shows a code to enter in the original browser (A25, A26).
- Trusted browser 30 days (code required again after, A30). Uniform responses
  for unknown emails (A27). Rate limits + 15-minute lockouts. Turnstile on
  the login form. Sessions 12h idle / 30 days max; password change ends all
  other sessions (A29); new-device sign-in emails an alert with a "This
  wasn't me" link that ends all sessions (A28). HSTS, CSP, CSRF protection;
  tokens stored hashed. Login allows paste and password managers.
- UK GDPR: data stays in UK/EU regions where the platform allows; privacy
  note on the login page.

## Website hook (separate, existing site)

veridian-partners.com/login: a page styled like the site that links through to
app.veridian-partners.com (redirect is fine). Footer gains one "Consultant
login" link. Nothing else changes on the site.

## Decisions (confirmed by Paul, 17/10/2026)

1. Over-allowance half day **£1,050**.
2. Cancellation charges follow the consultancy agreement's tiers (see the
   engine notes above): under 14 days 100%, 14 to 44 days 75%, 45 to 89 days
   50%, 90 days or more free; moving a date is a cancellation unless a
   replacement date is agreed. The tiers are a per-user setting with this
   schedule as the default.
3. Partner free/busy visibility **on** by default.
4. Shared clients are **always billed by Veridian Revenue Partners Limited**;
   partner settlement stays Phase 2.
5. Meeting blocking hours **09:00–17:30**.
6. The app uses the **existing website's design, branding and colours**
   (`app/tokens.css`; GFS Didot / Georgia / Figtree).
7. Website /login **redirects** to app.veridian-partners.com.
8. Trusted browsers **30 days**.

## Phase 2: do NOT build (keep the data model ready)

Xero API connection, e-signature, Microsoft Graph/Azure write access,
partner settlement, passkeys, client portal.

## Acceptance (beyond the 61 core tests)

A13 delivered-day edit after statement → allowed, flagged, logged, version 2
offered. A14–A17 ICS: clash markers, busy counted once; 2h busy → half day,
3.5h → full day, tentative → nothing; recurring with a cancelled and a moved
occurrence handled; one failing feed leaves the other working, shows the last
good copy and a warning. A21 statement run with unconfirmed days in the month
is blocked until confirmed. A22 scenario start dates can show two Overbooked
weeks in the strip. A23 partner opening another partner's client → denied.
A24–A30 as in Login security. A31 entity templates only. A32 Xero CSV imports
cleanly with separate lines. A33 sidebar collapsed at 1100px, remembered. A34
keyboard-only booking move. A35 automated contrast check on all token pairs
passes WCAG 2.2 AA. A36 no top bar on any screen.

Brand rules throughout: UK English, no em dashes anywhere, "Veridian Revenue
Partners" in full in headings and sign-offs, Paul's title is Partner.
