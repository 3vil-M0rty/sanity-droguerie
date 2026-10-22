/**
 * Writes the printable price list (A4 PDF) from config/defaultCatalog.js,
 * without a database — for printing before the platform is online.
 *
 *   npm run price-list
 *   npm run price-list -- --edition=droguerie     (the shop edition's flyer)
 *   npm run price-list -- --out=../docs/Sanity-Grille-tarifaire.pdf --name="Sanity Software SARL" --phone="06…" --email=contact@… --city=Casablanca
 *
 * Once the platform runs, use Platform → Abonnements & factures → Offres →
 * "Grille tarifaire (PDF)": it prints your CURRENT prices and company details.
 */
const fs = require('fs');
const path = require('path');
const { PLANS, ADDONS, PRICE_LIST, DROGUERIE_PLANS, DROGUERIE_ADDONS, DROGUERIE_PRICE_LIST } = require('../config/defaultCatalog');
const { priceListPdf } = require('../services/priceListPdf');

const arg = (n) => {
  const a = process.argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split('=').slice(1).join('=') : '';
};

const droguerie = arg('edition') === 'droguerie';
const out = path.resolve(arg('out') || path.join(__dirname, '..', '..', 'docs', droguerie ? 'Sanity-Droguerie-Grille-tarifaire.pdf' : 'Sanity-Grille-tarifaire.pdf'));
const doc = priceListPdf({
  plans: droguerie ? DROGUERIE_PLANS : PLANS,
  addons: droguerie ? DROGUERIE_ADDONS : ADDONS,
  title: droguerie ? 'Sanity Droguerie' : 'Sanity',
  settings: {
    seller: { legalName: arg('name') || 'Sanity', phone: arg('phone'), email: arg('email'), city: arg('city'), address: arg('address'), ice: arg('ice') },
    priceList: droguerie ? DROGUERIE_PRICE_LIST : PRICE_LIST,
  },
});
const stream = fs.createWriteStream(out);
doc.pipe(stream);
doc.end();
stream.on('finish', () => console.log(`✓ ${out}`));
