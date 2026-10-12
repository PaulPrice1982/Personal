# Revenue Engine Check: new interactive page


Add an interactive self-check to www.veridian-partners.com. Visitors score 18 statements, see their engine score, their biggest gaps and a broad value band, and are offered a full read in exchange for their details. The working prototype is `revenue-engine-check-prototype.html` (in this folder). Match its behaviour and copy exactly, restyled into the site theme.

## What to do

1. Create a new page at `/revenue-engine-check` using the site's standard page template (transparent header over a banner, theme tokens, footer).
2. Port the prototype's questions, scoring and gate as a self-contained component. The scoring is plain JavaScript with no dependencies.
3. Remove the prototype-only parts: the "Example answers are loaded" notice, the Clear button and the pre-ticked example answers. The live page opens with nothing ticked.
4. Replace the prototype's line "Prototype: nothing is sent from this page" and the prototype confirmation message with the live versions in "Submission" below.
5. Point every existing "Take the 3-minute revenue leakage check" button on the site at `/revenue-engine-check`, relabelled **Take the Revenue Engine Check**. Redirect `/revenue-leakage-check` to `/revenue-engine-check` with a 301.
6. Add **Revenue Engine Check** to the footer Company column.

## Page settings

| Field | Value |
|---|---|
| Title tag | The Revenue Engine Check \| Veridian Revenue Partners |
| Meta description | Score your go-to-market engine in five minutes. See your biggest gaps and what businesses like yours often leave on the table. |
| H1 | The Revenue Engine Check |
| Eyebrow | Five-minute self-check |
| Banner | Reuse an existing banner in the house style (deep pine wash). `banner2-pipeline-review.jpg` suits it. |

## Questions

Nine areas, two statements each, scored 1 to 4: 1 Not in place, 2 In place but patchy, 3 In place and mostly followed, 4 In place, followed and measured. Use the exact wording in the prototype's `AREAS` array. Each score is a radio group of four, keyboard operable, with a visible focus state.

One extra question above the statements: "Roughly how much annual recurring revenue do you have?" with four bands (£5m to £15m, £15m to £50m, £50m to £150m, £150m to £500m). Default to £15m to £50m.

## Scoring (do not change without updating the workbook)

- Area score = average of its two answers (shown once at least one is answered).
- Engine score = average of the scored areas, to one decimal place.
- Rating: 3.25 and above "Running well"; 2.5 to 3.24 "Patchy"; below 2.5 "Real gaps".
- Biggest gaps = up to three lowest areas scoring below 3.25, shown only when all 18 are answered.
- Value band: shown only when all 18 are answered. It is the prototype's `band()` function. It uses the midpoint of the chosen ARR band, default assumptions for an anonymous visitor (`A` object) and the same lever logic as the Excel workbook: uplifts and usage driven by the contract monetisation score; retention by the customer success and renewals scores; conversion by marketing, leads, new business, forecasting and capacity; stack saving by the RevOps score. Each lever is multiplied by the gap left open, (4 minus score) divided by 3. The revenue total is capped at 12% of ARR. The low figure is rounded down and the high figure rounded up to two significant figures.
- The page never shows a single pounds figure, a fee or a promised return. Keep the line under the band exactly: "A year, for a business your size with these scores. A broad band, not your number: your real figure needs your own data."

## Gate

Fields: name, work email, company (all required). Two separate checkboxes:

- **Required:** "Please contact me about my result. I've read the privacy statement." Link "privacy statement" to `/privacy`.
- **Optional, unticked by default:** "Also send me occasional articles." Only visitors who tick this may be added to the weekly email.

Validate on submit and show the prototype's plain error messages. Block personal webmail only if you can do it without false positives; otherwise accept any valid address.

## Submission

On a valid submit, send one email to **hello@veridian-partners.com** through the site's existing contact-form handler, subject `Revenue Engine Check: [Company] ([engine score])`, containing:

- name, email, company, ARR band, both consent answers and a timestamp;
- all 18 answers, the nine area scores, the engine score and rating;
- the three biggest gaps and the value band shown.

Then replace the gate with this confirmation:

> **Thanks, [first name].** A partner will read your result and reply within one working day with your full read and a time to talk it through.

Do not store answers in the browser beyond the session, and do not send them to any third party other than the existing form handler. If the handler fails, keep the form, show "That didn't send. Please try again, or email hello@veridian-partners.com." and do not show the confirmation.

## Privacy

Before go-live, add the paragraph in `privacy-addition.md` to `/privacy`, word for word.

## Analytics (only if consent for analytics has been given)

Events: `rec_started` (first answer), `rec_completed` (18 answered), `rec_gate_submitted`, `rec_gate_error`. No answer values in analytics.

## Follow-up (for Veridian Revenue Partners, not the build)

Reply within one working day. Open with their lowest area and the band, attach the blank Excel version of the Revenue Engine Check so they can add their own numbers, and offer 30 minutes. The response time is the point: the check only generates conversations if the reply is fast and personal.

## Acceptance checks

- Works at 400px wide with no sideways scroll; result card drops below the questions on narrow screens.
- Readable in light and dark themes.
- All 18 statements, the band and the gaps match the prototype for the same answers (for example, the prototype's example answers at £15m to £50m give an engine score of 2.0 and a band of £540k to £1.9m).
- No em dashes, and the firm is "Veridian Revenue Partners" in full in every heading, title and sign-off.
