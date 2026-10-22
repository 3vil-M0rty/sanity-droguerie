/** A user's search text, matched literally inside a $regex (no ReDoS, no pattern injection). */
const escapeRegex = (s) => String(s ?? "").slice(0, 200).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { escapeRegex };
