# Site update: Exit Readiness, seven services and the Revenue Engine Check

Prepared 12/10/2026 for www.veridian-partners.com. This builds on the copy refresh of 09/10/2026 (veridian-copy-refresh/COPY-REFRESH-SPEC.md), which must already be applied. All files referenced here live in this directory (veridian-site-update/) and must be fetched and applied exactly. The copy is final and approved: apply it word for word, no rewriting, no shortening, no improving. UK English throughout. No em dashes anywhere, in copy, titles or metas.

Most page files list CHANGES ONLY. Where a file says "changes only", everything it doesn't mention stays exactly as it is.

## 1. What maps where

NEW PAGES (create using the existing service-page design system; same layout patterns, components, fonts, colours, spacing, responsive behaviour):

| Page | File |
|---|---|
| /exit-readiness | page-exit-readiness.md |
| /revenue-engine-check | page-revenue-engine-check.md (build spec) and revenue-engine-check-prototype.html (working prototype) |

REPLACED PAGE (replace all copy; keep the banner image and the shared template):

| Page | File |
|---|---|
| /services | page-services.md |

CHANGED PAGES (apply the listed changes only):

| Page | File |
|---|---|
| Home | page-home.md |
| /about | page-about.md |
| /advisory | page-advisory.md |
| /revenue-due-diligence | page-revenue-due-diligence.md |
| /privacy | privacy-addition.md (one new section) |

PAGES WITH NO NEW COPY: /contract-monetisation, /renewals-and-retention, /revenue-operations, /services/revenue-turnaround-and-recovery, /contact, Track record, the existing Insights articles (except bylines, section 6 and page-about.md section 8). The site-wide CTA swap in section 5 still applies to them.

## 2. People named on the site

Paul Price is the only person named on the site, and his title is **Partner** everywhere (page copy, metadata, schema, article bylines). Do not add any other partner, bio, photo or name. A second partner will be added in a later update, so avoid building anything that hard-codes a single person (for example, keep any "team" or "partner" component able to take a second card later).

## 3. Navigation and footer

Services order in the main navigation (Services menu) and the footer Services column, sentence case throughout:

1. All services (menu only; links to /services)
2. Contract monetisation
3. Renewals and retention
4. Revenue operations (label as current nav uses)
5. Advisory
6. Revenue turnaround and recovery
7. Exit readiness (new, links to /exit-readiness)
8. Revenue due diligence

Footer Company column: add **Revenue Engine Check** (→ /revenue-engine-check).

Keep Track record, About, Insights and Contact where they are. The /services page currently renders an older header and footer; it must use the same shared components as every other page (page-services.md, last section).

## 4. Services diagram: six becomes seven

Replace the artwork of the existing DIAGRAMS entry keyed `services` in src/diagrams.js with diagram-services-seven.html, byte for byte. Keep the key `services` and the entry's `name`, so every page block that references it picks up the new artwork automatically. Update the entry's descriptive hint to: "Seven services converging on one outcome: the commercial performance of a software business."

The artwork is self-contained (own wrapper div `dg--services4`, scoped styles, namespaced classes and ids `sv4`), uses the same 900 by 430 viewBox as the six-service version it supersedes, animates on a loop and shows its finished state under prefers-reduced-motion. The labels, in order: Contract monetisation, Renewals and retention, Revenue operations, Advisory, Turnaround and recovery, Exit readiness, Revenue due diligence, converging on COMMERCIAL PERFORMANCE.

The home page diagram heading and caption change too (page-home.md, section 7). If /services shows the diagram, use the same heading and caption there. All other diagrams stay exactly as they are.

## 5. Site-wide call to action: the Revenue Engine Check replaces the 3-minute check

- Every button or link reading "Take the 3-minute revenue leakage check", "Take the 3-minute check" or "Not ready to talk? Take the 3-minute check" is relabelled. Plain versions become **Take the Revenue Engine Check**; "Not ready to talk?" versions become **Not ready to talk? Take the Revenue Engine Check**. All point to /revenue-engine-check.
- Redirect /revenue-leakage-check to /revenue-engine-check with a 301. Remove the old check page from the sitemap; add the new one.
- Search all content and components, including service pages not otherwise changed, so no "3-minute" label remains.
- Do not go live with /revenue-engine-check until the privacy addition (privacy-addition.md) is published.

## 6. Insights

THREE NEW ARTICLES: insight-11-arr-hypothesis.md, insight-12-retention-curve.md, insight-13-uplift.md. Each file carries its slug, title, meta title, author, date, standfirst (listing excerpt), meta description, related service link and full body. Publish each at insights/<slug> following the same rules as the copy refresh (section 3 of COPY-REFRESH-SPEC.md): reading time at about 200 words per minute, Article JSON-LD, sitemap entry, on-brand graphic thumbnail in the established style.

| File | Date shown |
|---|---|
| insight-11-arr-hypothesis.md | 13 October 2026 |
| insight-12-retention-curve.md | 20 October 2026 |
| insight-13-uplift.md | 27 October 2026 |

If the CMS supports scheduled publishing, schedule each for 08:00 UK time on its date. If not, publish all three now with these dates; the listing still runs newest first.

Thumbnail motifs: article 11, two bars of unequal height being reconciled; article 12, a retention curve already drawn ahead of a marker; article 13, a small upward step on a flat line.

BYLINES: every article on the site, new and existing, reads "Paul Price, Partner". Replace "Paul Price, Founder & CEO" wherever it appears.

Lines marked "BUILD NOTE" in article files are instructions, not copy. The horizontal rule and italic sign-off at the end of each article are copy.

## 7. Metadata

Each page file states its meta title and description where they change. Store titles WITHOUT the site suffix; the renderer appends " | Veridian Revenue Partners". Use the meta description for OG and Twitter descriptions unless a file says otherwise.

## 8. Constraints

- Apply copy word for word, including punctuation and capitalisation. Labels such as "EYEBROW:", "H1:", "BUTTONS:", "BUILD NOTE:" and text in brackets that describes layout are instructions for you, not copy.
- Keep all existing images on existing pages exactly where they are. /exit-readiness reuses an existing banner (banner2-boardroom.jpg suits it); /revenue-engine-check reuses banner2-pipeline-review.jpg. If either file isn't available, use the house on-brand graphic header.
- Do not touch the data directory, admin, booking plumbing, the contact form mechanics and anti-spam field, voice features, the HubSpot integration, or any secrets. The Revenue Engine Check submits through the existing contact-form handler; do not add a new handler or third-party service.
- No em dashes anywhere. UK English. "Veridian Revenue Partners" in full in every heading, title and sign-off; never shorten what the copy spells out, and fix any remaining bare "Veridian" in headings or body copy you touch.
- Never name Paul's former employer anywhere on the site. The approved description is "a PE-backed UK business software group with 20 operating companies and c.£1.6bn of ARR".
- Use guarded one-time transforms consistent with house patterns so repeat runs do not duplicate nav items, cards, redirects or articles.

## 9. After the changes

- Search the codebase and stored content and confirm none of these remain: "3-minute", "Founder & CEO", "one-person firm", "One person, by design", "£5m to £100m", "one to three days a week", bare "Why Veridian" headings, and any em dash.
- Run the full self test suite; it must pass with zero failures. Update checks that assert on old copy so they assert on the new copy (same intent, new text).
- Confirm every page returns 200 on desktop and at 400px wide with no sideways scroll, broken images, links, layouts or animations: home, /services, all seven service pages, /revenue-engine-check, track record, about, contact, privacy, /insights and all sixteen article pages.
- Revenue Engine Check: run the acceptance checks in page-revenue-engine-check.md, including one end-to-end test submission that arrives at hello@veridian-partners.com with the correct subject line, and one forced handler failure that shows the error message and not the confirmation.
- /revenue-leakage-check returns a 301 to /revenue-engine-check.
- Article schema markup is valid JSON-LD; the sitemap includes /exit-readiness, /revenue-engine-check and all three new articles.
- Commit with a clear message, and list in your completion report anything you could not apply exactly as written.
