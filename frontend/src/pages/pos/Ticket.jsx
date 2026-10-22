import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPosSale } from "../../services/negoceService";
import p from "./Pos.module.css";

const m = (n) => (Number(n) || 0).toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const METHOD = { especes: "Espèces", carte: "Carte", cheque: "Chèque", virement: "Virement", credit: "En compte" };

/** 80 mm thermal ticket — opens in its own tab and prints itself. */
export default function Ticket() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getPosSale(id).then((x) => { setSale(x); setTimeout(() => window.print(), 300); }).catch((err) => setError(err.response?.data?.message || "Ticket introuvable"));
  }, [id]);
  if (error) return <p style={{ padding: 20 }}>{error}</p>;
  if (!sale) return null;
  const c = sale.company || {};
  const vat = {};
  sale.lines.forEach((l) => {
    const ht = l.quantity * l.unitPrice * (1 - (l.discount || 0) / 100);
    vat[l.vatRate] = (vat[l.vatRate] || 0) + ht * (l.vatRate / 100);
  });
  return (
    <div className={p.ticketPage}>
      <div className={p.ticketActions}>
        <button type="button" className="btnPrimary" onClick={() => window.print()}>Imprimer</button>
        <button type="button" className="btnCancel" onClick={() => window.close()}>Fermer</button>
      </div>
      <div className={p.ticket}>
        <h2>{c.tradeName || c.name}</h2>
        <div className={p.center}>{sale.ticketHeader || [c.address?.street, c.address?.city, c.phone].filter(Boolean).join("\n")}</div>
        <div className={p.center}>{[c.ice && `ICE ${c.ice}`, c.taxId && `IF ${c.taxId}`, c.registrationNumber && `RC ${c.registrationNumber}`, c.professionalTaxNumber && `TP ${c.professionalTaxNumber}`].filter(Boolean).join(" · ")}</div>
        <hr />
        <div>Ticket {sale.number}{sale.status === "refunded" ? " — REMBOURSÉ" : ""}</div>
        <div>{new Date(sale.date).toLocaleString("fr-FR")}</div>
        <div>Caisse : {sale.cashier?.firstName} {sale.cashier?.lastName}</div>
        {(sale.customer && sale.customer.name !== "Client comptoir") || sale.customerName ? <div>Client : {sale.customer?.name !== "Client comptoir" ? sale.customer?.name : sale.customerName}</div> : null}
        <hr />
        <table>
          <tbody>
            {sale.lines.map((l) => {
              const ttc = l.quantity * l.unitPrice * (1 - (l.discount || 0) / 100) * (1 + l.vatRate / 100);
              return (
                <tr key={l._id}>
                  <td colSpan={2}>{l.description}<br />{l.quantity} {l.unit} × {m(l.unitPrice * (1 + l.vatRate / 100))}{l.discount ? ` −${l.discount}%` : ""}</td>
                  <td className={p.r}>{m(ttc)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <hr />
        <table>
          <tbody>
            <tr><td>Total HT</td><td className={p.r}>{m(sale.totalHT)}</td></tr>
            {Object.entries(vat).filter(([r]) => Number(r) > 0).map(([r, v]) => <tr key={r}><td>TVA {r}%</td><td className={p.r}>{m(v)}</td></tr>)}
            <tr className={p.tot}><td>TOTAL TTC</td><td className={p.r}>{m(sale.totalTTC)} MAD</td></tr>
            {sale.payments.map((x) => <tr key={x.method}><td>{METHOD[x.method] || x.method}</td><td className={p.r}>{m(x.amount)}</td></tr>)}
            {sale.change > 0 && <tr><td>Rendu</td><td className={p.r}>{m(sale.change)}</td></tr>}
          </tbody>
        </table>
        {sale.invoice && <><hr /><div>Facture {sale.invoice.number}</div></>}
        <hr />
        <div className={p.center}>{sale.ticketFooter}</div>
      </div>
    </div>
  );
}
