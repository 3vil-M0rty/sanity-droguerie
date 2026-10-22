import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Truck, Banknote, PackagePlus } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import CustomSelect from "../../components/useful/CustomSelect";
import { getShopSuppliers, paySupplier } from "../../services/droguerieService";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, errorText } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import d from "./Droguerie.module.css";

const OUT_METHODS = ["especes", "cheque", "virement", "effet", "carte"];

/** Fournisseurs — what the shop owes each wholesaler, and paying them (oldest purchases first). */
export default function Fournisseurs() {
  const { t } = useI18n();
  const can = useCan();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [data, setData] = useState({ rows: [], total: 0 });
  const [pay, setPay] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!companyId) return;
    try { setData(await getShopSuppliers(companyId)); } catch (err) { setError(errorText(err, t, "sales.errors.load")); }
  }, [companyId, t]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setError("");
    try {
      const r = await paySupplier(pay.supplier._id, { amount: Number(pay.amount), method: pay.method, reference: pay.reference });
      setNotice(t("dg.suppliers.paid").replace("{name}", pay.supplier.name).replace("{rest}", formatMoney(r.remaining)));
      setPay(null);
      await load();
    } catch (err) { setError(errorText(err, t)); }
  };

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("dg.menu.home"), href: "/boutique" }, { label: t("dg.menu.suppliers") }]} icon={Truck} title={t("dg.menu.suppliers")} subtitle={t("dg.suppliers.subtitle")}>
        <Link className="btnPrimary" to="/boutique/achat"><PackagePlus size={15} /> {t("dg.menu.purchase")}</Link>
      </PageTop>
      <div className={styles.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
      {error && <div className="errorMessage">{error}</div>}
      {notice && <div className="successMessage">{notice}</div>}
      <div className={d.stat} style={{ marginBottom: 14 }}><span>{t("dg.home.iOwe")}</span><strong className={d.owed}>{formatMoney(data.total)}</strong></div>

      <div className={d.rows}>
        {data.rows.map((s) => (
          <div key={s._id} className={d.row}>
            <div><strong>{s.name}</strong><div className={d.muted}>{[s.phone, s.city, s.open ? `${s.open} ${t("dg.suppliers.openPurchases")}` : null].filter(Boolean).join(" · ")}</div></div>
            <div className={`${d.amount} ${s.due > 0 ? d.owed : ""}`}>{formatMoney(s.due)}</div>
            <div className={d.actions}>
              {s.due > 0 && can("purchasing.payments.create") && <button type="button" className="btnPrimary" onClick={() => setPay({ supplier: s, due: s.due, amount: String(s.due), method: "especes", reference: "" })}><Banknote size={14} /> {t("dg.suppliers.pay")}</button>}
            </div>
          </div>
        ))}
        {!data.rows.length && <p className={d.muted}>{t("dg.suppliers.none")}</p>}
      </div>

      {pay && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard} style={{ maxWidth: 440 }}>
            <h3>{t("dg.suppliers.pay")} — {pay.supplier.name}</h3>
            <p className={d.muted}>{t("dg.suppliers.youOwe")} {formatMoney(pay.due)}</p>
            <label className={styles.field}>{t("dg.common.amount")}<input className={styles.input} type="number" min="0" step="0.01" autoFocus value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></label>
            <label className={styles.field}>{t("dg.common.method")}<CustomSelect value={pay.method} onSelect={(v) => setPay({ ...pay, method: v })} options={OUT_METHODS.map((m) => ({ value: m, label: t(`dg.methods.${m}`) }))} /></label>
            {pay.method !== "especes" && <label className={styles.field}>{t("dg.common.reference")}<input className={styles.input} value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></label>}
            <div className={styles.modalActions}>
              <button type="button" className="btnCancel" onClick={() => setPay(null)}>{t("common.cancel")}</button>
              <button type="button" className="btnPrimary" disabled={!(Number(pay.amount) > 0)} onClick={submit}>{t("dg.common.confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
