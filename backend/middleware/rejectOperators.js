/**
 * Rejects request input carrying MongoDB operators.
 *
 * Express turns `?email[$ne]=x` into `{ email: { $ne: "x" } }`, and a JSON
 * body can carry `{ "email": { "$regex": "^a" } }` or `{ "$rename": … }`.
 * Passed into a Mongoose filter or update, such a value becomes a query
 * operator (login probing across accounts, `$rename` on an update…).
 * The application never sends keys starting with "$" (nor "__proto__",
 * "constructor", "prototype"), so any request carrying one is refused
 * with 400 before reaching a route.
 *
 * Deliberately not mongoose's global `sanitizeFilter`: that would also
 * neutralise the application's own `$in` / `$gte` filters.
 */
const FORBIDDEN = /^\$|^__proto__$|^constructor$|^prototype$/;

function findForbiddenKey(value, depth = 0) {
  if (!value || typeof value !== "object" || depth > 20) return null;
  if (Buffer.isBuffer(value)) return null;
  for (const key of Object.keys(value)) {
    if (FORBIDDEN.test(key)) return key;
    const nested = findForbiddenKey(value[key], depth + 1);
    if (nested) return nested;
  }
  return null;
}

function rejectOperators(req, res, next) {
  const key = findForbiddenKey(req.query) || findForbiddenKey(req.body) || findForbiddenKey(req.params);
  if (key) return res.status(400).json({ success: false, message: `Invalid input (forbidden key "${key}")` });
  return next();
}

module.exports = { rejectOperators, findForbiddenKey };
