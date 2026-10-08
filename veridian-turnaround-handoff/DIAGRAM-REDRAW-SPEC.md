# Diagram redraw: four house diagrams restyled to match the plan-vs-engine figure

The four most prominent animated diagrams on the site are being redrawn in the same visual
language as the plan-vs-engine figure that now sits on the Turnaround and recovery page:
light ground (#F5F7F2), pine #1F3D2B and sage #9CAF88 strokes, muted red #B03A2E at low
opacity for the before state, glass tags with green ticks, 10 second looping animation,
reduced motion shows the finished state.

## What to do

In `src/diagrams.js`, replace the `svg` markup of these four existing DIAGRAMS entries with
the supplied artwork, byte for byte, exactly as was done for the `plan-vs-engine` entry
(the supplied file already includes its own light-ground wrapper div, scoped styles and
namespaced classes, so nothing needs to be added around it):

| DIAGRAMS key | Supplied file (fetch raw) |
|---|---|
| `leakage` | https://raw.githubusercontent.com/PaulPrice1982/personal/main/veridian-turnaround-handoff/diagram-leakage.html |
| `revops` | https://raw.githubusercontent.com/PaulPrice1982/personal/main/veridian-turnaround-handoff/diagram-revops.html |
| `ned` | https://raw.githubusercontent.com/PaulPrice1982/personal/main/veridian-turnaround-handoff/diagram-ned.html |
| `services` | https://raw.githubusercontent.com/PaulPrice1982/personal/main/veridian-turnaround-handoff/diagram-services.html |

Keep the four keys exactly as they are so every page block that references them picks the
new artwork up automatically. Keep each entry's `name` as is; update its descriptive
`hint`/description text only if it no longer matches the new artwork.

Note on the `services` diagram: the new artwork shows FOUR services (Contract monetisation,
Revenue operations, Turnaround and recovery, Advisory) converging on one outcome, which
reflects the service line added recently. The old three-service version is superseded.

## Constraints

- Change nothing else: no other diagrams, no page content, no styles outside these four
  entries.
- Do not touch data/, admin, booking, voice features, HubSpot integration, or secrets.
- The artwork must be preserved byte for byte; do not reformat, minify or re-indent it.
- No em dashes anywhere (the supplied artwork contains none).
- After the swap, run the self test suite and confirm it is green, and confirm the pages
  that render these diagram kinds still return 200 and show the new artwork.
