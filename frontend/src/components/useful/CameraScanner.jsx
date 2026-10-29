import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Flashlight, Loader2 } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import styles from "./CameraScanner.module.css";

// Same code seen again within this delay = the same label still in
// front of the camera, not a second article.
const REPEAT_MS = 1800;
const SCAN_EVERY_MS = 120;
const FORMATS = ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "itf"];

/** A detector for the phone's camera frames: the browser's own (Android Chrome reads QR and barcodes) or jsQR (iPhone: QR codes). */
async function makeDetector() {
  if ("BarcodeDetector" in window) {
    try {
      const supported = await window.BarcodeDetector.getSupportedFormats();
      const formats = FORMATS.filter((f) => supported.includes(f));
      if (formats.length) {
        const detector = new window.BarcodeDetector({ formats });
        return async (video) => (await detector.detect(video))[0]?.rawValue || null;
      }
    } catch { /* fall back to jsQR */ }
  }
  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return async (video) => {
    const w = video.videoWidth, h = video.videoHeight;
    if (!w || !h) return null;
    // A 640 px frame is plenty for a label held in front of the camera
    // and keeps each pass to a few milliseconds on a phone.
    const scale = Math.min(1, 640 / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" })?.data || null;
  };
}

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ac = beep.ac || (beep.ac = new Ctx());
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.value = 1750;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.08);
  } catch { /* sound is a nicety */ }
}

/**
 * Full-screen camera scanner. Stays open: every new code read calls
 * `onCode(code)`, which returns a short message to show ("Ampoule LED
 * ajouté") or throws (message shown as an error).
 */
export default function CameraScanner({ onCode, onClose, title }) {
  const { t } = useI18n();
  const videoRef = useRef(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const [status, setStatus] = useState("starting"); // starting | live | error
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null); // { text, bad }
  const [torch, setTorch] = useState(null); // null = not supported

  useEffect(() => {
    let stream = null;
    let timer = 0;
    let stopped = false;
    let busy = false;
    let last = { code: "", at: 0 };

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error(t("scanner.noCamera"));
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (stopped) return;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        const track = stream.getVideoTracks()[0];
        if (track?.getCapabilities?.().torch) setTorch(false);
        const detect = await makeDetector();
        if (stopped) return;
        setStatus("live");

        const tick = async () => {
          if (stopped) return;
          if (!busy && !document.hidden && video.readyState >= 2) {
            busy = true;
            try {
              const code = (await detect(video))?.trim();
              const now = Date.now();
              if (code && (code !== last.code || now - last.at > REPEAT_MS)) {
                last = { code, at: now };
                navigator.vibrate?.(60);
                beep();
                try {
                  const text = await onCodeRef.current(code);
                  if (!stopped) setToast({ text: text || code, bad: false });
                } catch (err) {
                  if (!stopped) setToast({ text: err?.message || t("scanner.unknown"), bad: true });
                }
              } else if (code) {
                last.at = now;
              }
            } catch { /* a frame the detector could not read */ }
            busy = false;
          }
          timer = window.setTimeout(tick, SCAN_EVERY_MS);
        };
        tick();
      } catch (err) {
        if (stopped) return;
        setStatus("error");
        setError(err?.name === "NotAllowedError" ? t("scanner.denied") : err?.message || t("scanner.noCamera"));
      }
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [t]);

  useEffect(() => {
    if (!toast) return undefined;
    const h = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(h);
  }, [toast]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleTorch = async () => {
    const track = videoRef.current?.srcObject?.getVideoTracks?.()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch }] });
      setTorch(!torch);
    } catch { setTorch(null); }
  };

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={title || t("scanner.title")}>
      <video ref={videoRef} className={styles.video} playsInline muted />
      <div className={styles.top}>
        <strong>{title || t("scanner.title")}</strong>
        <div className={styles.topActions}>
          {torch !== null && (
            <button type="button" className={`${styles.iconBtn} ${torch ? styles.on : ""}`} onClick={toggleTorch} aria-label={t("scanner.torch")} title={t("scanner.torch")}>
              <Flashlight size={20} />
            </button>
          )}
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label={t("common.close")} title={t("common.close")}>
            <X size={22} />
          </button>
        </div>
      </div>

      {status !== "error" && (
        <div className={styles.frame} aria-hidden="true">
          <span /><span /><span /><span />
          {status === "live" && <i className={styles.laser} />}
        </div>
      )}

      <div className={styles.bottom}>
        {status === "starting" && <p className={styles.hint}><Loader2 size={16} className="spin" /> {t("scanner.starting")}</p>}
        {status === "live" && !toast && <p className={styles.hint}>{t("scanner.hint")}</p>}
        {status === "error" && <p className={`${styles.toast} ${styles.bad}`}>{error}</p>}
        {toast && <p className={`${styles.toast} ${toast.bad ? styles.bad : styles.good}`}>{toast.text}</p>}
        <button type="button" className={styles.done} onClick={onClose}>{t("scanner.done")}</button>
      </div>
    </div>,
    document.body,
  );
}
