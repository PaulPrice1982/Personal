# Build spec: Insights (blog) section

Add a blog to the Veridian Revenue Partners website in
`artifacts/veridian-revenue-partners/`, following the same discipline as the
turnaround page: guarded one-time delivery, existing block vocabulary, no
operator content overwritten, self-test extended and green.

## Structure

- Listing page at `/insights`, titled `Insights`, delivered once: a short
  intro line ("Field notes on revenue: leakage, forecasting and turnarounds,
  from the operator's side of the table.") and a link list of the posts,
  newest first, each with title and a one-line summary. Add `Insights` to the
  main navigation after Track record, and to the footer Company column,
  with the same guarded pattern as the turnaround delivery.
- Each post is a page with slug `insights/<post-slug>`, built from the
  site's rich text blocks, with a hero (title + standfirst), the body copy
  from the markdown files alongside this spec, and a closing inline CTA to
  the revenue leakage check (posts 1 and 3) or to Contact (post 2).
  Nested slugs with one slash are now valid.
- Posts carry a visible date line under the title: use October 2026 for all
  three. Author line: Paul Price.

## The three posts (markdown files in this directory)

1. `post-1-revenue-leakage.md` — slug `insights/revenue-leakage`,
   summary: "Three to five per cent of revenue is typically being consumed
   but not billed. Where it hides and what it is worth."
2. `post-2-forecast.md` — slug `insights/the-forecast-that-moves`,
   summary: "If the forecast moves every week and nobody measures the miss,
   nobody learns. The fix is a discipline, not a CRM field."
3. `post-3-plan-vs-engine.md` — slug `insights/plan-versus-engine`,
   summary: "When the number is behind, test the plan against the engine
   underneath it. The four places the money usually is."

Use the markdown content verbatim as the body, dropping the top-level
heading (it becomes the page hero) and the author italics line (replaced by
the date and author line). The closing italic line of post 1 becomes the
inline CTA. No em dashes anywhere; the files contain none.

## SEO

- Listing: title "Insights", description "Field notes on revenue leakage,
  forecasting and turnarounds for software businesses, from Veridian
  Revenue Partners."
- Posts: title = post title (renderer appends the site name); description =
  the summary lines above.

## Self-test

Extend scripts/selftest.js: listing page published with all three post
links, each post rendering with date and author line, nav and footer
entries delivered and guarded, nested slugs pass the SEO audit. Full suite
green before finishing.
