/**
 * Sends errors that happen in the user's browser to the server's
 * error monitoring (backend routes/monitoring.js → platform "Erreurs").
 * Only the error message, its stack and the page path are sent —
 * never what the user typed. At most 10 reports per page load, the
 * same message at most once a minute.
 *
 * After a new version is deployed, a tab still running the old one
 * can fail to load a page's code ("Failed to fetch dynamically
 * imported module"): reload once to pick up the new version instead
 * of showing a broken page.
 */

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BUILD = import.meta.env.VITE_BUILD_ID || "";
const recent = new Map();
let sent = 0;

const IGNORED = [/ResizeObserver loop/i, /^Script error\.?$/i, /Non-Error promise rejection captured/i];
const STALE_BUILD = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i;

export function reportError(error, extra = {}) {
  try {
    const message = String(error?.message || error || "").slice(0, 500);
    if (!message || IGNORED.some((r) => r.test(message))) return;
    if (STALE_BUILD.test(message) && reloadOnceForNewVersion()) return;
    const now = Date.now();
    if (sent >= 10 || now - (recent.get(message) || 0) < 60000) return;
    recent.set(message, now);
    sent += 1;
    const token = localStorage.getItem("token");
    fetch(`${API}/monitoring/client-errors`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        message,
        stack: String(error?.stack || extra.componentStack || "").slice(0, 6000),
        page: window.location.pathname,
        build: BUILD,
      }),
    }).catch(() => {});
  } catch {
    /* never let reporting break the page */
  }
}

function reloadOnceForNewVersion() {
  try {
    if (sessionStorage.getItem("sanity.reloadedForNewVersion")) return false;
    sessionStorage.setItem("sanity.reloadedForNewVersion", "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

export function installErrorReporter() {
  window.addEventListener("error", (event) => reportError(event.error || event.message));
  window.addEventListener("unhandledrejection", (event) => reportError(event.reason));
  // A page that loaded fine clears the "already reloaded" flag.
  window.addEventListener("load", () => setTimeout(() => { try { sessionStorage.removeItem("sanity.reloadedForNewVersion"); } catch { /* ignore */ } }, 10000));
}
