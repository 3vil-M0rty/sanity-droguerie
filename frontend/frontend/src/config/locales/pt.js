// UI dictionary — pt. Split out of i18n.config.js so each language
// is its own module (see loadLanguage there).
export default { quota: { title: "Quotas", hint: "Vazio = ilimitado. Funcionários desligados não contam. Baixar uma quota não apaga nada: o cliente apenas deixa de poder criar mais.", maxCompanies: "Máx. de empresas", maxEmployees: "Máx. de funcionários", unlimited: "Ilimitado", edit: "Editar quotas", saved: "Quotas guardadas.", companies: "Empresas", employees: "Funcionários", companiesFull: "Limite de empresas atingido — contacte a plataforma para o aumentar.", employeesFull: "Limite de funcionários atingido — contacte a plataforma para o aumentar. Um funcionário desligado liberta um lugar.", employeesHint: "Funcionários usados / permitidos (os desligados não contam).", newCompany: "Nova empresa", }, prodPlan: { barsOf: "barras de {length} mm", }, wsMulti: { departmentSchedule: "Horário de trabalho", useDefault: "Horário padrão ({name})", departmentScheduleHint: "Os horários criam-se em Organização › Horário de trabalho.", deleteConfirm: "Eliminar o horário «{name}»? Os seus departamentos voltam ao horário padrão.", namePlaceholder: "ex. Oficina – repartido, sábado de manhã", copyCurrent: "Copiar o horário atual", new: "Novo horário", name: "Nome do horário", default: "Horário padrão", makeDefault: "Definir como padrão", departments: "Departamentos", noDepartments: "Ainda não há departamentos nesta empresa.", leaveDefaultHint: "Já está no horário padrão — atribua-o a outro horário para o mover.", currently: "Atualmente: {name}", defaultHint: "O horário padrão aplica-se a todos os departamentos sem horário próprio.", assignHint: "Marque os departamentos que seguem este horário; os desmarcados voltam ao horário padrão.", splitDay: "Pausa", splitDayHint: "Dia repartido (manhã + tarde). Desmarque para meio dia ou dia contínuo.", splitOn: "Repartido", splitOff: "Contínuo", }, platformCo: { companyTitle: "Companies", companyAdd: "Add a company", companyNone: "No company yet.", companyAdminHint: "A client can have several companies (group, subsidiaries). Its admin can also create them from Organisation › Company; every screen has a “Company” picker.", companyFirst: "First company (optional)", companyFirstHint: "More companies can be added later, here or by the client's admin.", companyName: "Company name", companyNamePlaceholder: "e.g. Atlas Joinery Ltd", companyLegalForm: "Legal form", companyOtherForm: "Other", companyIndustry: "Activity", companyIndustryPlaceholder: "e.g. Aluminium joinery", companyCity: "City", companyAdded: "Company “{name}” added.", }, perm: { teamMenu: "Permissões da minha equipa", title: "Permissões de acesso", subtitleAll: "Everyone's permissions, action by action. Managers then hand out the ones they have to their team.", subtitleTeam: "Give each person in your team the permissions they need — among the ones you have yourself.", searchPeople: "Procurar uma pessoa…", emptyTeam: "Nobody reports to you in this company.", manager: "Responsável", pickSomeone: "Escolha uma pessoa à esquerda.", rules: "Each department has a manager, who gets every permission of its module. A manager only gives permissions they have themselves, to the people of their department and everyone reporting to them (all levels). They can also let a team lead hand out permissions in turn (“Team › Team permissions”).", noLoginHint: "This person has no login: create one from their employee file (HR) to give them permissions.", selfHint: "You can't change your own permissions — your manager does.", fullAccessHint: "Admin / owner: full access to everything.", managesHint: "Manager of {deps}: that module's permissions are automatic.", applyPreset: "Aplicar um perfil…", resetHint: "Back to their department / position default profile", reset: "Perfil do cargo", legendOn: "Concedida", legendAuto: "Automática (responsável)", legendOff: "Não concedida", legendGrantable: "Greyed boxes are permissions you don't have yourself.", all: "Tudo", none: "Nada", toggleRow: "all / none", autoHint: "Automatic: this person manages the department", notGrantable: "You don't have this permission: you can't give or remove it", noLogin: "Sem conta", fullAccess: "Acesso completo", custom: "Personalizado", roleProfile: "Perfil do cargo", saved: "Permissões guardadas: {added} adicionadas, {removed} retiradas.", resetConfirm: "Put back their department / position default profile? Their custom permissions will be lost.", resetDone: "Default profile restored.", errors: { load: "Couldn't load the permissions.", save: "Couldn't save the permissions.", }, }, cv: { parentCategory: "Categoria principal", noParent: "Nenhuma (categoria principal)", parentHint: "Ex. « Perfis de alumínio » › « Série ATLAS 78 — de correr ». Uma subcategoria sem conta contabilística usa a da categoria principal.", addSubCategory: "Adicionar uma subcategoria", articlesCount: "{n} artigo(s)", subCount: "{n} subcategoria(s)", amountsLabel: "Montantes", amountsCheckbox: "Ver preços, custos, margens e orçamentos (sempre visíveis para administradores, proprietários, vendas, finanças, contabilidade e direção)", visual: "Aparência", visualHint: "Como o modelo aparece no catálogo, nos projetos e no PDF do orçamento: um esquema à escala a partir de L × H — ou a sua própria imagem (foto, desenho do catálogo do fornecedor), que então substitui o esquema em todo o lado.", schematic: "Esquema gerado", picture: "Imagem (opcional)", noPicture: "Sem imagem", changePicture: "Alterar a imagem", uploadPicture: "Carregar uma imagem", drawingType: "Tipo de esquema", leaves: "Folhas", opening: "Abertura", layers: "Número de vidros", grid_nx: "Colunas", grid_ny: "Linhas", solidLeaf: "Folha cega (painel, sem vidro)", railingBars: "Barras (em vez de vidro)", drawingParamsHint: "Os parâmetros chamados n (folhas), nx / ny (grelha), lf, hi / ha (compostos) ou ent (espaçamento dos postes) substituem estes valores linha a linha.", ralPick: "Escolher na carta RAL", ralPickPh: "Procurar um RAL (9016, antracite…)", ralNone: "Nenhum RAL encontrado", projectFinish: "Cor predefinida (RAL)", drawingTypes: { sliding: "De correr", casement: "Janela de batente", door: "Porta", folding: "Harmónio", fixed: "Fixo", grid: "Grelha / fachada cortina", combo: "Composto", shutter: "Estore de enrolar", louvre: "Lamelas", railing: "Guarda-corpo", pergola: "Pérgola", glass: "Vidro", garage: "Porta de garagem", panel: "Painel", cladding: "Revestimento", generic: "Genérico", }, openings: { side: "Batente", ob: "Oscilobatente", soufflet: "Basculante inferior", projetant: "Projetante", basculant: "Basculante", pivotant: "Pivotante", }, }, notificationEvents: { permissionsChanged: { title: "As suas permissões mudaram", message: "{added} adicionadas, {removed} retiradas", }, quoteAcceptedProd: { title: "Orçamento {number} aceite", message: "{customer} — o projeto vai chegar à produção", }, orderPlanned: { title: "Nova ordem de fabrico {number}", message: "{workshop} · {project}", }, orderPlannedWaiting: { title: "Nova ordem de fabrico {number}", message: "{workshop} · {project} — à espera das oficinas anteriores", }, orderCreated: { title: "Nova ordem de fabrico {number}", message: "{workshop} · {title}", }, orderReady: { title: "{number} pode começar", message: "{workshop}: as oficinas anteriores terminaram.", }, orderDone: { title: "{number} concluída", message: "{workshop} · {project}", }, orderClosedShort: { title: "{number} fechada com falta de stock", message: "{count} artigo(s): {articles}", }, orderCancelled: { title: "{number} cancelada", message: "{workshop} {reason}", }, orderLate: { title: "{number} atrasada", message: "{workshop} · prazo {date}", }, stockLow: { title: "Stock baixo: {article}", message: "Restam {quantity} {unit} (mínimo {threshold})", }, quoteAccepted: { title: "Orçamento {number} aceite", message: "{customer} · {amount} s/ IVA", }, quoteRefused: { title: "Orçamento {number} recusado", message: "{customer} · {amount} s/ IVA {reason}", }, quoteExpiring: { title: "O orçamento {number} expira a {date}", message: "{customer} · a acompanhar", }, paymentReceived: { title: "Recebimento em {number}", message: "{customer} · {amount}", }, invoicePaid: { title: "Fatura {number} liquidada", message: "{customer} · {amount}", }, invoiceOverdue: { title: "Fatura {number} vencida", message: "{customer} · {amount} vencido desde {date}", }, projectDueSoon: { title: "Projeto {number}: prazo em {days} dia(s)", message: "{name} · ordens em aberto: {open}", }, projectOverdue: { title: "Projeto {number} atrasado", message: "{name} · prazo {date} · ordens em aberto: {open}", }, }, login: { useBackupCode: "Usar um código de recuperação", useAuthenticator: "Usar o código da app", invalidCode: "Código inválido", verifying: "A verificar...", verify: "Verificar", backupCodeHint: "Introduza um dos seus códigos de recuperação.", authenticatorHint: "Introduza o código de 6 dígitos da sua app de autenticação.", failed: "Falha ao iniciar sessão", signingIn: "A iniciar sessão...", signIn: "Iniciar sessão", password: "Palavra-passe", email: "E-mail", }, notifications: { daysShort: "d", hoursShort: "h", minutesShort: "min", now: "agora", markAllRead: "Marcar tudo como lido", empty: "Ainda sem notificações.", title: "Notificações", }, orgChart: { breadcrumbs: { orgChart: "Organograma", hr: "RH", }, emptyMessage: "Defina uma chefia nos funcionários para construir a estrutura.", emptyTitle: "Ainda sem organograma", subtitle: "Estrutura hierárquica, com base na chefia de cada funcionário.", title: "Organograma", }, auditLog: { errors: { fetchFailed: "Não foi possível carregar o registo de auditoria", actionFailed: "Esta ação falhou. Tente novamente.", }, breadcrumbs: { auditLog: "Registo de auditoria", hr: "RH", }, actions: { review: "Revisto", delete: "Eliminado", update: "Alterado", create: "Criado", }, resourceTypes: { WorkSchedule: "Horário de trabalho", PayrollRun: "Processamento salarial", EmployeeDocument: "Documento", Contract: "Contrato", Advance: "Adiantamento", Absence: "Ausência", Salary: "Salário", Employee: "Funcionário", }, fields: { date: "Data", actor: "Por", resource: "Registo", resourceType: "Tipo", action: "Ação", }, emptyMessage: "Ainda não há alterações registadas para este filtro.", emptyTitle: "Ainda sem atividade", deleteSureMessage: "Eliminar esta entrada? Não é possível anular.", deleteTitle: "Eliminar entrada do registo", subtitle: "Quem alterou o quê e quando.", title: "Registo de auditoria", }, purchaseRequests: { status: { received: "Recebido", }, fields: { requestedBy: "Pedido por", quantity: "Quantidade", product: "Artigo", }, markReceived: "Marcar como recebido", emptyMessage: "Nenhum pedido corresponde aos filtros.", emptyTitle: "Sem pedidos de compra", subtitle: "Pedidos de reposição enviados às Compras, e a respetiva resposta.", title: "Pedidos de compra", }, production: { title: "Produção", }, holidays: { title: "Feriados", subtitle: "Os feriados do ano: se a empresa trabalha e como são pagas as horas trabalhadas.", downloadTemplate: "Descarregar modelo", import: "Importar Excel", add: "Adicionar feriado", year: "Ano", howItWorks: "Todos os anos: descarregue o modelo (os feriados de data fixa já estão preenchidos), acrescente os feriados religiosos com as datas oficiais e importe-o. Feriado encerrado: ninguém é esperado e as horas de quem registar ponto contam como horas de feriado. Pagamento «a dobrar» acrescenta uma hora paga por cada hora trabalhada; «normal» não acrescenta nada.", importDone: "Importação concluída: {created} adicionados, {updated} atualizados.", namePlaceholder: "Nome do feriado (ex. Aïd al-Fitr)", previewTitle: "Pré-visualização de {file}", previewErrors: "{count} linha(s) a corrigir — corrija o ficheiro e importe-o novamente", previewReady: "{count} linha(s) prontas a importar", columns: { row: "Linha", date: "Data", name: "Nome", open: "Empresa", pay: "Pagamento se trabalhado", check: "Verificação" }, defaultClosed: "Encerrada (predefinição)", defaultDouble: "A dobrar (predefinição)", open: "Aberta", closed: "Encerrada", payDouble: "A dobrar", payNormal: "Normal", confirmImport: "Importar", emptyTitle: "Ainda não há feriados para {year}", emptyMessage: "Descarregue o modelo, preencha-o e importe-o.", deleteTitle: "Eliminar feriado", deleteMessage: "Eliminar «{name}»? Os registos de ponto desse dia são mantidos.", errors: { load: "Não foi possível carregar os feriados.", save: "Não foi possível guardar esta alteração.", template: "Não foi possível descarregar o modelo.", read: "Não foi possível ler este ficheiro.", import: "A importação falhou." } }, myDepartment: { adminTitle: "Acesso por departamento", adminSubtitle: "Todos os departamentos que supervisiona: o responsável, que cargos dão acesso ao módulo e quem tem acesso.", adminEmptyTitle: "Ainda não há departamentos.", noManagerAssigned: "Sem responsável atribuído", title: "O meu departamento", subtitle: "A sua equipa e que cargos dão acesso ao módulo do departamento.", loadError: "Não foi possível carregar o seu departamento.", saveError: "Não foi possível guardar esta alteração.", saved: "Guardado.", accountsUpdated: "Guardado — {count} conta(s) atualizada(s).", emptyTitle: "Ainda não gere nenhum departamento.", positionsTitle: "Cargos e acesso", positionsHint: "Ative um cargo para dar a todos os seus titulares acesso ao módulo do departamento. Os restantes veem apenas O meu espaço.", noModule: "Este departamento não desbloqueia nenhum módulo, por isso não há acesso a distribuir.", noPositions: "Ainda não há cargos definidos para este departamento.", holders: "{count} funcionário(s)", toggleLabel: "Dá acesso ao módulo", teamTitle: "Equipa", noEmployees: "Não há funcionários neste departamento.", columns: { name: "Nome", jobTitle: "Cargo", access: "Acesso" }, noLogin: "Sem conta", moduleAccess: "Acesso ao módulo", mySpaceOnly: "Apenas O meu espaço" },
    sidebar: { logistics: "Logística", toDeliver: "A entregar", deliveryNotes: "Guias de remessa", tracking: "Acompanhamento de projetos", workshops: "Oficinas", chassisCatalog: "Catálogo de caixilharia", productionConfig: "Configuração da produção", sales: "Vendas", quotes: "Orçamentos", salesInvoices: "Faturas", receivables: "Recebimentos", customers: "Clientes", projects: "Projetos", planning: "Planeamento", declarations: "Declarações", leaveBalances: "Saldos de férias", platform: "Plataforma", clients: "Clientes", purchasingReports: "Relatórios de compras", restock: "Reposição", inventorySettings: "Definições", purchaseRequests: "Pedidos de compra", inventory: "Inventário", production: "Produção", workSchedule: "Horário de trabalho", auditLog: "Registo de auditoria", reports: "Relatórios", orgChart: "Organograma", attendance: "Assiduidade", employeeDocuments: "Documentos", contracts: "Contratos", payroll: "Processamento salarial", supplierInvoices: "Faturas de fornecedores", purchasing: "Compras", purchaseRequestsQueue: "Pedidos de compra", purchaseOrders: "Notas de encomenda", priceRequests: "Pedidos de cotação", suppliers: "Fornecedores", purchasingInventory: "Inventário", articleHistory: "Histórico do artigo", holidays: "Feriados", departmentAccess: "Acesso por departamento", myDepartment: "O meu departamento", mySpace: "O meu espaço", myProfile: "O meu perfil", myPayslips: "Os meus recibos", myAbsences: "As minhas ausências", myAdvances: "Os meus adiantamentos", myAttendance: "A minha assiduidade", myRecords: "O meu processo",
      leaveCalendar: "Calendário de ausências",
      performanceReviews: "Avaliações de desempenho",
      disciplinaryActions: "Ações disciplinares",
      admin: "Admin",
      settings: "Configurações",
      help: "Ajuda e Suporte",
      profile: "Perfil",
      hr: "Recursos Humanos",

      companies: "Empresas",
      organization: "Organização",
      company: "Empresa",
      employees: "Funcionários",
      salaries: "Salários",
      absences: "Ausências",
      advances: "Adiantamentos",
      users: "Utilizadores",
      departments: "Departamentos",
      jobPositions: "Cargos",
      rolesPermissions: "Funções e Permissões",
      locations: "Localizações",
      documents: "Documentos",
      preferences: "Preferências",
      integrations: "Integrações",

      dark: "Escuro",
      light: "Claro",

      logout: "Sair",

      closeSidebar:
        "Fechar barra lateral",

      openSidebar:
        "Abrir barra lateral",

      switchTheme:
        "Mudar para o modo {theme}",

      dashboard:
        "Painel",
    },

    common: { yes: "Sim", no: "Não", home: "Início", breadcrumb: "Trilho de navegação", clear: "Limpar", clearSearch: "Limpar pesquisa", nextPage: "Página seguinte", previousPage: "Página anterior", pagination: "Paginação", hidePassword: "Ocultar palavra-passe", showPassword: "Mostrar palavra-passe", somethingWentWrong: "Algo correu mal", confirmAction: "Confirmar ação", pageNotFoundHint: "Esta página não existe ou foi movida.", pageNotFound: "Página não encontrada", status: "Estado", save: "Guardar", back: "Voltar", dateFrom: "De", dateTo: "Até",
      welcome: "Bem-vindo",
      goodbye: "Adeus",
      loading: "Carregando...",
      error: "Erro",
      fail: "Falha",
      success: "Sucesso",
      update: "Atualizar",
      cancel: "Cancelar",
      delete: "Eliminar",
      confirm: "Confirmar",
      close: "Fechar",
      edit: "Editar",
      reset: "Redefinir",
      create: "Criar",
      noResults: "Nenhum resultado encontrado",
      chooseFile: "Escolher ficheiro",
      noFileChosen: "Nenhum ficheiro escolhido",
    },

    profile: { loadFailed: "Não foi possível carregar o perfil",
      settings: "Definições",

      firstName: "Nome",
      lastName: "Apelido",
      email: "E-mail",
      password: "Palavra-passe",

      currentPassword: "Palavra-passe atual",
      newPassword: "Nova palavra-passe",

      updateSureMessage:
        "Tem a certeza de que deseja atualizar o seu perfil?",

      updateFailMessage:
        "Não foi possível atualizar o seu perfil. Tente novamente.",

      updateSuccessMessage:
        "O seu perfil foi atualizado com sucesso.",

      bothPasswords:
        "É necessário indicar a palavra-passe atual e a nova.",

      info: "Informação",
    },

    company: { workflow: { accountInvalid: "Uma conta contabilística tem 4 a 10 dígitos.", purchaseAccountHint: "Usada na exportação contabilística para artigos cuja categoria não tem conta própria e para linhas escritas à mão (ex. 6111, 6121, 6125).", purchaseAccount: "Conta de compras predefinida", purchaseThresholdHint: "Encomendas com valor (IVA incl.) igual ou superior têm de ser aprovadas por um admin, o proprietário ou o responsável de compras. 0 = sem aprovação.", purchaseThreshold: "Limite de aprovação de encomendas", title: "Fluxo de aprovação", sequentialApproval: "Aprovação da chefia antes dos RH", sequentialApprovalHint: "Quando ativo, os pedidos de ausência e adiantamento têm de ser aprovados primeiro pela chefia do funcionário e depois receber a aprovação final dos RH. Funcionários sem chefia seguem diretamente para os RH.", saveFailed: "Não foi possível guardar esta definição." },
      title: "Empresa",

      subtitle:
        "Gerencie as informações da sua empresa",

      emptySubtitle:
        "Nenhuma empresa configurada",

      emptyTitle:
        "Nenhuma empresa",

      emptyMessage:
        "Configure o perfil da sua empresa para começar.",

      create:
        "Criar empresa",

      editTitle:
        "Editar empresa",

      name:
        "Nome da empresa",

      tradeName:
        "Nome comercial",

      legalForm:
        "Forma jurídica",

      industry:
        "Setor",

      ice:
        "ICE",

      taxId:
        "Identificação fiscal",

      registrationNumber:
        "Número de registro",

      email:
        "E-mail",

      phone:
        "Telefone",

      website:
        "Site",

      street:
        "Rua",

      city:
        "Cidade",

      postalCode:
        "Código postal",

      logo:
        "Logotipo da empresa",

      employeeCount:
        "Funcionários",

      section: {
        identity:
          "Identidade",

        legal:
          "Informações legais",

        contact:
          "Contacto",
      },

      createTitle:
        "Criar empresa",

      createSureMessage:
        "Tem a certeza de que deseja criar esta empresa?",

      createSuccessTitle:
        "Empresa criada",

      createSuccessMessage:
        "A empresa foi criada com sucesso.",

      createFailTitle:
        "Falha na criação",

      updateSureMessage:
        "Tem a certeza de que deseja guardar estas alterações?",

      updateSuccessMessage:
        "A empresa foi atualizada com sucesso.",

      saveFailMessage:
        "Ocorreu um erro ao guardar a empresa.",

      loadFailTitle:
        "Falha ao carregar",

      loadFailMessage:
        "Não foi possível carregar as informações da empresa.",

      downloadFiche:
        "Descarregar ficha",

      deleteCompany:
        "Eliminar empresa",

      deleteTitle:
        "Eliminar empresa",

      deleteSureMessage:
        "Tem a certeza de que deseja eliminar esta empresa? Esta ação não pode ser desfeita.",

      deleteSuccessTitle:
        "Empresa eliminada",

      deleteSuccessMessage:
        "A empresa foi eliminada com sucesso.",

      deleteFailTitle:
        "Falha na eliminação",

      deleteFailMessage:
        "Ocorreu um erro ao eliminar a empresa.",

      errors: {
        deleteAdminOnly:
          "Apenas administradores ou o proprietário da empresa podem eliminá-la.",

        notFound:
          "Empresa não encontrada.",

        deleteNotAuthorized:
          "Não tem autorização para eliminar esta empresa.",

        updateNotAuthorized:
          "Não tem autorização para atualizar esta empresa.",

        viewNotAuthorized:
          "Não tem autorização para visualizar esta empresa.",

        ficheDownloadFailed:
          "Erro ao gerar a ficha da empresa.",

        duplicateCompany:
          "Já existe uma empresa com este ICE, identificação fiscal, número de registro ou número CNSS.",

        createFailed:
          "Erro ao criar a empresa.",

        updateFailed:
          "Erro ao atualizar a empresa.",

        deleteFailed:
          "Erro ao eliminar a empresa.",

        logoNotFound:
          "Logotipo da empresa não encontrado.",

        logoRequired:
          "Selecione um logotipo.",

        logoUploadFailed:
          "Erro ao carregar o logotipo.",

        logoDeleteFailed:
          "Erro ao eliminar o logotipo.",
      },
    },

    users: {
      title: "Utilizadores",
      subtitle:
        "Gerencie as contas e os acessos dos utilizadores.",

      addUser:
        "Adicionar utilizador",

      newUser:
        "Novo utilizador",

      createSubtitle:
        "Criar uma nova conta de utilizador.",

      information:
        "Informações do utilizador",

      role: "Função",
      status: "Estado",
      userId: "ID do utilizador",

      roles: {
        admin: "Administrador",
        owner: "Proprietário",
        user: "Utilizador",
      },

      statuses: {
        active: "Ativo",
        inactive: "Inativo",
        suspended: "Suspenso",
      },

      emptyTitle:
        "Nenhum utilizador",

      emptyMessage:
        "Atualmente não existem utilizadores na sua organização.",

      backToUsers:
        "Utilizadores",

      createTitle:
        "Criar utilizador",

      createSureMessage:
        "Tem a certeza de que deseja criar este utilizador?",

      createSuccessTitle:
        "Utilizador criado",

      createSuccessMessage:
        "O utilizador foi criado com sucesso.",

      createFailTitle:
        "Falha na criação",

      createFailMessage:
        "Não foi possível criar o utilizador.",

      loadFailTitle:
        "Falha ao carregar",

      loadFailMessage:
        "Não foi possível carregar os utilizadores. Tente novamente.",

      deleteUser:
        "Eliminar utilizador",

      deleteTitle:
        "Eliminar utilizador",

      deleteSureMessage:
        "Tem a certeza de que deseja eliminar este utilizador? Esta ação não pode ser desfeita.",

      deleteSuccessTitle:
        "Utilizador eliminado",

      deleteSuccessMessage:
        "O utilizador foi eliminado com sucesso.",

      deleteFailTitle:
        "Falha na eliminação",

      deleteFailMessage:
        "Ocorreu um erro ao eliminar o utilizador.",

      errors: {
        deleteAdminOnly:
          "Apenas administradores podem eliminar utilizadores.",

        notFound:
          "Utilizador não encontrado.",

        updateNotAuthorized:
          "Não tem autorização para atualizar este utilizador.",

        passwordNotAuthorized:
          "Não tem autorização para alterar esta palavra-passe.",

        requiredCreateFields:
          "Forneça o nome, apelido, e-mail e palavra-passe.",

        requiredUpdateFields:
          "Forneça o nome, apelido e e-mail.",

        requiredPasswordFields:
          "Forneça a palavra-passe atual e a nova palavra-passe.",

        emailExists:
          "Já existe um utilizador com este e-mail.",

        currentPasswordIncorrect:
          "A palavra-passe atual está incorreta.",
      },

      editUser: "Editar utilizador",
      editSubtitle: "Atualize as informações da conta deste utilizador.",
      inheritedFromEmployee: "O departamento e a função de RH são herdados do funcionário associado {name} ({department} — {jobTitle}). Para os alterar, atualize o Departamento ou o Cargo do funcionário.",

      updateTitle: "Editar utilizador",
      updateSureMessage: "Tem a certeza de que deseja guardar estas alterações?",

      updateSuccessTitle: "Utilizador atualizado",
      updateSuccessMessage: "O utilizador foi atualizado com sucesso.",

      updateFailTitle: "Falha ao atualizar",
      updateFailMessage: "Não foi possível atualizar o utilizador. Tente novamente.",

      hrRole: {
        label: "Cargo de RH",
        notApplicable: "Não aplicável (fora de RH)",
        assistant: "Assistente de RH",
        officer: "Encarregado/a de RH",
        manager: "Responsável de RH",
        director: "Diretor/a de RH",
      },

      department: "Departamento",
      departments: {
          management: "Direção",
          hr: "Recursos Humanos",
          finance: "Finanças",
          accounting: "Contabilidade",
          sales: "Vendas",
          purchasing: "Compras",
          marketing: "Marketing",
          production: "Produção",
          production_planning: "Planeamento da produção",
          quality_control: "Controlo de qualidade",
          maintenance: "Manutenção",
          warehouse: "Armazém",
          logistics: "Logística",
          procurement: "Aprovisionamento",
          engineering: "Engenharia",
          design: "Design",
          research_development: "Investigação e Desenvolvimento",
          it: "Informática",
          customer_service: "Apoio ao cliente",
          administration: "Administração",
          health_safety_environment: "Saúde, segurança e ambiente",
          security: "Segurança",
      },

      emptySearchTitle: "Sem resultados",
      emptySearchMessage: "Nenhum utilizador corresponde à sua pesquisa.",

      toolbar: {
        searchPlaceholder: "Pesquisar utilizadores...",
      },
    },
    employees: { related: { tabs: { attendance: "Assiduidade", documents: "Documentos", contracts: "Contratos", advances: "Adiantamentos", absences: "Ausências", salary: "Salário", }, empty: "Ainda nada aqui.", }, linkedUser: { resetPasswordSureMessage: "Gerar uma nova palavra-passe temporária para este funcionário? A atual deixará de funcionar.", resetPasswordTitle: "Redefinir palavra-passe", resetPassword: "Redefinir palavra-passe", loginNotCreatedTitle: "Funcionário criado, mas ainda sem acesso", loginCreatedMessage: "E-mail: {email}\nPalavra-passe temporária: {password}\n\nPartilhe com o funcionário — não será mostrada novamente.", loginCreatedTitle: "Acesso criado", createLoginSureMessage: "Criar um novo acesso de autosserviço para este funcionário? Será gerada uma palavra-passe temporária, mostrada uma única vez.", createLoginTitle: "Criar acesso", createLogin: "Criar novo acesso", orCreateNew: "ou", actionFailed: "Algo correu mal. Tente novamente.", searchPlaceholder: "Pesquisar utilizadores por nome ou e-mail...", unlinkSureMessage: "Desligar esta conta deste funcionário? Perderá o acesso a O meu espaço.", unlinkTitle: "Desligar conta de utilizador", linkSureMessage: "Ligar esta conta a este funcionário? Terá acesso a O meu espaço (recibos, pedidos de ausência e adiantamento, assiduidade).", linkTitle: "Ligar conta de utilizador", unlink: "Desligar", link: "Ligar", linkedTo: "Ligado a:", title: "Acesso de autosserviço", },
      title: "Funcionários",
      subtitle: "Gerencie os funcionários da sua empresa e as informações de RH.",
      addEmployee: "Adicionar funcionário",
      backToEmployees: "Voltar aos funcionários",
      editEmployee: "Editar funcionário",
      newEmployee: "Novo funcionário",
      employeeInformation: "Informações do funcionário",
      loadFailTitle: "Não foi possível carregar os funcionários",
      loadFailMessage: "Ocorreu um erro ao carregar os funcionários. Tente novamente.",
      loadCompaniesFailMessage: "Ocorreu um erro ao carregar as empresas. Tente novamente.",

      createTitle: "Adicionar funcionário",
      createSureMessage: "Tem certeza de que deseja criar este funcionário?",
      createSuccessTitle: "Funcionário criado",
      createSuccessMessage: "O funcionário foi criado com sucesso.",
      createFailTitle: "Não foi possível criar o funcionário",
      createFailMessage: "Ocorreu um erro ao criar o funcionário.",

      updateTitle: "Editar funcionário",
      updateSureMessage: "Tem certeza de que deseja salvar essas alterações?",
      updateSuccessTitle: "Funcionário atualizado",
      updateSuccessMessage: "O funcionário foi atualizado com sucesso.",
      updateFailTitle: "Não foi possível atualizar o funcionário",
      updateFailMessage: "Ocorreu um erro ao atualizar o funcionário.",

      deleteTitle: "Excluir funcionário",
      deleteSureMessage: "Tem certeza de que deseja excluir {name}? Esta ação não pode ser desfeita.",
      deleteSuccessTitle: "Funcionário excluído",
      deleteSuccessMessage: "O funcionário foi excluído.",
      deleteFailTitle: "Não foi possível excluir o funcionário",
      deleteFailMessage: "Ocorreu um erro ao excluir o funcionário.",

      selectCompanyRequired: "Selecione uma empresa.",
      invalidPhotoType: "Selecione um arquivo de imagem.",

      toolbar: {
        company: "Empresa",
        selectCompany: "Selecionar empresa",
        loadingCompanies: "Carregando empresas...",
        searchPlaceholder: "Pesquisar funcionários...",
      },

      companyInfo: {
        employeeCount_one: "{count} funcionário",
        employeeCount_other: "{count} funcionários",
      },

      emptyNoCompany: {
        title: "Nenhuma empresa encontrada",
        message: "Crie uma empresa antes de adicionar funcionários.",
      },

      emptyNoEmployees: {
        title: "Nenhum funcionário encontrado",
        messageSearch: "Nenhum funcionário corresponde à sua pesquisa.",
        messageDefault: "Esta empresa ainda não tem funcionários.",
        cta: "Adicionar funcionário",
      },

      loading: "Carregando funcionários...",

      photo: {
        label: "Foto do funcionário",
        choose: "Escolher foto",
        change: "Alterar foto",
        remove: "Remover",
      },

      company: {
        label: "Empresa",
        selectPlaceholder: "Selecionar empresa",
        unnamed: "Empresa sem nome",
      },

      sections: {
        personalInformation: "Informações pessoais",
        contactInformation: "Informações de contato",
        employment: "Emprego",
        identification: "Identificação",
        company: "Empresa",
        notes: "Notas",
      },

      documents: {
        menuButton: "Documentos",
        attestationTravail: "Certificado de trabalho",
        attestationSalaire: "Certificado de trabalho e salário",
        certificatTravail: "Certificado de trabalho (fim de contrato)",
        contratTravail: "Contrato de trabalho",
        soldeToutCompte: "Recibo de saldo de contas",
        generationFailed: "Erro ao gerar o documento.",
      },

      bulkImport: {
        exportButton: "Exportar (CSV)",
        exportFailed: "Não foi possível exportar os funcionários.",
        openButton: "Importar (CSV)",
        title: "Importar funcionários em massa",
        helpText: "Carregue um ficheiro CSV para criar vários funcionários de uma vez. Cada linha é verificada primeiro — nada é criado até confirmar.",
        downloadTemplate: "Transferir modelo CSV",
        preview: "Verificar ficheiro",
        previewing: "A verificar...",
        previewFailed: "Não foi possível ler este ficheiro.",
        summaryValid: "{count} pronto(s) a importar",
        summaryErrors: "{count} com erros",
        summaryWarnings: "{count} com avisos",
        rowOk: "Tudo certo",
        fixErrorsFirst: "Corrija as linhas com erros e volte a carregar o ficheiro antes de importar — as linhas apenas com avisos serão importadas na mesma.",
        importButton: "Importar {count} funcionário(s)",
        committing: "A importar...",
        commitFailed: "Não foi possível concluir a importação.",
        commitSuccess: "{count} funcionário(s) importado(s) com sucesso.",
      },

      fields: { createLoginCheckboxLabel: "Criar também um acesso de autosserviço para este funcionário (usa o e-mail profissional)", createLogin: "Acesso de autosserviço", noDepartments: "Ainda não há departamentos — adicione um em Organização > Departamentos", manager: "Chefia direta", noManagerCandidates: "Ainda não há outro funcionário nesta empresa",
        employeeNumber: "Número do funcionário",
        employeeNumberPlaceholder: "EMP-001",

        firstName: "Nome",
        firstNamePlaceholder: "Nome",

        lastName: "Sobrenome",
        lastNamePlaceholder: "Sobrenome",

        firstNameArabic: "Nome (árabe)",
        firstNameArabicPlaceholder: "الاسم الأول",

        lastNameArabic: "Sobrenome (árabe)",
        lastNameArabicPlaceholder: "اسم العائلة",

        gender: "Gênero",
        genderPlaceholder: "Selecionar gênero",

        dateOfBirth: "Data de nascimento",

        placeOfBirth: "Local de nascimento",
        placeOfBirthPlaceholder: "Cidade",

        nationality: "Nacionalidade",
        nationalityPlaceholder: "Marroquina",

        maritalStatus: "Estado civil",
        maritalStatusPlaceholder: "Selecionar estado",

        numberOfDependents: "Dependentes",

        cin: "CIN",
        cinPlaceholder: "AB123456",

        passportNumber: "Número do passaporte",
        passportNumberPlaceholder: "Número do passaporte",

        passportExpiryDate: "Validade do passaporte",

        workPermitNumber: "Número da autorização de trabalho",
        workPermitNumberPlaceholder: "Número da autorização",

        workPermitExpiryDate: "Validade da autorização de trabalho",

        personalEmail: "E-mail pessoal",
        personalEmailPlaceholder: "pessoal@email.com",

        workEmail: "E-mail profissional",
        workEmailPlaceholder: "funcionario@empresa.com",

        phone: "Telefone",
        phonePlaceholder: "+212...",

        secondaryPhone: "Telefone secundário",
        secondaryPhonePlaceholder: "+212...",

        street: "Rua",
        streetPlaceholder: "Endereço",

        city: "Cidade",
        cityPlaceholder: "Cidade",

        region: "Região",
        regionPlaceholder: "Região",

        postalCode: "Código postal",
        postalCodePlaceholder: "40000",

        country: "País",
        countryPlaceholder: "Marrocos",

        emergencyName: "Contato de emergência",
        emergencyNamePlaceholder: "Nome completo",

        emergencyRelationship: "Parentesco",
        emergencyRelationshipPlaceholder: "Cônjuge, pai/mãe...",

        emergencyPhone: "Telefone de emergência",
        emergencyPhonePlaceholder: "+212...",

        emergencyEmail: "E-mail de emergência",
        emergencyEmailPlaceholder: "email@exemplo.com",

        hireDate: "Data de contratação",
        terminationDate: "Data de desligamento",

        employmentStatus: "Situação de emprego",
        employmentStatusPlaceholder: "Selecionar situação",

        employmentType: "Tipo de contrato",
        employmentTypePlaceholder: "Selecionar tipo",

        jobTitle: "Cargo",
        jobTitlePlaceholder: "Gerente de produção",

        department: "Departamento",
        departmentPlaceholder: "Produção",

        service: "Setor",
        servicePlaceholder: "Montagem",

        position: "Posição",
        positionPlaceholder: "Operador",

        workLocation: "Local de trabalho",
        workLocationPlaceholder: "Fábrica",

        cnssNumber: "Número da CNSS",
        cnssNumberPlaceholder: "Número da CNSS",

        cnssRegistrationDate: "Data de registro na CNSS",

        taxIdentificationNumber: "Número de identificação fiscal",
        taxIdentificationNumberPlaceholder: "NIF",

        taxStatus: "Situação fiscal",
        taxStatusPlaceholder: "Situação fiscal",

        numberOfChildren: "Número de filhos",

        spouseWorking: "Cônjuge trabalha",
        spouseWorkingCheckboxLabel: "O cônjuge trabalha atualmente",

        bankName: "Nome do banco",
        bankNamePlaceholder: "Banco",

        accountName: "Titular da conta",
        accountNamePlaceholder: "Titular da conta",

        rib: "RIB",
        ribPlaceholder: "RIB",

        iban: "IBAN",
        ibanPlaceholder: "IBAN",

        paymentMethod: "Forma de pagamento",
        paymentMethodPlaceholder: "Selecionar forma",

        notes: "Notas",
        notesPlaceholder: "Notas adicionais...",

        isActive: "Ativo",
        isActiveCheckboxLabel: "O funcionário está ativo",
      },

      genders: {
        male: "Masculino",
        female: "Feminino",
        other: "Outro",
      },

      maritalStatuses: {
        single: "Solteiro(a)",
        married: "Casado(a)",
        divorced: "Divorciado(a)",
        widowed: "Viúvo(a)",
        other: "Outro",
      },

      taxStatus: {
        taxable: "Tributável",
        nonTaxable: "Não tributável",
        exempt: "Isento",
      },

      statuses: {
        active: "Ativo",
        inactive: "Inativo",
        on_leave: "De licença",
        suspended: "Suspenso",
        terminated: "Contrato encerrado",
        unknown: "Desconhecido",
      },

      employmentTypes: {
        permanent: "Efetivo",
        fixed_term: "Prazo determinado",
        temporary: "Temporário",
        intern: "Estagiário",
        apprentice: "Aprendiz",
        freelance: "Freelancer",
        part_time: "Meio período",
        other: "Outro",
      },

      paymentMethods: {
        bank_transfer: "Transferência bancária",
        cash: "Dinheiro",
        check: "Cheque",
      },

      card: {
        view: "Ver",
        edit: "Editar",
      },

      detail: {
        employeeLabel: "Funcionário",
        firstName: "Nome",
        lastName: "Sobrenome",
        gender: "Gênero",
        dateOfBirth: "Data de nascimento",
        nationality: "Nacionalidade",
        maritalStatus: "Estado civil",
        phone: "Telefone",
        email: "E-mail",
        address: "Endereço",
        jobTitle: "Cargo",
        department: "Departamento",
        employmentType: "Tipo de contrato",
        hireDate: "Data de contratação",
        workLocation: "Local de trabalho",
        service: "Setor",
        cin: "CIN",
        passport: "Passaporte",
        cnssNumber: "Número da CNSS",
        taxId: "NIF",
        empty: "—",
      },

      buttons: {
        save: "Salvando...",
        createEmployee: "Criar funcionário",
        updateEmployee: "Atualizar funcionário",
        cancel: "Cancelar",
      },

      breadcrumbs: {
        hr: "RH",
        employees: "Funcionários",
        addEmployee: "Adicionar funcionário",
        editEmployee: "Editar funcionário",
      },

      errors: {
        companyRequired: "Selecione uma empresa.",
        invalidPhoto: "Selecione um arquivo de imagem.",
        fetchCompaniesFailed: "Falha ao buscar as empresas",
        fetchEmployeesFailed: "Falha ao buscar os funcionários",
        createFailed: "Falha ao criar o funcionário",
        updateFailed: "Falha ao atualizar o funcionário",
        deleteFailed: "Falha ao excluir o funcionário",
        notFound: "Funcionário não encontrado",
        duplicateEmployeeNumber: "Já existe um funcionário com este número",
        requiredFields: "Preencha todos os campos obrigatórios",
      },
    },
    salaries: {
      title: "Salários",
      subtitle: "Faça a gestão da remuneração e do histórico salarial dos funcionários.",
      addSalary: "Adicionar salário",
      giveRaise: "Atribuir aumento",

      createTitle: "Novo registo salarial",
      createSureMessage: "Tem a certeza de que deseja guardar este salário? O salário atual deste funcionário será encerrado a partir desta data de vigência.",
      createSuccessTitle: "Salário registado",
      createSuccessMessage: "O registo salarial foi criado com sucesso.",

      deleteTitle: "Eliminar registo salarial",
      deleteSureMessage: "Tem a certeza de que deseja eliminar este registo salarial? Esta ação não pode ser desfeita.",

      emptyTitle: "Sem salários",
      emptyMessage: "Esta empresa ainda não tem registos salariais.",

      fields: {
        employee: "Funcionário",
        employeeSearchPlaceholder: "Pesquisar por nome, número, CIN, CNSS...",
        baseSalary: "Salário base",
        effectiveDate: "Data de vigência",
        notes: "Notas",
        notesPlaceholder: "Motivo desta alteração, contexto adicional...",
      },

      table: {
        base: "Base",
        gross: "Bruto",
        net: "Líquido",
        endDate: "Data de fim",
        status: "Estado",
        ongoing: "Em curso",
      },

      actions: {
        history: "Ver histórico",
      },

      history: { deleteRecord: "Eliminar este registo salarial",
        titleFor: "Histórico salarial — {name}",
        empty: "Sem histórico salarial para este funcionário.",
        current: "Atual",
        past: "Anterior",
      },

      breadcrumbs: {
        hr: "RH",
        salaries: "Salários",
      },

      buttons: {
        create: "Guardar salário",
      },

      errors: {
        fetchFailed: "Falha ao carregar os salários",
        actionFailed: "Ocorreu um erro. Tente novamente.",
      },
    },
    absences: {
      title: "Ausências",
      subtitle: "Reveja e faça a gestão dos pedidos de férias e ausência.",
      addAbsence: "Novo pedido de ausência",

      createTitle: "Novo pedido de ausência",
      createSureMessage: "Tem a certeza de que deseja submeter este pedido de ausência?",
      createSuccessTitle: "Pedido submetido",
      createSuccessMessage: "O pedido de ausência foi submetido com sucesso.",

      acceptTitle: "Aceitar ausência",
      acceptSureMessage: "Tem a certeza de que deseja aceitar este pedido de ausência?",

      rejectTitle: "Rejeitar ausência",
      rejectSureMessage: "Tem a certeza de que deseja rejeitar este pedido de ausência?",

      deleteTitle: "Eliminar ausência",
      deleteSureMessage: "Tem a certeza de que deseja eliminar este registo de ausência? Esta ação não pode ser desfeita.",

      emptyTitle: "Sem ausências",
      emptyMessage: "Nenhum pedido de ausência corresponde aos seus filtros.",

      unjustified: "Não justificada",

      fields: {
        employee: "Funcionário",
        employeeSearchPlaceholder: "Pesquisar por nome, número, CIN, CNSS...",
        type: "Tipo",
        startDate: "Data de início",
        endDate: "Data de fim",
        halfDay: "Meio dia",
        justified: "Justificada",
        reason: "Motivo",
        reasonPlaceholder: "Motivo ou contexto adicional...",
        reviewComment: "Comentário de revisão",
        status: "Estado",
      },

      types: {
        paid_leave: "Férias pagas",
        unpaid_leave: "Licença sem vencimento",
        sick_leave: "Baixa médica",
        absence: "Ausência",
        other: "Outro",
      },

      status: { manager_approved: "Aprovada pela chefia",
        pending: "Pendente",
        accepted: "Aceite",
        rejected: "Rejeitada",
      },

      filters: {
        allStatuses: "Todos os estados",
        allTypes: "Todos os tipos",
      },

      table: {
        period: "Período",
        days: "Dias",
      },

      actions: {
        accept: "Aceitar",
        reject: "Rejeitar",
      },

      breadcrumbs: {
        hr: "RH",
        absences: "Ausências",
      },

      buttons: {
        create: "Submeter pedido",
      },

      errors: {
        fetchFailed: "Falha ao carregar as ausências",
        actionFailed: "Ocorreu um erro. Tente novamente.",
      },
    },
    advances: {
      title: "Adiantamentos",
      subtitle: "Reveja e faça a gestão dos pedidos de adiantamento salarial.",
      addAdvance: "Novo pedido de adiantamento",

      createTitle: "Novo pedido de adiantamento",
      createSureMessage: "Tem a certeza de que deseja submeter este pedido de adiantamento?",
      createSuccessTitle: "Pedido submetido",
      createSuccessMessage: "O pedido de adiantamento foi submetido com sucesso.",

      acceptTitle: "Aceitar adiantamento",
      acceptSureMessage: "Tem a certeza de que deseja aceitar este pedido de adiantamento?",

      rejectTitle: "Rejeitar adiantamento",
      rejectSureMessage: "Tem a certeza de que deseja rejeitar este pedido de adiantamento?",

      markRepaidTitle: "Marcar como reembolsado",
      markRepaidSureMessage: "Tem a certeza de que deseja marcar este adiantamento como totalmente reembolsado?",

      deleteTitle: "Eliminar adiantamento",
      deleteSureMessage: "Tem a certeza de que deseja eliminar este registo de adiantamento? Esta ação não pode ser desfeita.",

      emptyTitle: "Sem adiantamentos",
      emptyMessage: "Nenhum pedido de adiantamento corresponde aos seus filtros.",

      fields: {
        employee: "Funcionário",
        employeeSearchPlaceholder: "Pesquisar por nome, número, CIN, CNSS...",
        amount: "Montante",
        requestDate: "Data do pedido",
        reason: "Motivo",
        reasonPlaceholder: "Motivo ou contexto adicional...",
        reviewComment: "Comentário de revisão",
        status: "Estado",
      },

      status: { manager_approved: "Aprovada pela chefia",
        pending: "Pendente",
        accepted: "Aceite",
        rejected: "Rejeitado",
      },

      filters: {
        allStatuses: "Todos os estados",
      },

      table: {
        remaining: "Restante",
        fullyRepaid: "Totalmente reembolsado",
      },

      actions: {
        accept: "Aceitar",
        reject: "Rejeitar",
        markRepaid: "Marcar como reembolsado",
      },

      breadcrumbs: {
        hr: "RH",
        advances: "Adiantamentos",
      },

      buttons: {
        create: "Submeter pedido",
      },

      errors: {
        fetchFailed: "Falha ao carregar os adiantamentos",
        actionFailed: "Ocorreu um erro. Tente novamente.",
      },
    },

    units: {
      unit: "Unidade",
      piece: "Peça",
      pair: "Par",
      dozen: "Dúzia",
      set: "Conjunto",
      kg: "Quilograma (kg)",
      g: "Grama (g)",
      t: "Tonelada (t)",
      lb: "Libra (lb)",
      oz: "Onça (oz)",
      quintal: "Quintal (q)",
      l: "Litro (L)",
      ml: "Mililitro (mL)",
      m3: "Metro cúbico (m³)",
      gal: "Galão (gal)",
      m: "Metro (m)",
      cm: "Centímetro (cm)",
      mm: "Milímetro (mm)",
      km: "Quilómetro (km)",
      ft: "Pé (ft)",
      in: "Polegada (in)",
      yd: "Jarda (yd)",
      m2: "Metro quadrado (m²)",
      ft2: "Pé quadrado (ft²)",
      ha: "Hectare (ha)",
      box: "Caixa",
      carton: "Caixa de cartão",
      pallet: "Palete",
      bag: "Saco",
      sack: "Saco",
      bottle: "Garrafa",
      can: "Lata",
      roll: "Rolo",
      sheet: "Folha",
      bundle: "Pacote",
      case: "Caixote",
      drum: "Tambor",
      barrel: "Barril",
      container: "Contentor",
      hour: "Hora",
      day: "Dia",
      month: "Mês",
    },

    contentTranslation: {
      title: "Traduções",
      editButton: "Traduções",
      original: "Original",
      auto: "Traduzido automaticamente",
      manual: "Editado manualmente",
      missing: "Ainda não traduzido",
      regenerate: "Regenerar",
      originalHint: "Este é o texto original — edite o próprio campo para alterá-lo.",
      save: "Guardar",
      saving: "A guardar…",
      close: "Fechar",
      placeholder: "Introduza a tradução…",
      errors: {
        loadFailed: "Falha ao carregar as traduções.",
        saveFailed: "Falha ao guardar a tradução.",
        regenerateFailed: "Falha ao regenerar a tradução.",
      },
    },

    departments: { noManagerBadge: "Sem responsável", managerLabel: "Responsável", moduleAccessBadge: "Acesso ao módulo",
      title: "Departamentos",
      subtitle: "Defina os departamentos da sua organização e os cargos dentro de cada um.",
      addDepartment: "Adicionar departamento",
      addDefaults: "Adicionar departamentos predefinidos",
      defaultsModal: {
        title: "Adicionar departamentos predefinidos",
        helpText: "Escolha os departamentos que pretende adicionar — cada um vem com um nome e descrição padrão e (para RH/Produção) o acesso ao módulo já configurado. Pode sempre editá-los ou adicionar mais depois.",
        adding: "A adicionar...",
        addButton: "Adicionar {count} departamento(s)",
      },
      editDepartment: "Editar departamento",
      addPosition: "Adicionar cargo",
      editPosition: "Editar cargo",
      deleteTitle: "Eliminar departamento",
      deleteSureMessage: "Tem a certeza de que pretende eliminar este departamento? Os funcionários e cargos que ainda o utilizam devem ser reatribuídos primeiro.",
      deletePositionTitle: "Eliminar cargo",
      deletePositionSureMessage: "Tem a certeza de que pretende eliminar este cargo? Os funcionários que o ocupam, ou outros cargos subordinados a ele, devem ser reatribuídos primeiro.",
      emptyTitle: "Ainda não há departamentos",
      emptyMessage: "Adicione o seu primeiro departamento para começar a construir a sua estrutura organizacional.",
      searchPlaceholder: "Pesquisar departamentos...",
      noSearchResults: "Nenhum departamento corresponde à sua pesquisa.",
      noPositions: "Ainda não há cargos definidos neste departamento.",
      fields: { purchasingAccess: "Acesso ao módulo de Compras", manager: "Responsável do departamento", noManager: "Sem responsável", managerHint: "Supervisiona todo o departamento: acesso total ao módulo, aprova os pedidos da equipa e decide que cargos dão acesso ao módulo.", grantsModuleAccess: "Dá acesso ao módulo", grantsModuleAccessHint: "Quem ocupa este cargo acede ao módulo do departamento (ex. RH ou Inventário). Deixe desativado para funcionários que só devem ver O meu espaço.",
        name: "Nome", description: "Descrição", permissionKey: "Acesso ao módulo",
        permissionKeyHint: "Opcional — defina apenas num departamento se os funcionários aí (e as suas contas criadas automaticamente) devem ter acesso ao módulo de RH ou de Produção. A maioria dos departamentos deve manter «Sem acesso especial».",
        category: "Função",
        noCategory: "Sem função específica",
        categoryHint: "Opcional — permite que o formulário de funcionário sugira cargos padrão para este departamento em vez de deixar texto livre. É apenas uma sugestão, sem relação com acessos, ao contrário do campo Acesso ao módulo acima.",
        noSpecialAccess: "Sem acesso especial", hrAccess: "Acesso ao módulo de RH", productionAccess: "Acesso ao módulo de Produção",
        positionTitle: "Nome do cargo", reportsTo: "Reporta a", noReportsTo: "Nenhum (cargo de topo)",
        salaryMin: "Faixa salarial — mín.", salaryMax: "Faixa salarial — máx.", salaryBand: "Faixa salarial",
        requiredSkills: "Competências necessárias", requiredSkillsPlaceholder: "Separadas por vírgulas, ex. Excel, Liderança",
      },
      errors: {
        nameRequired: "O nome do departamento é obrigatório", titleRequired: "O nome do cargo é obrigatório",
        saveFailed: "Ocorreu um erro ao guardar.", deleteFailed: "Ocorreu um erro ao eliminar.",
      },
    },

    payroll: {
      title: "Folha de pagamento",
      subtitle: "Gere ciclos de folha de pagamento mensais e faça a gestão dos recibos de vencimento.",
      generateRun: "Gerar folha de pagamento",
      createTitle: "Gerar ciclo de folha de pagamento",
      createSureMessage: "Gerar a folha de pagamento para este período? Será criado um recibo de vencimento para cada funcionário ativo com um salário registado.",
      createSuccessTitle: "Ciclo de folha de pagamento criado",
      createSuccessMessage: "O ciclo de folha de pagamento foi gerado com sucesso.",
      completeTitle: "Concluir ciclo de folha de pagamento",
      completeSureMessage: "Concluir este ciclo de folha de pagamento? Uma vez concluído, os recibos ficam bloqueados e os funcionários são notificados.",
      deleteTitle: "Eliminar ciclo de folha de pagamento",
      deleteSureMessage: "Eliminar este ciclo de folha de pagamento em rascunho e todos os seus recibos? Esta ação não pode ser desfeita.",
      emptyTitle: "Ainda não há ciclos de folha de pagamento",
      emptyMessage: "Gere o primeiro ciclo de folha de pagamento para esta empresa.",
      noPayslips: "Não há recibos de vencimento neste ciclo.",
      fields: { month: "Mês", year: "Ano", status: "Estado" },
      table: { period: "Período", employees: "Funcionários", gross: "Bruto", net: "Líquido", searchPlaceholder: "Pesquisar funcionários..." },
      status: { draft: "Rascunho", completed: "Concluído", voided: "Anulado" },
      payslipStatus: { draft: "Rascunho", validated: "Validado", paid: "Pago" },
      actions: { view: "Ver", complete: "Concluir", regenerate: "Regenerar", markPaid: "Marcar como pago", downloadPdf: "Transferir recibo" },
      exports: {
        cnss: "Exportação CNSS",
        cnssHint: "Folha de declaração — verifique com o formato Damancom atual antes de carregar",
        register: "Registo de folha de pagamento",
        bankTransfer: "Ficheiro de transferência bancária",
      },
      buttons: { generate: "Gerar", saving: "A guardar..." },
      breadcrumbs: { hr: "RH", payroll: "Folha de pagamento" },
      months: ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],
      errors: { fetchFailed: "Falha ao carregar os ciclos de folha de pagamento", actionFailed: "Ocorreu um erro. Tente novamente." },
    },

    contracts: {
      title: "Contratos",
      subtitle: "Acompanhe os contratos de trabalho, renovações e datas de vencimento.",
      addContract: "Novo contrato",
      createTitle: "Novo contrato",
      createSureMessage: "Tem a certeza de que pretende criar este contrato?",
      createSuccessTitle: "Contrato criado",
      createSuccessMessage: "O contrato foi criado com sucesso.",
      renewTitle: "Renovar contrato",
      renewSureMessage: "Renovar este contrato? O contrato atual será encerrado e um novo será iniciado.",
      deleteTitle: "Eliminar contrato",
      deleteSureMessage: "Tem a certeza de que pretende eliminar este contrato? Esta ação não pode ser desfeita.",
      emptyTitle: "Ainda não há contratos",
      emptyMessage: "Esta empresa ainda não tem contratos registados.",
      expiringBanner: "{count} contrato(s) a vencer nos próximos 30 dias.",
      fields: { employee: "Funcionário", type: "Tipo de contrato", startDate: "Data de início", endDate: "Data de fim" },
      status: { active: "Ativo", expired: "Expirado", terminated: "Rescindido", renewed: "Renovado" },
      actions: { renew: "Renovar" },
      buttons: { create: "Guardar contrato" },
      breadcrumbs: { hr: "RH", contracts: "Contratos" },
      errors: { fetchFailed: "Falha ao carregar os contratos", actionFailed: "Ocorreu um erro. Tente novamente." },
    },

    documents: {
      title: "Documentos",
      subtitle: "Armazene os documentos dos funcionários e acompanhe as datas de validade.",
      uploadDocument: "Carregar documento",
      editDocument: "Editar documento",
      deleteTitle: "Eliminar documento",
      deleteSureMessage: "Tem a certeza de que pretende eliminar este documento? Esta ação não pode ser desfeita.",
      emptyTitle: "Ainda não há documentos",
      emptyMessage: "Esta empresa ainda não tem documentos registados.",
      expiringBanner: "{count} documento(s) a expirar nos próximos 30 dias.",
      fields: { employee: "Funcionário", type: "Tipo", label: "Etiqueta", labelPlaceholder: "ex. Cartão de cidadão", expiryDate: "Data de validade", file: "Ficheiro", replaceFile: "Substituir ficheiro (opcional)" },
      table: { file: "Ficheiro" },
      types: {
        cin: "Cartão de identidade (CIN)", passport: "Passaporte", work_permit: "Autorização de trabalho",
        residence_permit: "Autorização de residência", contract: "Contrato", diploma: "Diploma",
        cv: "CV", medical_certificate: "Atestado médico", other: "Outro",
      },
      actions: { view: "Ver", loadMore: "Carregar mais", loadMoreCount: "A mostrar {loaded} de {total}" },
      buttons: { upload: "Carregar" },
      breadcrumbs: { hr: "RH", documents: "Documentos" },
      errors: {
        fetchFailed: "Falha ao carregar os documentos", actionFailed: "Ocorreu um erro. Tente novamente.",
        missingFields: "Selecione um funcionário e um ficheiro.", uploadFailed: "Falha ao carregar o documento.",
      },
    },

    attendance: {
      title: "Assiduidade",
      subtitle: "Consulte os registos de entrada e saída.",
      emptyTitle: "Não há registos de assiduidade",
      emptyMessage: "Nenhum registo de assiduidade corresponde aos seus filtros.",
      filterAllEmployees: "Todos os funcionários",
      fields: { employee: "Funcionário", date: "Data", clockIn: "Entrada", clockOut: "Saída", notes: "Notas" },
      status: { present: "Presente", late: "Atrasado", absent: "Ausente", half_day: "Meio-dia", holiday: "Feriado" },
      breadcrumbs: { hr: "RH", attendance: "Assiduidade" },
      errors: { fetchFailed: "Falha ao carregar a assiduidade" },
    },

    reports: { chart: { zoomHint: "Arraste as alças sob o gráfico para ampliar", yearly: "Anual", monthly: "Mensal", view: "Vista", lastMonths: "Últimos {n} meses", range: "Período", },
      title: "Relatórios",
      subtitle: "Efetivos, rotatividade, absentismo e evolução do custo da folha de pagamento.",
      stats: { totalHeadcount: "Efetivo total", activeEmployees: "Funcionários ativos", currentGross: "Bruto mensal atual (est.)", currentNet: "Líquido mensal atual (est.)", missingSalaryNote: "{count} funcionário(s) ativo(s) ainda não têm salário registado — não incluído nesta estimativa." },
      expand: "Expandir",
      charts: {
        headcountByDepartment: "Efetivo por departamento", turnover: "Rotatividade (últimos 12 meses)",
        hires: "Contratações", terminations: "Saídas", absenteeism: "Taxa de absentismo (últimos 6 meses)",
        absenteeismRate: "Taxa de absentismo", payrollCost: "Custo da folha de pagamento (últimos 12 meses)",
        estimatedFootnote: "* O mês atual, assinalado com um asterisco, é uma estimativa em tempo real com base nos salários atuais — a folha de pagamento ainda não foi processada para este período.",
      },
      breadcrumbs: { hr: "RH", reports: "Relatórios" },
      loadError: "Não foi possível carregar alguns dados do relatório. Tente novamente ou consulte a consola para mais detalhes.",
      rankings: {
        title: "Classificação de funcionários",
        last30Days: "Últimos 30 dias",
        last90Days: "Últimos 90 dias",
        last365Days: "Últimos 12 meses",
        mostAbsenceDays: "Mais dias de ausência",
        bestAttendanceRate: "Melhor taxa de assiduidade",
        mostOvertimeHours: "Mais horas extra",
        mostLateDays: "Mais atrasos",
        noData: "Sem dados para este período.",
        days: "dias",
      },
    },  twoFactor: { qrAlt: "Código QR 2FA",
    title: "Autenticação de dois fatores",
    disabledHint: "Adicione uma camada extra de segurança à sua conta — além da palavra-passe, também vai precisar de um código de uma aplicação de autenticação para iniciar sessão.",
    enabledHint: "A autenticação de dois fatores está ativada na sua conta. Ser-lhe-á pedido um código da sua aplicação de autenticação sempre que iniciar sessão.",
    enableButton: "Ativar a autenticação de dois fatores",
    disableButton: "Desativar a autenticação de dois fatores",
    disabling: "A desativar...",
    scanTitle: "Digitalize o código QR",
    scanHint: "Digitalize-o com uma aplicação de autenticação (Google Authenticator, Authy, etc.) e depois introduza o código de 6 dígitos apresentado para confirmar.",
    manualEntryLabel: "Não consegue digitalizar? Introduza este código manualmente:",
    confirmAndEnable: "Confirmar e ativar",
    verifying: "A verificar...",
    backupCodesTitle: "Guarde os seus códigos de reserva",
    backupCodesHint: "Cada código pode ser usado uma vez para iniciar sessão caso perca o acesso à sua aplicação de autenticação. Guarde-os num local seguro — não serão mostrados novamente.",
    copyBackupCodes: "Copiar códigos",
    copied: "Copiado",
    iSavedThem: "Guardei estes códigos",
    confirmPasswordLabel: "Confirme a sua palavra-passe para continuar",
    errors: {
      statusFailed: "Não foi possível verificar o estado da autenticação de dois fatores.",
      setupFailed: "Não foi possível iniciar a configuração da autenticação de dois fatores.",
      invalidCode: "Esse código não corresponde — verifique a sua aplicação de autenticação e tente novamente.",
      disableFailed: "Não foi possível desativar a autenticação de dois fatores.",
    },
  },

  disciplinaryActions: {
    title: "Ações disciplinares",
    subtitle: "Registe avisos e medidas corretivas emitidas aos funcionários.",
    addAction: "Adicionar registo",
    editAction: "Editar registo",
    emptyTitle: "Ainda não há registos disciplinares",
    emptyMessage: "Esta empresa não tem ações disciplinares registadas.",
    deleteTitle: "Eliminar registo",
    deleteSureMessage: "Tem a certeza de que pretende eliminar este registo? Esta ação não pode ser desfeita.",
    acknowledged: "Confirmado",
    notAcknowledged: "Ainda não confirmado",
    breadcrumbs: {
      hr: "RH",
      disciplinaryActions: "Ações disciplinares",
    },
    fields: {
      employee: "Funcionário",
      type: "Tipo",
      date: "Data",
      reason: "Motivo",
      description: "Descrição",
      suspensionDays: "Suspensão (dias)",
      issuedBy: "Emitido por",
      notes: "Notas",
    },
    types: {
      verbal_warning: "Advertência verbal",
      written_warning: "Advertência escrita",
      final_warning: "Última advertência",
      suspension: "Suspensão",
      termination_notice: "Aviso de rescisão",
    },
    errors: {
      fetchFailed: "Falha ao carregar as ações disciplinares",
      saveFailed: "Erro ao guardar o registo",
      deleteFailed: "Erro ao eliminar o registo",
    },
  },
  performanceReviews: {
    title: "Avaliações de desempenho",
    subtitle: "Ciclos de avaliação, objetivos e classificações dos seus funcionários.",
    addReview: "Nova avaliação",
    editReview: "Editar avaliação",
    emptyTitle: "Ainda não há avaliações",
    emptyMessage: "Esta empresa não tem avaliações registadas.",
    deleteTitle: "Eliminar avaliação",
    deleteSureMessage: "Tem a certeza de que pretende eliminar esta avaliação? Esta ação não pode ser desfeita.",
    reviewedBy: "Avaliado por",
    submitButton: "Enviar ao funcionário",
    breadcrumbs: {
      hr: "RH",
      performanceReviews: "Avaliações",
    },
    fields: {
      employee: "Funcionário",
      reviewer: "Avaliador",
      periodLabel: "Período de avaliação",
      periodLabelPlaceholder: "ex. Avaliação anual 2026",
      reviewDate: "Data de avaliação",
      goals: "Objetivos (um por linha)",
      goalsPlaceholder: "Melhorar o tempo de resposta nos tickets de suporte\nConcluir a certificação de integração",
      strengths: "Pontos fortes",
      areasForImprovement: "Áreas de melhoria",
      comments: "Comentários",
    },
    criteria: {
      jobKnowledge: "Conhecimento da função",
      qualityOfWork: "Qualidade do trabalho",
      communication: "Comunicação",
      teamwork: "Trabalho em equipa",
      initiative: "Iniciativa",
      punctuality: "Pontualidade",
    },
    statuses: {
      draft: "Rascunho",
      submitted: "Enviada",
      acknowledged: "Confirmada",
    },
    errors: {
      fetchFailed: "Falha ao carregar as avaliações",
      saveFailed: "Erro ao guardar a avaliação",
      submitFailed: "Erro ao enviar a avaliação",
      deleteFailed: "Erro ao eliminar a avaliação",
    },
  },
  leaveCalendar: {
    title: "Calendário de ausências",
    subtitle: "Veja rapidamente quem está de licença aprovada.",
    previousMonth: "Mês anterior",
    nextMonth: "Mês seguinte",
    breadcrumbs: {
      hr: "RH",
      leaveCalendar: "Calendário de ausências",
    },
    weekdays: {
      0: "Seg",
      1: "Ter",
      2: "Qua",
      3: "Qui",
      4: "Sex",
      5: "Sáb",
      6: "Dom",
    },
    errors: {
      fetchFailed: "Falha ao carregar o calendário de ausências",
    },
  },
};
