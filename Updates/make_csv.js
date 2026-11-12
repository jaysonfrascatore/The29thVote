#!/usr/bin/env node
// Builds one timestamped CSV snapshot of every senator for The 29th Vote.
// Usage (from the repo root):
//   node Updates/make_csv.js --date 2026-11-12 --time "6:00 PM" \
//     --moves '[["Ed Markey (MA)","No public position","Unclear"]]' > Updates/2026-11-12_1800.csv
// --moves lists only the changes found in THIS run (leave it out, or pass [], when nothing changed).
const fs = require("fs");
const path = require("path");

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
if (!args.date || !args.time) { console.error("Need --date YYYY-MM-DD and --time \"h:mm AM/PM\""); process.exit(1); }
const moves = JSON.parse(args.moves || "[]");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8").replace(/\r/g, "");
const start = html.indexOf("/* ================= DATA");
const end = html.indexOf("/* ====", start + 10);
const block = html.slice(start, end);
const data = new Function(block + "; return { TOTAL, NEEDED, SENATORS, NO_POSITION };")();

const rows = [];
for (const cat of ["Support", "Unclear", "Will not support"])
  for (const p of data.SENATORS[cat]) rows.push({ name: p[0], st: p[1], cat });
for (const p of data.NO_POSITION) rows.push({ name: p[0], st: p[1], cat: "No public position" });
rows.sort((a, b) => a.st.localeCompare(b.st) || a.name.localeCompare(b.name));

const support = data.SENATORS["Support"].length;
const total = `${support} of ${data.NEEDED}`;
const q = s => /[",\n]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : String(s);
const byName = Object.fromEntries(moves.map(m => [m[0], m]));

const out = ["Time,Date,State,Senator,Movement,Vote Total"];
for (const r of rows) {
  const m = byName[`${r.name} (${r.st})`];
  const movement = m ? `Moved from ${m[1]} to ${m[2]}` : `No change (${r.cat})`;
  out.push([args.time, args.date, r.st, r.name, movement, total].map(q).join(","));
}
process.stdout.write(out.join("\n") + "\n");
