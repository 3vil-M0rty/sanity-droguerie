import { useCallback, useEffect, useState } from "react";
import { Bug, RefreshCw, CheckCircle2, EyeOff, RotateCcw, Trash2, ChevronDown, ChevronRight, DatabaseBackup } from "lucide-react";

import { useI18n } from "../../hooks/useI18n";
import { PageTop } from "../negoce/common";
import { getErrorEvents, setErrorStatus, deleteErrorEvent, getBackups } from "../../services/platformService";
import { fill } from "../fx/shared";
import styles from "./Ops.module.css";

/**
 * Platform operator: errors recorded on the server and in users'
 * browsers, grouped (backend services/monitoringService.js). The first
 * occurrence of each group is also sent to ALERT_EMAIL / ALERT_WEBHOOK_URL.
 */
const STATUSES = ["open", "resolved", "ignored", "all"];
const SOURCES = ["", "server", "browser", "job", "crash"];

const when = (d) => (d ? new Date(d).toLocaleString("fr-MA", { dateStyle: "short", timeStyle: "short" }) : "—");

export default function Errors() {
  const { t } = useI18n();
  const [status, setStatus] = useState("open");
  const [source, setSource] = useState("");
  const [data, setData] = useState({ events: [], counts: {} });
  const [open, setOpen] = useState(null);
  const [error, setError] = useState("");
  const [backups, setBackups] = useState(null);

  useEffect(() => { getBackups().then(setBackups).catch(() => {}); }, []);

  const load = useCallback(async () => {
    try {
      setData(await getErrorEvents({ status, source }));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || String(err.message || err));
    }
  }, [status, source]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn) => {
    try { await fn(); await load(); } catch (err) { setError(err.response?.data?.message || String(err.message || err)); }
  };

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.platform") }, { label: t("fx.ops.err.title") }]} icon={Bug} title={t("fx.ops.err.title")} subtitle={t("fx.ops.err.subtitle")}>
        <button type="button" className="btnEdit" onClick={load}><RefreshCw size={15} /> {t("fx.ops.common.refresh")}</button>
      </PageTop>

      {backups && <BackupPanel t={t} b={backups} />}

      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist">
          {STATUSES.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={status === s} className={status === s ? styles.tabOn : styles.tab} onClick={() => setStatus(s)}>
              {t(`fx.ops.err.status.${s}`)}{s !== "all" && data.counts[s] ? ` (${data.counts[s]})` : ""}
            </button>
          ))}
        </div>
        <select aria-label={t("fx.ops.err.source")} value={source} onChange={(e) => setSource(e.target.value)}>
          {SOURCES.map((s) => <option key={s || "all"} value={s}>{t(`fx.ops.err.sources.${s || "all"}`)}</option>)}
        </select>
      </div>

      {error && <div className="errorMessage">{error}</div>}
      {data.events.length === 0 && <div className="emptyStateBlock"><div className="emptyStateIcon"><CheckCircle2 size={28} /></div><h2>{t("fx.ops.err.none")}</h2><p>{t("fx.ops.err.noneHint")}</p></div>}

      <div className={styles.list}>
        {data.events.map((e) => (
          <div key={e._id} className={styles.card}>
            <button type="button" className={styles.cardHead} aria-expanded={open === e._id} onClick={() => setOpen(open === e._id ? null : e._id)}>
              {open === e._id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              <span className={styles.badge} data-tone={e.source}>{t(`fx.ops.err.sources.${e.source}`)}</span>
              <span className={styles.msg}>{e.message}</span>
              <span className={styles.meta}>{fill(t("fx.ops.err.count"), { n: e.count })} · {when(e.lastSeen)}</span>
            </button>
            {open === e._id && (
              <div className={styles.cardBody}>
                <dl className={styles.facts}>
                  <dt>{t("fx.ops.err.route")}</dt><dd>{e.route || "—"}</dd>
                  <dt>{t("fx.ops.err.first")}</dt><dd>{when(e.firstSeen)}</dd>
                  <dt>{t("fx.ops.err.clients")}</dt><dd>{e.tenants.length ? e.tenants.join(", ") : "—"}</dd>
                </dl>
                {(e.samples || []).slice().reverse().slice(0, 1).map((smp, i) => (
                  <div key={i}>
                    <p className={styles.muted}>{when(smp.at)} · {smp.url || "—"}{smp.status ? ` · HTTP ${smp.status}` : ""}{smp.build ? ` · ${smp.build}` : ""}</p>
                    {smp.stack && <pre className={styles.stack}>{smp.stack}</pre>}
                  </div>
                ))}
                <div className={styles.actions}>
                  {e.status !== "resolved" && <button type="button" className="btnPrimary" onClick={() => act(() => setErrorStatus(e._id, "resolved"))}><CheckCircle2 size={14} /> {t("fx.ops.err.resolve")}</button>}
                  {e.status !== "open" && <button type="button" className="btnEdit" onClick={() => act(() => setErrorStatus(e._id, "open"))}><RotateCcw size={14} /> {t("fx.ops.err.reopen")}</button>}
                  {e.status !== "ignored" && <button type="button" className="btnEdit" onClick={() => act(() => setErrorStatus(e._id, "ignored"))}><EyeOff size={14} /> {t("fx.ops.err.ignore")}</button>}
                  <button type="button" className="btnDelete" onClick={() => act(() => deleteErrorEvent(e._id))}><Trash2 size={14} /> {t("common.delete")}</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const mb = (n) => `${((n || 0) / 1048576).toFixed(1)} Mo`;

/** Automatic backups and restore drills (backend services/backupScheduler.js). */
function BackupPanel({ t, b }) {
  const tone = !b.enabled || b.stale ? "failed" : "ok";
  return (
    <section className={styles.section} aria-label={t("fx.ops.bk.title")}>
      <h2><DatabaseBackup size={16} /> {t("fx.ops.bk.title")} <span className={styles.badge} data-tone={tone}>{t(!b.enabled ? "fx.ops.bk.off" : b.stale ? "fx.ops.bk.stale" : "fx.ops.bk.ok")}</span></h2>
      {!b.enabled && <p className={styles.muted}>{t("fx.ops.bk.offHint")}</p>}
      {b.enabled && (
        <dl className={styles.facts}>
          <dt>{t("fx.ops.bk.last")}</dt>
          <dd>{b.lastOk ? `${when(b.lastOk.createdAt)} · ${fill(t("fx.ops.bk.docs"), { n: b.lastOk.documents, c: b.lastOk.collections })} · ${mb(b.lastOk.sizeBytes)}` : "—"}</dd>
          <dt>{t("fx.ops.bk.drill")}</dt>
          <dd>{!b.drillEnabled ? t("fx.ops.bk.drillOff") : b.lastDrill ? `${when(b.lastDrill.createdAt)} · ${b.lastDrill.status === "ok" ? t("fx.ops.bk.drillOk") : `${t("fx.ops.bk.drillFailed")} ${b.lastDrill.error || ""}`}` : t("fx.ops.bk.drillNone")}</dd>
          <dt>{t("fx.ops.bk.schedule")}</dt>
          <dd>{fill(t("fx.ops.bk.scheduleText"), { h: b.hour, d: b.keepDays })}</dd>
        </dl>
      )}
      {b.runs.some((r) => r.status === "failed") && (
        <p className={styles.muted}>{t("fx.ops.bk.failures")} {b.runs.filter((r) => r.status === "failed").slice(0, 3).map((r) => `${when(r.createdAt)} (${r.error || r.problems?.join("; ")})`).join(" · ")}</p>
      )}
    </section>
  );
}
