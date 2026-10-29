import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { I18nProvider } from './context/i18nContext'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { DialogProvider } from './components/useful/DialogProvider'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { canAccessHR, canSelfService, canManageCompanySettings, canOverseeDepartments, canAccessPurchasing, isPlatformAdmin, canAccessSales, canAccessLogistics, canUsePos, can, canManageInventory, canManageTeamPermissions } from './utils/permissions'
import './styles/global.css';

// LoginPage stays a normal (eager) import: it's the very first
// thing anyone sees, including on a cold cache, so there's nothing
// to gain from a lazy chunk that just adds a network round-trip
// before the page anyone is actually here for can render. Layout
// and ProtectedRoute are structural — needed by every single route
// once logged in — so they stay eager too. Every actual PAGE below
// is lazy: before this, a fresh visit to the bare login screen
// downloaded the JS for all ~24 pages (Employees, Reports,
// Inventory, every HR module, everything) in one bundle before the
// login form could even become interactive. Each page now only
// loads the moment its route is actually visited, and the browser
// caches it after that.
import LoginPage from './pages/LoginPage'
import { useI18n } from './hooks/useI18n'
import { useAuth } from './hooks/useAuth'
const Profile = lazy(() => import('./pages/Profile'))
const Company = lazy(() => import('./pages/owner/Company'))
const WorkSchedule = lazy(() => import('./pages/owner/WorkSchedule'))
const Departments = lazy(() => import('./pages/owner/Departments'))
const Users = lazy(() => import('./pages/owner/Users'))
const Employees = lazy(() => import('./pages/hr/Employees'))
const Salaries = lazy(() => import('./pages/hr/Salaries'))
const Absences = lazy(() => import('./pages/hr/Absences'))
const Advances = lazy(() => import('./pages/hr/Advances'))
const Payroll = lazy(() => import('./pages/hr/Payroll'))
const Contracts = lazy(() => import('./pages/hr/Contracts'))
const Documents = lazy(() => import('./pages/hr/Documents'))
const Attendance = lazy(() => import('./pages/hr/Attendance'))
const Reports = lazy(() => import('./pages/hr/Reports'))
const AuditLog = lazy(() => import('./pages/hr/AuditLog'))
const OrgChart = lazy(() => import('./pages/hr/OrgChart'))
const PerformanceReviews = lazy(() => import('./pages/hr/PerformanceReviews'))
const DisciplinaryActions = lazy(() => import('./pages/hr/DisciplinaryActions'))
const LeaveCalendar = lazy(() => import('./pages/hr/LeaveCalendar'))
const Holidays = lazy(() => import('./pages/hr/Holidays'))
const Declarations = lazy(() => import('./pages/hr/Declarations'))
const LeaveBalances = lazy(() => import('./pages/hr/LeaveBalances'))
const PurchaseRequestsQueue = lazy(() => import('./pages/purchasing/PurchaseRequestsQueue'))
const PurchaseOrders = lazy(() => import('./pages/purchasing/PurchaseOrders'))
const PurchaseOrderForm = lazy(() => import('./pages/purchasing/PurchaseOrderForm'))
const PurchaseOrderDetail = lazy(() => import('./pages/purchasing/PurchaseOrderDetail'))
const PriceRequests = lazy(() => import('./pages/purchasing/PriceRequests'))
const Suppliers = lazy(() => import('./pages/purchasing/Suppliers'))
const ArticleHistory = lazy(() => import('./pages/purchasing/ArticleHistory'))
const SupplierInvoices = lazy(() => import('./pages/purchasing/SupplierInvoices'))
const PurchasingReports = lazy(() => import('./pages/purchasing/PurchasingReports'))
const Restock = lazy(() => import('./pages/purchasing/Restock'))
const MySpace = lazy(() => import('./pages/me/MySpace'))
const MyDepartment = lazy(() => import('./pages/me/MyDepartment'))
const TeamPermissions = lazy(() => import('./pages/owner/TeamPermissions'))
const PlatformClients = lazy(() => import('./pages/platform/Clients'))
const PlatformErrors = lazy(() => import('./pages/platform/Errors'))
const PlatformBilling = lazy(() => import('./pages/platform/Billing'))
const MySubscription = lazy(() => import('./pages/me/Subscription'))
// SANITY — négoce
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
// Sanity Droguerie (the shop edition, Tenant.edition = "droguerie")
const Boutique = lazy(() => import('./pages/droguerie/Boutique'))
const Carnet = lazy(() => import('./pages/droguerie/Carnet'))
const Achat = lazy(() => import('./pages/droguerie/Achat'))
const Fournisseurs = lazy(() => import('./pages/droguerie/Fournisseurs'))
const Customers = lazy(() => import('./pages/sales/Customers'))
const Quotes = lazy(() => import('./pages/sales/Quotes'))
const QuoteDetail = lazy(() => import('./pages/sales/QuoteDetail'))
const SalesDocForm = lazy(() => import('./pages/sales/SalesDocForm'))
const SalesInvoices = lazy(() => import('./pages/sales/Invoices'))
const InvoiceDetail = lazy(() => import('./pages/sales/InvoiceDetail'))
const Receivables = lazy(() => import('./pages/sales/Receivables'))
const Orders = lazy(() => import('./pages/sales/Orders'))
const OrderDetail = lazy(() => import('./pages/sales/Orders').then((m) => ({ default: m.OrderDetail })))
const Pricing = lazy(() => import('./pages/sales/Pricing'))
const Collections = lazy(() => import('./pages/sales/Collections'))
const RepPerformance = lazy(() => import('./pages/sales/RepPerformance'))
const Articles = lazy(() => import('./pages/stock/Articles'))
const ArticleDetail = lazy(() => import('./pages/stock/ArticleDetail'))
const StockLevels = lazy(() => import('./pages/stock/StockLevels'))
const Movements = lazy(() => import('./pages/stock/Movements'))
const Transfers = lazy(() => import('./pages/stock/Transfers'))
const Counts = lazy(() => import('./pages/stock/Counts'))
const CountDetail = lazy(() => import('./pages/stock/Counts').then((m) => ({ default: m.CountDetail })))
const Expiring = lazy(() => import('./pages/stock/Expiring'))
const Warehouses = lazy(() => import('./pages/stock/Warehouses'))
const Brands = lazy(() => import('./pages/stock/Warehouses').then((m) => ({ default: m.Brands })))
const InventorySettings = lazy(() => import('./pages/stock/InventorySettings'))
const PurchaseRequests = lazy(() => import('./pages/stock/PurchaseRequests'))
const DeliveryNotes = lazy(() => import('./pages/logistics/DeliveryNotes'))
const DeliveryNoteDetail = lazy(() => import('./pages/logistics/DeliveryNoteDetail'))
const Rounds = lazy(() => import('./pages/logistics/Rounds'))
const RoundDetail = lazy(() => import('./pages/logistics/Rounds').then((m) => ({ default: m.RoundDetail })))
const Pos = lazy(() => import('./pages/pos/Pos'))
const PosSessions = lazy(() => import('./pages/pos/PosSessions'))
const PosSessionDetail = lazy(() => import('./pages/pos/PosSessions').then((m) => ({ default: m.PosSessionDetail })))
const Ticket = lazy(() => import('./pages/pos/Ticket'))
const Labels = lazy(() => import('./pages/stock/Labels'))
const LabelsPrint = lazy(() => import('./pages/stock/LabelsPrint'))
// Features: accounting, WhatsApp, cheques & LCN, promotions, forecast, field app, portal
const Accounting = lazy(() => import('./pages/fx/Accounting'))
const Portfolio = lazy(() => import('./pages/fx/Portfolio'))
const Reminders = lazy(() => import('./pages/fx/Reminders'))
const Promotions = lazy(() => import('./pages/fx/Promotions'))
const Forecast = lazy(() => import('./pages/fx/Forecast'))
const Visits = lazy(() => import('./pages/fx/Visits'))
const PortalAdmin = lazy(() => import('./pages/fx/PortalAdmin'))
const FieldApp = lazy(() => import('./pages/field/FieldApp'))
const PortalApp = lazy(() => import('./pages/portal/PortalApp'))

// Every HR page needs the same two things: logged in (outer
// ProtectedRoute wrapping <Layout />) AND canAccessHR (admin/owner/
// hr-department). Wrapping each one here keeps that rule in exactly
// one place — see components/ProtectedRoute.jsx.
function hrRoute(element) {
  return <ProtectedRoute permission={canAccessHR}>{element}</ProtectedRoute>
}

// My Space (self-service) pages need `canSelfService` instead —
// anyone whose account is linked to an employee record, regardless
// of role/department.
function selfServiceRoute(element) {
  return <ProtectedRoute permission={canSelfService}>{element}</ProtectedRoute>
}

// Purchasing module (service achats) — admins and the "purchasing" department.
function purchasingRoute(element) {
  return <ProtectedRoute permission={canAccessPurchasing}>{element}</ProtectedRoute>
}

// Sales (ventes) — admins, owners and the sales department.
function salesRoute(element) {
  return <ProtectedRoute permission={canAccessSales}>{element}</ProtectedRoute>
}

function logisticsRoute(element) {
  return <ProtectedRoute permission={canAccessLogistics}>{element}</ProtectedRoute>
}

function stockRoute(element) {
  return <ProtectedRoute permission={canManageInventory}>{element}</ProtectedRoute>
}

function posRoute(element) {
  return <ProtectedRoute permission={canUsePos}>{element}</ProtectedRoute>
}

// Shown for the brief moment a lazy page's chunk is downloading —
// deliberately minimal (no spinner animation, no layout shift) since
// on a warm cache this never has time to actually become visible.
// A shop (droguerie edition) lands on its shop home, not the ERP dashboard.
function DashboardOrShop() {
  const { user } = useAuth()
  if (user?.edition === 'droguerie') return <Navigate to="/boutique" replace />
  return <Dashboard />
}

function RouteFallback() {
  return <div className="pageShell" aria-hidden="true" />
}

export default function App() {
  return (
    <I18nProvider>
      <DialogProvider>
      <AuthProvider>
      <ThemeProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              {/* Phone app for reps and drivers (offline-capable) and the reseller portal: own layouts */}
              <Route path="/m/*" element={<FieldApp />} />
              <Route path="/portail/*" element={<PortalApp />} />
              {/* 80 mm counter ticket: its own page (no sidebar) so it prints alone */}
              <Route path="/pos/tickets/:id" element={<ProtectedRoute><Ticket /></ProtectedRoute>} />
              {/* A4 sheet of QR price labels: own page so it prints alone */}
              <Route path="/etiquettes" element={<ProtectedRoute permission={canManageInventory}><LabelsPrint /></ProtectedRoute>} />

              {/* Everything under here is auth-gated AND shares the sidebar */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/profile" element={<Profile />} />
                <Route path="/dashboard" element={<DashboardOrShop />} />
                <Route path="/boutique" element={posRoute(<Boutique />)} />
                <Route path="/boutique/carnet" element={salesRoute(<Carnet />)} />
                <Route path="/boutique/achat" element={purchasingRoute(<Achat />)} />
                <Route path="/boutique/fournisseurs" element={purchasingRoute(<Fournisseurs />)} />
                {/* Platform operator only (role platform_admin) */}
                <Route
                  path="/platform/clients"
                  element={
                    <ProtectedRoute permission={isPlatformAdmin}>
                      <PlatformClients />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/platform/billing"
                  element={
                    <ProtectedRoute permission={isPlatformAdmin}>
                      <PlatformBilling />
                    </ProtectedRoute>
                  }
                />
                {/* A client's administrators: their plan and the platform's invoices */}
                <Route
                  path="/organization/subscription"
                  element={
                    <ProtectedRoute permission={(u) => !!u?.tenant && ["admin", "owner"].includes(u?.role)}>
                      <MySubscription />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/platform/errors"
                  element={
                    <ProtectedRoute permission={isPlatformAdmin}>
                      <PlatformErrors />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organization/company"
                  element={
                    <ProtectedRoute permission={canManageCompanySettings}>
                      <Company />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organization/users"
                  element={
                    <ProtectedRoute permission={canManageCompanySettings}>
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organization/work-schedule"
                  element={
                    <ProtectedRoute permission={(u) => canManageCompanySettings(u) || can(u, "organization.schedule.edit")}>
                      <WorkSchedule />
                    </ProtectedRoute>
                  }
                />
                {/* Same page as My Space > My department, for admins
                    (every department) and owners (their companies'). */}
                <Route
                  path="/organization/department-access"
                  element={
                    <ProtectedRoute permission={canManageCompanySettings}>
                      <MyDepartment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organization/departments"
                  element={
                    <ProtectedRoute permission={(u) => canManageCompanySettings(u) || can(u, "organization.departments.view")}>
                      <Departments />
                    </ProtectedRoute>
                  }
                />

                {/* HR module */}
                <Route path="/hr/employees" element={hrRoute(<Employees />)} />
                <Route path="/hr/salaries" element={hrRoute(<Salaries />)} />
                <Route path="/hr/absences" element={hrRoute(<Absences />)} />
                <Route path="/hr/advances" element={hrRoute(<Advances />)} />
                <Route path="/hr/payroll" element={hrRoute(<Payroll />)} />
                <Route path="/hr/contracts" element={hrRoute(<Contracts />)} />
                <Route path="/hr/documents" element={hrRoute(<Documents />)} />
                <Route path="/hr/attendance" element={hrRoute(<Attendance />)} />
                <Route path="/hr/reports" element={hrRoute(<Reports />)} />
                <Route path="/hr/audit-log" element={hrRoute(<AuditLog />)} />
                <Route path="/hr/org-chart" element={hrRoute(<OrgChart />)} />
                <Route path="/hr/performance-reviews" element={hrRoute(<PerformanceReviews />)} />
                <Route path="/hr/disciplinary-actions" element={hrRoute(<DisciplinaryActions />)} />
                <Route path="/hr/leave-calendar" element={hrRoute(<LeaveCalendar />)} />
                <Route path="/hr/holidays" element={hrRoute(<Holidays />)} />
                <Route path="/hr/declarations" element={hrRoute(<Declarations />)} />
                {/* Sales (ventes) */}
                <Route path="/sales/customers" element={salesRoute(<Customers />)} />
                <Route path="/sales/orders" element={salesRoute(<Orders />)} />
                <Route path="/sales/orders/new" element={salesRoute(<SalesDocForm kind="order" />)} />
                <Route path="/sales/orders/:id" element={salesRoute(<OrderDetail />)} />
                <Route path="/sales/orders/:id/edit" element={salesRoute(<SalesDocForm kind="order" />)} />
                <Route path="/sales/quotes" element={salesRoute(<Quotes />)} />
                <Route path="/sales/quotes/new" element={salesRoute(<SalesDocForm kind="quote" />)} />
                <Route path="/sales/quotes/:id" element={salesRoute(<QuoteDetail />)} />
                <Route path="/sales/quotes/:id/edit" element={salesRoute(<SalesDocForm kind="quote" />)} />
                <Route path="/sales/invoices" element={salesRoute(<SalesInvoices />)} />
                <Route path="/sales/invoices/new" element={salesRoute(<SalesDocForm kind="invoice" />)} />
                <Route path="/sales/invoices/:id" element={salesRoute(<InvoiceDetail />)} />
                <Route path="/sales/invoices/:id/edit" element={salesRoute(<SalesDocForm kind="invoice" />)} />
                <Route path="/sales/receivables" element={salesRoute(<Receivables />)} />
                <Route path="/sales/collections" element={salesRoute(<Collections />)} />
                <Route path="/sales/reps" element={salesRoute(<RepPerformance />)} />
                <Route path="/sales/pricing" element={salesRoute(<Pricing />)} />
                <Route path="/sales/promotions" element={<ProtectedRoute permission={(u) => can(u, "sales.promotions.view")}><Promotions /></ProtectedRoute>} />
                <Route path="/sales/reminders" element={<ProtectedRoute permission={(u) => can(u, "sales.collections.view") || can(u, "sales.collections.manage")}><Reminders /></ProtectedRoute>} />
                <Route path="/sales/visits" element={<ProtectedRoute permission={(u) => can(u, "sales.visits.view") || can(u, "sales.reps.view")}><Visits /></ProtectedRoute>} />
                <Route path="/sales/portal" element={<ProtectedRoute permission={(u) => can(u, "sales.portal.manage")}><PortalAdmin /></ProtectedRoute>} />
                <Route path="/finance/accounting" element={<ProtectedRoute permission={(u) => can(u, "finance.accounting.view")}><Accounting /></ProtectedRoute>} />
                <Route path="/finance/portfolio" element={<ProtectedRoute permission={(u) => can(u, "sales.portfolio.view")}><Portfolio /></ProtectedRoute>} />
                {/* Point of sale (caisse) */}
                <Route path="/pos" element={posRoute(<Pos />)} />
                <Route path="/pos/sessions" element={posRoute(<PosSessions />)} />
                <Route path="/pos/sessions/:id" element={posRoute(<PosSessionDetail />)} />
                {/* Stock */}
                <Route path="/stock/articles" element={stockRoute(<Articles />)} />
                <Route path="/stock/articles/new" element={stockRoute(<ArticleDetail />)} />
                <Route path="/stock/articles/:id" element={stockRoute(<ArticleDetail />)} />
                <Route path="/stock/levels" element={stockRoute(<StockLevels />)} />
                <Route path="/stock/labels" element={stockRoute(<Labels />)} />
                <Route path="/stock/movements" element={stockRoute(<Movements />)} />
                <Route path="/stock/transfers" element={stockRoute(<Transfers />)} />
                <Route path="/stock/counts" element={stockRoute(<Counts />)} />
                <Route path="/stock/counts/:id" element={stockRoute(<CountDetail />)} />
                <Route path="/stock/expiring" element={stockRoute(<Expiring />)} />
                <Route path="/stock/warehouses" element={stockRoute(<Warehouses />)} />
                <Route path="/stock/brands" element={stockRoute(<Brands />)} />
                <Route path="/stock/families" element={<ProtectedRoute permission={(u) => can(u, "inventory.categories.view") || canManageInventory(u)}><InventorySettings /></ProtectedRoute>} />
                <Route path="/stock/purchase-requests" element={<ProtectedRoute permission={(u) => can(u, "inventory.requests.view") || canManageInventory(u)}><PurchaseRequests /></ProtectedRoute>} />
                {/* Logistics */}
                <Route path="/logistics/delivery-notes" element={logisticsRoute(<DeliveryNotes />)} />
                <Route path="/logistics/delivery-notes/new" element={logisticsRoute(<DeliveryNoteDetail />)} />
                <Route path="/logistics/delivery-notes/:id" element={logisticsRoute(<DeliveryNoteDetail />)} />
                <Route path="/logistics/rounds" element={logisticsRoute(<Rounds />)} />
                <Route path="/logistics/rounds/:id" element={logisticsRoute(<RoundDetail />)} />
                {/* Old xframe addresses (bookmarks) */}
                <Route path="/production/inventory" element={<Navigate to="/stock/articles" replace />} />
                <Route path="/production/purchase-requests" element={<Navigate to="/stock/purchase-requests" replace />} />
                <Route path="/technical/categories" element={<Navigate to="/stock/families" replace />} />
                <Route path="/me/team-permissions" element={<ProtectedRoute permission={canManageTeamPermissions}><TeamPermissions /></ProtectedRoute>} />
                <Route path="/organization/roles-permissions" element={<ProtectedRoute permission={canManageTeamPermissions}><TeamPermissions /></ProtectedRoute>} />
                <Route path="/hr/leave-balances" element={hrRoute(<LeaveBalances />)} />

                {/* My Space (self-service) — one tabbed page, several
                    paths so each tab is directly linkable/bookmarkable
                    and the sidebar can highlight the active one. */}
                <Route path="/me" element={selfServiceRoute(<MySpace />)} />
                <Route path="/me/payslips" element={selfServiceRoute(<MySpace />)} />
                <Route path="/me/absences" element={selfServiceRoute(<MySpace />)} />
                <Route path="/me/advances" element={selfServiceRoute(<MySpace />)} />
                <Route path="/me/attendance" element={selfServiceRoute(<MySpace />)} />
                <Route path="/me/records" element={selfServiceRoute(<MySpace />)} />
                <Route
                  path="/me/department"
                  element={
                    <ProtectedRoute permission={canOverseeDepartments}>
                      <MyDepartment />
                    </ProtectedRoute>
                  }
                />

                {/* Purchasing module (service achats) */}
                <Route path="/purchasing/requests" element={purchasingRoute(<PurchaseRequestsQueue />)} />
                <Route path="/purchasing/orders" element={purchasingRoute(<PurchaseOrders />)} />
                <Route path="/purchasing/orders/new" element={purchasingRoute(<PurchaseOrderForm />)} />
                <Route path="/purchasing/orders/:id" element={purchasingRoute(<PurchaseOrderDetail />)} />
                <Route path="/purchasing/orders/:id/edit" element={purchasingRoute(<PurchaseOrderForm />)} />
                <Route path="/purchasing/invoices" element={purchasingRoute(<SupplierInvoices />)} />
                <Route path="/purchasing/reports" element={purchasingRoute(<PurchasingReports />)} />
                <Route path="/purchasing/restock" element={purchasingRoute(<Restock />)} />
                <Route path="/purchasing/forecast" element={<ProtectedRoute permission={(u) => can(u, "purchasing.reports.view") || can(u, "purchasing.orders.create")}><Forecast /></ProtectedRoute>} />
                <Route path="/purchasing/price-requests" element={purchasingRoute(<PriceRequests />)} />
                <Route path="/purchasing/suppliers" element={purchasingRoute(<Suppliers />)} />
                <Route path="/purchasing/inventory" element={<Navigate to="/stock/articles" replace />} />
                <Route path="/purchasing/article-history" element={purchasingRoute(<ArticleHistory />)} />

                {/* Unmatched routes (including the organization sidebar's
                    not-yet-built placeholder links — Departments, Job
                    Positions, etc.) land here instead of a blank page. */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
      </AuthProvider>
      </DialogProvider>
    </I18nProvider>
  )
}

function NotFound() {
  const { t } = useI18n()
  return (
    <div className="pageShell">
      <div className="emptyStateBlock">
        <h2>{t("common.pageNotFound")}</h2>
        <p>{t("common.pageNotFoundHint")}</p>
      </div>
    </div>
  )
}
