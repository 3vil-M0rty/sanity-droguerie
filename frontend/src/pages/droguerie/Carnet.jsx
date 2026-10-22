import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Banknote, X, UserPlus } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import CustomSelect from "../../components/useful/CustomSelect";
import { getCarnet, getCarnetAccount, payCarnet, whatsappReminder } from "../../services/droguerieService";
import { createCustomer } from "../../services/salesService";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, formatDate, errorText } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import d from "./Droguerie.module.css";

const METHODS = ["especes", "cheque", "virement", "carte", "effet"];

/**
 * Le carnet — who buys on credit and how much they owe. Sales on
 * credit are made at the till ("Crédit" payment); a payment received
 * here settles the oldest debts first.
 */
export default function Carnet() {
  const { t } = useI18n();
  const can = useCan();
  const [params, setParams] = useSearchParams();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [search, setSearch] = useState("");
  const [all, setAll] = useState(false);
  const [data, setData] = useState({ rows: [], total: 0 });
  const [account, setAccount] = useState(null);
  const [pay, setPay] = useState(null);
  const [newCustomer, setNewCustomer] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const shop = options.find((o) => o.value === companyId)?.label || "";

  const load = useCallback(async () => {
    if (!companyId) return;
    try { setData(await getCarnet(companyId, { search, all })); } catch (err) { setError(errorText(err, t, "sales.errors.load")); }
  }, [companyId, search, all, t]);
  useEffect(() => { const h = setTimeout(load, 250); return () => clearTimeout(h); }, [load]);

  const open = params.get("c");
  useEffect(() => {
    if (!open) { setAccount(null); return; }
    getCarnetAccount(open).then(setAccount).catch((err) => setError(errorText(err, t, "sales.errors.load")));
  }, [open, t]);

  const reminder = (c, due) => whatsappReminder(c.whatsapp || c.phone, t("dg.carnet.waText").replace("{name}", c.name).replace("{amount}", formatMoney(due)).replace("{shop}", shop));

  const submitPay = async () => {
    setError("");
    try {
      const r = await payCarnet(pay.customer._id, { amount: Number(pay.amount), method: pay.method, reference: pay.reference });
      setNotice(t("dg.carnet.paid").replace("{amount}", formatMoney(Number(pay.amount))).replace("{rest}", formatMoney(r.remaining)));
      setPay(null);
      await load();
      if (open) setAccount(await getCarnetAccount(open));
    } catch (err) { setError(errorText(err, t)); }
  };

  const submitCustomer = async () => {
    setError("");
    try {
      await createCustomer({ company: companyId, name: newCustomer.name, phone: newCustomer.phone, type: "retail" });
      setNewCustomer(null);
      setAll(true);
      setSearch(newCustomer.name);
    } catch (err) { setError(errorText(err, t)); }
  };

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("dg.menu.home"), href: "/boutique" }, { label: t("dg.menu.carnet") }]} icon={BookOpen} title={t("dg.menu.carnet")} subtitle={t("dg.carnet.subtitle")}>
        {can("sales.customers.create") && <button type="button" className="btnEdit" onClick={() => setNewCustomer({ name: "", phone: "" })}><UserPlus size={15} /> {t("dg.carnet.newCustomer")}</button>}
      </PageTop>
      <div className={styles.toolbar}>
        <CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} />
        <input className={`${styles.input} ${d.search}`} placeholder={t("dg.carnet.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        <label className={styles.checkboxRow}><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> {t("dg.carnet.showAll")}</label>
      </div>
      {error && <div className="errorMessage">{error}</div>}
      {notice && <div className="successMessage">{notice}</div>}

      <div className={d.stat} style={{ marginBottom: 14 }}><span>{t("dg.home.carnetTotal")}</span><strong className={d.owed}>{formatMoney(data.total)}</strong></div>

      <div className={d.rows}>
        {data.rows.map((c) => {
          const wa = c.due > 0 && reminder(c, c.due);
          return (
            <div key={c._id} className={d.row}>
              <div>
                <strong>{c.name}</strong>
                <div className={d.muted}>{[c.phone, c.days !== null && c.days !== undefined ? t("dg.carnet.since").replace("{days}", c.days) : null].filter(Boolean).join(" · ")}</div>
              </div>
              <div className={`${d.amount} ${c.due > 0 ? d.owed : ""}`}>{formatMoney(c.due)}</div>
              <div className={d.actions}>
                <button type="button" className="btnEdit" onClick={() => setParams({ c: c._id })}>{t("dg.carnet.details")}</button>
                {c.due > 0 && can("sales.payments.create") && <button type="button" className="btnPrimary" onClick={() => setPay({ customer: c, due: c.due, amount: String(c.due), method: "especes", reference: "" })}><Banknote size={14} /> {t("dg.carnet.receive")}</button>}
                {wa && <a className={d.wa} href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
              </div>
            </div>
          );
        })}
        {!data.rows.length && <p className={d.muted}>{all || search ? t("dg.carnet.none") : t("dg.carnet.nobody")}</p>}
      </div>

      {account && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard} style={{ maxWidth: 640 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>{account.customer.name} — <span className={d.owed}>{formatMoney(account.due)}</span></h3>
              <button type="button" className="tableActionBtn" onClick={() => setParams({})} aria-label={t("common.close")}><X size={16} /></button>
            </div>
            <h4>{t("dg.carnet.openDebts")}</h4>
            <ul className={d.list}>
              {account.open.map((i) => <li key={i._id}><span>{formatDate(i.date)} · {i.ticket || i.number}</span><strong>{formatMoney(i.due)}</strong></li>)}
              {!account.open.length && <li className={d.muted}>{t("dg.carnet.settled")}</li>}
            </ul>
            <h4>{t("dg.carnet.payments")}</h4>
            <ul className={d.list}>
              {account.payments.map((p, i) => <li key={`${p.invoice}-${i}`}><span>{formatDate(p.date)} · {t(`ng.pos.methods.${p.method}`)}{p.reference ? ` · ${p.reference}` : ""}</span><strong className={d.good}>{formatMoney(p.amount)}</strong></li>)}
              {!account.payments.length && <li className={d.muted}>—</li>}
            </ul>
            <div className={styles.modalActions}>
              {account.due > 0 && can("sales.payments.create") && <button type="button" className="btnPrimary" onClick={() => setPay({ customer: account.customer, due: account.due, amount: String(account.due), method: "especes", reference: "" })}><Banknote size={14} /> {t("dg.carnet.receive")}</button>}
              <Link className="btnEdit" to={`/sales/customers`}>{t("dg.carnet.customerCard")}</Link>
            </div>
          </div>
        </div>
      )}

      {pay && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard} style={{ maxWidth: 440 }}>
            <h3>{t("dg.carnet.receive")} — {pay.customer.name}</h3>
            <p className={d.muted}>{t("dg.carnet.owes")} {formatMoney(pay.due)}</p>
            <label className={styles.field}>{t("dg.common.amount")}<input className={styles.input} type="number" min="0" step="0.01" autoFocus value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></label>
            <label className={styles.field}>{t("dg.common.method")}<CustomSelect value={pay.method} onSelect={(v) => setPay({ ...pay, method: v })} options={METHODS.map((m) => ({ value: m, label: t(`dg.methods.${m}`) }))} /></label>
            {pay.method !== "especes" && <label className={styles.field}>{t("dg.common.reference")}<input className={styles.input} value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></label>}
            <div className={styles.modalActions}>
              <button type="button" className="btnCancel" onClick={() => setPay(null)}>{t("common.cancel")}</button>
              <button type="button" className="btnPrimary" disabled={!(Number(pay.amount) > 0)} onClick={submitPay}>{t("dg.common.confirm")}</button>
            </div>
          </div>
        </div>
      )}

      {newCustomer && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard} style={{ maxWidth: 440 }}>
            <h3>{t("dg.carnet.newCustomer")}</h3>
            <label className={styles.field}>{t("dg.common.name")}<input className={styles.input} autoFocus value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} /></label>
            <label className={styles.field}>{t("dg.common.phone")}<input className={styles.input} value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></label>
            <div className={styles.modalActions}>
              <button type="button" className="btnCancel" onClick={() => setNewCustomer(null)}>{t("common.cancel")}</button>
              <button type="button" className="btnPrimary" disabled={!newCustomer.name.trim()} onClick={submitCustomer}>{t("dg.common.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
