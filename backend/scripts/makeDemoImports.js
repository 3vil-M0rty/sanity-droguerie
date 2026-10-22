/**
 * Example Excel files to try the imports on the demo company
 * (Stock › Articles, Ventes › Clients, Stock › Stock par dépôt →
 * « Importer (Excel) »). Each file has good rows, one update of an
 * existing record and one row with mistakes, to see the check at work.
 *
 *   npm run demo:imports   → docs/demo-imports/*.xlsx
 */
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");

const OUT = path.join(__dirname, "..", "..", "docs", "demo-imports");

const FILES = {
  "1-articles-exemple.xlsx": [
    ["Référence", "Désignation", "Famille", "Marque", "Code-barres", "Unité", "TVA", "Prix public HT", "P1", "P2", "Stock min", "Traçabilité", "Conditionnement", "Prix d'achat HT", "Fournisseur", "Poids kg"],
    ["BOS-GSB-18", "Perceuse-visseuse à percussion 18 V GSB 18V-55", "Outillage > Électroportatif", "Bosch", "3165140999001", "pièce", 20, 1490, 1190, 1290, 4, "série", "Carton:2:3165140999018", 1020, "Bosch Maroc", 2.1],
    ["BOS-GWS-750", "Meuleuse d'angle 750 W GWS 750-125", "Outillage > Électroportatif", "Bosch", "3165140999025", "pièce", 20, 690, 545, 595, 6, "aucune", "Carton:5", 470, "Bosch Maroc", 1.9],
    ["MAK-HR2470", "Perforateur SDS-Plus 780 W HR2470", "Outillage > Électroportatif", "Makita", "0088381999011", "pièce", 20, 1650, 1320, 1420, 3, "série", "", 1130, "Makita Distribution Maroc", 2.6],
    ["STA-NIV-60", "Niveau à bulle 60 cm FatMax", "Outillage > Outillage à main", "Stanley", "3253561999032", "pièce", 20, 165, 128, 139, 10, "aucune", "Carton:12:3253561999049", 104, "Stanley Black & Decker", 0.5],
    ["SIK-FLEX-11", "Mastic polyuréthane Sikaflex-11 FC 300 ml", "Quincaillerie > Colles & mastics", "Sika", "7612895999051", "cartouche", 20, 62, 47, 52, 48, "lot+péremption", "Carton:12:7612895999068", 39, "Sika Maroc", 0.4],
    ["COL-GLY-4", "Peinture glycéro brillante blanc 4 L", "Peinture > Peintures murales", "Colorado", "6111245999073", "pot", 20, 210, 162, 176, 20, "lot", "Carton:4", 128, "Colorado", 5],
    ["STA-MET-5", "Mètre ruban 5 m (prix révisé)", "Outillage > Outillage à main", "Stanley", "", "pièce", 20, 79, "", "", 30, "", "", "", "", ""],
    ["", "Ligne avec des erreurs (exemple)", "Outillage", "", "", "pièce", 18, "abc", "", "", "", "", "Carton", "", "", ""],
  ],
  "2-clients-exemple.xlsx": [
    ["Code", "Nom", "Type", "Niveau de prix", "ICE", "Téléphone", "E-mail", "Adresse", "Ville", "Zone", "Commercial", "Plafond de crédit", "Délai de paiement", "Circuit", "Remise %"],
    ["", "Quincaillerie Al Firdaous", "revendeur", "P1", "001987654000034", "0661 44 55 66", "achat@alfirdaous.ma", "23 bd Al Qods", "Casablanca", "Casa Est", "karim@sanity.test", 60000, 60, "complet", 0],
    ["", "Bricodépôt Tanger Med", "revendeur", "P1", "002111222000045", "0539 33 22 11", "contact@bricotanger.ma", "Zone franche, lot 8", "Tanger", "Nord", "leila@sanity.test", 90000, 60, "complet", 2],
    ["", "Plomberie Saïdi & Fils", "installateur", "P2", "", "0662 10 20 30", "", "Hay Mohammadi", "Casablanca", "Casa Ouest", "Karim Terrain", 15000, 30, "direct", 0],
    ["", "Résidences Al Manar SA", "entreprise", "P2", "001555666000077", "0522 98 76 54", "achats@almanar.ma", "Bd Anfa, tour B", "Casablanca", "Casa Ouest", "karim@sanity.test", 300000, 90, "complet", 0],
    ["", "Mme Benjelloun", "particulier", "P3", "", "0670 11 22 33", "", "Gueliz", "Marrakech", "Marrakech", "", "", 0, "direct", 0],
    ["CL-0001", "Quincaillerie Al Amal", "revendeur", "P1", "", "0661 00 00 01", "", "", "Casablanca", "Casa Est", "", 95000, 60, "complet", 0],
    ["", "Client avec erreurs (exemple)", "grossiste", "P9", "123", "", "", "", "", "", "Inconnu", "beaucoup", "", "", ""],
  ],
  "3-stock-ouverture-exemple.xlsx": [
    ["Référence", "Code-barres", "Dépôt", "Quantité", "Coût unitaire HT", "Lot", "Péremption", "N° de série"],
    ["BOS-GWS-750", "", "CASA", 30, 470, "", "", ""],
    ["", "3253561999049", "CASA", 3, 1248, "", "", ""],
    ["SIK-FLEX-11", "", "CASA", 96, 39, "SK-2026-118", "2027-09-30", ""],
    ["COL-GLY-4", "", "MRK", 40, 128, "CG-0926", "", ""],
    ["BOS-GSB-18", "", "SHOW", 3, 1020, "", "", "GSB18-0001, GSB18-0002, GSB18-0003"],
    ["MAK-HR2470", "", "CASA", 2, 1130, "", "", "HR24-7781, HR24-7782"],
    ["INCONNU-01", "", "RBT", 0, "", "", "", ""],
  ],
};

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, rows] of Object.entries(FILES)) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Import");
    rows.forEach((r) => ws.addRow(r));
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    ws.columns.forEach((c, i) => { c.width = Math.min(Math.max(...rows.map((r) => String(r[i] ?? "").length), 10) + 2, 48); });
    await wb.xlsx.writeFile(path.join(OUT, name));
    console.log(`✓ ${path.relative(process.cwd(), path.join(OUT, name))}`);
  }
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { FILES, main };
