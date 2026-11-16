// One-time rebuild of the Simulations trend (SIM_HISTORY) back to the tracker's launch on Nov. 11.
// For every hourly check time inside the schedule window (8 AM to 1 AM through the Nov. 15 midnight run,
// 9 AM to midnight after that), it rewinds each senator's tracker group to what it was then (using HISTORY),
// keeps the scoring sheet's other factors as they were at launch, and reruns the 11,111 simulations.
// Usage: node Updates/sim_backfill.js "Nov. 15, 11 PM"   (the last check to include)
const fs = require("fs"), vm = require("vm");
const L = require("./sim_lib.js");
const until = process.argv[2];
if (!until) { console.error('Give the last check time, e.g. "Nov. 15, 11 PM"'); process.exit(1); }
const { html, ctx } = L.load();
const norm = c => c === "Opposing Schumer" ? "Will not support" : c;
const now = {};
for (const c of Object.keys(ctx.SENATORS)) ctx.SENATORS[c].forEach(r => now[r[0]] = c);
ctx.NO_POSITION.forEach(r => now[r[0]] = "No public position");
const hist = ctx.HISTORY.map(e => ({ e, t: L.stamp(e[0]) })).sort((a, b) => a.t - b.t);
// rewind to the start
const start = { ...now };
for (let i = hist.length - 1; i >= 0; i--) for (let j = hist[i].e[2].length - 1; j >= 0; j--) { const m = hist[i].e[2][j]; start[m[0]] = norm(m[2]); }
const counts = {}; Object.values(start).forEach(c => counts[c] = (counts[c] || 0) + 1);
for (const [c, n] of Object.entries(ctx.HISTORY_START[1])) if ((counts[c] || 0) !== n) throw new Error(`Start count mismatch for ${c}: ${counts[c]} vs ${n}`);
const baseFactors = ctx.SIM_FACTORS.map(f => f.slice());
const SRC = ["The 29th Vote tracker", "https://jaysonfrascatore.github.io/The29thVote/"];
const STANCE = { "Support": [1, 1, "Tracker: Support Schumer"], "Support Van Hollen": [-1, 1, "Tracker: Support Van Hollen"], "Will not support": [-1, 0.75, "Tracker: Opposing Schumer, no pick yet"] };
function setState(state) {
  const groups = {}; CATS_ORDER.forEach(c => groups[c] = []);
  const np = [];
  for (const [n, c] of Object.entries(state)) { const st = stOf[n]; if (c === "No public position") np.push([n, st]); else groups[c].push([n, st]); }
  ctx.SENATORS = groups; ctx.NO_POSITION = np;
  const f = [];
  baseFactors.forEach(x => { if (x[2] === "S" && state[x[0]] !== now[x[0]] && x[0] !== "Chuck Schumer" && x[0] !== "Chris Van Hollen") return; f.push(x); });
  for (const [n, c] of Object.entries(state)) if (c !== now[n] && STANCE[c]) { const [side, str, what] = STANCE[c]; f.push([n, side, "S", str, what, SRC]); }
  ctx.SIM_FACTORS = f;
}
const CATS_ORDER = ["Support", "Unclear", "Will not support", "Support Van Hollen"];
const stOf = {};
for (const c of Object.keys(ctx.SENATORS)) ctx.SENATORS[c].forEach(r => stOf[r[0]] = r[1]);
ctx.NO_POSITION.forEach(r => stOf[r[0]] = r[1]);
// SIM_SETTINGS etc. live in the context; the engine reads SENATORS/NO_POSITION/SIM_FACTORS as globals
vm.runInContext("var __swap = 1;", ctx);
const label = t => { const d = new Date(t * 60000), h = d.getUTCHours(); return `Nov. ${d.getUTCDate()}, ${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`; };
const first = L.stamp("Nov. 11, 3 PM"), last = L.stamp(until), switchAt = L.stamp("Nov. 15, 12 AM");
const rows = []; let prev = -Infinity, state = { ...start }, hi = 0;
for (let t = first; t <= last; t += 60) {
  const h = new Date(t * 60000).getUTCHours();
  const inWindow = t <= switchAt ? (h >= 8 || h <= 1) : (h >= 9 || h === 0);
  if (!inWindow) continue;
  const since = [];
  while (hi < hist.length && hist[hi].t <= t) { const e = hist[hi].e; e[2].forEach(m => state[m[0]] = norm(m[3])); since.push(e); hi++; }
  setState(state);
  let note = L.describe(since);
  if (!rows.length) note = "Starting point: public positions when the tracker launched." + (note ? " " + note : "");
  rows.push(L.point(ctx, label(t), note || "No change in public positions."));
  prev = t;
}
fs.writeFileSync(L.FILE, L.writeHistory(html, rows));
console.log(`Wrote ${rows.length} points, ${rows[0][0]} to ${rows[rows.length - 1][0]}`);
rows.filter((r, i) => i === 0 || r[7] !== "No change in public positions.").forEach(r => console.log(r.slice(0, 7).join(" | "), "::", r[7].slice(0, 110)));
