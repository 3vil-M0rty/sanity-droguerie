// Offline storage of the field app: a tiny key/value store on IndexedDB
// (customers + catalogue can be several MB — too big for localStorage).
const DB = "sanity-field";
const STORE = "kv";
let dbp = null;

function db() {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbp;
}

async function tx(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(out?.result);
    t.onerror = () => reject(t.error);
  });
}

export const getItem = (key) => tx("readonly", (s) => s.get(key));
export const setItem = (key, value) => tx("readwrite", (s) => s.put(value, key));
export const delItem = (key) => tx("readwrite", (s) => s.delete(key));

/** Unique id made on the phone: the server ignores a second copy of the same order. */
export const newRef = (kind) => `${kind}-${Date.now().toString(36)}-${(crypto.randomUUID?.() || Math.random().toString(36).slice(2)).slice(0, 8)}`;

/** Current position, or null (refused, no GPS, too slow). */
export function position(timeout = 6000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 60000 },
    );
  });
}

/** Photo from the camera → JPEG data URL, at most `max` px wide/high (keeps uploads small). */
export function compressImage(file, max = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}
