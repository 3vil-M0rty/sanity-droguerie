import { useCallback, useEffect, useState } from "react";
import { Gift, Plus, Trash2, Pencil, Download, X } from "lucide-react";

import SearchSelect from "../../components/useful/SearchSelect";
import {
  getPayrollBonuses,
  createPayrollBonus,
  updatePayrollBonus,
  deletePayrollBonus,
  importCommissions,
} from "../../services/payrollService";
import { getEmployees } from "../../services/employeeService";
import { buildEmployeeSearchOptions } from "../../utils/employeeSearch";
import { fill } from "../fx/shared";
import styles from "./PayrollBonuses.module.css";

/**
 * "Primes du mois" of a payroll run: one-off amounts for this month
 * only (prime exceptionnelle, Aïd, 13e mois, bilan, objectifs…) and
 * the sales reps' commissions imported from the sales module. Every
 * change recomputes the draft run on the server; a completed month is
 * read-only.
 */

const KINDS = ["taxable", "transport", "transport_outside", "panier", "representation"];
const SUGGESTIONS = ["Prime exceptionnelle", "Prime de l'Aïd", "13e mois", "Prime de bilan", "Prime d'objectif", "Prime de rendement"];
const EMPTY = { employee: "", label: "", amount: "", kind: "taxable" };

const money = (n) => (Number(n) || 0).toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const name = (e) => (e ? `${e.firstName || ""} ${e.lastName || ""}`.trim() : "—");

export default function PayrollBonuses({ t, companyId, month, year, onChanged }) {
  const [state, setState] = useState({ bonuses: [], locked: false, total: 0 });
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null); // bonus id
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [commissionFrom, setCommissionFrom] = useState("same");

  const load = useCallback(async () => {
    try {
      setState(await getPayrollBonuses({ companyId, month, year }));
    } catch (err) {
      setError(err.response?.data?.message || t("fx.bonus.loadFailed"));
    }
  }, [companyId, month, year, t]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    let cancelled = false;
    getEmployees({ companyId, page: 1, limit: 500 })
      .then(({ employees: list }) => { if (!cancelled) setEmployees(list || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [companyId]);

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await load();
      await onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || String(err.message || err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.employee && !editing) return setError(t("fx.bonus.needEmployee"));
    if (!form.label.trim()) return setError(t("fx.bonus.needLabel"));
    if (!(Number(form.amount) > 0)) return setError(t("fx.bonus.needAmount"));
    run(async () => {
      const data = { label: form.label.trim(), amount: Number(form.amount), kind: form.kind };
      if (editing) await updatePayrollBonus(editing, data);
      else await createPayrollBonus({ ...data, company: companyId, employee: form.employee, month, year });
      setForm(EMPTY);
      setEditing(null);
      setShowForm(false);
      setNotice(null);
    });
  };

  const edit = (b) => {
    setEditing(b._id);
    setForm({ employee: b.employee?._id || "", label: b.label, amount: String(b.amount), kind: b.kind || "taxable" });
    setShowForm(true);
  };

  const doImport = () => run(async () => {
    const prev = month === 1 ? { commissionMonth: 12, commissionYear: year - 1 } : { commissionMonth: month - 1, commissionYear: year };
    const result = await importCommissions({ company: companyId, month, year, ...(commissionFrom === "previous" ? prev : {}) });
    setNotice(result);
  });

  const { bonuses, locked, total } = state;

  return (
    <section className={styles.box} aria-label={t("fx.bonus.title")}>
      <div className={styles.head}>
        <div>
          <h3><Gift size={16} /> {t("fx.bonus.title")}</h3>
          <p className={styles.muted}>{t(locked ? "fx.bonus.lockedHint" : "fx.bonus.hint")}</p>
        </div>
        {!locked && (
          <div className={styles.headActions}>
            <select aria-label={t("fx.bonus.commissionFrom")} value={commissionFrom} onChange={(e) => setCommissionFrom(e.target.value)}>
              <option value="same">{t("fx.bonus.fromSame")}</option>
              <option value="previous">{t("fx.bonus.fromPrevious")}</option>
            </select>
            <button type="button" className="btnEdit" disabled={busy} onClick={doImport}><Download size={14} /> {t("fx.bonus.import")}</button>
            <button type="button" className="btnPrimary" disabled={busy} onClick={() => { setEditing(null); setForm(EMPTY); setShowForm((v) => !v); }}><Plus size={14} /> {t("fx.bonus.add")}</button>
          </div>
        )}
      </div>

      {notice && (
        <div className={styles.notice}>
          <span>{fill(t("fx.bonus.imported"), { n: notice.imported.length, total: money(notice.total), period: notice.salesPeriod })}</span>
          {notice.skipped.length > 0 && (
            <span className={styles.warn}>
              {fill(t("fx.bonus.skipped"), { names: notice.skipped.map((s) => `${s.rep} (${money(s.commission)})`).join(", ") })}
            </span>
          )}
          <button type="button" className="tableActionBtn" aria-label={t("common.close")} onClick={() => setNotice(null)}><X size={14} /></button>
        </div>
      )}

      {showForm && !locked && (
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}>
            <label>{t("fx.bonus.employee")}</label>
            {editing
              ? <input value={name(bonuses.find((b) => b._id === editing)?.employee)} disabled />
              : <SearchSelect id="bonus-employee" value={form.employee} onSelect={(v) => setForm({ ...form, employee: v })} options={buildEmployeeSearchOptions(employees)} placeholder={t("fx.pay.employeePlaceholder")} noResultsLabel={t("common.noResults")} />}
          </div>
          <div className={styles.field}>
            <label htmlFor="bonus-label">{t("fx.bonus.label")}</label>
            <input id="bonus-label" list="bonus-labels" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Prime exceptionnelle" />
            <datalist id="bonus-labels">{SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
          </div>
          <div className={styles.field}>
            <label htmlFor="bonus-amount">{t("fx.bonus.amount")}</label>
            <input id="bonus-amount" type="number" min="0" step="0.01" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" />
          </div>
          <div className={styles.field}>
            <label htmlFor="bonus-kind">{t("fx.pay.kind")}</label>
            <select id="bonus-kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {KINDS.map((k) => <option key={k} value={k}>{t(`fx.pay.kinds.${k}`)}</option>)}
            </select>
          </div>
          <div className={styles.formActions}>
            <button type="button" className="btnCancel" onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY); }}>{t("fx.pay.cancel")}</button>
            <button type="submit" className="btnPrimary" disabled={busy}>{t(editing ? "fx.bonus.update" : "fx.bonus.save")}</button>
          </div>
        </form>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {bonuses.length === 0 && <p className={styles.muted}>{t("fx.bonus.none")}</p>}
      {bonuses.length > 0 && (
        <div className={styles.list}>
          {bonuses.map((b) => (
            <div key={b._id} className={styles.row}>
              <span className={styles.who}>{name(b.employee)}</span>
              <span>
                {b.label}
                {b.source === "commission" && <small className={styles.badge}>{t("fx.bonus.fromSales")}</small>}
                {b.kind && b.kind !== "taxable" && <small className={styles.muted}> · {t(`fx.pay.kinds.${b.kind}`).split(" — ")[0]}</small>}
                {b.details && (
                  <small className={styles.muted}> · {fill(t("fx.bonus.detail"), { rate: b.details.rate, base: money(b.details.baseAmount) })}{b.details.targetBonus > 0 ? fill(t("fx.bonus.detailTarget"), { bonus: money(b.details.targetBonus) }) : ""}</small>
                )}
              </span>
              <strong className={styles.amount}>{money(b.amount)}</strong>
              <span className={styles.actions}>
                {!locked && (
                  <>
                    <button type="button" className="tableActionBtn" title={t("fx.bonus.edit")} aria-label={t("fx.bonus.edit")} onClick={() => edit(b)}><Pencil size={14} /></button>
                    <button type="button" className="tableActionBtn tableActionBtnDanger" title={t("common.delete")} aria-label={t("common.delete")} disabled={busy} onClick={() => run(() => deletePayrollBonus(b._id))}><Trash2 size={14} /></button>
                  </>
                )}
              </span>
            </div>
          ))}
          <div className={`${styles.row} ${styles.totalRow}`}>
            <span>{t("fx.common.total")}</span><span /><strong className={styles.amount}>{money(total)}</strong><span />
          </div>
        </div>
      )}
    </section>
  );
}
