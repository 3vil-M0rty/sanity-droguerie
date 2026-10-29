import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Printer, X } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { getArticlesBrief } from "../../services/negoceService";
import { formatMoney } from "../negoce/common";
import { labelCode, labelPriceTTC, LABEL_FORMATS, decodeItems } from "./labelCodes";
import l from "./Labels.module.css";

/**
 * The A4 sheet of QR labels — its own tab (no sidebar) so it prints
 * alone, and prints itself once every QR code is drawn.
 * /etiquettes?companyId=…&format=medium|small&price=1&items=id*copies,…
 */
export default function LabelsPrint() {
  const { t } = useI18n();
  const params = new URLSearchParams(useLocation().search);
  const companyId = params.get("companyId");
  const formatKey = LABEL_FORMATS[params.get("format")] ? params.get("format") : "medium";
  const showPrice = params.get("price") !== "0";
  const itemsParam = params.get("items");
  const [labels, setLabels] = useState(null); // [{ key, article, svg }]
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = decodeItems(itemsParam);
        const ids = items.map((i) => i.id);
        const chunks = [];
        for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));
        const [found, { default: QRCode }] = await Promise.all([
          Promise.all(chunks.map((c) => getArticlesBrief(companyId, c))).then((r) => r.flat()),
          import("qrcode"),
        ]);
        const byId = new Map(found.map((a) => [a._id, a]));
        const out = [];
        for (const { id, copies } of items) {
          const article = byId.get(id);
          if (!article) continue;
          const svg = await QRCode.toString(labelCode(article), { type: "svg", margin: 0, errorCorrectionLevel: "M" });
          for (let n = 0; n < copies; n++) out.push({ key: `${id}-${n}`, article, svg });
        }
        if (cancelled) return;
        setLabels(out);
        if (out.length) setTimeout(() => window.print(), 400);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || t("labels.noArticles"));
      }
    })();
    return () => { cancelled = true; };
  }, [companyId, itemsParam, t]);

  if (error) return <p style={{ padding: 20 }}>{error}</p>;
  if (!labels) return <p className={l.loading}>{t("labels.loading")}</p>;
  if (!labels.length) return <p style={{ padding: 20 }}>{t("labels.noArticles")}</p>;

  const f = LABEL_FORMATS[formatKey];
  const perPage = f.cols * f.rows;
  const sheets = [];
  for (let i = 0; i < labels.length; i += perPage) sheets.push(labels.slice(i, i + perPage));
  const sheetStyle = {
    padding: `${f.top}mm 0 0 ${f.left}mm`,
    gridTemplateColumns: `repeat(${f.cols}, ${f.width}mm)`,
    gridAutoRows: `${f.height}mm`,
    columnGap: `${f.gapX}mm`,
    rowGap: `${f.gapY}mm`,
  };

  return (
    <div className={l.printPage}>
      <div className={l.printBar}>
        <span>{t("labels.printHint")}</span>
        <button type="button" className={l.printBarBtn} onClick={() => window.print()}><Printer size={16} /> {t("labels.print")}</button>
        <button type="button" className={l.printBarBtn} onClick={() => window.close()}><X size={16} /> {t("common.close")}</button>
      </div>
      {sheets.map((sheet, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className={l.sheet} style={sheetStyle}>
          {sheet.map(({ key, article: a, svg }) => (
            <div key={key} className={`${l.label} ${l[`label_${formatKey}`]}`}>
              {/* SVG markup generated locally by the qrcode library from the article's code */}
              <div className={l.qr} dangerouslySetInnerHTML={{ __html: svg }} />
              <div className={l.labelText}>
                <span className={l.labelName}>{a.name}</span>
                {showPrice && <span className={l.labelPrice}>{formatMoney(labelPriceTTC(a))}</span>}
                {formatKey === "medium" && <span className={l.labelCode}>{labelCode(a)}{a.unit ? ` · ${a.unit}` : ""}</span>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
