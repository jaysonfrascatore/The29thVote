// Adds one point to the Simulations trend log (SIM_HISTORY in index.html).
// Usage: node Updates/sim_point.js "Nov. 15, 2 PM"
// Runs the same 11,111-run engine the page uses (fixed seed), then appends
// [time, median, low, high, P(Schumer 29), P(Van Hollen 29), P(tie)] as a new line.
// It never edits earlier points.
const fs = require("fs"), vm = require("vm"), path = require("path");
const when = process.argv[2];
if (!when) { console.error('Give the time label, e.g. node Updates/sim_point.js "Nov. 15, 2 PM"'); process.exit(1); }
const file = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(file, "utf8");
const cut = (a, b) => { const i = html.indexOf(a); const j = html.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error("Marker not found: " + a); return html.slice(i, j); };
const data = cut("/* ================= DATA (edit this block on each update) ================= */", "\n/* ====");
const sims = cut("/* ================= SIMULATIONS", "const simEl");
const cats = html.match(/const CATS = \[[^\]]*\];/)[0];
const ctx = {}; vm.createContext(ctx);
vm.runInContext(data + "\n" + cats + "\n" + sims + "\nthis.out = (() => { const S = simBuild(); const s = S.stats({}); const r = x => Math.round(1000 * x / s.kept) / 10; return [s.med, s.lo, s.hi, r(s.sWin), r(s.vWin), r(s.tie)]; })();", ctx);
const pt = [when, ...ctx.out];
const line = "  [" + pt.map(v => JSON.stringify(v)).join(", ") + "],";
const nl = html.includes("\r\n") ? "\r\n" : "\n";
let out;
if (/const SIM_HISTORY = \[\];/.test(html)) out = html.replace("const SIM_HISTORY = [];", "const SIM_HISTORY = [" + nl + line + nl + "];");
else {
  const k = html.indexOf("const SIM_HISTORY = [");
  const end = html.indexOf(nl + "];", k);
  if (k < 0 || end < 0) throw new Error("SIM_HISTORY not found");
  out = html.slice(0, end) + nl + line + html.slice(end);
}
fs.writeFileSync(file, out);
console.log("Added trend point:", line.trim());
