import { useCallback, useEffect, useMemo, useState } from "react";
import { getArticlesBrief } from "../services/negoceService";

/**
 * The articles a document's lines refer to — and only those.
 *
 * Forms used to download the whole catalogue to find the unit, packagings,
 * stock and supplier prices of the few articles on their lines. Now an
 * article enters this index when it is picked (ArticlePicker gives its
 * light row) or, for lines that already exist, by one /products/brief
 * call for the missing ids (≤ 100 per call). Entries are shared between
 * forms and refreshed after a couple of minutes (stock moves).
 */
const STORE = new Map(); // `${company}:${id}` -> { at, product }
const FRESH_MS = 2 * 60 * 1000;
const listeners = new Set();

const keyOf = (companyId, id) => `${companyId}:${id}`;
const idOf = (v) => String(v?._id || v || "");

export function rememberArticles(companyId, products = []) {
  if (!companyId) return;
  const now = Date.now();
  products.forEach((p) => p?._id && STORE.set(keyOf(companyId, p._id), { at: now, product: p }));
  listeners.forEach((fn) => fn());
}

export function useArticleIndex(companyId, ids = []) {
  const [version, setVersion] = useState(0);
  const wanted = useMemo(() => [...new Set(ids.map(idOf).filter((id) => /^[a-f0-9]{24}$/i.test(id)))].sort(), [ids]);
  const wantedKey = wanted.join(",");

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    listeners.add(bump);
    return () => listeners.delete(bump);
  }, []);

  useEffect(() => {
    if (!companyId || !wanted.length) return;
    const now = Date.now();
    const missing = wanted.filter((id) => {
      const hit = STORE.get(keyOf(companyId, id));
      return !hit || now - hit.at > FRESH_MS;
    });
    if (!missing.length) return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < missing.length && !cancelled; i += 100) {
        try {
          rememberArticles(companyId, await getArticlesBrief(companyId, missing.slice(i, i + 100)));
        } catch {
          /* the lines keep their own description / unit */
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, wantedKey]);

  // Same Map / list object until something changes, so effects keyed on them stay quiet.
  const byId = useMemo(() => {
    const m = new Map();
    if (companyId) wanted.forEach((id) => { const hit = STORE.get(keyOf(companyId, id)); if (hit) m.set(id, hit.product); });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, wantedKey, version]);
  const list = useMemo(() => [...byId.values()], [byId]);
  const remember = useCallback((p) => rememberArticles(companyId, [p]), [companyId]);
  return { byId, list, remember };
}
