import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Package, Save, Plus, Trash2, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, Layers, ImagePlus, QrCode } from "lucide-react";

import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import CustomSelect from "../../components/useful/CustomSelect";
import ActionModal from "../../components/useful/ActionModal";
import {
  getArticle, createArticle, updateArticle, deleteArticle, adjustStock, getArticleMovements, getBrands, getSalesSettings, createVariants, updateStockLevel,
} from "../../services/negoceService";
import { getInventoryCategories } from "../../services/inventoryCategoryService";
import { useCompanyPicker, useWarehouses, warehouseOptions, PageTop, formatMoney, formatDate, fmtQty, errorText } from "../negoce/common";
import ArticleVisual from "./ArticleVisual";
import { invalidate } from "../../utils/queryCache";
import styles from "../purchasing/Purchasing.module.css";
import { uploadProductPhoto } from "../../services/productService";
import s from "../sales/Sales.module.css";

const EMPTY = {
  name: "", internalReference: "", barcode: "", manufacturerReference: "", category: "", brand: "", unit: "pièce", vatRate: 20,
  sellingPrice: "", minSellingPrice: "", threshold: 0, maxQuantity: "", weightKg: "", tracking: "none", hasExpiry: false, shelfLifeDays: "",
  isService: false, isActive: true, notes: "", priceLevels: [], packagings: [],
};

const UNITS = ["pièce", "m", "m²", "kg", "L", "sac", "seau", "pot", "boîte", "rouleau", "couronne", "barre", "cartouche", "lot"];

/** Fiche article: identity, units & cartons, prices per level, traceability, stock per warehouse, lots, movements. */
export default function ArticleDetail() {
  const { t } = useI18n();
  const can = useCan();
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const isNew = !id;
  const { companyId: picked } = useCompanyPicker();
  const [companyId, setCompanyId] = useState(state?.companyId || "");
  const company = companyId || picked;
  const warehouses = useWarehouses(company);
  const [form, setForm] = useState(() => ({ ...EMPTY, category: state?.category || "" }));
  const [article, setArticle] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [levels, setLevels] = useState([]);
  const [movements, setMovements] = useState([]);
  const [opening, setOpening] = useState({ quantity: "", cost: "", warehouse: "" });
  const [adjust, setAdjust] = useState(null); // { type, warehouse, quantity, unitCost, reason, lotNumber, expiryDate, serials }
  const [variantText, setVariantText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  const load = useCallback(async () => {
    if (isNew) return;
    try {
      const a = await getArticle(id);
      setArticle(a);
      setCompanyId(a.company);
      setForm({
        ...EMPTY, ...a,
        category: a.category?._id || a.category || "", brand: a.brand?._id || a.brand || "",
        sellingPrice: a.sellingPrice ?? "", minSellingPrice: a.minSellingPrice ?? "", maxQuantity: a.maxQuantity ?? "", weightKg: a.weightKg ?? "", shelfLifeDays: a.shelfLifeDays ?? "",
      });
      setMovements(await getArticleMovements(id));
    } catch (err) {
      setError(errorText(err, t, "sales.errors.load"));
    }
  }, [id, isNew, t]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!company) return;
    getInventoryCategories(company).then(setCategories).catch(() => setCategories([]));
    getBrands(company).then(setBrands).catch(() => setBrands([]));
    getSalesSettings(company).then((x) => setLevels(x?.priceLevels || [])).catch(() => setLevels([]));
  }, [company]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e });
  const levelPrice = (code) => form.priceLevels.find((p) => p.level === code)?.price ?? "";
  const setLevelPrice = (code, price) => setForm({ ...form, priceLevels: [...form.priceLevels.filter((p) => p.level !== code), ...(price === "" ? [] : [{ level: code, price }])] });
  const setPack = (i, k, v) => setForm({ ...form, packagings: form.packagings.map((p, j) => (j === i ? { ...p, [k]: v } : p)) });

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = {
        ...form,
        priceLevels: form.priceLevels.map((p) => ({ level: p.level, price: Number(p.price) })),
        packagings: form.packagings.filter((p) => p.unit).map((p) => ({ ...p, factor: Number(p.factor) })),
      };
      ["_id", "company", "quantity", "avgCost", "reserved", "available", "stockByWarehouse", "lots", "variants", "levelPrices", "warehouseStock", "stockValue", "translations", "createdAt", "updatedAt", "createdBy", "updatedBy", "parent", "image", "prices", "lastPurchasePrice", "lastPurchaseAt"].forEach((k) => delete body[k]);
      if (isNew) {
        const created = await createArticle({ ...body, company, initialQuantity: Number(opening.quantity) || 0, initialCost: opening.cost, warehouse: opening.warehouse || undefined });
        invalidate("articles");
        navigate(`/stock/articles/${created._id}`, { replace: true });
      } else {
        await updateArticle(id, body);
        invalidate("articles");
        setNotice(t("ng.common.saved"));
        await load();
      }
    } catch (err) {
      setError(errorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  const doAdjust = async () => {
    setError("");
    setBusy(true);
    try {
      let lots = [];
      if (form.tracking === "lot" && adjust.lotNumber) lots = [{ number: adjust.lotNumber, quantity: Number(adjust.quantity), expiryDate: adjust.expiryDate || null }];
      if (form.tracking === "serial") lots = String(adjust.serials || "").split(/[\s,;]+/).filter(Boolean).map((number) => ({ number, quantity: 1 }));
      invalidate("articles");
      invalidate("levels");
      invalidate("stock-summary");
      await adjustStock(id, { type: adjust.type, warehouse: adjust.warehouse || undefined, quantity: Number(adjust.quantity), unitCost: adjust.unitCost === "" ? undefined : adjust.unitCost, reason: adjust.reason, lots });
      setAdjust(null);
      setNotice(t("ng.common.saved"));
      await load();
    } catch (err) {
      setError(errorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  const makeVariants = async () => {
    // "Couleur: Chromé, Noir mat ; Taille: 1/2\", 3/4\"" → every combination
    const dims = variantText.split(";").map((part) => {
      const [name, values] = part.split(":");
      return { name: String(name || "").trim(), values: String(values || "").split(",").map((v) => v.trim()).filter(Boolean) };
    }).filter((d) => d.name && d.values.length);
    if (!dims.length) return;
    let combos = [[]];
    for (const d of dims) combos = combos.flatMap((c) => d.values.map((v) => [...c, { name: d.name, value: v }]));
    setBusy(true);
    try {
      await createVariants(id, combos);
      setVariantText("");
      await load();
    } catch (err) {
      setError(errorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  const savePhoto = async (imageUrl) => {
    setError("");
    setBusy(true);
    try {
      await updateArticle(id, { imageUrl });
      invalidate("articles");
      setPhotoUrl("");
      setNotice(t("ng.catalog.photoSaved"));
      await load();
    } catch (err) {
      setError(errorText(err, t));
    } finally {
      setBusy(false);
    }
  };
  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    // Uploaded to the client's file storage: resized there (1000 px + a
    // thumbnail) and counted in its quota — a full quota says so here.
    setError("");
    setBusy(true);
    try {
      await uploadProductPhoto(id, file);
      invalidate("articles");
      setNotice(t("ng.catalog.photoSaved"));
      await load();
    } catch (err) {
      setError(errorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  // A warehouse's own minimum (the showroom shelf, a regional depot): drives
  // "à réassortir" on Stock par dépôt. Empty = no minimum there.
  const saveMin = async (level, raw) => {
    const value = raw === "" ? null : Math.max(Number(raw) || 0, 0);
    if ((level.minQuantity ?? null) === value) return;
    try {
      await updateStockLevel(id, level.warehouse._id, { minQuantity: value });
      invalidate("levels");
      invalidate("stock-summary");
      setNotice(t("ng.common.saved"));
      await load();
    } catch (err) {
      setError(errorText(err, t));
    }
  };

  const editable = isNew ? can("inventory.articles.create") : can("inventory.articles.edit");

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.stock"), href: "/stock/articles" }, { label: t("ng.articles.title"), href: "/stock/articles" }, { label: isNew ? t("ng.articles.new") : form.name }]}
        icon={Package} title={isNew ? t("ng.articles.new") : form.name}
        subtitle={article ? `${article.internalReference || ""}${article.brand ? ` · ${article.brand.name}` : ""}${article.category ? ` · ${article.category.name}` : ""}` : ""}>
        {!isNew && !form.isVariantParent && (
          <button type="button" className="btnEdit" onClick={() => navigate(`/stock/labels?add=${id}`)}><QrCode size={15} /> {t("labels.one")}</button>
        )}
        {!isNew && can("inventory.articles.adjust") && !form.isService && !form.isVariantParent && (
          <>
            <button type="button" className="btnEdit" onClick={() => setAdjust({ type: "in", warehouse: "", quantity: "", unitCost: "", reason: "" })}><ArrowDownToLine size={15} /> {t("ng.stock.in")}</button>
            <button type="button" className="btnEdit" onClick={() => setAdjust({ type: "out", warehouse: "", quantity: "", reason: "" })}><ArrowUpFromLine size={15} /> {t("ng.stock.out")}</button>
            <button type="button" className="btnEdit" onClick={() => setAdjust({ type: "set", warehouse: "", quantity: "", reason: "" })}><ClipboardCheck size={15} /> {t("ng.stock.setCount")}</button>
          </>
        )}
      </PageTop>

      {error && <div className="errorMessage">{error}</div>}
      {notice && <div className={styles.infoBanner}>{notice}</div>}

      {article && (
        <div className={s.kpis}>
          <div className={s.kpi}><span>{t("ng.stock.quantity")}</span><strong>{fmtQty(article.quantity)}</strong><small>{article.unit}</small></div>
          <div className={s.kpi}><span>{t("ng.stock.reserved")}</span><strong>{fmtQty(article.reserved)}</strong></div>
          <div className={s.kpi}><span>{t("ng.stock.available")}</span><strong>{fmtQty(article.available)}</strong></div>
          {article.avgCost !== undefined && <div className={s.kpi}><span>{t("ng.articles.cmup")}</span><strong>{formatMoney(article.avgCost, "")}</strong><small>{t("ng.articles.lastPurchase")} {article.lastPurchasePrice ? formatMoney(article.lastPurchasePrice) : "—"}</small></div>}
          {article.stockValue !== undefined && <div className={s.kpi}><span>{t("ng.stock.value")}</span><strong>{formatMoney(article.stockValue)}</strong></div>}
        </div>
      )}

      {article && (
        <div className={styles.panel} style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ width: 220, maxWidth: "100%", borderRadius: 14, overflow: "hidden", border: "1px solid var(--color-border)" }}>
            <ArticleVisual article={article} size="full" />
          </div>
          {editable && (
            <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 10 }}>
              <strong>{t("ng.catalog.photo")}</strong>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input className={styles.input} style={{ flex: "1 1 220px" }} value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder={t("ng.catalog.photoUrl")} />
                <button type="button" className="btnCancel" disabled={busy || !/^https?:\/\//i.test(photoUrl.trim())} onClick={() => savePhoto(photoUrl.trim())}><Save size={14} /></button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <label className="btnEdit" style={{ cursor: "pointer" }}>
                  <ImagePlus size={15} /> {t("ng.catalog.photoUpload")}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={pickPhoto} />
                </label>
                {article.image?.url && <button type="button" className="btnDelete" disabled={busy} onClick={() => savePhoto("")}><Trash2 size={14} /> {t("ng.catalog.photoRemove")}</button>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={s.twoCols}>
        <form className={styles.panel} onSubmit={save}>
          <fieldset disabled={!editable} style={{ border: 0, padding: 0, margin: 0 }}>
            <h3>{t("ng.articles.identity")}</h3>
            <div className={styles.formGrid}>
              <label className={styles.field} style={{ gridColumn: "span 2" }}>{t("ng.articles.name")}<input className={styles.input} required value={form.name} onChange={set("name")} /></label>
              <label className={styles.field}>{t("ng.common.reference")}<input className={styles.input} value={form.internalReference || ""} onChange={set("internalReference")} /></label>
              <label className={styles.field}>{t("ng.articles.barcode")}<input className={styles.input} value={form.barcode || ""} onChange={set("barcode")} placeholder="EAN-13" /></label>
              <label className={styles.field}>{t("ng.articles.manufacturerRef")}<input className={styles.input} value={form.manufacturerReference || ""} onChange={set("manufacturerReference")} /></label>
              <label className={styles.field}>{t("ng.articles.family")}
                <CustomSelect value={form.category} onSelect={(v) => setForm({ ...form, category: v })} placeholder={t("ng.articles.pickFamily")}
                  options={categories.map((c) => ({ value: c._id, label: c.fullName || c.name }))} />
              </label>
              <label className={styles.field}>{t("ng.articles.brand")}
                <CustomSelect value={form.brand || ""} onSelect={(v) => setForm({ ...form, brand: v })}
                  options={[{ value: "", label: "—" }, ...brands.map((b) => ({ value: b._id, label: b.name }))]} />
              </label>
            </div>

            <h3>{t("ng.articles.unitsTitle")}</h3>
            <div className={styles.formGrid}>
              <label className={styles.field}>{t("ng.articles.baseUnit")}
                <input className={styles.input} list="ng-units" value={form.unit} onChange={set("unit")} />
                <datalist id="ng-units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
              </label>
              <label className={styles.field}>{t("ng.articles.weight")}<input className={styles.input} type="number" min="0" step="any" value={form.weightKg} onChange={set("weightKg")} /></label>
            </div>
            <table className={s.miniTable}>
              <thead><tr><th>{t("ng.articles.packaging")}</th><th className={s.num}>{t("ng.articles.factor")}</th><th>{t("ng.articles.barcode")}</th><th /></tr></thead>
              <tbody>
                {form.packagings.map((p, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={i}>
                    <td><input value={p.unit} placeholder="Carton" onChange={(e) => setPack(i, "unit", e.target.value)} /></td>
                    <td><input type="number" min="0" step="any" value={p.factor} onChange={(e) => setPack(i, "factor", e.target.value)} /></td>
                    <td><input value={p.barcode || ""} onChange={(e) => setPack(i, "barcode", e.target.value)} /></td>
                    <td><button type="button" className="tableActionBtn tableActionBtnDanger" onClick={() => setForm({ ...form, packagings: form.packagings.filter((_, j) => j !== i) })}><Trash2 size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="btnEdit" onClick={() => setForm({ ...form, packagings: [...form.packagings, { unit: "Carton", factor: 12, barcode: "" }] })}><Plus size={14} /> {t("ng.articles.addPackaging")}</button>

            <h3>{t("ng.articles.pricesTitle")}</h3>
            <div className={styles.formGrid}>
              <label className={styles.field}>{t("ng.articles.vat")}
                <CustomSelect value={String(form.vatRate)} onSelect={(v) => setForm({ ...form, vatRate: Number(v) })} options={[20, 14, 10, 7, 0].map((r) => ({ value: String(r), label: `${r}%` }))} />
              </label>
              <label className={styles.field}>{t("ng.articles.publicPrice")} HT<input className={styles.input} type="number" min="0" step="0.01" value={form.sellingPrice} onChange={set("sellingPrice")} /></label>
              <label className={styles.field}>{t("ng.articles.minPrice")} HT<input className={styles.input} type="number" min="0" step="0.01" value={form.minSellingPrice} onChange={set("minSellingPrice")} /></label>
              {levels.map((l) => {
                const computed = article?.levelPrices?.find((x) => x.code === l.code);
                return (
                  <label key={l.code} className={styles.field}>{l.code} — {l.label} HT
                    <input className={styles.input} type="number" min="0" step="0.01" value={levelPrice(l.code)} onChange={(e) => setLevelPrice(l.code, e.target.value)}
                      placeholder={computed?.price !== null && computed?.price !== undefined ? `${computed.price} (${t(`ng.pricing.origin.${computed.origin}`)})` : ""} />
                  </label>
                );
              })}
            </div>

            <h3>{t("ng.articles.stockTitle")}</h3>
            <div className={styles.formGrid}>
              <label className={styles.field}>{t("ng.articles.threshold")}<input className={styles.input} type="number" min="0" step="any" value={form.threshold} onChange={set("threshold")} /></label>
              <label className={styles.field}>{t("ng.articles.maxQuantity")}<input className={styles.input} type="number" min="0" step="any" value={form.maxQuantity} onChange={set("maxQuantity")} /></label>
              <label className={styles.field}>{t("ng.articles.trackingLabel")}
                <CustomSelect value={form.tracking} onSelect={(v) => setForm({ ...form, tracking: v, hasExpiry: v === "lot" ? form.hasExpiry : false })}
                  options={["none", "lot", "serial"].map((x) => ({ value: x, label: t(`ng.articles.tracking.${x}`) }))} />
              </label>
              {form.tracking === "lot" && (
                <>
                  <label className={styles.checkboxRow}><input type="checkbox" checked={!!form.hasExpiry} onChange={set("hasExpiry")} /> {t("ng.articles.hasExpiry")}</label>
                  {form.hasExpiry && <label className={styles.field}>{t("ng.articles.shelfLife")}<input className={styles.input} type="number" min="0" value={form.shelfLifeDays} onChange={set("shelfLifeDays")} /></label>}
                </>
              )}
            </div>
            <label className={styles.checkboxRow}><input type="checkbox" checked={!!form.isService} onChange={set("isService")} /> {t("ng.articles.isService")}</label>
            <label className={styles.checkboxRow}><input type="checkbox" checked={form.isActive !== false} onChange={set("isActive")} /> {t("ng.articles.isActive")}</label>
            {isNew && (
              <label className={styles.checkboxRow}><input type="checkbox" checked={!!form.isVariantParent} onChange={set("isVariantParent")} /> {t("ng.articles.isModel")}</label>
            )}
            <label className={styles.field}>{t("sales.notes")}<textarea className={styles.input} rows={2} value={form.notes || ""} onChange={set("notes")} /></label>

            {isNew && !form.isService && !form.isVariantParent && form.tracking === "none" && (
              <>
                <h3>{t("ng.articles.opening")}</h3>
                <div className={styles.formGrid}>
                  <label className={styles.field}>{t("ng.stock.quantity")}<input className={styles.input} type="number" min="0" step="any" value={opening.quantity} onChange={(e) => setOpening({ ...opening, quantity: e.target.value })} /></label>
                  <label className={styles.field}>{t("ng.articles.unitCost")}<input className={styles.input} type="number" min="0" step="0.01" value={opening.cost} onChange={(e) => setOpening({ ...opening, cost: e.target.value })} /></label>
                  {warehouses.length > 1 && (
                    <label className={styles.field}>{t("ng.common.warehouse")}
                      <CustomSelect value={opening.warehouse} onSelect={(v) => setOpening({ ...opening, warehouse: v })} options={warehouseOptions(warehouses, t("ng.common.defaultWarehouse"))} />
                    </label>
                  )}
                </div>
              </>
            )}
          </fieldset>
          <div className={styles.formActions}>
            {!isNew && can("inventory.articles.delete") && <button type="button" className="btnDelete" onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> {t("common.delete")}</button>}
            <button type="button" className="btnCancel" onClick={() => navigate("/stock/articles")}>{t("common.cancel")}</button>
            {editable && <button type="submit" className="btnPrimary" disabled={busy}><Save size={15} /> {t("common.save")}</button>}
          </div>
        </form>

        {article && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {adjust && (
              <div className={s.card}>
                <h3>{t(`ng.stock.${adjust.type === "set" ? "setCount" : adjust.type}`)}</h3>
                <div className={styles.formGrid}>
                  <label className={styles.field}>{t("ng.common.warehouse")}
                    <CustomSelect value={adjust.warehouse} onSelect={(v) => setAdjust({ ...adjust, warehouse: v })} options={warehouseOptions(warehouses, t("ng.common.defaultWarehouse"))} />
                  </label>
                  <label className={styles.field}>{adjust.type === "set" ? t("ng.stock.counted") : t("ng.stock.quantity")}<input className={styles.input} type="number" min="0" step="any" value={adjust.quantity} onChange={(e) => setAdjust({ ...adjust, quantity: e.target.value })} /></label>
                  {adjust.type === "in" && <label className={styles.field}>{t("ng.articles.unitCost")}<input className={styles.input} type="number" min="0" step="0.01" value={adjust.unitCost} onChange={(e) => setAdjust({ ...adjust, unitCost: e.target.value })} placeholder={t("ng.articles.keepCmup")} /></label>}
                  {form.tracking === "lot" && <label className={styles.field}>{t("ng.stock.lotNumber")}<input className={styles.input} value={adjust.lotNumber || ""} onChange={(e) => setAdjust({ ...adjust, lotNumber: e.target.value })} /></label>}
                  {form.tracking === "lot" && form.hasExpiry && adjust.type === "in" && <label className={styles.field}>{t("ng.stock.expiry")}<input className={styles.input} type="date" value={adjust.expiryDate || ""} onChange={(e) => setAdjust({ ...adjust, expiryDate: e.target.value })} /></label>}
                </div>
                {form.tracking === "serial" && <label className={styles.field}>{t("ng.stock.serials")}<textarea className={styles.input} rows={2} value={adjust.serials || ""} onChange={(e) => setAdjust({ ...adjust, serials: e.target.value })} placeholder={t("ng.stock.serialsHint")} /></label>}
                <label className={styles.field}>{t("ng.stock.reason")}<input className={styles.input} value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })} /></label>
                <div className={styles.formActions}>
                  <button type="button" className="btnCancel" onClick={() => setAdjust(null)}>{t("common.cancel")}</button>
                  <button type="button" className="btnPrimary" disabled={busy || adjust.quantity === ""} onClick={doAdjust}>{t("common.confirm")}</button>
                </div>
              </div>
            )}

            <div className={s.card}>
              <h3>{t("ng.stock.byWarehouse")}</h3>
              <table className={s.miniTable}>
                <thead><tr><th>{t("ng.common.warehouse")}</th><th className={s.num}>{t("ng.stock.quantity")}</th><th className={s.num}>{t("ng.stock.reserved")}</th><th className={s.num}>{t("ng.stock.available")}</th><th className={s.num}>{t("ng.levels.minimum")}</th><th>{t("ng.stock.location")}</th></tr></thead>
                <tbody>
                  {(article.stockByWarehouse || []).map((l) => (
                    <tr key={l.warehouse?._id}><td>{l.warehouse?.code} — {l.warehouse?.name}</td><td className={s.num}>{fmtQty(l.quantity)}</td><td className={s.num}>{fmtQty(l.reserved)}</td><td className={s.num}>{fmtQty(l.available)}</td>
                      <td className={s.num}>
                        {can("inventory.articles.edit") ? (
                          <input key={`${l.warehouse?._id}-${l.minQuantity ?? ""}`} type="number" min="0" step="any" defaultValue={l.minQuantity ?? ""} placeholder="—" title={t("ng.levels.minHint")}
                            style={{ width: 72, textAlign: "right" }} className={l.minQuantity && l.quantity <= l.minQuantity ? s.bad : ""}
                            onBlur={(e) => saveMin(l, e.target.value)} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} />
                        ) : l.minQuantity ? fmtQty(l.minQuantity) : "—"}
                      </td>
                      <td>{l.location || "—"}</td></tr>
                  ))}
                  {!(article.stockByWarehouse || []).length && <tr><td colSpan={6} className={s.muted}>{t("ng.stock.none")}</td></tr>}
                </tbody>
              </table>
            </div>

            {(article.lots || []).length > 0 && (
              <div className={s.card}>
                <h3>{form.tracking === "serial" ? t("ng.stock.serials") : t("ng.stock.lots")}</h3>
                <table className={s.miniTable}>
                  <thead><tr><th>N°</th><th>{t("ng.common.warehouse")}</th><th className={s.num}>{t("ng.stock.quantity")}</th><th>{t("ng.stock.expiry")}</th></tr></thead>
                  <tbody>
                    {article.lots.map((l) => (
                      <tr key={l._id}><td>{l.number}</td><td>{l.warehouse?.code}</td><td className={s.num}>{fmtQty(l.quantity)}</td>
                        <td className={l.expiryDate && new Date(l.expiryDate) < new Date(Date.now() + 30 * 86400000) ? s.bad : ""}>{formatDate(l.expiryDate)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(article.levelPrices || []).length > 0 && (
              <div className={s.card}>
                <h3>{t("ng.pricing.title")}</h3>
                <table className={s.miniTable}>
                  <thead><tr><th>{t("ng.pricing.level")}</th><th className={s.num}>HT</th><th className={s.num}>TTC</th><th>{t("ng.pricing.originLabel")}</th></tr></thead>
                  <tbody>
                    {article.levelPrices.map((l) => (
                      <tr key={l.code}><td>{l.code} — {l.label}</td><td className={s.num}>{l.price === null ? "—" : formatMoney(l.price, "")}</td>
                        <td className={s.num}>{l.price === null ? "—" : formatMoney(l.price * (1 + (article.vatRate || 0) / 100), "")}</td><td className={s.muted}>{t(`ng.pricing.origin.${l.origin}`)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(article.isVariantParent || isNew === false) && !article.parent && (
              <div className={s.card}>
                <h3><Layers size={14} /> {t("ng.articles.variants")}</h3>
                {(article.variants || []).map((v) => (
                  <button key={v._id} type="button" className={styles.linkButton} onClick={() => navigate(`/stock/articles/${v._id}`)}>{v.name} · {fmtQty(v.quantity)}</button>
                ))}
                {can("inventory.articles.create") && (article.isVariantParent || !article.quantity) && (
                  <>
                    <input className={styles.input} value={variantText} onChange={(e) => setVariantText(e.target.value)} placeholder={t("ng.articles.variantsHint")} />
                    <button type="button" className="btnEdit" disabled={busy || !variantText.trim()} onClick={makeVariants}><Plus size={14} /> {t("ng.articles.makeVariants")}</button>
                  </>
                )}
              </div>
            )}
            {article.parent && <p className={s.muted}>{t("ng.articles.variantOf")} <button type="button" className={styles.linkButton} onClick={() => navigate(`/stock/articles/${article.parent._id}`)}>{article.parent.name}</button></p>}

            <div className={s.card}>
              <h3>{t("ng.stock.movements")}</h3>
              <table className={s.miniTable}>
                <thead><tr><th>{t("sales.date")}</th><th>{t("ng.stock.movement")}</th><th className={s.num}>{t("ng.stock.quantity")}</th><th>{t("ng.common.warehouse")}</th></tr></thead>
                <tbody>
                  {movements.slice(0, 30).map((m) => (
                    <tr key={m._id}>
                      <td>{formatDate(m.createdAt)}</td>
                      <td>{t(`ng.stock.types.${m.type}`)}{m.source?.number ? ` · ${m.source.number}` : ""}<small className={s.muted} style={{ display: "block" }}>{m.reason}</small></td>
                      <td className={`${s.num} ${["out", "transfer_out"].includes(m.type) ? s.bad : s.good}`}>{["out", "transfer_out"].includes(m.type) ? "−" : m.type === "adjustment" ? "=" : "+"}{fmtQty(m.quantity)}</td>
                      <td>{m.warehouse?.code || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ActionModal isOpen={confirmDelete} type="confirm" title={t("common.delete")} message={t("ng.articles.deleteMessage")}
        onClose={() => setConfirmDelete(false)} onConfirm={async () => { try { await deleteArticle(id); navigate("/stock/articles"); } catch (err) { setConfirmDelete(false); setError(errorText(err, t)); } }} />
    </div>
  );
}
