// UI dictionary — es. Split out of i18n.config.js so each language
// is its own module (see loadLanguage there).
export default { quota: { title: "Cuotas", hint: "Vacío = ilimitado. Los empleados dados de baja no cuentan. Bajar una cuota no borra nada: el cliente simplemente no puede crear más.", maxCompanies: "Máx. de empresas", maxEmployees: "Máx. de empleados", unlimited: "Ilimitado", edit: "Editar cuotas", saved: "Cuotas guardadas.", companies: "Empresas", employees: "Empleados", companiesFull: "Límite de empresas alcanzado: contacte con la plataforma para aumentarlo.", employeesFull: "Límite de empleados alcanzado: contacte con la plataforma para aumentarlo. Un empleado dado de baja libera una plaza.", employeesHint: "Empleados usados / permitidos (los dados de baja no cuentan).", newCompany: "Nueva empresa", }, prodPlan: { barsOf: "barras de {length} mm", }, wsMulti: { departmentSchedule: "Horario de trabajo", useDefault: "Horario por defecto ({name})", departmentScheduleHint: "Los horarios se crean en Organización › Horario de trabajo.", deleteConfirm: "¿Eliminar el horario «{name}»? Sus departamentos vuelven al horario por defecto.", namePlaceholder: "p. ej. Taller – partido, sábado por la mañana", copyCurrent: "Copiar el horario actual", new: "Nuevo horario", name: "Nombre del horario", default: "Horario por defecto", makeDefault: "Poner por defecto", departments: "Departamentos", noDepartments: "Aún no hay departamentos en esta empresa.", leaveDefaultHint: "Ya está en el horario por defecto: asígnelo a otro horario para moverlo.", currently: "Actualmente: {name}", defaultHint: "El horario por defecto se aplica a todos los departamentos sin horario propio.", assignHint: "Marque los departamentos que siguen este horario; los desmarcados vuelven al horario por defecto.", splitDay: "Pausa", splitDayHint: "Jornada partida (mañana + tarde). Desmarque para media jornada o jornada continua.", splitOn: "Partida", splitOff: "Continua", }, platformCo: { companyTitle: "Companies", companyAdd: "Add a company", companyNone: "No company yet.", companyAdminHint: "A client can have several companies (group, subsidiaries). Its admin can also create them from Organisation › Company; every screen has a “Company” picker.", companyFirst: "First company (optional)", companyFirstHint: "More companies can be added later, here or by the client's admin.", companyName: "Company name", companyNamePlaceholder: "e.g. Atlas Joinery Ltd", companyLegalForm: "Legal form", companyOtherForm: "Other", companyIndustry: "Activity", companyIndustryPlaceholder: "e.g. Aluminium joinery", companyCity: "City", companyAdded: "Company “{name}” added.", }, perm: { teamMenu: "Permisos de mi equipo", title: "Permisos de acceso", subtitleAll: "Everyone's permissions, action by action. Managers then hand out the ones they have to their team.", subtitleTeam: "Give each person in your team the permissions they need — among the ones you have yourself.", searchPeople: "Buscar una persona…", emptyTeam: "Nobody reports to you in this company.", manager: "Responsable", pickSomeone: "Elija una persona a la izquierda.", rules: "Each department has a manager, who gets every permission of its module. A manager only gives permissions they have themselves, to the people of their department and everyone reporting to them (all levels). They can also let a team lead hand out permissions in turn (“Team › Team permissions”).", noLoginHint: "This person has no login: create one from their employee file (HR) to give them permissions.", selfHint: "You can't change your own permissions — your manager does.", fullAccessHint: "Admin / owner: full access to everything.", managesHint: "Manager of {deps}: that module's permissions are automatic.", applyPreset: "Aplicar un perfil…", resetHint: "Back to their department / position default profile", reset: "Perfil del puesto", legendOn: "Concedido", legendAuto: "Automático (responsable)", legendOff: "No concedido", legendGrantable: "Greyed boxes are permissions you don't have yourself.", all: "Todo", none: "Nada", toggleRow: "all / none", autoHint: "Automatic: this person manages the department", notGrantable: "You don't have this permission: you can't give or remove it", noLogin: "Sin cuenta", fullAccess: "Acceso completo", custom: "Personalizado", roleProfile: "Perfil del puesto", saved: "Permisos guardados: {added} añadidos, {removed} retirados.", resetConfirm: "Put back their department / position default profile? Their custom permissions will be lost.", resetDone: "Default profile restored.", errors: { load: "Couldn't load the permissions.", save: "Couldn't save the permissions.", }, }, cv: { parentCategory: "Categoría padre", noParent: "Ninguna (categoría principal)", parentHint: "Ej. « Perfiles de aluminio » › « Serie ATLAS 78 — correderas ». Una subcategoría sin cuenta contable usa la de su categoría padre.", addSubCategory: "Añadir una subcategoría", articlesCount: "{n} artículo(s)", subCount: "{n} subcategoría(s)", amountsLabel: "Importes", amountsCheckbox: "Ver precios, costes, márgenes y presupuestos (siempre visibles para administradores, propietarios, ventas, finanzas, contabilidad y dirección)", visual: "Apariencia", visualHint: "Cómo se ve el modelo en el catálogo, los proyectos y el PDF del presupuesto: un esquema a escala a partir de L × H — o su propia imagen (foto, dibujo del catálogo del proveedor), que entonces sustituye al esquema en todas partes.", schematic: "Esquema generado", picture: "Imagen (opcional)", noPicture: "Sin imagen", changePicture: "Cambiar la imagen", uploadPicture: "Subir una imagen", drawingType: "Tipo de esquema", leaves: "Hojas", opening: "Apertura", layers: "Número de vidrios", grid_nx: "Columnas", grid_ny: "Filas", solidLeaf: "Hoja ciega (panel, sin vidrio)", railingBars: "Barrotes (en lugar de vidrio)", drawingParamsHint: "Los parámetros llamados n (hojas), nx / ny (retícula), lf, hi / ha (compuestos) o ent (separación de postes) sustituyen estos valores línea por línea.", ralPick: "Elegir en la carta RAL", ralPickPh: "Buscar un RAL (9016, antracita…)", ralNone: "Ningún RAL encontrado", projectFinish: "Color por defecto (RAL)", drawingTypes: { sliding: "Corredera", casement: "Ventana abatible", door: "Puerta", folding: "Plegable", fixed: "Fijo", grid: "Retícula / muro cortina", combo: "Compuesto", shutter: "Persiana enrollable", louvre: "Lamas", railing: "Barandilla", pergola: "Pérgola", glass: "Vidrio", garage: "Puerta de garaje", panel: "Panel", cladding: "Revestimiento", generic: "Genérico", }, openings: { side: "Abatible", ob: "Oscilobatiente", soufflet: "Abatible inferior", projetant: "Proyectante", pivotant: "Pivotante", basculant: "Basculante", }, }, notificationEvents: { permissionsChanged: { title: "Sus permisos han cambiado", message: "{added} añadidos, {removed} retirados", }, quoteAcceptedProd: { title: "Presupuesto {number} aceptado", message: "{customer} — el proyecto llegará a producción", }, orderPlanned: { title: "Nueva orden de fabricación {number}", message: "{workshop} · {project}", }, orderPlannedWaiting: { title: "Nueva orden de fabricación {number}", message: "{workshop} · {project} — esperando a los talleres anteriores", }, orderCreated: { title: "Nueva orden de fabricación {number}", message: "{workshop} · {title}", }, orderReady: { title: "{number} puede empezar", message: "{workshop}: los talleres anteriores han terminado.", }, orderDone: { title: "{number} terminada", message: "{workshop} · {project}", }, orderClosedShort: { title: "{number} cerrada con falta de stock", message: "{count} artículo(s): {articles}", }, orderCancelled: { title: "{number} anulada", message: "{workshop} {reason}", }, orderLate: { title: "{number} con retraso", message: "{workshop} · vence {date}", }, stockLow: { title: "Stock bajo: {article}", message: "Quedan {quantity} {unit} (mínimo {threshold})", }, quoteAccepted: { title: "Presupuesto {number} aceptado", message: "{customer} · {amount} sin IVA", }, quoteRefused: { title: "Presupuesto {number} rechazado", message: "{customer} · {amount} sin IVA {reason}", }, quoteExpiring: { title: "El presupuesto {number} vence el {date}", message: "{customer} · hacer seguimiento", }, paymentReceived: { title: "Cobro en {number}", message: "{customer} · {amount}", }, invoicePaid: { title: "Factura {number} pagada", message: "{customer} · {amount}", }, invoiceOverdue: { title: "Factura {number} vencida", message: "{customer} · {amount} vencido desde {date}", }, projectDueSoon: { title: "Proyecto {number}: vence en {days} día(s)", message: "{name} · órdenes abiertas: {open}", }, projectOverdue: { title: "Proyecto {number} con retraso", message: "{name} · vence {date} · órdenes abiertas: {open}", }, }, login: { useBackupCode: "Usar un código de respaldo", useAuthenticator: "Usar el código de la app", invalidCode: "Código no válido", verifying: "Verificando...", verify: "Verificar", backupCodeHint: "Introduce uno de tus códigos de respaldo.", authenticatorHint: "Introduce el código de 6 dígitos de tu app de autenticación.", failed: "Error al iniciar sesión", signingIn: "Iniciando sesión...", signIn: "Iniciar sesión", password: "Contraseña", email: "Correo electrónico", }, notifications: { daysShort: "d", hoursShort: "h", minutesShort: "min", now: "ahora", markAllRead: "Marcar todo como leído", empty: "Aún no hay notificaciones.", title: "Notificaciones", }, orgChart: { breadcrumbs: { orgChart: "Organigrama", hr: "RR. HH.", }, emptyMessage: "Asigna un responsable a los empleados para construir la estructura.", emptyTitle: "Aún no hay organigrama", subtitle: "Estructura jerárquica, basada en el responsable de cada empleado.", title: "Organigrama", }, auditLog: { errors: { fetchFailed: "No se pudo cargar el registro de auditoría", actionFailed: "Esta acción ha fallado. Inténtalo de nuevo.", }, breadcrumbs: { auditLog: "Registro de auditoría", hr: "RR. HH.", }, actions: { review: "Revisado", delete: "Eliminado", update: "Modificado", create: "Creado", }, resourceTypes: { WorkSchedule: "Horario de trabajo", PayrollRun: "Ciclo de nómina", EmployeeDocument: "Documento", Contract: "Contrato", Advance: "Anticipo", Absence: "Ausencia", Salary: "Salario", Employee: "Empleado", }, fields: { date: "Fecha", actor: "Por", resource: "Registro", resourceType: "Tipo", action: "Acción", }, emptyMessage: "Aún no hay cambios registrados para este filtro.", emptyTitle: "Sin actividad todavía", deleteSureMessage: "¿Eliminar esta entrada? No se puede deshacer.", deleteTitle: "Eliminar entrada del registro", subtitle: "Quién cambió qué y cuándo.", title: "Registro de auditoría", }, purchaseRequests: { status: { received: "Recibido", }, fields: { requestedBy: "Solicitado por", quantity: "Cantidad", product: "Artículo", }, markReceived: "Marcar como recibido", emptyMessage: "Ninguna solicitud coincide con tus filtros.", emptyTitle: "No hay solicitudes de compra", subtitle: "Solicitudes de reposición enviadas a Compras, y su respuesta.", title: "Solicitudes de compra", }, production: { title: "Producción", }, holidays: { title: "Días festivos", subtitle: "Los festivos del año: si la empresa trabaja y cómo se pagan las horas trabajadas.", downloadTemplate: "Descargar plantilla", import: "Importar Excel", add: "Añadir festivo", year: "Año", howItWorks: "Cada año: descarga la plantilla (los festivos de fecha fija ya están rellenados), añade los festivos religiosos con sus fechas oficiales e impórtala. Festivo cerrado: no se espera a nadie y las horas de quien fiche cuentan como horas de festivo. Pago «doble» añade una hora extra pagada por cada hora trabajada; «normal» no añade nada.", importDone: "Importación completada: {created} añadidos, {updated} actualizados.", namePlaceholder: "Nombre del festivo (p. ej. Aïd al-Fitr)", previewTitle: "Vista previa de {file}", previewErrors: "{count} fila(s) por corregir — corrige el archivo e impórtalo de nuevo", previewReady: "{count} fila(s) listas para importar", columns: { row: "Fila", date: "Fecha", name: "Nombre", open: "Empresa", pay: "Pago si se trabaja", check: "Revisión" }, defaultClosed: "Cerrada (por defecto)", defaultDouble: "Doble (por defecto)", open: "Abierta", closed: "Cerrada", payDouble: "Doble", payNormal: "Normal", confirmImport: "Importar", emptyTitle: "Aún no hay festivos para {year}", emptyMessage: "Descarga la plantilla, complétala e impórtala.", deleteTitle: "Eliminar festivo", deleteMessage: "¿Eliminar «{name}»? Los fichajes ya registrados ese día se conservan.", errors: { load: "No se pudieron cargar los festivos.", save: "No se pudo guardar este cambio.", template: "No se pudo descargar la plantilla.", read: "No se pudo leer este archivo.", import: "La importación falló." } }, myDepartment: { adminTitle: "Acceso por departamento", adminSubtitle: "Todos los departamentos que supervisas: su responsable, qué puestos dan acceso al módulo y quién tiene acceso.", adminEmptyTitle: "Aún no hay departamentos.", noManagerAssigned: "Sin responsable asignado", title: "Mi departamento", subtitle: "Tu equipo y qué puestos dan acceso al módulo del departamento.", loadError: "No se pudo cargar tu departamento.", saveError: "No se pudo guardar este cambio.", saved: "Guardado.", accountsUpdated: "Guardado — {count} cuenta(s) actualizada(s).", emptyTitle: "Todavía no gestionas ningún departamento.", positionsTitle: "Puestos y acceso", positionsHint: "Activa un puesto para dar a todos sus titulares acceso al módulo del departamento. El resto solo ve Mi espacio.", noModule: "Este departamento no desbloquea ningún módulo, así que no hay acceso que repartir.", noPositions: "Aún no hay puestos definidos para este departamento.", holders: "{count} empleado(s)", toggleLabel: "Da acceso al módulo", teamTitle: "Equipo", noEmployees: "No hay empleados en este departamento.", columns: { name: "Nombre", jobTitle: "Puesto", access: "Acceso" }, noLogin: "Sin cuenta", moduleAccess: "Acceso al módulo", mySpaceOnly: "Solo Mi espacio" },
    sidebar: { logistics: "Logística", toDeliver: "Por entregar", deliveryNotes: "Albaranes", tracking: "Seguimiento de proyectos", workshops: "Talleres", chassisCatalog: "Catálogo de carpintería", productionConfig: "Configuración de producción", sales: "Ventas", quotes: "Presupuestos", salesInvoices: "Facturas", receivables: "Cobros", customers: "Clientes", projects: "Proyectos", planning: "Planificación", declarations: "Declaraciones", leaveBalances: "Saldos de vacaciones", platform: "Plataforma", clients: "Clientes", purchasingReports: "Informes de compras", restock: "Reposición", inventorySettings: "Configuración", purchaseRequests: "Solicitudes de compra", inventory: "Inventario", production: "Producción", workSchedule: "Horario de trabajo", auditLog: "Registro de auditoría", reports: "Informes", orgChart: "Organigrama", attendance: "Asistencia", employeeDocuments: "Documentos", contracts: "Contratos", payroll: "Nómina", supplierInvoices: "Facturas de proveedores", purchasing: "Compras", purchaseRequestsQueue: "Solicitudes de compra", purchaseOrders: "Órdenes de compra", priceRequests: "Solicitudes de precio", suppliers: "Proveedores", purchasingInventory: "Inventario", articleHistory: "Historial del artículo", holidays: "Días festivos", departmentAccess: "Acceso por departamento", myDepartment: "Mi departamento", mySpace: "Mi espacio", myProfile: "Mi perfil", myPayslips: "Mis nóminas", myAbsences: "Mis ausencias", myAdvances: "Mis anticipos", myAttendance: "Mi asistencia", myRecords: "Mi expediente",
      leaveCalendar: "Calendario de ausencias",
      performanceReviews: "Evaluaciones de desempeño",
      disciplinaryActions: "Acciones disciplinarias",
      admin: "Administración",
      settings: "Configuración",
      help: "Ayuda y soporte",
      profile: "Perfil",
      hr: "Recursos Humanos",

      companies: "Empresas",
      organization: "Organización",
      company: "Empresa",
      employees: "Empleados",
      salaries: "Salarios",
      absences: "Ausencias",
      advances: "Anticipos",
      users: "Usuarios",
      departments: "Departamentos",
      jobPositions: "Puestos",
      rolesPermissions: "Roles y permisos",
      locations: "Ubicaciones",
      documents: "Documentos",
      preferences: "Preferencias",
      integrations: "Integraciones",

      dark: "Oscuro",
      light: "Claro",

      logout: "Cerrar sesión",

      closeSidebar:
        "Cerrar barra lateral",

      openSidebar:
        "Abrir barra lateral",

      switchTheme:
        "Cambiar al modo {theme}",

      dashboard:
        "Panel",
    },

    common: { yes: "Sí", no: "No", home: "Inicio", breadcrumb: "Ruta de navegación", clear: "Borrar", clearSearch: "Borrar búsqueda", nextPage: "Página siguiente", previousPage: "Página anterior", pagination: "Paginación", hidePassword: "Ocultar contraseña", showPassword: "Mostrar contraseña", somethingWentWrong: "Algo salió mal", confirmAction: "Confirmar acción", pageNotFoundHint: "Esta página no existe o se ha movido.", pageNotFound: "Página no encontrada", status: "Estado", save: "Guardar", back: "Volver", dateFrom: "Desde", dateTo: "Hasta",
      welcome: "Bienvenido",
      goodbye: "Adiós",
      loading: "Cargando...",
      error: "Error",
      fail: "Fallido",
      success: "Éxito",
      update: "Actualizar",
      cancel: "Cancelar",
      delete: "Eliminar",
      confirm: "Confirmar",
      close: "Cerrar",
      edit: "Editar",
      reset: "Restablecer",
      create: "Crear",
      noResults: "No se encontraron resultados",
      chooseFile: "Elegir archivo",
      noFileChosen: "Ningún archivo seleccionado",
    },

    profile: { loadFailed: "No se pudo cargar el perfil",
      settings: "Configuración",

      firstName: "Nombre",
      lastName: "Apellidos",
      email: "Correo electrónico",
      password: "Contraseña",

      currentPassword: "Contraseña actual",
      newPassword: "Nueva contraseña",

      updateSureMessage:
        "¿Seguro que quieres actualizar tu perfil?",

      updateFailMessage:
        "No se pudo actualizar tu perfil. Inténtalo de nuevo.",

      updateSuccessMessage:
        "Tu perfil se ha actualizado correctamente.",

      bothPasswords:
        "Se requieren la contraseña actual y la nueva contraseña.",

      info: "Información",
    },

    company: { workflow: { accountInvalid: "Una cuenta contable tiene de 4 a 10 dígitos.", purchaseAccountHint: "Se usa en la exportación contable para artículos cuya categoría no tiene cuenta propia y para líneas escritas a mano (p. ej. 6111, 6121, 6125).", purchaseAccount: "Cuenta de compras por defecto", purchaseThresholdHint: "Los pedidos con un importe (IVA incl.) igual o superior deben ser aprobados por un admin, el propietario o el responsable de compras. 0 = sin aprobación.", purchaseThreshold: "Umbral de aprobación de pedidos", title: "Flujo de aprobación", sequentialApproval: "Aprobación del responsable antes de RR. HH.", sequentialApprovalHint: "Si está activado, las solicitudes de ausencia y anticipo deben ser aprobadas primero por el responsable del empleado y luego recibir la aprobación final de RR. HH. Los empleados sin responsable pasan directamente a RR. HH.", saveFailed: "No se pudo guardar este ajuste." },
      title: "Empresa",
      subtitle:
        "Gestiona la información de tu empresa",

      emptySubtitle:
        "No hay ninguna empresa configurada",

      emptyTitle:
        "No hay empresa",

      emptyMessage:
        "Configura el perfil de tu empresa para comenzar.",

      create:
        "Crear empresa",

      editTitle:
        "Editar empresa",

      name:
        "Nombre de la empresa",

      tradeName:
        "Nombre comercial",

      legalForm:
        "Forma jurídica",

      industry:
        "Sector",

      ice:
        "ICE",

      taxId:
        "Identificación fiscal",

      registrationNumber:
        "Número de registro",

      email:
        "Correo electrónico",

      phone:
        "Teléfono",

      website:
        "Sitio web",

      street:
        "Calle",

      city:
        "Ciudad",

      postalCode:
        "Código postal",

      logo:
        "Logo de la empresa",

      employeeCount:
        "Empleados",

      section: {
        identity:
          "Identidad",

        legal:
          "Información legal",

        contact:
          "Contacto",
      },

      createTitle:
        "Crear empresa",

      createSureMessage:
        "¿Estás seguro de que quieres crear esta empresa?",

      createSuccessTitle:
        "Empresa creada",

      createSuccessMessage:
        "La empresa se ha creado correctamente.",

      createFailTitle:
        "Error de creación",

      updateSureMessage:
        "¿Estás seguro de que quieres guardar estos cambios?",

      updateSuccessMessage:
        "La empresa se ha actualizado correctamente.",

      saveFailMessage:
        "Ha ocurrido un error al guardar la empresa.",

      loadFailTitle:
        "Error de carga",

      loadFailMessage:
        "No se pudo cargar la información de la empresa.",

      downloadFiche:
        "Descargar ficha",

      deleteCompany:
        "Eliminar empresa",

      deleteTitle:
        "Eliminar empresa",

      deleteSureMessage:
        "¿Estás seguro de que quieres eliminar esta empresa? Esta acción no se puede deshacer.",

      deleteSuccessTitle:
        "Empresa eliminada",

      deleteSuccessMessage:
        "La empresa se ha eliminado correctamente.",

      deleteFailTitle:
        "Error de eliminación",

      deleteFailMessage:
        "Ha ocurrido un error al eliminar la empresa.",

      errors: {
        deleteAdminOnly:
          "Solo los administradores o el propietario de la empresa pueden eliminarla.",

        notFound:
          "Empresa no encontrada.",

        deleteNotAuthorized:
          "No tienes autorización para eliminar esta empresa.",

        updateNotAuthorized:
          "No tienes autorización para actualizar esta empresa.",

        viewNotAuthorized:
          "No tienes autorización para ver esta empresa.",

        ficheDownloadFailed:
          "Error al generar la ficha de la empresa.",

        duplicateCompany:
          "Ya existe una empresa con este ICE, identificación fiscal, número de registro o número CNSS.",

        createFailed:
          "Error al crear la empresa.",

        updateFailed:
          "Error al actualizar la empresa.",

        deleteFailed:
          "Error al eliminar la empresa.",

        logoNotFound:
          "Logo de la empresa no encontrado.",

        logoRequired:
          "Selecciona un logo.",

        logoUploadFailed:
          "Error al subir el logo.",

        logoDeleteFailed:
          "Error al eliminar el logo.",
      },
    },

    users: {
      title: "Usuarios",
      subtitle:
        "Gestiona las cuentas y los accesos de los usuarios.",

      addUser:
        "Añadir usuario",

      newUser:
        "Nuevo usuario",

      createSubtitle:
        "Crear una nueva cuenta de usuario.",

      information:
        "Información del usuario",

      role: "Rol",
      status: "Estado",
      userId: "ID de usuario",

      roles: {
        admin: "Administrador",
        owner: "Propietario",
        user: "Usuario",
      },

      statuses: {
        active: "Activo",
        inactive: "Inactivo",
        suspended: "Suspendido",
      },

      emptyTitle:
        "No hay usuarios",

      emptyMessage:
        "Actualmente no hay usuarios en tu organización.",

      backToUsers:
        "Usuarios",

      createTitle:
        "Crear usuario",

      createSureMessage:
        "¿Estás seguro de que quieres crear este usuario?",

      createSuccessTitle:
        "Usuario creado",

      createSuccessMessage:
        "El usuario se ha creado correctamente.",

      createFailTitle:
        "Error de creación",

      createFailMessage:
        "No se pudo crear el usuario.",

      loadFailTitle:
        "Error de carga",

      loadFailMessage:
        "No se pudieron cargar los usuarios. Inténtalo de nuevo.",

      deleteUser:
        "Eliminar usuario",

      deleteTitle:
        "Eliminar usuario",

      deleteSureMessage:
        "¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.",

      deleteSuccessTitle:
        "Usuario eliminado",

      deleteSuccessMessage:
        "El usuario se ha eliminado correctamente.",

      deleteFailTitle:
        "Error de eliminación",

      deleteFailMessage:
        "Ha ocurrido un error al eliminar el usuario.",

      errors: {
        deleteAdminOnly:
          "Solo los administradores pueden eliminar usuarios.",

        notFound:
          "Usuario no encontrado.",

        updateNotAuthorized:
          "No tienes autorización para actualizar este usuario.",

        passwordNotAuthorized:
          "No tienes autorización para cambiar esta contraseña.",

        requiredCreateFields:
          "Proporciona nombre, apellido, correo electrónico y contraseña.",

        requiredUpdateFields:
          "Proporciona nombre, apellido y correo electrónico.",

        requiredPasswordFields:
          "Proporciona la contraseña actual y la nueva contraseña.",

        emailExists:
          "Ya existe un usuario con este correo electrónico.",

        currentPasswordIncorrect:
          "La contraseña actual es incorrecta.",
      },

      editUser: "Editar usuario",
      editSubtitle: "Actualiza la información de la cuenta de este usuario.",
      inheritedFromEmployee: "El departamento y el rol de RR. HH. se heredan del empleado vinculado {name} ({department} — {jobTitle}). Para cambiarlos, actualiza el Departamento o el Puesto del empleado.",

      updateTitle: "Editar usuario",
      updateSureMessage: "¿Seguro que quieres guardar estos cambios?",

      updateSuccessTitle: "Usuario actualizado",
      updateSuccessMessage: "El usuario se ha actualizado correctamente.",

      updateFailTitle: "Error al actualizar",
      updateFailMessage: "No se pudo actualizar el usuario. Inténtalo de nuevo.",

      hrRole: {
        label: "Puesto de RR. HH.",
        notApplicable: "No aplicable (fuera de RR. HH.)",
        assistant: "Asistente de RR. HH.",
        officer: "Encargado/a de RR. HH.",
        manager: "Responsable de RR. HH.",
        director: "Director/a de RR. HH.",
      },

      department: "Departamento",
      departments: {
          management: "Dirección",
          hr: "Recursos Humanos",
          finance: "Finanzas",
          accounting: "Contabilidad",
          sales: "Ventas",
          purchasing: "Compras",
          marketing: "Marketing",
          production: "Producción",
          production_planning: "Planificación de la producción",
          quality_control: "Control de calidad",
          maintenance: "Mantenimiento",
          warehouse: "Almacén",
          logistics: "Logística",
          procurement: "Aprovisionamiento",
          engineering: "Ingeniería",
          design: "Diseño",
          research_development: "Investigación y Desarrollo",
          it: "Informática",
          customer_service: "Atención al cliente",
          administration: "Administración",
          health_safety_environment: "Salud, seguridad y medio ambiente",
          security: "Seguridad",
      },

      emptySearchTitle: "Sin resultados",
      emptySearchMessage: "Ningún usuario coincide con tu búsqueda.",

      toolbar: {
        searchPlaceholder: "Buscar usuarios...",
      },
    },
    employees: { related: { tabs: { attendance: "Asistencia", documents: "Documentos", contracts: "Contratos", advances: "Anticipos", absences: "Ausencias", salary: "Salario", }, empty: "Nada por aquí todavía.", }, linkedUser: { resetPasswordSureMessage: "¿Generar una nueva contraseña temporal para este empleado? Su contraseña actual dejará de funcionar.", resetPasswordTitle: "Restablecer contraseña", resetPassword: "Restablecer contraseña", loginNotCreatedTitle: "Empleado creado, pero aún sin acceso", loginCreatedMessage: "Correo: {email}\nContraseña temporal: {password}\n\nCompártela con el empleado — no se volverá a mostrar.", loginCreatedTitle: "Acceso creado", createLoginSureMessage: "¿Crear un nuevo acceso de autoservicio para este empleado? Se generará una contraseña temporal que se mostrará una sola vez.", createLoginTitle: "Crear acceso", createLogin: "Crear un nuevo acceso", orCreateNew: "o", actionFailed: "Algo salió mal. Inténtalo de nuevo.", searchPlaceholder: "Buscar usuarios por nombre o correo...", unlinkSureMessage: "¿Desvincular esta cuenta de este empleado? Perderá el acceso a Mi espacio.", unlinkTitle: "Desvincular cuenta de usuario", linkSureMessage: "¿Vincular esta cuenta a este empleado? Tendrá acceso a Mi espacio (nóminas, solicitudes de ausencia y anticipo, asistencia).", linkTitle: "Vincular cuenta de usuario", unlink: "Desvincular", link: "Vincular", linkedTo: "Vinculado a:", title: "Acceso de autoservicio", },
      title: "Empleados",
      subtitle: "Gestiona los empleados de tu empresa y su información de RR. HH.",
      addEmployee: "Añadir empleado",
      backToEmployees: "Volver a empleados",
      editEmployee: "Editar empleado",
      newEmployee: "Nuevo empleado",
      employeeInformation: "Información del empleado",
      loadFailTitle: "No se pudieron cargar los empleados",
      loadFailMessage: "Ocurrió un error al cargar los empleados. Inténtalo de nuevo.",
      loadCompaniesFailMessage: "Ocurrió un error al cargar las empresas. Inténtalo de nuevo.",

      createTitle: "Añadir empleado",
      createSureMessage: "¿Seguro que quieres crear este empleado?",
      createSuccessTitle: "Empleado creado",
      createSuccessMessage: "El empleado se ha creado correctamente.",
      createFailTitle: "No se pudo crear el empleado",
      createFailMessage: "Ocurrió un error al crear el empleado.",

      updateTitle: "Editar empleado",
      updateSureMessage: "¿Seguro que quieres guardar estos cambios?",
      updateSuccessTitle: "Empleado actualizado",
      updateSuccessMessage: "El empleado se ha actualizado correctamente.",
      updateFailTitle: "No se pudo actualizar el empleado",
      updateFailMessage: "Ocurrió un error al actualizar el empleado.",

      deleteTitle: "Eliminar empleado",
      deleteSureMessage: "¿Seguro que quieres eliminar a {name}? Esta acción no se puede deshacer.",
      deleteSuccessTitle: "Empleado eliminado",
      deleteSuccessMessage: "El empleado ha sido eliminado.",
      deleteFailTitle: "No se pudo eliminar el empleado",
      deleteFailMessage: "Ocurrió un error al eliminar el empleado.",

      selectCompanyRequired: "Selecciona una empresa.",
      invalidPhotoType: "Selecciona un archivo de imagen.",

      toolbar: {
        company: "Empresa",
        selectCompany: "Seleccionar empresa",
        loadingCompanies: "Cargando empresas...",
        searchPlaceholder: "Buscar empleados...",
      },

      companyInfo: {
        employeeCount_one: "{count} empleado",
        employeeCount_other: "{count} empleados",
      },

      emptyNoCompany: {
        title: "No se encontraron empresas",
        message: "Crea una empresa antes de añadir empleados.",
      },

      emptyNoEmployees: {
        title: "No se encontraron empleados",
        messageSearch: "Ningún empleado coincide con tu búsqueda.",
        messageDefault: "Esta empresa todavía no tiene empleados.",
        cta: "Añadir empleado",
      },

      loading: "Cargando empleados...",

      photo: {
        label: "Foto del empleado",
        choose: "Elegir foto",
        change: "Cambiar foto",
        remove: "Eliminar",
      },

      company: {
        label: "Empresa",
        selectPlaceholder: "Seleccionar empresa",
        unnamed: "Empresa sin nombre",
      },

      sections: {
        personalInformation: "Información personal",
        contactInformation: "Información de contacto",
        employment: "Empleo",
        identification: "Identificación",
        company: "Empresa",
        notes: "Notas",
      },

      documents: {
        menuButton: "Documentos",
        attestationTravail: "Certificado de empleo",
        attestationSalaire: "Certificado de empleo y salario",
        certificatTravail: "Certificado de trabajo",
        contratTravail: "Contrato de trabajo",
        soldeToutCompte: "Recibo de finiquito",
        generationFailed: "Error al generar el documento.",
      },

      bulkImport: {
        exportButton: "Exportar (CSV)",
        exportFailed: "No se pudieron exportar los empleados.",
        openButton: "Importar (CSV)",
        title: "Importar empleados en masa",
        helpText: "Sube un archivo CSV para crear varios empleados a la vez. Cada fila se comprueba primero — no se crea nada hasta que confirmes.",
        downloadTemplate: "Descargar plantilla CSV",
        preview: "Comprobar archivo",
        previewing: "Comprobando...",
        previewFailed: "No se pudo leer este archivo.",
        summaryValid: "{count} listo(s) para importar",
        summaryErrors: "{count} con errores",
        summaryWarnings: "{count} con avisos",
        rowOk: "Todo correcto",
        fixErrorsFirst: "Corrige las filas con errores y vuelve a subir el archivo antes de importar — las filas con solo avisos se importarán igualmente.",
        importButton: "Importar {count} empleado(s)",
        committing: "Importando...",
        commitFailed: "No se pudo completar la importación.",
        commitSuccess: "{count} empleado(s) importado(s) correctamente.",
      },

      fields: { createLoginCheckboxLabel: "Crear también un acceso de autoservicio para este empleado (usa su correo profesional)", createLogin: "Acceso de autoservicio", noDepartments: "Aún no hay departamentos — añade uno en Organización > Departamentos", manager: "Responsable directo", noManagerCandidates: "Aún no hay otro empleado en esta empresa",
        employeeNumber: "Número de empleado",
        employeeNumberPlaceholder: "EMP-001",

        firstName: "Nombre",
        firstNamePlaceholder: "Nombre",

        lastName: "Apellidos",
        lastNamePlaceholder: "Apellidos",

        firstNameArabic: "Nombre (árabe)",
        firstNameArabicPlaceholder: "الاسم الأول",

        lastNameArabic: "Apellidos (árabe)",
        lastNameArabicPlaceholder: "اسم العائلة",

        gender: "Género",
        genderPlaceholder: "Seleccionar género",

        dateOfBirth: "Fecha de nacimiento",

        placeOfBirth: "Lugar de nacimiento",
        placeOfBirthPlaceholder: "Ciudad",

        nationality: "Nacionalidad",
        nationalityPlaceholder: "Marroquí",

        maritalStatus: "Estado civil",
        maritalStatusPlaceholder: "Seleccionar estado",

        numberOfDependents: "Personas a cargo",

        cin: "CIN",
        cinPlaceholder: "AB123456",

        passportNumber: "Número de pasaporte",
        passportNumberPlaceholder: "Número de pasaporte",

        passportExpiryDate: "Caducidad del pasaporte",

        workPermitNumber: "Número de permiso de trabajo",
        workPermitNumberPlaceholder: "Número de permiso",

        workPermitExpiryDate: "Caducidad del permiso de trabajo",

        personalEmail: "Correo personal",
        personalEmailPlaceholder: "personal@email.com",

        workEmail: "Correo laboral",
        workEmailPlaceholder: "empleado@empresa.com",

        phone: "Teléfono",
        phonePlaceholder: "+212...",

        secondaryPhone: "Teléfono secundario",
        secondaryPhonePlaceholder: "+212...",

        street: "Calle",
        streetPlaceholder: "Dirección",

        city: "Ciudad",
        cityPlaceholder: "Ciudad",

        region: "Región",
        regionPlaceholder: "Región",

        postalCode: "Código postal",
        postalCodePlaceholder: "40000",

        country: "País",
        countryPlaceholder: "Marruecos",

        emergencyName: "Contacto de emergencia",
        emergencyNamePlaceholder: "Nombre completo",

        emergencyRelationship: "Parentesco",
        emergencyRelationshipPlaceholder: "Cónyuge, padre/madre...",

        emergencyPhone: "Teléfono de emergencia",
        emergencyPhonePlaceholder: "+212...",

        emergencyEmail: "Correo de emergencia",
        emergencyEmailPlaceholder: "email@ejemplo.com",

        hireDate: "Fecha de contratación",
        terminationDate: "Fecha de finalización",

        employmentStatus: "Estado laboral",
        employmentStatusPlaceholder: "Seleccionar estado",

        employmentType: "Tipo de contrato",
        employmentTypePlaceholder: "Seleccionar tipo",

        jobTitle: "Puesto",
        jobTitlePlaceholder: "Jefe de producción",

        department: "Departamento",
        departmentPlaceholder: "Producción",

        service: "Servicio",
        servicePlaceholder: "Ensamblaje",

        position: "Cargo",
        positionPlaceholder: "Operario",

        workLocation: "Lugar de trabajo",
        workLocationPlaceholder: "Fábrica",

        cnssNumber: "Número de la CNSS",
        cnssNumberPlaceholder: "Número de la CNSS",

        cnssRegistrationDate: "Fecha de registro en la CNSS",

        taxIdentificationNumber: "Número de identificación fiscal",
        taxIdentificationNumberPlaceholder: "NIF",

        taxStatus: "Situación fiscal",
        taxStatusPlaceholder: "Situación fiscal",

        numberOfChildren: "Número de hijos",

        spouseWorking: "Cónyuge trabaja",
        spouseWorkingCheckboxLabel: "El cónyuge trabaja actualmente",

        bankName: "Nombre del banco",
        bankNamePlaceholder: "Banco",

        accountName: "Titular de la cuenta",
        accountNamePlaceholder: "Titular de la cuenta",

        rib: "RIB",
        ribPlaceholder: "RIB",

        iban: "IBAN",
        ibanPlaceholder: "IBAN",

        paymentMethod: "Método de pago",
        paymentMethodPlaceholder: "Seleccionar método",

        notes: "Notas",
        notesPlaceholder: "Notas adicionales...",

        isActive: "Activo",
        isActiveCheckboxLabel: "El empleado está activo",
      },

      genders: {
        male: "Masculino",
        female: "Femenino",
        other: "Otro",
      },

      maritalStatuses: {
        single: "Soltero/a",
        married: "Casado/a",
        divorced: "Divorciado/a",
        widowed: "Viudo/a",
        other: "Otro",
      },

      taxStatus: {
        taxable: "Sujeto a impuestos",
        nonTaxable: "No sujeto a impuestos",
        exempt: "Exento",
      },

      statuses: {
        active: "Activo",
        inactive: "Inactivo",
        on_leave: "De baja",
        suspended: "Suspendido",
        terminated: "Contrato finalizado",
        unknown: "Desconocido",
      },

      employmentTypes: {
        permanent: "Indefinido",
        fixed_term: "Temporal",
        temporary: "Eventual",
        intern: "Becario",
        apprentice: "Aprendiz",
        freelance: "Autónomo",
        part_time: "Media jornada",
        other: "Otro",
      },

      paymentMethods: {
        bank_transfer: "Transferencia bancaria",
        cash: "Efectivo",
        check: "Cheque",
      },

      card: {
        view: "Ver",
        edit: "Editar",
      },

      detail: {
        employeeLabel: "Empleado",
        firstName: "Nombre",
        lastName: "Apellidos",
        gender: "Género",
        dateOfBirth: "Fecha de nacimiento",
        nationality: "Nacionalidad",
        maritalStatus: "Estado civil",
        phone: "Teléfono",
        email: "Correo electrónico",
        address: "Dirección",
        jobTitle: "Puesto",
        department: "Departamento",
        employmentType: "Tipo de contrato",
        hireDate: "Fecha de contratación",
        workLocation: "Lugar de trabajo",
        service: "Servicio",
        cin: "CIN",
        passport: "Pasaporte",
        cnssNumber: "Número de la CNSS",
        taxId: "NIF",
        empty: "—",
      },

      buttons: {
        save: "Guardando...",
        createEmployee: "Crear empleado",
        updateEmployee: "Actualizar empleado",
        cancel: "Cancelar",
      },

      breadcrumbs: {
        hr: "RR. HH.",
        employees: "Empleados",
        addEmployee: "Añadir empleado",
        editEmployee: "Editar empleado",
      },

      errors: {
        companyRequired: "Selecciona una empresa.",
        invalidPhoto: "Selecciona un archivo de imagen.",
        fetchCompaniesFailed: "Error al obtener las empresas",
        fetchEmployeesFailed: "Error al obtener los empleados",
        createFailed: "Error al crear el empleado",
        updateFailed: "Error al actualizar el empleado",
        deleteFailed: "Error al eliminar el empleado",
        notFound: "Empleado no encontrado",
        duplicateEmployeeNumber: "Ya existe un empleado con este número",
        requiredFields: "Completa todos los campos obligatorios",
      },
    },
    salaries: {
      title: "Salarios",
      subtitle: "Gestiona la retribución y el historial salarial de los empleados.",
      addSalary: "Añadir salario",
      giveRaise: "Dar un aumento",

      createTitle: "Nuevo registro salarial",
      createSureMessage: "¿Seguro que quieres guardar este salario? El salario actual de este empleado se cerrará a partir de esta fecha de vigencia.",
      createSuccessTitle: "Salario registrado",
      createSuccessMessage: "El registro salarial se ha creado correctamente.",

      deleteTitle: "Eliminar registro salarial",
      deleteSureMessage: "¿Seguro que quieres eliminar este registro salarial? Esta acción no se puede deshacer.",

      emptyTitle: "Sin salarios",
      emptyMessage: "Esta empresa todavía no tiene registros salariales.",

      fields: {
        employee: "Empleado",
        employeeSearchPlaceholder: "Buscar por nombre, número, CIN, CNSS...",
        baseSalary: "Salario base",
        effectiveDate: "Fecha de vigencia",
        notes: "Notas",
        notesPlaceholder: "Motivo de este cambio, contexto adicional...",
      },

      table: {
        base: "Base",
        gross: "Bruto",
        net: "Neto",
        endDate: "Fecha de fin",
        status: "Estado",
        ongoing: "En curso",
      },

      actions: {
        history: "Ver historial",
      },

      history: { deleteRecord: "Eliminar este registro salarial",
        titleFor: "Historial salarial — {name}",
        empty: "No hay historial salarial para este empleado.",
        current: "Actual",
        past: "Anterior",
      },

      breadcrumbs: {
        hr: "RR. HH.",
        salaries: "Salarios",
      },

      buttons: {
        create: "Guardar salario",
      },

      errors: {
        fetchFailed: "Error al cargar los salarios",
        actionFailed: "Algo salió mal. Inténtalo de nuevo.",
      },
    },
    absences: {
      title: "Ausencias",
      subtitle: "Revisa y gestiona las solicitudes de permiso y ausencia.",
      addAbsence: "Nueva solicitud de ausencia",

      createTitle: "Nueva solicitud de ausencia",
      createSureMessage: "¿Seguro que quieres enviar esta solicitud de ausencia?",
      createSuccessTitle: "Solicitud enviada",
      createSuccessMessage: "La solicitud de ausencia se ha enviado correctamente.",

      acceptTitle: "Aceptar ausencia",
      acceptSureMessage: "¿Seguro que quieres aceptar esta solicitud de ausencia?",

      rejectTitle: "Rechazar ausencia",
      rejectSureMessage: "¿Seguro que quieres rechazar esta solicitud de ausencia?",

      deleteTitle: "Eliminar ausencia",
      deleteSureMessage: "¿Seguro que quieres eliminar este registro de ausencia? Esta acción no se puede deshacer.",

      emptyTitle: "Sin ausencias",
      emptyMessage: "Ninguna solicitud de ausencia coincide con tus filtros.",

      unjustified: "No justificada",

      fields: {
        employee: "Empleado",
        employeeSearchPlaceholder: "Buscar por nombre, número, CIN, CNSS...",
        type: "Tipo",
        startDate: "Fecha de inicio",
        endDate: "Fecha de fin",
        halfDay: "Medio día",
        justified: "Justificada",
        reason: "Motivo",
        reasonPlaceholder: "Motivo o contexto adicional...",
        reviewComment: "Comentario de revisión",
        status: "Estado",
      },

      types: {
        paid_leave: "Permiso retribuido",
        unpaid_leave: "Permiso no retribuido",
        sick_leave: "Baja por enfermedad",
        absence: "Ausencia",
        other: "Otro",
      },

      status: { manager_approved: "Aprobada por el responsable",
        pending: "Pendiente",
        accepted: "Aceptada",
        rejected: "Rechazada",
      },

      filters: {
        allStatuses: "Todos los estados",
        allTypes: "Todos los tipos",
      },

      table: {
        period: "Periodo",
        days: "Días",
      },

      actions: {
        accept: "Aceptar",
        reject: "Rechazar",
      },

      breadcrumbs: {
        hr: "RR. HH.",
        absences: "Ausencias",
      },

      buttons: {
        create: "Enviar solicitud",
      },

      errors: {
        fetchFailed: "Error al cargar las ausencias",
        actionFailed: "Algo salió mal. Inténtalo de nuevo.",
      },
    },
    advances: {
      title: "Anticipos",
      subtitle: "Revisa y gestiona las solicitudes de anticipo salarial.",
      addAdvance: "Nueva solicitud de anticipo",

      createTitle: "Nueva solicitud de anticipo",
      createSureMessage: "¿Seguro que quieres enviar esta solicitud de anticipo?",
      createSuccessTitle: "Solicitud enviada",
      createSuccessMessage: "La solicitud de anticipo se ha enviado correctamente.",

      acceptTitle: "Aceptar anticipo",
      acceptSureMessage: "¿Seguro que quieres aceptar esta solicitud de anticipo?",

      rejectTitle: "Rechazar anticipo",
      rejectSureMessage: "¿Seguro que quieres rechazar esta solicitud de anticipo?",

      markRepaidTitle: "Marcar como reembolsado",
      markRepaidSureMessage: "¿Seguro que quieres marcar este anticipo como totalmente reembolsado?",

      deleteTitle: "Eliminar anticipo",
      deleteSureMessage: "¿Seguro que quieres eliminar este registro de anticipo? Esta acción no se puede deshacer.",

      emptyTitle: "Sin anticipos",
      emptyMessage: "Ninguna solicitud de anticipo coincide con tus filtros.",

      fields: {
        employee: "Empleado",
        employeeSearchPlaceholder: "Buscar por nombre, número, CIN, CNSS...",
        amount: "Importe",
        requestDate: "Fecha de solicitud",
        reason: "Motivo",
        reasonPlaceholder: "Motivo o contexto adicional...",
        reviewComment: "Comentario de revisión",
        status: "Estado",
      },

      status: { manager_approved: "Aprobada por el responsable",
        pending: "Pendiente",
        accepted: "Aceptado",
        rejected: "Rechazado",
      },

      filters: {
        allStatuses: "Todos los estados",
      },

      table: {
        remaining: "Restante",
        fullyRepaid: "Totalmente reembolsado",
      },

      actions: {
        accept: "Aceptar",
        reject: "Rechazar",
        markRepaid: "Marcar como reembolsado",
      },

      breadcrumbs: {
        hr: "RR. HH.",
        advances: "Anticipos",
      },

      buttons: {
        create: "Enviar solicitud",
      },

      errors: {
        fetchFailed: "Error al cargar los anticipos",
        actionFailed: "Algo salió mal. Inténtalo de nuevo.",
      },
    },

    units: {
      unit: "Unidad",
      piece: "Pieza",
      pair: "Par",
      dozen: "Docena",
      set: "Juego",
      kg: "Kilogramo (kg)",
      g: "Gramo (g)",
      t: "Tonelada (t)",
      lb: "Libra (lb)",
      oz: "Onza (oz)",
      quintal: "Quintal (q)",
      l: "Litro (L)",
      ml: "Mililitro (mL)",
      m3: "Metro cúbico (m³)",
      gal: "Galón (gal)",
      m: "Metro (m)",
      cm: "Centímetro (cm)",
      mm: "Milímetro (mm)",
      km: "Kilómetro (km)",
      ft: "Pie (ft)",
      in: "Pulgada (in)",
      yd: "Yarda (yd)",
      m2: "Metro cuadrado (m²)",
      ft2: "Pie cuadrado (ft²)",
      ha: "Hectárea (ha)",
      box: "Caja",
      carton: "Cartón",
      pallet: "Palé",
      bag: "Bolsa",
      sack: "Saco",
      bottle: "Botella",
      can: "Lata",
      roll: "Rollo",
      sheet: "Hoja",
      bundle: "Paquete",
      case: "Estuche",
      drum: "Tambor",
      barrel: "Barril",
      container: "Contenedor",
      hour: "Hora",
      day: "Día",
      month: "Mes",
    },

    contentTranslation: {
      title: "Traducciones",
      editButton: "Traducciones",
      original: "Original",
      auto: "Traducido automáticamente",
      manual: "Editado manualmente",
      missing: "Aún no traducido",
      regenerate: "Regenerar",
      originalHint: "Este es el texto original — edita el campo mismo para cambiarlo.",
      save: "Guardar",
      saving: "Guardando…",
      close: "Cerrar",
      placeholder: "Ingresa la traducción…",
      errors: {
        loadFailed: "No se pudieron cargar las traducciones.",
        saveFailed: "No se pudo guardar la traducción.",
        regenerateFailed: "No se pudo regenerar la traducción.",
      },
    },

    departments: { noManagerBadge: "Sin responsable", managerLabel: "Responsable", moduleAccessBadge: "Acceso al módulo",
      title: "Departamentos",
      subtitle: "Defina los departamentos de su organización y los puestos dentro de cada uno.",
      addDepartment: "Añadir departamento",
      addDefaults: "Añadir departamentos predeterminados",
      defaultsModal: {
        title: "Añadir departamentos predeterminados",
        helpText: "Elige los departamentos que quieres añadir — cada uno incluye un nombre y descripción estándar y (para RR. HH./Producción) el acceso al módulo ya configurado. Podrás editarlos o añadir más después.",
        adding: "Añadiendo...",
        addButton: "Añadir {count} departamento(s)",
      },
      editDepartment: "Editar departamento",
      addPosition: "Añadir puesto",
      editPosition: "Editar puesto",
      deleteTitle: "Eliminar departamento",
      deleteSureMessage: "¿Seguro que desea eliminar este departamento? Los empleados y puestos que aún lo usan deben reasignarse primero.",
      deletePositionTitle: "Eliminar puesto",
      deletePositionSureMessage: "¿Seguro que desea eliminar este puesto? Los empleados que lo ocupan, u otros puestos que dependen de él, deben reasignarse primero.",
      emptyTitle: "Aún no hay departamentos",
      emptyMessage: "Añada su primer departamento para empezar a construir su estructura organizativa.",
      searchPlaceholder: "Buscar departamentos...",
      noSearchResults: "Ningún departamento coincide con tu búsqueda.",
      noPositions: "Aún no hay puestos definidos en este departamento.",
      fields: { purchasingAccess: "Acceso al módulo de Compras", manager: "Responsable del departamento", noManager: "Sin responsable", managerHint: "Supervisa todo el departamento: acceso completo al módulo, aprueba las solicitudes del equipo y decide qué puestos dan acceso al módulo.", grantsModuleAccess: "Da acceso al módulo", grantsModuleAccessHint: "Quienes ocupen este puesto acceden al módulo del departamento (p. ej. RR. HH. o Inventario). Déjalo desactivado para el personal que solo debe ver Mi espacio.",
        name: "Nombre", description: "Descripción", permissionKey: "Acceso al módulo",
        permissionKeyHint: "Opcional — asígnelo solo a UN departamento si los empleados de ahí (y sus cuentas creadas automáticamente) deben tener acceso al módulo de RR. HH. o de Producción. La mayoría de los departamentos deben dejarlo en «Sin acceso especial».",
        category: "Función",
        noCategory: "Sin función específica",
        categoryHint: "Opcional — permite que el formulario de empleado sugiera puestos estándar para este departamento en lugar de dejarlo como texto libre. Es solo una sugerencia, sin relación con los accesos, a diferencia del campo Acceso al módulo anterior.",
        noSpecialAccess: "Sin acceso especial", hrAccess: "Acceso al módulo de RR. HH.", productionAccess: "Acceso al módulo de Producción",
        positionTitle: "Nombre del puesto", reportsTo: "Depende de", noReportsTo: "Ninguno (puesto de nivel superior)",
        salaryMin: "Banda salarial — mín.", salaryMax: "Banda salarial — máx.", salaryBand: "Banda salarial",
        requiredSkills: "Habilidades requeridas", requiredSkillsPlaceholder: "Separadas por comas, ej. Excel, Liderazgo",
      },
      errors: {
        nameRequired: "El nombre del departamento es obligatorio", titleRequired: "El nombre del puesto es obligatorio",
        saveFailed: "Ocurrió un error al guardar.", deleteFailed: "Ocurrió un error al eliminar.",
      },
    },

    payroll: {
      title: "Nómina",
      subtitle: "Genere ciclos de nómina mensuales y gestione los recibos de sueldo.",
      generateRun: "Generar nómina",
      createTitle: "Generar ciclo de nómina",
      createSureMessage: "¿Generar la nómina de este período? Se creará un recibo de sueldo para cada empleado activo con un salario registrado.",
      createSuccessTitle: "Ciclo de nómina creado",
      createSuccessMessage: "El ciclo de nómina se generó correctamente.",
      completeTitle: "Cerrar ciclo de nómina",
      completeSureMessage: "¿Cerrar este ciclo de nómina? Una vez cerrado, los recibos quedan bloqueados y se notifica a los empleados.",
      deleteTitle: "Eliminar ciclo de nómina",
      deleteSureMessage: "¿Eliminar este ciclo de nómina en borrador y todos sus recibos? Esta acción no se puede deshacer.",
      emptyTitle: "Aún no hay ciclos de nómina",
      emptyMessage: "Genere el primer ciclo de nómina para esta empresa.",
      noPayslips: "No hay recibos de sueldo en este ciclo.",
      fields: { month: "Mes", year: "Año", status: "Estado" },
      table: { period: "Período", employees: "Empleados", gross: "Bruto", net: "Neto", searchPlaceholder: "Buscar empleados..." },
      status: { draft: "Borrador", completed: "Cerrado", voided: "Anulado" },
      payslipStatus: { draft: "Borrador", validated: "Validado", paid: "Pagado" },
      actions: { view: "Ver", complete: "Cerrar", regenerate: "Regenerar", markPaid: "Marcar como pagado", downloadPdf: "Descargar recibo" },
      exports: {
        cnss: "Exportación CNSS",
        cnssHint: "Hoja de declaración — verifique con el formato Damancom actual antes de subirla",
        register: "Registro de nómina",
        bankTransfer: "Archivo de transferencia bancaria",
      },
      buttons: { generate: "Generar", saving: "Guardando..." },
      breadcrumbs: { hr: "RR. HH.", payroll: "Nómina" },
      months: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
      errors: { fetchFailed: "Error al cargar los ciclos de nómina", actionFailed: "Algo salió mal. Inténtalo de nuevo." },
    },

    contracts: {
      title: "Contratos",
      subtitle: "Realice el seguimiento de los contratos de trabajo, sus renovaciones y vencimientos.",
      addContract: "Nuevo contrato",
      createTitle: "Nuevo contrato",
      createSureMessage: "¿Seguro que desea crear este contrato?",
      createSuccessTitle: "Contrato creado",
      createSuccessMessage: "El contrato se creó correctamente.",
      renewTitle: "Renovar contrato",
      renewSureMessage: "¿Renovar este contrato? El contrato actual se cerrará y comenzará uno nuevo.",
      deleteTitle: "Eliminar contrato",
      deleteSureMessage: "¿Seguro que desea eliminar este contrato? Esta acción no se puede deshacer.",
      emptyTitle: "Aún no hay contratos",
      emptyMessage: "Esta empresa aún no tiene contratos registrados.",
      expiringBanner: "{count} contrato(s) vencen en los próximos 30 días.",
      fields: { employee: "Empleado", type: "Tipo de contrato", startDate: "Fecha de inicio", endDate: "Fecha de fin" },
      status: { active: "Activo", expired: "Vencido", terminated: "Rescindido", renewed: "Renovado" },
      actions: { renew: "Renovar" },
      buttons: { create: "Guardar contrato" },
      breadcrumbs: { hr: "RR. HH.", contracts: "Contratos" },
      errors: { fetchFailed: "Error al cargar los contratos", actionFailed: "Algo salió mal. Inténtalo de nuevo." },
    },

    documents: {
      title: "Documentos",
      subtitle: "Almacene los documentos de los empleados y controle sus fechas de vencimiento.",
      uploadDocument: "Subir documento",
      editDocument: "Editar documento",
      deleteTitle: "Eliminar documento",
      deleteSureMessage: "¿Seguro que desea eliminar este documento? Esta acción no se puede deshacer.",
      emptyTitle: "Aún no hay documentos",
      emptyMessage: "Esta empresa aún no tiene documentos registrados.",
      expiringBanner: "{count} documento(s) vencen en los próximos 30 días.",
      fields: { employee: "Empleado", type: "Tipo", label: "Etiqueta", labelPlaceholder: "ej. Documento de identidad", expiryDate: "Fecha de vencimiento", file: "Archivo", replaceFile: "Reemplazar archivo (opcional)" },
      table: { file: "Archivo" },
      types: {
        cin: "DNI (CIN)", passport: "Pasaporte", work_permit: "Permiso de trabajo",
        residence_permit: "Permiso de residencia", contract: "Contrato", diploma: "Diploma",
        cv: "CV", medical_certificate: "Certificado médico", other: "Otro",
      },
      actions: { view: "Ver", loadMore: "Cargar más", loadMoreCount: "Mostrando {loaded} de {total}" },
      buttons: { upload: "Subir" },
      breadcrumbs: { hr: "RR. HH.", documents: "Documentos" },
      errors: {
        fetchFailed: "Error al cargar los documentos", actionFailed: "Algo salió mal. Inténtalo de nuevo.",
        missingFields: "Seleccione un empleado y un archivo.", uploadFailed: "Error al subir el documento.",
      },
    },

    attendance: {
      title: "Asistencia",
      subtitle: "Consulte los registros de entrada y salida.",
      emptyTitle: "No hay registros de asistencia",
      emptyMessage: "Ningún registro de asistencia coincide con sus filtros.",
      filterAllEmployees: "Todos los empleados",
      fields: { employee: "Empleado", date: "Fecha", clockIn: "Entrada", clockOut: "Salida", notes: "Notas" },
      status: { present: "Presente", late: "Tarde", absent: "Ausente", half_day: "Media jornada", holiday: "Festivo" },
      breadcrumbs: { hr: "RR. HH.", attendance: "Asistencia" },
      errors: { fetchFailed: "Error al cargar la asistencia" },
    },

    reports: { chart: { zoomHint: "Arrastra los controles bajo el gráfico para ampliar", yearly: "Anual", monthly: "Mensual", view: "Vista", lastMonths: "Últimos {n} meses", range: "Periodo", },
      title: "Informes",
      subtitle: "Plantilla, rotación, absentismo y evolución del coste de la nómina.",
      stats: { totalHeadcount: "Plantilla total", activeEmployees: "Empleados activos", currentGross: "Bruto mensual actual (est.)", currentNet: "Neto mensual actual (est.)", missingSalaryNote: "{count} empleado(s) activo(s) aún no tienen un salario registrado — no incluidos en esta estimación." },
      expand: "Ampliar",
      charts: {
        headcountByDepartment: "Plantilla por departamento", turnover: "Rotación (últimos 12 meses)",
        hires: "Contrataciones", terminations: "Bajas", absenteeism: "Tasa de absentismo (últimos 6 meses)",
        absenteeismRate: "Tasa de absentismo", payrollCost: "Coste de la nómina (últimos 12 meses)",
        estimatedFootnote: "* El mes actual, marcado con un asterisco, es una estimación en tiempo real basada en los salarios actuales — la nómina aún no se ha ejecutado para este período.",
      },
      breadcrumbs: { hr: "RR. HH.", reports: "Informes" },
      loadError: "No se pudieron cargar algunos datos del informe. Inténtalo de nuevo o consulta la consola para más detalles.",
      rankings: {
        title: "Clasificación de empleados",
        last30Days: "Últimos 30 días",
        last90Days: "Últimos 90 días",
        last365Days: "Últimos 12 meses",
        mostAbsenceDays: "Más días de ausencia",
        bestAttendanceRate: "Mejor tasa de asistencia",
        mostOvertimeHours: "Más horas extra",
        mostLateDays: "Más llegadas tarde",
        noData: "No hay datos para este período.",
        days: "días",
      },
    },  twoFactor: { qrAlt: "Código QR de 2FA",
    title: "Autenticación de dos factores",
    disabledHint: "Añade una capa extra de seguridad a tu cuenta — además de tu contraseña, necesitarás un código de una aplicación de autenticación para iniciar sesión.",
    enabledHint: "La autenticación de dos factores está activada en tu cuenta. Se te pedirá un código de tu aplicación de autenticación cada vez que inicies sesión.",
    enableButton: "Activar la autenticación de dos factores",
    disableButton: "Desactivar la autenticación de dos factores",
    disabling: "Desactivando...",
    scanTitle: "Escanea el código QR",
    scanHint: "Escanéalo con una aplicación de autenticación (Google Authenticator, Authy, etc.) y luego introduce el código de 6 dígitos que muestra para confirmar.",
    manualEntryLabel: "¿No puedes escanearlo? Introduce este código manualmente:",
    confirmAndEnable: "Confirmar y activar",
    verifying: "Verificando...",
    backupCodesTitle: "Guarda tus códigos de respaldo",
    backupCodesHint: "Cada código se puede usar una vez para iniciar sesión si pierdes el acceso a tu aplicación de autenticación. Guárdalos en un lugar seguro — no se volverán a mostrar.",
    copyBackupCodes: "Copiar códigos",
    copied: "Copiado",
    iSavedThem: "He guardado estos códigos",
    confirmPasswordLabel: "Confirma tu contraseña para continuar",
    errors: {
      statusFailed: "No se pudo comprobar el estado de la autenticación de dos factores.",
      setupFailed: "No se pudo iniciar la configuración de la autenticación de dos factores.",
      invalidCode: "Ese código no coincide — revisa tu aplicación de autenticación e inténtalo de nuevo.",
      disableFailed: "No se pudo desactivar la autenticación de dos factores.",
    },
  },

  disciplinaryActions: {
    title: "Acciones disciplinarias",
    subtitle: "Registra advertencias y medidas correctivas emitidas a los empleados.",
    addAction: "Añadir registro",
    editAction: "Editar registro",
    emptyTitle: "Aún no hay registros disciplinarios",
    emptyMessage: "Esta empresa no tiene acciones disciplinarias registradas.",
    deleteTitle: "Eliminar registro",
    deleteSureMessage: "¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer.",
    acknowledged: "Confirmado",
    notAcknowledged: "Aún sin confirmar",
    breadcrumbs: {
      hr: "RR. HH.",
      disciplinaryActions: "Acciones disciplinarias",
    },
    fields: {
      employee: "Empleado",
      type: "Tipo",
      date: "Fecha",
      reason: "Motivo",
      description: "Descripción",
      suspensionDays: "Suspensión (días)",
      issuedBy: "Emitido por",
      notes: "Notas",
    },
    types: {
      verbal_warning: "Advertencia verbal",
      written_warning: "Advertencia por escrito",
      final_warning: "Última advertencia",
      suspension: "Suspensión",
      termination_notice: "Aviso de despido",
    },
    errors: {
      fetchFailed: "Error al cargar las acciones disciplinarias",
      saveFailed: "Error al guardar el registro",
      deleteFailed: "Error al eliminar el registro",
    },
  },
  performanceReviews: {
    title: "Evaluaciones de desempeño",
    subtitle: "Ciclos de evaluación, objetivos y calificaciones de tus empleados.",
    addReview: "Nueva evaluación",
    editReview: "Editar evaluación",
    emptyTitle: "Aún no hay evaluaciones",
    emptyMessage: "Esta empresa no tiene evaluaciones registradas.",
    deleteTitle: "Eliminar evaluación",
    deleteSureMessage: "¿Seguro que deseas eliminar esta evaluación? Esta acción no se puede deshacer.",
    reviewedBy: "Evaluado por",
    submitButton: "Enviar al empleado",
    breadcrumbs: {
      hr: "RR. HH.",
      performanceReviews: "Evaluaciones",
    },
    fields: {
      employee: "Empleado",
      reviewer: "Evaluador",
      periodLabel: "Período de evaluación",
      periodLabelPlaceholder: "ej. Evaluación anual 2026",
      reviewDate: "Fecha de evaluación",
      goals: "Objetivos (uno por línea)",
      goalsPlaceholder: "Mejorar el tiempo de respuesta en tickets de soporte\nCompletar la certificación de incorporación",
      strengths: "Fortalezas",
      areasForImprovement: "Áreas de mejora",
      comments: "Comentarios",
    },
    criteria: {
      jobKnowledge: "Conocimiento del puesto",
      qualityOfWork: "Calidad del trabajo",
      communication: "Comunicación",
      teamwork: "Trabajo en equipo",
      initiative: "Iniciativa",
      punctuality: "Puntualidad",
    },
    statuses: {
      draft: "Borrador",
      submitted: "Enviada",
      acknowledged: "Confirmada",
    },
    errors: {
      fetchFailed: "Error al cargar las evaluaciones",
      saveFailed: "Error al guardar la evaluación",
      submitFailed: "Error al enviar la evaluación",
      deleteFailed: "Error al eliminar la evaluación",
    },
  },
  leaveCalendar: {
    title: "Calendario de ausencias",
    subtitle: "Consulta de un vistazo quién está de baja aprobada.",
    previousMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    breadcrumbs: {
      hr: "RR. HH.",
      leaveCalendar: "Calendario de ausencias",
    },
    weekdays: {
      0: "Lun",
      1: "Mar",
      2: "Mié",
      3: "Jue",
      4: "Vie",
      5: "Sáb",
      6: "Dom",
    },
    errors: {
      fetchFailed: "Error al cargar el calendario de ausencias",
    },
  },
};
