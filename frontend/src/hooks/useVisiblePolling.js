import { useEffect, useRef } from "react";

/**
 * Calls `fn` now, then every `intervalMs` — but only while the tab is
 * visible. A backgrounded tab (or a phone with the screen off) stops
 * hitting the API, and `fn` runs again as soon as the page is shown.
 *
 * `fn` may change between renders; the latest one is always called.
 */
export function useVisiblePolling(fn, intervalMs, enabled = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return undefined;
    let timer = null;
    const tick = () => fnRef.current();
    const start = () => {
      if (timer) return;
      tick();
      timer = setInterval(tick, intervalMs);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, enabled]);
}
