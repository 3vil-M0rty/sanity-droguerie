import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Route, Plus, Play, Flag, Ban, ArrowUp, ArrowDown, X, Printer } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import CustomSelect from "../../components/useful/CustomSelect";
import StatusPill from "../../components/useful/StatusPill";
import { getRounds, getRound, createRound, updateRound, startRound, finishRound, cancelRound, getDeliveryNotes, downloadDeliveryNotePdf } from "../../services/negoceService";
import { useCompanyPicker, useWarehouses, warehouseOptions, PageTop, CompanyFilter, formatDate, formatMoney, fmtQty, errorText, todayInput, SALES_PILL } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

/** Tournées de livraison: one truck, one driver, one day, ordered stops. */
export default function Rounds() {
  const { t } = useI18n();
  const can = useCan();
  const navigate = useNavigate();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const warehouses = useWarehouses(companyId);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => { if (companyId) try { setRows(await getRounds({ companyId })); } catch (err) { setError(errorText(err, t, "sales.errors.load")); } }, [companyId, t]);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.logistics"), href: "/logistics/delivery-notes" }, { label: t("ng.rounds.title") }]} icon={Route} title={t("ng.rounds.title")} subtitle={t("ng.rounds.subtitle")}>
        {can("logistics.rounds.manage") && <button type="button" className="btnPrimary" onClick={() => setForm({ date: todayInput(), vehicle: "", driver: "", driverPhone: "", zone: "", warehouse: "" })}><Plus size={15} /> {t("ng.rounds.new")}</button>}
      </PageTop>
      <div className={styles.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
      {error && <div className="errorMessage">{error}</div>}
      {form && (
        <div className={styles.panel}>
          <div className={styles.sectionHeader}><h3>{t("ng.rounds.new")}</h3><button type="button" className="tableActionBtn" onClick={() => setForm(null)}><X size={14} /></button></div>
          <div className={styles.formGrid}>
            <label className={styles.field}>{t("sales.date")}<input type="date" className={styles.input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            <label className={styles.field}>{t("ng.common.warehouse")}<CustomSelect value={form.warehouse} onSelect={(v) => setForm({ ...form, warehouse: v })} options={warehouseOptions(warehouses, "—")} /></label>
            <label className={styles.field}>{t("ng.rounds.zone")}<input className={styles.input} value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} /></label>
            <label className={styles.field}>{t("ng.rounds.vehicle")}<input className={styles.input} value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} placeholder="12345-A-6" /></label>
            <label className={styles.field}>{t("ng.rounds.driver")}<input className={styles.input} value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} /></label>
            <label className={styles.field}>{t("sales.customers.phone")}<input className={styles.input} value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} /></label>
          </div>
          <div className={styles.formActions}>
            <button type="button" className="btnCancel" onClick={() => setForm(null)}>{t("common.cancel")}</button>
            <button type="button" className="btnPrimary" onClick={async () => { try { const r = await createRound({ ...form, company: companyId, warehouse: form.warehouse || undefined }); navigate(`/logistics/rounds/${r._id}`); } catch (err) { setError(errorText(err, t)); } }}>{t("common.save")}</button>
          </div>
        </div>
      )}
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: "130px 110px 1fr 1fr 1fr 0.8fr 0.8fr 130px" }}><span>N°</span><span>{t("sales.date")}</span><span>{t("ng.rounds.zone")}</span><span>{t("ng.rounds.driver")}</span><span>{t("ng.rounds.vehicle")}</span><span className={s.right}>{t("ng.rounds.stops")}</span><span className={s.right}>kg</span><span>{t("sales.status")}</span></div>
        {rows.map((r) => (
          <div key={r._id} className={`dataTableRow ${styles.clickableRow}`} style={{ gridTemplateColumns: "130px 110px 1fr 1fr 1fr 0.8fr 0.8fr 130px" }} role="button" tabIndex={0} onClick={() => navigate(`/logistics/rounds/${r._id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/logistics/rounds/${r._id}`)}>
            <span><strong>{r.number}</strong></span><span>{formatDate(r.date)}</span><span className="dataTableCellMuted">{r.zone || "—"}</span><span>{r.driver || "—"}</span><span className="dataTableCellMuted">{r.vehicle || "—"}</span>
            <span className={s.right}>{r.delivered}/{r.stops}</span><span className={s.right}>{fmtQty(r.weightKg)}</span>
            <span><StatusPill status={SALES_PILL[r.status] || "neutral"} label={t(`ng.rounds.status.${r.status}`)} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One round: pick the BLs to deliver, order the stops, start (BLs leave), close with the results. */
export function RoundDetail() {
  const { t } = useI18n();
  const can = useCan();
  const { id } = useParams();
  const navigate = useNavigate();
  const [round, setRound] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [stops, setStops] = useState([]);
  const [results, setResults] = useState({});
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const r = await getRound(id);
      setRound(r);
      setStops(r.notes.map((n) => n._id));
      setResults(Object.fromEntries(r.notes.map((n) => [n._id, { delivered: true, receivedBy: "", cashCollected: "" }])));
      if (r.status === "planned") setCandidates(await getDeliveryNotes({ companyId: r.company, toPlan: "true" }));
    } catch (err) { setError(errorText(err, t, "sales.errors.load")); }
  }, [id, t]);
  useEffect(() => { load(); }, [load]);
  if (!round) return <div className="pageShell">{error && <div className="errorMessage">{error}</div>}</div>;
  const manage = can("logistics.rounds.manage") && round.status === "planned";
  const byId = new Map([...round.notes, ...candidates].map((n) => [n._id, n]));
  const move = (i, d) => { const next = [...stops]; const [x] = next.splice(i, 1); next.splice(i + d, 0, x); setStops(next); };
  const act = async (fn) => { setError(""); try { await fn(); await load(); } catch (err) { setError(errorText(err, t)); } };
  const weight = stops.reduce((sum, nid) => sum + (byId.get(nid)?.weightKg || 0), 0);
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.logistics"), href: "/logistics/delivery-notes" }, { label: t("ng.rounds.title"), href: "/logistics/rounds" }, { label: round.number }]} icon={Route}
        title={`${t("ng.rounds.one")} ${round.number}`} subtitle={`${formatDate(round.date)} · ${round.driver || "—"} · ${round.vehicle || "—"}${round.zone ? ` · ${round.zone}` : ""}`}>
        {manage && <button type="button" className="btnEdit" onClick={() => act(() => updateRound(id, { noteIds: stops }))}>{t("ng.rounds.saveStops")}</button>}
        {manage && round.notes.length > 0 && <button type="button" className="btnPrimary" onClick={() => act(() => startRound(id))}><Play size={15} /> {t("ng.rounds.start")}</button>}
        {round.status === "in_progress" && can("logistics.notes.deliver") && <button type="button" className="btnPrimary" onClick={() => setClosing(true)}><Flag size={15} /> {t("ng.rounds.finish")}</button>}
        {manage && <button type="button" className="btnCancel" onClick={() => act(async () => { await cancelRound(id); navigate("/logistics/rounds"); })}><Ban size={15} /> {t("common.cancel")}</button>}
      </PageTop>
      {error && <div className="errorMessage">{error}</div>}
      <div className={s.kpis}>
        <div className={s.kpi}><span>{t("sales.status")}</span><strong>{t(`ng.rounds.status.${round.status}`)}</strong></div>
        <div className={s.kpi}><span>{t("ng.rounds.stops")}</span><strong>{stops.length}</strong></div>
        <div className={s.kpi}><span>{t("ng.delivery.weight")}</span><strong>{fmtQty(weight)} kg</strong></div>
        {round.cashCollected > 0 && <div className={s.kpi}><span>{t("ng.delivery.cashCollected")}</span><strong>{formatMoney(round.cashCollected)}</strong></div>}
      </div>
      <div className={s.twoCols}>
        <div className={s.card}>
          <h3>{t("ng.rounds.stopsTitle")}</h3>
          <table className={s.miniTable}>
            <thead><tr><th>#</th><th>BL</th><th>{t("sales.customer")}</th><th>{t("sales.customers.address")}</th><th className={s.num}>kg</th><th /></tr></thead>
            <tbody>
              {stops.map((nid, i) => {
                const n = byId.get(nid);
                if (!n) return null;
                return (
                  <tr key={nid}>
                    <td>{i + 1}</td>
                    <td><button type="button" className={styles.linkButton} onClick={() => navigate(`/logistics/delivery-notes/${nid}`)}>{n.number}</button><small className={s.muted} style={{ display: "block" }}>{t(`ng.delivery.status.${n.status}`)}</small></td>
                    <td>{n.customer?.name}<small className={s.muted} style={{ display: "block" }}>{n.customer?.phone}</small></td>
                    <td className={s.muted}>{n.address || n.customer?.deliveryAddress || n.customer?.address}</td>
                    <td className={s.num}>{fmtQty(n.weightKg)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {manage && <>
                        <button type="button" className="tableActionBtn" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={12} /></button>
                        <button type="button" className="tableActionBtn" disabled={i === stops.length - 1} onClick={() => move(i, 1)}><ArrowDown size={12} /></button>
                        <button type="button" className="tableActionBtn tableActionBtnDanger" onClick={() => setStops(stops.filter((x) => x !== nid))}><X size={12} /></button>
                      </>}
                      <button type="button" className="tableActionBtn" title="PDF" onClick={() => downloadDeliveryNotePdf(n)}><Printer size={12} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {manage && (
          <div className={s.card}>
            <h3>{t("ng.rounds.toPlan")}</h3>
            {candidates.filter((c) => !stops.includes(c._id)).map((c) => (
              <button key={c._id} type="button" className={s.chipBtn} style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 6 }} onClick={() => setStops([...stops, c._id])}>
                + {c.number} — {c.customer?.name} <small className={s.muted}>{c.customer?.city}{c.customer?.zone ? ` · ${c.customer.zone}` : ""} · {fmtQty(c.weightKg)} kg</small>
              </button>
            ))}
            {!candidates.length && <p className={s.muted}>{t("ng.rounds.nothingToPlan")}</p>}
          </div>
        )}
      </div>
      {closing && (
        <div className={styles.panel}>
          <h3>{t("ng.rounds.finish")}</h3>
          <table className={s.miniTable}>
            <thead><tr><th>BL</th><th>{t("ng.rounds.delivered")}</th><th>{t("ng.delivery.receivedBy")}</th><th>{t("ng.delivery.cashCollected")}</th></tr></thead>
            <tbody>
              {round.notes.filter((n) => n.status === "validated").map((n) => (
                <tr key={n._id}>
                  <td>{n.number} — {n.customer?.name}</td>
                  <td><input type="checkbox" checked={results[n._id]?.delivered !== false} onChange={(e) => setResults({ ...results, [n._id]: { ...results[n._id], delivered: e.target.checked } })} /></td>
                  <td><input value={results[n._id]?.receivedBy || ""} onChange={(e) => setResults({ ...results, [n._id]: { ...results[n._id], receivedBy: e.target.value } })} /></td>
                  <td><input type="number" min="0" value={results[n._id]?.cashCollected || ""} onChange={(e) => setResults({ ...results, [n._id]: { ...results[n._id], cashCollected: e.target.value } })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.formActions}>
            <button type="button" className="btnCancel" onClick={() => setClosing(false)}>{t("common.cancel")}</button>
            <button type="button" className="btnPrimary" onClick={() => act(async () => { await finishRound(id, { results: Object.entries(results).map(([noteId, r]) => ({ noteId, ...r, cashCollected: Number(r.cashCollected) || 0 })) }); setClosing(false); })}>{t("common.confirm")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
