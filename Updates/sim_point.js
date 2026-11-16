// Adds one point to the Simulations trend log (SIM_HISTORY in index.html).
// Usage: node Updates/sim_point.js "Nov. 16, 2 PM"
// Runs the same 11,111-run engine the page uses (fixed seed) and appends
// [time, average Schumer votes, low, high, % Schumer 29+, % Van Hollen 29+, % tie, what changed].
// "What changed" comes from the HISTORY entry logged for this same time, if there is one.
// It never edits earlier points.
const fs = require("fs");
const L = require("./sim_lib.js");
const when = process.argv[2];
if (!when) { console.error('Give the time label, e.g. node Updates/sim_point.js "Nov. 16, 2 PM"'); process.exit(1); }
L.stamp(when); // checks the format
const { html, ctx } = L.load();
const same = ctx.HISTORY.filter(e => L.stamp(e[0]) === L.stamp(when));
let note = L.describe(same) || "No change in public positions.";
if (ctx.LEADER_VOTE.movedUp) {
  const log = (html.match(/const SIM_HISTORY = \[[\s\S]*?\n\];/) || [""])[0];
  if (!/Leader vote moved up/.test(log)) note = `Leader vote moved up to ${ctx.LEADER_VOTE.date}, which adds about 1.25 expected votes for Schumer. ` + (note === "No change in public positions." ? "" : note);
}
const row = L.point(ctx, when, note.trim());
fs.writeFileSync(L.FILE, L.appendHistory(html, row));
console.log("Added trend point:", JSON.stringify(row));
