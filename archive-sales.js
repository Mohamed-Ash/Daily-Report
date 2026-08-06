#!/usr/bin/env node
// Archives a daily snapshot of the Sales / Branches / Completed+5K / Teams tables
// (fetched live from Google Sheets, same source the dashboard reads client-side)
// into history/sales-<dateKey>.json, so the dashboard can show past days' data
// instead of only the live numbers.
const https = require('https');
const fs    = require('fs');

const SHEET_ID    = '1jLBqnbHc1ej2wnMSQiw5V6L6Xwltx4pVwO9E_aYr6IQ';
const GID_BRANCH   = '1078209926';
const GID_COMPLETE = '699409480';
const GID_TEAMS    = '1494121778';

function httpGetText(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if ([301,302,307,308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
        return resolve(httpGetText(res.headers.location, maxRedirects - 1));
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

// Char-by-char CSV parser — mirrors parseCsvProper() in index.html so multi-line
// quoted headers (the sheet's column titles wrap across lines) parse correctly.
function parseCsvProper(text) {
  const rows = []; let row = [], cur = '', inQ = false, i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i+1] === '"') { cur += '"'; i += 2; continue; }
      if (ch === '"') { inQ = false; i++; continue; }
      cur += ch; i++; continue;
    }
    if (ch === '"') { inQ = true; i++; continue; }
    if (ch === ',') { row.push(cur); cur = ''; i++; continue; }
    if (ch === '\r' && text[i+1] === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; i += 2; continue; }
    if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; i++; continue; }
    cur += ch; i++;
  }
  if (row.length || cur) { row.push(cur); rows.push(row); }
  return rows;
}

function gvizUrl(gid) {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
  return gid ? `${base}&gid=${gid}` : base;
}

async function fetchRows(gid) {
  const text = await httpGetText(gvizUrl(gid));
  return parseCsvProper(text);
}

// Sales + Teams live on the same tab (default/first sheet).
function parseSales(rows) {
  let dataStart = 1;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    if ((rows[i][0] || '').includes('اسم السيلز')) { dataStart = i + 1; break; }
  }
  const salesRows = [];
  let totalBig = 0;
  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i];
    const name = (row[0] || '').trim();
    if (!name) continue;
    const small = parseInt((row[1] || '').replace(/[^\d]/g, '')) || 0;
    const big   = parseInt((row[2] || '').replace(/[^\d]/g, '')) || 0;
    const total = small + big;
    const isTotal = name.includes('الاجمالي') || name.includes('الإجمالي');
    if (isTotal) totalBig = big;
    salesRows.push({ name, small, big, total, isTotal });
  }
  return { rows: salesRows, totalBig };
}

function parseTeams(rows) {
  const hdrs = ['نورا و منار ومحمد بيومي', 'ندي وعمر و اسراء احمد', 'رحمه وهبه و ابراهيم درويش', 'المجموع'];
  let vals = null;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 9) continue;
    const f = (row[5] || '').trim(), g = (row[6] || '').trim();
    // The header row (team names) also has F/G non-empty — only the numbers row qualifies.
    if (f !== '' && g !== '' && !isNaN(parseFloat(f)) && !isNaN(parseFloat(g))) {
      vals = [f, g, (row[7] || '').trim(), (row[8] || '').trim()];
      break;
    }
  }
  return { headers: hdrs, values: vals || ['0','0','0','0'] };
}

function parseGenericTable(rows) {
  if (!rows.length) return { headers: [], rows: [] };
  const headers = rows[0];
  const dataRows = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.some(c => c.trim())) dataRows.push(row);
  }
  return { headers, rows: dataRows };
}

async function main() {
  console.log('Fetching sales tables from Google Sheets...');
  const [salesRaw, branchRaw, completeRaw] = await Promise.all([
    fetchRows(null),
    fetchRows(GID_BRANCH),
    fetchRows(GID_COMPLETE),
  ]);

  const sales     = parseSales(salesRaw);
  const teams     = parseTeams(salesRaw); // same tab as sales
  const branches  = parseGenericTable(branchRaw);
  const completed = parseGenericTable(completeRaw);

  const dateKey = new Date().toISOString().slice(0, 10);
  const updatedAt = new Date().toLocaleString('ar-EG', {
    timeZone: 'Africa/Cairo', weekday: 'long', year: 'numeric',
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const snapshot = { date: dateKey, updatedAt, sales, branches, completed, teams };

  if (!fs.existsSync('history')) fs.mkdirSync('history');
  fs.writeFileSync(`history/sales-${dateKey}.json`, JSON.stringify(snapshot));
  console.log(`✓ history/sales-${dateKey}.json saved`);

  let index = [];
  try { index = JSON.parse(fs.readFileSync('history/sales-index.json', 'utf8')); } catch {}
  if (!index.includes(dateKey)) index = [dateKey, ...index].slice(0, 90);
  fs.writeFileSync('history/sales-index.json', JSON.stringify(index));
  console.log(`✓ history/sales-index.json saved (${index.length} entries)`);

  console.log('Sales rows:', sales.rows.length, '| totalBig:', sales.totalBig);
  console.log('Teams values:', teams.values);
  console.log('Branches rows:', branches.rows.length);
  console.log('Completed rows:', completed.rows.length);
}

main().catch(e => { console.error('archive-sales.js failed:', e.message); process.exit(1); });
