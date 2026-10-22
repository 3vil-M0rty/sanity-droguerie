import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Settings2,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  UserRoundCog,
  Menu,
  IdCardLanyard,
  Boxes,
  ShoppingBag,
  LayoutDashboard,
  ShoppingCart,
  Building2,
  Handshake,
  Truck,
  Sun,
  Moon,
  Calculator,
  Store,
  BookOpen,
  PackagePlus,
} from "lucide-react";

import { useI18n } from "../hooks/useI18n";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import styles from "./Sidebar.module.css";
import LanguageSwitcher from "./useful/LanguageSwitcher";
import { canAccessHR, canSelfService, canManageCompanySettings, isDepartmentManager, canAccessPurchasing, isPlatformAdmin, canAccessSales, canAccessLogistics, canUsePos, can, canAny, canManageInventory, canManageTeamPermissions, isAdmin } from "../utils/permissions";
import { getOpenRequestCount } from "../services/purchasingService";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  // Previously the sidebar fetched its own separate copy of the
  // current user (a second, independent `/users/me` call on mount),
  // completely disconnected from AuthContext. That meant logging
  // out (which clears AuthContext's user/token) left the sidebar
  // showing a STALE user and stale permission-gated menu items —
  // the sidebar had no way to find out anything had changed. Using
  // the same `user`/`loading` AuthContext already tracks keeps the
  // sidebar and the rest of the app looking at one source of truth.
  const { user, loading, logout } = useAuth();

  const { t } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // ============================================================
  // MENU
  // ============================================================

  // "Demandes d'achat (N)": requests still waiting for the purchasing
  // team (pending + delayed). Polled like the notification bell, and
  // only for people who can see the purchasing module.
  const [openRequestCount, setOpenRequestCount] = useState(0);
  const purchasingUser = canAccessPurchasing(user);
  useEffect(() => {
    if (!purchasingUser) { setOpenRequestCount(0); return undefined; }
    let cancelled = false;
    const load = async () => {
      try {
        const count = await getOpenRequestCount();
        if (!cancelled) setOpenRequestCount(count);
      } catch {
        // non-critical: keep the last known count
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [purchasingUser]);

  const menuItems = [
    {
      id: "dashboard",
      label: t("sidebar.dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
      permission: (u) => !isPlatformAdmin(u),
    },
    {
      // Platform operator only: the platform's clients. A platform
      // admin passes none of the other sections' checks.
      id: "platform",
      label: t("sidebar.platform"),
      icon: Building2,
      permission: isPlatformAdmin,
      subsections: [
        { label: t("sidebar.clients"), href: "/platform/clients" },
        { label: t("sidebar.platformBilling"), href: "/platform/billing" },
        { label: t("sidebar.platformErrors"), href: "/platform/errors" },
      ],
    },

    {
      id: "organization",
      label: t("sidebar.organization"),
      // Company setup (company profile, user accounts, departments,
      // schedules) is for admins and company owners only — it had no
      // permission at all before, so every logged-in employee saw it.
      permission: (u) => canManageCompanySettings(u) || canAny(u, ["organization.departments.view", "organization.positions.view", "organization.schedule.edit"]),
      icon: Settings2,
      subsections: [
        {
          label: t("sidebar.company"),
          href: "/organization/company",
          permission: canManageCompanySettings,
        },
        {
          label: t("sidebar.users"),
          href: "/organization/users",
          permission: canManageCompanySettings,
        },
        {
          label: t("sidebar.mySubscription"),
          href: "/organization/subscription",
          permission: (u) => !!u?.tenant && ["admin", "owner"].includes(u?.role),
        },
        {
          label: t("sidebar.workSchedule"),
          href: "/organization/work-schedule",
          permission: (u) => canManageCompanySettings(u) || can(u, "organization.schedule.edit"),
        },
        {
          label: t("sidebar.departments"),
          href: "/organization/departments",
          permission: (u) => canManageCompanySettings(u) || can(u, "organization.departments.view"),
        },
        {
          label: t("sidebar.departmentAccess"),
          href: "/organization/department-access",
          permission: canManageCompanySettings,
        },
        {
          // Fine-grained permissions of everyone (admins / owners).
          label: t("sidebar.rolesPermissions"),
          href: "/organization/roles-permissions",
          permission: canManageCompanySettings,
        },
        {
          label: t("sidebar.locations"),
          href: "/organization/locations",
          permission: canManageCompanySettings,
        },
        {
          label: t("sidebar.documents"),
          href: "/organization/documents",
          permission: canManageCompanySettings,
        },
        {
          label: t("sidebar.preferences"),
          href: "/organization/preferences",
          permission: canManageCompanySettings,
        },
        {
          label: t("sidebar.integrations"),
          href: "/organization/integrations",
          permission: canManageCompanySettings,
        },
      ],
    },

    {
      id: "hr",
      label: t("sidebar.hr"),
      icon: IdCardLanyard,
      // Declarative permission check: this whole section (and
      // every subsection under it) only shows up for someone
      // `canAccessHR` says yes to (admin, owner, or a "hr"
      // department user). Adding a new HR page later is just
      // another entry in `subsections` below — no new permission
      // wiring needed, it inherits this same gate.
      permission: canAccessHR,
      subsections: [
        {
          label: t("sidebar.employees"),
          href: "/hr/employees",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.employees.view"]),
        },
        {
          label: t("sidebar.salaries"),
          href: "/hr/salaries",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.salaries.view"]),
        },
        {
          label: t("sidebar.absences"),
          href: "/hr/absences",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.absences.view"]),
        },
        {
          label: t("sidebar.advances"),
          href: "/hr/advances",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.advances.view"]),
        },
        {
          label: t("sidebar.payroll"),
          href: "/hr/payroll",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.payroll.view"]),
        },
        {
          label: t("sidebar.declarations"),
          href: "/hr/declarations",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.declarations.view"]),
        },
        {
          label: t("sidebar.contracts"),
          href: "/hr/contracts",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.contracts.view"]),
        },
        {
          label: t("sidebar.employeeDocuments"),
          href: "/hr/documents",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.documents.view"]),
        },
        {
          label: t("sidebar.attendance"),
          href: "/hr/attendance",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.attendance.view"]),
        },
        {
          label: t("sidebar.orgChart"),
          href: "/hr/org-chart",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.employees.view"]),
        },
        {
          label: t("sidebar.leaveCalendar"),
          href: "/hr/leave-calendar",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.absences.view"]),
        },
        {
          label: t("sidebar.leaveBalances"),
          href: "/hr/leave-balances",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.leave.view"]),
        },
        {
          label: t("sidebar.holidays"),
          href: "/hr/holidays",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.holidays.view"]),
        },
        {
          label: t("sidebar.performanceReviews"),
          href: "/hr/performance-reviews",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.reviews.view"]),
        },
        {
          label: t("sidebar.disciplinaryActions"),
          href: "/hr/disciplinary-actions",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.discipline.view"]),
        },
        {
          label: t("sidebar.reports"),
          href: "/hr/reports",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.reports.view"]),
        },
        {
          label: t("sidebar.auditLog"),
          href: "/hr/audit-log",
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["hr.auditLogs.view"]),
        },
      ],
    },

    {
      id: "mySpace",
      label: t("sidebar.mySpace"),
      icon: UserRoundCog,
      // Shows up for ANYONE whose account is linked to an employee
      // record — completely independent of role/department, since
      // self-service is about "is this login tied to a person",
      // not "does this login manage HR". See utils/permissions.js.
      permission: canSelfService,
      subsections: [
        {
          label: t("sidebar.myProfile"),
          href: "/me",
        },
        {
          label: t("sidebar.myPayslips"),
          href: "/me/payslips",
        },
        {
          label: t("sidebar.myAbsences"),
          href: "/me/absences",
        },
        {
          label: t("sidebar.myAdvances"),
          href: "/me/advances",
        },
        {
          label: t("sidebar.myAttendance"),
          href: "/me/attendance",
        },
        {
          label: t("sidebar.myRecords"),
          href: "/me/records",
        },
        {
          label: t("sidebar.myDepartment"),
          href: "/me/department",
          permission: isDepartmentManager,
        },
        {
          // Managers hand out permissions to the people under them.
          label: t("perm.teamMenu"),
          href: "/me/team-permissions",
          permission: (u) => canManageTeamPermissions(u) && !isAdmin(u) && u?.role !== "owner",
        },
      ],
    },

    {
      id: "sales",
      label: t("sidebar.sales"),
      icon: Handshake,
      permission: canAccessSales,
      subsections: [
        { label: t("sidebar.salesOrders"), href: "/sales/orders", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["sales.orders.view"]) },
        { label: t("sidebar.quotes"), href: "/sales/quotes", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["sales.quotes.view"]) },
        { label: t("sidebar.salesInvoices"), href: "/sales/invoices", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["sales.invoices.view"]) },
        { label: t("sidebar.customers"), href: "/sales/customers", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["sales.customers.view"]) },
        { label: t("sidebar.collections"), href: "/sales/collections", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["sales.collections.view"]) },
        { label: t("sidebar.receivables"), href: "/sales/receivables", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["sales.reports.view"]) },
        { label: t("sidebar.reps"), href: "/sales/reps", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["sales.reps.view", "sales.customers.view"]) },
        { label: t("sidebar.pricing"), href: "/sales/pricing", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["sales.pricing.view"]) },
        { label: t("sidebar.promotions"), href: "/sales/promotions", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["sales.promotions.view"]) },
        { label: t("sidebar.reminders"), href: "/sales/reminders", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["sales.collections.view", "sales.collections.manage"]) },
        { label: t("sidebar.visits"), href: "/sales/visits", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["sales.visits.view", "sales.reps.view"]) },
        { label: t("sidebar.portal"), href: "/sales/portal", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["sales.portal.manage"]) },
      ],
    },

    {
      id: "finance",
      label: t("sidebar.finance"),
      icon: Calculator,
      permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["finance.accounting.view", "sales.portfolio.view"]),
      subsections: [
        { label: t("sidebar.accounting"), href: "/finance/accounting", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["finance.accounting.view"]) },
        { label: t("sidebar.portfolio"), href: "/finance/portfolio", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["sales.portfolio.view"]) },
      ],
    },

    {
      id: "pos",
      label: t("sidebar.posMenu"),
      icon: ShoppingCart,
      permission: canUsePos,
      subsections: [
        { label: t("sidebar.pos"), href: "/pos", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["pos.sales.create"]) },
        { label: t("sidebar.posSessions"), href: "/pos/sessions", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["pos.sessions.open", "pos.sessions.viewAll"]) },
      ],
    },

    {
      id: "stock",
      label: t("sidebar.stockMenu"),
      icon: Boxes,
      permission: canManageInventory,
      subsections: [
        { label: t("sidebar.articles"), href: "/stock/articles", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["inventory.articles.view"]) },
        { label: t("sidebar.stockLevels"), href: "/stock/levels", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["inventory.articles.view"]) },
        { label: t("sidebar.stockMovements"), href: "/stock/movements", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["inventory.articles.view"]) },
        { label: t("sidebar.transfers"), href: "/stock/transfers", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["inventory.transfers.view"]) },
        { label: t("sidebar.counts"), href: "/stock/counts", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["inventory.counts.view"]) },
        { label: t("sidebar.expiring"), href: "/stock/expiring", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["inventory.articles.view"]) },
        { label: t("sidebar.purchaseRequests"), href: "/stock/purchase-requests", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["inventory.requests.view"]) },
        { label: t("sidebar.articleCategories"), href: "/stock/families", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["inventory.categories.view", "inventory.categories.edit"]) },
        { label: t("sidebar.brands"), href: "/stock/brands", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["inventory.categories.view", "inventory.articles.view"]) },
        { label: t("sidebar.warehouses"), href: "/stock/warehouses", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["inventory.warehouses.view", "inventory.warehouses.manage"]) },
      ],
    },

    {
      id: "logistics",
      label: t("sidebar.logistics"),
      icon: Truck,
      permission: canAccessLogistics,
      subsections: [
        { label: t("sidebar.deliveryNotes"), href: "/logistics/delivery-notes", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["logistics.notes.view"]) },
        { label: t("sidebar.rounds"), href: "/logistics/rounds", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["logistics.rounds.view"]) },
      ],
    },

    {
      id: "purchasing",
      label: t("sidebar.purchasing"),
      icon: ShoppingBag,
      permission: canAccessPurchasing,
      subsections: [
        {
          label: t("sidebar.purchaseRequestsQueue"),
          href: "/purchasing/requests",
          // requests still waiting for an answer (pending + delayed)
          badge: openRequestCount,
          permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["purchasing.requests.view"]),
        },
        { label: t("sidebar.purchaseOrders"), href: "/purchasing/orders", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["purchasing.orders.view"]) },
        { label: t("sidebar.supplierInvoices"), href: "/purchasing/invoices", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["purchasing.invoices.view"]) },
        { label: t("sidebar.forecast"), href: "/purchasing/forecast", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["purchasing.reports.view", "purchasing.orders.create"]) },
        { label: t("sidebar.restock"), href: "/purchasing/restock", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["purchasing.reports.view"]) },
        { label: t("sidebar.purchasingReports"), href: "/purchasing/reports", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["purchasing.reports.view"]) },
        { label: t("sidebar.priceRequests"), href: "/purchasing/price-requests", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["purchasing.priceRequests.view"]) },
        { label: t("sidebar.suppliers"), href: "/purchasing/suppliers", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["purchasing.suppliers.view"]) },
        { label: t("sidebar.articleHistory"), href: "/purchasing/article-history", permission: (u) => !Array.isArray(u?.permissions) || canAny(u, ["purchasing.orders.view"]) },
      ],
    },

    {
      id: "help",
      label: t("sidebar.help"),
      icon: HelpCircle,
      href: "/help",
    },
  ];

  // Menu items are only shown once we know who the user is, and
  // only if they have no `permission` check or they pass it. Any
  // future sidebar section can opt into the same gating just by
  // adding a `permission: someCheckFn` field above — nothing here
  // needs to change.
  //
  // Memoized on a PRIMITIVE key (not the `user` object itself, and
  // not `menuItems`, which is a fresh array literal every render)
  // — this used to be a plain, unmemoized `.filter()` call, so it
  // returned a brand-new array on every single render. That fed
  // straight into the auto-expand effect below as an "unstable"
  // dependency, so the effect re-ran on every render (not just on
  // navigation) and kept forcing `expandedSection` back to whatever
  // section matches the CURRENT route — silently undoing any
  // attempt to manually expand a different section. That's what
  // made the sidebar look "stuck"/unable to open another section.
  // Not memoized: this used to be wrapped in useMemo with only
  // [permissionKey] as its dependency. menuItems itself is rebuilt
  // fresh on every render (translated labels included), but the
  // memoized FILTER of it stayed frozen on whatever language was
  // active the last time permissionKey changed — switching the
  // language from the sidebar's own switcher never touched
  // permissionKey, so the menu silently kept showing the old
  // language until a full page refresh forced a remount. Filtering
  // this array is computationally trivial, so there's no real
  // performance reason to memoize it in the first place — removing
  // it removes the staleness risk entirely instead of just patching
  // this one dependency array.
  // Sections AND individual links inside them can carry a
  // `permission` check (e.g. "My department" is only for department
  // managers, inside the otherwise-everyone My Space section).
  // Sanity Droguerie (Tenant.edition = "droguerie"): a short menu for a
  // small shop — the same pages, without the wholesale / HR modules.
  const shopMenu = [
    { id: "boutique", label: t("dg.menu.home"), icon: Store, href: "/boutique", permission: canUsePos },
    { id: "pos", label: t("dg.menu.till"), icon: ShoppingCart, href: "/pos", permission: (u) => canAny(u, ["pos.sales.create"]) },
    { id: "carnet", label: t("dg.menu.carnet"), icon: BookOpen, href: "/boutique/carnet", permission: (u) => canAny(u, ["sales.customers.view"]) },
    {
      id: "purchasing",
      label: t("dg.menu.buying"),
      icon: PackagePlus,
      permission: canAccessPurchasing,
      subsections: [
        { label: t("dg.menu.purchase"), href: "/boutique/achat", permission: (u) => canAny(u, ["purchasing.orders.receive"]) },
        { label: t("dg.menu.suppliers"), href: "/boutique/fournisseurs", permission: (u) => canAny(u, ["purchasing.suppliers.view"]) },
        { label: t("dg.menu.purchaseHistory"), href: "/purchasing/orders", permission: (u) => canAny(u, ["purchasing.orders.view"]) },
      ],
    },
    {
      id: "stock",
      label: t("dg.menu.articles"),
      icon: Boxes,
      permission: canManageInventory,
      subsections: [
        { label: t("sidebar.articles"), href: "/stock/articles", permission: (u) => canAny(u, ["inventory.articles.view"]) },
        { label: t("sidebar.stockMovements"), href: "/stock/movements", permission: (u) => canAny(u, ["inventory.articles.view"]) },
        { label: t("sidebar.counts"), href: "/stock/counts", permission: (u) => canAny(u, ["inventory.counts.view"]) },
        { label: t("sidebar.articleCategories"), href: "/stock/families", permission: (u) => canAny(u, ["inventory.categories.view", "inventory.categories.edit"]) },
        { label: t("sidebar.warehouses"), href: "/stock/warehouses", permission: (u) => canAny(u, ["inventory.warehouses.manage"]) },
        { label: t("sidebar.transfers"), href: "/stock/transfers", permission: (u) => canAny(u, ["inventory.transfers.view"]) },
      ],
    },
    {
      id: "sales",
      label: t("dg.menu.sales"),
      icon: Handshake,
      permission: canAccessSales,
      subsections: [
        { label: t("sidebar.posSessions"), href: "/pos/sessions", permission: (u) => canAny(u, ["pos.sessions.open", "pos.sessions.viewAll"]) },
        { label: t("sidebar.customers"), href: "/sales/customers", permission: (u) => canAny(u, ["sales.customers.view"]) },
        { label: t("sidebar.salesInvoices"), href: "/sales/invoices", permission: (u) => canAny(u, ["sales.invoices.view"]) },
        { label: t("sidebar.portfolio"), href: "/finance/portfolio", permission: (u) => canAny(u, ["sales.portfolio.view"]) },
      ],
    },
    {
      id: "organization",
      label: t("dg.menu.settings"),
      icon: Settings2,
      permission: canManageCompanySettings,
      subsections: [
        { label: t("sidebar.company"), href: "/organization/company" },
        { label: t("sidebar.users"), href: "/organization/users" },
        { label: t("sidebar.pricing"), href: "/sales/pricing" },
        { label: t("sidebar.rolesPermissions"), href: "/organization/roles-permissions" },
        { label: t("sidebar.mySubscription"), href: "/organization/subscription", permission: (u) => !!u?.tenant && ["admin", "owner"].includes(u?.role) },
      ],
    },
    { id: "help", label: t("sidebar.help"), icon: HelpCircle, href: "/help" },
  ];

  const visibleMenuItems = (user?.edition === "droguerie" ? shopMenu : menuItems)
    .filter((item) => !item.permission || item.permission(user))
    .map((item) => (Array.isArray(item.subsections)
      ? { ...item, subsections: item.subsections.filter((sub) => !sub.permission || sub.permission(user)) }
      : item));

  // ============================================================
  // AUTO EXPAND ACTIVE SECTION
  // ============================================================
  // Second layer of defense against the same class of bug: only
  // actually do anything when the pathname has genuinely changed
  // since the last time this ran, regardless of why the effect
  // fired. A manual click on a section header only changes local
  // `expandedSection` state — it never touches `location.pathname`
  // — so this can never re-fight a manual expand/collapse.

  const lastAutoExpandedPathRef = useRef(null);

  useEffect(() => {
    if (lastAutoExpandedPathRef.current === location.pathname) return;
    lastAutoExpandedPathRef.current = location.pathname;

    const match = visibleMenuItems.find((item) =>
      item.subsections?.some(
        (sub) => location.pathname === sub.href
      )
    );

    if (match) {
      setExpandedSection(match.id);
    }
  }, [location.pathname, visibleMenuItems]);

  // ============================================================
  // HELPERS
  // ============================================================

  const toggleSection = (id) => {
    setExpandedSection(
      expandedSection === id ? null : id
    );
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
      "#F8B739",
      "#52C4A1",
    ];

    const hash = (name || "")
      .split("")
      .reduce(
        (acc, char) => acc + char.charCodeAt(0),
        0
      );

    return colors[hash % colors.length];
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    // Goes through AuthContext's logout() (clears token/user state
    // and the axios auth header) instead of only removing the
    // localStorage keys directly — the previous version relied on
    // window.location.href's hard reload to paper over the fact
    // that AuthContext's in-memory state was never actually cleared.
    logout();
    navigate("/");
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div
        className={`${styles.sidebarWrapper} ${
          isOpen
            ? styles.wrapperOpen
            : styles.wrapperClosed
        }`}
      >
        <aside className={styles.sidebar}>
          <div className={styles.header}>
            <div className={styles.skeletonAvatar}></div>

            {isOpen && (
              <div className={styles.skeletonText}></div>
            )}
          </div>
        </aside>
      </div>
    );
  }

  // ============================================================
  // SIDEBAR
  // ============================================================

  return (
    <>
      {/* ========================================================
          MOBILE OPEN BUTTON
      ======================================================== */}

      {!isOpen && (
        <button
          type="button"
          className={styles.mobileMenuButton}
          onClick={() => setIsOpen(true)}
          aria-label={t("sidebar.openSidebar")}
        >
          <Menu size={20} />
        </button>
      )}

      {/* ========================================================
          MOBILE OVERLAY
      ======================================================== */}

      {isOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ========================================================
          SIDEBAR WRAPPER
      ======================================================== */}

      <div
        className={`${styles.sidebarWrapper} ${
          isOpen
            ? styles.wrapperOpen
            : styles.wrapperClosed
        }`}
      >
        <aside
          className={`${styles.sidebar} ${
            isOpen
              ? styles.sidebarOpen
              : styles.sidebarClosed
          }`}
        >
          {/* ====================================================
              HEADER
          ==================================================== */}

          <div className={styles.header}>
            {user ? (
              <>
                <div
                  className={styles.avatar}
                  style={{
                    backgroundColor: getAvatarColor(
                      user?.firstName + user?.lastName
                    ),
                  }}
                >
                  <span className={styles.avatarText}>
                    {getInitials(
                      user?.firstName,
                      user?.lastName
                    )}
                  </span>
                </div>

                {isOpen && (
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>
                      {user?.firstName} {user?.lastName}
                    </div>

                    <div className={styles.userEmail}>
                      {user?.email}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div
                  className={styles.skeletonAvatar}
                />

                {isOpen && (
                  <div className={styles.skeletonText} />
                )}
              </>
            )}

            {isOpen && (
              <Link
                to="/profile"
                className={styles.footerBtn}
                title={t("sidebar.profile")}
                onClick={() => {
                  if (window.innerWidth <= 700) {
                    setIsOpen(false);
                  }
                }}
              >
                <UserRoundCog size={16} />
              </Link>
            )}
          </div>

          {/* ====================================================
              NAVIGATION
          ==================================================== */}

          <nav className={styles.nav}>
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.id}>
                  {/* Main menu item */}

                  {item.href ? (
                    <Link
                      to={item.href}
                      className={styles.navItem}
                      onClick={() => {
                        if (
                          window.innerWidth <= 700
                        ) {
                          setIsOpen(false);
                        }
                      }}
                    >
                      <Icon
                        size={16}
                        className={styles.icon}
                      />

                      {isOpen && (
                        <span className={styles.label}>
                          {item.label}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={styles.navItem}
                      onClick={() =>
                        toggleSection(item.id)
                      }
                    >
                      <Icon
                        size={16}
                        className={styles.icon}
                      />

                      {isOpen && (
                        <>
                          <span className={styles.label}>
                            {item.label}
                          </span>

                          {item.subsections && (
                            <span
                              className={styles.chevron}
                            >
                              {expandedSection ===
                              item.id ? (
                                <ChevronDown size={14} />
                              ) : (
                                <ChevronRight size={14} />
                              )}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  )}

                  {/* Subsections */}

                  {isOpen &&
                    item.subsections &&
                    expandedSection === item.id && (
                      <div
                        className={styles.subsections}
                      >
                        {item.subsections.map(
                          (sub) => {
                            const isActive =
                              location.pathname ===
                              sub.href;

                            return (
                              <Link
                                key={sub.href}
                                to={sub.href}
                                className={`${styles.subItem} ${
                                  isActive
                                    ? styles.subItemActive
                                    : ""
                                }`}
                                onClick={() => {
                                  if (
                                    window.innerWidth <=
                                    700
                                  ) {
                                    setIsOpen(false);
                                  }
                                }}
                              >
                                <span
                                  className={
                                    styles.subDot
                                  }
                                />

                                {sub.label}
                                {sub.badge > 0 && (
                                  <span className={styles.subBadge}>{sub.badge > 99 ? "99+" : sub.badge}</span>
                                )}
                              </Link>
                            );
                          }
                        )}
                      </div>
                    )}
                </div>
              );
            })}
          </nav>

          {/* ====================================================
              FOOTER
          ==================================================== */}

          <div className={styles.footer}>
            <button
              type="button"
              onClick={handleLogout}
              className={styles.footerBtn}
              title={t("sidebar.logout")}
            >
              <LogOut size={16} />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className={styles.footerBtn}
              title={theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
              aria-label={theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {isOpen && <LanguageSwitcher />}
          </div>

          {/* ====================================================
              DESKTOP COLLAPSE BUTTON
          ==================================================== */}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={styles.toggleArrow}
            title={
              isOpen
                ? t("sidebar.closeSidebar")
                : t("sidebar.openSidebar")
            }
          >
            {isOpen ? (
              <ChevronLeft size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>
        </aside>
      </div>
    </>
  );
}



