# Site-wide copy refresh: master specification

Prepared 09/10/2026 for www.veridian-partners.com. All files referenced here live in the same
directory on raw.githubusercontent.com and must be fetched and applied exactly. The page copy
is final and approved: apply it word for word, no rewriting, no shortening, no improving.
UK English throughout. No em dashes anywhere, in copy, titles or metas.

## 1. What maps where

REPLACED PAGES (replace all copy on each page with the supplied file; keep each page's
existing images, layout patterns, components and interactive features exactly as they are):

| Page | Copy file |
|---|---|
| /contract-monetisation | page-contract-monetisation.md |
| /revenue-operations | page-revenue-operations.md |
| /advisory | page-advisory.md |
| /services/revenue-turnaround-and-recovery | page-revenue-turnaround.md |
| /about | page-about.md |
| /contact | page-contact.md |

NEW PAGES (create using the existing service-page design system; same layout patterns,
components, fonts, colours, spacing, responsive behaviour):

| Page | Copy file |
|---|---|
| /renewals-and-retention | page-renewals-and-retention.md |
| /revenue-due-diligence | page-revenue-due-diligence.md |

PAGES WITH NO NEW COPY (leave their copy untouched): Home (except the specific additions
below), Track record, Insights listing (template only; it gains the new articles), Privacy,
the three existing Insights articles (bodies unchanged; dates change, see section 3).

HOME PAGE ADDITIONS ONLY (no other home copy changes):
- A services/problems card for Renewals and Retention (text in page-renewals-and-retention.md).
- Symptom line "Our NRR looks healthy, but most of it is price" linked to /renewals-and-retention.
- Symptom line "Buying, selling or raising, and the revenue plan hasn't been tested" linked to /revenue-due-diligence.

SITE-WIDE: wherever the target market reads "£5m to £100m ARR" (or any upper bound that is
not £500m), change it to "£5m to £500m ARR". Search all content.

## 2. Navigation and footer

Services order in the main navigation and the footer Services column:
1. Contract monetisation
2. Revenue operations (label as current nav uses)
3. Advisory
4. Revenue turnaround and recovery (unchanged)
5. Renewals and Retention (new)
6. Revenue Due Diligence (new)

Keep Track record, About, Insights and Contact where they are. Make sure routing works for
both new pages and they appear in the footer.

## 3. Insights

TEN NEW ARTICLES, files insight-01 through insight-10. Each file carries its slug, title,
author, date, standfirst (use as the listing excerpt), meta description, related service
link and full body. Publish each at insights/<slug> with:
- title, author "Paul Price, Founder & CEO", the UK-format date given, and an estimated
  reading time computed from the body (about 200 words per minute, rounded to the nearest minute);
- the standfirst as the excerpt on the Insights listing;
- Article schema markup (JSON-LD: headline, author Paul Price, datePublished matching the
  shown date) on every article page, including the three existing ones;
- all articles included in the sitemap.

REDATE the three existing articles so the whole listing reads as one sequence (bodies unchanged):
- "The three to five per cent you have already earned": 5 June 2026
- "The forecast that moves every week": 16 June 2026
- "Plan versus engine: why the number is behind": 26 June 2026

The ten new articles are dated 7 July 2026 through 9 October 2026 as given in their files.
The listing shows newest first with title, date, excerpt and a thumbnail. For thumbnails,
generate a simple on-brand graphic header per article (flat deep pine #16261D or paper
#F5F7F0 ground, a single sage #93A87B motif echoing the article's theme, no photography,
no text in the image beyond at most a small abstract mark). Photographic thumbnails may be
supplied later and swapped in.

Dates display in UK format throughout, e.g. 12 September 2026.

## 4. Animated graphics

The two NEW pages each get an animated inline SVG figure in the established house style
(the same visual language as the plan-vs-engine figure and the recently refreshed diagrams):

- /renewals-and-retention: add DIAGRAMS entry keyed `renewals` with the supplied artwork in
  diagram-renewals.html, byte for byte. Concept: the NRR headline propped up by price, gross
  retention protected first. Place it in the page where the design system usually places a
  service diagram (after the problem/Sound familiar section).
- /revenue-due-diligence: add DIAGRAMS entry keyed `diligence` with the supplied artwork in
  diagram-due-diligence.html, byte for byte. Concept: management's plan tested against a
  forecast rebuilt from CRM, billing and contract data, with the haircut visible. Place it
  after the "Commercial due diligence covers the market" section.

Both files are self-contained (own wrapper div, scoped styles, namespaced classes rr2/dd2),
loop at 10s, and show their finished state under prefers-reduced-motion. All existing
diagrams on other pages stay exactly as they are. Hero sections may animate on load;
diagrams further down the page should start their animation when scrolled into view if the
design system supports it, otherwise the loop is acceptable.

## 5. Metadata

Each page file states its meta title and description. Store titles WITHOUT the site suffix;
the renderer appends " | Veridian Revenue Partners". Update OG/Twitter descriptions
wherever a page file says so (the About page's current ones name a former employer and must
be replaced with the new meta description).

## 6. Constraints

- Apply copy word for word, including punctuation and capitalisation. Section labels such as
  "SECTION | HERO", "BUTTON:", "BUILD NOTE:" are instructions for you, not copy.
- Keep all existing images on existing pages exactly where they are. Do not replace, move or
  delete any image. The two new pages will receive hero images later; until then give them
  an on-brand graphic header in the same style as the article thumbnails.
- Do not touch the data directory, admin, booking plumbing, the contact form mechanics and
  anti-spam field, voice features, the HubSpot integration, or any secrets.
- No em dashes anywhere. UK English. Full name "Veridian Revenue Partners" in body copy
  wherever the supplied copy uses it; never shorten what the copy spells out.
- Use guarded one-time transforms consistent with house patterns so repeat runs do not
  duplicate nav items, cards or articles.

## 7. After the changes

- Search the codebase and stored content for leftover old copy on the replaced pages
  (e.g. the old hero headlines, the former employer's name anywhere, the old "£5m to £100m"
  range) and confirm none remains.
- Run the full self test suite; it must pass with zero failures. Update any checks that
  assert on the old copy so they assert on the new copy instead (same intent, new text).
- Confirm every page returns 200 on desktop and mobile widths with no broken images, links,
  layouts or animations: home, all six service pages, track record, about, contact,
  /insights and all thirteen article pages.
- Verify article schema markup is valid JSON-LD and the sitemap includes the new pages and
  all articles.
- Commit with a clear message.
