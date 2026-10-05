import {
  BarChart3,
  Bell,
  Box,
  ChevronDown,
  ChevronRight,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Package,
  PackageCheck,
  Palette,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { SettingsSection } from "../components/settings/DashboardSettingsTypes";

import Orders from "./admin/Orders";
import FulfillmentCenter from "./admin/FulfillmentCenter";
import Products from "./admin/Products";
import Analytics from "./admin/Analytics";
import Payments from "./admin/Payments";
import Shipping from "./admin/Shipping";
import Customers from "./admin/Customers";
import Inventory from "./admin/Inventory";
import Storefront from "./admin/Storefront";
import Stores from "./Stores";
import ThemeEditorPage from "./admin/ThemeEditorPage";
import WorkspaceSettings from "./admin/WorkSpaceSettings";
import BusinessHealthChart from "../components/admin/BusinessHealthChart";
import WorldGlobe from "../components/admin/WorldGlobe";
import { getBusinessHealth } from "../services/businessHealth";
import type { BusinessHealth } from "../types/businessHealth";

const primaryNavigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Orders", icon: ShoppingCart },
  { label: "Products", icon: Package },
  { label: "Customers", icon: Users },
  { label: "Inventory", icon: Box },
  { label: "Analytics", icon: BarChart3 },
];

const operationsNavigation = [
  { label: "Fulfillment", icon: PackageCheck },
  { label: "Shipping", icon: Truck },
  { label: "Payments", icon: CreditCard },
];

const storeNavigation = [
  { label: "Stores", icon: Store },
  { label: "Storefront", icon: ExternalLink },
  { label: "Theme Editor", icon: Palette },
];

const settingsNavigation: Array<{ id: SettingsSection; label: string; description: string }> = [
  { id: "General", label: "General", description: "Store information and preferences" },
  { id: "Checkout", label: "Checkout", description: "Checkout and customer experience" },
  { id: "Shipping", label: "Shipping & delivery", description: "Shipping zones and delivery" },
  { id: "Policies", label: "Policies", description: "Refund, return and store policies" },
  { id: "Payments", label: "Payment settings", description: "Payment configuration" },
  { id: "Account", label: "Profile", description: "Owner and account information" },
  { id: "Security", label: "Security", description: "Password and account security" },
  { id: "Users", label: "Staff & permissions", description: "Team access and permissions" },
  { id: "Notifications", label: "Notifications", description: "Order and customer notifications" },
  { id: "Domains", label: "Domains", description: "Store URL and domain configuration" },
  { id: "Data", label: "Data & integrations", description: "Exports, API and integrations" },
  { id: "Advanced", label: "Store status", description: "Availability and advanced controls" },
];

type PageKey =
  | "Overview"
  | "Stores"
  | "Orders"
  | "Fulfillment"
  | "Products"
  | "Customers"
  | "Analytics"
  | "Payments"
  | "Shipping"
  | "Storefront"
  | "Theme Editor"
  | "Inventory"
  | "Settings";

function getProfileName() {
  try {
    return localStorage.getItem("meo_profile_name")?.trim() || "Store Owner";
  } catch {
    return "Store Owner";
  }
}

function openAssistant() {
  window.dispatchEvent(new CustomEvent("meo:open-assistant"));
}

export default function Admin() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState<PageKey>("Overview");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("General");
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [profileName, setProfileName] = useState(getProfileName);

  useEffect(() => {
    const handleAiNavigation = (event: Event) => {
      const customEvent = event as CustomEvent<{ page?: string }>;
      const target = customEvent.detail?.page as PageKey | undefined;
      const allowed: PageKey[] = ["Overview", "Stores", "Orders", "Fulfillment", "Products", "Customers", "Analytics", "Payments", "Shipping", "Storefront", "Theme Editor", "Inventory", "Settings"];
      if (target && allowed.includes(target)) navigate(target);
    };
    window.addEventListener("meo:navigate", handleAiNavigation);
    const syncProfile = () => setProfileName(getProfileName());
    window.addEventListener("storage", syncProfile);
    window.addEventListener("meo:profile-updated", syncProfile);
    return () => {
      window.removeEventListener("meo:navigate", handleAiNavigation);
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("meo:profile-updated", syncProfile);
    };
  }, []);

  const initials = useMemo(
    () =>
      profileName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "SO",
    [profileName],
  );

  const navigate = (page: PageKey) => {
    setActive(page);
    setSidebarOpen(false);
    if (page !== "Settings") setSettingsOpen(false);
  };

  const renderPage = () => {
    switch (active) {
      case "Stores": return <Stores />;
      case "Orders": return <Orders />;
      case "Fulfillment": return <FulfillmentCenter />;
      case "Products": return <Products />;
      case "Customers": return <Customers />;
      case "Analytics": return <Analytics />;
      case "Payments": return <Payments />;
      case "Shipping": return <Shipping />;
      case "Inventory": return <Inventory />;
      case "Storefront": return <Storefront />;
      case "Theme Editor": return <ThemeEditorPage />;
      case "Settings": return <WorkspaceSettings workspaceKey="global" workspaceName="Global Ecommerce" initialSection={settingsSection} />;
      default: return <Overview />;
    }
  };

  const filteredSearch = [
    ...primaryNavigation.map((item) => item.label),
    ...operationsNavigation.map((item) => item.label),
    ...storeNavigation.map((item) => item.label),
    "Settings",
  ].filter((item) => item.toLowerCase().includes(search.toLowerCase().trim()));

  const renderNavGroup = (title: string, items: typeof primaryNavigation) => (
    <div className="mb-6">
      <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = active === item.label;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.label as PageKey)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${selected ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
            >
              <Icon size={17} strokeWidth={selected ? 2.2 : 1.9} />
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const sidebar = (
    <aside className="flex h-full w-[276px] flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">M</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black tracking-tight text-slate-950">MEO Commerce</p>
            <p className="text-[11px] text-slate-400">Admin workspace</p>
          </div>
          <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <button type="button" className="mt-4 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left hover:bg-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-900 shadow-sm"><Store size={17} /></div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">My Store</p>
            <p className="truncate text-[11px] text-slate-500">Global Ecommerce</p>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        {renderNavGroup("Sales", primaryNavigation)}
        {renderNavGroup("Operations", operationsNavigation)}
        {renderNavGroup("Online store", storeNavigation)}

        <div className="mb-3">
          <button
            type="button"
            onClick={() => { setSettingsOpen((value) => !value); setActive("Settings"); }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${active === "Settings" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
          >
            <Settings size={17} />
            <span className="flex-1">Settings</span>
            <ChevronRight size={16} className={`transition ${settingsOpen ? "rotate-90" : ""}`} />
          </button>

          {settingsOpen && (
            <div className="ml-5 mt-1 border-l border-slate-200 pl-2">
              {settingsNavigation.map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => { setSettingsSection(item.id); setActive("Settings"); setSidebarOpen(false); }}
                  className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${settingsSection === item.id && active === "Settings" ? "bg-slate-50" : "hover:bg-slate-50"}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${index === 0 ? "bg-slate-900" : "bg-slate-300 group-hover:bg-slate-500"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-slate-700">{item.label}</span>
                    <span className="hidden text-[10px] text-slate-400 xl:block">{item.description}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-3">
        <Link to="/admin/profile" className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">{profileName}</p>
            <p className="truncate text-[11px] text-slate-400">Store Owner</p>
          </div>
          <User size={16} className="text-slate-400" />
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f6f6f7] text-slate-950">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>{sidebar}</div>

      <div className="min-h-screen lg:pl-[276px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button>

            <div className="min-w-0 flex-1">
              <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex"><span>Global Ecommerce</span><ChevronRight size={13} /><span className="font-semibold text-slate-600">{active}</span></div>
              <h1 className="truncate text-sm font-bold sm:hidden">{active}</h1>
            </div>

            <div className="hidden items-center gap-1 md:flex">
              <button type="button" onClick={() => setSearchOpen((value) => !value)} className="rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Search"><Search size={18} /></button>
              <button type="button" onClick={openAssistant} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"><MessageCircle size={17} /> AI assistant</button>
              <button type="button" className="relative rounded-lg p-2.5 text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-slate-900" /></button>
              <Link to="/store" target="_blank" className="rounded-lg p-2.5 text-slate-500 hover:bg-slate-100" aria-label="View storefront"><ExternalLink size={18} /></Link>
            </div>

            <div className="relative">
              <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2 hover:bg-slate-50" aria-expanded={profileOpen}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-white">{initials}</span>
                <ChevronDown size={15} className={`hidden text-slate-400 sm:block ${profileOpen ? "rotate-180" : ""}`} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                  <div className="border-b border-slate-100 px-3 py-3"><p className="text-sm font-bold">{profileName}</p><p className="mt-0.5 text-xs text-slate-400">Store Owner · Administrator</p></div>
                  <Link to="/admin/profile" onClick={() => setProfileOpen(false)} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><User size={17} /> Profile</Link>
                  <button type="button" onClick={() => { setActive("Settings"); setSettingsOpen(true); setSettingsSection("General"); setProfileOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"><Settings size={17} /> Settings</button>
                  <Link to="/admin/ai" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ShieldCheck size={17} /> MEO AI</Link>
                </div>
              )}
            </div>
          </div>

          {searchOpen && (
            <div className="border-t border-slate-100 px-4 py-3 sm:px-6">
              <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Search size={17} className="text-slate-400" />
                <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, orders, customers, settings..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                <button type="button" onClick={() => { setSearch(""); setSearchOpen(false); }} className="text-xs font-semibold text-slate-400 hover:text-slate-700">Esc</button>
              </div>
              {search.trim() && <div className="mx-auto mt-2 max-w-3xl rounded-xl border border-slate-200 bg-white p-2 shadow-sm">{filteredSearch.map((item) => <button key={item} type="button" onClick={() => { navigate(item as PageKey); setSearchOpen(false); setSearch(""); }} className="flex w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50">{item}</button>)}</div>}
            </div>
          )}
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{renderPage()}</main>
      </div>
    </div>
  );
}

function Overview() {
  const [businessHealth, setBusinessHealth] = useState<BusinessHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadBusinessHealth() {
      try {
        setLoading(true);
        setError(null);
        const result = await getBusinessHealth();
        if (mounted) setBusinessHealth(result);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load business health.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadBusinessHealth();
    return () => { mounted = false; };
  }, []);

  const revenue = businessHealth?.currentPeriod.revenue ?? 0;
  const orders = businessHealth?.currentPeriod.orders ?? 0;
  const profit = businessHealth?.currentPeriod.profit ?? 0;
  const margin = businessHealth?.currentPeriod.margin ?? 0;

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Overview</p><h1 className="mt-2 text-3xl font-black tracking-tight">Good afternoon 👋</h1><p className="mt-2 text-sm text-slate-500">Here’s what’s happening with your store.</p></div>
        <Link to="/store" target="_blank" className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-slate-50"><ExternalLink size={16} /> View store</Link>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="30-day sales" value={`$${revenue.toFixed(2)}`} />
        <Stat title="Orders" value={orders.toString()} />
        <Stat title="Profit" value={`$${profit.toFixed(2)}`} />
        <Stat title="Profit margin" value={`${margin.toFixed(2)}%`} />
      </div>

      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <div className="mt-5">{loading ? <div className="flex h-[460px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">Loading business health...</div> : businessHealth ? <BusinessHealthChart data={businessHealth} /> : null}</div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><p className="text-sm font-medium text-slate-500">Visitors around the world</p><h2 className="mt-1 text-xl font-bold">Live visitor locations</h2><p className="mt-1 text-sm text-slate-500">Approximate visitor locations based on network location data.</p><div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-950"><WorldGlobe /></div></div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 xl:col-span-2"><h2 className="font-bold">Business profitability</h2><p className="mt-1 text-sm text-slate-500">Your overall business performance is calculated from confirmed business orders.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><BusinessMetric label="Business status" value={businessHealth?.businessStatus === "profitable" ? "Profitable" : businessHealth?.businessStatus === "loss" ? "Loss" : "Break-even"} /><BusinessMetric label="Profit trend" value={businessHealth?.profitTrend === "up" ? "Trending up" : businessHealth?.profitTrend === "down" ? "Trending down" : "Stable"} /><BusinessMetric label="Healthy products" value={businessHealth?.healthyProducts.toString() ?? "0"} /><BusinessMetric label="Low-margin products" value={businessHealth?.lowMarginProducts.toString() ?? "0"} /></div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-bold">Order status</h2><div className="mt-5 space-y-4"><Status label="Payment pending" /><Status label="Settlement pending" /><Status label="Ready to fulfill" /><Status label="Shipped" /><Status label="Delivered" /></div></div>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{title}</p><p className="mt-3 text-2xl font-black tracking-tight">{value}</p></div>; }
function BusinessMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-lg font-bold text-slate-950">{value}</p></div>; }
function Status({ label }: { label: string }) { return <div className="flex justify-between border-b border-slate-100 pb-3 text-sm"><span className="text-slate-600">{label}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">0</span></div>; }
