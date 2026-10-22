import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store, ShoppingCart, BookOpen, Truck, PackagePlus, Boxes, AlertTriangle } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useAuth } from "../../hooks/useAuth";
import { getShopHome, whatsappReminder } from "../../services/droguerieService";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, errorText } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import d from "./Droguerie.module.css";

/**
 * Sanity Droguerie — the shop home: big buttons for what the shop does
 * all day, today's takings, who owes the shop, what it owes, what to
 * reorder.
 */
export default function Boutique() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [home, setHome] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!companyId) return;
    getShopHome(companyId).then(setHome).catch((err) => setError(errorText(err, t, "sales.errors.load")));
  }, [companyId, t]);

  const shop = options.find((o) => o.value === companyId)?.label || "";
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("dg.menu.home") }]} icon={Store} title={`${t("dg.home.hello")} ${user?.firstName || ""}`} subtitle={shop ? `${shop} — ${t("dg.home.subtitle")}` : t("dg.home.subtitle")} />
      <div className={styles.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
      {error && <div className="errorMessage">{error}</div>}

      <div className={d.tiles}>
        <Link to="/pos" className={`${d.tile} ${d.tilePrimary}`}><ShoppingCart size={26} />{t("dg.home.sell")}<small>{home?.session ? `${t("dg.home.tillOpen")} ${home.session.number}` : t("dg.home.tillClosed")}</small></Link>
        <Link to="/boutique/carnet" className={d.tile}><BookOpen size={26} />{t("dg.menu.carnet")}<small>{t("dg.home.carnetHint")}</small></Link>
        <Link to="/boutique/achat" className={d.tile}><PackagePlus size={26} />{t("dg.menu.purchase")}<small>{t("dg.home.purchaseHint")}</small></Link>
        <Link to="/boutique/fournisseurs" className={d.tile}><Truck size={26} />{t("dg.menu.suppliers")}<small>{t("dg.home.suppliersHint")}</small></Link>
        <Link to="/stock/articles" className={d.tile}><Boxes size={26} />{t("dg.menu.articles")}<small>{t("dg.home.articlesHint")}</small></Link>
      </div>

      {home && (
        <>
          <div className={d.stats}>
            <div className={d.stat}><span>{t("dg.home.today")}</span><strong>{formatMoney(home.today.totalTTC)}</strong><small>{home.today.tickets} {t("dg.home.tickets")}</small></div>
            <div className={d.stat}>
              <span>{t("dg.home.cashToday")}</span>
              <strong className={d.good}>{formatMoney(Object.entries(home.today.byMethod || {}).reduce((sum, [m, v]) => (m === "credit" ? sum : sum + v), 0))}</strong>
              <small>{[...Object.entries(home.today.byMethod || {}).filter(([m, v]) => m !== "credit" && v).map(([m, v]) => `${t(`dg.methods.${m}`)} ${formatMoney(v, "")}`), `${t("dg.home.onCreditToday")} ${formatMoney(home.today.onCredit, "")}`].join(" · ")}</small>
            </div>
            <div className={d.stat}><span>{t("dg.home.carnetTotal")}</span><strong className={d.owed}>{formatMoney(home.carnet.total)}</strong><small>{home.carnet.customers} {t("dg.home.customers")}</small></div>
            <div className={d.stat}><span>{t("dg.home.iOwe")}</span><strong>{formatMoney(home.suppliers.total)}</strong><small>{home.suppliers.count} {t("dg.home.suppliersCount")}</small></div>
          </div>

          <div className={d.columns}>
            <div className={d.box}>
              <h3><BookOpen size={15} /> {t("dg.home.topDebtors")}</h3>
              <ul className={d.list}>
                {home.carnet.top.map((c) => {
                  const wa = whatsappReminder(c.phone, t("dg.carnet.waText").replace("{name}", c.name).replace("{amount}", formatMoney(c.due)).replace("{shop}", shop));
                  return (
                    <li key={c._id}>
                      <Link to={`/boutique/carnet?c=${c._id}`}>{c.name}</Link>
                      <span>
                        <strong className={d.owed}>{formatMoney(c.due)}</strong>
                        {wa && <> {" "}<a className={d.wa} href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a></>}
                      </span>
                    </li>
                  );
                })}
                {!home.carnet.top.length && <li className={d.muted}>{t("dg.home.nobodyOwes")}</li>}
              </ul>
            </div>
            <div className={d.box}>
              <h3><AlertTriangle size={15} /> {t("dg.home.reorder")}</h3>
              <ul className={d.list}>
                {home.lowStock.map((p) => (
                  <li key={p._id}><Link to={`/stock/articles/${p._id}`}>{p.name}</Link><span className={d.owed}>{p.quantity} / {p.threshold} {p.unit}</span></li>
                ))}
                {!home.lowStock.length && <li className={d.muted}>{t("dg.home.stockOk")}</li>}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
