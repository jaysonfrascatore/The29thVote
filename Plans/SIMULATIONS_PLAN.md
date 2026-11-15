# Simulations tab: plan (not built yet)

A new tab, light purple, that runs 11,111 Monte Carlo simulations of the Senate Democratic leader vote
(Chuck Schumer vs. Chris Van Hollen, 56 voters, 29 to win). It explains *why* each senator leans one way,
lets readers lock senators to a side and see how everyone else shifts, and keeps an append-only trend line.
These are simulations, not predictions, and the page must say so.

## 1. Senator scores (built from sourced factors, never random)
Each senator gets a lean score; a logistic function turns it into P(votes Schumer).
Weights set by Jayson:
- Public stance on the tracker, or a public switch: **±2.0** (near-certain, cap about 97% because the ballot is secret)
- Policy positions: **±0.5** each (e.g. Medicare for All cosponsor → Van Hollen; calls to be bolder / break from the old way → Van Hollen)
- Party rank: **±0.5** (leadership posts, committee chairs → Schumer)
- Smaller signals: **±0.25** (e.g. freshman who ran on change)
Strength tags: 0.25 / 0.5 / 0.75 / 1 (1 = solid, unmovable). Every factor needs a checkable source.
Labels from the final percentage: Safe, Likely, Lean, Toss-up.

## 2. Correlation (so filtering shows influence)
Each simulation also draws shared swings: whole caucus, progressive group, establishment group, same-state partners.
Filtering = keep only simulations matching the locks (e.g. Andrews → Van Hollen, Ossoff → Van Hollen),
then recount everyone's odds and show who shifted most ("significance").

## 3. Tab contents
- Headline: P(Schumer ≥ 29), P(Van Hollen ≥ 29), P(28–28 tie), median Schumer votes with a range
- Histogram of Schumer vote counts from the lowest to the highest seen; tap a bar for a few sample simulations as seat charts (never list all 11,111)
- Senator list: Schumer-blue / Van Hollen-teal bar per senator, label, "X of 11,111 simulations", reasons with sources; tap to lock a side
- Note: "These are simulations, not predictions."

## 4. Trend over time
Every hourly check reruns the simulations with a fixed seed and appends one point (time, median, low/high bounds,
P(Schumer), P(Van Hollen), P(tie)) to an append-only log in the repo. Past points are never edited, so drops stay visible.
Line chart: median with a shaded band; hover tooltip like the site's tooltips but semi-transparent, with a line that
follows the cursor; mark public switches.

## Build order
1. Scoring sheet: all 56 senators with factors + sources, for Jayson to review and adjust
2. Simulation engine + Simulations tab
3. Trend chart + teach the hourly scheduled check (trigger trig_019KDvMdSrLvmitNvrLm18dt) to append a point each run

## Cautions
- The policy weights are a thesis; show factors and weights openly.
- As more senators commit publicly, the range should narrow on its own.

## Site notes for whoever picks this up
- Single-file site: index.html (CRLF line endings). Data lives between the `DATA (edit this block on each update)` markers.
- Categories: Support (Schumer), Unclear, Support Van Hollen, Will not support (Opposing Schumer, no pick yet), NO_POSITION.
- Colors: Support #2F6FD0, Van Hollen #12A6CC, Unclear #8E5BC8, no-pick #9ADBEA, none #B8BDC4; candidate marbles Schumer #03045E, Van Hollen #06566B.
- Photos: `Senator Photos/<Lastname>.png` (two-word last names use `_`), helper `avatar(name, st, color, size)`.
- Hourly check runs 9 AM to midnight Eastern and only edits the data block + Updates/ CSV.
