require('../services/tenantScope'); // client-isolation plugin, before models
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Loads the Sanity price catalogue (config/defaultCatalog.js): the
 * Essentiel / Pro / Entreprise plans with their monthly, yearly and
 * set-up prices, the options and the price-list texts. Plans that
 * already exist (same code) are left as they are.
 *
 *   npm run seed:plans
 *
 * Same as Platform → Abonnements & factures → Offres → "Charger le catalogue Sanity".
 */
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const r = await require('../services/billingService').loadDefaultCatalog();
    console.log(`✓ Plans created: ${r.created.join(', ') || 'none'}${r.kept.length ? ` — already there (unchanged): ${r.kept.join(', ')}` : ''}${r.addons ? ` — ${r.addons} options added` : ''}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
})();
