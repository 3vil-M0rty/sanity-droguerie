import { useEffect, useMemo, useState } from "react";
import { Wallet, Plus, Trash2, Calculator, Gift } from "lucide-react";

import SearchSelect from "../../components/useful/SearchSelect";
import { simulateSalary } from "../../services/salaryService";
import { fill } from "../fx/shared";
import styles from "./SalaryForm.module.css";

/**
 * Salary form with the payroll calculator built in.
 *
 * Two ways in: type the base salary (→ net pay), or type the net pay
 * agreed with the employee (→ the base salary to enter). Both run the
 * backend payroll engine (POST /salaries/simulate), the same one the
 * monthly payroll run uses, so the saved base pays exactly the net
 * shown: prime d'ancienneté, exempt allowances, CNSS, AMO, frais
 * professionnels, IR and family deduction included.
 */

const KINDS = ["taxable", "transport", "transport_outside", "panier", "representation"];

const money = (n) =>
  (Number(n) || 0).toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Completed years of service at the end of the month of `asOf` —
// the date the payroll run measures seniority on.
function yearsSince(date, asOf) {
  if (!date) return 0;
  const from = new Date(date);
  const ref = asOf ? new Date(asOf) : new Date();
  const now = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  let y = now.getFullYear() - from.getFullYear();
  if (now.getMonth() < from.getMonth() || (now.getMonth() === from.getMonth() && now.getDate() < from.getDate())) y -= 1;
  return Math.max(0, y);
}

export default function SalaryForm({ t, employees, employeeOptions, initialEmployee = "", title, onCancel, onSubmit }) {
  const [employee, setEmployee] = useState(initialEmployee);
  const [mode, setMode] = useState("base");
  const [amount, setAmount] = useState("");
  const [allowances, setAllowances] = useState([]);
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [dependents, setDependents] = useState(null); // null = from the employee file
  const [seniority, setSeniority] = useState(null); // null = from the hire date
  const [bonusMode, setBonusMode] = useState("gross"); // one-off bonus simulation
  const [bonusAmount, setBonusAmount] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setEmployee(initialEmployee), [initialEmployee]);

  const emp = useMemo(() => employees.find((e) => e._id === employee) || null, [employees, employee]);
  const fileDependents = emp?.numberOfDependents || 0;
  const fileSeniority = yearsSince(emp?.hireDate, effectiveDate);

  // Live calculation, debounced.
  const payload = JSON.stringify({ employee, mode, amount, allowances, dependents, seniority, effectiveDate, bonusMode, bonusAmount });
  useEffect(() => {
    const value = Number(amount);
    if (!amount || !(value > 0)) {
      setResult(null);
      return undefined;
    }
    let cancelled = false;
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const data = await simulateSalary({
          mode,
          amount: value,
          employeeId: employee || undefined,
          allowances: allowances.filter((a) => Number(a.amount) > 0),
          numberOfDependents: dependents ?? (emp ? undefined : 0),
          seniorityYears: seniority ?? (emp ? undefined : 0),
          asOf: effectiveDate || undefined,
          bonus: Number(bonusAmount) > 0 ? { amount: Number(bonusAmount), mode: bonusMode } : undefined,
        });
        if (!cancelled) { setResult(data); setError(""); }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || String(err.message || err));
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [payload]); // eslint-disable-line react-hooks/exhaustive-deps

  const setLine = (i, patch) => setAllowances((list) => list.map((a, j) => (j === i ? { ...a, ...patch } : a)));

  const submit = (e) => {
    e.preventDefault();
    if (!employee) return setError(t("fx.pay.needEmployee"));
    if (!effectiveDate) return setError(t("fx.pay.needDate"));
    if (!result) return setError(t("fx.pay.needAmount"));
    onSubmit({
      employee,
      baseSalary: result.baseSalary,
      allowances: allowances
        .filter((a) => Number(a.amount) > 0)
        .map((a) => ({ label: a.label?.trim() || t(`fx.pay.kinds.${a.kind}`).split(" — ")[0], amount: Number(a.amount), kind: a.kind })),
      effectiveDate,
      notes,
    });
  };

  const p = result?.payslip;
  const L = (k, vars) => fill(t(`fx.pay.lines.${k}`), vars);
  const row = (label, value, opts = {}) => (
    <div key={opts.key} className={`${styles.line} ${opts.strong ? styles.strong : ""} ${opts.minus ? styles.minus : ""}`}>
      <span>{label}{opts.hint ? <small> · {opts.hint}</small> : null}</span>
      <span>{opts.minus && Number(value) > 0 ? "−" : ""}{money(value)}</span>
    </div>
  );

  return (
    <form className={styles.card} onSubmit={submit}>
      <div className={styles.head}><Wallet size={16} /> <strong>{title}</strong></div>

      <div className={styles.grid}>
        <div className={styles.inputs}>
          <div className={styles.field}>
            <label>{t("fx.pay.employee")}</label>
            <SearchSelect id="salary-employee" value={employee} onSelect={(v) => { setEmployee(v); setDependents(null); setSeniority(null); }} options={employeeOptions} placeholder={t("fx.pay.employeePlaceholder")} noResultsLabel={t("common.noResults")} />
          </div>

          <div className={styles.modes} role="radiogroup">
            {["base", "net"].map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? styles.modeOn : styles.mode}
                onClick={() => { if (m !== mode && result) setAmount(String(m === "base" ? result.baseSalary : p.netSalary)); setMode(m); }}>
                {t(m === "base" ? "fx.pay.knowBase" : "fx.pay.knowNet")}
              </button>
            ))}
          </div>

          <div className={styles.field}>
            <label htmlFor="salary-amount">{t(mode === "base" ? "fx.pay.baseLabel" : "fx.pay.netLabel")}</label>
            <input id="salary-amount" className={styles.big} type="number" min="0" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label htmlFor="salary-dependents">{t("fx.pay.dependents")}</label>
              <input id="salary-dependents" type="number" min="0" max="20" value={dependents ?? fileDependents} onChange={(e) => setDependents(e.target.value === "" ? null : Number(e.target.value))} />
              {emp && dependents !== null && dependents !== fileDependents && <small className={styles.warn}>{fill(t("fx.pay.dependentsHint"), { n: fileDependents })}</small>}
            </div>
            <div className={styles.field}>
              <label htmlFor="salary-seniority">{t("fx.pay.seniority")}</label>
              <input id="salary-seniority" type="number" min="0" max="60" value={seniority ?? fileSeniority} onChange={(e) => setSeniority(e.target.value === "" ? null : Number(e.target.value))} />
            </div>
          </div>
          <small className={styles.muted}>{t("fx.pay.seniorityHint")}</small>

          <div className={styles.field}>
            <label>{t("fx.pay.allowances")}</label>
            {allowances.map((a, i) => (
              <div key={i} className={styles.allowance}>
                <input aria-label={t("fx.pay.label")} placeholder={t("fx.pay.label")} value={a.label} onChange={(e) => setLine(i, { label: e.target.value })} />
                <input aria-label={t("fx.pay.amount")} type="number" min="0" step="0.01" placeholder="0,00" value={a.amount} onChange={(e) => setLine(i, { amount: e.target.value })} />
                <select aria-label={t("fx.pay.kind")} value={a.kind} onChange={(e) => setLine(i, { kind: e.target.value })}>
                  {KINDS.map((k) => <option key={k} value={k}>{t(`fx.pay.kinds.${k}`)}</option>)}
                </select>
                <button type="button" className="tableActionBtn tableActionBtnDanger" aria-label="remove" onClick={() => setAllowances((list) => list.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
              </div>
            ))}
            <button type="button" className="btnEdit" onClick={() => setAllowances((list) => [...list, { label: "", amount: "", kind: "taxable" }])}><Plus size={14} /> {t("fx.pay.addAllowance")}</button>
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label htmlFor="salary-date">{t("fx.pay.effectiveDate")}</label>
              <input id="salary-date" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="salary-notes">{t("fx.pay.notes")}</label>
            <textarea id="salary-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className={styles.slip} aria-live="polite">
          <div className={styles.slipHead}><Calculator size={15} /> {t("fx.pay.result")} {busy && <small className={styles.muted}>{t("fx.pay.computing")}</small>}</div>
          {!p && <p className={styles.muted}>{t("fx.pay.needAmount")}</p>}
          {p && (
            <>
              <div className={styles.answer}>
                <div><span>{t("fx.pay.baseFound")}</span><strong data-testid="sim-base">{money(result.baseSalary)}</strong></div>
                <div><span>{t("fx.pay.netResult")}</span><strong data-testid="sim-net">{money(p.netSalary)}</strong></div>
                <div><span>{t("fx.pay.employerCost")}</span><strong>{money(p.employer.totalEmployerCost)}</strong></div>
              </div>
              {result.belowSmig && <div className={styles.warnBox}>{fill(t("fx.pay.belowSmig"), { smig: money(result.smig) })}</div>}

              {row(L("base"), p.baseSalary)}
              {p.seniorityAmount > 0 && row(L("seniority", { rate: Math.round(p.seniorityRate * 100) }), p.seniorityAmount)}
              {p.allowances.map((a, i) => row(a.label, a.amount, { key: i, hint: a.exemptAmount > 0 ? fill(t("fx.pay.ofWhichExempt"), { amount: money(a.exemptAmount) }) : null }))}
              {row(L("grossGlobal"), p.grossSalary, { strong: true })}
              {p.exemptAllowanceTotal > 0 && row(L("exempt"), p.exemptAllowanceTotal, { minus: true })}
              {row(L("grossTaxable"), p.taxableGross, { strong: true })}
              {row(L("cnss"), p.cnssEmployee, { minus: true })}
              {row(L("amo"), p.amoEmployee, { minus: true })}
              {p.cimrEmployee > 0 && row(L("cimr"), p.cimrEmployee, { minus: true })}
              {row(L("fp"), p.professionalExpenses, { hint: p.taxableGross * 12 <= 78000 ? "35 %" : "25 %" })}
              {row(L("netTaxable"), p.monthlyTaxableIncome)}
              {row(L("irGross"), p.incomeTaxBeforeFamilyDeduction)}
              {p.familyDeduction > 0 && row(L("family"), Math.min(p.familyDeduction, p.incomeTaxBeforeFamilyDeduction), { minus: true })}
              {row(L("ir"), p.incomeTax, { minus: true })}
              {row(L("totalDeductions"), p.totalEmployeeDeductions)}
              <div className={styles.net}><span>{L("net")}</span><strong>{money(p.netSalary)} MAD</strong></div>

              <div className={styles.employer}>
                {row(L("employerCnss"), p.employer.cnssEmployer)}
                {row(L("employerAmo"), p.employer.amoEmployer)}
                {row(L("training"), p.employer.vocationalTraining)}
                {row(L("cost"), p.employer.totalEmployerCost, { strong: true })}
              </div>
              <div className={styles.bonus}>
                <div className={styles.slipHead}><Gift size={15} /> {t("fx.pay.bonusTitle")}</div>
                <p className={styles.muted}>{t("fx.pay.bonusHint")}</p>
                <div className={styles.modes} role="radiogroup" aria-label={t("fx.pay.bonusTitle")}>
                  {["gross", "net"].map((m) => (
                    <button key={m} type="button" role="radio" aria-checked={bonusMode === m} className={bonusMode === m ? styles.modeOn : styles.mode}
                      onClick={() => { if (m !== bonusMode && result?.bonus) setBonusAmount(String(m === "gross" ? result.bonus.gross : result.bonus.net)); setBonusMode(m); }}>
                      {t(m === "gross" ? "fx.pay.bonusGross" : "fx.pay.bonusNet")}
                    </button>
                  ))}
                </div>
                <div className={styles.field}>
                  <label htmlFor="bonus-sim-amount">{t("fx.pay.bonusAmount")}</label>
                  <input id="bonus-sim-amount" type="number" min="0" step="0.01" inputMode="decimal" value={bonusAmount} onChange={(e) => setBonusAmount(e.target.value)} placeholder="0,00" />
                </div>
                {result.bonus && (
                  <>
                    {row(t("fx.pay.bonusLines.gross"), result.bonus.gross, { strong: true })}
                    {row(t("fx.pay.bonusLines.cnss"), result.bonus.cnss, { minus: true })}
                    {row(t("fx.pay.bonusLines.amo"), result.bonus.amo, { minus: true })}
                    {row(t("fx.pay.bonusLines.ir"), result.bonus.incomeTax, { minus: true })}
                    <div className={styles.net}><span>{t("fx.pay.bonusLines.net")}</span><strong data-testid="bonus-net">{money(result.bonus.net)} MAD</strong></div>
                    {row(t("fx.pay.bonusLines.cost"), result.bonus.employerCost)}
                    {row(t("fx.pay.bonusLines.monthNet"), result.bonus.monthNet)}
                    <p className={styles.muted}>{t("fx.pay.bonusRecord")}</p>
                  </>
                )}
              </div>
              <p className={styles.muted}>{fill(t("fx.pay.sameEngine"), { year: (effectiveDate ? new Date(effectiveDate) : new Date()).getFullYear() })}</p>
            </>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.actions}>
        <button type="button" className="btnCancel" onClick={onCancel}>{t("fx.pay.cancel")}</button>
        <button type="submit" className="btnPrimary" disabled={!result || busy}>{t("fx.pay.save")}</button>
      </div>
    </form>
  );
}
