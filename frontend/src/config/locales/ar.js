// UI dictionary — ar. Split out of i18n.config.js so each language
// is its own module (see loadLanguage there).
export default { quota: { title: "الحصص", hint: "اتركه فارغًا = غير محدود. الموظفون المغادرون لا يُحتسبون. خفض الحصة لا يحذف شيئًا: فقط لا يمكن للعميل إنشاء المزيد.", maxCompanies: "الحد الأقصى للشركات", maxEmployees: "الحد الأقصى للموظفين", unlimited: "غير محدود", edit: "تعديل الحصص", saved: "تم حفظ الحصص.", companies: "الشركات", employees: "الموظفون", companiesFull: "تم بلوغ الحد الأقصى للشركات — تواصل مع المنصة لرفعه.", employeesFull: "تم بلوغ الحد الأقصى للموظفين — تواصل مع المنصة لرفعه. الموظف المغادر يحرر مكانًا.", employeesHint: "الموظفون المستخدمون / المسموح بهم (المغادرون لا يُحتسبون).", newCompany: "شركة جديدة", }, prodPlan: { barsOf: "قضبان بطول {length} مم", }, wsMulti: { departmentSchedule: "توقيت العمل", useDefault: "التوقيت الافتراضي ({name})", departmentScheduleHint: "تُنشأ التوقيتات من التنظيم › توقيت العمل.", deleteConfirm: "حذف التوقيت «{name}»؟ ستعود أقسامه إلى التوقيت الافتراضي.", namePlaceholder: "مثال: الورشة – بفترتين، السبت صباحًا", copyCurrent: "نسخ التوقيت الحالي", new: "توقيت جديد", name: "اسم التوقيت", default: "التوقيت الافتراضي", makeDefault: "تعيين كافتراضي", departments: "الأقسام", noDepartments: "لا يوجد أي قسم في هذه الشركة بعد.", leaveDefaultHint: "القسم على التوقيت الافتراضي — عيّنه لتوقيت آخر لنقله.", currently: "حاليًا: {name}", defaultHint: "يُطبَّق التوقيت الافتراضي على كل قسم ليس له توقيت خاص.", assignHint: "حدّد الأقسام التي تتبع هذا التوقيت؛ الأقسام غير المحددة تعود إلى التوقيت الافتراضي.", splitDay: "استراحة", splitDayHint: "يوم بفترتين (صباح + مساء). ألغِ التحديد لنصف يوم أو يوم متواصل.", splitOn: "بفترتين", splitOff: "متواصل", }, platformCo: { companyTitle: "الشركات", companyAdd: "إضافة شركة", companyNone: "لا توجد شركة بعد.", companyAdminHint: "Un client peut avoir plusieurs sociétés (groupe, filiales). Son administrateur peut aussi en créer depuis Organisation › Entreprise ; chaque écran a un sélecteur « Entreprise ».", companyFirst: "الشركة الأولى (اختياري)", companyFirstHint: "D'autres sociétés pourront être ajoutées ensuite, ici ou par l'administrateur du client.", companyName: "اسم الشركة", companyNamePlaceholder: "ex. Atlas Menuiserie SARL", companyLegalForm: "الشكل القانوني", companyOtherForm: "أخرى", companyIndustry: "النشاط", companyIndustryPlaceholder: "ex. Menuiserie aluminium", companyCity: "المدينة", companyAdded: "تمت إضافة الشركة « {name} ».", }, perm: { teamMenu: "صلاحيات فريقي", title: "صلاحيات الوصول", subtitleAll: "صلاحيات كل شخص، إجراءً بإجراء. يوزّع المسؤولون بعدها ما لديهم على فرقهم.", subtitleTeam: "امنح كل شخص في فريقك الصلاحيات التي يحتاجها — من بين تلك التي تملكها أنت.", searchPeople: "ابحث عن شخص…", emptyTeam: "لا أحد تحت مسؤوليتك في هذه الشركة.", manager: "مسؤول", pickSomeone: "اختر شخصًا من اليسار.", rules: "لكل قسم مسؤول يحصل على كل صلاحيات وحدته. لا يمنح المسؤول إلا ما يملكه، لأفراد قسمه ولكل من يتبعه (كل المستويات).", noLoginHint: "ليس لهذا الشخص حساب دخول: أنشئه من ملف الموظف (الموارد البشرية).", selfHint: "لا يمكنك تعديل صلاحياتك — مسؤولك هو من يديرها.", fullAccessHint: "مدير / مالك: وصول كامل.", managesHint: "مسؤول عن {deps}: صلاحيات هذه الوحدة تلقائية.", applyPreset: "تطبيق ملف جاهز…", resetHint: "العودة إلى الملف الافتراضي للقسم / المنصب", reset: "ملف المنصب", legendOn: "ممنوحة", legendAuto: "تلقائية (مسؤول)", legendOff: "غير ممنوحة", legendGrantable: "الخانات الرمادية صلاحيات لا تملكها أنت.", all: "الكل", none: "لا شيء", toggleRow: "الكل / لا شيء", autoHint: "تلقائية: هذا الشخص مسؤول عن القسم", notGrantable: "لا تملك هذه الصلاحية: لا يمكنك منحها أو سحبها", noLogin: "بدون حساب", fullAccess: "وصول كامل", custom: "مخصص", roleProfile: "ملف المنصب", saved: "تم الحفظ: {added} مضافة، {removed} مسحوبة.", resetConfirm: "إعادة الملف الافتراضي؟ ستضيع الصلاحيات المخصصة.", resetDone: "تمت إعادة الملف الافتراضي.", errors: { load: "تعذر تحميل الصلاحيات.", save: "تعذر حفظ الصلاحيات.", }, }, cv: { parentCategory: "الفئة الأم", noParent: "لا شيء (فئة رئيسية)", parentHint: "مثال: « مقاطع الألومنيوم » › « سلسلة ATLAS 78 — منزلقة ». الفئة الفرعية بدون حساب محاسبي تأخذ حساب الفئة الأم.", addSubCategory: "إضافة فئة فرعية", articlesCount: "{n} مادة", subCount: "{n} فئة فرعية", amountsLabel: "المبالغ", amountsCheckbox: "عرض الأسعار والتكاليف والهوامش والميزانيات (ظاهرة دائمًا للمسؤولين والملاك والمبيعات والمالية والمحاسبة والإدارة)", visual: "المظهر", visualHint: "شكل النموذج في الكتالوج والمشاريع وملف PDF لعرض السعر: مخطط مرسوم بالمقياس من L × H — أو صورتك الخاصة (صورة، رسم من كتالوج المورد) التي تحل محل المخطط في كل مكان.", schematic: "المخطط المُولَّد", picture: "صورة (اختيارية)", noPicture: "لا توجد صورة", changePicture: "تغيير الصورة", uploadPicture: "رفع صورة", drawingType: "نوع المخطط", leaves: "الدرف", opening: "طريقة الفتح", layers: "عدد الألواح الزجاجية", grid_nx: "الأعمدة", grid_ny: "الصفوف", solidLeaf: "درفة مصمتة (لوح، بدون زجاج)", railingBars: "قضبان (بدل الزجاج)", drawingParamsHint: "المعاملات المسماة n (الدرف)، nx / ny (الشبكة)، lf، hi / ha (المركبة) أو ent (تباعد الأعمدة) تحل محل هذه القيم لكل سطر.", ralPick: "اختيار من لوحة ألوان RAL", ralPickPh: "ابحث عن RAL (9016، أنثراسيت…)", ralNone: "لم يتم العثور على RAL", projectFinish: "اللون الافتراضي (RAL)", drawingTypes: { sliding: "منزلق", casement: "نافذة مفصلية", door: "باب", folding: "قابل للطي", fixed: "ثابت", grid: "شبكة / واجهة زجاجية", combo: "مركب", shutter: "ستارة ملفوفة", louvre: "شفرات", railing: "درابزين", pergola: "برجولا", glass: "زجاج", garage: "باب مرآب", panel: "لوح", cladding: "تكسية", generic: "عام", }, openings: { side: "مفصلي جانبي", ob: "قلاب ومفصلي", soufflet: "قلاب سفلي", projetant: "قلاب علوي", basculant: "محوري أفقي", pivotant: "محوري", }, }, notificationEvents: { permissionsChanged: { title: "تم تعديل صلاحياتك", message: "{added} مضافة، {removed} مسحوبة", }, quoteAcceptedProd: { title: "قُبل عرض الأسعار {number}", message: "{customer} — سيصل المشروع إلى الإنتاج", }, orderPlanned: { title: "أمر تصنيع جديد {number}", message: "{workshop} · {project}", }, orderPlannedWaiting: { title: "أمر تصنيع جديد {number}", message: "{workshop} · {project} — في انتظار الورشات السابقة", }, orderCreated: { title: "أمر تصنيع جديد {number}", message: "{workshop} · {title}", }, orderReady: { title: "يمكن بدء {number}", message: "{workshop}: أنهت الورشات السابقة عملها.", }, orderDone: { title: "تم إنجاز {number}", message: "{workshop} · {project}", }, orderClosedShort: { title: "أُغلق {number} مع نقص في المخزون", message: "{count} مادة: {articles}", }, orderCancelled: { title: "أُلغي {number}", message: "{workshop} {reason}", }, orderLate: { title: "{number} متأخر", message: "{workshop} · الأجل {date}", }, stockLow: { title: "مخزون منخفض: {article}", message: "المتبقي {quantity} {unit} (الحد الأدنى {threshold})", }, quoteAccepted: { title: "قُبل عرض الأسعار {number}", message: "{customer} · {amount} دون احتساب الضريبة", }, quoteRefused: { title: "رُفض عرض الأسعار {number}", message: "{customer} · {amount} دون احتساب الضريبة {reason}", }, quoteExpiring: { title: "ينتهي عرض الأسعار {number} في {date}", message: "{customer} · يجب المتابعة", }, paymentReceived: { title: "دفعة على {number}", message: "{customer} · {amount}", }, invoicePaid: { title: "سُددت الفاتورة {number}", message: "{customer} · {amount}", }, invoiceOverdue: { title: "الفاتورة {number} غير مسددة", message: "{customer} · {amount} مستحق منذ {date}", }, projectDueSoon: { title: "المشروع {number}: الأجل بعد {days} يوم", message: "{name} · أوامر غير منجزة: {open}", }, projectOverdue: { title: "المشروع {number} متأخر", message: "{name} · الأجل {date} · أوامر غير منجزة: {open}", }, }, login: { useBackupCode: "استخدم رمزاً احتياطياً بدلاً من ذلك", useAuthenticator: "استخدم رمز التطبيق بدلاً من ذلك", invalidCode: "رمز غير صالح", verifying: "جارٍ التحقق...", verify: "تحقق", backupCodeHint: "أدخل أحد رموزك الاحتياطية.", authenticatorHint: "أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة.", failed: "فشل تسجيل الدخول", signingIn: "جارٍ تسجيل الدخول...", signIn: "تسجيل الدخول", password: "كلمة المرور", email: "البريد الإلكتروني", }, notifications: { daysShort: "ي", hoursShort: "س", minutesShort: "د", now: "الآن", markAllRead: "تحديد الكل كمقروء", empty: "لا توجد إشعارات بعد.", title: "الإشعارات", }, orgChart: { breadcrumbs: { orgChart: "الهيكل التنظيمي", hr: "الموارد البشرية", }, emptyMessage: "حدّد مسؤولاً للموظفين لبناء الهيكل.", emptyTitle: "لا يوجد هيكل تنظيمي بعد", subtitle: "الهيكل الإداري، مبني على المسؤول المباشر لكل موظف.", title: "الهيكل التنظيمي", }, auditLog: { errors: { fetchFailed: "تعذّر تحميل سجل التدقيق", actionFailed: "فشل هذا الإجراء. يرجى المحاولة مرة أخرى.", }, breadcrumbs: { auditLog: "سجل التدقيق", hr: "الموارد البشرية", }, actions: { review: "مراجعة", delete: "حذف", update: "تعديل", create: "إنشاء", }, resourceTypes: { WorkSchedule: "جدول العمل", PayrollRun: "دورة أجور", EmployeeDocument: "وثيقة", Contract: "عقد", Advance: "تسبيق", Absence: "غياب", Salary: "راتب", Employee: "موظف", }, fields: { date: "التاريخ", actor: "بواسطة", resource: "السجل", resourceType: "النوع", action: "الإجراء", }, emptyMessage: "لم تُسجل أي تغييرات لهذا الفلتر بعد.", emptyTitle: "لا نشاط بعد", deleteSureMessage: "هل تريد حذف هذا الإدخال؟ لا يمكن التراجع عن ذلك.", deleteTitle: "حذف إدخال من السجل", subtitle: "من غيّر ماذا ومتى.", title: "سجل التدقيق", }, purchaseRequests: { status: { received: "مستلم", }, fields: { requestedBy: "طلبه", quantity: "الكمية", product: "المادة", }, markReceived: "تحديد كمستلم", emptyMessage: "لا توجد طلبات شراء مطابقة للفلاتر.", emptyTitle: "لا توجد طلبات شراء", subtitle: "طلبات إعادة التزويد المرسلة إلى المشتريات، وردّهم عليها.", title: "طلبات الشراء", }, production: { title: "الإنتاج", }, holidays: { title: "العطل الرسمية", subtitle: "العطل الرسمية للسنة: هل تعمل الشركة، وكيف تُؤدّى ساعات العمل.", downloadTemplate: "تنزيل النموذج", import: "استيراد Excel", add: "إضافة عطلة", year: "السنة", howItWorks: "كل سنة: نزّل النموذج (العطل ذات التاريخ الثابت مُعبّأة مسبقاً)، أضف الأعياد الدينية بتواريخها الرسمية، ثم استورده. عطلة مغلقة: لا يُنتظر حضور أحد، وتُحتسب ساعات من يسجّل حضوره كساعات عطلة. الأداء «مضاعف» يضيف أجر ساعة إضافية عن كل ساعة عمل؛ «عادي» لا يضيف شيئاً.", importDone: "اكتمل الاستيراد: {created} مضافة، {updated} محدّثة.", namePlaceholder: "اسم العطلة (مثال: عيد الفطر)", previewTitle: "معاينة {file}", previewErrors: "{count} سطر(أسطر) يجب تصحيحها — صحّح الملف وأعد استيراده", previewReady: "{count} سطر(أسطر) جاهزة للاستيراد", columns: { row: "السطر", date: "التاريخ", name: "الاسم", open: "الشركة", pay: "الأداء عند العمل", check: "التحقق" }, defaultClosed: "مغلقة (افتراضي)", defaultDouble: "مضاعف (افتراضي)", open: "مفتوحة", closed: "مغلقة", payDouble: "مضاعف", payNormal: "عادي", confirmImport: "استيراد", emptyTitle: "لا توجد عطل رسمية لسنة {year}", emptyMessage: "نزّل النموذج، أكمله، ثم استورده.", deleteTitle: "حذف العطلة", deleteMessage: "حذف «{name}»؟ يتم الاحتفاظ بتسجيلات الحضور لهذا اليوم.", errors: { load: "تعذّر تحميل العطل الرسمية.", save: "تعذّر حفظ هذا التغيير.", template: "تعذّر تنزيل النموذج.", read: "تعذّرت قراءة هذا الملف.", import: "فشل الاستيراد." } }, myDepartment: { adminTitle: "الوصول حسب القسم", adminSubtitle: "جميع الأقسام التي تشرف عليها: مديرها، والمسميات الوظيفية التي تمنح الوصول إلى الوحدة، ومن لديه الوصول.", adminEmptyTitle: "لا توجد أقسام بعد.", noManagerAssigned: "لم يُعيَّن مدير", title: "قسمي", subtitle: "فريقك، والمسميات الوظيفية التي تمنح الوصول إلى وحدة القسم.", loadError: "تعذّر تحميل قسمك.", saveError: "تعذّر حفظ هذا التغيير.", saved: "تم الحفظ.", accountsUpdated: "تم الحفظ — تم تحديث {count} حساب(ات).", emptyTitle: "لا تدير أي قسم بعد.", positionsTitle: "المسميات الوظيفية والوصول", positionsHint: "فعّل مسمى وظيفياً لمنح جميع شاغليه الوصول إلى وحدة القسم. يرى الآخرون مساحتهم فقط.", noModule: "هذا القسم لا يفتح أي وحدة، لذلك لا يوجد وصول لتوزيعه.", noPositions: "لا توجد مناصب محددة لهذا القسم بعد.", holders: "{count} موظف(ين)", toggleLabel: "يمنح الوصول إلى الوحدة", teamTitle: "الفريق", noEmployees: "لا يوجد موظفون في هذا القسم.", columns: { name: "الاسم", jobTitle: "المسمى الوظيفي", access: "الوصول" }, noLogin: "بدون حساب", moduleAccess: "وصول إلى الوحدة", mySpaceOnly: "مساحتي فقط" },
    sidebar: { logistics: "اللوجستيك", toDeliver: "للتسليم", deliveryNotes: "سندات التسليم", tracking: "تتبع المشاريع", workshops: "الورشات", chassisCatalog: "كتالوج الهياكل", productionConfig: "إعدادات الإنتاج", sales: "المبيعات", quotes: "عروض الأسعار", salesInvoices: "الفواتير", receivables: "التحصيلات", customers: "العملاء", projects: "المشاريع", planning: "التخطيط", declarations: "التصريحات", leaveBalances: "أرصدة العطل", platform: "المنصة", clients: "العملاء", purchasingReports: "تقارير المشتريات", restock: "إعادة التزويد", inventorySettings: "الإعدادات", purchaseRequests: "طلبات الشراء", inventory: "المخزون", production: "الإنتاج", workSchedule: "جدول العمل", auditLog: "سجل التدقيق", reports: "التقارير", orgChart: "الهيكل التنظيمي", attendance: "الحضور", employeeDocuments: "الوثائق", contracts: "العقود", payroll: "الأجور", supplierInvoices: "فواتير الموردين", purchasing: "المشتريات", purchaseRequestsQueue: "طلبات الشراء", purchaseOrders: "أوامر الشراء", priceRequests: "طلبات الأسعار", suppliers: "الموردون", purchasingInventory: "المخزون", articleHistory: "سجل المادة", holidays: "العطل الرسمية", departmentAccess: "الوصول حسب القسم", myDepartment: "قسمي", mySpace: "مساحتي", myProfile: "ملفي الشخصي", myPayslips: "كشوف أجري", myAbsences: "غياباتي", myAdvances: "تسبيقاتي", myAttendance: "حضوري", myRecords: "ملفي الإداري",
      leaveCalendar: "تقويم الإجازات",
      performanceReviews: "تقييمات الأداء",
      disciplinaryActions: "الإجراءات التأديبية",
      admin: "المسؤول",
      settings: "الإعدادات",
      help: "المساعدة والدعم",
      profile: "الملف الشخصي",
      hr: "الموارد البشرية",

      companies: "الشركات",
      organization: "المؤسسة",
      company: "الشركة",
      employees: "الموظفون",
      salaries: "الرواتب",
      absences: "الغيابات",
      advances: "السلف",
      users: "المستخدمون",
      departments: "الأقسام",
      jobPositions: "المناصب",
      rolesPermissions: "الأدوار والصلاحيات",
      locations: "المواقع",
      documents: "الوثائق",
      preferences: "التفضيلات",
      integrations: "التكاملات",

      dark: "داكن",
      light: "فاتح",

      logout: "تسجيل الخروج",

      closeSidebar:
        "إغلاق الشريط الجانبي",

      openSidebar:
        "فتح الشريط الجانبي",

      switchTheme:
        "التبديل إلى الوضع {theme}",

      dashboard:
        "لوحة التحكم",
    },

    common: { yes: "نعم", no: "لا", home: "الرئيسية", breadcrumb: "مسار التنقل", clear: "مسح", clearSearch: "مسح البحث", nextPage: "الصفحة التالية", previousPage: "الصفحة السابقة", pagination: "ترقيم الصفحات", hidePassword: "إخفاء كلمة المرور", showPassword: "إظهار كلمة المرور", somethingWentWrong: "حدث خطأ ما", confirmAction: "تأكيد الإجراء", pageNotFoundHint: "هذه الصفحة غير موجودة أو تم نقلها.", pageNotFound: "الصفحة غير موجودة", status: "الحالة", save: "حفظ", back: "رجوع", dateFrom: "من", dateTo: "إلى",
      welcome: "أهلاً بك",
      goodbye: "وداعاً",

      loading: "جارٍ التحميل...",

      error: "خطأ",
      fail: "فشل",
      success: "نجاح",

      update: "تحديث",
      cancel: "إلغاء",
      delete: "حذف",
      confirm: "تأكيد",
      close: "إغلاق",
      edit: "تعديل",
      reset: "إعادة تعيين",
      create: "إنشاء",
      noResults: "لم يتم العثور على نتائج",
      chooseFile: "اختر ملفًا",
      noFileChosen: "لم يتم اختيار أي ملف",
    },

    profile: { loadFailed: "تعذّر تحميل الملف الشخصي",
      settings: "الإعدادات",

      firstName: "الاسم الأول",
      lastName: "اسم العائلة",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",

      currentPassword:
        "كلمة المرور الحالية",

      newPassword:
        "كلمة المرور الجديدة",

      updateSureMessage:
        "هل أنت متأكد من أنك تريد تحديث ملفك الشخصي؟",

      updateFailMessage:
        "تعذر تحديث ملفك الشخصي. يرجى المحاولة مرة أخرى.",

      updateSuccessMessage:
        "تم تحديث ملفك الشخصي بنجاح.",

      bothPasswords:
        "كلمة المرور الحالية والجديدة مطلوبتان.",

      info:
        "المعلومات",
    },

    company: { workflow: { accountInvalid: "الحساب المحاسبي يتكون من 4 إلى 10 أرقام.", purchaseAccountHint: "يُستخدم في التصدير المحاسبي للمواد التي لا يملك صنفها حساباً خاصاً، وللأسطر المدخلة يدوياً (مثال 6111، 6121، 6125).", purchaseAccount: "حساب الشراء الافتراضي", purchaseThresholdHint: "يجب أن يوافق مسؤول أو المالك أو مدير المشتريات على أوامر الشراء التي تساوي هذا المبلغ أو تتجاوزه. 0 = بدون موافقة.", purchaseThreshold: "حد الموافقة على أوامر الشراء", title: "مسار الموافقة", sequentialApproval: "موافقة المدير قبل الموارد البشرية", sequentialApprovalHint: "عند التفعيل، يجب أن يوافق مدير الموظف أولاً على طلبات الغياب والتسبيقات، ثم تمنح الموارد البشرية الموافقة النهائية. الموظفون بدون مدير تُحال طلباتهم مباشرة إلى الموارد البشرية.", saveFailed: "تعذّر حفظ هذا الإعداد." },
      title: "الشركة",

      subtitle:
        "إدارة معلومات الشركة",

      emptySubtitle:
        "لم يتم إعداد أي شركة بعد",

      emptyTitle:
        "لا توجد شركة",

      emptyMessage:
        "قم بإعداد ملف الشركة للبدء.",

      create:
        "إنشاء شركة",

      editTitle:
        "تعديل الشركة",

      name:
        "اسم الشركة",

      tradeName:
        "الاسم التجاري",

      legalForm:
        "الشكل القانوني",

      industry:
        "قطاع النشاط",

      ice:
        "ICE",

      taxId:
        "المعرف الضريبي",

      registrationNumber:
        "رقم السجل التجاري",

      email:
        "البريد الإلكتروني",

      phone:
        "الهاتف",

      website:
        "الموقع الإلكتروني",

      street:
        "الشارع",

      city:
        "المدينة",

      postalCode:
        "الرمز البريدي",

      logo:
        "شعار الشركة",

      employeeCount:
        "الموظفون",

      section: {
        identity:
          "الهوية",

        legal:
          "المعلومات القانونية",

        contact:
          "معلومات الاتصال",
      },

      createTitle:
        "إنشاء الشركة",

      createSureMessage:
        "هل أنت متأكد من أنك تريد إنشاء هذه الشركة؟",

      createSuccessTitle:
        "تم إنشاء الشركة",

      createSuccessMessage:
        "تم إنشاء الشركة بنجاح.",

      createFailTitle:
        "فشل الإنشاء",

      updateSureMessage:
        "هل أنت متأكد من أنك تريد حفظ هذه التغييرات؟",

      updateSuccessMessage:
        "تم تحديث الشركة بنجاح.",

      saveFailMessage:
        "حدث خطأ أثناء حفظ الشركة.",

      loadFailTitle:
        "فشل التحميل",

      loadFailMessage:
        "تعذر تحميل معلومات الشركة.",

      downloadFiche:
        "تنزيل بطاقة الشركة",

      deleteCompany:
        "حذف الشركة",

      deleteTitle:
        "حذف الشركة",

      deleteSureMessage:
        "هل أنت متأكد من أنك تريد حذف هذه الشركة؟ لا يمكن التراجع عن هذا الإجراء.",

      deleteSuccessTitle:
        "تم حذف الشركة",

      deleteSuccessMessage:
        "تم حذف الشركة بنجاح.",

      deleteFailTitle:
        "فشل الحذف",

      deleteFailMessage:
        "حدث خطأ أثناء حذف الشركة.",

      errors: {
        deleteAdminOnly:
          "فقط المسؤولون أو مالك الشركة يمكنهم حذف هذه الشركة.",

        notFound:
          "الشركة غير موجودة.",

        deleteNotAuthorized:
          "ليس لديك صلاحية حذف هذه الشركة.",

        updateNotAuthorized:
          "ليس لديك صلاحية تعديل هذه الشركة.",

        viewNotAuthorized:
          "ليس لديك صلاحية عرض هذه الشركة.",

        ficheDownloadFailed:
          "حدث خطأ أثناء إنشاء بطاقة الشركة.",

        duplicateCompany:
          "توجد شركة بنفس ICE أو المعرف الضريبي أو رقم التسجيل أو رقم CNSS.",

        createFailed:
          "حدث خطأ أثناء إنشاء الشركة.",

        updateFailed:
          "حدث خطأ أثناء تحديث الشركة.",

        deleteFailed:
          "حدث خطأ أثناء حذف الشركة.",

        logoNotFound:
          "شعار الشركة غير موجود.",

        logoRequired:
          "يرجى اختيار شعار.",

        logoUploadFailed:
          "حدث خطأ أثناء رفع شعار الشركة.",

        logoDeleteFailed:
          "حدث خطأ أثناء حذف شعار الشركة.",
      },
    },

    users: {
      title: "المستخدمون",

      subtitle:
        "إدارة حسابات المستخدمين والصلاحيات.",

      addUser:
        "إضافة مستخدم",

      newUser:
        "مستخدم جديد",

      createSubtitle:
        "إنشاء حساب مستخدم جديد.",

      information:
        "معلومات المستخدم",

      role:
        "الدور",

      status:
        "الحالة",

      userId:
        "معرف المستخدم",

      roles: {
        admin:
          "مسؤول",

        owner:
          "مالك",

        user:
          "مستخدم",
      },

      statuses: {
        active:
          "نشط",

        inactive:
          "غير نشط",

        suspended:
          "موقوف",
      },

      emptyTitle:
        "لا يوجد مستخدمون",

      emptyMessage:
        "لا يوجد حالياً أي مستخدمين في مؤسستك.",

      backToUsers:
        "المستخدمون",

      createTitle:
        "إنشاء مستخدم",

      createSureMessage:
        "هل أنت متأكد من أنك تريد إنشاء هذا المستخدم؟",

      createSuccessTitle:
        "تم إنشاء المستخدم",

      createSuccessMessage:
        "تم إنشاء المستخدم بنجاح.",

      createFailTitle:
        "فشل الإنشاء",

      createFailMessage:
        "تعذر إنشاء المستخدم.",

      loadFailTitle:
        "فشل التحميل",

      loadFailMessage:
        "تعذر تحميل المستخدمين. يرجى المحاولة مرة أخرى.",

      deleteUser:
        "حذف المستخدم",

      deleteTitle:
        "حذف المستخدم",

      deleteSureMessage:
        "هل أنت متأكد من أنك تريد حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.",

      deleteSuccessTitle:
        "تم حذف المستخدم",

      deleteSuccessMessage:
        "تم حذف المستخدم بنجاح.",

      deleteFailTitle:
        "فشل الحذف",

      deleteFailMessage:
        "حدث خطأ أثناء حذف المستخدم.",

      errors: {
        deleteAdminOnly:
          "فقط المسؤولون يمكنهم حذف المستخدمين.",

        notFound:
          "المستخدم غير موجود.",

        updateNotAuthorized:
          "ليس لديك صلاحية تعديل هذا المستخدم.",

        passwordNotAuthorized:
          "ليس لديك صلاحية تغيير كلمة المرور.",

        requiredCreateFields:
          "يرجى إدخال الاسم الأول واسم العائلة والبريد الإلكتروني وكلمة المرور.",

        requiredUpdateFields:
          "يرجى إدخال الاسم الأول واسم العائلة والبريد الإلكتروني.",

        requiredPasswordFields:
          "يرجى إدخال كلمة المرور الحالية والجديدة.",

        emailExists:
          "يوجد مستخدم بهذا البريد الإلكتروني بالفعل.",

        currentPasswordIncorrect:
          "كلمة المرور الحالية غير صحيحة.",
      },

      editUser: "تعديل المستخدم",
      editSubtitle: "تحديث معلومات حساب هذا المستخدم.",
      inheritedFromEmployee: "يتم توريث القسم والدور في الموارد البشرية من الموظف المرتبط {name} ({department} — {jobTitle}). لتغييرهما، حدّث قسم الموظف أو مسماه الوظيفي بدلاً من ذلك.",

      updateTitle: "تعديل المستخدم",
      updateSureMessage: "هل أنت متأكد من أنك تريد حفظ هذه التغييرات؟",

      updateSuccessTitle: "تم تحديث المستخدم",
      updateSuccessMessage: "تم تحديث المستخدم بنجاح.",

      updateFailTitle: "فشل التحديث",
      updateFailMessage: "تعذر تحديث المستخدم. يرجى المحاولة مرة أخرى.",

      hrRole: {
        label: "المنصب في الموارد البشرية",
        notApplicable: "غير قابل للتطبيق (خارج الموارد البشرية)",
        assistant: "مساعد(ة) موارد بشرية",
        officer: "مكلف(ة) بالموارد البشرية",
        manager: "مسؤول(ة) الموارد البشرية",
        director: "مدير(ة) الموارد البشرية",
      },

      department: "القسم",
      departments: {
          management: "الإدارة",
          hr: "الموارد البشرية",
          finance: "المالية",
          accounting: "المحاسبة",
          sales: "المبيعات",
          purchasing: "المشتريات",
          marketing: "التسويق",
          production: "الإنتاج",
          production_planning: "تخطيط الإنتاج",
          quality_control: "مراقبة الجودة",
          maintenance: "الصيانة",
          warehouse: "المستودع",
          logistics: "اللوجستيك",
          procurement: "التوريد",
          engineering: "الهندسة",
          design: "التصميم",
          research_development: "البحث والتطوير",
          it: "تقنية المعلومات",
          customer_service: "خدمة العملاء",
          administration: "الإدارة العامة",
          health_safety_environment: "الصحة والسلامة والبيئة",
          security: "الأمن",
      },

      emptySearchTitle: "لا توجد نتائج",
      emptySearchMessage: "لا يوجد مستخدمون مطابقون لبحثك.",

      toolbar: {
        searchPlaceholder: "البحث عن المستخدمين...",
      },
    },
    employees: { related: { tabs: { attendance: "الحضور", documents: "الوثائق", contracts: "العقود", advances: "التسبيقات", absences: "الغيابات", salary: "الراتب", }, empty: "لا شيء هنا بعد.", }, linkedUser: { resetPasswordSureMessage: "إنشاء كلمة مرور مؤقتة جديدة لحساب هذا الموظف؟ ستتوقف كلمة المرور الحالية عن العمل.", resetPasswordTitle: "إعادة تعيين كلمة المرور", resetPassword: "إعادة تعيين كلمة المرور", loginNotCreatedTitle: "تم إنشاء الموظف، لكن بدون حساب بعد", loginCreatedMessage: "البريد: {email}\nكلمة المرور المؤقتة: {password}\n\nشاركها مع الموظف — لن تُعرض مرة أخرى.", loginCreatedTitle: "تم إنشاء الحساب", createLoginSureMessage: "إنشاء حساب خدمة ذاتية جديد لهذا الموظف؟ ستُنشأ كلمة مرور مؤقتة وتُعرض مرة واحدة.", createLoginTitle: "إنشاء حساب", createLogin: "إنشاء حساب جديد", orCreateNew: "أو", actionFailed: "حدث خطأ. يرجى المحاولة مرة أخرى.", searchPlaceholder: "ابحث عن المستخدمين بالاسم أو البريد...", unlinkSureMessage: "إلغاء ربط حساب المستخدم هذا بهذا الموظف؟ سيفقد الوصول إلى مساحتي.", unlinkTitle: "إلغاء ربط حساب المستخدم", linkSureMessage: "ربط حساب المستخدم هذا بهذا الموظف؟ سيحصل على الوصول إلى مساحتي (كشوف الأجر، طلبات الغياب والتسبيقات، الحضور).", linkTitle: "ربط حساب مستخدم", unlink: "إلغاء الربط", link: "ربط", linkedTo: "مرتبط بـ:", title: "الوصول الذاتي", },
      title: "الموظفون",
      subtitle: "إدارة موظفي شركتك ومعلوماتهم الإدارية.",
      addEmployee: "إضافة موظف",
      backToEmployees: "العودة إلى الموظفين",
      editEmployee: "تعديل الموظف",
      newEmployee: "موظف جديد",
      employeeInformation: "معلومات الموظف",
      loadFailTitle: "تعذر تحميل الموظفين",
      loadFailMessage: "حدث خطأ أثناء تحميل الموظفين. يرجى المحاولة مرة أخرى.",
      loadCompaniesFailMessage: "حدث خطأ أثناء تحميل الشركات. يرجى المحاولة مرة أخرى.",

      createTitle: "إضافة موظف",
      createSureMessage: "هل أنت متأكد من أنك تريد إنشاء هذا الموظف؟",
      createSuccessTitle: "تم إنشاء الموظف",
      createSuccessMessage: "تم إنشاء الموظف بنجاح.",
      createFailTitle: "تعذر إنشاء الموظف",
      createFailMessage: "حدث خطأ أثناء إنشاء الموظف.",

      updateTitle: "تعديل الموظف",
      updateSureMessage: "هل أنت متأكد من أنك تريد حفظ هذه التغييرات؟",
      updateSuccessTitle: "تم تحديث الموظف",
      updateSuccessMessage: "تم تحديث الموظف بنجاح.",
      updateFailTitle: "تعذر تحديث الموظف",
      updateFailMessage: "حدث خطأ أثناء تحديث الموظف.",

      deleteTitle: "حذف الموظف",
      deleteSureMessage: "هل أنت متأكد من أنك تريد حذف {name}؟ لا يمكن التراجع عن هذا الإجراء.",
      deleteSuccessTitle: "تم حذف الموظف",
      deleteSuccessMessage: "تم حذف الموظف.",
      deleteFailTitle: "تعذر حذف الموظف",
      deleteFailMessage: "حدث خطأ أثناء حذف الموظف.",

      selectCompanyRequired: "يرجى اختيار شركة.",
      invalidPhotoType: "يرجى اختيار ملف صورة.",

      toolbar: {
        company: "الشركة",
        selectCompany: "اختر الشركة",
        loadingCompanies: "جارٍ تحميل الشركات...",
        searchPlaceholder: "البحث عن موظفين...",
      },

      companyInfo: {
        employeeCount_one: "{count} موظف",
        employeeCount_other: "{count} موظفين",
      },

      emptyNoCompany: {
        title: "لم يتم العثور على شركات",
        message: "قم بإنشاء شركة أولاً قبل إضافة الموظفين.",
      },

      emptyNoEmployees: {
        title: "لم يتم العثور على موظفين",
        messageSearch: "لا يوجد موظفون مطابقون لبحثك.",
        messageDefault: "لا يوجد لدى هذه الشركة أي موظفين بعد.",
        cta: "إضافة موظف",
      },

      loading: "جارٍ تحميل الموظفين...",

      photo: {
        label: "صورة الموظف",
        choose: "اختيار صورة",
        change: "تغيير الصورة",
        remove: "إزالة",
      },

      company: {
        label: "الشركة",
        selectPlaceholder: "اختر الشركة",
        unnamed: "شركة بدون اسم",
      },

      sections: {
        personalInformation: "المعلومات الشخصية",
        contactInformation: "معلومات الاتصال",
        employment: "الوظيفة",
        identification: "الهوية",
        company: "الشركة",
        notes: "ملاحظات",
      },

      documents: {
        menuButton: "المستندات",
        attestationTravail: "شهادة عمل",
        attestationSalaire: "شهادة عمل وراتب",
        certificatTravail: "شهادة نهاية الخدمة",
        contratTravail: "عقد العمل",
        soldeToutCompte: "وصل تصفية الحساب النهائي",
        generationFailed: "حدث خطأ أثناء إنشاء المستند.",
      },

      bulkImport: {
        exportButton: "تصدير (CSV)",
        exportFailed: "تعذر تصدير الموظفين.",
        openButton: "استيراد (CSV)",
        title: "استيراد الموظفين دفعة واحدة",
        helpText: "قم برفع ملف CSV لإنشاء عدة موظفين دفعة واحدة. يتم التحقق من كل صف أولاً — لن يتم إنشاء أي شيء قبل التأكيد.",
        downloadTemplate: "تنزيل نموذج CSV",
        preview: "التحقق من الملف",
        previewing: "جارٍ التحقق...",
        previewFailed: "تعذرت قراءة هذا الملف.",
        summaryValid: "{count} جاهز للاستيراد",
        summaryErrors: "{count} به أخطاء",
        summaryWarnings: "{count} به تنبيهات",
        rowOk: "لا توجد مشاكل",
        fixErrorsFirst: "قم بتصحيح الصفوف التي بها أخطاء وأعد رفع الملف قبل الاستيراد — الصفوف التي بها تنبيهات فقط سيتم استيرادها.",
        importButton: "استيراد {count} موظف(ين)",
        committing: "جارٍ الاستيراد...",
        commitFailed: "تعذر إتمام الاستيراد.",
        commitSuccess: "تم استيراد {count} موظف(ين) بنجاح.",
      },

      fields: { createLoginCheckboxLabel: "إنشاء حساب خدمة ذاتية لهذا الموظف أيضاً (باستخدام بريده المهني)", createLogin: "حساب الخدمة الذاتية", noDepartments: "لا توجد أقسام بعد — أضف قسماً من التنظيم > الأقسام", manager: "المسؤول المباشر", noManagerCandidates: "لا يوجد موظف آخر في هذه الشركة بعد",
        employeeNumber: "الرقم الوظيفي",
        employeeNumberPlaceholder: "EMP-001",

        firstName: "الاسم الأول",
        firstNamePlaceholder: "الاسم الأول",

        lastName: "اسم العائلة",
        lastNamePlaceholder: "اسم العائلة",

        firstNameArabic: "الاسم الأول (بالعربية)",
        firstNameArabicPlaceholder: "الاسم الأول",

        lastNameArabic: "اسم العائلة (بالعربية)",
        lastNameArabicPlaceholder: "اسم العائلة",

        gender: "الجنس",
        genderPlaceholder: "اختر الجنس",

        dateOfBirth: "تاريخ الميلاد",

        placeOfBirth: "مكان الميلاد",
        placeOfBirthPlaceholder: "المدينة",

        nationality: "الجنسية",
        nationalityPlaceholder: "مغربية",

        maritalStatus: "الحالة الاجتماعية",
        maritalStatusPlaceholder: "اختر الحالة",

        numberOfDependents: "عدد المعالين",

        cin: "البطاقة الوطنية",
        cinPlaceholder: "AB123456",

        passportNumber: "رقم جواز السفر",
        passportNumberPlaceholder: "رقم جواز السفر",

        passportExpiryDate: "تاريخ انتهاء جواز السفر",

        workPermitNumber: "رقم رخصة العمل",
        workPermitNumberPlaceholder: "رقم الرخصة",

        workPermitExpiryDate: "تاريخ انتهاء رخصة العمل",

        personalEmail: "البريد الإلكتروني الشخصي",
        personalEmailPlaceholder: "personal@email.com",

        workEmail: "البريد الإلكتروني المهني",
        workEmailPlaceholder: "employee@company.com",

        phone: "الهاتف",
        phonePlaceholder: "+212...",

        secondaryPhone: "هاتف إضافي",
        secondaryPhonePlaceholder: "+212...",

        street: "الشارع",
        streetPlaceholder: "العنوان",

        city: "المدينة",
        cityPlaceholder: "المدينة",

        region: "الجهة",
        regionPlaceholder: "الجهة",

        postalCode: "الرمز البريدي",
        postalCodePlaceholder: "40000",

        country: "البلد",
        countryPlaceholder: "المغرب",

        emergencyName: "جهة اتصال الطوارئ",
        emergencyNamePlaceholder: "الاسم الكامل",

        emergencyRelationship: "صلة القرابة",
        emergencyRelationshipPlaceholder: "زوج/زوجة، والد...",

        emergencyPhone: "هاتف الطوارئ",
        emergencyPhonePlaceholder: "+212...",

        emergencyEmail: "بريد إلكتروني للطوارئ",
        emergencyEmailPlaceholder: "email@example.com",

        hireDate: "تاريخ التوظيف",
        terminationDate: "تاريخ إنهاء العقد",

        employmentStatus: "حالة التوظيف",
        employmentStatusPlaceholder: "اختر الحالة",

        employmentType: "نوع العقد",
        employmentTypePlaceholder: "اختر النوع",

        jobTitle: "المسمى الوظيفي",
        jobTitlePlaceholder: "مسؤول الإنتاج",

        department: "القسم",
        departmentPlaceholder: "الإنتاج",

        service: "المصلحة",
        servicePlaceholder: "التجميع",

        position: "المنصب",
        positionPlaceholder: "عامل",

        workLocation: "مكان العمل",
        workLocationPlaceholder: "المصنع",

        cnssNumber: "رقم الضمان الاجتماعي",
        cnssNumberPlaceholder: "رقم الضمان الاجتماعي",

        cnssRegistrationDate: "تاريخ التسجيل في الضمان الاجتماعي",

        taxIdentificationNumber: "المعرف الضريبي",
        taxIdentificationNumberPlaceholder: "المعرف الضريبي",

        taxStatus: "الوضع الضريبي",
        taxStatusPlaceholder: "الوضع الضريبي",

        numberOfChildren: "عدد الأبناء",

        spouseWorking: "الزوج/الزوجة يعمل",
        spouseWorkingCheckboxLabel: "الزوج/الزوجة يعمل حالياً",

        bankName: "اسم البنك",
        bankNamePlaceholder: "البنك",

        accountName: "اسم صاحب الحساب",
        accountNamePlaceholder: "اسم صاحب الحساب",

        rib: "RIB",
        ribPlaceholder: "RIB",

        iban: "IBAN",
        ibanPlaceholder: "IBAN",

        paymentMethod: "طريقة الدفع",
        paymentMethodPlaceholder: "اختر طريقة",

        notes: "ملاحظات",
        notesPlaceholder: "ملاحظات إضافية...",

        isActive: "نشط",
        isActiveCheckboxLabel: "الموظف نشط",
      },

      genders: {
        male: "ذكر",
        female: "أنثى",
        other: "آخر",
      },

      maritalStatuses: {
        single: "أعزب",
        married: "متزوج(ة)",
        divorced: "مطلق(ة)",
        widowed: "أرمل(ة)",
        other: "آخر",
      },

      taxStatus: {
        taxable: "خاضع للضريبة",
        nonTaxable: "غير خاضع للضريبة",
        exempt: "معفى",
      },

      statuses: {
        active: "نشط",
        inactive: "غير نشط",
        on_leave: "في إجازة",
        suspended: "موقوف",
        terminated: "منتهي العقد",
        unknown: "غير معروف",
      },

      employmentTypes: {
        permanent: "عقد غير محدد المدة",
        fixed_term: "عقد محدد المدة",
        temporary: "مؤقت",
        intern: "متدرب",
        apprentice: "متمرن",
        freelance: "حر",
        part_time: "دوام جزئي",
        other: "آخر",
      },

      paymentMethods: {
        bank_transfer: "تحويل بنكي",
        cash: "نقداً",
        check: "شيك",
      },

      card: {
        view: "عرض",
        edit: "تعديل",
      },

      detail: {
        employeeLabel: "موظف",
        firstName: "الاسم الأول",
        lastName: "اسم العائلة",
        gender: "الجنس",
        dateOfBirth: "تاريخ الميلاد",
        nationality: "الجنسية",
        maritalStatus: "الحالة الاجتماعية",
        phone: "الهاتف",
        email: "البريد الإلكتروني",
        address: "العنوان",
        jobTitle: "المسمى الوظيفي",
        department: "القسم",
        employmentType: "نوع العقد",
        hireDate: "تاريخ التوظيف",
        workLocation: "مكان العمل",
        service: "المصلحة",
        cin: "البطاقة الوطنية",
        passport: "جواز السفر",
        cnssNumber: "رقم الضمان الاجتماعي",
        taxId: "المعرف الضريبي",
        empty: "—",
      },

      buttons: {
        save: "جارٍ الحفظ...",
        createEmployee: "إنشاء الموظف",
        updateEmployee: "تحديث الموظف",
        cancel: "إلغاء",
      },

      breadcrumbs: {
        hr: "الموارد البشرية",
        employees: "الموظفون",
        addEmployee: "إضافة موظف",
        editEmployee: "تعديل الموظف",
      },

      errors: {
        companyRequired: "يرجى اختيار شركة.",
        invalidPhoto: "يرجى اختيار ملف صورة.",
        fetchCompaniesFailed: "فشل تحميل الشركات",
        fetchEmployeesFailed: "فشل تحميل الموظفين",
        createFailed: "فشل إنشاء الموظف",
        updateFailed: "فشل تحديث الموظف",
        deleteFailed: "فشل حذف الموظف",
        notFound: "الموظف غير موجود",
        duplicateEmployeeNumber: "يوجد موظف بهذا الرقم الوظيفي بالفعل",
        requiredFields: "يرجى ملء جميع الحقول المطلوبة",
      },
    },
    salaries: {
      title: "الرواتب",
      subtitle: "إدارة أجور الموظفين وتاريخ رواتبهم.",
      addSalary: "إضافة راتب",
      giveRaise: "منح زيادة",

      createTitle: "سجل راتب جديد",
      createSureMessage: "هل أنت متأكد من أنك تريد حفظ هذا الراتب؟ سيتم إغلاق الراتب الحالي لهذا الموظف اعتباراً من تاريخ السريان هذا.",
      createSuccessTitle: "تم تسجيل الراتب",
      createSuccessMessage: "تم إنشاء سجل الراتب بنجاح.",

      deleteTitle: "حذف سجل الراتب",
      deleteSureMessage: "هل أنت متأكد من أنك تريد حذف سجل الراتب هذا؟ لا يمكن التراجع عن هذا الإجراء.",

      emptyTitle: "لا توجد رواتب",
      emptyMessage: "لا يوجد لدى هذه الشركة أي سجلات رواتب بعد.",

      fields: {
        employee: "الموظف",
        employeeSearchPlaceholder: "ابحث بالاسم أو الرقم الوظيفي أو البطاقة الوطنية أو رقم الضمان الاجتماعي...",
        baseSalary: "الراتب الأساسي",
        effectiveDate: "تاريخ السريان",
        notes: "ملاحظات",
        notesPlaceholder: "سبب هذا التغيير أو أي سياق إضافي...",
      },

      table: {
        base: "الأساسي",
        gross: "الإجمالي",
        net: "الصافي",
        endDate: "تاريخ الانتهاء",
        status: "الحالة",
        ongoing: "جارٍ",
      },

      actions: {
        history: "عرض السجل",
      },

      history: { deleteRecord: "حذف سجل الراتب هذا",
        titleFor: "سجل الرواتب — {name}",
        empty: "لا يوجد سجل رواتب لهذا الموظف.",
        current: "الحالي",
        past: "سابق",
      },

      breadcrumbs: {
        hr: "الموارد البشرية",
        salaries: "الرواتب",
      },

      buttons: {
        create: "حفظ الراتب",
      },

      errors: {
        fetchFailed: "فشل تحميل الرواتب",
        actionFailed: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      },
    },
    absences: {
      title: "الغيابات",
      subtitle: "مراجعة وإدارة طلبات الإجازة والغياب.",
      addAbsence: "طلب غياب جديد",

      createTitle: "طلب غياب جديد",
      createSureMessage: "هل أنت متأكد من أنك تريد إرسال طلب الغياب هذا؟",
      createSuccessTitle: "تم إرسال الطلب",
      createSuccessMessage: "تم إرسال طلب الغياب بنجاح.",

      acceptTitle: "قبول الغياب",
      acceptSureMessage: "هل أنت متأكد من أنك تريد قبول طلب الغياب هذا؟",

      rejectTitle: "رفض الغياب",
      rejectSureMessage: "هل أنت متأكد من أنك تريد رفض طلب الغياب هذا؟",

      deleteTitle: "حذف الغياب",
      deleteSureMessage: "هل أنت متأكد من أنك تريد حذف سجل الغياب هذا؟ لا يمكن التراجع عن هذا الإجراء.",

      emptyTitle: "لا توجد غيابات",
      emptyMessage: "لا توجد طلبات غياب مطابقة لعوامل التصفية الخاصة بك.",

      unjustified: "غير مبرر",

      fields: {
        employee: "الموظف",
        employeeSearchPlaceholder: "ابحث بالاسم أو الرقم الوظيفي أو البطاقة الوطنية أو رقم الضمان الاجتماعي...",
        type: "النوع",
        startDate: "تاريخ البدء",
        endDate: "تاريخ الانتهاء",
        halfDay: "نصف يوم",
        justified: "مبرر",
        reason: "السبب",
        reasonPlaceholder: "السبب أو أي سياق إضافي...",
        reviewComment: "تعليق المراجعة",
        status: "الحالة",
      },

      types: {
        paid_leave: "إجازة مدفوعة",
        unpaid_leave: "إجازة بدون أجر",
        sick_leave: "إجازة مرضية",
        absence: "غياب",
        other: "آخر",
      },

      status: { manager_approved: "وافق عليها المدير",
        pending: "قيد الانتظار",
        accepted: "مقبول",
        rejected: "مرفوض",
      },

      filters: {
        allStatuses: "جميع الحالات",
        allTypes: "جميع الأنواع",
      },

      table: {
        period: "الفترة",
        days: "الأيام",
      },

      actions: {
        accept: "قبول",
        reject: "رفض",
      },

      breadcrumbs: {
        hr: "الموارد البشرية",
        absences: "الغيابات",
      },

      buttons: {
        create: "إرسال الطلب",
      },

      errors: {
        fetchFailed: "فشل تحميل الغيابات",
        actionFailed: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      },
    },
    advances: {
      title: "السلف",
      subtitle: "مراجعة وإدارة طلبات السلف على الراتب.",
      addAdvance: "طلب سلفة جديد",

      createTitle: "طلب سلفة جديد",
      createSureMessage: "هل أنت متأكد من أنك تريد إرسال طلب السلفة هذا؟",
      createSuccessTitle: "تم إرسال الطلب",
      createSuccessMessage: "تم إرسال طلب السلفة بنجاح.",

      acceptTitle: "قبول السلفة",
      acceptSureMessage: "هل أنت متأكد من أنك تريد قبول طلب السلفة هذا؟",

      rejectTitle: "رفض السلفة",
      rejectSureMessage: "هل أنت متأكد من أنك تريد رفض طلب السلفة هذا؟",

      markRepaidTitle: "تحديد كمسددة",
      markRepaidSureMessage: "هل أنت متأكد من أنك تريد تحديد هذه السلفة كمسددة بالكامل؟",

      deleteTitle: "حذف السلفة",
      deleteSureMessage: "هل أنت متأكد من أنك تريد حذف سجل السلفة هذا؟ لا يمكن التراجع عن هذا الإجراء.",

      emptyTitle: "لا توجد سلف",
      emptyMessage: "لا توجد طلبات سلف مطابقة لعوامل التصفية الخاصة بك.",

      fields: {
        employee: "الموظف",
        employeeSearchPlaceholder: "ابحث بالاسم أو الرقم الوظيفي أو البطاقة الوطنية أو رقم الضمان الاجتماعي...",
        amount: "المبلغ",
        requestDate: "تاريخ الطلب",
        reason: "السبب",
        reasonPlaceholder: "السبب أو أي سياق إضافي...",
        reviewComment: "تعليق المراجعة",
        status: "الحالة",
      },

      status: { manager_approved: "وافق عليها المدير",
        pending: "قيد الانتظار",
        accepted: "مقبولة",
        rejected: "مرفوضة",
      },

      filters: {
        allStatuses: "جميع الحالات",
      },

      table: {
        remaining: "المتبقي",
        fullyRepaid: "مسددة بالكامل",
      },

      actions: {
        accept: "قبول",
        reject: "رفض",
        markRepaid: "تحديد كمسددة",
      },

      breadcrumbs: {
        hr: "الموارد البشرية",
        advances: "السلف",
      },

      buttons: {
        create: "إرسال الطلب",
      },

      errors: {
        fetchFailed: "فشل تحميل السلف",
        actionFailed: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      },
    },

    units: {
      unit: "وحدة",
      piece: "قطعة",
      pair: "زوج",
      dozen: "دزينة",
      set: "طقم",
      kg: "كيلوغرام (kg)",
      g: "غرام (g)",
      t: "طن (t)",
      lb: "رطل (lb)",
      oz: "أونصة (oz)",
      quintal: "قنطار (q)",
      l: "لتر (L)",
      ml: "مليلتر (mL)",
      m3: "متر مكعب (m³)",
      gal: "غالون (gal)",
      m: "متر (m)",
      cm: "سنتيمتر (cm)",
      mm: "مليمتر (mm)",
      km: "كيلومتر (km)",
      ft: "قدم (ft)",
      in: "بوصة (in)",
      yd: "ياردة (yd)",
      m2: "متر مربع (m²)",
      ft2: "قدم مربع (ft²)",
      ha: "هكتار (ha)",
      box: "صندوق",
      carton: "كرتون",
      pallet: "منصة نقالة",
      bag: "كيس",
      sack: "كيس كبير",
      bottle: "زجاجة",
      can: "علبة",
      roll: "لفة",
      sheet: "ورقة",
      bundle: "حزمة",
      case: "صندوق كبير",
      drum: "برميل",
      barrel: "برميل نفط",
      container: "حاوية",
      hour: "ساعة",
      day: "يوم",
      month: "شهر",
    },

    contentTranslation: {
      title: "الترجمات",
      editButton: "الترجمات",
      original: "النص الأصلي",
      auto: "مُترجَم تلقائيًا",
      manual: "مُعدَّل يدويًا",
      missing: "لم تتم ترجمته بعد",
      regenerate: "إعادة الترجمة",
      originalHint: "هذا هو النص الأصلي — عدّل الحقل نفسه لتغييره.",
      save: "حفظ",
      saving: "جارٍ الحفظ…",
      close: "إغلاق",
      placeholder: "أدخل الترجمة…",
      errors: {
        loadFailed: "فشل تحميل الترجمات.",
        saveFailed: "فشل حفظ الترجمة.",
        regenerateFailed: "فشلت إعادة توليد الترجمة.",
      },
    },

    departments: { noManagerBadge: "بدون مدير", managerLabel: "المدير", moduleAccessBadge: "وصول إلى الوحدة",
      title: "الأقسام",
      subtitle: "حدد أقسام مؤسستك والمناصب الوظيفية ضمن كل قسم.",
      addDepartment: "إضافة قسم",
      addDefaults: "إضافة أقسام افتراضية",
      defaultsModal: {
        title: "إضافة أقسام افتراضية",
        helpText: "اختر الأقسام التي تريد إضافتها — يأتي كل قسم باسم ووصف قياسيين، وبالنسبة للموارد البشرية/الإنتاج، بصلاحية الوصول إلى الوحدة مُحددة مسبقًا. يمكنك دائمًا تعديلها أو إضافة المزيد لاحقًا.",
        adding: "جارٍ الإضافة...",
        addButton: "إضافة {count} قسم (أقسام)",
      },
      editDepartment: "تعديل القسم",
      addPosition: "إضافة منصب",
      editPosition: "تعديل المنصب",
      deleteTitle: "حذف القسم",
      deleteSureMessage: "هل أنت متأكد من حذف هذا القسم؟ يجب إعادة تعيين الموظفين والمناصب التي لا تزال تستخدمه أولاً.",
      deletePositionTitle: "حذف المنصب",
      deletePositionSureMessage: "هل أنت متأكد من حذف هذا المنصب؟ يجب أولاً إعادة تعيين الموظفين الذين يشغلونه، أو المناصب الأخرى التابعة له.",
      emptyTitle: "لا توجد أقسام بعد",
      emptyMessage: "أضف أول قسم لبدء بناء هيكلك التنظيمي.",
      searchPlaceholder: "بحث في الأقسام...",
      noSearchResults: "لا توجد أقسام مطابقة لبحثك.",
      noPositions: "لا توجد مناصب محددة في هذا القسم بعد.",
      fields: { purchasingAccess: "الوصول إلى وحدة المشتريات", manager: "مدير القسم", noManager: "بدون مدير", managerHint: "يشرف على القسم بأكمله: وصول كامل إلى الوحدة، يوافق على طلبات الفريق، ويحدد المسميات الوظيفية التي تحصل على الوصول.", grantsModuleAccess: "يمنح الوصول إلى الوحدة", grantsModuleAccessHint: "يحصل شاغلو هذا المنصب على وحدة القسم (مثل الموارد البشرية أو المخزون). اتركه غير مفعّل للموظفين الذين يجب أن يروا مساحتهم فقط.",
        name: "الاسم", description: "الوصف", permissionKey: "الوصول إلى الوحدة",
        permissionKeyHint: "اختياري — يُحدد فقط على قسم واحد إذا كان يجب أن يحصل الموظفون فيه (وحساباتهم التي تُنشأ تلقائيًا) على صلاحية الوصول إلى وحدة الموارد البشرية أو الإنتاج. يجب أن تبقى معظم الأقسام على \"بدون وصول خاص\".",
        category: "الوظيفة",
        noCategory: "لا توجد وظيفة محددة",
        categoryHint: "اختياري — يتيح لنموذج الموظف اقتراح مسميات وظيفية قياسية لهذا القسم بدلاً من ترك الحقل حرًا. مجرد اقتراح، ولا علاقة له بالصلاحيات على عكس حقل الوصول إلى الوحدة أعلاه.",
        noSpecialAccess: "بدون وصول خاص", hrAccess: "الوصول إلى وحدة الموارد البشرية", productionAccess: "الوصول إلى وحدة الإنتاج",
        positionTitle: "مسمى المنصب", reportsTo: "يخضع لإشراف", noReportsTo: "لا شيء (منصب أعلى المستويات)",
        salaryMin: "نطاق الراتب — الحد الأدنى", salaryMax: "نطاق الراتب — الحد الأقصى", salaryBand: "نطاق الراتب",
        requiredSkills: "المهارات المطلوبة", requiredSkillsPlaceholder: "مفصولة بفواصل، مثال: Excel، القيادة",
      },
      errors: {
        nameRequired: "اسم القسم مطلوب", titleRequired: "مسمى المنصب مطلوب",
        saveFailed: "حدث خطأ أثناء الحفظ.", deleteFailed: "حدث خطأ أثناء الحذف.",
      },
    },

    payroll: {
      title: "الأجور",
      subtitle: "أنشئ دورات الأجور الشهرية وأدر كشوف الرواتب.",
      generateRun: "إنشاء دورة أجور",
      createTitle: "إنشاء دورة أجور",
      createSureMessage: "هل تريد إنشاء الأجور لهذه الفترة؟ سيتم إنشاء كشف راتب لكل موظف نشط لديه راتب مسجل.",
      createSuccessTitle: "تم إنشاء دورة الأجور",
      createSuccessMessage: "تم إنشاء دورة الأجور بنجاح.",
      completeTitle: "إغلاق دورة الأجور",
      completeSureMessage: "هل تريد إغلاق دورة الأجور هذه؟ بمجرد الإغلاق، يتم قفل كشوف الرواتب وإخطار الموظفين.",
      deleteTitle: "حذف دورة الأجور",
      deleteSureMessage: "هل تريد حذف مسودة دورة الأجور هذه وجميع كشوف رواتبها؟ لا يمكن التراجع عن هذا الإجراء.",
      emptyTitle: "لا توجد دورات أجور بعد",
      emptyMessage: "أنشئ أول دورة أجور لهذه الشركة.",
      noPayslips: "لا توجد كشوف رواتب في هذه الدورة.",
      fields: { month: "الشهر", year: "السنة", status: "الحالة" },
      table: { period: "الفترة", employees: "الموظفون", gross: "الإجمالي", net: "الصافي", searchPlaceholder: "البحث عن الموظفين..." },
      status: { draft: "مسودة", completed: "مكتملة", voided: "ملغاة" },
      payslipStatus: { draft: "مسودة", validated: "مصادق عليه", paid: "مدفوع" },
      actions: { view: "عرض", complete: "إغلاق", regenerate: "إعادة إنشاء", markPaid: "تحديد كمدفوع", downloadPdf: "تنزيل كشف الراتب" },
      exports: {
        cnss: "تصدير CNSS",
        cnssHint: "ورقة التصريح — تحقق من التوافق مع صيغة Damancom الحالية قبل الرفع",
        register: "سجل الأجور",
        bankTransfer: "ملف التحويل البنكي",
      },
      buttons: { generate: "إنشاء", saving: "جارٍ الحفظ..." },
      breadcrumbs: { hr: "الموارد البشرية", payroll: "الأجور" },
      months: ["يناير","فبراير","مارس","أبريل","ماي","يونيو","يوليوز","غشت","شتنبر","أكتوبر","نونبر","دجنبر"],
      errors: { fetchFailed: "فشل تحميل دورات الأجور", actionFailed: "حدث خطأ ما. يرجى المحاولة مرة أخرى." },
    },

    contracts: {
      title: "العقود",
      subtitle: "تتبع عقود العمل والتجديدات وتواريخ الانتهاء.",
      addContract: "عقد جديد",
      createTitle: "عقد جديد",
      createSureMessage: "هل أنت متأكد من إنشاء هذا العقد؟",
      createSuccessTitle: "تم إنشاء العقد",
      createSuccessMessage: "تم إنشاء العقد بنجاح.",
      renewTitle: "تجديد العقد",
      renewSureMessage: "هل تريد تجديد هذا العقد؟ سيتم إغلاق العقد الحالي وبدء عقد جديد.",
      deleteTitle: "حذف العقد",
      deleteSureMessage: "هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع عن هذا الإجراء.",
      emptyTitle: "لا توجد عقود بعد",
      emptyMessage: "لا تحتوي هذه الشركة على أي عقود مسجلة بعد.",
      expiringBanner: "{count} عقد (عقود) تنتهي خلال 30 يومًا.",
      fields: { employee: "الموظف", type: "نوع العقد", startDate: "تاريخ البدء", endDate: "تاريخ الانتهاء" },
      status: { active: "ساري", expired: "منتهي", terminated: "مفسوخ", renewed: "مجدد" },
      actions: { renew: "تجديد" },
      buttons: { create: "حفظ العقد" },
      breadcrumbs: { hr: "الموارد البشرية", contracts: "العقود" },
      errors: { fetchFailed: "فشل تحميل العقود", actionFailed: "حدث خطأ ما. يرجى المحاولة مرة أخرى." },
    },

    documents: {
      title: "المستندات",
      subtitle: "احفظ مستندات الموظفين وتتبع تواريخ انتهاء صلاحيتها.",
      uploadDocument: "رفع مستند",
      editDocument: "تعديل المستند",
      deleteTitle: "حذف المستند",
      deleteSureMessage: "هل أنت متأكد من حذف هذا المستند؟ لا يمكن التراجع عن هذا الإجراء.",
      emptyTitle: "لا توجد مستندات بعد",
      emptyMessage: "لا تحتوي هذه الشركة على أي مستندات مسجلة بعد.",
      expiringBanner: "{count} مستند (مستندات) تنتهي صلاحيتها خلال 30 يومًا.",
      fields: { employee: "الموظف", type: "النوع", label: "التسمية", labelPlaceholder: "مثال: البطاقة الوطنية", expiryDate: "تاريخ الانتهاء", file: "الملف", replaceFile: "استبدال الملف (اختياري)" },
      table: { file: "الملف" },
      types: {
        cin: "البطاقة الوطنية (CIN)", passport: "جواز السفر", work_permit: "رخصة العمل",
        residence_permit: "بطاقة الإقامة", contract: "عقد", diploma: "شهادة",
        cv: "السيرة الذاتية", medical_certificate: "شهادة طبية", other: "أخرى",
      },
      actions: { view: "عرض", loadMore: "تحميل المزيد", loadMoreCount: "عرض {loaded} من {total}" },
      buttons: { upload: "رفع" },
      breadcrumbs: { hr: "الموارد البشرية", documents: "المستندات" },
      errors: {
        fetchFailed: "فشل تحميل المستندات", actionFailed: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
        missingFields: "يرجى اختيار موظف وملف.", uploadFailed: "فشل رفع المستند.",
      },
    },

    attendance: {
      title: "الحضور",
      subtitle: "راجع سجلات تسجيل الدخول والخروج.",
      emptyTitle: "لا توجد سجلات حضور",
      emptyMessage: "لا توجد سجلات حضور مطابقة لعوامل التصفية المحددة.",
      filterAllEmployees: "جميع الموظفين",
      fields: { employee: "الموظف", date: "التاريخ", clockIn: "الدخول", clockOut: "الخروج", notes: "ملاحظات" },
      status: { present: "حاضر", late: "متأخر", absent: "غائب", half_day: "نصف يوم", holiday: "عطلة" },
      breadcrumbs: { hr: "الموارد البشرية", attendance: "الحضور" },
      errors: { fetchFailed: "فشل تحميل سجلات الحضور" },
    },

    reports: { chart: { zoomHint: "اسحب المقابض أسفل الرسم البياني للتكبير", yearly: "سنوي", monthly: "شهري", view: "العرض", lastMonths: "آخر {n} أشهر", range: "الفترة", },
      title: "التقارير",
      subtitle: "الاتجاهات المتعلقة بعدد الموظفين ودوران العمل والغياب وتكلفة الأجور.",
      stats: { totalHeadcount: "إجمالي عدد الموظفين", activeEmployees: "الموظفون النشطون", currentGross: "الإجمالي الشهري الحالي (تقديري)", currentNet: "الصافي الشهري الحالي (تقديري)", missingSalaryNote: "{count} موظف (موظفين) نشطين ليس لديهم راتب مسجل بعد — غير مدرجين في هذا التقدير." },
      expand: "توسيع",
      charts: {
        headcountByDepartment: "عدد الموظفين حسب القسم", turnover: "دوران العمل (آخر 12 شهرًا)",
        hires: "التوظيفات", terminations: "المغادرات", absenteeism: "معدل الغياب (آخر 6 أشهر)",
        absenteeismRate: "معدل الغياب", payrollCost: "تكلفة الأجور (آخر 12 شهرًا)",
        estimatedFootnote: "* الشهر الحالي، المشار إليه بعلامة نجمية، هو تقدير مباشر بناءً على الرواتب الحالية — لم يتم تنفيذ الأجور له بعد.",
      },
      breadcrumbs: { hr: "الموارد البشرية", reports: "التقارير" },
      loadError: "فشل تحميل بعض بيانات التقرير. يرجى المحاولة مرة أخرى، أو التحقق من وحدة التحكم لمزيد من التفاصيل.",
      rankings: {
        title: "تصنيف الموظفين",
        last30Days: "آخر 30 يومًا",
        last90Days: "آخر 90 يومًا",
        last365Days: "آخر 12 شهرًا",
        mostAbsenceDays: "الأكثر أيام غياب",
        bestAttendanceRate: "أفضل معدل حضور",
        mostOvertimeHours: "الأكثر ساعات إضافية",
        mostLateDays: "الأكثر تأخرًا",
        noData: "لا توجد بيانات لهذه الفترة.",
        days: "أيام",
      },
    },  twoFactor: { qrAlt: "رمز QR للتحقق الثنائي",
    title: "المصادقة الثنائية",
    disabledHint: "أضف طبقة إضافية من الأمان إلى حسابك — بعد كلمة المرور، ستحتاج أيضًا إلى رمز من تطبيق مصادقة لتسجيل الدخول.",
    enabledHint: "المصادقة الثنائية مفعّلة على حسابك. سيُطلب منك رمز من تطبيق المصادقة في كل مرة تسجّل فيها الدخول.",
    enableButton: "تفعيل المصادقة الثنائية",
    disableButton: "إلغاء تفعيل المصادقة الثنائية",
    disabling: "جارٍ الإلغاء...",
    scanTitle: "امسح رمز الاستجابة السريعة",
    scanHint: "امسحه باستخدام تطبيق مصادقة (Google Authenticator أو Authy وغيرها)، ثم أدخل الرمز المكوّن من 6 أرقام الذي يظهر للتأكيد.",
    manualEntryLabel: "تعذّر المسح؟ أدخل هذا الرمز يدويًا:",
    confirmAndEnable: "تأكيد وتفعيل",
    verifying: "جارٍ التحقق...",
    backupCodesTitle: "احفظ رموز النسخ الاحتياطي",
    backupCodesHint: "يمكن استخدام كل رمز مرة واحدة لتسجيل الدخول إذا فقدت الوصول إلى تطبيق المصادقة. احفظها في مكان آمن — لن تُعرض مرة أخرى.",
    copyBackupCodes: "نسخ الرموز",
    copied: "تم النسخ",
    iSavedThem: "لقد حفظت هذه الرموز",
    confirmPasswordLabel: "أكّد كلمة المرور للمتابعة",
    errors: {
      statusFailed: "تعذّر التحقق من حالة المصادقة الثنائية.",
      setupFailed: "تعذّر بدء إعداد المصادقة الثنائية.",
      invalidCode: "هذا الرمز غير مطابق — تحقق من تطبيق المصادقة وحاول مرة أخرى.",
      disableFailed: "تعذّر إلغاء تفعيل المصادقة الثنائية.",
    },
  },

  disciplinaryActions: {
    title: "الإجراءات التأديبية",
    subtitle: "تتبع الإنذارات والإجراءات التصحيحية الصادرة للموظفين.",
    addAction: "إضافة سجل",
    editAction: "تعديل السجل",
    emptyTitle: "لا توجد سجلات تأديبية بعد",
    emptyMessage: "لا تحتوي هذه الشركة على أي إجراءات تأديبية مسجلة.",
    deleteTitle: "حذف السجل",
    deleteSureMessage: "هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.",
    acknowledged: "تم الاطلاع",
    notAcknowledged: "لم يتم الاطلاع بعد",
    breadcrumbs: {
      hr: "الموارد البشرية",
      disciplinaryActions: "الإجراءات التأديبية",
    },
    fields: {
      employee: "الموظف",
      type: "النوع",
      date: "التاريخ",
      reason: "السبب",
      description: "الوصف",
      suspensionDays: "مدة الإيقاف (أيام)",
      issuedBy: "صادر عن",
      notes: "ملاحظات",
    },
    types: {
      verbal_warning: "إنذار شفهي",
      written_warning: "إنذار كتابي",
      final_warning: "إنذار نهائي",
      suspension: "إيقاف عن العمل",
      termination_notice: "إشعار إنهاء الخدمة",
    },
    errors: {
      fetchFailed: "فشل تحميل الإجراءات التأديبية",
      saveFailed: "خطأ أثناء الحفظ",
      deleteFailed: "خطأ أثناء الحذف",
    },
  },
  performanceReviews: {
    title: "تقييمات الأداء",
    subtitle: "دورات التقييم والأهداف والتقييمات لموظفيك.",
    addReview: "تقييم جديد",
    editReview: "تعديل التقييم",
    emptyTitle: "لا توجد تقييمات أداء بعد",
    emptyMessage: "لا تحتوي هذه الشركة على أي تقييمات أداء مسجلة.",
    deleteTitle: "حذف التقييم",
    deleteSureMessage: "هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع عن هذا الإجراء.",
    reviewedBy: "قيّمه",
    submitButton: "إرسال إلى الموظف",
    breadcrumbs: {
      hr: "الموارد البشرية",
      performanceReviews: "تقييمات الأداء",
    },
    fields: {
      employee: "الموظف",
      reviewer: "المقيّم",
      periodLabel: "فترة التقييم",
      periodLabelPlaceholder: "مثال: التقييم السنوي 2026",
      reviewDate: "تاريخ التقييم",
      goals: "الأهداف (هدف في كل سطر)",
      goalsPlaceholder: "تحسين وقت الاستجابة لتذاكر الدعم\nإتمام شهادة التأهيل",
      strengths: "نقاط القوة",
      areasForImprovement: "مجالات التحسين",
      comments: "ملاحظات",
    },
    criteria: {
      jobKnowledge: "المعرفة الوظيفية",
      qualityOfWork: "جودة العمل",
      communication: "التواصل",
      teamwork: "العمل الجماعي",
      initiative: "المبادرة",
      punctuality: "الالتزام بالمواعيد",
    },
    statuses: {
      draft: "مسودة",
      submitted: "مُرسلة",
      acknowledged: "تم الاطلاع",
    },
    errors: {
      fetchFailed: "فشل تحميل تقييمات الأداء",
      saveFailed: "خطأ أثناء الحفظ",
      submitFailed: "خطأ أثناء الإرسال",
      deleteFailed: "خطأ أثناء الحذف",
    },
  },
  leaveCalendar: {
    title: "تقويم الإجازات",
    subtitle: "اطّلع بسرعة على من هو في إجازة موافق عليها.",
    previousMonth: "الشهر السابق",
    nextMonth: "الشهر التالي",
    breadcrumbs: {
      hr: "الموارد البشرية",
      leaveCalendar: "تقويم الإجازات",
    },
    weekdays: {
      0: "إثن",
      1: "ثلا",
      2: "أرب",
      3: "خمي",
      4: "جمع",
      5: "سبت",
      6: "أحد",
    },
    errors: {
      fetchFailed: "فشل تحميل تقويم الإجازات",
    },
  },
};
