import { useRef, useState } from "react";
import { FileSpreadsheet, Upload, Download, CheckCircle2 } from "lucide-react";
import { errorText } from "../negoce/common";
import { downloadImportTemplate, previewImport, commitImport } from "../../services/featuresService";
import { Modal, fill } from "./shared";
import p from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

/**
 * Excel onboarding (articles | customers | stock): template → file →
 * dry run row by row → import. Nothing is written before "Importer".
 */
export function ImportButton({ t, kind, companyId, onDone }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btnEdit" onClick={() => setOpen(true)} disabled={!companyId}><FileSpreadsheet size={15} /> {t("fx.imp.button")}</button>
      {open && <ImportModal t={t} kind={kind} companyId={companyId} onClose={() => setOpen(false)} onDone={onDone} />}
    </>
  );
}

export default function ImportModal({ t, kind, companyId, onClose, onDone }) {
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (f) => {
    if (!f) return;
    setFile(f); setPreview(null); setResult(null); setError(""); setBusy(true);
    try { setPreview(await previewImport(kind, companyId, f)); } catch (err) { setError(errorText(err, t)); } finally { setBusy(false); }
  };
  const go = async () => {
    setBusy(true); setError("");
    try { const r = await commitImport(kind, companyId, file); setResult(r); onDone?.(r); } catch (err) { setError(errorText(err, t)); } finally { setBusy(false); }
  };
  const sum = preview?.summary;
  const valid = sum ? sum.create + sum.update : 0;
  const rows = (preview?.rows || []).filter((r) => !onlyProblems || r.errors.length || r.warnings.length);
  const reset = () => { setFile(null); setPreview(null); setResult(null); if (input.current) input.current.value = ""; };

  return (
    <Modal wide title={t(`fx.imp.title.${kind}`)} onClose={onClose}
      actions={result
        ? <><button type="button" className="btnEdit" onClick={reset}>{t("fx.imp.again")}</button><button type="button" className="btnPrimary" onClick={onClose}>{t("fx.common.close")}</button></>
        : <><button type="button" className="btnCancel" onClick={onClose}>{t("common.cancel")}</button>
          <button type="button" className="btnPrimary" disabled={busy || !valid} onClick={go}><Upload size={15} /> {fill(t("fx.imp.go"), { n: valid })}</button></>}>
      {error && <div className="errorMessage">{error}</div>}
      {result ? (
        <div className={p.infoBanner} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <CheckCircle2 size={18} /> {fill(t("fx.imp.done"), result)}
        </div>
      ) : (
        <>
          <div className={s.twoCols} style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className={s.card}>
              <h3>{t("fx.imp.step1")}</h3>
              <p className={s.muted}>{fill(t("fx.imp.step1Hint"), { what: t(`fx.imp.what.${kind}`) })}</p>
              <button type="button" className="btnEdit" onClick={() => downloadImportTemplate(kind, companyId).catch((err) => setError(errorText(err, t)))}><Download size={15} /> {t("fx.imp.template")}</button>
            </div>
            <div className={s.card}>
              <h3>{t("fx.imp.step2")}</h3>
              <input ref={input} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => pick(e.target.files?.[0])} aria-label={t("fx.imp.pick")} />
              {busy && <p className={s.muted}>{t("fx.common.loading")}</p>}
            </div>
          </div>
          {sum && (
            <>
              <h3 style={{ margin: "16px 0 8px", fontSize: "0.92rem" }}>{t("fx.imp.step3")}</h3>
              <div className={s.chips} style={{ marginBottom: 10 }}>
                <span className={s.tag}>{sum.create} {t("fx.imp.create")}</span>
                <span className={s.tag}>{sum.update} {t("fx.imp.update")}</span>
                {sum.error > 0 && <span className={`${s.tag} ${s.tagBad}`}>{sum.error} {t("fx.imp.errors")}</span>}
                {sum.warnings > 0 && <span className={`${s.tag} ${s.tagWarn}`}>{sum.warnings} {t("fx.imp.warnings")}</span>}
                <label className={p.inlineCheck}><input type="checkbox" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} /> {t("fx.imp.onlyErrors")}</label>
              </div>
              {preview.truncated && <p className={s.muted}>{t("fx.imp.truncated")}</p>}
              {!valid && <div className="errorMessage">{t("fx.imp.nothing")}</div>}
              <div className="dataTable">
                <div className="dataTableHead" style={{ gridTemplateColumns: "60px 1.6fr 0.8fr 2.4fr" }}><span>{t("fx.imp.line")}</span><span>{t("fx.imp.item")}</span><span>{t("fx.common.status")}</span><span>{t("fx.imp.result")}</span></div>
                {rows.map((r) => (
                  <div key={r.line} className="dataTableRow" style={{ gridTemplateColumns: "60px 1.6fr 0.8fr 2.4fr" }}>
                    <span className="dataTableCellMuted">{r.line}</span>
                    <span className="truncate" title={r.label}>{r.label || "—"}</span>
                    <span className={r.action === "error" ? s.bad : r.action === "update" ? s.warn : s.good}>{t(`fx.imp.actions.${r.action}`)}</span>
                    <span style={{ fontSize: "0.8rem" }}>
                      {r.errors.map((e) => <div key={e} className={s.bad}>{e}</div>)}
                      {r.warnings.map((w) => <div key={w} className={s.muted}>{w}</div>)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
