// UI dictionary — de. Split out of i18n.config.js so each language
// is its own module (see loadLanguage there).
export default { quota: { title: "Kontingente", hint: "Leer = unbegrenzt. Ausgeschiedene Mitarbeiter zählen nicht. Ein Senken löscht nichts — der Kunde kann nur nichts mehr anlegen.", maxCompanies: "Max. Unternehmen", maxEmployees: "Max. Mitarbeiter", unlimited: "Unbegrenzt", edit: "Kontingente bearbeiten", saved: "Kontingente gespeichert.", companies: "Unternehmen", employees: "Mitarbeiter", companiesFull: "Unternehmenslimit erreicht — wenden Sie sich an die Plattform.", employeesFull: "Mitarbeiterlimit erreicht — wenden Sie sich an die Plattform. Ein ausgeschiedener Mitarbeiter gibt einen Platz frei.", employeesHint: "Belegte / erlaubte Plätze (Ausgeschiedene zählen nicht).", newCompany: "Neues Unternehmen", }, prodPlan: { barsOf: "Stangen à {length} mm", }, wsMulti: { departmentSchedule: "Arbeitszeitplan", useDefault: "Standardplan ({name})", departmentScheduleHint: "Pläne werden unter Organisation › Arbeitszeitplan erstellt.", deleteConfirm: "Arbeitszeitplan „{name}“ löschen? Seine Abteilungen kehren zum Standardplan zurück.", namePlaceholder: "z. B. Werkstatt – geteilt, Samstagvormittag", copyCurrent: "Aktuellen Plan kopieren", new: "Neuer Plan", name: "Name des Plans", default: "Standardplan", makeDefault: "Als Standard festlegen", departments: "Abteilungen", noDepartments: "Noch keine Abteilung in diesem Unternehmen.", leaveDefaultHint: "Bereits im Standardplan — einem anderen Plan zuweisen, um sie zu verschieben.", currently: "Aktuell: {name}", defaultHint: "Der Standardplan gilt für alle Abteilungen ohne eigenen Plan.", assignHint: "Abteilungen ankreuzen, die diesem Plan folgen; nicht angekreuzte kehren zum Standardplan zurück.", splitDay: "Pause", splitDayHint: "Geteilter Tag (Vormittag + Nachmittag). Abwählen für einen halben oder durchgehenden Tag.", splitOn: "Geteilt", splitOff: "Durchgehend", }, platformCo: { companyTitle: "Companies", companyAdd: "Add a company", companyNone: "No company yet.", companyAdminHint: "A client can have several companies (group, subsidiaries). Its admin can also create them from Organisation › Company; every screen has a “Company” picker.", companyFirst: "First company (optional)", companyFirstHint: "More companies can be added later, here or by the client's admin.", companyName: "Company name", companyNamePlaceholder: "e.g. Atlas Joinery Ltd", companyLegalForm: "Legal form", companyOtherForm: "Other", companyIndustry: "Activity", companyIndustryPlaceholder: "e.g. Aluminium joinery", companyCity: "City", companyAdded: "Company “{name}” added.", }, perm: { teamMenu: "Rechte meines Teams", title: "Zugriffsrechte", subtitleAll: "Everyone's permissions, action by action. Managers then hand out the ones they have to their team.", subtitleTeam: "Give each person in your team the permissions they need — among the ones you have yourself.", searchPeople: "Person suchen…", emptyTeam: "Nobody reports to you in this company.", manager: "Leitung", pickSomeone: "Wählen Sie links eine Person.", rules: "Each department has a manager, who gets every permission of its module. A manager only gives permissions they have themselves, to the people of their department and everyone reporting to them (all levels). They can also let a team lead hand out permissions in turn (“Team › Team permissions”).", noLoginHint: "This person has no login: create one from their employee file (HR) to give them permissions.", selfHint: "You can't change your own permissions — your manager does.", fullAccessHint: "Admin / owner: full access to everything.", managesHint: "Manager of {deps}: that module's permissions are automatic.", applyPreset: "Profil anwenden…", resetHint: "Back to their department / position default profile", reset: "Stellenprofil", legendOn: "Gewährt", legendAuto: "Automatisch (Leitung)", legendOff: "Nicht gewährt", legendGrantable: "Greyed boxes are permissions you don't have yourself.", all: "Alle", none: "Keine", toggleRow: "all / none", autoHint: "Automatic: this person manages the department", notGrantable: "You don't have this permission: you can't give or remove it", noLogin: "Kein Konto", fullAccess: "Vollzugriff", custom: "Individuell", roleProfile: "Stellenprofil", saved: "Rechte gespeichert: {added} hinzugefügt, {removed} entfernt.", resetConfirm: "Put back their department / position default profile? Their custom permissions will be lost.", resetDone: "Default profile restored.", errors: { load: "Couldn't load the permissions.", save: "Couldn't save the permissions.", }, }, cv: { parentCategory: "Übergeordnete Kategorie", noParent: "Keine (Hauptkategorie)", parentHint: "Z. B. „Aluminiumprofile“ › „Serie ATLAS 78 — Schiebeelemente“. Eine Unterkategorie ohne Buchungskonto übernimmt das der übergeordneten.", addSubCategory: "Unterkategorie hinzufügen", articlesCount: "{n} Artikel", subCount: "{n} Unterkategorie(n)", amountsLabel: "Beträge", amountsCheckbox: "Preise, Kosten, Margen und Budgets anzeigen (immer sichtbar für Admins, Inhaber, Vertrieb, Finanzen, Buchhaltung und Geschäftsleitung)", visual: "Darstellung", visualHint: "So erscheint das Modell im Katalog, in Projekten und im Angebots-PDF: eine maßstäbliche Skizze aus B × H — oder Ihr eigenes Bild (Foto, Zeichnung aus dem Lieferantenkatalog), das die Skizze dann überall ersetzt.", schematic: "Erzeugte Skizze", picture: "Bild (optional)", noPicture: "Kein Bild", changePicture: "Bild ändern", uploadPicture: "Bild hochladen", drawingType: "Skizzentyp", leaves: "Flügel", opening: "Öffnungsart", layers: "Anzahl Scheiben", grid_nx: "Spalten", grid_ny: "Reihen", solidLeaf: "Geschlossener Flügel (Paneel, ohne Glas)", railingBars: "Stäbe (statt Glasfüllung)", drawingParamsHint: "Parameter namens n (Flügel), nx / ny (Raster), lf, hi / ha (Kombinationen) oder ent (Pfostenabstand) überschreiben diese Werte zeilenweise.", ralPick: "Aus der RAL-Karte wählen", ralPickPh: "RAL suchen (9016, Anthrazit…)", ralNone: "Kein RAL gefunden", projectFinish: "Standardfarbe (RAL)", drawingTypes: { sliding: "Schiebeelement", casement: "Drehfenster", door: "Tür", folding: "Faltelement", fixed: "Festverglasung", grid: "Raster / Pfosten-Riegel", combo: "Kombination", shutter: "Rollladen", louvre: "Lamellen", railing: "Geländer", pergola: "Pergola", glass: "Verglasung", garage: "Garagentor", panel: "Paneel", cladding: "Verkleidung", generic: "Allgemein", }, openings: { side: "Dreh", ob: "Dreh-Kipp", soufflet: "Kipp", projetant: "Senkklapp", basculant: "Schwing", pivotant: "Wende", }, }, notificationEvents: { permissionsChanged: { title: "Ihre Rechte wurden geändert", message: "{added} hinzugefügt, {removed} entfernt", }, quoteAcceptedProd: { title: "Angebot {number} angenommen", message: "{customer} — das Projekt kommt in die Fertigung", }, orderPlanned: { title: "Neuer Fertigungsauftrag {number}", message: "{workshop} · {project}", }, orderPlannedWaiting: { title: "Neuer Fertigungsauftrag {number}", message: "{workshop} · {project} — wartet auf vorgelagerte Werkstätten", }, orderCreated: { title: "Neuer Fertigungsauftrag {number}", message: "{workshop} · {title}", }, orderReady: { title: "{number} kann starten", message: "{workshop}: Die vorgelagerten Werkstätten sind fertig.", }, orderDone: { title: "{number} abgeschlossen", message: "{workshop} · {project}", }, orderClosedShort: { title: "{number} mit Fehlbestand abgeschlossen", message: "{count} Artikel: {articles}", }, orderCancelled: { title: "{number} storniert", message: "{workshop} {reason}", }, orderLate: { title: "{number} ist verspätet", message: "{workshop} · fällig {date}", }, stockLow: { title: "Niedriger Bestand: {article}", message: "Noch {quantity} {unit} (Minimum {threshold})", }, quoteAccepted: { title: "Angebot {number} angenommen", message: "{customer} · {amount} netto", }, quoteRefused: { title: "Angebot {number} abgelehnt", message: "{customer} · {amount} netto {reason}", }, quoteExpiring: { title: "Angebot {number} läuft am {date} ab", message: "{customer} · nachfassen", }, paymentReceived: { title: "Zahlung auf {number}", message: "{customer} · {amount}", }, invoicePaid: { title: "Rechnung {number} bezahlt", message: "{customer} · {amount}", }, invoiceOverdue: { title: "Rechnung {number} überfällig", message: "{customer} · {amount} fällig seit {date}", }, projectDueSoon: { title: "Projekt {number}: fällig in {days} Tag(en)", message: "{name} · offene Aufträge: {open}", }, projectOverdue: { title: "Projekt {number} ist verspätet", message: "{name} · fällig {date} · offene Aufträge: {open}", }, }, login: { useBackupCode: "Stattdessen Backup-Code verwenden", useAuthenticator: "Stattdessen App-Code verwenden", invalidCode: "Ungültiger Code", verifying: "Wird geprüft...", verify: "Bestätigen", backupCodeHint: "Gib einen deiner Backup-Codes ein.", authenticatorHint: "Gib den 6-stelligen Code aus deiner Authenticator-App ein.", failed: "Anmeldung fehlgeschlagen", signingIn: "Anmeldung...", signIn: "Anmelden", password: "Passwort", email: "E-Mail", }, notifications: { daysShort: "T.", hoursShort: "Std.", minutesShort: "Min.", now: "jetzt", markAllRead: "Alle als gelesen markieren", empty: "Noch keine Benachrichtigungen.", title: "Benachrichtigungen", }, orgChart: { breadcrumbs: { orgChart: "Organigramm", hr: "HR", }, emptyMessage: "Lege bei Mitarbeitern Vorgesetzte fest, um die Struktur aufzubauen.", emptyTitle: "Noch kein Organigramm", subtitle: "Berichtsstruktur, aufgebaut aus den Vorgesetzten der Mitarbeiter.", title: "Organigramm", }, auditLog: { errors: { fetchFailed: "Prüfprotokoll konnte nicht geladen werden", actionFailed: "Diese Aktion ist fehlgeschlagen. Bitte erneut versuchen.", }, breadcrumbs: { auditLog: "Prüfprotokoll", hr: "HR", }, actions: { review: "Geprüft", delete: "Gelöscht", update: "Geändert", create: "Erstellt", }, resourceTypes: { WorkSchedule: "Arbeitszeitplan", PayrollRun: "Lohnlauf", EmployeeDocument: "Dokument", Contract: "Vertrag", Advance: "Vorschuss", Absence: "Abwesenheit", Salary: "Gehalt", Employee: "Mitarbeiter", }, fields: { date: "Datum", actor: "Von", resource: "Datensatz", resourceType: "Typ", action: "Aktion", }, emptyMessage: "Für diesen Filter wurden noch keine Änderungen protokolliert.", emptyTitle: "Noch keine Aktivität", deleteSureMessage: "Diesen Eintrag löschen? Dies kann nicht rückgängig gemacht werden.", deleteTitle: "Protokolleintrag löschen", subtitle: "Wer hat was wann geändert.", title: "Prüfprotokoll", }, purchaseRequests: { status: { received: "Erhalten", }, fields: { requestedBy: "Angefordert von", quantity: "Menge", product: "Artikel", }, markReceived: "Als erhalten markieren", emptyMessage: "Keine Anforderungen entsprechen den Filtern.", emptyTitle: "Keine Bestellanforderungen", subtitle: "An den Einkauf gesendete Nachbestellungen und deren Antwort.", title: "Bestellanforderungen", }, production: { title: "Produktion", }, holidays: { title: "Feiertage", subtitle: "Die Feiertage des Jahres: ob das Unternehmen arbeitet und wie gearbeitete Stunden bezahlt werden.", downloadTemplate: "Vorlage herunterladen", import: "Excel importieren", add: "Feiertag hinzufügen", year: "Jahr", howItWorks: "Jedes Jahr: Vorlage herunterladen (Feiertage mit festem Datum sind bereits eingetragen), die religiösen Feiertage mit ihren offiziellen Daten ergänzen und importieren. Geschlossener Feiertag: niemand wird erwartet, und Stunden von Mitarbeitenden, die sich einstempeln, zählen als Feiertagsstunden. Bezahlung „doppelt“ fügt pro gearbeiteter Stunde einen weiteren Stundenlohn hinzu; „normal“ fügt nichts hinzu.", importDone: "Import abgeschlossen: {created} hinzugefügt, {updated} aktualisiert.", namePlaceholder: "Name des Feiertags (z. B. Aïd al-Fitr)", previewTitle: "Vorschau von {file}", previewErrors: "{count} Zeile(n) zu korrigieren — Datei korrigieren und erneut importieren", previewReady: "{count} Zeile(n) bereit zum Import", columns: { row: "Zeile", date: "Datum", name: "Name", open: "Unternehmen", pay: "Bezahlung bei Arbeit", check: "Prüfung" }, defaultClosed: "Geschlossen (Standard)", defaultDouble: "Doppelt (Standard)", open: "Geöffnet", closed: "Geschlossen", payDouble: "Doppelt", payNormal: "Normal", confirmImport: "Importieren", emptyTitle: "Noch keine Feiertage für {year}", emptyMessage: "Vorlage herunterladen, ausfüllen und importieren.", deleteTitle: "Feiertag löschen", deleteMessage: "„{name}“ löschen? Bereits erfasste Zeiten für diesen Tag bleiben erhalten.", errors: { load: "Feiertage konnten nicht geladen werden.", save: "Diese Änderung konnte nicht gespeichert werden.", template: "Die Vorlage konnte nicht heruntergeladen werden.", read: "Diese Datei konnte nicht gelesen werden.", import: "Der Import ist fehlgeschlagen." } }, myDepartment: { adminTitle: "Abteilungszugriff", adminSubtitle: "Alle Abteilungen, die Sie verantworten: Leitung, welche Positionen Modulzugriff haben und wer Zugriff hat.", adminEmptyTitle: "Noch keine Abteilungen.", noManagerAssigned: "Keine Leitung zugewiesen", title: "Meine Abteilung", subtitle: "Ihr Team und welche Positionen Zugriff auf das Modul der Abteilung haben.", loadError: "Ihre Abteilung konnte nicht geladen werden.", saveError: "Diese Änderung konnte nicht gespeichert werden.", saved: "Gespeichert.", accountsUpdated: "Gespeichert — {count} Konto/Konten aktualisiert.", emptyTitle: "Sie leiten noch keine Abteilung.", positionsTitle: "Positionen & Zugriff", positionsHint: "Aktivieren Sie eine Position, um allen Inhabern Zugriff auf das Modul der Abteilung zu geben. Alle anderen sehen nur „Mein Bereich“.", noModule: "Diese Abteilung schaltet kein Modul frei – es gibt keinen Zugriff zu verteilen.", noPositions: "Für diese Abteilung sind noch keine Positionen angelegt.", holders: "{count} Mitarbeiter", toggleLabel: "Gewährt Modulzugriff", teamTitle: "Team", noEmployees: "Keine Mitarbeiter in dieser Abteilung.", columns: { name: "Name", jobTitle: "Position", access: "Zugriff" }, noLogin: "Kein Konto", moduleAccess: "Modulzugriff", mySpaceOnly: "Nur Mein Bereich" },
    sidebar: { logistics: "Logistik", toDeliver: "Zu liefern", deliveryNotes: "Lieferscheine", tracking: "Projektverfolgung", workshops: "Werkstätten", chassisCatalog: "Fensterkatalog", productionConfig: "Produktionseinstellungen", sales: "Vertrieb", quotes: "Angebote", salesInvoices: "Rechnungen", receivables: "Forderungen", customers: "Kunden", projects: "Projekte", planning: "Planung", declarations: "Meldungen", leaveBalances: "Urlaubssalden", platform: "Plattform", clients: "Kunden", purchasingReports: "Einkaufsberichte", restock: "Nachbestellung", inventorySettings: "Einstellungen", purchaseRequests: "Bestellanforderungen", inventory: "Inventar", production: "Produktion", workSchedule: "Arbeitszeitplan", auditLog: "Prüfprotokoll", reports: "Berichte", orgChart: "Organigramm", attendance: "Anwesenheit", employeeDocuments: "Dokumente", contracts: "Verträge", payroll: "Lohnabrechnung", supplierInvoices: "Lieferantenrechnungen", purchasing: "Einkauf", purchaseRequestsQueue: "Bestellanforderungen", purchaseOrders: "Bestellungen", priceRequests: "Preisanfragen", suppliers: "Lieferanten", purchasingInventory: "Inventar", articleHistory: "Artikelhistorie", holidays: "Feiertage", departmentAccess: "Abteilungszugriff", myDepartment: "Meine Abteilung", mySpace: "Mein Bereich", myProfile: "Mein Profil", myPayslips: "Meine Gehaltsabrechnungen", myAbsences: "Meine Abwesenheiten", myAdvances: "Meine Vorschüsse", myAttendance: "Meine Anwesenheit", myRecords: "Meine Akte",
      leaveCalendar: "Abwesenheitskalender",
      performanceReviews: "Leistungsbeurteilungen",
      disciplinaryActions: "Disziplinarmaßnahmen",
      admin: "Verwaltung",
      settings: "Einstellungen",
      help: "Hilfe und Support",
      profile: "Profil",
      hr: "Personalwesen",

      companies: "Unternehmen",
      organization: "Organisation",
      company: "Unternehmen",
      employees: "Mitarbeiter",
      salaries: "Gehälter",
      absences: "Abwesenheiten",
      advances: "Vorschüsse",
      users: "Benutzer",
      departments: "Abteilungen",
      jobPositions: "Positionen",
      rolesPermissions: "Rollen und Berechtigungen",
      locations: "Standorte",
      documents: "Dokumente",
      preferences: "Einstellungen",
      integrations: "Integrationen",

      dark: "Dunkel",
      light: "Hell",

      logout: "Abmelden",

      closeSidebar:
        "Seitenleiste schließen",

      openSidebar:
        "Seitenleiste öffnen",

      switchTheme:
        "Zu {theme}-Modus wechseln",

      dashboard:
        "Dashboard",
    },

    common: { yes: "Ja", no: "Nein", home: "Startseite", breadcrumb: "Brotkrümelnavigation", clear: "Leeren", clearSearch: "Suche löschen", nextPage: "Nächste Seite", previousPage: "Vorherige Seite", pagination: "Seitennavigation", hidePassword: "Passwort verbergen", showPassword: "Passwort anzeigen", somethingWentWrong: "Etwas ist schiefgelaufen", confirmAction: "Aktion bestätigen", pageNotFoundHint: "Diese Seite existiert nicht oder wurde verschoben.", pageNotFound: "Seite nicht gefunden", status: "Status", save: "Speichern", back: "Zurück", dateFrom: "Von", dateTo: "Bis",
      welcome: "Willkommen",
      goodbye: "Auf Wiedersehen",
      loading: "Wird geladen...",
      error: "Fehler",
      fail: "Fehlgeschlagen",
      success: "Erfolg",
      update: "Aktualisieren",
      cancel: "Abbrechen",
      delete: "Löschen",
      confirm: "Bestätigen",
      close: "Schließen",
      edit: "Bearbeiten",
      reset: "Zurücksetzen",
      create: "Erstellen",
      noResults: "Keine Ergebnisse gefunden",
      chooseFile: "Datei auswählen",
      noFileChosen: "Keine Datei ausgewählt",
    },

    profile: { loadFailed: "Profil konnte nicht geladen werden",
      settings: "Einstellungen",

      firstName: "Vorname",
      lastName: "Nachname",
      email: "E-Mail",
      password: "Passwort",

      currentPassword: "Aktuelles Passwort",
      newPassword: "Neues Passwort",

      updateSureMessage:
        "Möchten Sie Ihr Profil wirklich aktualisieren?",

      updateFailMessage:
        "Ihr Profil konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.",

      updateSuccessMessage:
        "Ihr Profil wurde erfolgreich aktualisiert.",

      bothPasswords:
        "Aktuelles und neues Passwort sind erforderlich.",

      info: "Informationen",
    },

    company: { workflow: { accountInvalid: "Ein Buchhaltungskonto hat 4 bis 10 Ziffern.", purchaseAccountHint: "Wird im Buchhaltungsexport für Artikel ohne eigenes Kategoriekonto und für frei eingegebene Positionen verwendet (z. B. 6111, 6121, 6125).", purchaseAccount: "Standard-Einkaufskonto", purchaseThresholdHint: "Bestellungen ab diesem Betrag (inkl. MwSt.) müssen von einem Admin, dem Inhaber oder der Einkaufsleitung freigegeben werden. 0 = keine Freigabe.", purchaseThreshold: "Freigabegrenze für Bestellungen", title: "Genehmigungsablauf", sequentialApproval: "Genehmigung durch Vorgesetzte vor HR", sequentialApprovalHint: "Wenn aktiviert, müssen Abwesenheits- und Vorschussanträge zuerst vom Vorgesetzten genehmigt werden und erhalten danach die endgültige Freigabe durch HR. Mitarbeiter ohne Vorgesetzten gehen direkt an HR.", saveFailed: "Diese Einstellung konnte nicht gespeichert werden." },
      title:
        "Unternehmen",

      subtitle:
        "Unternehmensinformationen verwalten",

      emptySubtitle:
        "Noch kein Unternehmen eingerichtet",

      emptyTitle:
        "Kein Unternehmen",

      emptyMessage:
        "Richten Sie Ihr Unternehmensprofil ein, um zu beginnen.",

      create:
        "Unternehmen erstellen",

      editTitle:
        "Unternehmen bearbeiten",

      name:
        "Unternehmensname",

      tradeName:
        "Handelsname",

      legalForm:
        "Rechtsform",

      industry:
        "Branche",

      ice:
        "ICE",

      taxId:
        "Steuer-ID",

      registrationNumber:
        "Handelsregisternummer",

      email:
        "E-Mail",

      phone:
        "Telefon",

      website:
        "Website",

      street:
        "Straße",

      city:
        "Stadt",

      postalCode:
        "Postleitzahl",

      logo:
        "Unternehmenslogo",

      employeeCount:
        "Mitarbeiter",

      section: {
        identity:
          "Identität",

        legal:
          "Rechtliche Informationen",

        contact:
          "Kontakt",
      },

      createTitle:
        "Unternehmen erstellen",

      createSureMessage:
        "Möchten Sie dieses Unternehmen wirklich erstellen?",

      createSuccessTitle:
        "Unternehmen erstellt",

      createSuccessMessage:
        "Das Unternehmen wurde erfolgreich erstellt.",

      createFailTitle:
        "Erstellung fehlgeschlagen",

      updateSureMessage:
        "Möchten Sie diese Änderungen wirklich speichern?",

      updateSuccessMessage:
        "Das Unternehmen wurde erfolgreich aktualisiert.",

      saveFailMessage:
        "Beim Speichern des Unternehmens ist ein Fehler aufgetreten.",

      loadFailTitle:
        "Laden fehlgeschlagen",

      loadFailMessage:
        "Die Unternehmensinformationen konnten nicht geladen werden.",

      downloadFiche:
        "Datenblatt herunterladen",

      deleteCompany:
        "Unternehmen löschen",

      deleteTitle:
        "Unternehmen löschen",

      deleteSureMessage:
        "Möchten Sie dieses Unternehmen wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",

      deleteSuccessTitle:
        "Unternehmen gelöscht",

      deleteSuccessMessage:
        "Das Unternehmen wurde erfolgreich gelöscht.",

      deleteFailTitle:
        "Löschen fehlgeschlagen",

      deleteFailMessage:
        "Beim Löschen des Unternehmens ist ein Fehler aufgetreten.",

      errors: {
        deleteAdminOnly:
          "Nur Administratoren oder der Eigentümer des Unternehmens können es löschen.",

        notFound:
          "Unternehmen nicht gefunden.",

        deleteNotAuthorized:
          "Sie sind nicht berechtigt, dieses Unternehmen zu löschen.",

        updateNotAuthorized:
          "Sie sind nicht berechtigt, dieses Unternehmen zu aktualisieren.",

        viewNotAuthorized:
          "Sie sind nicht berechtigt, dieses Unternehmen anzuzeigen.",

        ficheDownloadFailed:
          "Fehler beim Erstellen des Unternehmensdatenblatts.",

        duplicateCompany:
          "Ein Unternehmen mit dieser ICE, Steuer-ID, Registrierungsnummer oder CNSS-Nummer existiert bereits.",

        createFailed:
          "Fehler beim Erstellen des Unternehmens.",

        updateFailed:
          "Fehler beim Aktualisieren des Unternehmens.",

        deleteFailed:
          "Fehler beim Löschen des Unternehmens.",

        logoNotFound:
          "Unternehmenslogo nicht gefunden.",

        logoRequired:
          "Bitte wählen Sie ein Logo aus.",

        logoUploadFailed:
          "Fehler beim Hochladen des Logos.",

        logoDeleteFailed:
          "Fehler beim Löschen des Logos.",
      },
    },

    users: {
      title:
        "Benutzer",

      subtitle:
        "Benutzerkonten und Zugriffe verwalten.",

      addUser:
        "Benutzer hinzufügen",

      newUser:
        "Neuer Benutzer",

      createSubtitle:
        "Ein neues Benutzerkonto erstellen.",

      information:
        "Benutzerinformationen",

      role:
        "Rolle",

      status:
        "Status",

      userId:
        "Benutzer-ID",

      roles: {
        admin:
          "Administrator",

        owner:
          "Eigentümer",

        user:
          "Benutzer",
      },

      statuses: {
        active:
          "Aktiv",

        inactive:
          "Inaktiv",

        suspended:
          "Gesperrt",
      },

      emptyTitle:
        "Keine Benutzer",

      emptyMessage:
        "Derzeit gibt es keine Benutzer in Ihrer Organisation.",

      backToUsers:
        "Benutzer",

      createTitle:
        "Benutzer erstellen",

      createSureMessage:
        "Möchten Sie diesen Benutzer wirklich erstellen?",

      createSuccessTitle:
        "Benutzer erstellt",

      createSuccessMessage:
        "Der Benutzer wurde erfolgreich erstellt.",

      createFailTitle:
        "Erstellung fehlgeschlagen",

      createFailMessage:
        "Der Benutzer konnte nicht erstellt werden.",

      loadFailTitle:
        "Laden fehlgeschlagen",

      loadFailMessage:
        "Die Benutzer konnten nicht geladen werden. Bitte versuchen Sie es erneut.",

      deleteUser:
        "Benutzer löschen",

      deleteTitle:
        "Benutzer löschen",

      deleteSureMessage:
        "Möchten Sie diesen Benutzer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",

      deleteSuccessTitle:
        "Benutzer gelöscht",

      deleteSuccessMessage:
        "Der Benutzer wurde erfolgreich gelöscht.",

      deleteFailTitle:
        "Löschen fehlgeschlagen",

      deleteFailMessage:
        "Beim Löschen des Benutzers ist ein Fehler aufgetreten.",

      errors: {
        deleteAdminOnly:
          "Nur Administratoren können Benutzer löschen.",

        notFound:
          "Benutzer nicht gefunden.",

        updateNotAuthorized:
          "Sie sind nicht berechtigt, diesen Benutzer zu aktualisieren.",

        passwordNotAuthorized:
          "Sie sind nicht berechtigt, dieses Passwort zu ändern.",

        requiredCreateFields:
          "Bitte geben Sie Vorname, Nachname, E-Mail und Passwort an.",

        requiredUpdateFields:
          "Bitte geben Sie Vorname, Nachname und E-Mail an.",

        requiredPasswordFields:
          "Bitte geben Sie das aktuelle und das neue Passwort an.",

        emailExists:
          "Ein Benutzer mit dieser E-Mail existiert bereits.",

        currentPasswordIncorrect:
          "Das aktuelle Passwort ist falsch.",
      },

      editUser: "Benutzer bearbeiten",
      editSubtitle: "Aktualisieren Sie die Kontoinformationen dieses Benutzers.",
      inheritedFromEmployee: "Abteilung und HR-Rolle werden vom verknüpften Mitarbeiter {name} ({department} — {jobTitle}) übernommen. Ändern Sie stattdessen die Abteilung oder Stellenbezeichnung des Mitarbeiters.",

      updateTitle: "Benutzer bearbeiten",
      updateSureMessage: "Möchten Sie diese Änderungen wirklich speichern?",

      updateSuccessTitle: "Benutzer aktualisiert",
      updateSuccessMessage: "Der Benutzer wurde erfolgreich aktualisiert.",

      updateFailTitle: "Aktualisierung fehlgeschlagen",
      updateFailMessage: "Der Benutzer konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.",

      hrRole: {
        label: "HR-Position",
        notApplicable: "Nicht zutreffend (kein HR)",
        assistant: "HR-Assistent(in)",
        officer: "HR-Sachbearbeiter(in)",
        manager: "HR-Verantwortliche(r)",
        director: "HR-Direktor(in)",
      },

      department: "Abteilung",
      departments: {
          management: "Geschäftsleitung",
          hr: "Personalwesen",
          finance: "Finanzen",
          accounting: "Buchhaltung",
          sales: "Vertrieb",
          purchasing: "Einkauf",
          marketing: "Marketing",
          production: "Produktion",
          production_planning: "Produktionsplanung",
          quality_control: "Qualitätskontrolle",
          maintenance: "Instandhaltung",
          warehouse: "Lager",
          logistics: "Logistik",
          procurement: "Beschaffung",
          engineering: "Technik",
          design: "Design",
          research_development: "Forschung & Entwicklung",
          it: "IT",
          customer_service: "Kundenservice",
          administration: "Verwaltung",
          health_safety_environment: "Arbeitsschutz & Umwelt",
          security: "Sicherheit",
      },

      emptySearchTitle: "Keine Ergebnisse",
      emptySearchMessage: "Kein Benutzer entspricht Ihrer Suche.",

      toolbar: {
        searchPlaceholder: "Benutzer suchen...",
      },
    },
    employees: { related: { tabs: { attendance: "Anwesenheit", documents: "Dokumente", contracts: "Verträge", advances: "Vorschüsse", absences: "Abwesenheiten", salary: "Gehalt", }, empty: "Noch nichts vorhanden.", }, linkedUser: { resetPasswordSureMessage: "Neues temporäres Passwort erzeugen? Das aktuelle Passwort funktioniert dann nicht mehr.", resetPasswordTitle: "Passwort zurücksetzen", resetPassword: "Passwort zurücksetzen", loginNotCreatedTitle: "Mitarbeiter angelegt, aber noch ohne Zugang", loginCreatedMessage: "E-Mail: {email}\nTemporäres Passwort: {password}\n\nGib es dem Mitarbeiter — es wird nicht erneut angezeigt.", loginCreatedTitle: "Zugang angelegt", createLoginSureMessage: "Neuen Self-Service-Zugang anlegen? Ein temporäres Passwort wird erzeugt und nur einmal angezeigt.", createLoginTitle: "Zugang anlegen", createLogin: "Neuen Zugang anlegen", orCreateNew: "oder", actionFailed: "Etwas ist schiefgelaufen. Bitte erneut versuchen.", searchPlaceholder: "Benutzer nach Name oder E-Mail suchen...", unlinkSureMessage: "Verknüpfung lösen? Der Mitarbeiter verliert den Zugriff auf „Mein Bereich“.", unlinkTitle: "Verknüpfung des Benutzerkontos lösen", linkSureMessage: "Dieses Benutzerkonto mit dem Mitarbeiter verknüpfen? Er erhält Zugriff auf „Mein Bereich“ (Abrechnungen, Abwesenheits- und Vorschussanträge, Anwesenheit).", linkTitle: "Benutzerkonto verknüpfen", unlink: "Verknüpfung lösen", link: "Verknüpfen", linkedTo: "Verknüpft mit:", title: "Self-Service-Zugang", },
      title: "Mitarbeiter",
      subtitle: "Verwalten Sie die Mitarbeiter Ihres Unternehmens und deren Personaldaten.",
      addEmployee: "Mitarbeiter hinzufügen",
      backToEmployees: "Zurück zu den Mitarbeitern",
      editEmployee: "Mitarbeiter bearbeiten",
      newEmployee: "Neuer Mitarbeiter",
      employeeInformation: "Mitarbeiterinformationen",
      loadFailTitle: "Mitarbeiter konnten nicht geladen werden",
      loadFailMessage: "Beim Laden der Mitarbeiter ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
      loadCompaniesFailMessage: "Beim Laden der Unternehmen ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",

      createTitle: "Mitarbeiter hinzufügen",
      createSureMessage: "Möchten Sie diesen Mitarbeiter wirklich anlegen?",
      createSuccessTitle: "Mitarbeiter angelegt",
      createSuccessMessage: "Der Mitarbeiter wurde erfolgreich angelegt.",
      createFailTitle: "Mitarbeiter konnte nicht angelegt werden",
      createFailMessage: "Beim Anlegen des Mitarbeiters ist ein Fehler aufgetreten.",

      updateTitle: "Mitarbeiter bearbeiten",
      updateSureMessage: "Möchten Sie diese Änderungen wirklich speichern?",
      updateSuccessTitle: "Mitarbeiter aktualisiert",
      updateSuccessMessage: "Der Mitarbeiter wurde erfolgreich aktualisiert.",
      updateFailTitle: "Mitarbeiter konnte nicht aktualisiert werden",
      updateFailMessage: "Beim Aktualisieren des Mitarbeiters ist ein Fehler aufgetreten.",

      deleteTitle: "Mitarbeiter löschen",
      deleteSureMessage: "Möchten Sie {name} wirklich löschen? Dies kann nicht rückgängig gemacht werden.",
      deleteSuccessTitle: "Mitarbeiter gelöscht",
      deleteSuccessMessage: "Der Mitarbeiter wurde gelöscht.",
      deleteFailTitle: "Mitarbeiter konnte nicht gelöscht werden",
      deleteFailMessage: "Beim Löschen des Mitarbeiters ist ein Fehler aufgetreten.",

      selectCompanyRequired: "Bitte wählen Sie ein Unternehmen aus.",
      invalidPhotoType: "Bitte wählen Sie eine Bilddatei aus.",

      toolbar: {
        company: "Unternehmen",
        selectCompany: "Unternehmen auswählen",
        loadingCompanies: "Unternehmen werden geladen...",
        searchPlaceholder: "Mitarbeiter suchen...",
      },

      companyInfo: {
        employeeCount_one: "{count} Mitarbeiter",
        employeeCount_other: "{count} Mitarbeiter",
      },

      emptyNoCompany: {
        title: "Keine Unternehmen gefunden",
        message: "Legen Sie zuerst ein Unternehmen an, bevor Sie Mitarbeiter hinzufügen.",
      },

      emptyNoEmployees: {
        title: "Keine Mitarbeiter gefunden",
        messageSearch: "Kein Mitarbeiter entspricht Ihrer Suche.",
        messageDefault: "Dieses Unternehmen hat noch keine Mitarbeiter.",
        cta: "Mitarbeiter hinzufügen",
      },

      loading: "Mitarbeiter werden geladen...",

      photo: {
        label: "Mitarbeiterfoto",
        choose: "Foto auswählen",
        change: "Foto ändern",
        remove: "Entfernen",
      },

      company: {
        label: "Unternehmen",
        selectPlaceholder: "Unternehmen auswählen",
        unnamed: "Unbenanntes Unternehmen",
      },

      sections: {
        personalInformation: "Persönliche Angaben",
        contactInformation: "Kontaktinformationen",
        employment: "Beschäftigung",
        identification: "Identifikation",
        company: "Unternehmen",
        notes: "Notizen",
      },

      documents: {
        menuButton: "Dokumente",
        attestationTravail: "Arbeitsbescheinigung",
        attestationSalaire: "Arbeits- und Gehaltsbescheinigung",
        certificatTravail: "Arbeitszeugnis",
        contratTravail: "Arbeitsvertrag",
        soldeToutCompte: "Restschuldbescheinigung (Endabrechnung)",
        generationFailed: "Fehler beim Erstellen des Dokuments.",
      },

      bulkImport: {
        exportButton: "Exportieren (CSV)",
        exportFailed: "Mitarbeiter konnten nicht exportiert werden.",
        openButton: "Importieren (CSV)",
        title: "Mitarbeiter im Massenimport anlegen",
        helpText: "Laden Sie eine CSV-Datei hoch, um mehrere Mitarbeiter gleichzeitig anzulegen. Jede Zeile wird zuerst geprüft — es wird erst nach Ihrer Bestätigung etwas erstellt.",
        downloadTemplate: "CSV-Vorlage herunterladen",
        preview: "Datei prüfen",
        previewing: "Wird geprüft...",
        previewFailed: "Diese Datei konnte nicht gelesen werden.",
        summaryValid: "{count} importbereit",
        summaryErrors: "{count} mit Fehlern",
        summaryWarnings: "{count} mit Warnungen",
        rowOk: "Sieht gut aus",
        fixErrorsFirst: "Beheben Sie die fehlerhaften Zeilen und laden Sie die Datei erneut hoch, bevor Sie importieren — Zeilen mit nur Warnungen werden trotzdem importiert.",
        importButton: "{count} Mitarbeiter importieren",
        committing: "Wird importiert...",
        commitFailed: "Der Import konnte nicht abgeschlossen werden.",
        commitSuccess: "{count} Mitarbeiter erfolgreich importiert.",
      },

      fields: { createLoginCheckboxLabel: "Auch einen Self-Service-Zugang für diesen Mitarbeiter anlegen (mit seiner Arbeits-E-Mail)", createLogin: "Self-Service-Zugang", noDepartments: "Noch keine Abteilungen — lege eine unter Organisation > Abteilungen an", manager: "Vorgesetzte(r)", noManagerCandidates: "Noch keine weiteren Mitarbeiter in diesem Unternehmen",
        employeeNumber: "Personalnummer",
        employeeNumberPlaceholder: "EMP-001",

        firstName: "Vorname",
        firstNamePlaceholder: "Vorname",

        lastName: "Nachname",
        lastNamePlaceholder: "Nachname",

        firstNameArabic: "Vorname (Arabisch)",
        firstNameArabicPlaceholder: "الاسم الأول",

        lastNameArabic: "Nachname (Arabisch)",
        lastNameArabicPlaceholder: "اسم العائلة",

        gender: "Geschlecht",
        genderPlaceholder: "Geschlecht auswählen",

        dateOfBirth: "Geburtsdatum",

        placeOfBirth: "Geburtsort",
        placeOfBirthPlaceholder: "Stadt",

        nationality: "Staatsangehörigkeit",
        nationalityPlaceholder: "Marokkanisch",

        maritalStatus: "Familienstand",
        maritalStatusPlaceholder: "Status auswählen",

        numberOfDependents: "Unterhaltsberechtigte",

        cin: "CIN",
        cinPlaceholder: "AB123456",

        passportNumber: "Passnummer",
        passportNumberPlaceholder: "Passnummer",

        passportExpiryDate: "Ablauf des Reisepasses",

        workPermitNumber: "Arbeitserlaubnisnummer",
        workPermitNumberPlaceholder: "Erlaubnisnummer",

        workPermitExpiryDate: "Ablauf der Arbeitserlaubnis",

        personalEmail: "Private E-Mail",
        personalEmailPlaceholder: "privat@email.com",

        workEmail: "Geschäftliche E-Mail",
        workEmailPlaceholder: "mitarbeiter@unternehmen.com",

        phone: "Telefon",
        phonePlaceholder: "+212...",

        secondaryPhone: "Zweite Telefonnummer",
        secondaryPhonePlaceholder: "+212...",

        street: "Straße",
        streetPlaceholder: "Adresse",

        city: "Stadt",
        cityPlaceholder: "Stadt",

        region: "Region",
        regionPlaceholder: "Region",

        postalCode: "Postleitzahl",
        postalCodePlaceholder: "40000",

        country: "Land",
        countryPlaceholder: "Marokko",

        emergencyName: "Notfallkontakt",
        emergencyNamePlaceholder: "Vollständiger Name",

        emergencyRelationship: "Beziehung",
        emergencyRelationshipPlaceholder: "Ehepartner, Elternteil...",

        emergencyPhone: "Notfalltelefon",
        emergencyPhonePlaceholder: "+212...",

        emergencyEmail: "Notfall-E-Mail",
        emergencyEmailPlaceholder: "email@beispiel.com",

        hireDate: "Einstellungsdatum",
        terminationDate: "Austrittsdatum",

        employmentStatus: "Beschäftigungsstatus",
        employmentStatusPlaceholder: "Status auswählen",

        employmentType: "Vertragsart",
        employmentTypePlaceholder: "Art auswählen",

        jobTitle: "Berufsbezeichnung",
        jobTitlePlaceholder: "Produktionsleiter",

        department: "Abteilung",
        departmentPlaceholder: "Produktion",

        service: "Bereich",
        servicePlaceholder: "Montage",

        position: "Position",
        positionPlaceholder: "Bediener",

        workLocation: "Arbeitsort",
        workLocationPlaceholder: "Fabrik",

        cnssNumber: "CNSS-Nummer",
        cnssNumberPlaceholder: "CNSS-Nummer",

        cnssRegistrationDate: "CNSS-Registrierungsdatum",

        taxIdentificationNumber: "Steueridentifikationsnummer",
        taxIdentificationNumberPlaceholder: "Steuer-ID",

        taxStatus: "Steuerstatus",
        taxStatusPlaceholder: "Steuerstatus",

        numberOfChildren: "Anzahl der Kinder",

        spouseWorking: "Ehepartner berufstätig",
        spouseWorkingCheckboxLabel: "Der Ehepartner ist derzeit berufstätig",

        bankName: "Bankname",
        bankNamePlaceholder: "Bank",

        accountName: "Kontoinhaber",
        accountNamePlaceholder: "Kontoinhaber",

        rib: "RIB",
        ribPlaceholder: "RIB",

        iban: "IBAN",
        ibanPlaceholder: "IBAN",

        paymentMethod: "Zahlungsmethode",
        paymentMethodPlaceholder: "Methode auswählen",

        notes: "Notizen",
        notesPlaceholder: "Zusätzliche Notizen...",

        isActive: "Aktiv",
        isActiveCheckboxLabel: "Der Mitarbeiter ist aktiv",
      },

      genders: {
        male: "Männlich",
        female: "Weiblich",
        other: "Divers",
      },

      maritalStatuses: {
        single: "Ledig",
        married: "Verheiratet",
        divorced: "Geschieden",
        widowed: "Verwitwet",
        other: "Sonstiges",
      },

      taxStatus: {
        taxable: "Steuerpflichtig",
        nonTaxable: "Nicht steuerpflichtig",
        exempt: "Befreit",
      },

      statuses: {
        active: "Aktiv",
        inactive: "Inaktiv",
        on_leave: "Beurlaubt",
        suspended: "Suspendiert",
        terminated: "Vertrag beendet",
        unknown: "Unbekannt",
      },

      employmentTypes: {
        permanent: "Unbefristet",
        fixed_term: "Befristet",
        temporary: "Vorübergehend",
        intern: "Praktikant",
        apprentice: "Auszubildender",
        freelance: "Freiberuflich",
        part_time: "Teilzeit",
        other: "Sonstiges",
      },

      paymentMethods: {
        bank_transfer: "Banküberweisung",
        cash: "Bar",
        check: "Scheck",
      },

      card: {
        view: "Anzeigen",
        edit: "Bearbeiten",
      },

      detail: {
        employeeLabel: "Mitarbeiter",
        firstName: "Vorname",
        lastName: "Nachname",
        gender: "Geschlecht",
        dateOfBirth: "Geburtsdatum",
        nationality: "Staatsangehörigkeit",
        maritalStatus: "Familienstand",
        phone: "Telefon",
        email: "E-Mail",
        address: "Adresse",
        jobTitle: "Berufsbezeichnung",
        department: "Abteilung",
        employmentType: "Vertragsart",
        hireDate: "Einstellungsdatum",
        workLocation: "Arbeitsort",
        service: "Bereich",
        cin: "CIN",
        passport: "Reisepass",
        cnssNumber: "CNSS-Nummer",
        taxId: "Steuer-ID",
        empty: "—",
      },

      buttons: {
        save: "Wird gespeichert...",
        createEmployee: "Mitarbeiter anlegen",
        updateEmployee: "Mitarbeiter aktualisieren",
        cancel: "Abbrechen",
      },

      breadcrumbs: {
        hr: "Personal",
        employees: "Mitarbeiter",
        addEmployee: "Mitarbeiter hinzufügen",
        editEmployee: "Mitarbeiter bearbeiten",
      },

      errors: {
        companyRequired: "Bitte wählen Sie ein Unternehmen aus.",
        invalidPhoto: "Bitte wählen Sie eine Bilddatei aus.",
        fetchCompaniesFailed: "Unternehmen konnten nicht abgerufen werden",
        fetchEmployeesFailed: "Mitarbeiter konnten nicht abgerufen werden",
        createFailed: "Mitarbeiter konnte nicht angelegt werden",
        updateFailed: "Mitarbeiter konnte nicht aktualisiert werden",
        deleteFailed: "Mitarbeiter konnte nicht gelöscht werden",
        notFound: "Mitarbeiter nicht gefunden",
        duplicateEmployeeNumber: "Ein Mitarbeiter mit dieser Nummer existiert bereits",
        requiredFields: "Bitte füllen Sie alle Pflichtfelder aus",
      },
    },
    salaries: {
      title: "Gehälter",
      subtitle: "Verwalten Sie die Vergütung und Gehaltshistorie der Mitarbeiter.",
      addSalary: "Gehalt hinzufügen",
      giveRaise: "Gehaltserhöhung gewähren",

      createTitle: "Neuer Gehaltseintrag",
      createSureMessage: "Möchten Sie dieses Gehalt wirklich speichern? Das aktuelle Gehalt dieses Mitarbeiters wird zu diesem Stichtag beendet.",
      createSuccessTitle: "Gehalt gespeichert",
      createSuccessMessage: "Der Gehaltseintrag wurde erfolgreich angelegt.",

      deleteTitle: "Gehaltseintrag löschen",
      deleteSureMessage: "Möchten Sie diesen Gehaltseintrag wirklich löschen? Dies kann nicht rückgängig gemacht werden.",

      emptyTitle: "Keine Gehälter",
      emptyMessage: "Für dieses Unternehmen gibt es noch keine Gehaltseinträge.",

      fields: {
        employee: "Mitarbeiter",
        employeeSearchPlaceholder: "Suche nach Name, Nummer, CIN, CNSS...",
        baseSalary: "Grundgehalt",
        effectiveDate: "Stichtag",
        notes: "Notizen",
        notesPlaceholder: "Grund für diese Änderung, zusätzlicher Kontext...",
      },

      table: {
        base: "Grundgehalt",
        gross: "Brutto",
        net: "Netto",
        endDate: "Enddatum",
        status: "Status",
        ongoing: "Laufend",
      },

      actions: {
        history: "Verlauf anzeigen",
      },

      history: { deleteRecord: "Diesen Gehaltseintrag löschen",
        titleFor: "Gehaltsverlauf — {name}",
        empty: "Kein Gehaltsverlauf für diesen Mitarbeiter.",
        current: "Aktuell",
        past: "Vergangen",
      },

      breadcrumbs: {
        hr: "Personal",
        salaries: "Gehälter",
      },

      buttons: {
        create: "Gehalt speichern",
      },

      errors: {
        fetchFailed: "Gehälter konnten nicht geladen werden",
        actionFailed: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
      },
    },
    absences: {
      title: "Abwesenheiten",
      subtitle: "Prüfen und verwalten Sie Urlaubs- und Abwesenheitsanträge.",
      addAbsence: "Neuer Abwesenheitsantrag",

      createTitle: "Neuer Abwesenheitsantrag",
      createSureMessage: "Möchten Sie diesen Abwesenheitsantrag wirklich einreichen?",
      createSuccessTitle: "Antrag eingereicht",
      createSuccessMessage: "Der Abwesenheitsantrag wurde erfolgreich eingereicht.",

      acceptTitle: "Abwesenheit genehmigen",
      acceptSureMessage: "Möchten Sie diesen Abwesenheitsantrag wirklich genehmigen?",

      rejectTitle: "Abwesenheit ablehnen",
      rejectSureMessage: "Möchten Sie diesen Abwesenheitsantrag wirklich ablehnen?",

      deleteTitle: "Abwesenheit löschen",
      deleteSureMessage: "Möchten Sie diesen Abwesenheitseintrag wirklich löschen? Dies kann nicht rückgängig gemacht werden.",

      emptyTitle: "Keine Abwesenheiten",
      emptyMessage: "Kein Abwesenheitsantrag entspricht Ihren Filtern.",

      unjustified: "Unentschuldigt",

      fields: {
        employee: "Mitarbeiter",
        employeeSearchPlaceholder: "Suche nach Name, Nummer, CIN, CNSS...",
        type: "Art",
        startDate: "Startdatum",
        endDate: "Enddatum",
        halfDay: "Halber Tag",
        justified: "Entschuldigt",
        reason: "Grund",
        reasonPlaceholder: "Grund oder zusätzlicher Kontext...",
        reviewComment: "Prüfkommentar",
        status: "Status",
      },

      types: {
        paid_leave: "Bezahlter Urlaub",
        unpaid_leave: "Unbezahlter Urlaub",
        sick_leave: "Krankheitsurlaub",
        absence: "Abwesenheit",
        other: "Sonstiges",
      },

      status: { manager_approved: "Vom Vorgesetzten genehmigt",
        pending: "Ausstehend",
        accepted: "Genehmigt",
        rejected: "Abgelehnt",
      },

      filters: {
        allStatuses: "Alle Status",
        allTypes: "Alle Arten",
      },

      table: {
        period: "Zeitraum",
        days: "Tage",
      },

      actions: {
        accept: "Genehmigen",
        reject: "Ablehnen",
      },

      breadcrumbs: {
        hr: "Personal",
        absences: "Abwesenheiten",
      },

      buttons: {
        create: "Antrag einreichen",
      },

      errors: {
        fetchFailed: "Abwesenheiten konnten nicht geladen werden",
        actionFailed: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
      },
    },
    advances: {
      title: "Vorschüsse",
      subtitle: "Prüfen und verwalten Sie Gehaltsvorschussanträge.",
      addAdvance: "Neuer Vorschussantrag",

      createTitle: "Neuer Vorschussantrag",
      createSureMessage: "Möchten Sie diesen Vorschussantrag wirklich einreichen?",
      createSuccessTitle: "Antrag eingereicht",
      createSuccessMessage: "Der Vorschussantrag wurde erfolgreich eingereicht.",

      acceptTitle: "Vorschuss genehmigen",
      acceptSureMessage: "Möchten Sie diesen Vorschussantrag wirklich genehmigen?",

      rejectTitle: "Vorschuss ablehnen",
      rejectSureMessage: "Möchten Sie diesen Vorschussantrag wirklich ablehnen?",

      markRepaidTitle: "Als zurückgezahlt markieren",
      markRepaidSureMessage: "Möchten Sie diesen Vorschuss wirklich als vollständig zurückgezahlt markieren?",

      deleteTitle: "Vorschuss löschen",
      deleteSureMessage: "Möchten Sie diesen Vorschusseintrag wirklich löschen? Dies kann nicht rückgängig gemacht werden.",

      emptyTitle: "Keine Vorschüsse",
      emptyMessage: "Kein Vorschussantrag entspricht Ihren Filtern.",

      fields: {
        employee: "Mitarbeiter",
        employeeSearchPlaceholder: "Suche nach Name, Nummer, CIN, CNSS...",
        amount: "Betrag",
        requestDate: "Antragsdatum",
        reason: "Grund",
        reasonPlaceholder: "Grund oder zusätzlicher Kontext...",
        reviewComment: "Prüfkommentar",
        status: "Status",
      },

      status: { manager_approved: "Vom Vorgesetzten genehmigt",
        pending: "Ausstehend",
        accepted: "Genehmigt",
        rejected: "Abgelehnt",
      },

      filters: {
        allStatuses: "Alle Status",
      },

      table: {
        remaining: "Verbleibend",
        fullyRepaid: "Vollständig zurückgezahlt",
      },

      actions: {
        accept: "Genehmigen",
        reject: "Ablehnen",
        markRepaid: "Als zurückgezahlt markieren",
      },

      breadcrumbs: {
        hr: "Personal",
        advances: "Vorschüsse",
      },

      buttons: {
        create: "Antrag einreichen",
      },

      errors: {
        fetchFailed: "Vorschüsse konnten nicht geladen werden",
        actionFailed: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
      },
    },

    units: {
      unit: "Einheit",
      piece: "Stück",
      pair: "Paar",
      dozen: "Dutzend",
      set: "Set",
      kg: "Kilogramm (kg)",
      g: "Gramm (g)",
      t: "Tonne (t)",
      lb: "Pfund (lb)",
      oz: "Unze (oz)",
      quintal: "Zentner (q)",
      l: "Liter (L)",
      ml: "Milliliter (mL)",
      m3: "Kubikmeter (m³)",
      gal: "Gallone (gal)",
      m: "Meter (m)",
      cm: "Zentimeter (cm)",
      mm: "Millimeter (mm)",
      km: "Kilometer (km)",
      ft: "Fuß (ft)",
      in: "Zoll (in)",
      yd: "Yard (yd)",
      m2: "Quadratmeter (m²)",
      ft2: "Quadratfuß (ft²)",
      ha: "Hektar (ha)",
      box: "Box",
      carton: "Karton",
      pallet: "Palette",
      bag: "Sack (Beutel)",
      sack: "Sack",
      bottle: "Flasche",
      can: "Dose",
      roll: "Rolle",
      sheet: "Blatt",
      bundle: "Bündel",
      case: "Kiste",
      drum: "Fass",
      barrel: "Ölfass",
      container: "Container",
      hour: "Stunde",
      day: "Tag",
      month: "Monat",
    },

    contentTranslation: {
      title: "Übersetzungen",
      editButton: "Übersetzungen",
      original: "Original",
      auto: "Automatisch übersetzt",
      manual: "Manuell bearbeitet",
      missing: "Noch nicht übersetzt",
      regenerate: "Neu generieren",
      originalHint: "Dies ist der Originaltext — bearbeiten Sie das Feld selbst, um ihn zu ändern.",
      save: "Speichern",
      saving: "Wird gespeichert…",
      close: "Schließen",
      placeholder: "Übersetzung eingeben…",
      errors: {
        loadFailed: "Übersetzungen konnten nicht geladen werden.",
        saveFailed: "Übersetzung konnte nicht gespeichert werden.",
        regenerateFailed: "Übersetzung konnte nicht neu generiert werden.",
      },
    },

    departments: { noManagerBadge: "Keine Leitung", managerLabel: "Leitung", moduleAccessBadge: "Modulzugriff",
      title: "Abteilungen",
      subtitle: "Definieren Sie die Abteilungen Ihres Unternehmens und die Stellen innerhalb jeder Abteilung.",
      addDepartment: "Abteilung hinzufügen",
      addDefaults: "Standardabteilungen hinzufügen",
      defaultsModal: {
        title: "Standardabteilungen hinzufügen",
        helpText: "Wählen Sie die Abteilungen aus, die Sie hinzufügen möchten — jede erhält einen Standardnamen, eine Beschreibung und (für HR/Produktion) bereits festgelegten Modulzugriff. Sie können sie später weiterhin bearbeiten oder weitere hinzufügen.",
        adding: "Wird hinzugefügt...",
        addButton: "{count} Abteilung(en) hinzufügen",
      },
      editDepartment: "Abteilung bearbeiten",
      addPosition: "Stelle hinzufügen",
      editPosition: "Stelle bearbeiten",
      deleteTitle: "Abteilung löschen",
      deleteSureMessage: "Möchten Sie diese Abteilung wirklich löschen? Mitarbeiter und Stellen, die sie noch nutzen, müssen zuerst neu zugewiesen werden.",
      deletePositionTitle: "Stelle löschen",
      deletePositionSureMessage: "Möchten Sie diese Stelle wirklich löschen? Mitarbeiter, die sie noch innehaben, oder andere ihr unterstellte Stellen, müssen zuerst neu zugewiesen werden.",
      emptyTitle: "Noch keine Abteilungen",
      emptyMessage: "Fügen Sie Ihre erste Abteilung hinzu, um Ihre Organisationsstruktur aufzubauen.",
      searchPlaceholder: "Abteilungen durchsuchen...",
      noSearchResults: "Keine Abteilung entspricht Ihrer Suche.",
      noPositions: "In dieser Abteilung sind noch keine Stellen definiert.",
      fields: { purchasingAccess: "Zugriff auf das Einkaufsmodul", manager: "Abteilungsleitung", noManager: "Keine Leitung", managerHint: "Verantwortet die ganze Abteilung: voller Modulzugriff, genehmigt die Anträge des Teams und legt fest, welche Positionen Modulzugriff erhalten.", grantsModuleAccess: "Gewährt Modulzugriff", grantsModuleAccessHint: "Inhaber dieser Position erhalten das Modul der Abteilung (z. B. HR oder Inventar). Deaktiviert lassen für Mitarbeiter, die nur „Mein Bereich“ sehen sollen.",
        name: "Name", description: "Beschreibung", permissionKey: "Modulzugriff",
        permissionKeyHint: "Optional — nur bei EINER Abteilung festlegen, wenn Mitarbeiter dort (und ihre automatisch erstellten Konten) Zugriff auf das HR- oder Produktionsmodul erhalten sollen. Die meisten Abteilungen sollten bei „Kein spezieller Zugriff“ bleiben.",
        category: "Funktion",
        noCategory: "Keine bestimmte Funktion",
        categoryHint: "Optional — lässt das Mitarbeiterformular Standard-Stellenbezeichnungen für diese Abteilung vorschlagen, statt Freitext zu belassen. Nur ein Vorschlag, ohne Bezug zu Zugriffsrechten, im Gegensatz zum Feld Modulzugriff oben.",
        noSpecialAccess: "Kein spezieller Zugriff", hrAccess: "Zugriff auf HR-Modul", productionAccess: "Zugriff auf Produktionsmodul",
        positionTitle: "Stellenbezeichnung", reportsTo: "Berichtet an", noReportsTo: "Keine (oberste Stelle)",
        salaryMin: "Gehaltsspanne — Min.", salaryMax: "Gehaltsspanne — Max.", salaryBand: "Gehaltsspanne",
        requiredSkills: "Erforderliche Fähigkeiten", requiredSkillsPlaceholder: "Durch Kommas getrennt, z. B. Excel, Führung",
      },
      errors: {
        nameRequired: "Der Abteilungsname ist erforderlich", titleRequired: "Die Stellenbezeichnung ist erforderlich",
        saveFailed: "Beim Speichern ist ein Fehler aufgetreten.", deleteFailed: "Beim Löschen ist ein Fehler aufgetreten.",
      },
    },

    payroll: {
      title: "Gehaltsabrechnung",
      subtitle: "Erstellen Sie monatliche Abrechnungsläufe und verwalten Sie Gehaltsabrechnungen.",
      generateRun: "Abrechnung erstellen",
      createTitle: "Abrechnungslauf erstellen",
      createSureMessage: "Abrechnung für diesen Zeitraum erstellen? Für jeden aktiven Mitarbeiter mit hinterlegtem Gehalt wird eine Gehaltsabrechnung erstellt.",
      createSuccessTitle: "Abrechnungslauf erstellt",
      createSuccessMessage: "Der Abrechnungslauf wurde erfolgreich erstellt.",
      completeTitle: "Abrechnungslauf abschließen",
      completeSureMessage: "Diesen Abrechnungslauf abschließen? Nach dem Abschluss werden die Gehaltsabrechnungen gesperrt und die Mitarbeiter benachrichtigt.",
      deleteTitle: "Abrechnungslauf löschen",
      deleteSureMessage: "Diesen Entwurf des Abrechnungslaufs und alle zugehörigen Gehaltsabrechnungen löschen? Dies kann nicht rückgängig gemacht werden.",
      emptyTitle: "Noch keine Abrechnungsläufe",
      emptyMessage: "Erstellen Sie den ersten Abrechnungslauf für dieses Unternehmen.",
      noPayslips: "Keine Gehaltsabrechnungen in diesem Lauf.",
      fields: { month: "Monat", year: "Jahr", status: "Status" },
      table: { period: "Zeitraum", employees: "Mitarbeiter", gross: "Brutto", net: "Netto", searchPlaceholder: "Mitarbeiter suchen..." },
      status: { draft: "Entwurf", completed: "Abgeschlossen", voided: "Storniert" },
      payslipStatus: { draft: "Entwurf", validated: "Bestätigt", paid: "Bezahlt" },
      actions: { view: "Ansehen", complete: "Abschließen", regenerate: "Neu erstellen", markPaid: "Als bezahlt markieren", downloadPdf: "Abrechnung herunterladen" },
      exports: {
        cnss: "CNSS-Export",
        cnssHint: "Meldeformular — vor dem Hochladen mit dem aktuellen Damancom-Format abgleichen",
        register: "Lohnjournal",
        bankTransfer: "Überweisungsdatei",
      },
      buttons: { generate: "Erstellen", saving: "Wird gespeichert..." },
      breadcrumbs: { hr: "Personalwesen", payroll: "Gehaltsabrechnung" },
      months: ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],
      errors: { fetchFailed: "Abrechnungsläufe konnten nicht geladen werden", actionFailed: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut." },
    },

    contracts: {
      title: "Verträge",
      subtitle: "Behalten Sie Arbeitsverträge, Verlängerungen und Ablaufdaten im Blick.",
      addContract: "Neuer Vertrag",
      createTitle: "Neuer Vertrag",
      createSureMessage: "Möchten Sie diesen Vertrag wirklich erstellen?",
      createSuccessTitle: "Vertrag erstellt",
      createSuccessMessage: "Der Vertrag wurde erfolgreich erstellt.",
      renewTitle: "Vertrag verlängern",
      renewSureMessage: "Diesen Vertrag verlängern? Der aktuelle Vertrag wird geschlossen und ein neuer beginnt.",
      deleteTitle: "Vertrag löschen",
      deleteSureMessage: "Möchten Sie diesen Vertrag wirklich löschen? Dies kann nicht rückgängig gemacht werden.",
      emptyTitle: "Noch keine Verträge",
      emptyMessage: "Für dieses Unternehmen sind noch keine Verträge hinterlegt.",
      expiringBanner: "{count} Vertrag/Verträge laufen innerhalb von 30 Tagen ab.",
      fields: { employee: "Mitarbeiter", type: "Vertragsart", startDate: "Startdatum", endDate: "Enddatum" },
      status: { active: "Aktiv", expired: "Abgelaufen", terminated: "Gekündigt", renewed: "Verlängert" },
      actions: { renew: "Verlängern" },
      buttons: { create: "Vertrag speichern" },
      breadcrumbs: { hr: "Personalwesen", contracts: "Verträge" },
      errors: { fetchFailed: "Verträge konnten nicht geladen werden", actionFailed: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut." },
    },

    documents: {
      title: "Dokumente",
      subtitle: "Speichern Sie Mitarbeiterdokumente und behalten Sie Ablaufdaten im Blick.",
      uploadDocument: "Dokument hochladen",
      editDocument: "Dokument bearbeiten",
      deleteTitle: "Dokument löschen",
      deleteSureMessage: "Möchten Sie dieses Dokument wirklich löschen? Dies kann nicht rückgängig gemacht werden.",
      emptyTitle: "Noch keine Dokumente",
      emptyMessage: "Für dieses Unternehmen sind noch keine Dokumente hinterlegt.",
      expiringBanner: "{count} Dokument(e) laufen innerhalb von 30 Tagen ab.",
      fields: { employee: "Mitarbeiter", type: "Typ", label: "Bezeichnung", labelPlaceholder: "z. B. Personalausweis", expiryDate: "Ablaufdatum", file: "Datei", replaceFile: "Datei ersetzen (optional)" },
      table: { file: "Datei" },
      types: {
        cin: "Personalausweis (CIN)", passport: "Reisepass", work_permit: "Arbeitserlaubnis",
        residence_permit: "Aufenthaltserlaubnis", contract: "Vertrag", diploma: "Diplom",
        cv: "Lebenslauf", medical_certificate: "Ärztliches Attest", other: "Sonstiges",
      },
      actions: { view: "Ansehen", loadMore: "Mehr laden", loadMoreCount: "{loaded} von {total} angezeigt" },
      buttons: { upload: "Hochladen" },
      breadcrumbs: { hr: "Personalwesen", documents: "Dokumente" },
      errors: {
        fetchFailed: "Dokumente konnten nicht geladen werden", actionFailed: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
        missingFields: "Bitte wählen Sie einen Mitarbeiter und eine Datei aus.", uploadFailed: "Hochladen des Dokuments fehlgeschlagen.",
      },
    },

    attendance: {
      title: "Anwesenheit",
      subtitle: "Kommen- und Gehen-Zeiten einsehen.",
      emptyTitle: "Keine Anwesenheitsdaten",
      emptyMessage: "Keine Anwesenheitsdaten entsprechen Ihren Filtern.",
      filterAllEmployees: "Alle Mitarbeiter",
      fields: { employee: "Mitarbeiter", date: "Datum", clockIn: "Kommen", clockOut: "Gehen", notes: "Notizen" },
      status: { present: "Anwesend", late: "Verspätet", absent: "Abwesend", half_day: "Halber Tag", holiday: "Feiertag" },
      breadcrumbs: { hr: "Personalwesen", attendance: "Anwesenheit" },
      errors: { fetchFailed: "Anwesenheitsdaten konnten nicht geladen werden" },
    },

    reports: { chart: { zoomHint: "Ziehe die Regler unter dem Diagramm zum Zoomen", yearly: "Jährlich", monthly: "Monatlich", view: "Ansicht", lastMonths: "Letzte {n} Monate", range: "Zeitraum", },
      title: "Berichte",
      subtitle: "Mitarbeiterzahl, Fluktuation, Abwesenheit und Entwicklung der Lohnkosten.",
      stats: { totalHeadcount: "Gesamtbelegschaft", activeEmployees: "Aktive Mitarbeiter", currentGross: "Aktuelles monatliches Brutto (geschätzt)", currentNet: "Aktuelles monatliches Netto (geschätzt)", missingSalaryNote: "{count} aktive(r) Mitarbeiter haben noch kein hinterlegtes Gehalt — in dieser Schätzung nicht enthalten." },
      expand: "Erweitern",
      charts: {
        headcountByDepartment: "Mitarbeiterzahl nach Abteilung", turnover: "Fluktuation (letzte 12 Monate)",
        hires: "Neueinstellungen", terminations: "Austritte", absenteeism: "Abwesenheitsquote (letzte 6 Monate)",
        absenteeismRate: "Abwesenheitsquote", payrollCost: "Lohnkosten (letzte 12 Monate)",
        estimatedFootnote: "* Der aktuelle Monat, mit einem Sternchen markiert, ist eine Live-Schätzung auf Basis der aktuellen Gehälter — die Abrechnung wurde dafür noch nicht durchgeführt.",
      },
      breadcrumbs: { hr: "Personalwesen", reports: "Berichte" },
      loadError: "Einige Berichtsdaten konnten nicht geladen werden. Bitte versuchen Sie es erneut oder prüfen Sie die Konsole für Details.",
      rankings: {
        title: "Mitarbeiter-Rangliste",
        last30Days: "Letzte 30 Tage",
        last90Days: "Letzte 90 Tage",
        last365Days: "Letzte 12 Monate",
        mostAbsenceDays: "Die meisten Abwesenheitstage",
        bestAttendanceRate: "Beste Anwesenheitsquote",
        mostOvertimeHours: "Die meisten Überstunden",
        mostLateDays: "Die meisten Verspätungen",
        noData: "Keine Daten für diesen Zeitraum.",
        days: "Tage",
      },
    },  twoFactor: { qrAlt: "2FA-QR-Code",
    title: "Zwei-Faktor-Authentifizierung",
    disabledHint: "Fügen Sie Ihrem Konto eine zusätzliche Sicherheitsebene hinzu — nach Ihrem Passwort benötigen Sie zum Anmelden auch einen Code aus einer Authentifizierungs-App.",
    enabledHint: "Die Zwei-Faktor-Authentifizierung ist für Ihr Konto aktiviert. Sie werden bei jeder Anmeldung nach einem Code aus Ihrer Authentifizierungs-App gefragt.",
    enableButton: "Zwei-Faktor-Authentifizierung aktivieren",
    disableButton: "Zwei-Faktor-Authentifizierung deaktivieren",
    disabling: "Wird deaktiviert...",
    scanTitle: "QR-Code scannen",
    scanHint: "Scannen Sie diesen mit einer Authentifizierungs-App (Google Authenticator, Authy usw.) und geben Sie dann den angezeigten 6-stelligen Code zur Bestätigung ein.",
    manualEntryLabel: "Können Sie nicht scannen? Geben Sie diesen Code manuell ein:",
    confirmAndEnable: "Bestätigen und aktivieren",
    verifying: "Wird überprüft...",
    backupCodesTitle: "Speichern Sie Ihre Backup-Codes",
    backupCodesHint: "Jeder Code kann einmal zur Anmeldung verwendet werden, falls Sie den Zugriff auf Ihre Authentifizierungs-App verlieren. Bewahren Sie sie an einem sicheren Ort auf — sie werden nicht erneut angezeigt.",
    copyBackupCodes: "Codes kopieren",
    copied: "Kopiert",
    iSavedThem: "Ich habe diese Codes gespeichert",
    confirmPasswordLabel: "Bestätigen Sie Ihr Passwort, um fortzufahren",
    errors: {
      statusFailed: "Der Status der Zwei-Faktor-Authentifizierung konnte nicht geprüft werden.",
      setupFailed: "Die Einrichtung der Zwei-Faktor-Authentifizierung konnte nicht gestartet werden.",
      invalidCode: "Dieser Code stimmt nicht überein — prüfen Sie Ihre Authentifizierungs-App und versuchen Sie es erneut.",
      disableFailed: "Die Zwei-Faktor-Authentifizierung konnte nicht deaktiviert werden.",
    },
  },

  disciplinaryActions: {
    title: "Disziplinarmaßnahmen",
    subtitle: "Verwarnungen und Korrekturmaßnahmen gegenüber Mitarbeitern nachverfolgen.",
    addAction: "Eintrag hinzufügen",
    editAction: "Eintrag bearbeiten",
    emptyTitle: "Noch keine Disziplinareinträge",
    emptyMessage: "Für dieses Unternehmen sind keine Disziplinarmaßnahmen hinterlegt.",
    deleteTitle: "Eintrag löschen",
    deleteSureMessage: "Möchten Sie diesen Eintrag wirklich löschen? Dies kann nicht rückgängig gemacht werden.",
    acknowledged: "Bestätigt",
    notAcknowledged: "Noch nicht bestätigt",
    breadcrumbs: {
      hr: "Personalwesen",
      disciplinaryActions: "Disziplinarmaßnahmen",
    },
    fields: {
      employee: "Mitarbeiter",
      type: "Art",
      date: "Datum",
      reason: "Grund",
      description: "Beschreibung",
      suspensionDays: "Suspendierung (Tage)",
      issuedBy: "Ausgestellt von",
      notes: "Notizen",
    },
    types: {
      verbal_warning: "Mündliche Verwarnung",
      written_warning: "Schriftliche Verwarnung",
      final_warning: "Letzte Verwarnung",
      suspension: "Suspendierung",
      termination_notice: "Kündigungsschreiben",
    },
    errors: {
      fetchFailed: "Disziplinarmaßnahmen konnten nicht geladen werden",
      saveFailed: "Fehler beim Speichern des Eintrags",
      deleteFailed: "Fehler beim Löschen des Eintrags",
    },
  },
  performanceReviews: {
    title: "Leistungsbeurteilungen",
    subtitle: "Beurteilungszyklen, Ziele und Bewertungen für Ihre Mitarbeiter.",
    addReview: "Neue Beurteilung",
    editReview: "Beurteilung bearbeiten",
    emptyTitle: "Noch keine Leistungsbeurteilungen",
    emptyMessage: "Für dieses Unternehmen sind keine Beurteilungen hinterlegt.",
    deleteTitle: "Beurteilung löschen",
    deleteSureMessage: "Möchten Sie diese Beurteilung wirklich löschen? Dies kann nicht rückgängig gemacht werden.",
    reviewedBy: "Beurteilt von",
    submitButton: "An Mitarbeiter senden",
    breadcrumbs: {
      hr: "Personalwesen",
      performanceReviews: "Beurteilungen",
    },
    fields: {
      employee: "Mitarbeiter",
      reviewer: "Beurteiler",
      periodLabel: "Beurteilungszeitraum",
      periodLabelPlaceholder: "z. B. Jahresbeurteilung 2026",
      reviewDate: "Beurteilungsdatum",
      goals: "Ziele (eines pro Zeile)",
      goalsPlaceholder: "Reaktionszeit bei Support-Tickets verbessern\nOnboarding-Zertifizierung abschließen",
      strengths: "Stärken",
      areasForImprovement: "Verbesserungsbereiche",
      comments: "Kommentare",
    },
    criteria: {
      jobKnowledge: "Fachwissen",
      qualityOfWork: "Arbeitsqualität",
      communication: "Kommunikation",
      teamwork: "Teamarbeit",
      initiative: "Eigeninitiative",
      punctuality: "Pünktlichkeit",
    },
    statuses: {
      draft: "Entwurf",
      submitted: "Gesendet",
      acknowledged: "Bestätigt",
    },
    errors: {
      fetchFailed: "Beurteilungen konnten nicht geladen werden",
      saveFailed: "Fehler beim Speichern der Beurteilung",
      submitFailed: "Fehler beim Senden der Beurteilung",
      deleteFailed: "Fehler beim Löschen der Beurteilung",
    },
  },
  leaveCalendar: {
    title: "Abwesenheitskalender",
    subtitle: "Sehen Sie auf einen Blick, wer genehmigten Urlaub hat.",
    previousMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    breadcrumbs: {
      hr: "Personalwesen",
      leaveCalendar: "Abwesenheitskalender",
    },
    weekdays: {
      0: "Mo",
      1: "Di",
      2: "Mi",
      3: "Do",
      4: "Fr",
      5: "Sa",
      6: "So",
    },
    errors: {
      fetchFailed: "Abwesenheitskalender konnte nicht geladen werden",
    },
  },
};
