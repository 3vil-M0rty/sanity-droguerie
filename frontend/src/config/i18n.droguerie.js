/**
 * Sanity Droguerie (the shop edition) translations — namespace "dg",
 * plus the counter's "article divers" line (ng.pos.divers*).
 * French, English and Arabic are complete: shop owners often prefer Arabic.
 */

const fr = {
  storage: {
    title: "Photos et documents", edit: "Modifier le quota", quotaGB: "Quota de ce client (Go)", planDefault: "vide = quota de son offre",
    hint: "Laissez vide pour appliquer le quota de son offre. Au-delà du quota, ses envois de photos et documents sont refusés avec un message clair ; rien n'est supprimé.",
    saved: "Quota de stockage enregistré.", recount: "Recompter", recounted: "Espace utilisé recalculé.", recountHint: "Recalcule l'espace utilisé à partir de la liste des fichiers",
    planQuotaGB: "Stockage inclus (Go)", defaultPh: "vide = quota par défaut",
    source: { client: "quota de ce client", plan: "quota de l'offre", default: "quota par défaut" },
  },
  dg: {
    menu: { home: "Ma boutique", till: "Caisse", carnet: "Carnet (crédit)", buying: "Achats", purchase: "Achat rapide", suppliers: "Fournisseurs à payer", purchaseHistory: "Historique des achats", articles: "Articles & stock", sales: "Ventes", settings: "Réglages" },
    home: {
      hello: "Bonjour", subtitle: "votre journée en un coup d'œil.", sell: "Vendre", tillOpen: "Caisse ouverte", tillClosed: "Ouvrir la caisse",
      carnetHint: "Qui me doit, encaisser", purchaseHint: "Marchandise reçue", suppliersHint: "Ce que je dois", articlesHint: "Prix, stock, inventaire",
      today: "Ventes du jour", tickets: "tickets", cashToday: "Encaissé aujourd'hui", onCreditToday: "à crédit", carnetTotal: "Total du carnet", customers: "clients",
      iOwe: "Je dois aux fournisseurs", suppliersCount: "fournisseurs", topDebtors: "Ceux qui doivent le plus", nobodyOwes: "Personne ne vous doit rien.",
      reorder: "À racheter", stockOk: "Aucun article sous le minimum.",
    },
    carnet: {
      subtitle: "Les clients qui achètent à crédit. Vendez à crédit depuis la caisse (paiement « Crédit ») ; encaissez ici, les plus anciennes dettes sont réglées d'abord.",
      search: "Nom ou téléphone…", showAll: "Afficher tous les clients", newCustomer: "Nouveau client", since: "doit depuis {days} j", details: "Détail", receive: "Encaisser",
      none: "Aucun client.", nobody: "Personne ne doit rien. Les ventes à crédit faites à la caisse apparaîtront ici.",
      openDebts: "Achats non réglés", payments: "Derniers règlements", settled: "Tout est réglé.", customerCard: "Fiche client", owes: "Doit :",
      paid: "{amount} encaissés. Reste à payer : {rest}.",
      waSent: "Message WhatsApp envoyé à {name}.",
      waSending: "Envoi…",
      waText: "Bonjour {name}, petit rappel amical de {shop} : il reste {amount} sur votre carnet. Merci et bonne journée !",
    },
    purchase: {
      subtitle: "La marchandise reçue du grossiste : les articles entrent en stock à leur prix, la facture du fournisseur est enregistrée avec ce que vous avez payé.",
      supplier: "Fournisseur", pickSupplier: "Choisir le fournisseur", newSupplier: "Nouveau fournisseur", reference: "N° de BL / facture", referenceHint: "facultatif",
      article: "Article", articlePlaceholder: "Tapez le nom de l'article…", newArticle: "Nouvel article — prix de vente TTC", salePrice: "Prix vente", inCatalog: "article existant",
      createArticle: "Créer « {name} »", quantity: "Qté", unitCost: "Prix d'achat TTC", lineTotal: "Total", addLine: "Ajouter un article", total: "Total de l'achat",
      paidNow: "Payé maintenant", owed: "Reste dû au fournisseur", paidAll: "Tout payé", save: "Enregistrer l'achat",
      hint: "Le prix d'achat sert à calculer votre coût moyen et votre marge. Un article nouveau est créé avec le prix de vente indiqué.",
      done: "Achat {number} enregistré : {total}. Reste dû : {owed}.",
    },
    suppliers: { subtitle: "Ce que vous devez à chaque grossiste. Un paiement règle d'abord les plus anciens achats.", openPurchases: "achats non soldés", pay: "Payer", youOwe: "Vous devez :", none: "Aucun fournisseur. Ils sont créés à votre premier achat.", paid: "Paiement enregistré pour {name}. Reste dû : {rest}." },
    common: { amount: "Montant", method: "Mode de paiement", reference: "N° de chèque / référence", confirm: "Valider", name: "Nom", phone: "Téléphone", date: "Date", save: "Enregistrer" },
    settings: { vatRegistered: "Assujetti à la TVA (décochez si la boutique n'est pas soumise à la TVA : nouveaux articles à 0 %)" },
    platform: { edition: "Édition", editionSanity: "Sanity (ERP complet)", editionDroguerie: "Sanity Droguerie (boutique)", priceList: "Grille Droguerie (PDF)" },
    methods: { especes: "Espèces", cheque: "Chèque", virement: "Virement", carte: "Carte", effet: "Effet (LCN)" },
  },
  ng: { pos: { divers: "Article divers", diversRef: "Divers", diversDescription: "Description (ex. clés reproduites, peinture teintée…)", diversAdd: "Ajouter", methods: { effet: "Effet (LCN)" } } },
};

const en = {
  storage: {
    title: "Photos & documents", edit: "Change quota", quotaGB: "This client's quota (GB)", planDefault: "empty = their plan's quota",
    hint: "Leave empty to use their plan's quota. Over the quota, new photos and documents are refused with a clear message; nothing is deleted.",
    saved: "Storage quota saved.", recount: "Recount", recounted: "Used space recalculated.", recountHint: "Recalculates the used space from the list of files",
    planQuotaGB: "Storage included (GB)", defaultPh: "empty = default quota",
    source: { client: "client quota", plan: "plan quota", default: "default quota" },
  },
  dg: {
    menu: { home: "My shop", till: "Till", carnet: "Credit book", buying: "Buying", purchase: "Quick purchase", suppliers: "Suppliers to pay", purchaseHistory: "Purchase history", articles: "Articles & stock", sales: "Sales", settings: "Settings" },
    home: {
      hello: "Hello", subtitle: "your day at a glance.", sell: "Sell", tillOpen: "Till open", tillClosed: "Open the till",
      carnetHint: "Who owes me, collect", purchaseHint: "Goods received", suppliersHint: "What I owe", articlesHint: "Prices, stock, counts",
      today: "Today's sales", tickets: "tickets", cashToday: "Collected today", onCreditToday: "on credit", carnetTotal: "Credit book total", customers: "customers",
      iOwe: "I owe suppliers", suppliersCount: "suppliers", topDebtors: "Who owes the most", nobodyOwes: "Nobody owes you anything.",
      reorder: "To reorder", stockOk: "No article below its minimum.",
    },
    carnet: {
      subtitle: "Customers who buy on credit. Sell on credit at the till (\"Credit\" payment); collect here — the oldest debts are settled first.",
      search: "Name or phone…", showAll: "Show all customers", newCustomer: "New customer", since: "owes for {days} d", details: "Details", receive: "Collect",
      none: "No customer.", nobody: "Nobody owes anything. Credit sales made at the till will show here.",
      openDebts: "Unpaid purchases", payments: "Latest payments", settled: "Everything is paid.", customerCard: "Customer card", owes: "Owes:",
      paid: "{amount} collected. Still to pay: {rest}.",
      waSent: "WhatsApp message sent to {name}.",
      waSending: "Sending…",
      waText: "Hello {name}, a friendly reminder from {shop}: {amount} is still on your account. Thank you!",
    },
    purchase: {
      subtitle: "Goods received from the wholesaler: the articles go into stock at their cost, and the supplier's bill is recorded with what you paid.",
      supplier: "Supplier", pickSupplier: "Choose the supplier", newSupplier: "New supplier", reference: "Delivery note / invoice no.", referenceHint: "optional",
      article: "Article", articlePlaceholder: "Type the article's name…", newArticle: "New article — selling price incl. VAT", salePrice: "Sale price", inCatalog: "existing article",
      createArticle: "Create \"{name}\"", quantity: "Qty", unitCost: "Cost incl. VAT", lineTotal: "Total", addLine: "Add an article", total: "Purchase total",
      paidNow: "Paid now", owed: "Still owed to the supplier", paidAll: "Paid in full", save: "Save the purchase",
      hint: "The cost gives your average cost and margin. A new article is created with the selling price you enter.",
      done: "Purchase {number} saved: {total}. Still owed: {owed}.",
    },
    suppliers: { subtitle: "What you owe each wholesaler. A payment settles the oldest purchases first.", openPurchases: "unpaid purchases", pay: "Pay", youOwe: "You owe:", none: "No supplier yet. They are created with your first purchase.", paid: "Payment recorded for {name}. Still owed: {rest}." },
    common: { amount: "Amount", method: "Payment method", reference: "Cheque no. / reference", confirm: "Confirm", name: "Name", phone: "Phone", date: "Date", save: "Save" },
    settings: { vatRegistered: "Subject to VAT (untick if the shop isn't: new articles at 0 %)" },
    platform: { edition: "Edition", editionSanity: "Sanity (full ERP)", editionDroguerie: "Sanity Droguerie (shop)", priceList: "Droguerie price list (PDF)" },
    methods: { especes: "Cash", cheque: "Cheque", virement: "Transfer", carte: "Card", effet: "Bill of exchange (LCN)" },
  },
  ng: { pos: { divers: "Misc. item", diversRef: "Misc.", diversDescription: "Description (e.g. keys cut, tinted paint…)", diversAdd: "Add", methods: { effet: "Bill (LCN)" } } },
};

const ar = {
  storage: {
    title: "الصور والوثائق", edit: "تعديل الحصة", quotaGB: "حصة هذا الزبون (جيغا)", planDefault: "فارغ = حصة العرض",
    hint: "اتركه فارغا لتطبيق حصة العرض. عند تجاوز الحصة يرفض إرسال الصور والوثائق برسالة واضحة؛ لا يحذف أي شيء.",
    saved: "تم تسجيل حصة التخزين.", recount: "إعادة الحساب", recounted: "تمت إعادة حساب المساحة المستعملة.", recountHint: "يعيد حساب المساحة المستعملة من لائحة الملفات",
    planQuotaGB: "التخزين المضمن (جيغا)", defaultPh: "فارغ = الحصة الافتراضية",
    source: { client: "حصة الزبون", plan: "حصة العرض", default: "الحصة الافتراضية" },
  },
  dg: {
    menu: { home: "متجري", till: "الصندوق", carnet: "الكارني (الكريدي)", buying: "المشتريات", purchase: "شراء سريع", suppliers: "الموردون (ديوني)", purchaseHistory: "سجل المشتريات", articles: "السلع والمخزون", sales: "المبيعات", settings: "الإعدادات" },
    home: {
      hello: "مرحبا", subtitle: "يومك في لمحة.", sell: "بيع", tillOpen: "الصندوق مفتوح", tillClosed: "فتح الصندوق",
      carnetHint: "من يدين لي، استخلاص", purchaseHint: "السلعة الواصلة", suppliersHint: "ما أدين به", articlesHint: "الأثمنة، المخزون، الجرد",
      today: "مبيعات اليوم", tickets: "تذاكر", cashToday: "المحصل اليوم", onCreditToday: "بالكريدي", carnetTotal: "مجموع الكارني", customers: "زبناء",
      iOwe: "ديوني للموردين", suppliersCount: "موردين", topDebtors: "الأكثر دينا", nobodyOwes: "لا أحد يدين لك.",
      reorder: "للشراء", stockOk: "لا توجد سلعة تحت الحد الأدنى.",
    },
    carnet: {
      subtitle: "الزبناء الذين يشترون بالكريدي. بيع بالكريدي من الصندوق (أداء «كريدي»)؛ واستخلص هنا، تسدد الديون الأقدم أولا.",
      search: "الاسم أو الهاتف…", showAll: "عرض كل الزبناء", newCustomer: "زبون جديد", since: "مدين منذ {days} يوم", details: "التفاصيل", receive: "استخلاص",
      none: "لا يوجد زبون.", nobody: "لا أحد مدين. المبيعات بالكريدي من الصندوق ستظهر هنا.",
      openDebts: "مشتريات غير مسددة", payments: "آخر الأداءات", settled: "كل شيء مسدد.", customerCard: "بطاقة الزبون", owes: "مدين بـ:",
      paid: "تم استخلاص {amount}. الباقي: {rest}.",
      waSent: "تم إرسال رسالة واتساب إلى {name}.",
      waSending: "جاري الإرسال…",
      waText: "السلام عليكم {name}، تذكير ودي من {shop}: يتبقى {amount} في الكارني ديالك. شكرا!",
    },
    purchase: {
      subtitle: "السلعة الواصلة من الموزع: تدخل السلع إلى المخزون بثمنها، وتسجل فاتورة المورد مع ما دفعته.",
      supplier: "المورد", pickSupplier: "اختر المورد", newSupplier: "مورد جديد", reference: "رقم وصل التسليم / الفاتورة", referenceHint: "اختياري",
      article: "السلعة", articlePlaceholder: "اكتب اسم السلعة…", newArticle: "سلعة جديدة — ثمن البيع بالرسوم", salePrice: "ثمن البيع", inCatalog: "سلعة موجودة",
      createArticle: "إنشاء «{name}»", quantity: "الكمية", unitCost: "ثمن الشراء بالرسوم", lineTotal: "المجموع", addLine: "إضافة سلعة", total: "مجموع الشراء",
      paidNow: "المدفوع الآن", owed: "الباقي للمورد", paidAll: "مدفوع بالكامل", save: "تسجيل الشراء",
      hint: "ثمن الشراء يحسب التكلفة المتوسطة والهامش. السلعة الجديدة تنشأ بثمن البيع المدخل.",
      done: "تم تسجيل الشراء {number}: {total}. الباقي: {owed}.",
    },
    suppliers: { subtitle: "ما تدين به لكل موزع. الأداء يسدد المشتريات الأقدم أولا.", openPurchases: "مشتريات غير مسددة", pay: "أداء", youOwe: "تدين بـ:", none: "لا يوجد مورد بعد. ينشأ مع أول شراء.", paid: "تم تسجيل الأداء لـ {name}. الباقي: {rest}." },
    common: { amount: "المبلغ", method: "طريقة الأداء", reference: "رقم الشيك / المرجع", confirm: "تأكيد", name: "الاسم", phone: "الهاتف", date: "التاريخ", save: "تسجيل" },
    settings: { vatRegistered: "خاضع للضريبة على القيمة المضافة (أزل العلامة إذا كان المتجر غير خاضع: السلع الجديدة بـ 0 %)" },
    platform: { edition: "النسخة", editionSanity: "Sanity (النظام الكامل)", editionDroguerie: "Sanity Droguerie (المتجر)", priceList: "لائحة أثمنة Droguerie (PDF)" },
    methods: { especes: "نقدا", cheque: "شيك", virement: "تحويل", carte: "بطاقة", effet: "كمبيالة" },
  },
  ng: { pos: { divers: "سلعة متنوعة", diversRef: "متنوع", diversDescription: "الوصف (مثلا: نسخ مفاتيح، صباغة ممزوجة…)", diversAdd: "إضافة", methods: { effet: "كمبيالة" } } },
};

function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== "object") target[k] = {};
      deepMerge(target[k], v);
    } else target[k] = v;
  }
  return target;
}

export function mergeDroguerieTranslations(translations) {
  if (translations.fr) deepMerge(translations.fr, fr);
  if (translations.en) deepMerge(translations.en, en);
  if (translations.ar) deepMerge(translations.ar, ar);
  return translations;
}
