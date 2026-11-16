// Shared helper for sim_point.js and sim_backfill.js: loads the site's data block and
// simulation engine from index.html and runs them in Node, exactly as the page does.
const fs = require("fs"), vm = require("vm"), path = require("path");
const FILE = path.join(__dirname, "..", "index.html");
function load() {
  const html = fs.readFileSync(FILE, "utf8");
  const cut = (a, b) => { const i = html.indexOf(a); const j = html.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error("Marker not found: " + a); return html.slice(i, j); };
  let code = cut("/* ================= DATA (edit this block on each update) ================= */", "\n/* ====") + "\n" +
    html.match(/const CATS = \[[^\]]*\];/)[0] + "\n" + cut("/* ================= SIMULATIONS", "const simEl");
  // var instead of const, so the backfill can swap in past positions
  code = code.replace(/^const (SENATORS|NO_POSITION|SIM_FACTORS|LEADER_VOTE|HISTORY|HISTORY_START) =/gm, "var $1 =");
  const ctx = {}; vm.createContext(ctx); vm.runInContext(code, ctx);
  return { html, ctx };
}
// One trend point: [time, mean Schumer votes, low (10th pct), high (90th pct), P(Schumer 29+), P(Van Hollen 29+), P(28-28 tie), what changed]
function point(ctx, when, note) {
  const s = vm.runInContext("simBuild().stats({})", ctx);
  const r = x => Math.round(1000 * x / s.kept) / 10;
  return [when, Math.round(s.mean * 100) / 100, s.lo, s.hi, r(s.sWin), r(s.vWin), r(s.tie), note];
}
const MONTHS = { "Jan.": 0, "Feb.": 1, "March": 2, "April": 3, "May": 4, "June": 5, "July": 6, "Aug.": 7, "Sept.": 8, "Oct.": 9, "Nov.": 10, "Dec.": 11 };
// "Nov. 13, 12:45 AM" -> minutes since Jan 1, 2026 (Eastern wall clock)
function stamp(label) {
  const m = label.match(/^(\w+\.?) (\d+), (\d+)(?::(\d+))? (AM|PM)$/);
  if (!m) throw new Error("Can't read time: " + label);
  let h = +m[3] % 12 + (m[5] === "PM" ? 12 : 0);
  return Date.UTC(2026, MONTHS[m[1]], +m[2], h, +(m[4] || 0)) / 60000;
}
function writeHistory(html, rows) {
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const line = p => "  [" + p.map(v => JSON.stringify(v)).join(", ") + "],";
  const k = html.indexOf("const SIM_HISTORY = [");
  if (k < 0) throw new Error("SIM_HISTORY not found");
  const end = html.indexOf("];", k) + 2;
  return html.slice(0, k) + "const SIM_HISTORY = [" + nl + rows.map(line).join(nl) + nl + "];" + html.slice(end);
}
function appendHistory(html, row) {
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const line = "  [" + row.map(v => JSON.stringify(v)).join(", ") + "],";
  if (/const SIM_HISTORY = \[\];/.test(html)) return html.replace("const SIM_HISTORY = [];", "const SIM_HISTORY = [" + nl + line + nl + "];");
  const k = html.indexOf("const SIM_HISTORY = ["), end = html.indexOf(nl + "];", k);
  if (k < 0 || end < 0) throw new Error("SIM_HISTORY not found");
  return html.slice(0, end) + nl + line + html.slice(end);
}
// Plain-English summary of moves, e.g. "Ron Wyden → Unclear: said whoever backs Medicare for All gets his vote."
const SHOW = { "Support": "Support Schumer", "Unclear": "Unclear", "No public position": "No public position", "Will not support": "Opposing Schumer, no pick yet", "Opposing Schumer": "Opposing Schumer, no pick yet", "Support Van Hollen": "Support Van Hollen" };
function describe(entries) {
  const out = [];
  entries.forEach(e => {
    (e[2] || []).forEach(m => out.push(`${m[0]} → ${SHOW[m[3]] || m[3]}: ${m[4]}`));
    if (typeof e[3] === "string") out.push(e[3]);
  });
  return out.filter(Boolean).join(" ");
}
module.exports = { FILE, load, point, stamp, writeHistory, appendHistory, describe, SHOW };
