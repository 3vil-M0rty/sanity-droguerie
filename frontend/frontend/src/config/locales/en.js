// UI dictionary — en. Split out of i18n.config.js so each language
// is its own module (see loadLanguage there).
export default { quota: { title: "Quotas", hint: "Leave empty for unlimited. Terminated employees don't count. Lowering a quota deletes nothing — the client just can't create more.", maxCompanies: "Max. companies", maxEmployees: "Max. employees", unlimited: "Unlimited", edit: "Edit quotas", saved: "Quotas saved.", companies: "Companies", employees: "Employees", companiesFull: "Company limit reached — contact the platform to raise it.", employeesFull: "Employee limit reached — contact the platform to raise it. Terminated employees free a seat.", employeesHint: "Employees used / allowed (terminated ones don't count).", newCompany: "New company", }, prodPlan: { barsOf: "bars of {length} mm", }, wsMulti: { departmentSchedule: "Work schedule", useDefault: "Default schedule ({name})", departmentScheduleHint: "Schedules are created in Organisation › Work schedule.", deleteConfirm: "Delete the schedule “{name}”? Its departments go back to the default schedule.", namePlaceholder: "e.g. Workshop – split, Saturday morning", copyCurrent: "Copy the current schedule", new: "New schedule", name: "Schedule name", default: "Default schedule", makeDefault: "Make default", departments: "Departments", noDepartments: "No department in this company yet.", leaveDefaultHint: "Already on the default schedule — assign it to another schedule to move it.", currently: "Currently: {name}", defaultHint: "The default schedule applies to every department that has no schedule of its own.", assignHint: "Tick the departments that follow this schedule; unticked ones go back to the default schedule.", splitDay: "Break", splitDayHint: "Split this day (morning + afternoon). Untick it for a half day or a straight day.", splitOn: "Split", splitOff: "Straight", }, platformCo: { companyTitle: "Companies", companyAdd: "Add a company", companyNone: "No company yet.", companyAdminHint: "A client can have several companies (group, subsidiaries). Its admin can also create them from Organisation › Company; every screen has a “Company” picker.", companyFirst: "First company (optional)", companyFirstHint: "More companies can be added later, here or by the client's admin.", companyName: "Company name", companyNamePlaceholder: "e.g. Atlas Joinery Ltd", companyLegalForm: "Legal form", companyOtherForm: "Other", companyIndustry: "Activity", companyIndustryPlaceholder: "e.g. Aluminium joinery", companyCity: "City", companyAdded: "Company “{name}” added.", }, perm: { teamMenu: "My team's permissions", title: "Access permissions", subtitleAll: "Everyone's permissions, action by action. Managers then hand out the ones they have to their team.", subtitleTeam: "Give each person in your team the permissions they need — among the ones you have yourself.", searchPeople: "Search a person…", emptyTeam: "Nobody reports to you in this company.", manager: "Manager", pickSomeone: "Pick a person on the left.", rules: "Each department has a manager, who gets every permission of its module. A manager only gives permissions they have themselves, to the people of their department and everyone reporting to them (all levels). They can also let a team lead hand out permissions in turn (“Team › Team permissions”).", noLoginHint: "This person has no login: create one from their employee file (HR) to give them permissions.", selfHint: "You can't change your own permissions — your manager does.", fullAccessHint: "Admin / owner: full access to everything.", managesHint: "Manager of {deps}: that module's permissions are automatic.", applyPreset: "Apply a profile…", resetHint: "Back to their department / position default profile", reset: "Position profile", legendOn: "Granted", legendAuto: "Automatic (manager)", legendOff: "Not granted", legendGrantable: "Greyed boxes are permissions you don't have yourself.", all: "All", none: "None", toggleRow: "all / none", autoHint: "Automatic: this person manages the department", notGrantable: "You don't have this permission: you can't give or remove it", noLogin: "No login", fullAccess: "Full access", custom: "Custom", roleProfile: "Position profile", saved: "Permissions saved: {added} added, {removed} removed.", resetConfirm: "Put back their department / position default profile? Their custom permissions will be lost.", resetDone: "Default profile restored.", errors: { load: "Couldn't load the permissions.", save: "Couldn't save the permissions.", }, }, cv: { parentCategory: "Parent category", noParent: "None (main category)", parentHint: "E.g. “Aluminium profiles” › “ATLAS 78 series — sliding”. A sub-category with no accounting account uses its parent's.", addSubCategory: "Add a sub-category", articlesCount: "{n} article(s)", subCount: "{n} sub-categorie(s)", amountsLabel: "Amounts", amountsCheckbox: "Show prices, costs, margins and budgets (always shown to admins, owners, sales, finance, accounting and management)", visual: "Appearance", visualHint: "How the model looks in the catalogue, on projects and in the quote PDF: a schematic drawn to scale from L × H — or your own picture (photo, supplier catalogue drawing), which then replaces the schematic everywhere.", schematic: "Generated schematic", picture: "Picture (optional)", noPicture: "No picture", changePicture: "Change the picture", uploadPicture: "Upload a picture", drawingType: "Schematic type", leaves: "Leaves", opening: "Opening", layers: "Glass panes", grid_nx: "Columns", grid_ny: "Rows", solidLeaf: "Solid leaf (panel, no glass)", railingBars: "Bars (instead of glass infill)", drawingParamsHint: "Parameters named n (leaves), nx / ny (grid), lf, hi / ha (combos) or ent (railing post spacing) override these values line by line.", ralPick: "Pick from the RAL chart", ralPickPh: "Search a RAL (9016, anthracite…)", ralNone: "No RAL found", projectFinish: "Default colour (RAL)", drawingTypes: { sliding: "Sliding", casement: "Casement window", door: "Door", folding: "Folding", fixed: "Fixed light", grid: "Grid / curtain wall", combo: "Combination", shutter: "Roller shutter", louvre: "Louvres", railing: "Railing", pergola: "Pergola", glass: "Glass unit", garage: "Garage door", panel: "Panel", cladding: "Cladding", generic: "Generic", }, openings: { side: "Side-hung", ob: "Tilt & turn", soufflet: "Bottom-hung (tilt)", projetant: "Top-hung (projecting)", basculant: "Horizontal pivot", pivotant: "Pivot", }, }, logi: { sizeHint: "Size of the element printed on the delivery note (e.g. sash: wv × hv, glass: gw × gh). Empty = the chassis size.", startedShort: "started", onePerPiece: "One element per piece", perPiece: "One element per piece", perPieceHint: "Track each piece separately: “Sash 1”, “Sash 2”… instead of “Sashes ×2”", pieceLabelPh: "Name of one piece (e.g. Sash)", settingReady: "Only elements marked “ready to deliver” (checked / packed) can go on a delivery note — untick to deliver anything made", done: "Tracking updated.", synced: "Tracking rebuilt from the chassis.", cancelled: "Chassis cancelled.", partsSaved: "Breakdown saved.", saved: "Delivery note saved.", errors: { load: "Couldn't load.", save: "Couldn't save.", }, stages: { to_make: "Not started", in_production: "In progress", made: "Made", ready: "Ready to deliver", partially_delivered: "Partly delivered", delivered: "Delivered", installed: "Installed", received: "Accepted", cancelled: "Cancelled", }, pipeline: { made: "Made", ready: "Ready", delivered: "Delivered", installed: "Installed", received: "Accepted", }, kinds: { complete: "Complete chassis", frame: "Frame", sash: "Sashes / leaves", glass: "Glass", module: "Module", screen: "Fly screen", panel: "Panel", accessory: "Accessories", other: "Other", }, actions: { started: "Started (in progress)", unstarted: "Undo “started”", made: "Made", ready: "Ready to deliver", deliver: "Create a delivery note", installed: "Installed", received: "Accepted", unmade: "Undo “made”", unready: "Undo “ready”", uninstalled: "Undo “installed”", unreceived: "Undo “accepted”", clear_modified: "Change checked", }, historyActions: { started: "Started", unstarted: "“Started” undone", created: "Created", cancelled: "Cancelled", reactivated: "Reactivated", modified: "Changed", made: "Made", ready: "Ready to deliver", installed: "Installed", received: "Accepted", delivered: "Delivered", returned: "Returned", unmade: "“Made” undone", unready: "“Ready” undone", uninstalled: "“Installed” undone", unreceived: "“Accepted” undone", parts_edited: "Breakdown changed", modification_checked: "Change checked", production_started: "Production started", }, noteStatus: { draft: "Draft", planned: "Planned", shipped: "On its way", delivered: "Delivered", cancelled: "Cancelled", }, noteStatusDone: { planned: "Delivery planned.", shipped: "Delivery on its way.", delivered: "Delivery confirmed: the chassis are marked delivered.", cancelled: "Delivery note cancelled.", }, transportModes: { own: "Company vehicle", carrier: "Carrier", pickup: "Customer pick-up", }, modified: "Changed", modifiedHint: "Size, model or options changed after production started: remake / check", modifiedBanner: "{n} chassis changed after production started: remake or check them (“Changed” filter).", sync: "Rebuild", syncHint: "Rebuilds the tracking from the chassis list (quantities, sizes, breakdown)", select: "Quick select:", selectAll: "All", selectFrames: "Frames / chassis", selectSashes: "Sashes + fly screens", selectGlass: "Glass / modules", clear: "Clear", noUnits: "No chassis to track: add chassis to the project.", noneForFilter: "No chassis for this filter.", status: "Status", parts: "Elements (click to select)", part: "Element", pieces: "pieces", deliveredShort: "delivered", reservedOn: "reserved on", history: "History", historyTitle: "History of {ref}", editParts: "Split / edit elements", cancelUnit: "Cancel this chassis", cancelPrompt: "Cancel chassis {ref}? The chassis line quantity goes down by 1. Reason:", selected: "{n} selected", partial: "Partial quantity…", partialTitle: "Partial quantity", action: "Action", undo: "Undo a step…", nothingAvailable: "Nothing in the selection can be delivered (not ready yet, or already on a delivery note).", deliveryNotes: "Project delivery notes", editPartsTitle: "Elements of {ref}", editPartsHint: "Split the chassis the way you deliver it: frame first, sashes later, modules floor by floor… Quantities already made or delivered are kept.", addPart: "Add an element", splitInTwo: "Split into two batches", partProgress: "already made: {made} · delivered: {delivered}", overview: { title: "Project tracking", subtitle: "Every active project: its chassis step by step (made, ready, delivered, installed), its deliveries and what's late.", empty: "No project to track.", chassis: "Chassis", progress: "Progress", deliveries: "Deliveries", next: "Next:", last: "Last:", notTracked: "tracking not started", readyPieces: "{n} element(s) ready to deliver", filters: { ready: "Ready to deliver", late: "Late", modified: "Changed", }, }, toDeliver: { title: "To deliver", subtitle: "Chassis elements ready to deliver (checked / packed), project by project. Tick what leaves: frames only, without glass, some modules…", subtitleMade: "Chassis elements made and not delivered yet, project by project.", empty: "Nothing to deliver right now.", emptyHint: "Elements marked “ready” in a project's tracking show up here.", available: "ready", reserved: "on an open delivery note", notYet: "not ready yet", allAvailable: "Everything available", withoutGlass: "Without glass", state: "State", availableCol: "Available", toShip: "To deliver", selected: "{n} element(s) selected", create: "Create the delivery note", }, notes: { title: "Delivery notes", subtitle: "Delivery planning, transport, signatures and reserves.", new: "New delivery note", newHint: "Choose the project, the elements to deliver and the transport.", search: "No., project, customer, carrier, mark…", empty: "No delivery note here.", views: { upcoming: "Upcoming", today: "Today", late: "Late", delivered: "Delivered", draft: "Drafts", cancelled: "Cancelled", all: "All", }, chassis: "Chassis", transport: "Transport", reserves: "Reserves", saveDraft: "Save draft", plan: "Plan", ship: "Mark as left", deliver: "Confirm delivery", return: "Return / cancel", cancelPrompt: "Reason for cancelling:", returnPrompt: "Goods returned: the elements go back to “to deliver”. Reason:", deleteConfirm: "Delete this draft?", deliveredOn: "Delivered on {date}", receivedBy: "Received by", pickProject: "Choose a project", pickProjectFirst: "Choose the project first.", delivery: "Delivery", date: "Planned date", timeSlot: "Time slot", address: "Site address", addressPh: "Delivery address", siteContact: "Site contact", sitePhone: "Phone", carrier: "Carrier", carrierPh: "Carrier name", vehicle: "Vehicle / plate", driver: "Driver", pickupBy: "Picked up by", driverPhone: "Driver phone", trackingRef: "Carrier ref.", cost: "Transport cost excl. VAT (MAD)", costHint: "When the delivery is confirmed, this cost is added to the project's expenses.", packages: "Packages / racks", weight: "Weight (kg)", lines: "Delivered elements", nothingReady: "No element available for this project (mark them “ready” in the project's tracking).", extraLines: "Supplies delivered", extraHint: "Fixing accessories, screws, sealant, gaskets… delivered with the chassis.", extraPh: "e.g. Fixing brackets", addExtra: "Add a supply", notes: "Remarks (printed on the note)", notesPh: "e.g. Unload at the north facade, bring racks", internalNotes: "Internal notes (not printed)", deliverTitle: "Confirm the delivery", deliveredAt: "Delivered on", reservesPh: "Breakage, scratch, missing… (leave empty if received in good condition)", deliverHint: "The note's elements become “delivered” in the project's tracking.", }, }, notificationEvents: { permissionsChanged: { title: "Your permissions changed", message: "{added} added, {removed} removed", }, quoteAcceptedProd: { title: "Devis {number} accepted", message: "{customer} — the project will reach production", }, orderPlanned: { title: "New work order {number}", message: "{workshop} · {project}", }, orderPlannedWaiting: { title: "New work order {number}", message: "{workshop} · {project} — waiting for upstream workshops", }, orderCreated: { title: "New work order {number}", message: "{workshop} · {title}", }, orderReady: { title: "{number} can start", message: "{workshop}: the upstream workshops have finished.", }, orderDone: { title: "{number} completed", message: "{workshop} · {project}", }, orderClosedShort: { title: "{number} closed with missing stock", message: "{count} article(s): {articles}", }, orderCancelled: { title: "{number} cancelled", message: "{workshop} {reason}", }, orderLate: { title: "{number} is late", message: "{workshop} · due {date}", }, stockLow: { title: "Low stock: {article}", message: "{quantity} {unit} left (minimum {threshold})", }, quoteAccepted: { title: "Devis {number} accepted", message: "{customer} · {amount} excl. VAT", }, quoteRefused: { title: "Devis {number} refused", message: "{customer} · {amount} excl. VAT {reason}", }, quoteExpiring: { title: "Devis {number} expires on {date}", message: "{customer} · follow up", }, paymentReceived: { title: "Payment on {number}", message: "{customer} · {amount}", }, invoicePaid: { title: "Invoice {number} fully paid", message: "{customer} · {amount}", }, invoiceOverdue: { title: "Invoice {number} overdue", message: "{customer} · {amount} due since {date}", }, projectDueSoon: { title: "Project {number}: due in {days} day(s)", message: "{name} · open work orders: {open}", }, projectOverdue: { title: "Project {number} is late", message: "{name} · due {date} · open work orders: {open}", }, }, prod: { active: "Active", inactive: "Inactive", default: "Default", saved: "Saved.", deleted: "Deleted.", duplicate: "Duplicate", model: "Model", family: "Family", series: "Series", finish: "Colour / finish", noFinish: "No colour (raw)", ref: "Mark", width: "Width", height: "Height", quantity: "Quantity", workshop: "Workshop", stock: "Stock", planned: "Planned", late: "Late", waiting: "Waiting", due: "due", dueDate: "Due date", priority: "Priority", pieces: "pieces", cuts: "cuts", bars: "bars", efficiency: "yield", margin: "Margin", pricing: "Pricing", proposedPrice: "Proposed price (excl. VAT)", useProposed: "Use the proposed price", missingPrices: "Articles without a price", pickModel: "Choose a chassis model", pickArticle: "Choose an article", noModels: "No chassis model yet: production must first build the catalogue (Production → Chassis catalogue).", outOfLimits: "Size outside the model's limits", addChassisLine: "Add a chassis", editChassisLine: "Edit the chassis", addToQuote: "Add the line", cost: { materials: "Materials", lacquer: "Lacquering (powder)", labour: "Labour", total: "Cost price", }, errors: { load: "Couldn't load.", save: "Couldn't save.", price: "Couldn't compute the price.", size: "Enter the width and height.", quantity: "The quantity must be at least 1.", description: "Enter a description.", }, kinds: { profile: "Profile", gasket: "Gasket", glass: "Glass", panel: "Panel / sheet", accessory: "Accessory", consumable: "Consumable", model: "Sub-assembly", }, materialTypes: { profile: "Profiles (bars)", powder: "Powder", glass: "Glass", accessory: "Accessories", gasket: "Gaskets", panel: "Sheets, MDF, panels", consumable: "Consumables", other: "Other", }, stockModes: { unit: "Per unit (piece, box, cartridge…)", bar: "In bars", meter: "Per metre", m2: "Per m²", sheet: "In sheets", kg: "Per kg", }, measures: { length: "Length (cut)", area: "Area (W × H)", count: "Count", }, finishModes: { project: "Chassis colour", raw: "Always raw", none: "No colour", }, finishKinds: { raw: "Raw", lacquer: "Lacquered (in-house)", anodized: "Anodised (bought)", wood: "Wood effect", other: "Other (bought)", }, workshopKinds: { laquage: "Lacquering", aluminium: "Aluminium (cutting / assembly)", vitrage: "Glazing", other: "Other (installation, finishing…)", }, paramTypes: { number: "Number", boolean: "Yes / No", choice: "Choice list", product: "Stock article", model: "Other model (glass unit…)", }, pricingModes: { cost_plus: "Cost price × coefficient", per_m2: "Price per m²", per_ml: "Price per linear metre", per_unit: "Unit price", }, priorities: { low: "Low", normal: "Normal", high: "High", urgent: "Urgent", }, orderStatus: { draft: "Draft", planned: "Planned", in_progress: "In progress", done: "Done", cancelled: "Cancelled", }, tech: { title: "Technical data (aluminium joinery)", hint: "So the catalogue can compute cutting lists: what the article is, how it's counted in stock and its useful sizes.", materialType: "Article type", stockMode: "Counted in stock", none: "— Not set —", packUnit: "quantity per unit", barLength: "Bar length", sheetWidth: "Sheet width", sheetHeight: "Sheet height", packSize: "Pack size", weightPerMeter: "Weight per metre", perimeter: "Painted perimeter", paintSurface: "Painted surface per unit", powderPerUnit: "Powder per unit", coverage: "Consumption", thickness: "Thickness", }, workshops: { title: "Workshops", subtitle: "Each workshop's work orders — lacquering, aluminium, glazing… Each manager follows their own queue.", newOrder: "New work order", configure: "Set up the workshops", people: "people", done30: "done (30 d)", noOrders: "No open work order.", blockedHint: "Waiting for an upstream workshop (lacquering, glazing…)", orderTitle: "Title", laqTitlePh: "e.g. Lacquer 40 bars for Company X", customerMaterial: "Bars supplied by the customer (only powder is consumed)", barsToLacquer: "Bars to lacquer", addLine: "Add a line", toProduce: "To produce", itemPh: "Description", materials: "Materials to consume", addMaterial: "Add a material", create: "Create the order", }, order: { pdf: "Work order sheet", start: "Start", startAnyway: "Start anyway?", complete: "Complete", completeTitle: "Complete the work order", started: "Work order started.", booked: "Consumption recorded.", cancelled: "Work order cancelled.", completed: "Work order completed.", cancelReason: "Reason for cancelling:", customerMaterial: "Customer's material", blocked: "This order is waiting for the upstream workshops.", produced: "Produced", consumedCost: "Consumed cost", labour: "Planned time", barsToLacquer: "Bars to lacquer", panes: "Glass units to make", toProduce: "Chassis to build", designation: "Description", done: "Done", outputs: "Lacquering output", raw: "Raw article", lacquered: "Lacquered article (stock)", producedCol: "Produced", rejected: "Rejects", costPrice: "cost price", materials: "Materials", bookAll: "Take out everything left to consume", laqCostHint: "Raw bars and powder consumed here make the cost price of the lacquered bars (not charged to the project here: the aluminium workshop charges the lacquered bars).", materialsHint: "Quantities planned by the catalogue. Enter what really leaves the stock (a negative number = back to stock). On completion, what's left is taken out automatically.", consumed: "Consumed", remaining: "Left", book: "Take out of stock", bookShort: "Take out", negativeReturn: "Negative number = back to stock", extraLine: "outside the bill of materials", extra: "Consumption outside the bill of materials", cuttingList: "Cutting list", length: "Length", position: "Position", offcut: "offcut", keep: "keep", oversize: "{n} piece(s) longer than a bar: plan a joint or longer bars.", glassList: "Glass cutting list", panelList: "Panel cutting list", movements: "Stock movements", unitCost: "Unit cost", by: "By", consumeRemaining: "Take out of stock everything left to consume (planned quantities)", note: "Note", shortages: "Not enough stock for:", needed: "needed", completeAnyway: "Complete using what's available", }, config: { title: "Production set-up", subtitle: "Workshops and managers, lacquer colours and calculation settings.", tabs: { workshops: "Workshops", finishes: "Colours", settings: "Settings", }, workshopsHint: "Each workshop has a manager and a team (who see its work orders). “Feeds” sets the flow: Lacquering → Aluminium, Glazing → Aluminium.", newWorkshop: "New workshop", code: "Code", name: "Name", kind: "Type", hourlyRate: "Hourly cost (MAD/h)", color: "Colour", order: "Order", manager: "Manager", pickPerson: "Choose a person", status: "Status", members: "Team", addMember: "Add a person", feeds: "Feeds", addFeed: "Add a fed workshop", feedsHint: "Orders of fed workshops wait for this one to finish.", description: "Description", noManager: "No manager", deleteWorkshop: "Delete this workshop? (deactivated if it already has orders)", finishesHint: "Colours offered on devis and projects. A “lacquered” colour is produced by the lacquering workshop from raw bars and its powder; the others must be bought.", newFinish: "New colour", finishNamePh: "e.g. White, Anthracite grey", processWorkshop: "Lacquering workshop", autoLaquage: "The first lacquering workshop", powder: "Powder", pickPowder: "Powder article (kg)", noPowder: "No powder article — create one in the inventory", noPowderLinked: "No powder linked", surcharge: "Price surcharge (%)", surchargeShort: "Surcharge", defaultFinish: "Default colour", deleteFinish: "Delete this colour? (deactivated if used)", finishKindHint: { raw: "Raw: the raw article is used as is.", lacquer: "Lacquered in-house: raw bars + powder go through the lacquering workshop, which puts the lacquered bars into stock.", anodized: "Anodised: bought already treated — the article in this colour must be in stock or ordered.", wood: "Wood effect: bought or sub-contracted — the article in this colour must be in stock or ordered.", other: "Bought already treated — the article in this colour must be in stock or ordered.", }, }, settings: { powderMethod: "Powder calculation", methods: { surface: "Painted surface × consumption (kg/m²)", per_unit: "Powder per bar / sheet (article)", manual: "Entered by hand", }, methodHint: { surface: "Painted surface of each article (perimeter × bar length, or the surface entered) × the powder's consumption (kg/m²), + losses.", per_unit: "Each article states its powder per bar / sheet, + losses.", manual: "No estimate: the lacquering manager enters the kg really used.", }, defaultBarLength: "Default bar length", kerf: "Saw blade thickness", trimAllowance: "Bar-end trim", minReusableOffcut: "Reusable offcut from", defaultCoverage: "Default powder consumption", powderWastePercent: "Powder losses", glassWastePercent: "Glass losses", pricingProfileWaste: "Profile offcuts (devis)", defaultCoefficient: "Default selling coefficient", lacquerFromStockFirst: "Use lacquered bars already in stock first (only lacquer what's missing)", consumeOnComplete: "When an order is completed, take what's left out of stock automatically", }, catalog: { title: "Chassis catalogue", subtitle: "Your profile series, your chassis models and their cutting formulas: each model computes its profiles, accessories, gaskets, glass… from W and H.", blankModel: "Blank model", fromLibrary: "From the library", newModelName: "New model", tabs: { models: "Models", series: "Series", library: "Library", }, searchModels: "Name, code…", emptyTitle: "No model", emptyMessage: "Import a standard model from the library (sliding, window, door…) then map your articles.", components: "Components", parameters: "Parameters", unmapped: "without article", unmappedHint: "Components to map to a stock article", deleteModel: "Delete this model? (deactivated if used)", libraryHint: "Standard aluminium joinery models: import them into a series, then map your articles and adjust the formulas to your system.", import: "Import", importTitle: "Import into the catalogue", noSeries: "No series", modelName: "Model name", importHint: "The model's variables (clearances, overlaps, deductions…) are added to the series when missing.", seriesHint: "A series = a profile system (e.g. Sliding 67, Thermal-break casement 50). Its variables are shared by all its models: change a clearance here and every cutting list follows.", newSeries: "New series", supplier: "Supplier / system house", families: "Families", variables: "Variables", variablesHint: "Short name usable in formulas (letters, digits, _), label and value in mm.", deleteSeries: "Delete this series?", }, editor: { general: "General", fromTemplate: "template", unsaved: "Unsaved changes.", unmappedBanner: "{n} component(s) without a stock article: they will be neither priced nor consumed.", defaultWorkshop: "Default workshop", limits: { minL: "Min W (mm)", maxL: "Max W (mm)", minH: "Min H (mm)", maxH: "Max H (mm)", }, variablesHint: "Series variables (read-only here) and this model's own variables (they override the series ones).", parametersHint: "What is chosen on the devis / project line: number of leaves, fly screen, glass unit… Usable in formulas by their key.", addParameter: "Add a parameter", key: "Key", label: "Label", type: "Type", default: "Default", min: "Min", max: "Max", unit: "Unit", fixed: "Fixed", fixedHint: "Not editable on the line", addOption: "Add a choice", materialFilter: "Articles offered", familyFilter: "Models offered", derived: "Intermediate values", derivedHint: "Computed in order and reusable afterwards (e.g. leaf width wv = (L - jl + (n-1)*rc) / n).", addDerived: "Add a value", formula: "Formula", componentsHint: "Everything one chassis consumes. Quantity per chassis; cut length (mm) for profiles and gaskets; width × height (mm) for glass and panels.", toggleAll: "Open / close all", addComponent: "Add a component", insertHint: "Insert into the current formula", qtyShort: "qty", if: "if", untitled: "Untitled", toDefine: "to set", noArticle: "article to set", fromParam: "parameter", up: "Up", down: "Down", role: "Role (key)", measure: "Measure", source: "Source", fixedModel: "Fixed model", stockArticle: "Stock article", subModel: "Sub-model", article: "Article", noArticleFound: "No article — set the article type in the inventory", qty: "Quantity per chassis", length: "Cut length (mm)", widthF: "Width (mm)", heightF: "Height (mm)", angle: "Cut", finish: "Colour", workshop: "Workshop", modelDefault: "Model default", condition: "Condition", always: "Always", waste: "Losses (%)", labour: "Labour", labourHint: "Minutes per chassis and per workshop (formula), valued at the workshop's hourly cost.", addLabour: "Add", minutes: "Minutes (formula)", pricing: "Selling price", pricingMode: "Pricing mode", coefficient: "Coefficient on cost", pricePerM2: "Price per m² (excl. VAT)", pricePerMl: "Price per linear metre (excl. VAT)", pricePerUnit: "Unit price (excl. VAT)", minArea: "Minimum area charged (m²)", minPrice: "Minimum price (excl. VAT)", pricingHint: { cost_plus: "Price = cost price (materials + lacquering + labour) × coefficient, + the colour's surcharge.", per_m2: "Price = area W × H (at least the minimum area) × price per m², + the colour's surcharge. Without a price per m², the coefficient applies.", per_ml: "Price = W in metres × price per linear metre, + the colour's surcharge.", per_unit: "Fixed price per chassis, + the colour's surcharge.", }, test: "Test the model", run: "Compute", saveAndTest: "Save and compute", needs: "Needs (stock units)", lines: "Component detail", size: "Size", values: "Variable values", addVariable: "Add a variable", value: "Value", delivery: "Delivery breakdown", deliveryHint: "How one chassis is tracked and delivered: frame, sashes, glass, modules… Quantity and condition are formulas (e.g. n sashes; glass only when a glass unit is chosen).", deliveryDefault: "No breakdown: each chassis is tracked and delivered as one “Complete chassis” element.", addDeliveryPart: "Add an element", deliveryPartPh: "e.g. Frame, Sashes, Modules", }, project: { tabs: { ouvrages: "Chassis", fabrication: "Manufacturing", suivi: "Tracking", }, defaultFinish: "Project colour", chassis: "chassis", addItem: "Add a chassis", editItem: "Edit the chassis", itemLabel: "Description / note", noItems: "No chassis yet. The chassis of an accepted devis come here; add more after the site survey.", deleteItem: "Remove this chassis from the project?", fabricationHint: "Needs computed from the chassis and the catalogue, workshop by workshop. “Start manufacturing” creates the work orders (lacquering and glazing before aluminium).", launch: "Start manufacturing", replan: "Recompute the orders", replanConfirm: "Replace the work orders not started yet with a new calculation?", planned: "{n} work order(s) created.", orders: "Work orders", shortages: "Stock shortages", shortagesHint: "What must be bought (or lacquered) to produce the project, at current stock.", missing: "Missing", variantToBuy: "colour to buy (not lacquered in-house)", lines: "lines", after: "after", detail: "Detail", sizes: "sizes", fromStock: "from stock", toLacquer: "to lacquer", consumption: "Project consumption", consumptionHint: "Planned (catalogue) and really consumed by the workshops, article by article.", type: "Type", gap: "Gap", cost: "Cost", allDone: "All work orders are completed.", }, }, projects: { title: "Projects", subtitle: "Client jobs: planned budget vs real cost (materials, purchases, hours, expenses), progress and margin.", new: "New project", create: "Create the project", search: "Number, name, place…", fromQuoteHint: "Tip: a project is usually created from an accepted devis (Sales → Devis → Create the project): its revenue is filled in.", name: "Project name", location: "Site / address", startDate: "Start", dueDate: "Deadline", due: "due", manager: "Project manager", team: "Team", pickManager: "Choose a person", pickPerson: "Choose a person", noCustomer: "No customer (internal project)", progress: "Progress", revenue: "Revenue HT", actualCost: "Real cost", margin: "Margin", hours: "Hours", invoiced: "Invoiced", toInvoice: "to invoice", planned: "planned", actual: "Real", difference: "Left", total: "Total", budgetVsActual: "Budget vs real cost", editBudget: "Edit the budget", late: "Late", overBudget: "Over budget", saved: "Project saved.", editDetails: "Edit details (name, dates, manager, team)", statuses: { active: "Active", planned: "Planned", in_progress: "In progress", on_hold: "On hold", completed: "Completed", cancelled: "Cancelled", }, taskStatuses: { todo: "To do", in_progress: "In progress", done: "Done", blocked: "Blocked", }, budget: { title: "Budget", revenue: "Revenue HT", materials: "Materials", labour: "Labour", purchases: "Purchases", other: "Other costs", }, tabs: { tasks: "Tasks", hours: "Hours", materials: "Materials", purchases: "Purchases", expenses: "Expenses", invoices: "Invoices", }, add: { tasks: "Add a task", hours: "Enter hours", materials: "Take from stock", expenses: "Add an expense", purchases: "New purchase order for this project", }, task: { title: "Task", estimatedHours: "Est. hours", assignee: "Assigned to", }, time: { employee: "Employee", hours: "Hours", task: "Task", rate: "Cost / hour", cost: "Cost", costHint: "Cost per hour = the employee's monthly cost to the company (gross + employer CNSS, AMO, training tax) ÷ monthly hours. It's frozen when the hours are entered.", }, materials: { article: "Article", inStock: "in stock", unitCost: "Unit cost HT", unitCostAuto: "auto: supplier price", direction: "Movement", out: "Taken for the project", return: "Returned to stock", taken: "Material taken from stock.", returned: "Material returned to stock.", }, expense: { label: "Expense", placeholder: "Transport, subcontracting, rental…", amount: "Amount HT", }, empty: { tasks: "No task yet.", hours: "No hours entered.", materials: "No material taken from stock.", purchases: "No purchase order linked to this project.", expenses: "No expense.", invoices: "No invoice yet.", }, purchasesHint: "Purchase orders linked to the project (sent or received) count in its cost, HT. Link an order when creating it, or from the purchase order.", forProject: "For project", noProject: "No project", deleteTitle: "Delete this project?", deleteMessage: "Only possible while nothing was recorded on it (hours, materials, purchases, invoices). Otherwise, cancel it.", emptyTitle: "No project here", emptyMessage: "Accept a devis and create its project, or create one here.", planning: { title: "Planning", subtitle: "Every active project and its tasks on a timeline.", range: "Period", weeks: "{n} weeks", today: "Today", unscheduled: "not scheduled", empty: "No active project.", }, errors: { load: "Couldn't load the projects.", save: "Couldn't save.", }, }, sales: { all: "All", number: "Number", date: "Date", customer: "Customer", subject: "Subject", status: "Status", type: "Type", validUntil: "Valid until", dueDate: "Due date", project: "Project", amount: "Amount", method: "Method", reference: "Reference", referencePlaceholder: "Transfer or cheque number", notes: "Notes", paymentTerms: "Payment terms", paymentTermsPlaceholder: "e.g. 30% on order, balance on delivery", pickCustomer: "Choose a customer", noCustomer: "No customer — add one in Sales → Customers", emailTo: "To", emailMessage: "Message", emailDefault: "Leave empty for the standard message", send: "Send", emailSent: "Email sent.", emailSimulated: "Email NOT sent: no email server is configured yet. It was recorded in the outbox — set SMTP in the backend .env to really send.", lines: { title: "Lines", article: "Article", description: "Description", descriptionPlaceholder: "Product, service, work…", quantity: "Qty", unit: "Unit", unitPrice: "Unit price HT", discount: "Disc. %", vat: "VAT", totalHT: "Total HT", pickArticle: "From inventory (optional)", addLine: "Add a line", }, totals: { ht: "Total HT", vat: "VAT", ttc: "Total TTC", }, quoteStatus: { draft: "Draft", sent: "Sent", accepted: "Accepted", refused: "Refused", expired: "Expired", cancelled: "Cancelled", }, invoiceStatus: { draft: "Draft", issued: "Issued", partially_paid: "Partially paid", paid: "Paid", cancelled: "Cancelled", }, invoiceTypes: { invoice: "Invoice", deposit: "Deposit invoice", credit_note: "Credit note", }, customers: { title: "Customers", subtitle: "Your customers' details for devis and invoices (ICE, IF, RC), their contacts and payment terms — and what each one owes.", new: "New customer", search: "Search a customer, ICE, city…", name: "Name", kind: "Type", kinds: { company: "Company", individual: "Individual", }, iceHint: "Required on invoices between companies", paymentDays: "Payment term (days)", paymentDaysShort: "Term", email: "Email", phone: "Phone", address: "Address", city: "City", contacts: "Contacts", contactName: "Name", contactRole: "Role", addContact: "Add a contact", notes: "Notes", invoiced: "Invoiced (TTC)", due: "Owes", overdue: "Overdue", inactive: "Inactive", saved: "Customer saved.", deleted: "Customer deleted.", deactivated: "This customer has devis or invoices: deactivated instead of deleted.", deleteTitle: "Delete this customer?", deleteMessage: "\"{name}\" will be deleted — or deactivated if they already have devis or invoices.", emptyTitle: "No customer yet", emptyMessage: "Add your first customer to write a devis.", }, quotes: { title: "Quotes (devis)", one: "Devis", subtitle: "Numbered devis with VAT per rate, sent as PDF; an accepted devis becomes a project and is invoiced (deposits, then the final invoice).", new: "New devis", edit: "Edit the devis", search: "Number, customer, subject…", validDefault: "Empty: valid 30 days.", emptyTitle: "No devis here", emptyMessage: "Create a devis for a customer.", duplicate: "Duplicate", sendEmail: "Send by email", markSent: "Mark as sent", accept: "Accepted", refuse: "Refused", refuseReason: "Reason (optional)", refusedBecause: "Refused", sentOn: "Sent on", cancel: "Cancel the devis", cancelMessage: "The devis will be cancelled. It stays in the list, marked cancelled.", toProject: "Create the project", createProject: "Create the project", toProjectHint: "The project's revenue will be the devis HT ({amount}). You'll add its budget, tasks and team on the project page.", deposit: "Deposit invoice", depositPercent: "Deposit (% of the devis)", depositAmount: "i.e. {amount} TTC", createDeposit: "Create the deposit invoice", finalInvoice: "Final invoice", deleteTitle: "Delete this draft?", deleteMessage: "The draft devis will be deleted.", }, invoices: { title: "Invoices", subtitle: "Customer invoices, deposit invoices and credit notes. Numbers are given when an invoice is issued, so there are never gaps.", new: "New invoice", newCredit: "New credit note", edit: "Edit the draft", search: "Number, customer, subject…", fromQuoteHint: "Tip: invoices for a devis are made from the devis itself (deposit, then final invoice) — the deposits are then deducted automatically.", filters: { all: "All", unpaid: "To collect", overdue: "Overdue", draft: "Drafts", paid: "Paid", credit_note: "Credit notes", }, emptyTitle: "No invoice here", remaining: "Left to pay", overdue: "Overdue", paid: "Paid", dueDefault: "Empty: set when the invoice is issued, from the customer's payment term.", dueOnIssue: "Set when issued", issue: "Issue the invoice", issueMessage: "The invoice gets its final number and can no longer be changed or deleted (only corrected by a credit note). Check the date: numbers must follow dates.", issued: "Invoice issued.", draftHint: "Draft: no number yet, can still be changed. Issue it to give it its number and send it.", deleteMessage: "The draft will be deleted.", addPayment: "Record a payment", paymentSaved: "Payment recorded.", payments: "Payments", usage: "Used on", applyCredit: "Apply to an invoice", apply: "Apply", applied: "Credit note applied.", applyHint: "{amount} available on this credit note.", pickInvoice: "Choose the invoice", noOpenInvoice: "No unpaid invoice for this customer", sendEmail: "Send by email", makeCredit: "Make a credit note", creditedInvoice: "Corrects invoice", creditNotes: "Credit notes", noIce: "No ICE on the customer's file (required between companies)", depositsDeducted: "Deposits already invoiced (HT)", netHT: "Net HT", netToPay: "Net to pay TTC", depositsList: "Deposits deducted", }, receivables: { title: "Receivables", subtitle: "What your customers owe, by age, the invoices to chase, and the VAT collected.", toCollect: "To collect", overdue: "Overdue", invoicedMonth: "Invoiced this month (TTC)", collectedMonth: "Collected this month", byCustomer: "By customer", nothingDue: "Nothing to collect.", credits: "Credit notes", total: "Total", buckets: { notDue: "Not due", d1_30: "1–30 d late", d31_60: "31–60 d", d61_90: "61–90 d", d90plus: "> 90 d", }, toChase: "Invoices to collect", lateDays: "{days} d late", }, vat: { title: "VAT collected", hint: "By default in Morocco, VAT on sales is due when the customer PAYS (régime des encaissements); companies that opted for the régime des débits declare it on invoices issued. Both are shown.", rate: "Rate", onPayments: "On payments received", onInvoices: "On invoices issued", baseOnPayments: "Base HT (payments)", }, errors: { load: "Couldn't load the data.", save: "Couldn't save.", }, }, leaveBalances: { title: "Leave balances", subtitle: "Paid leave per employee, calculated from the labour code.", rules: "Labour code: 1.5 working days per month of service (2 under 18), +1.5 days per 5 full years of service, 30 days a year at most (art. 231–232). Leave counts working days only: weekly rest days and closed public holidays aren't deducted.", extraDays: "Extra days per year (company policy)", policySaved: "Leave policy saved.", saved: "Opening balance saved.", emptyTitle: "No active employee.", columns: { employee: "Employee", hired: "Hired", perYear: "Days / year", opening: "Opening balance", accrued: "Accrued", taken: "Taken", thisYear: "This year", remaining: "Balance", }, years: "{n} yr", bonusHint: "Includes {n} seniority day(s)", minor: "under 18", carryOverHint: "More than 2 years of leave accumulated: carrying leave over requires an agreement (art. 240).", missingHireDate: "No hire date on the employee's file: nothing can be calculated.", editOpening: "Opening balance", openingHint: "Days the employee still had on a given date, from your previous system or paper records. Leave accrues from that date; leave taken before it is not deducted again.", openingDays: "Days remaining", openingDate: "On (date)", note: "Note", clearOpening: "Remove", errors: { load: "Couldn't load the leave balances.", save: "Couldn't save.", }, }, declarations: { title: "Payroll declarations", subtitle: "CNSS (Damancom), salary bank transfer and income tax (Simpl-IR), prepared from your payroll.", payroll: "Payroll", year: "Year", noRun: "Choose a payroll", draft: "draft", noRunTitle: "No payroll yet", noRunMessage: "Generate a payroll first (HR → Payroll).", noProblem: "Everything checks out.", problemsTitle: "{count} problem(s) to fix before generating the file", warningsTitle: "To check", tabs: { cnss: "CNSS — Damancom", bank: "Bank transfer", irMonthly: "IR — monthly payment", irAnnual: "IR — annual declaration", }, cnss: { step1: "On Damancom, download the préétabli of the month (the list of your insured employees prepared by CNSS).", step2: "Load it here: each employee is matched with the payroll, and new employees are added.", step3: "Fix what's flagged, generate the file, then upload it on Damancom (Échange de fichiers) and validate.", choose: "Choose the préétabli", noFile: "No file chosen", check: "Check", employees: "Employees", days: "Days declared", gross: "Gross salary", capped: "Capped salary", daysShort: "Days", insuredTitle: "Insured employees (from the préétabli)", entrantsTitle: "New employees (not in the préétabli)", name: "Name", cnssNumber: "CNSS no.", situation: "Situation", situationNone: "— none —", paid: "Paid this month", generate: "Generate the Damancom file", formatNote: "The file follows the CNSS BDS exchange format (fixed-width lines, amounts in centimes). Before your first real declaration, upload it on Damancom and check the control report — or have your accountant compare it once.", }, bank: { count: "Transfers", total: "Total", debited: "Account debited", beneficiary: "Beneficiary", bank: "Bank", amount: "Amount", executionDate: "Execution date", otherPayments: "{count} employee(s) paid in cash or by cheque ({amount} MAD) — listed in the Excel file, not in the transfers.", note: "Every RIB is checked (24 digits and control key) before the file is generated. Import the Excel or CSV file in your bank's corporate portal (mass transfer / virement de masse); on the first import, match the columns once.", }, ir: { toPay: "IR withheld to pay", deadline: "Deadline", taxed: "Employees taxed", taxable: "Net taxable total", taxableShort: "Net taxable", draftWarning: "This payroll is still a draft: the amounts can still change.", howTo: "Pay this amount on Simpl-IR (DGI) before the deadline: IR withheld on a month's salaries is paid before the end of the following month.", }, annual: { grossTaxable: "Gross taxable", netTaxable: "Net taxable", ir: "IR withheld", months: "Months", deductions: "Deductions", xml: "XML file (Simpl-IR)", note: "Annual declaration of salaries (état 9421), to file on Simpl-IR before 1 March. Built from the year's COMPLETED payrolls. Before the first filing, upload the XML on Simpl-IR and check it's accepted — or have your accountant review the Excel version.", }, errors: { load: "Couldn't load the data.", generic: "Couldn't generate the file.", }, }, platform: { rename: "Rename the client", title: "Clients", subtitle: "Every client of the platform, with its companies and accounts. You see counts only — never a client's HR or purchasing data.", new: "New client", create: "Create the client", details: "Details", created: "Client \"{name}\" created. Its admin can log in now with {email} and the password you set.", firstAdmin: "First admin account", firstAdminHint: "The client's administrator: creates the companies, departments, employees and accounts. Give them the password over a secure channel; they can change it in their profile.", fields: { name: "Client name", namePlaceholder: "e.g. Atlas Group", notes: "Notes (internal)", firstName: "First name", lastName: "Last name", email: "Email", password: "Temporary password", passwordHint: "At least 8 characters.", }, columns: { client: "Client", companies: "Companies", accounts: "Accounts", employees: "Employees", status: "Status", created: "Created", }, status: { active: "Active", suspended: "Suspended", }, suspend: "Suspend", reactivate: "Reactivate", suspendTitle: "Suspend this client?", suspendMessage: "Every account of \"{name}\" will be logged out and blocked, including open sessions. Nothing is deleted; you can reactivate it at any time.", reactivateTitle: "Reactivate this client?", reactivateMessage: "The accounts of \"{name}\" will be able to log in again.", suspendedNotice: "\"{name}\" is suspended.", reactivatedNotice: "\"{name}\" is active again.", admins: "Admin accounts", addAdmin: "Add an admin", noAdmins: "No admin account.", adminAdded: "Admin account {email} created.", roles: { admin: "Admin", owner: "Owner", }, privacyNote: "Client isolation: this page only shows accounts that administer the client. Its employees, payroll, documents and purchasing stay visible to the client only.", emptyTitle: "No client yet", emptyMessage: "Create the first client and its admin account.", orphans: { title: "Records not attached to any client", hint: "Created before client isolation and not attached automatically. Until attached, nobody can see them. Choose the client they belong to.", companies: "Companies", users: "Accounts", chooseClient: "Choose a client", assign: "Attach to this client", done: "{companies} company(ies) and {users} account(s) attached.", }, errors: { load: "Couldn't load the clients.", save: "Couldn't save this change.", }, }, files: { open: "Open the file", openFailed: "Couldn't open the file", }, login: { useBackupCode: "Use a backup code instead", useAuthenticator: "Use authenticator code instead", invalidCode: "Invalid code", verifying: "Verifying...", verify: "Verify", backupCodeHint: "Enter one of your backup codes.", authenticatorHint: "Enter the 6-digit code from your authenticator app.", failed: "Login failed", signingIn: "Signing in...", signIn: "Sign in", password: "Password", email: "Email", }, purchasing: { supplierPayment: { done: "Payment of {amount} recorded on {count} invoice(s) — reference {ref}.", confirm: "Record the payment", total: "Payment total", title: "Payment to {supplier}", settle: "Settle the selection", selection: "{count} invoice(s) selected — {amount} left to pay", pickSupplierHint: "Choose a supplier above to settle several of its invoices with one payment.", }, invoiceVat: { oldestFirst: "Oldest invoices first (automatic)", settlesInvoice: "Invoice settled", hintCredit: "Copy the amounts of the supplier's credit note, rate by rate.", hintInvoice: "Copy the HT and VAT per rate exactly as printed on the supplier's invoice. Expected from receptions: {amount}.", estimated: "VAT estimated (no breakdown entered)", addRate: "Add a VAT rate", vatAmount: "VAT", }, missingInvoice: { badge: "No invoice", banner: "Goods received ({amount}) but no supplier invoice recorded: add it to schedule the payment and deduct the VAT.", }, dueDate: { supplierFieldHint: "Empty: invoices will use the legal default of 60 days, and you'll be warned.", savedNoTerms: "(legal default of 60 days: the supplier has no payment term recorded)", savedNotice: "Invoice {number} recorded — due on {date}.", manual: "Due date entered manually.", noSupplierTerms: "No payment term recorded for {supplier}: due date set to the legal default of 60 days (Loi 69-21). Add it in Suppliers so it's exact next time.", fromSupplier: "Due date calculated: {days} days, per {supplier}'s payment terms.", }, supplierDocs: { types: { other: "Other", patente: "Business tax (patente)", rib: "Bank details (RIB)", cnss: "CNSS certificate", rc: "Trade register (RC)", attestation_fiscale: "Tax compliance certificate", }, state: { ok: "Valid", expiring: "Expires soon", expired: "Expired", }, alertHint: "The purchasing team is alerted 30 days before a document expires.", deleteConfirm: "Delete this document?", noExpiry: "No expiry", expiryDate: "Expiry date", issueDate: "Issue date", number: "Number", label: "Name", type: "Type", add: "Add a document", empty: "No documents yet.", title: "Supplier documents", }, statement: { types: { payment: "Payment", credit_note: "Credit note", invoice: "Invoice", }, balance: "Balance", credit: "Credit", debit: "Debit", reference: "Reference", operation: "Operation", empty: "No movement in this period.", closing: "Balance owed", settled: "Paid / credited", invoiced: "Invoiced", opening: "Opening balance", title: "Supplier statement", }, restock: { suggested: "To order", requested: "Requested", incoming: "On order", minimum: "Minimum", stock: "In stock", createOrder: "Create the purchase order", noSupplier: "No supplier price recorded", empty: "Nothing to restock: every article is above its minimum or already on order.", subtitle: "Articles at or below their minimum, after what's already on order — grouped by the cheapest supplier.", title: "Restocking", }, reports: { withoutInvoiceReason: { overpaid: "paid beyond what was invoiced", no_invoice: "no invoice recorded", }, agedHint: "Based on supplier invoices and their due dates — orders without an invoice aren't counted yet.", withoutInvoiceHint: "VAT is deducted on a supplier INVOICE. Add the invoice on the order (Invoices → Add an invoice) and the payment will appear in the listing.", withoutInvoiceTitle: "{count} payment(s) not in this listing", aged: { total: "Total owed", d90plus: "> 90 d", d61_90: "61–90 d", d31_60: "31–60 d", d1_30: "1–30 d", notDue: "Not due", }, agedEmpty: "Nothing owed to suppliers.", agedTitle: "Aged supplier balance", accounts: { a5161: "Cash", a5141: "Bank", a4411: "Suppliers", a34552: "VAT recoverable", a6111: "Purchases", }, accountingHint: "Supplier invoices, credit notes and payments of the period as journal entries, on the Moroccan chart of accounts:", accountingTitle: "Accounting export (journal)", paymentDate: "Payment date", missingIds: "IF / ICE missing", supplierIds: "Supplier IF / ICE", vatEmpty: "No supplier payment in this period.", vatDeductible: "Deductible VAT", vatHint: "Invoices PAID in the period (VAT is deducted on payment), with the supplier's IF and ICE — to attach to the VAT return.", vatTitle: "VAT deduction listing", downloadXlsx: "Download Excel", subtitle: "Files for your accountant and your VAT return.", title: "Purchasing reports", }, compare: { hint: "Cheapest per line in green. Choosing a supplier creates the purchase order and closes the other quotes.", choose: "Choose", incomplete: "Incomplete", title: "Quote comparison", button: "Compare", created: "{count} price requests created (one per supplier). Use \"Compare\" once they've answered.", multiHint: "One price request per supplier ({count}) will be created — you'll be able to compare their answers.", addSupplier: "Add a supplier", suppliers: "Suppliers", }, email: { simulatedShort: "not sent (no SMTP)", simulated: "Email NOT sent: no email server is configured yet. It was recorded in the outbox — configure SMTP in the backend .env to send for real.", sent: "Email sent to {to}.", defaultMessageHint: "Leave empty to use the standard message", message: "Message", cc: "CC", to: "To", titleDp: "Send {number} to the supplier", title: "Send {number} to the supplier", send: "Send by email", }, approval: { approvedOn: "Approved on {date}", refusedBanner: "Approval refused: {reason}", waitingForApprover: "An admin, the owner or the purchasing manager must approve it.", pendingBanner: "Awaiting approval since {date}.", approvedNotice: "Order approved — it can now be sent to the supplier.", requested: "This order is above the approval threshold: it was sent for approval. Approvers have been notified.", refuseReason: "Reason for refusing", refuseTitle: "Refuse", refuse: "Refuse", approve: "Approve", }, supplierInvoices: { title: "Supplier invoices", subtitle: "Every supplier invoice by due date — what's left to pay and what's overdue.", overdue: "Overdue", overdueCount: "{count} invoice(s)", dueIn30: "Due within 30 days", empty: "No invoices here.", filters: { unpaid: "To pay", overdue: "Overdue", all: "All" } }, legal: { needs_agreementHint: "Payment term over 60 days: allowed only with a written agreement (Loi 69-21).", over_maxHint: "Payment term over 120 days: beyond the legal maximum (Loi 69-21)." }, invoiceStatus: { overdue: "Overdue by {days} d" }, invoices: { type: "Type", types: { invoice: "Invoice", credit_note: "Credit note" }, applied: "Deducted" }, match: { notInvoiced: "Not invoiced yet", matched: "Matches what was received", toInvoice: "{amount} still to invoice", overInvoiced: "{amount} invoiced too much", creditExpected: "A credit note of {amount} is expected from the supplier for the returned goods.", overInvoicedHint: "The supplier invoiced {amount} more than what was received and kept — check the invoice before paying." }, kpi: { ordered: "Ordered", received: "Received", ofOrder: "of the order", invoiced: "Invoiced (net)", paid: "Paid", settled: "Fully paid" }, pdf: { download: "Download PDF" }, supplierSelect: { choose: "Choose a supplier", none: "No supplier yet — add one in Purchasing > Suppliers", notInList: "not in the supplier list" }, supplierPrices: { open: "Supplier prices & references", internalReference: "Internal reference", internalReferencePlaceholder: "e.g. RM-GLOVES-01", referenceLocked: "Only production can change an existing internal reference.", referenceMissing: "This article has no internal reference yet — you can add one.", supplierReference: "Supplier's reference", none: "No supplier price yet.", addSupplier: "Add a supplier", noReference: "No reference" }, addToInventory: { button: "Add to inventory", title: "Add this article to the inventory", category: "Category", referenceOptional: "Optional — can be added later", threshold: "Minimum stock (alert)", stockNow: "{count} already received will be put into stock now.", stockLater: "Future receptions of this line will go into stock.", confirm: "Add to inventory" }, errors: { load: "Could not load the data.", save: "Could not save this change." }, columns: { number: "Number", date: "Date", supplier: "Supplier", status: "Status", payment: "Payment", paid: "Paid", received: "Received", note: "Note", article: "Article", quantity: "Quantity", requestedBy: "Requested by" }, filters: { missingInvoice: "Received, not invoiced", late: "Late deliveries", all: "All", number: "Order number" }, lines: { closed: "Closed", complete: "Complete", closedBecause: "Closed", receivedShort: "received", returnedShort: "returned", expectedShort: "still expected", close: "Close line", closeHint: "Accept what was received as final — nothing more will be expected on this line", reopen: "Reopen", closeTitle: "Close this line", closeSummary: "{received} received out of {ordered} ordered — the {missing} missing will no longer be expected.", closeReason: "Reason (optional)", closeReasonPlaceholder: "e.g. remainder cancelled with the supplier", closeEffect: "Once every line is received or closed, the order is marked received and its purchase requests are closed. You can reopen the line later.", priceFromArticle: "Price taken from the article's supplier price (inventory) — you can still change it", noPriceShort: "No price", pickSupplierForPrices: "Choose the supplier: article prices will be filled in from the inventory.", missingPrices: "{count} article(s) have no price for {supplier} in the inventory — enter it on the line.", article: "Article", pickArticle: "Inventory article (optional)", description: "Description", descriptionPlaceholder: "Article or service", quantity: "Qty", unit: "Unit", unitPrice: "Unit price (HT)", quotedPrice: "Quoted price (HT)", vat: "VAT", addLine: "Add a line" }, totals: { ht: "Total excl. VAT", vat: "VAT", ttc: "Total incl. VAT" }, orderStatus: { pending_approval: "Awaiting approval", draft: "Draft", sent: "Ordered", partially_received: "Partially received", received: "Received", cancelled: "Cancelled" }, paymentStatus: { unpaid: "Unpaid", partially_paid: "Partly paid", paid: "Paid" }, requestStatus: { pending: "Pending", delayed: "Delayed", ordered: "Ordered", declined: "Declined", received: "Received" }, priceStatus: { draft: "Draft", sent: "Sent", answered: "Answered", accepted: "Accepted", rejected: "Rejected" }, paymentMethods: { virement: "Bank transfer", cheque: "Cheque", especes: "Cash", effet: "Bill of exchange (effet)", carte: "Card", autre: "Other" }, summary: { missingInvoice: "Received, not invoiced", totalOrdered: "Total ordered (incl. VAT)", totalPaid: "Total paid", remaining: "Left to pay", overdue: "Orders with overdue invoices", byStatus: "Orders by status" }, requests: { title: "Purchase requests", subtitle: "Requests from production. Answer each one, or select several to create one purchase order.", createOrder: "Create a purchase order ({count})", empty: "No purchase requests here.", select: "Select", stock: "Stock", threshold: "threshold", productionNote: "Production's note", purchasingAnswer: "Purchasing's answer", filters: { open: "To handle", ordered: "Ordered", declined: "Declined", received: "Received", all: "All" }, actions: { ordered: "Mark as ordered", delayed: "Delay (with a reason)", declined: "Decline (with a reason)", note: "Add a note for production" }, dialog: { linkOrder: "Link to an existing purchase order (optional)", noOrder: "— No link (ordered another way) —", notifyHint: "Production is notified of your answer.", orderedTitle: "Mark as ordered", orderedLabel: "Note (optional)", orderedPlaceholder: "e.g. expected delivery on Monday", delayedTitle: "Delay the request", delayedLabel: "Why is it delayed?", delayedPlaceholder: "e.g. supplier out of stock until the 15th", declinedTitle: "Decline the request", declinedLabel: "Reason for declining", declinedPlaceholder: "e.g. article discontinued, use the new reference", noteTitle: "Note for production", noteLabel: "Note", notePlaceholder: "e.g. waiting for the supplier's quote" } }, orders: { title: "Purchase orders", subtitle: "Orders, receptions, invoices and payments — the recap of purchases.", new: "New purchase order", empty: "No purchase orders.", form: { editTitle: "Edit purchase order", supplierRequired: "Choose a supplier.", pickSupplier: "Choose a supplier", noSuppliers: "No active supplier yet — add one in Suppliers.", expectedDate: "Expected delivery", fromRequests: "Created from {count} purchase request(s): saving links them and notifies production.", saveDraft: "Save as draft", saveAndSend: "Save & mark as ordered", noCompany: "Open this page from the purchase orders list." } }, detail: { paymentWithoutInvoice: "Paid, but no supplier invoice is recorded yet: add it (Invoices above) so this payment counts in the TVA deduction listing and the aged balance.", lines: "Lines", addCreditNote: "Add a credit note", creditNoteNumber: "Credit note number", dueDateAuto: "Leave empty: invoice date + {days} days (supplier's payment terms)", expectedFromReceptions: "Expected from what was received: {amount}", markSent: "Mark as ordered", cancelOrder: "Cancel order", deleteConfirm: "Delete this draft?", cancelledBecause: "Cancelled", cancelReason: "Reason for cancelling", cancelRequestsHint: "The purchase requests on this order go back to the purchasing queue.", ordered: "Ordered", received: "Received", returned: "Returned", outstanding: "Still expected", kept: "Received and kept", noStock: "no stock (free line)", receptions: "Receptions & returns", receive: "Receive goods", returnGoods: "Return to supplier", sendFirst: "Mark the order as ordered before receiving goods.", receptionTitle: "Receive goods", returnTitle: "Return goods to the supplier", blNumber: "Delivery note (BL) number", returnReference: "Return reference", scan: "Scan (optional)", file: "File", stockInHint: "Received quantities are added to the inventory.", stockOutHint: "Returned quantities are removed from the inventory.", noReceptions: "Nothing received yet.", type: { reception: "Reception", return: "Return" }, invoices: "Invoices", addInvoice: "Add an invoice", invoiceNumber: "Invoice number", dueDate: "Due date", amountTTC: "Amount (incl. VAT)", noInvoices: "No invoices yet.", deleteInvoiceConfirm: "Delete this invoice?", payments: "Payments", addPayment: "Record a payment", amount: "Amount", method: "Payment method", paymentReference: "Reference", paymentReferencePlaceholder: "Cheque / transfer number", noPayments: "No payments yet.", deletePaymentConfirm: "Delete this payment?", linkedRequests: "Purchase requests on this order" }, priceRequests: { noPricesHint: "List what you want a price for — the supplier fills in the prices in their answer. A line can be an inventory article, or just typed in for an article you don't stock yet.", enterPricesHint: "Enter the prices from the supplier's answer, then create the purchase order — or reject it.", title: "Price requests", subtitle: "Ask suppliers for quotes, record their prices, and turn the best one into a purchase order.", new: "New price request", empty: "No price requests.", deadline: "Answer expected by", quote: "Supplier's quote", uploadQuote: "Attach the quote", markSent: "Mark as sent", markAnswered: "Mark as answered", reject: "Reject", convert: "Create the purchase order", deleteConfirm: "Delete this price request?" }, suppliers: { title: "Suppliers", subtitle: "Your suppliers and their details.", new: "New supplier", empty: "No suppliers.", search: "Search", searchPlaceholder: "Name, contact, city, ICE…", active: "Active", inactive: "Inactive", deleteConfirm: "Delete \"{name}\"?", deactivated: "This supplier has orders, so it was deactivated instead of deleted.", fields: { paymentDays: "Payment term (days)", name: "Name", contactName: "Contact", phone: "Phone", email: "Email", city: "City", address: "Address", ice: "ICE", identifiantFiscal: "Tax ID (IF)", rc: "Trade register (RC)", paymentTerms: "Payment terms" } }, history: { title: "Article history", subtitle: "Every purchase order and request for an inventory article.", pickHint: "Choose an article to see its purchase history.", inStock: "In stock", orders: "Orders", totalOrdered: "Total ordered", totalReceived: "Total received", averagePrice: "Average price", lastPrice: "Last price", noOrders: "This article isn't on any purchase order yet.", noRequests: "No purchase requests for this article.", openForArticle: "Purchase history" } }, holidays: { title: "Public holidays", subtitle: "The year's jours fériés: whether the company works, and how hours worked are paid.", downloadTemplate: "Download template", import: "Import Excel", add: "Add a holiday", year: "Year", howItWorks: "Each year: download the template (fixed-date holidays are already filled in), add the religious holidays with their official dates, then import it. Closed holiday: nobody is expected, and anyone who clocks in has their hours recorded as holiday hours. Pay \"double\" adds one extra hourly rate per hour worked; \"normal\" adds nothing.", importDone: "Import complete: {created} added, {updated} updated.", namePlaceholder: "Holiday name (e.g. Aïd al-Fitr)", previewTitle: "Preview of {file}", previewErrors: "{count} row(s) to fix — correct the file and import it again", previewReady: "{count} row(s) ready to import", columns: { row: "Row", date: "Date", name: "Name", open: "Company", pay: "Pay if worked", check: "Check" }, defaultClosed: "Closed (default)", defaultDouble: "Double (default)", open: "Open", closed: "Closed", payDouble: "Double", payNormal: "Normal", confirmImport: "Import", emptyTitle: "No public holidays for {year} yet", emptyMessage: "Download the template, complete it, and import it.", deleteTitle: "Delete public holiday", deleteMessage: "Delete \"{name}\"? Attendance already recorded for that day is kept.", errors: { load: "Could not load the public holidays.", save: "Could not save this change.", template: "Could not download the template.", read: "Could not read this file.", import: "The import failed." } }, myDepartment: { adminTitle: "Department access", adminSubtitle: "Every department you oversee: its manager, which job titles get the department's module, and who has access.", adminEmptyTitle: "No departments yet.", noManagerAssigned: "No manager assigned", title: "My department", subtitle: "Your team, and which job titles get access to the department's module.", loadError: "Could not load your department.", saveError: "Could not save this change.", saved: "Saved.", accountsUpdated: "Saved — {count} account(s) updated.", emptyTitle: "You don't manage a department yet.", positionsTitle: "Job titles & access", positionsHint: "Switch on a job title to give everyone holding it access to this department's module. Everyone else sees My Space only.", noModule: "This department doesn't unlock a module, so there's no access to distribute.", noPositions: "No job positions defined for this department yet.", holders: "{count} employee(s)", toggleLabel: "Grants module access", teamTitle: "Team", noEmployees: "No employees in this department.", columns: { name: "Name", jobTitle: "Job title", access: "Access" }, noLogin: "No login", moduleAccess: "Module access", mySpaceOnly: "My Space only" },
    // ====================================================
    // SIDEBAR
    // ====================================================
    powered: "⬡ SANITY powered by: ",
    sidebar: { logistics: "Logistics", toDeliver: "To deliver", deliveryNotes: "Delivery notes", tracking: "Project tracking", workshops: "Workshops", chassisCatalog: "Chassis catalogue", productionConfig: "Production set-up", sales: "Sales", quotes: "Quotes (devis)", salesInvoices: "Invoices", receivables: "Receivables", customers: "Customers", projects: "Projects", planning: "Planning", declarations: "Declarations", leaveBalances: "Leave balances", platform: "Platform", clients: "Clients", purchasingReports: "Purchasing reports", restock: "Restocking", supplierInvoices: "Supplier invoices", purchasing: "Purchasing", purchaseRequestsQueue: "Purchase requests", purchaseOrders: "Purchase orders", priceRequests: "Price requests", suppliers: "Suppliers", purchasingInventory: "Inventory", articleHistory: "Article history", holidays: "Public holidays", departmentAccess: "Department access", myDepartment: "My department", myRecords: "My records",
      leaveCalendar: "Leave Calendar",
      performanceReviews: "Performance Reviews",
      disciplinaryActions: "Disciplinary Actions",
      admin: "Admin",
      settings: "Settings",
      help: "Help & Support",
      profile: "Profile",
      hr : "Human Resources",
      companies: "Companies",
      organization: "Organization",
      company: "Company",
      employees: "Employees",
      payroll: "Payroll",
      contracts: "Contracts",
      employeeDocuments: "Documents",
      attendance: "Attendance",
      orgChart: "Org Chart",
      reports: "Reports",
      auditLog: "Audit Log",
      mySpace: "My Space",
      myProfile: "My Profile",
      myPayslips: "My Payslips",
      myAbsences: "My Absences",
      myAdvances: "My Advances",
      myAttendance: "My Attendance",
      salaries: "Salaries",
      absences: "Absences",
      advances: "Advances",
      users: "Users",
      workSchedule: "Work Schedule",
      production: "Production",
      inventory: "Inventory",
      purchaseRequests: "Purchase Requests",
      inventorySettings: "Settings",
      departments: "Departments",
      jobPositions: "Job Positions",
      rolesPermissions: "Roles & Permissions",
      locations: "Locations",
      documents: "Documents",
      preferences: "Preferences",
      integrations: "Integrations",

      dark: "Dark",
      light: "Light",

      logout: "Logout",

      closeSidebar: "Close sidebar",
      openSidebar: "Open sidebar",

      switchTheme: "Switch to {theme} mode",

      dashboard: "Dashboard",
    },

    // ====================================================
    // COMMON
    // ====================================================

    common: { yes: "Yes", no: "No", home: "Home", breadcrumb: "Breadcrumb", clear: "Clear", clearSearch: "Clear search", nextPage: "Next page", previousPage: "Previous page", pagination: "Pagination", hidePassword: "Hide password", showPassword: "Show password", somethingWentWrong: "Something went wrong", confirmAction: "Confirm action", pageNotFoundHint: "This page doesn't exist or has moved.", pageNotFound: "Page not found", status: "Status", save: "Save", back: "Back",
      welcome: "Welcome",
      goodbye: "Goodbye",

      loading: "Loading...",

      error: "Error",
      fail: "Fail",
      success: "Success",

      update: "Update",
      cancel: "Cancel",
      delete: "Delete",
      confirm: "Confirm",
      close: "Close",
      edit: "Edit",
      reset: "Reset",
      create: "Create",
      noResults: "No results found",
      chooseFile: "Choose file",
      noFileChosen: "No file chosen",
      dateFrom: "From",
      dateTo: "To",
    },

    // ====================================================
    // PROFILE
    // ====================================================

    profile: { loadFailed: "Failed to load the profile",
      settings: "Settings",

      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      password: "Password",

      currentPassword: "Current Password",
      newPassword: "New Password",

      updateSureMessage:
        "Are you sure you want to update your profile?",

      updateFailMessage:
        "We couldn't update your profile. Please try again.",

      updateSuccessMessage:
        "Your profile has been updated successfully.",

      bothPasswords:
        "Both current password and new password are required.",

      info: "Information",
    },

    // ====================================================
    // COMPANY
    // ====================================================

    company: { workflow: { accountInvalid: "An accounting account is 4 to 10 digits.", purchaseAccountHint: "Used in the accounting export for articles whose category has no account of its own, and for typed-in lines (e.g. 6111, 6121, 6125).", purchaseAccount: "Default purchase account", purchaseThresholdHint: "Purchase orders at or above this amount (incl. VAT) must be approved by an admin, the owner or the purchasing manager before being ordered. 0 = no approval.", purchaseThreshold: "Purchase order approval threshold", title: "Approval workflow", sequentialApproval: "Require manager approval before HR", sequentialApprovalHint: "When on, absence and advance requests must be approved by the employee's manager first, then receive final approval from HR. Employees without a manager go straight to HR.", saveFailed: "Could not save this setting." },
      title: "Company",

      subtitle:
        "Manage your company information",

      emptySubtitle:
        "No company set up yet",

      emptyTitle:
        "No company yet",

      emptyMessage:
        "Set up your company profile to get started.",

      create:
        "Create company",

      editTitle:
        "Edit company",

      name:
        "Company name",

      tradeName:
        "Trade name",

      legalForm:
        "Legal form",

      industry:
        "Industry",

      ice:
        "ICE",

      taxId:
        "Tax ID",

      registrationNumber:
        "Registration number",

      email:
        "Email",

      phone:
        "Phone",

      website:
        "Website",

      street:
        "Street",

      city:
        "City",

      postalCode:
        "Postal code",

      logo:
        "Company logo",

      employeeCount:
        "Employees",

      // ==================================================
      // SECTIONS
      // ==================================================

      section: {
        identity:
          "Identity",

        legal:
          "Legal information",

        contact:
          "Contact",
      },

      // ==================================================
      // CREATE
      // ==================================================

      createTitle:
        "Create company",

      createSureMessage:
        "Are you sure you want to create this company?",

      createSuccessTitle:
        "Company created",

      createSuccessMessage:
        "The company was created successfully.",

      createFailTitle:
        "Creation failed",

      // ==================================================
      // UPDATE
      // ==================================================

      updateSureMessage:
        "Are you sure you want to save these changes?",

      updateSuccessMessage:
        "The company was updated successfully.",

      // ==================================================
      // GENERAL SAVE / LOAD ERRORS
      // ==================================================

      saveFailMessage:
        "Something went wrong while saving the company.",

      loadFailTitle:
        "Loading failed",

      loadFailMessage:
        "Could not load company information.",

      // ==================================================
      // DELETE
      // ==================================================

      downloadFiche:
        "Download fact sheet",

      deleteCompany:
        "Delete company",

      deleteTitle:
        "Delete company",

      deleteSureMessage:
        "Are you sure you want to delete this company? This action cannot be undone.",

      deleteSuccessTitle:
        "Company deleted",

      deleteSuccessMessage:
        "The company was deleted successfully.",

      deleteFailTitle:
        "Deletion failed",

      deleteFailMessage:
        "Something went wrong while deleting the company.",

      // ==================================================
      // BACKEND ERROR MESSAGES
      // ==================================================

      errors: {
        deleteAdminOnly:
          "Only administrators or the company owner can delete this company.",

        notFound:
          "Company not found.",

        deleteNotAuthorized:
          "You are not authorized to delete this company.",

        updateNotAuthorized:
          "You are not authorized to update this company.",

        viewNotAuthorized:
          "You are not authorized to view this company.",

        ficheDownloadFailed:
          "Error generating the company fact sheet.",

        duplicateCompany:
          "A company with this ICE, tax ID, registration number, or CNSS number already exists.",

        createFailed:
          "Error creating company.",

        updateFailed:
          "Error updating company.",

        deleteFailed:
          "Error deleting company.",

        logoNotFound:
          "Company logo not found.",

        logoRequired:
          "Please select a logo.",

        logoUploadFailed:
          "Error uploading company logo.",

        logoDeleteFailed:
          "Error deleting company logo.",
      },
    },

    // ====================================================
    // USERS
    // ====================================================

    users: {
      editUser: "Edit User",
      editSubtitle: "Update this user's account information.",
      inheritedFromEmployee: "Department and HR role are inherited from the linked employee {name} ({department} — {jobTitle}). To change them, update the employee's Department or Job Title instead.",

      updateTitle: "Update User",
      updateSureMessage: "Are you sure you want to save these changes?",

      updateSuccessTitle: "User Updated",
      updateSuccessMessage: "The user has been updated successfully.",

      updateFailTitle: "Update Failed",
      updateFailMessage: "We couldn't update the user. Please try again.",

      hrRole: {
        label: "HR Job Title",
        notApplicable: "Not applicable (not HR)",
        assistant: "Assistant(e) RH",
        officer: "Chargé(e) RH",
        manager: "Responsable RH",
        director: "Directeur/Directrice RH",
      },
      department: "Department",
      departments: {
        management: "Management",
        hr: "Human Resources",
        finance: "Finance",
        accounting: "Accounting",
        sales: "Sales",
        purchasing: "Purchasing",
        marketing: "Marketing",
        production: "Production",
        production_planning: "Production Planning",
        quality_control: "Quality Control",
        maintenance: "Maintenance",
        warehouse: "Warehouse",
        logistics: "Logistics",
        procurement: "Procurement",
        engineering: "Engineering",
        design: "Design",
        research_development: "Research & Development",
        it: "IT",
        customer_service: "Customer Service",
        administration: "Administration",
        health_safety_environment: "Health, Safety & Environment",
        security: "Security",
      },
      title:
        "Users",

      subtitle:
        "Manage user accounts and access.",

      addUser:
        "Add User",

      newUser:
        "New User",

      createSubtitle:
        "Create a new user account.",

      information:
        "User Information",

      role:
        "Role",

      status:
        "Status",

      userId:
        "User ID",

      // ==================================================
      // ROLES
      // ==================================================

      roles: {
        admin:
          "Administrator",

        owner:
          "Owner",

        user:
          "User",
      },

      // ==================================================
      // STATUSES
      // ==================================================

      statuses: {
        active:
          "Active",

        inactive:
          "Inactive",

        suspended:
          "Suspended",
      },

      // ==================================================
      // EMPTY
      // ==================================================

      emptyTitle:
        "No Users",

      emptyMessage:
        "There are currently no users in your organization.",

      emptySearchTitle:
        "No matches",

      emptySearchMessage:
        "No users match your search.",

      backToUsers:
        "Users",

      // ==================================================
      // CREATE
      // ==================================================

      createTitle:
        "Create User",

      createSureMessage:
        "Are you sure you want to create this user?",

      createSuccessTitle:
        "User Created",

      createSuccessMessage:
        "The user has been created successfully.",

      createFailTitle:
        "Creation Failed",

      createFailMessage:
        "We couldn't create the user.",

      // ==================================================
      // LOAD
      // ==================================================

      loadFailTitle:
        "Loading Failed",

      loadFailMessage:
        "We couldn't load the users. Please try again.",

      // ==================================================
      // DELETE
      // ==================================================

      deleteUser:
        "Delete user",

      deleteTitle:
        "Delete user",

      deleteSureMessage:
        "Are you sure you want to delete this user? This action cannot be undone.",

      deleteSuccessTitle:
        "User deleted",

      deleteSuccessMessage:
        "The user was deleted successfully.",

      deleteFailTitle:
        "Deletion failed",

      deleteFailMessage:
        "Something went wrong while deleting the user.",

      // ==================================================
      // BACKEND ERRORS
      // ==================================================

      errors: {
        deleteAdminOnly:
          "Only administrators can delete users.",

        notFound:
          "User not found.",

        updateNotAuthorized:
          "You are not authorized to update this user.",

        passwordNotAuthorized:
          "You are not authorized to change this password.",

        requiredCreateFields:
          "Please provide first name, last name, email, and password.",

        requiredUpdateFields:
          "Please provide first name, last name, and email.",

        requiredPasswordFields:
          "Please provide current and new password.",

        emailExists:
          "A user with this email already exists.",

        currentPasswordIncorrect:
          "Current password is incorrect.",
      },
      toolbar: {
        searchPlaceholder: "Search users...",
      },
    },

    employees: {
      title: "Employees",
      subtitle: "Manage your company's employees and HR information.",
      addEmployee: "Add Employee",
      backToEmployees: "Back to Employees",
      editEmployee: "Edit Employee",
      newEmployee: "New Employee",
      employeeInformation: "Employee Information",
      loadFailTitle: "Couldn't load employees",
      loadFailMessage: "Something went wrong while loading employees. Please try again.",
      loadCompaniesFailMessage: "Something went wrong while loading companies. Please try again.",

      createTitle: "Add employee",
      createSureMessage: "Are you sure you want to create this employee?",
      createSuccessTitle: "Employee created",
      createSuccessMessage: "The employee has been created successfully.",
      createFailTitle: "Couldn't create employee",
      createFailMessage: "Something went wrong while creating the employee.",

      updateTitle: "Update employee",
      updateSureMessage: "Are you sure you want to save these changes?",
      updateSuccessTitle: "Employee updated",
      updateSuccessMessage: "The employee has been updated successfully.",
      updateFailTitle: "Couldn't update employee",
      updateFailMessage: "Something went wrong while updating the employee.",

      deleteTitle: "Delete employee",
      deleteSureMessage: "Are you sure you want to delete {name}? This cannot be undone.",
      deleteSuccessTitle: "Employee deleted",
      deleteSuccessMessage: "The employee has been deleted.",
      deleteFailTitle: "Couldn't delete employee",
      deleteFailMessage: "Something went wrong while deleting the employee.",

      selectCompanyRequired: "Please select a company.",
      invalidPhotoType: "Please select an image file.",

      toolbar: {
        company: "Company",
        selectCompany: "Select company",
        loadingCompanies: "Loading companies...",
        searchPlaceholder: "Search employees...",
      },

      companyInfo: {
        employeeCount_one: "{count} employee",
        employeeCount_other: "{count} employees",
      },

      emptyNoCompany: {
        title: "No companies found",
        message: "Create a company first before adding employees.",
      },

      emptyNoEmployees: {
        title: "No employees found",
        messageSearch: "No employees match your search.",
        messageDefault: "This company does not have any employees yet.",
        cta: "Add Employee",
      },

      loading: "Loading employees...",

      photo: {
        label: "Employee Photo",
        choose: "Choose photo",
        change: "Change photo",
        remove: "Remove",
      },

      company: {
        label: "Company",
        selectPlaceholder: "Select company",
        unnamed: "Unnamed company",
      },

      sections: {
        personalInformation: "Personal Information",
        contactInformation: "Contact Information",
        employment: "Employment",
        identification: "Identification",
        company: "Company",
        notes: "Notes",
      },

      documents: {
        menuButton: "Documents",
        attestationTravail: "Attestation de travail",
        attestationSalaire: "Attestation de salaire",
        certificatTravail: "Certificat de travail",
        contratTravail: "Contrat de travail",
        soldeToutCompte: "Reçu pour solde de tout compte",
        generationFailed: "Error generating the document.",
      },

      bulkImport: {
        exportButton: "Export (CSV)",
        exportFailed: "Could not export employees.",
        openButton: "Import (CSV)",
        title: "Bulk import employees",
        helpText: "Upload a CSV file to create multiple employees at once. Every row is checked first — nothing is created until you confirm.",
        downloadTemplate: "Download CSV template",
        preview: "Check file",
        previewing: "Checking...",
        previewFailed: "Could not read this file.",
        summaryValid: "{count} ready to import",
        summaryErrors: "{count} with errors",
        summaryWarnings: "{count} with warnings",
        rowOk: "Looks good",
        fixErrorsFirst: "Fix the rows with errors and re-upload the file before importing — rows with only warnings will still be imported.",
        importButton: "Import {count} employee(s)",
        committing: "Importing...",
        commitFailed: "Could not complete the import.",
        commitSuccess: "{count} employee(s) imported successfully.",
      },

      fields: { manager: "Manager", noManagerCandidates: "No other employee in this company yet",
        employeeNumber: "Employee Number",
        employeeNumberPlaceholder: "EMP-001",

        firstName: "First Name",
        firstNamePlaceholder: "First name",

        lastName: "Last Name",
        lastNamePlaceholder: "Last name",

        firstNameArabic: "First Name (Arabic)",
        firstNameArabicPlaceholder: "الاسم الأول",

        lastNameArabic: "Last Name (Arabic)",
        lastNameArabicPlaceholder: "اسم العائلة",

        gender: "Gender",
        genderPlaceholder: "Select gender",

        dateOfBirth: "Date of Birth",

        placeOfBirth: "Place of Birth",
        placeOfBirthPlaceholder: "City",

        nationality: "Nationality",
        nationalityPlaceholder: "Moroccan",

        maritalStatus: "Marital Status",
        maritalStatusPlaceholder: "Select status",

        numberOfDependents: "Dependents",

        cin: "CIN",
        cinPlaceholder: "AB123456",

        passportNumber: "Passport Number",
        passportNumberPlaceholder: "Passport number",

        passportExpiryDate: "Passport Expiry",

        workPermitNumber: "Work Permit Number",
        workPermitNumberPlaceholder: "Permit number",

        workPermitExpiryDate: "Work Permit Expiry",

        personalEmail: "Personal Email",
        personalEmailPlaceholder: "personal@email.com",

        workEmail: "Work Email",
        workEmailPlaceholder: "employee@company.com",

        phone: "Phone",
        phonePlaceholder: "+212...",

        secondaryPhone: "Secondary Phone",
        secondaryPhonePlaceholder: "+212...",

        street: "Street",
        streetPlaceholder: "Street address",

        city: "City",
        cityPlaceholder: "City",

        region: "Region",
        regionPlaceholder: "Region",

        postalCode: "Postal Code",
        postalCodePlaceholder: "40000",

        country: "Country",
        countryPlaceholder: "Morocco",

        emergencyName: "Emergency Contact",
        emergencyNamePlaceholder: "Full name",

        emergencyRelationship: "Relationship",
        emergencyRelationshipPlaceholder: "Spouse, parent...",

        emergencyPhone: "Emergency Phone",
        emergencyPhonePlaceholder: "+212...",

        emergencyEmail: "Emergency Email",
        emergencyEmailPlaceholder: "email@example.com",

        hireDate: "Hire Date",
        terminationDate: "Termination Date",

        employmentStatus: "Employment Status",
        employmentStatusPlaceholder: "Select status",

        employmentType: "Employment Type",
        employmentTypePlaceholder: "Select type",

        jobTitle: "Job Title",
        jobTitlePlaceholder: "Production Manager",

        department: "Department",
        departmentPlaceholder: "Production",
        noDepartments: "No departments defined yet — add one from Organization > Departments",

        service: "Service",
        servicePlaceholder: "Assembly",

        position: "Position",
        positionPlaceholder: "Operator",

        workLocation: "Work Location",
        workLocationPlaceholder: "Factory",

        cnssNumber: "CNSS Number",
        cnssNumberPlaceholder: "CNSS number",

        cnssRegistrationDate: "CNSS Registration Date",

        taxIdentificationNumber: "Tax Identification Number",
        taxIdentificationNumberPlaceholder: "Tax ID",

        taxStatus: "Tax Status",
        taxStatusPlaceholder: "Tax status",

        numberOfChildren: "Number of Children",

        spouseWorking: "Spouse Working",
        spouseWorkingCheckboxLabel: "Spouse is currently working",

        bankName: "Bank Name",
        bankNamePlaceholder: "Bank",

        accountName: "Account Name",
        accountNamePlaceholder: "Account holder",

        rib: "RIB",
        ribPlaceholder: "RIB",

        iban: "IBAN",
        ibanPlaceholder: "IBAN",

        paymentMethod: "Payment Method",
        paymentMethodPlaceholder: "Select method",

        notes: "Notes",
        notesPlaceholder: "Additional notes...",

        isActive: "Active",
        isActiveCheckboxLabel: "Employee is active",
        createLogin: "Self-service login",
        createLoginCheckboxLabel: "Also create a self-service login for this employee (uses their work email)",
      },

      genders: {
        male: "Male",
        female: "Female",
        other: "Other",
      },

      maritalStatuses: {
        single: "Single",
        married: "Married",
        divorced: "Divorced",
        widowed: "Widowed",
        other: "Other",

      },

      taxStatus: {
        taxable: "Taxable",
        nonTaxable: "Non-Taxable",
        exempt: "Exempt",
      },

      statuses: {
        active: "Active",
        inactive: "Inactive",
        on_leave: "On Leave",
        suspended: "Suspended",
        terminated: "Terminated",
        unknown: "Unknown",
      },

      employmentTypes: {
        permanent: "Permanent",
        fixed_term: "Fixed Term",
        temporary: "Temporary",
        intern: "Intern",
        apprentice: "Apprentice",
        freelance: "Freelance",
        part_time: "Part Time",
        other: "Other",
      },

      paymentMethods: {
        bank_transfer: "Bank Transfer",
        cash: "Cash",
        check: "Check",
      },

      card: {
        view: "View",
        edit: "Edit",
      },

      detail: {
        employeeLabel: "Employee",
        firstName: "First Name",
        lastName: "Last Name",
        gender: "Gender",
        dateOfBirth: "Date of Birth",
        nationality: "Nationality",
        maritalStatus: "Marital Status",
        phone: "Phone",
        email: "Email",
        address: "Address",
        jobTitle: "Job Title",
        department: "Department",
        employmentType: "Employment Type",
        hireDate: "Hire Date",
        workLocation: "Work Location",
        service: "Service",
        cin: "CIN",
        passport: "Passport",
        cnssNumber: "CNSS Number",
        taxId: "Tax ID",
        empty: "—",
      },

      buttons: {
        save: "Saving...",
        createEmployee: "Create Employee",
        updateEmployee: "Update Employee",
        cancel: "Cancel",
      },

      breadcrumbs: {
        hr: "HR",
        employees: "Employees",
        addEmployee: "Add Employee",
        editEmployee: "Edit Employee",
      },

      errors: {
        companyRequired: "Please select a company.",
        invalidPhoto: "Please select an image file.",
        fetchCompaniesFailed: "Failed to fetch companies",
        fetchEmployeesFailed: "Failed to fetch employees",
        createFailed: "Failed to create employee",
        updateFailed: "Failed to update employee",
        deleteFailed: "Failed to delete employee",
        notFound: "Employee not found",
        duplicateEmployeeNumber: "An employee with this number already exists",
        requiredFields: "Please fill in all required fields",
      },

      linkedUser: {
        title: "Self-service access",
        linkedTo: "Linked to:",
        link: "Link",
        unlink: "Unlink",
        linkTitle: "Link user account",
        linkSureMessage: "Link this user account to this employee? They'll get access to My Space (payslips, absence/advance requests, attendance).",
        unlinkTitle: "Unlink user account",
        unlinkSureMessage: "Unlink this user account from this employee? They'll lose access to My Space.",
        searchPlaceholder: "Search users by name or email...",
        actionFailed: "Something went wrong. Please try again.",
        orCreateNew: "or",
        createLogin: "Create new login",
        createLoginTitle: "Create login",
        createLoginSureMessage: "Create a new self-service login for this employee? A temporary password will be generated and shown once — make sure to save it.",
        loginCreatedTitle: "Login created",
        loginCreatedMessage: "Email: {email}\nTemporary password: {password}\n\nShare this with the employee — it won't be shown again. They should change it after their first login (from their Profile page).",
        loginNotCreatedTitle: "Employee created, but no login yet",
        resetPassword: "Reset password",
        resetPasswordTitle: "Reset password",
        resetPasswordSureMessage: "Generate a new temporary password for this employee's login? Their current password will stop working immediately.",
      },

      related: {
        empty: "Nothing here yet.",
        tabs: {
          salary: "Salary",
          absences: "Absences",
          advances: "Advances",
          contracts: "Contracts",
          documents: "Documents",
          attendance: "Attendance",
        },
      },
    },
    workSchedule: { shiftType: "Shift type", continuous: "One continuous shift", split: "Split shift (midday break)", continuousHint: "Employees clock in once and clock out once, e.g. 09:00 → 16:00. Anything worked beyond the scheduled hours counts as overtime.", splitHint: "Employees clock in and out twice, e.g. 08:00 → 12:00 and 14:00 → 18:00. The midday break isn't counted as worked time; overtime is anything beyond the scheduled hours, and lateness is checked on both arrivals.", morningIn: "Clock in", middayOut: "Midday out", middayIn: "Midday in", finalOut: "Clock out", scheduledHours: "Hours", applyToAll: "Copy this day's times to every working day", applyToAllShort: "Apply to all days", invalidTimes: "the times must be in order (clock in, then midday out, then midday in, then clock out).", invalidShort: "Check times",
      title: "Work Schedule",
      subtitle: "Set expected clock-in times, work hours, and grace periods per day — used to calculate lateness and overtime.",
      fields: { day: "Day", workingDay: "Working day", startTime: "Start time", workHours: "Work hours", grace: "Grace (min)" },
      days: {
        monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
        friday: "Friday", saturday: "Saturday", sunday: "Sunday",
      },
      working: "Working day",
      dayOff: "Day off",
      hoursUnit: "h",
      minutesUnit: "min",
      footnote: "Clocking in later than the start time plus the grace period marks the day \"late\". Overtime is anything worked beyond the configured work hours.",
      savedTitle: "Schedule saved",
      savedMessage: "The work schedule was updated successfully.",
      saveFailed: "Something went wrong while saving. Please try again.",
      hoursManagement: {
        title: "Hours Management",
        subtitle: "Control how attendance affects payroll — each option below is independent.",
        payOvertime: "Pay overtime",
        payOvertimeHint: "Add extra pay for hours worked beyond the scheduled work hours.",
        deductLateArrival: "Deduct for late arrival",
        deductLateArrivalHint: "Reduce pay for time lost to late clock-ins.",
        deductEarlyLeave: "Deduct for early leave",
        deductEarlyLeaveHint: "Reduce pay for time lost to leaving before the scheduled end time.",
        deductionRate: "Deduction rate",
        deductionRateHint: "Multiplier applied to the hourly rate for late/early deductions — 1× is a straight pay-for-time deduction.",
        monthlyStandardHours: "Monthly standard hours",
        monthlyStandardHoursHint: "Used to compute the hourly rate from the base salary (base salary ÷ this number).",
        rateSuffix: "×",
      },
    },


    production: {
      title: "Production",
    },

    inventory: {
      title: "Inventory",
      subtitle: "Track stock, thresholds, and supplier prices.",
      addProduct: "Add product",
      editProduct: "Edit product",
      searchPlaceholder: "Search by name or reference...",
      lowStockOnly: "Low stock only",
      lowStock: "Low stock",
      asOfDate: "As of date",
      viewingAsOf: "Showing inventory as of {date}.",
      deleteTitle: "Delete product",
      deleteSureMessage: "Are you sure you want to delete this product? Its movement history will also be removed. This cannot be undone.",
      emptyTitle: "No products yet",
      emptyMessage: "Add your first product to start tracking inventory.",
      purchaseRequestSuccess: "Purchase request submitted successfully.",
      fields: {
        category: "Category", selectCategory: "Select a category", name: "Name",
        internalReference: "Internal reference", quantity: "Quantity", unit: "Unit",
        threshold: "Threshold", sellingPrice: "Selling price", image: "Image",
        prices: "Supplier prices", supplierName: "Supplier", price: "Price",
        supplierReference: "Supplier reference", reason: "Reason", notes: "Notes",
        search: "Search", orderedQuantity: "Ordered quantity",
      },
      actions: {
        add: "Add stock", remove: "Remove stock", requestPurchase: "Request purchase",
        submitRequest: "Submit request",
      },
      errors: {
        fetchFailed: "Failed to load inventory", saveFailed: "Something went wrong while saving.",
        deleteFailed: "Something went wrong while deleting.", adjustFailed: "Something went wrong while updating the quantity.",
        missingFields: "Please fill in the category, name, and internal reference.",
        invalidQuantity: "Please enter a valid quantity.", purchaseRequestFailed: "Something went wrong while submitting the request.",
      },
    },

    inventorySettings: {
      title: "Inventory Settings",
      subtitle: "Define the categories (rubriques) used across your inventory.",
      addCategory: "Add category",
      editCategory: "Edit category",
      deleteTitle: "Delete category",
      deleteSureMessage: "Are you sure you want to delete this category? Products still using it must be reassigned or deleted first.",
      emptyTitle: "No categories yet",
      emptyMessage: "Add your first inventory category (e.g. \"Raw material\", \"Finished product\").",
      fields: { fixedAssetOff: "No — VAT on 34552", fixedAssetOn: "Yes — VAT on 34551", fixedAsset: "Fixed asset", accountingAccountHint: "Where purchases of this category go in the accounting export — e.g. 6121 raw materials, 6122 consumables, 2332 equipment. Empty: the company's default account.", accountingAccount: "Accounting account (purchases)",
        name: "Name", namePlaceholder: "e.g. Matière première",
        icon: "Icon", description: "Description", descriptionPlaceholder: "Optional",
      },
      errors: {
        nameRequired: "Category name is required", saveFailed: "Something went wrong while saving.",
        deleteFailed: "Something went wrong while deleting.",
      },
    },

    purchaseRequests: {
      title: "Purchase Requests",
      subtitle: "Restocking requests sent to Purchasing, and their answer.",
      emptyTitle: "No purchase requests",
      emptyMessage: "No purchase requests match your filters.",
      markReceived: "Mark as received",
      fields: { product: "Product", quantity: "Quantity", requestedBy: "Requested by" },
      status: { received: "Received" },
    },

    departments: { noManagerBadge: "No manager", managerLabel: "Manager", moduleAccessBadge: "Module access",
      title: "Departments",
      subtitle: "Define your organization's departments and the job positions (postes) within them.",
      addDepartment: "Add department",
      addDefaults: "Add default departments",
      defaultsModal: {
        title: "Add default departments",
        helpText: "Pick the departments you want to add — each comes with a standard name, description, and (for HR/Production) module access already set. You can still edit or add more later.",
        adding: "Adding...",
        addButton: "Add {count} department(s)",
      },
      editDepartment: "Edit department",
      addPosition: "Add position",
      editPosition: "Edit position",
      deleteTitle: "Delete department",
      deleteSureMessage: "Are you sure you want to delete this department? Employees and positions still using it must be reassigned first.",
      deletePositionTitle: "Delete position",
      deletePositionSureMessage: "Are you sure you want to delete this position? Employees still holding it, or other positions reporting to it, must be reassigned first.",
      emptyTitle: "No departments yet",
      emptyMessage: "Add your first department to start building your org structure.",
      searchPlaceholder: "Search departments...",
      noSearchResults: "No departments match your search.",
      noPositions: "No positions defined in this department yet.",
      fields: { salesAccess: "Sales module access (devis, invoices)", logisticsAccess: "Logistics module access (deliveries, tracking)", purchasingAccess: "Purchasing module access", manager: "Department manager", noManager: "No manager", managerHint: "Oversees the whole department: full module access, approves the team's requests, and decides which job titles get module access.", grantsModuleAccess: "Grants module access", grantsModuleAccessHint: "Holders of this position get this department's module (e.g. HR or Inventory). Leave off for staff who should only see My Space.",
        name: "Name", description: "Description", permissionKey: "Module access",
        permissionKeyHint: "Optional — only set this on ONE department if employees there (and their auto-created logins) should get HR or Production module access. Most departments should leave this as \"No special access\".",
        category: "Job function",
        noCategory: "No specific function",
        categoryHint: "Optional — lets the employee form suggest standard job titles for this department instead of leaving it free text. Purely a suggestion; carries no access implications, unlike Module access above.",
        noSpecialAccess: "No special access", hrAccess: "HR module access", productionAccess: "Production module access",
        positionTitle: "Position title", reportsTo: "Reports to", noReportsTo: "None (top-level position)",
        salaryMin: "Salary band — min", salaryMax: "Salary band — max", salaryBand: "Salary band",
        requiredSkills: "Required skills", requiredSkillsPlaceholder: "Comma-separated, e.g. Excel, Leadership",
      },
      errors: {
        nameRequired: "Department name is required", titleRequired: "Position title is required",
        saveFailed: "Something went wrong while saving.", deleteFailed: "Something went wrong while deleting.",
      },
    },

    salaries: {
      title: "Salaries",
      subtitle: "Manage employee compensation and salary history.",
      addSalary: "Add salary",
      giveRaise: "Give a raise",

      createTitle: "New salary record",
      createSureMessage: "Are you sure you want to save this salary record? Any current salary for this employee will be closed as of this effective date.",
      createSuccessTitle: "Salary record created",
      createSuccessMessage: "The salary record was created successfully.",

      deleteTitle: "Delete salary record",
      deleteSureMessage: "Are you sure you want to delete this salary record? This cannot be undone.",

      emptyTitle: "No salaries yet",
      emptyMessage: "This company has no salary records yet.",

      fields: {
        employee: "Employee",
        employeeSearchPlaceholder: "Search by name, number, CIN, CNSS...",
        baseSalary: "Base salary",
        effectiveDate: "Effective date",
        notes: "Notes",
        notesPlaceholder: "Reason for this change, additional context...",
      },

      table: {
        base: "Base",
        gross: "Gross",
        net: "Net",
        endDate: "End date",
        status: "Status",
        ongoing: "Ongoing",
      },

      actions: {
        history: "View history",
      },

      history: { deleteRecord: "Delete this salary record",
        titleFor: "Salary history — {name}",
        empty: "No salary history for this employee.",
        current: "Current",
        past: "Past",
      },

      breadcrumbs: {
        hr: "HR",
        salaries: "Salaries",
      },

      buttons: {
        create: "Save salary",
      },

      errors: {
        fetchFailed: "Failed to load salaries",
        actionFailed: "Something went wrong. Please try again.",
      },
    },
    absences: {
      title: "Absences",
      subtitle: "Review and manage leave and absence requests.",
      addAbsence: "New absence request",

      createTitle: "New absence request",
      createSureMessage: "Are you sure you want to submit this absence request?",
      createSuccessTitle: "Request submitted",
      createSuccessMessage: "The absence request was submitted successfully.",

      acceptTitle: "Accept absence",
      acceptSureMessage: "Are you sure you want to accept this absence request?",

      rejectTitle: "Reject absence",
      rejectSureMessage: "Are you sure you want to reject this absence request?",

      deleteTitle: "Delete absence",
      deleteSureMessage: "Are you sure you want to delete this absence record? This cannot be undone.",

      emptyTitle: "No absences",
      emptyMessage: "No absence requests match your filters.",

      unjustified: "Unjustified",

      fields: {
        employee: "Employee",
        employeeSearchPlaceholder: "Search by name, number, CIN, CNSS...",
        type: "Type",
        startDate: "Start date",
        endDate: "End date",
        halfDay: "Half day",
        justified: "Justified",
        reason: "Reason",
        reasonPlaceholder: "Reason or additional context...",
        reviewComment: "Review comment",
        status: "Status",
      },

      types: {
        paid_leave: "Paid leave",
        unpaid_leave: "Unpaid leave",
        sick_leave: "Sick leave",
        absence: "Absence",
        other: "Other",
      },

      status: { manager_approved: "Manager approved",
        pending: "Pending",
        accepted: "Accepted",
        rejected: "Rejected",
      },

      filters: {
        allStatuses: "All statuses",
        allTypes: "All types",
      },

      table: {
        period: "Period",
        days: "Days",
      },

      actions: {
        accept: "Accept",
        reject: "Reject",
      },

      breadcrumbs: {
        hr: "HR",
        absences: "Absences",
      },

      buttons: {
        create: "Submit request",
      },

      errors: {
        fetchFailed: "Failed to load absences",
        actionFailed: "Something went wrong. Please try again.",
      },
    },
    advances: {
      title: "Advances",
      subtitle: "Review and manage salary advance requests.",
      addAdvance: "New advance request",

      createTitle: "New advance request",
      createSureMessage: "Are you sure you want to submit this advance request?",
      createSuccessTitle: "Request submitted",
      createSuccessMessage: "The advance request was submitted successfully.",

      acceptTitle: "Accept advance",
      acceptSureMessage: "Are you sure you want to accept this advance request?",

      rejectTitle: "Reject advance",
      rejectSureMessage: "Are you sure you want to reject this advance request?",

      markRepaidTitle: "Mark as repaid",
      markRepaidSureMessage: "Are you sure you want to mark this advance as fully repaid?",

      deleteTitle: "Delete advance",
      deleteSureMessage: "Are you sure you want to delete this advance record? This cannot be undone.",

      emptyTitle: "No advances",
      emptyMessage: "No advance requests match your filters.",

      fields: {
        employee: "Employee",
        employeeSearchPlaceholder: "Search by name, number, CIN, CNSS...",
        amount: "Amount",
        requestDate: "Request date",
        reason: "Reason",
        reasonPlaceholder: "Reason or additional context...",
        reviewComment: "Review comment",
        status: "Status",
      },

      status: { manager_approved: "Manager approved",
        pending: "Pending",
        accepted: "Accepted",
        rejected: "Rejected",
      },

      filters: {
        allStatuses: "All statuses",
      },

      table: {
        remaining: "Remaining",
        fullyRepaid: "Fully repaid",
      },

      actions: {
        accept: "Accept",
        reject: "Reject",
        markRepaid: "Mark as repaid",
      },

      breadcrumbs: {
        hr: "HR",
        advances: "Advances",
      },

      buttons: {
        create: "Submit request",
      },

      errors: {
        fetchFailed: "Failed to load advances",
        actionFailed: "Something went wrong. Please try again.",
      },
    },
    payroll: {
      title: "Payroll",
      subtitle: "Generate monthly payroll runs and manage payslips.",
      generateRun: "Generate payroll",
      createTitle: "Generate payroll run",
      createSureMessage: "Generate payroll for this period? A payslip will be created for every active employee with a salary on file.",
      createSuccessTitle: "Payroll run created",
      createSuccessMessage: "The payroll run was generated successfully.",
      completeTitle: "Complete payroll run",
      completeSureMessage: "Complete this payroll run? Once completed, payslips are locked and employees are notified.",
      deleteTitle: "Delete payroll run",
      deleteSureMessage: "Delete this draft payroll run and all its payslips? This cannot be undone.",
      emptyTitle: "No payroll runs yet",
      emptyMessage: "Generate your first payroll run for this company.",
      noPayslips: "No payslips in this run.",
      fields: { month: "Month", year: "Year", status: "Status" },
      table: { period: "Period", employees: "Employees", gross: "Gross", net: "Net", searchPlaceholder: "Search employees..." },
      status: { draft: "Draft", completed: "Completed", voided: "Voided" },
      payslipStatus: { draft: "Draft", validated: "Validated", paid: "Paid" },
      actions: { view: "View", complete: "Complete", regenerate: "Regenerate", markPaid: "Mark as paid", downloadPdf: "Download payslip" },
      exports: {
        cnss: "CNSS Export",
        cnssHint: "Declaration worksheet — verify against the current Damancom format before uploading",
        register: "Payroll Register",
        bankTransfer: "Bank Transfer File",
      },
      buttons: { generate: "Generate", saving: "Saving..." },
      breadcrumbs: { hr: "HR", payroll: "Payroll" },
      months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
      errors: { fetchFailed: "Failed to load payroll runs", actionFailed: "Something went wrong. Please try again." },
    },

    contracts: {
      title: "Contracts",
      subtitle: "Track employment contracts, renewals, and expiry dates.",
      addContract: "New contract",
      createTitle: "New contract",
      createSureMessage: "Are you sure you want to create this contract?",
      createSuccessTitle: "Contract created",
      createSuccessMessage: "The contract was created successfully.",
      renewTitle: "Renew contract",
      renewSureMessage: "Renew this contract? The current one will be closed and a new one started.",
      deleteTitle: "Delete contract",
      deleteSureMessage: "Are you sure you want to delete this contract? This cannot be undone.",
      emptyTitle: "No contracts yet",
      emptyMessage: "This company has no contracts on file yet.",
      expiringBanner: "{count} contract(s) expiring within 30 days.",
      fields: { employee: "Employee", type: "Contract type", startDate: "Start date", endDate: "End date" },
      status: { active: "Active", expired: "Expired", terminated: "Terminated", renewed: "Renewed" },
      actions: { renew: "Renew" },
      buttons: { create: "Save contract" },
      breadcrumbs: { hr: "HR", contracts: "Contracts" },
      errors: { fetchFailed: "Failed to load contracts", actionFailed: "Something went wrong. Please try again." },
    },

    documents: {
      title: "Documents",
      subtitle: "Store employee documents and track expiry dates.",
      uploadDocument: "Upload document",
      editDocument: "Edit document",
      deleteTitle: "Delete document",
      deleteSureMessage: "Are you sure you want to delete this document? This cannot be undone.",
      emptyTitle: "No documents yet",
      emptyMessage: "This company has no documents on file yet.",
      expiringBanner: "{count} document(s) expiring within 30 days.",
      fields: { employee: "Employee", type: "Type", label: "Label", labelPlaceholder: "e.g. National ID card", expiryDate: "Expiry date", file: "File", replaceFile: "Replace file (optional)" },
      table: { file: "File" },
      types: {
        cin: "National ID (CIN)", passport: "Passport", work_permit: "Work permit",
        residence_permit: "Residence permit", contract: "Contract", diploma: "Diploma",
        cv: "CV", medical_certificate: "Medical certificate", other: "Other",
      },
      actions: { view: "View", loadMore: "Load more", loadMoreCount: "Showing {loaded} of {total}" },
      buttons: { upload: "Upload" },
      breadcrumbs: { hr: "HR", documents: "Documents" },
      errors: {
        fetchFailed: "Failed to load documents", actionFailed: "Something went wrong. Please try again.",
        missingFields: "Please choose an employee and a file.", uploadFailed: "Failed to upload the document.",
      },
    },

    attendance: {
      title: "Attendance",
      subtitle: "Review clock-in/clock-out records.",
      emptyTitle: "No attendance records",
      emptyMessage: "No attendance records match your filters.",
      filterAllEmployees: "All employees",
      fields: { employee: "Employee", date: "Date", clockIn: "Clock in", clockOut: "Clock out", notes: "Notes" },
      status: { present: "Present", late: "Late", absent: "Absent", half_day: "Half day", holiday: "Holiday" },
      breadcrumbs: { hr: "HR", attendance: "Attendance" },
      errors: { fetchFailed: "Failed to load attendance" },
    },

    reports: { chart: { zoomHint: "Drag the handles below the chart to zoom in", yearly: "Yearly", monthly: "Monthly", view: "View", lastMonths: "Last {n} months", range: "Range", },
      title: "Reports",
      subtitle: "Headcount, turnover, absenteeism, and payroll cost trends.",
      stats: { totalHeadcount: "Total headcount", activeEmployees: "Active employees", currentGross: "Current monthly gross (est.)", currentNet: "Current monthly net (est.)", missingSalaryNote: "{count} active employee(s) have no salary on file yet — not included in this estimate." },
      expand: "Expand",
      charts: {
        headcountByDepartment: "Headcount by department", turnover: "Turnover (last 12 months)",
        hires: "Hires", terminations: "Terminations", absenteeism: "Absenteeism rate (last 6 months)",
        absenteeismRate: "Absenteeism rate", payrollCost: "Payroll cost (last 12 months)",
        estimatedFootnote: "* The current month, marked with an asterisk, is a live estimate from current salaries — payroll hasn't been run for it yet.",
      },
      breadcrumbs: { hr: "HR", reports: "Reports" },
      loadError: "Some report data failed to load. Please try again, or check the console for details.",
      rankings: {
        title: "Employee rankings",
        last30Days: "Last 30 days",
        last90Days: "Last 90 days",
        last365Days: "Last 12 months",
        mostAbsenceDays: "Most absence days",
        bestAttendanceRate: "Best attendance rate",
        mostOvertimeHours: "Most overtime hours",
        mostLateDays: "Most late arrivals",
        noData: "No data for this period.",
        days: "days",
      },
    },

    auditLog: {
      title: "Audit Log",
      subtitle: "Who changed what, and when.",
      deleteTitle: "Delete audit log entry",
      deleteSureMessage: "Are you sure you want to delete this audit log entry? This cannot be undone.",
      emptyTitle: "No activity yet",
      emptyMessage: "No changes have been logged yet for this filter.",
      fields: { action: "Action", resourceType: "Type", resource: "Record", actor: "By", date: "Date" },
      resourceTypes: {
        Employee: "Employee", Salary: "Salary", Absence: "Absence", Advance: "Advance",
        Contract: "Contract", EmployeeDocument: "Document", PayrollRun: "Payroll run", WorkSchedule: "Work schedule",
      },
      actions: { create: "Created", update: "Updated", delete: "Deleted", review: "Reviewed" },
      breadcrumbs: { hr: "HR", auditLog: "Audit Log" },
      errors: { actionFailed: "This action failed. Please try again.", fetchFailed: "Failed to load the audit log" },
    },

    orgChart: {
      title: "Org Chart",
      subtitle: "Reporting structure, built from each employee's manager.",
      emptyTitle: "No org chart yet",
      emptyMessage: "Set a manager on employees to build the reporting structure.",
      breadcrumbs: { hr: "HR", orgChart: "Org Chart" },
    },

    mySpace: {
      title: "My Space",
      subtitle: "Your profile, payslips, and requests.",
      tabs: { profile: "Profile", payslips: "Payslips", absences: "Absences", advances: "Advances", attendance: "Attendance", records: "Records" },
      records: {
        performanceReviews: "Performance reviews",
        disciplinaryActions: "Disciplinary records",
        noReviews: "You have no performance reviews yet.",
        noDisciplinaryActions: "You have no disciplinary records.",
        reviewedBy: "Reviewed by",
        acknowledge: "Acknowledge",
        acknowledgeTitle: "Acknowledge",
        acknowledgeReviewMessage: "This confirms you've read this performance review. Continue?",
        acknowledgeDisciplineMessage: "This confirms you've read this record. Continue?",
        loadError: "Failed to load your records.",
        acknowledgeError: "Error acknowledging this record.",
      },
      leaveBalance: { title: "Paid leave balance", accrued: "Accrued", used: "Used", remaining: "Remaining" },
      teamRequests: { advance: "Salary advance", days: "{count} day(s)", reviewFailed: "Couldn't record this decision. Please try again.", title: "Your team's pending requests" },
      payslips: { emptyTitle: "No payslips yet", emptyMessage: "Your payslips will appear here once payroll is run." },
      absences: { cancelTitle: "Cancel request", cancelSureMessage: "Cancel this absence request?" },
      attendance: { holidayToday: "Public holiday today: {name}", holidayDouble: "hours worked are paid double", clockOutLunch: "Clock out for lunch", clockInAfternoon: "Clock back in", dayComplete: "Day complete ✓", scheduleToday: "Today", restDay: "Rest day", morning: "Morning", afternoon: "Afternoon", punchFailed: "Couldn't record this clock-in/out. Please try again.", todayStatus: "Today", clockIn: "Clock in", clockOut: "Clock out" },
    },

    notifications: {
      title: "Notifications",
      empty: "No notifications yet.",
      markAllRead: "Mark all read",
      now: "now",
      minutesShort: "m",
      hoursShort: "h",
      daysShort: "d",
    },

    units: {
      unit: "Unit",
      piece: "Piece",
      pair: "Pair",
      dozen: "Dozen",
      set: "Set",
      kg: "Kilogram (kg)",
      g: "Gram (g)",
      t: "Ton (t)",
      lb: "Pound (lb)",
      oz: "Ounce (oz)",
      quintal: "Quintal (q)",
      l: "Liter (L)",
      ml: "Milliliter (mL)",
      m3: "Cubic meter (m³)",
      gal: "Gallon (gal)",
      m: "Meter (m)",
      cm: "Centimeter (cm)",
      mm: "Millimeter (mm)",
      km: "Kilometer (km)",
      ft: "Foot (ft)",
      in: "Inch (in)",
      yd: "Yard (yd)",
      m2: "Square meter (m²)",
      ft2: "Square foot (ft²)",
      ha: "Hectare (ha)",
      box: "Box",
      carton: "Carton",
      pallet: "Pallet",
      bag: "Bag",
      sack: "Sack",
      bottle: "Bottle",
      can: "Can",
      roll: "Roll",
      sheet: "Sheet",
      bundle: "Bundle",
      case: "Case",
      drum: "Drum",
      barrel: "Barrel",
      container: "Container",
      hour: "Hour",
      day: "Day",
      month: "Month",
    },

    contentTranslation: {
      title: "Translations",
      editButton: "Translations",
      original: "Original",
      auto: "Auto-translated",
      manual: "Manually edited",
      missing: "Not translated yet",
      regenerate: "Regenerate",
      originalHint: "This is the original text — edit the field itself to change it.",
      save: "Save",
      saving: "Saving…",
      close: "Close",
      placeholder: "Enter the translation…",
      errors: {
        loadFailed: "Failed to load translations.",
        saveFailed: "Failed to save the translation.",
        regenerateFailed: "Failed to regenerate the translation.",
      },
    },
  twoFactor: { qrAlt: "2FA QR code",
    title: "Two-factor authentication",
    disabledHint: "Add an extra layer of security to your account — after your password, you'll also need a code from an authenticator app to sign in.",
    enabledHint: "Two-factor authentication is enabled on your account. You'll be asked for a code from your authenticator app every time you sign in.",
    enableButton: "Enable two-factor authentication",
    disableButton: "Disable two-factor authentication",
    disabling: "Disabling...",
    scanTitle: "Scan the QR code",
    scanHint: "Scan this with an authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code it shows to confirm.",
    manualEntryLabel: "Can't scan it? Enter this code manually:",
    confirmAndEnable: "Confirm and enable",
    verifying: "Verifying...",
    backupCodesTitle: "Save your backup codes",
    backupCodesHint: "Each code can be used once to sign in if you lose access to your authenticator app. Save them somewhere safe — they won't be shown again.",
    copyBackupCodes: "Copy codes",
    copied: "Copied",
    iSavedThem: "I've saved these codes",
    confirmPasswordLabel: "Confirm your password to continue",
    errors: {
      statusFailed: "Could not check two-factor status.",
      setupFailed: "Could not start two-factor setup.",
      invalidCode: "That code didn't match — check your authenticator app and try again.",
      disableFailed: "Could not disable two-factor authentication.",
    },
  },

  disciplinaryActions: {
    title: "Disciplinary Actions",
    subtitle: "Track warnings and corrective actions issued to employees.",
    addAction: "Add record",
    editAction: "Edit record",
    emptyTitle: "No disciplinary records yet",
    emptyMessage: "This company has no disciplinary actions on file.",
    deleteTitle: "Delete record",
    deleteSureMessage: "Are you sure you want to delete this record? This cannot be undone.",
    acknowledged: "Acknowledged",
    notAcknowledged: "Not yet acknowledged",
    breadcrumbs: {
      hr: "HR",
      disciplinaryActions: "Disciplinary Actions",
    },
    fields: {
      employee: "Employee",
      type: "Type",
      date: "Date",
      reason: "Reason",
      description: "Description",
      suspensionDays: "Suspension (days)",
      issuedBy: "Issued by",
      notes: "Notes",
    },
    types: {
      verbal_warning: "Verbal warning",
      written_warning: "Written warning",
      final_warning: "Final warning",
      suspension: "Suspension",
      termination_notice: "Termination notice",
    },
    errors: {
      fetchFailed: "Failed to load disciplinary records",
      saveFailed: "Error saving record",
      deleteFailed: "Error deleting record",
    },
  },
  performanceReviews: {
    title: "Performance Reviews",
    subtitle: "Review cycles, goals, and ratings for your employees.",
    addReview: "New review",
    editReview: "Edit review",
    emptyTitle: "No performance reviews yet",
    emptyMessage: "This company has no performance reviews on file.",
    deleteTitle: "Delete review",
    deleteSureMessage: "Are you sure you want to delete this review? This cannot be undone.",
    reviewedBy: "Reviewed by",
    submitButton: "Submit to employee",
    breadcrumbs: {
      hr: "HR",
      performanceReviews: "Performance Reviews",
    },
    fields: {
      employee: "Employee",
      reviewer: "Reviewer",
      periodLabel: "Review period",
      periodLabelPlaceholder: "e.g. Annual review 2026",
      reviewDate: "Review date",
      goals: "Goals (one per line)",
      goalsPlaceholder: "Improve response time on support tickets\nComplete the onboarding certification",
      strengths: "Strengths",
      areasForImprovement: "Areas for improvement",
      comments: "Comments",
    },
    criteria: {
      jobKnowledge: "Job knowledge",
      qualityOfWork: "Quality of work",
      communication: "Communication",
      teamwork: "Teamwork",
      initiative: "Initiative",
      punctuality: "Punctuality",
    },
    statuses: {
      draft: "Draft",
      submitted: "Submitted",
      acknowledged: "Acknowledged",
    },
    errors: {
      fetchFailed: "Failed to load performance reviews",
      saveFailed: "Error saving review",
      submitFailed: "Error submitting review",
      deleteFailed: "Error deleting review",
    },
  },
  leaveCalendar: {
    title: "Leave Calendar",
    subtitle: "See who's on approved leave at a glance.",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    breadcrumbs: {
      hr: "HR",
      leaveCalendar: "Leave Calendar",
    },
    weekdays: {
      0: "Mon",
      1: "Tue",
      2: "Wed",
      3: "Thu",
      4: "Fri",
      5: "Sat",
      6: "Sun",
    },
    errors: {
      fetchFailed: "Failed to load the leave calendar",
    },
  },
};
