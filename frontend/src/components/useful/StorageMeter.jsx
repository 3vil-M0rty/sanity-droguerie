import { useI18n } from "../../hooks/useI18n";
import styles from "./StorageMeter.module.css";

const MB = 1024 * 1024;

/** "120 Mo", "1,5 Go". */
export function formatBytes(bytes) {
  const b = Number(bytes) || 0;
  if (b >= 1024 * MB) return `${(b / (1024 * MB)).toLocaleString("fr-MA", { maximumFractionDigits: 1 })} Go`;
  if (b >= MB) return `${Math.round(b / MB).toLocaleString("fr-MA")} Mo`;
  return `${Math.max(Math.round(b / 1024), b ? 1 : 0)} Ko`;
}

/**
 * Photos & documents gauge: used / quota (services/storageService.js
 * on the server). Orange from 80 %, red when full.
 */
export default function StorageMeter({ storage, compact = false }) {
  const { t } = useI18n();
  if (!storage) return null;
  const pct = storage.quotaBytes > 0 ? Math.min(100, (storage.usedBytes / storage.quotaBytes) * 100) : 100;
  const level = pct >= 100 ? styles.full : pct >= 80 ? styles.high : styles.ok;
  return (
    <div className={compact ? styles.compact : styles.meter} title={t("storage.title")}>
      <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={t("storage.title")}>
        <span className={level} style={{ width: `${Math.max(pct, storage.usedBytes ? 2 : 0)}%` }} />
      </div>
      <small>
        {formatBytes(storage.usedBytes)} / {formatBytes(storage.quotaBytes)}
        {!compact && <> · {Math.round(pct)} %{storage.source ? ` · ${t(`storage.source.${storage.source}`)}` : ""}</>}
      </small>
    </div>
  );
}
