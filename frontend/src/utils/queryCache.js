/**
 * A tiny cache for list pages and lookups (no React Query in this project,
 * and a few dozen lines cover what the inventory needs):
 *
 *  - a page already seen comes back instantly (going back to page 1, or
 *    re-opening a family) while it is younger than `ttl`;
 *  - two identical requests in flight share one HTTP call;
 *  - the next page can be prefetched without being rendered;
 *  - it holds a bounded number of pages (oldest dropped) — it is a cache of
 *    what was looked at, never a copy of the catalogue.
 *
 * Keys are plain strings built from the query; `invalidate(prefix)` drops
 * every entry starting with it (after an edit, a stock movement…).
 */
const MAX_ENTRIES = 60;
const entries = new Map(); // key -> { at, value }
const inflight = new Map(); // key -> Promise

function remember(key, value) {
  entries.delete(key);
  entries.set(key, { at: Date.now(), value });
  while (entries.size > MAX_ENTRIES) entries.delete(entries.keys().next().value);
}

/** The cached value if fresh enough, else undefined. */
export function peek(key, ttl = 30000) {
  const hit = entries.get(key);
  return hit && Date.now() - hit.at < ttl ? hit.value : undefined;
}

/** Cached value, or one shared call to `fetcher`. */
export function cached(key, fetcher, ttl = 30000) {
  const hit = peek(key, ttl);
  if (hit !== undefined) return Promise.resolve(hit);
  if (inflight.has(key)) return inflight.get(key);
  const p = Promise.resolve()
    .then(fetcher)
    .then((value) => { remember(key, value); return value; })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/** Warm the cache in the background (errors ignored). */
export function prefetch(key, fetcher, ttl = 30000) {
  if (peek(key, ttl) !== undefined || inflight.has(key)) return;
  cached(key, fetcher, ttl).catch(() => {});
}

export function invalidate(prefix = "") {
  for (const key of [...entries.keys()]) if (key.startsWith(prefix)) entries.delete(key);
}

/** Stable key for a query object (undefined / empty values ignored, keys sorted). */
export function keyOf(name, params = {}) {
  const parts = Object.keys(params).sort()
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .map((k) => `${k}=${params[k]}`);
  return `${name}?${parts.join("&")}`;
}
