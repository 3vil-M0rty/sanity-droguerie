import { useCallback, useEffect, useState } from "react";
import { Truck, Plus, Send, PackageCheck, X, Trash2 } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import CustomSelect from "../../components/useful/CustomSelect";
import ArticlePicker from "../../components/useful/ArticlePicker";
import { useArticleIndex } from "../../hooks/useArticleIndex";
import StatusPill from "../../components/useful/StatusPill";
import { getTransfers, createTransfer, sendTransfer, receiveTransfer, cancelTransfer } from "../../services/negoceService";
import { useCompanyPicker, useWarehouses, warehouseOptions, PageTop, CompanyFilter, formatDate, fmtQty, errorText, SALES_PILL } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

/** Transferts entre dépôts: prepare, send (stock leaves), receive (stock enters, short receipts go back). */
export default function Transfers() {
  const { t } = useI18n();
  const can = useCan();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const warehouses = useWarehouses(companyId);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  // Only the articles on the transfer's lines are known — picked by server search.
  const { byId: known, remember } = useArticleIndex(companyId, form ? form.lines.map((l) => l.product) : []);
  const [receiving, setReceiving] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!companyId) return;
    try { setRows(await getTransfers({ companyId })); } catch (err) { setError(errorText(err, t, "sales.errors.load")); }
  }, [companyId, t]);
  useEffect(() => { load(); }, [load]);
  const act = async (fn) => { setError(""); try { await fn(); await load(); return true; } catch (err) { setError(errorText(err, t)); return false; } };

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.stock"), href: "/stock/articles" }, { label: t("ng.transfers.title") }]} icon={Truck} title={t("ng.transfers.title")} subtitle={t("ng.transfers.subtitle")}>
        {can("inventory.transfers.create") && warehouses.length > 1 && <button type="button" className="btnPrimary" onClick={() => setForm({ from: warehouses[0]?._id, to: warehouses[1]?._id, notes: "", lines: [{ product: "", quantity: 1 }] })}><Plus size={15} /> {t("ng.transfers.new")}</button>}
      </PageTop>
      <div className={styles.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
      {error && <div className="errorMessage">{error}</div>}
      {warehouses.length < 2 && <div className={styles.infoBanner}>{t("ng.transfers.needTwo")}</div>}

      {form && (
        <div className={styles.panel}>
          <div className={styles.sectionHeader}><h3>{t("ng.transfers.new")}</h3><button type="button" className="tableActionBtn" onClick={() => setForm(null)}><X size={14} /></button></div>
          <div className={styles.formGrid}>
            <label className={styles.field}>{t("ng.transfers.from")}<CustomSelect value={form.from} onSelect={(v) => setForm({ ...form, from: v })} options={warehouseOptions(warehouses)} /></label>
            <label className={styles.field}>{t("ng.transfers.to")}<CustomSelect value={form.to} onSelect={(v) => setForm({ ...form, to: v })} options={warehouseOptions(warehouses)} /></label>
            <label className={styles.field}>{t("sales.notes")}<input className={styles.input} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          </div>
          <table className={s.miniTable}>
            <thead><tr><th>{t("ng.articles.name")}</th><th className={s.num}>{t("ng.stock.quantity")}</th><th /></tr></thead>
            <tbody>
              {form.lines.map((l, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <tr key={i}>
                  <td><ArticlePicker companyId={companyId} value={l.product} article={known.get(String(l.product)) || null}
                    onPick={(p) => { if (p) remember(p); setForm({ ...form, lines: form.lines.map((x, j) => (j === i ? { ...x, product: p?._id || "" } : x)) }); }} /></td>
                  <td style={{ width: 120 }}><input type="number" min="0" step="any" value={l.quantity} onChange={(e) => setForm({ ...form, lines: form.lines.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)) })} /></td>
                  <td style={{ width: 40 }}><button type="button" className="tableActionBtn tableActionBtnDanger" disabled={form.lines.length === 1} onClick={() => setForm({ ...form, lines: form.lines.filter((_, j) => j !== i) })}><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="btnEdit" onClick={() => setForm({ ...form, lines: [...form.lines, { product: "", quantity: 1 }] })}><Plus size={14} /> {t("sales.lines.addLine")}</button>
          <div className={styles.formActions}>
            <button type="button" className="btnCancel" onClick={() => setForm(null)}>{t("common.cancel")}</button>
            <button type="button" className="btnEdit" onClick={() => act(async () => { await createTransfer({ ...form, company: companyId, lines: form.lines.filter((l) => l.product).map((l) => ({ ...l, quantity: Number(l.quantity) })) }); setForm(null); })}>{t("ng.orders.saveDraft")}</button>
            <button type="button" className="btnPrimary" onClick={() => act(async () => { await createTransfer({ ...form, company: companyId, send: true, lines: form.lines.filter((l) => l.product).map((l) => ({ ...l, quantity: Number(l.quantity) })) }); setForm(null); })}><Send size={14} /> {t("ng.transfers.createSend")}</button>
          </div>
        </div>
      )}

      {receiving && (
        <div className={styles.panel}>
          <h3>{t("ng.transfers.receive")} {receiving.number}</h3>
          <table className={s.miniTable}>
            <thead><tr><th>{t("ng.articles.name")}</th><th className={s.num}>{t("ng.transfers.sent")}</th><th className={s.num}>{t("ng.transfers.received")}</th></tr></thead>
            <tbody>
              {receiving.lines.map((l) => (
                <tr key={l._id}><td>{l.product?.name}{(l.lots || []).length > 0 && <small className={s.muted}> · {l.lots.map((x) => x.number).join(", ")}</small>}</td><td className={s.num}>{fmtQty(l.quantity)}</td>
                  <td style={{ width: 120 }}><input type="number" min="0" max={l.quantity} step="any" value={l.got} onChange={(e) => setReceiving({ ...receiving, lines: receiving.lines.map((x) => (x._id === l._id ? { ...x, got: e.target.value } : x)) })} /></td></tr>
              ))}
            </tbody>
          </table>
          <div className={styles.formActions}>
            <button type="button" className="btnCancel" onClick={() => setReceiving(null)}>{t("common.cancel")}</button>
            <button type="button" className="btnPrimary" onClick={() => act(async () => { await receiveTransfer(receiving._id, receiving.lines.map((l) => ({ lineId: l._id, receivedQuantity: Number(l.got) }))); setReceiving(null); })}><PackageCheck size={14} /> {t("common.confirm")}</button>
          </div>
        </div>
      )}

      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: "130px 110px 1fr 1fr 2fr 120px 220px" }}>
          <span>N°</span><span>{t("sales.date")}</span><span>{t("ng.transfers.from")}</span><span>{t("ng.transfers.to")}</span><span>{t("ng.articles.title")}</span><span>{t("sales.status")}</span><span />
        </div>
        {rows.map((r) => (
          <div key={r._id} className="dataTableRow" style={{ gridTemplateColumns: "130px 110px 1fr 1fr 2fr 120px 220px" }}>
            <span><strong>{r.number}</strong></span>
            <span className="dataTableCellMuted">{formatDate(r.sentAt || r.createdAt)}</span>
            <span>{r.from?.code}</span><span>{r.to?.code}</span>
            <span className="dataTableCellMuted">{r.lines.map((l) => `${l.product?.name} ×${fmtQty(l.quantity)}`).join(" · ")}</span>
            <span><StatusPill status={SALES_PILL[r.status] || "neutral"} label={t(`ng.transfers.status.${r.status}`)} /></span>
            <span className="dataTableActions" style={{ gap: 6 }}>
              {r.status === "draft" && can("inventory.transfers.create") && <button type="button" className="btnEdit" onClick={() => act(() => sendTransfer(r._id))}><Send size={13} /> {t("ng.transfers.send")}</button>}
              {r.status === "sent" && can("inventory.transfers.receive") && <button type="button" className="btnPrimary" onClick={() => setReceiving({ ...r, lines: r.lines.map((l) => ({ ...l, got: l.quantity })) })}><PackageCheck size={13} /> {t("ng.transfers.receive")}</button>}
              {["draft", "sent"].includes(r.status) && can("inventory.transfers.create") && <button type="button" className="btnCancel" onClick={() => act(() => cancelTransfer(r._id))}>{t("common.cancel")}</button>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
