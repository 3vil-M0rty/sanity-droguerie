/**
 * Minimal, dependency-free CSV writer. Parsing CSV correctly has
 * real edge cases (quoted fields spanning newlines, escaped quotes)
 * — that's why the bulk-import side uses the battle-tested
 * `csv-parse` library instead of hand-rolling it. Writing is the
 * much simpler direction: every field just needs quoting whenever
 * it contains a comma, quote, or newline, with internal quotes
 * doubled — a few lines of code, not worth a dependency for.
 */
/**
 * Spreadsheet formula injection: a cell typed by a user (customer,
 * supplier, employee, article name…) starting with = + - @ would run as
 * a formula when the CSV is opened in Excel (=HYPERLINK(…) can leak
 * other cells). Such text gets a leading apostrophe; plain numbers
 * (e.g. -120.00 on a credit note) are left alone.
 */
function neutralizeFormula(value) {
  if (value === null || value === undefined || typeof value === "number") return value;
  const s = String(value);
  if (/^[=+\-@\t\r]/.test(s) && !/^[-+]?\d[\d\s.,]*$/.test(s)) return `'${s}`;
  return s;
}

function toCsvField(value) {
  const safe = neutralizeFormula(value);
  const str = safe === null || safe === undefined ? "" : String(safe);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * `rows` is an array of arrays (first row is normally the header).
 * Returns a CRLF-joined CSV string, since that's what Excel expects.
 */
function toCsv(rows) {
  return rows.map((row) => row.map(toCsvField).join(",")).join("\r\n");
}

/**
 * Sets the response headers for a CSV file download and sends it.
 * Prefixes a UTF-8 BOM — without it, Excel (still, in 2026) opens a
 * UTF-8 CSV with accented French characters or Arabic names as
 * garbled text instead of detecting the encoding correctly.
 */
function sendCsv(res, filename, rows) {
  const csv = toCsv(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(`\uFEFF${csv}`);
}

module.exports = {
  neutralizeFormula, toCsv, sendCsv };
