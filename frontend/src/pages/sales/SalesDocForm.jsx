import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FileSignature, Receipt, Save, ClipboardList, CheckCircle2 } from "lucide-react";

import { useI18n } from "../../hooks/useI18n";
import Breadcrumbs from "../../components/useful/Breadcrumbs";
import CustomSelect from "../../components/useful/CustomSelect";
import SearchSelect from "../../components/useful/SearchSelect";
import SalesLinesEditor from "./SalesLinesEditor";
import { getCustomers, getQuote, createQuote, updateQuote, getInvoice, createInvoice, updateInvoice } from "../../services/salesService";
import { getSalesOrder, createSalesOrder, updateSalesOrder, getWarehouses } from "../../services/negoceService";
import { useCompanyPicker, emptySalesLine, cleanLines, toInputDate, todayInput } from "./salesShared";
import styles from "../purchasing/Purchasing.module.css";

/**
 * Create / edit a devis (kind="quote"), a commande client (kind="order")
 * or a draft invoice / credit note (kind="invoice"). Same form: customer,
 * dates, lines priced at the customer's level, terms. A direct invoice
 * (customer "facture directe") takes the goods out of the chosen
 * warehouse when it is issued.
 */
export default function SalesDocForm({ kind }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isQuote = kind === "quote";
  const isOrder = kind === "order";
  const [warehouses, setWarehouses] = useState([]);
  const { companyId: pickedCompany, setCompanyId, options: companyOptions } = useCompanyPicker();
  const [companyId, setLocalCompany] = useState(location.state?.companyId || "");
  const effectiveCompany = companyId || pickedCompany;
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [doc, setDoc] = useState({
    customer: location.state?.customerId || "",
    date: todayInput(),
    validUntil: "",
    dueDate: "",
    subject: "",
    type: location.state?.type || "invoice",
    lines: [emptySalesLine()],
    paymentTerms: "",
    notes: "",
    warehouse: "",
    moveStock: undefined,
    deliveryMode: "delivery",
    customerReference: "",
    expectedDate: "",
    confirm: false,
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const d = isQuote ? await getQuote(id) : isOrder ? await getSalesOrder(id) : await getInvoice(id);
        setLocalCompany(d.company);
        setDoc({
          customer: d.customer?._id || d.customer,
          date: toInputDate(d.date),
          validUntil: toInputDate(d.validUntil),
          dueDate: toInputDate(d.dueDate),
          subject: d.subject || "",
          type: d.type,
          lines: d.lines.map((l) => ({ ...l, product: l.product?._id || l.product || "" })),
          paymentTerms: d.paymentTerms || "",
          notes: d.notes || "",
          warehouse: d.warehouse?._id || d.warehouse || "",
          moveStock: d.moveStock,
          deliveryMode: d.deliveryMode || "delivery",
          customerReference: d.customerReference || "",
          expectedDate: toInputDate(d.expectedDate),
          confirm: false,
        });
      } catch (err) {
        setError(err.response?.data?.message || t("sales.errors.load"));
      }
    })();
  }, [id, isQuote, isOrder, t]);

  useEffect(() => {
    if (!effectiveCompany) return;
    getCustomers(effectiveCompany, { active: "true" }).then(setCustomers).catch(() => setCustomers([]));
    getWarehouses(effectiveCompany).then(setWarehouses).catch(() => setWarehouses([]));
  }, [effectiveCompany]);
  const customer = customers.find((c) => c._id === doc.customer);
  const direct = !isQuote && !isOrder && doc.type !== "credit_note" && (doc.moveStock ?? customer?.documentFlow === "direct");

  const set = (k) => (e) => setDoc({ ...doc, [k]: e.target.value });

  const [warning, setWarning] = useState("");
  const confirmRef = useRef(false); // "Enregistrer et confirmer" (order)
  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isOrder) {
        const body = {
          customer: doc.customer, date: doc.date, expectedDate: doc.expectedDate || null, lines: cleanLines(doc.lines), paymentTerms: doc.paymentTerms, notes: doc.notes,
          warehouse: doc.warehouse || null, deliveryMode: doc.deliveryMode, customerReference: doc.customerReference,
        };
        if (id) {
          const saved = await updateSalesOrder(id, body);
          navigate(`/sales/orders/${saved._id}`);
        } else {
          const res = await createSalesOrder({ ...body, company: effectiveCompany, confirm: confirmRef.current });
          if (res.warning) setWarning(res.warning);
          navigate(`/sales/orders/${res.data._id}`, { state: res.warning ? { warning: res.warning } : undefined });
        }
        return;
      }
      const payload = {
        customer: doc.customer,
        date: doc.date,
        subject: doc.subject,
        lines: cleanLines(doc.lines),
        paymentTerms: doc.paymentTerms,
        notes: doc.notes,
        ...(isQuote ? { validUntil: doc.validUntil || undefined } : { dueDate: doc.dueDate || undefined, type: doc.type, moveStock: direct, warehouse: doc.warehouse || null }),
      };
      let saved;
      if (isQuote) saved = id ? await updateQuote(id, payload) : await createQuote({ ...payload, company: effectiveCompany });
      else saved = id ? await updateInvoice(id, payload) : await createInvoice({ ...payload, company: effectiveCompany });
      navigate(isQuote ? `/sales/quotes/${saved._id}` : `/sales/invoices/${saved._id}`);
    } catch (err) {
      setError(err.response?.data?.message || t("sales.errors.save"));
    } finally {
      setSaving(false);
    }
  };

  const title = isOrder
    ? (id ? t("ng.orders.edit") : t("ng.orders.new"))
    : isQuote
    ? (id ? t("sales.quotes.edit") : t("sales.quotes.new"))
    : (id ? t("sales.invoices.edit") : doc.type === "credit_note" ? t("sales.invoices.newCredit") : t("sales.invoices.new"));
  const Icon = isOrder ? ClipboardList : isQuote ? FileSignature : Receipt;

  return (
    <div className="pageShell">
      <Breadcrumbs items={[
        { label: t("sidebar.sales"), href: "/sales/quotes" },
        { label: isOrder ? t("ng.orders.title") : isQuote ? t("sales.quotes.title") : t("sales.invoices.title"), href: isOrder ? "/sales/orders" : isQuote ? "/sales/quotes" : "/sales/invoices" },
        { label: title },
      ]} />
      <div className="pageHeader">
        <div className="pageTitleRow"><Icon size={20} /><h1>{title}</h1></div>
      </div>

      {error && <div className="errorMessage">{error}</div>}
      {warning && <div className={styles.infoBanner}>{warning}</div>}

      <form onSubmit={save}>
        <div className={styles.formGrid}>
          {!id && !location.state?.companyId && (
            <label className={styles.field}>{t("employees.toolbar.company")}
              <CustomSelect value={pickedCompany} onSelect={setCompanyId} options={companyOptions} />
            </label>
          )}
          <label className={styles.field}>{t("sales.customer")}
            <SearchSelect value={doc.customer} onSelect={(v) => {
              const c = customers.find((x) => x._id === v);
              setDoc({ ...doc, customer: v, warehouse: doc.warehouse || c?.defaultWarehouse || "" });
            }}
              options={customers.map((c) => ({ value: c._id, label: `${c.code ? `${c.code} — ` : ""}${c.name}${c.city ? ` (${c.city})` : ""}` }))} placeholder={t("sales.pickCustomer")} noResultsLabel={t("sales.noCustomer")} />
            {customer && (
              <small className={styles.muted}>
                {t(`ng.customers.types.${customer.type}`)} · {t("ng.pricing.level")} {customer.priceLevel || "—"}
                {customer.discountPercent ? ` · −${customer.discountPercent}%` : ""}
                {customer.creditLimit ? ` · ${t("ng.customers.creditLimit")} ${customer.creditLimit.toLocaleString("fr-MA")} MAD` : ""}
                {customer.due ? ` · ${t("ng.customers.due")} ${customer.due.toLocaleString("fr-MA")} MAD` : ""}
                {customer.blocked ? ` · ${t("ng.customers.blocked")}` : ""}
              </small>
            )}
          </label>
          {(isOrder || direct) && warehouses.length > 0 && (
            <label className={styles.field}>{t("ng.common.warehouse")}
              <CustomSelect value={doc.warehouse} onSelect={(v) => setDoc({ ...doc, warehouse: v })} placeholder={t("ng.common.defaultWarehouse")}
                options={[{ value: "", label: t("ng.common.defaultWarehouse") }, ...warehouses.filter((w) => w.isActive !== false).map((w) => ({ value: w._id, label: `${w.code} — ${w.name}` }))]} />
            </label>
          )}
          {isOrder && (
            <>
              <label className={styles.field}>{t("ng.orders.customerReference")}<input className={styles.input} value={doc.customerReference} onChange={set("customerReference")} /></label>
              <label className={styles.field}>{t("ng.orders.expectedDate")}<input className={styles.input} type="date" value={doc.expectedDate} onChange={set("expectedDate")} /></label>
              <label className={styles.field}>{t("ng.orders.deliveryMode")}
                <CustomSelect value={doc.deliveryMode} onSelect={(v) => setDoc({ ...doc, deliveryMode: v })}
                  options={[{ value: "delivery", label: t("ng.orders.modes.delivery") }, { value: "pickup", label: t("ng.orders.modes.pickup") }]} />
              </label>
            </>
          )}
          <label className={styles.field}>{t("sales.date")}<input className={styles.input} type="date" required value={doc.date} onChange={set("date")} /></label>
          {isQuote
            ? <label className={styles.field}>{t("sales.validUntil")}<input className={styles.input} type="date" value={doc.validUntil} onChange={set("validUntil")} placeholder={t("sales.quotes.validDefault")} /></label>
            : !isOrder && doc.type !== "credit_note" && <label className={styles.field}>{t("sales.dueDate")}<input className={styles.input} type="date" value={doc.dueDate} onChange={set("dueDate")} /></label>}
          {!isOrder && <label className={styles.field} style={{ gridColumn: "span 2" }}>{t("sales.subject")}<input className={styles.input} value={doc.subject} onChange={set("subject")} /></label>}
        </div>
        {isQuote && !doc.validUntil && <p className={styles.muted}>{t("sales.quotes.validDefault")}</p>}
        {!isQuote && !isOrder && doc.type !== "credit_note" && !doc.dueDate && <p className={styles.muted}>{t("sales.invoices.dueDefault")}</p>}
        {!isQuote && !isOrder && doc.type !== "credit_note" && (
          <label className={styles.checkboxRow}>
            <input type="checkbox" checked={!!direct} onChange={(e) => setDoc({ ...doc, moveStock: e.target.checked })} /> {t("ng.invoices.directHint")}
          </label>
        )}

        <h2 className={styles.subTitle}>{t("sales.lines.title")}</h2>
        <SalesLinesEditor lines={doc.lines} onChange={(lines) => setDoc({ ...doc, lines })}
          companyId={effectiveCompany} customerId={doc.customer || null} />

        <div className={styles.formGrid}>
          <label className={styles.field} style={{ gridColumn: "span 2" }}>{t("sales.paymentTerms")}
            <input className={styles.input} value={doc.paymentTerms} onChange={set("paymentTerms")} placeholder={t("sales.paymentTermsPlaceholder")} />
          </label>
          <label className={styles.field} style={{ gridColumn: "span 2" }}>{t("sales.notes")}
            <textarea className={styles.input} rows={2} value={doc.notes} onChange={set("notes")} />
          </label>
        </div>

        <div className={styles.formActions}>
          <button type="button" className="btnCancel" onClick={() => navigate(-1)}>{t("common.cancel")}</button>
          <button type="submit" className="btnPrimary" disabled={saving || !doc.customer} onClick={() => { confirmRef.current = false; }}><Save size={15} /> {isOrder && !id ? t("ng.orders.saveDraft") : t("common.save")}</button>
          {isOrder && !id && (
            <button type="submit" className="btnPrimary" disabled={saving || !doc.customer} onClick={() => { confirmRef.current = true; }}><CheckCircle2 size={15} /> {t("ng.orders.saveConfirm")}</button>
          )}
        </div>
      </form>
    </div>
  );
}
