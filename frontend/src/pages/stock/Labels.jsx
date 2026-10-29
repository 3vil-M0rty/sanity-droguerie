import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { QrCode, Printer, Trash2, ListPlus, Loader2 } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import ArticlePicker from "../../components/useful/ArticlePicker";
import { listArticles, getArticlesBrief } from "../../services/negoceService";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, errorText } from "../negoce/common";
import { labelCode, labelPriceTTC, LABEL_FORMATS, MAX_LABEL_ARTICLES, MAX_COPIES, encodeItems } from "./labelCodes";
import styles from "../purchasing/Purchasing.module.css";
import l from "./Labels.module.css";

/**
 * QR price labels: pick articles and how many labels of each, then
 * print them on an A4 sticker sheet (opens in its own tab, like the
 * till ticket). Each QR code is read by the till's camera scanner.
 */
export default function Labels() {
  const { t, tVar } = useI18n();
  const location = useLocation();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [items, setItems] = useState([]); // [{ article, copies }]
  const [format, setFormat] = useState("medium");
  const [showPrice, setShowPrice] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const addArticle = (article, copies = 1) => setItems((list) => {
    if (!article?._id || list.some((i) => i.article._id === article._id)) return list;
    if (list.length >= MAX_LABEL_ARTICLES) { setError(t("labels.tooMany")); return list; }
    return [...list, { article, copies }];
  });

  // /stock/labels?add=<id> — from an article's page.
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("add");
    if (!companyId || !id) return;
    getArticlesBrief(companyId, [id]).then((r) => r[0] && addArticle(r[0])).catch(() => {});
  }, [companyId, location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  const addCatalogue = async () => {
    setBusy(true);
    setError("");
    try {
      const all = [];
      for (let page = 1; all.length < MAX_LABEL_ARTICLES; page++) {
        const { articles, pagination } = await listArticles({ companyId, page, limit: 100 });
        all.push(...articles.filter((a) => !a.isVariantParent && a.isActive !== false));
        if (!pagination?.hasNext) break;
      }
      setItems((list) => {
        const known = new Set(list.map((i) => i.article._id));
        return [...list, ...all.filter((a) => !known.has(a._id)).map((article) => ({ article, copies: 1 }))].slice(0, MAX_LABEL_ARTICLES);
      });
    } catch (err) {
      setError(errorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  const setCopies = (id, value) => setItems((list) => list.map((i) => (i.article._id === id
    ? { ...i, copies: value === "" ? "" : Math.min(Math.max(Math.floor(Number(value)) || 1, 1), MAX_COPIES) }
    : i)));

  const total = items.reduce((n, i) => n + (Number(i.copies) || 1), 0);
  const f = LABEL_FORMATS[format];
  const pages = Math.ceil(total / (f.cols * f.rows));

  const print = () => {
    const params = new URLSearchParams({
      companyId,
      format,
      price: showPrice ? "1" : "0",
      items: encodeItems(items.map((i) => ({ id: i.article._id, copies: Number(i.copies) || 1 }))),
    });
    window.open(`/etiquettes?${params}`, "_blank", "noopener");
  };

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.stock"), href: "/stock/articles" }, { label: t("labels.title") }]} icon={QrCode}
        title={t("labels.title")} subtitle={t("labels.subtitle")}>
        <button type="button" className="btnPrimary" disabled={!items.length} onClick={print}><Printer size={15} /> {t("labels.print")}</button>
      </PageTop>

      {error && <div className="errorMessage">{error}</div>}

      <div className={styles.toolbar}>
        <CompanyFilter companyId={companyId} setCompanyId={(v) => { setCompanyId(v); setItems([]); }} options={options} />
      </div>

      <div className={l.layout}>
        <section className={l.panel}>
          <div className={l.addRow}>
            <div className={l.picker}>
              <ArticlePicker companyId={companyId} value="" article={null} onPick={(a) => addArticle(a)} placeholder={t("labels.add")} showStock={false} />
            </div>
            <button type="button" className="btnEdit" disabled={!companyId || busy} onClick={addCatalogue}>
              {busy ? <Loader2 size={15} className="spin" /> : <ListPlus size={15} />} {t("labels.addAll")}
            </button>
            {items.length > 0 && (
              <button type="button" className="btnCancel" onClick={() => setItems([])}>{t("labels.clear")}</button>
            )}
          </div>

          {!items.length ? (
            <div className={l.empty}><QrCode size={34} /><p>{t("labels.empty")}</p></div>
          ) : (
            <ul className={l.list}>
              {items.map(({ article: a, copies }) => (
                <li key={a._id} className={l.item}>
                  <div className={l.itemText}>
                    <strong>{a.name}</strong>
                    <small>{formatMoney(labelPriceTTC(a))} · <code>{labelCode(a)}</code></small>
                  </div>
                  <label className={l.copies}>
                    <span>{t("labels.copies")}</span>
                    <input type="number" inputMode="numeric" min="1" max={MAX_COPIES} value={copies}
                      onChange={(e) => setCopies(a._id, e.target.value)} onBlur={(e) => setCopies(a._id, e.target.value || 1)} />
                  </label>
                  <button type="button" className="tableActionBtn tableActionBtnDanger" title={t("common.delete")} aria-label={t("common.delete")}
                    onClick={() => setItems((list) => list.filter((i) => i.article._id !== a._id))}>
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className={l.panel}>
          <h3 className={l.panelTitle}>{t("labels.format")}</h3>
          {Object.keys(LABEL_FORMATS).map((key) => (
            <label key={key} className={`${l.option} ${format === key ? l.optionOn : ""}`}>
              <input type="radio" name="labelFormat" checked={format === key} onChange={() => setFormat(key)} />
              <span className={`${l.sample} ${l[`sample_${key}`]}`} aria-hidden="true"><QrCode size={key === "small" ? 12 : 18} /></span>
              <span>{t(key === "small" ? "labels.formatSmall" : "labels.formatMedium")}</span>
            </label>
          ))}
          <label className={l.check}>
            <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} /> {t("labels.showPrice")}
          </label>
          <p className={l.summary}>{tVar("labels.count", { labels: total, pages })}</p>
          <p className={l.hint}>{t("labels.codeHint")}</p>
          <p className={l.hint}>{t("labels.printHint")}</p>
          <button type="button" className={`btnPrimary ${l.printBtn}`} disabled={!items.length} onClick={print}><Printer size={15} /> {t("labels.print")}</button>
        </aside>
      </div>
    </div>
  );
}
