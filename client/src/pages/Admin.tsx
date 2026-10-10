import {
  BarChart3,
  Bell,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  Command,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackageCheck,
  Palette,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { SettingsSection } from "../components/settings/DashboardSettingsTypes";
import { logout } from "../services/adminApi";

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
] as const;

const operationsNavigation = [
  { label: "Fulfillment", icon: PackageCheck },
  { label: "Shipping", icon: Truck },
  { label: "Payments", icon: CreditCard },
] as const;

const storeNavigation = [
  { label: "Stores", icon: Store },
  { label: "Storefront", icon: ExternalLink },
  { label: "Theme Editor", icon: Palette },
] as const;

const settingsNavigation: Array<{
  id: SettingsSection;
  label: string;
  description: string;
}> = [
  { id: "General", label: "General", description: "Store information and preferences" },
  { id: "Checkout", label: "Checkout", description: "Customer experience and checkout" },
  { id: "Shipping", label: "Shipping & delivery", description: "Delivery estimates and shipping" },
  { id: "Policies", label: "Policies", description: "Refund, return and store policies" },
  { id: "Payments", label: "Payment settings", description: "Payment configuration" },
  { id: "Account", label: "Account", description: "Store owner information" },
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

const allPages: Array<{ label: PageKey; group: string }> = [
  ...primaryNavigation.map((item) => ({ label: item.label as PageKey, group: "Sales" })),
  ...operationsNavigation.map((item) => ({ label: item.label as PageKey, group: "Operations" })),
  ...storeNavigation.map((item) => ({ label: item.label as PageKey, group: "Online store" })),
  { label: "Settings", group: "System" },
];

function getProfileName() {
  try {
    return localStorage.getItem("meo_profile_name")?.trim() || "Store Owner";
  } catch {
    return "Store Owner";
  }
}

function openAssistant() {
  window.dispatchEvent(new CustomEvent("meo:open-assistant", { detail: { workspace: "global" } }));
}

export default function Admin() {
  const navigateRouter = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [active, setActive] = useState<PageKey>("Overview");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("General");
  const [profileOpen, setProfileOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [profileName, setProfileName] = useState(getProfileName);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const storeRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleAiNavigation = (event: Event) => {
      const target = (event as CustomEvent<{ page?: string }>).detail?.page as PageKey | undefined;
      const allowed: PageKey[] = allPages.map((item) => item.label);
      if (target && allowed.includes(target)) navigate(target);
    };

    const syncProfile = () => setProfileName(getProfileName());
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        window.setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setProfileOpen(false);
        setStoreOpen(false);
        setNotificationsOpen(false);
      }
    };

    window.addEventListener("meo:navigate", handleAiNavigation);
    window.addEventListener("storage", syncProfile);
    window.addEventListener("meo:profile-updated", syncProfile);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("meo:navigate", handleAiNavigation);
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("meo:profile-updated", syncProfile);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!profileRef.current?.contains(target)) setProfileOpen(false);
      if (!storeRef.current?.contains(target)) setStoreOpen(false);
      if (!notificationsRef.current?.contains(target)) setNotificationsOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const initials = useMemo(
    () => profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "SO",
    [profileName],
  );

  function navigate(page: PageKey) {
    setActive(page);
    setSidebarOpen(false);
    setSearchOpen(false);
    setSearch("");
    if (page === "Settings") setSettingsOpen(true);
    else setSettingsOpen(false);
  }

  function navigateSetting(section: SettingsSection) {
    setSettingsSection(section);
    setActive("Settings");
    setSettingsOpen(true);
    setSidebarOpen(false);
  }

  function renderPage() {
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
  }

  const filteredSearch = allPages.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase().trim()),
  );

  async function signOut() {
    try {
      await logout();
    } catch {
      // The token is still cleared locally below.
    }
    navigateRouter("/admin/login", { replace: true });
  }

  function renderNavGroup(title: string, items: readonly { label: string; icon: typeof LayoutDashboard }[]) {
    return (
      <div className="mb-5">
        {!sidebarCollapsed && (
          <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</p>
        )}
        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const selected = active === item.label;
            return (
              <button
                key={item.label}
                type="button"
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => navigate(item.label as PageKey)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  selected ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <Icon size={17} strokeWidth={selected ? 2.2 : 1.9} />
                {!sidebarCollapsed && <span className="flex-1">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const sidebar = (
    <aside className={`flex h-full flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ${sidebarCollapsed ? "w-[76px]" : "w-[276px]"}`}>
      <div className="border-b border-slate-200 px-3 py-4">
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : "px-2"}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">M</div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black tracking-tight text-slate-950">MEO Commerce</p>
              <p className="text-[11px] text-slate-400">Admin workspace</p>
            </div>
          )}
          <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <div ref={storeRef} className="relative mt-4">
          <button
            type="button"
            title={sidebarCollapsed ? "Switch workspace" : undefined}
            onClick={() => setStoreOpen((value) => !value)}
            className={`flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left transition hover:bg-slate-100 ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-900 shadow-sm"><Store size={17} /></div>
            {!sidebarCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">Global Ecommerce</p>
                  <p className="truncate text-[11px] text-slate-500">Main workspace</p>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition ${storeOpen ? "rotate-180" : ""}`} />
              </>
            )}
          </button>

          {storeOpen && (
            <div className={`absolute top-[calc(100%+8px)] z-[80] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ${sidebarCollapsed ? "left-14" : "left-0"}`}>
              <div className="px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Workspaces</p></div>
              <div className="rounded-xl bg-slate-50 p-2">
                <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">G</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">Global Ecommerce</p><p className="text-[11px] text-slate-400">Current workspace</p></div>
                  <Check size={15} className="text-emerald-600" />
                </div>
              </div>
              <Link to="/nigeria-admin" className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setStoreOpen(false)}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold">N</div>
                <span className="flex-1">Nigeria Ecommerce</span>
                <ChevronRight size={15} className="text-slate-300" />
              </Link>
            </div>
          )}
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        {renderNavGroup("Sales", primaryNavigation)}
        {renderNavGroup("Operations", operationsNavigation)}
        {renderNavGroup("Online store", storeNavigation)}

        <div className="mb-4">
          <button
            type="button"
            title={sidebarCollapsed ? "Settings" : undefined}
            onClick={() => setSettingsOpen((value) => !value)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${active === "Settings" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"} ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <Settings size={17} />
            {!sidebarCollapsed && <><span className="flex-1">Settings</span><ChevronRight size={16} className={`transition ${settingsOpen ? "rotate-90" : ""}`} /></>}
          </button>

          {settingsOpen && !sidebarCollapsed && (
            <div className="ml-5 mt-1 border-l border-slate-200 pl-2">
              {settingsNavigation.map((item) => {
                const selected = active === "Settings" && settingsSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateSetting(item.id)}
                    className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition ${selected ? "bg-slate-100" : "hover:bg-slate-50"}`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${selected ? "bg-slate-950" : "bg-slate-300 group-hover:bg-slate-500"}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-xs font-semibold ${selected ? "text-slate-950" : "text-slate-700"}`}>{item.label}</span>
                      <span className="hidden text-[10px] leading-4 text-slate-400 xl:block">{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-3">
        <Link to="/admin/profile" className={`flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-slate-50 ${sidebarCollapsed ? "justify-center" : ""}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">{initials}</div>
          {!sidebarCollapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-900">{profileName}</p><p className="truncate text-[11px] text-slate-400">Store Owner</p></div>}
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f6f6f7] text-slate-950">
      {sidebarOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className={`fixed inset-y-0 left-0 z-50 transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebar}
      </div>

      <div className={`min-h-screen transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[276px]"}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button>

            <button type="button" onClick={() => setSidebarCollapsed((value) => !value)} className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:block" title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <Menu size={19} />
            </button>

            <div className="min-w-0 flex-1">
              <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex"><span>Global Ecommerce</span><ChevronRight size={13} /><span className="font-semibold text-slate-700">{active === "Settings" ? settingsNavigation.find((item) => item.id === settingsSection)?.label || "Settings" : active}</span></div>
              <h1 className="truncate text-sm font-bold sm:hidden">{active === "Settings" ? settingsNavigation.find((item) => item.id === settingsSection)?.label || "Settings" : active}</h1>
            </div>

            <button type="button" onClick={() => { setSearchOpen(true); window.setTimeout(() => searchRef.current?.focus(), 0); }} className="hidden min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white md:flex" title="Search (Ctrl K)">
              <Search size={16} />
              <span className="hidden lg:inline">Search</span>
              <kbd className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 lg:inline-flex"><Command size={10} /> K</kbd>
            </button>

            <button type="button" onClick={openAssistant} className="hidden min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 md:flex">
              <Sparkles size={17} />
              <span className="hidden lg:inline">MEO AI</span>
            </button>

            <div ref={notificationsRef} className="relative">
              <button type="button" onClick={() => setNotificationsOpen((value) => !value)} className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Notifications">
                <Bell size={18} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-slate-950" />
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-[100] w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><p className="text-sm font-black">Notifications</p><p className="text-[11px] text-slate-400">Your latest store activity</p></div><button type="button" className="text-xs font-bold text-slate-400 hover:text-slate-900" onClick={() => setNotificationsOpen(false)}>Close</button></div>
                  <div className="p-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-bold">You&apos;re all caught up</p><p className="mt-1 text-xs leading-5 text-slate-500">New order, payment and fulfillment notifications will appear here.</p></div></div>
                </div>
              )}
            </div>

            <Link to="/store" target="_blank" className="hidden rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:block" aria-label="View storefront"><ExternalLink size={18} /></Link>

            <div ref={profileRef} className="relative">
              <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2 transition hover:bg-slate-50" aria-expanded={profileOpen}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-white">{initials}</span>
                <ChevronDown size={15} className={`hidden text-slate-400 transition sm:block ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-[100] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                  <div className="border-b border-slate-100 px-3 py-3"><p className="text-sm font-black">{profileName}</p><p className="mt-0.5 text-xs text-slate-400">Store Owner · Administrator</p></div>
                  <Link to="/admin/profile" onClick={() => setProfileOpen(false)} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><User size={17} /> Profile</Link>
                  <button type="button" onClick={() => { setProfileOpen(false); navigate("Settings"); navigateSetting("General"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"><Settings size={17} /> Settings</button>
                  <button type="button" onClick={() => { setProfileOpen(false); openAssistant(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"><Sparkles size={17} /> MEO AI</button>
                  <Link to="/store" target="_blank" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ExternalLink size={17} /> View storefront</Link>
                  <div className="my-1 border-t border-slate-100" />
                  <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut size={17} /> Sign out</button>
                </div>
              )}
            </div>
          </div>

          {searchOpen && (
            <div className="border-t border-slate-100 px-4 py-3 sm:px-6">
              <div className="mx-auto max-w-3xl">
                <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2.5 shadow-sm ring-2 ring-slate-950/5">
                  <Search size={17} className="text-slate-400" />
                  <input ref={searchRef} autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, orders, customers, analytics, settings…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                  <button type="button" onClick={() => { setSearch(""); setSearchOpen(false); }} className="rounded-lg px-2 py-1 text-xs font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700">Esc</button>
                </div>
                {search.trim() && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {filteredSearch.length ? filteredSearch.map((item) => (
                      <button key={item.label} type="button" onClick={() => navigate(item.label)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50">
                        <Search size={15} className="text-slate-400" /><span className="flex-1 text-sm font-semibold">{item.label}</span><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.group}</span>
                      </button>
                    )) : <div className="px-3 py-4 text-center text-sm text-slate-500">No admin page found.</div>}
                  </div>
                )}
              </div>
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
