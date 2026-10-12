<<<<<<< HEAD
﻿
import {
  BarChart3, Bell, Box, Check, ChevronDown, ChevronRight, Command,
  CreditCard, ExternalLink, LayoutDashboard, LogOut, Menu, Package,
  PackageCheck, Search, Settings, ShoppingCart, Sparkles, Store, Truck,
  User, Users, X, ArrowUpRight, Activity, ShieldCheck, Globe2,
=======
﻿import {
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
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  User,
  Users,
  X,
>>>>>>> 5095110c003cc39fcdb7e559c7dbc06833130cf1
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
  { label: "Store Content", icon: ExternalLink },
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
  | "Overview" | "Stores" | "Orders" | "Fulfillment" | "Products"
  | "Customers" | "Analytics" | "Payments" | "Shipping"
  | "Store Content" | "Inventory" | "Settings";

const allPages: Array<{ label: PageKey; group: string }> = [
  ...primaryNavigation.map((item) => ({ label: item.label as PageKey, group: "Sales" })),
  ...operationsNavigation.map((item) => ({ label: item.label as PageKey, group: "Operations" })),
  ...storeNavigation.map((item) => ({ label: item.label as PageKey, group: "Store Management" })),
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
  window.dispatchEvent(new CustomEvent("meo:open-assistant", {
    detail: { workspace: "global" },
  }));
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
  const [storeManagementOpen, setStoreManagementOpen] = useState(true);
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
      if (target && allPages.some((item) => item.label === target)) navigate(target);
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
  });

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!profileRef.current?.contains(target)) setProfileOpen(false);
      if (!storeRef.current?.contains(target)) setStoreOpen(false);
      if (!notificationsRef.current?.contains(target)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const initials = useMemo(
    () => profileName.split(/\s+/).filter(Boolean).slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "").join("") || "SO",
    [profileName],
  );

  function navigate(page: PageKey) {
    setActive(page);
    setSidebarOpen(false);
    setSearchOpen(false);
    setSearch("");
    setSettingsOpen(page === "Settings");

    if (page === "Stores" || page === "Store Content") {
      setStoreManagementOpen(true);
    }
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
      case "Store Content": return <Storefront />;
      case "Settings":
        return <WorkspaceSettings workspaceKey="global" workspaceName="Global Ecommerce" initialSection={settingsSection} />;
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
      // Local navigation continues if the logout request fails.
    }
    navigateRouter("/admin/login", { replace: true });
  }

  // Shared selected styling: every navigation item uses the same active treatment.
  const navClass = (selected: boolean, collapsed = false) =>
    `group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-all duration-200 ${
      selected
        ? "bg-slate-950 text-white shadow-lg shadow-slate-900/10"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
    } ${collapsed ? "justify-center" : ""}`;

  function renderNavGroup(
    title: string,
    items: readonly { label: string; icon: typeof LayoutDashboard }[],
  ) {
    return (
      <div className="mb-6">
        {!sidebarCollapsed && (
<<<<<<< HEAD
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {title}
          </p>
=======
          <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">{title}</p>
>>>>>>> 5095110c003cc39fcdb7e559c7dbc06833130cf1
        )}
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const selected = active === item.label;
            return (
              <button key={item.label} type="button"
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => navigate(item.label as PageKey)}
<<<<<<< HEAD
                aria-current={selected ? "page" : undefined}
                className={navClass(selected, sidebarCollapsed)}>
                {selected && <span className="absolute -left-3 h-6 w-1 rounded-r-full bg-indigo-500" />}
                <Icon size={17} strokeWidth={selected ? 2.3 : 1.8} />
=======
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  selected ? "bg-white text-slate-950 shadow-lg shadow-black/20" : "text-slate-400 hover:bg-white/[.07] hover:text-white"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <Icon size={17} strokeWidth={selected ? 2.2 : 1.9} />
>>>>>>> 5095110c003cc39fcdb7e559c7dbc06833130cf1
                {!sidebarCollapsed && <span className="flex-1">{item.label}</span>}
                {!sidebarCollapsed && selected && <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const sidebar = (
<<<<<<< HEAD
    <aside className={`flex h-full flex-col border-r border-slate-200/80 bg-white transition-[width] duration-300 ${sidebarCollapsed ? "w-[78px]" : "w-[270px]"}`}>
      <div className="border-b border-slate-100 px-4 py-5">
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : ""}`}>
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-lg font-black text-white shadow-lg shadow-slate-900/15">
            M<span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-indigo-400 ring-2 ring-slate-950" />
          </div>
          {!sidebarCollapsed && <div className="min-w-0 flex-1">
            <p className="text-[15px] font-black tracking-tight text-slate-950">MEO Commerce</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Commerce operating system</p>
          </div>}
          <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <div ref={storeRef} className="relative mt-5">
          <button type="button" title={sidebarCollapsed ? "Switch workspace" : undefined} onClick={() => setStoreOpen((v) => !v)}
            className={`flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2.5 text-left transition hover:border-slate-300 hover:bg-white ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70"><Store size={17} /></div>
            {!sidebarCollapsed && <>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-900">Global Ecommerce</p><p className="mt-0.5 text-[10px] text-slate-400">Main workspace</p></div>
              <ChevronDown size={15} className={`text-slate-400 transition ${storeOpen ? "rotate-180" : ""}`} />
            </>}
=======
    <aside className={`flex h-full flex-col border-r border-white/10 bg-[#0a0d12] text-white shadow-2xl shadow-slate-950/20 transition-[width] duration-200 ${sidebarCollapsed ? "w-[76px]" : "w-[284px]"}`}>
      <div className="border-b border-white/10 px-3 py-4">
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : "px-2"}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d8ff3e] text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(216,255,62,.18)]">M</div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black tracking-tight text-white">MEO Commerce</p>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Command center</p>
            </div>
          )}
          <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <div ref={storeRef} className="relative mt-4">
          <button
            type="button"
            title={sidebarCollapsed ? "Switch workspace" : undefined}
            onClick={() => setStoreOpen((value) => !value)}
            className={`flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[.055] p-2.5 text-left transition hover:bg-white/[.09] ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#d8ff3e]"><Store size={17} /></div>
            {!sidebarCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">Global Ecommerce</p>
                  <p className="truncate text-[11px] text-slate-500">Live operations</p>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition ${storeOpen ? "rotate-180" : ""}`} />
              </>
            )}
>>>>>>> 5095110c003cc39fcdb7e559c7dbc06833130cf1
          </button>

          {storeOpen && <div className={`absolute top-[calc(100%+8px)] z-[80] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10 ${sidebarCollapsed ? "left-14" : "left-0"}`}>
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspaces</p>
            <div className="rounded-xl bg-slate-50 p-2"><div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">G</div>
              <div className="min-w-0 flex-1"><p className="text-xs font-bold">Global Ecommerce</p><p className="text-[10px] text-slate-400">Current workspace</p></div>
              <Check size={15} className="text-emerald-600" />
            </div></div>
            <Link to="/nigeria-admin" onClick={() => setStoreOpen(false)} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">N</div>
              <span className="flex-1">Nigeria Ecommerce</span><ChevronRight size={15} className="text-slate-300" />
            </Link>
          </div>}
        </div>
      </div>

<<<<<<< HEAD
      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {renderNavGroup("Workspace", primaryNavigation.slice(0, 1))}

        <div className="mb-6">
          <button type="button" title={sidebarCollapsed ? "Store Management" : undefined}
            aria-expanded={storeManagementOpen}
            onClick={() => setStoreManagementOpen((v) => !v)}
            className={navClass(storeNavigation.some((item) => active === item.label), sidebarCollapsed)}>
            {storeNavigation.some((item) => active === item.label) && <span className="absolute -left-3 h-6 w-1 rounded-r-full bg-indigo-500" />}
            <Store size={17} />
            {!sidebarCollapsed && <><span className="flex-1">Store Management</span><ChevronDown size={15} className={`transition ${storeManagementOpen ? "rotate-180" : ""}`} /></>}
          </button>

          {storeManagementOpen && !sidebarCollapsed && <div className="ml-5 mt-2 space-y-1 border-l border-slate-200 pl-2">
            {storeNavigation.map((item) => {
              const Icon = item.icon;
              const selected = active === item.label;
              return <button key={item.label} type="button" onClick={() => navigate(item.label as PageKey)}
                aria-current={selected ? "page" : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all duration-200 ${
                  selected ? "bg-slate-950 text-white shadow-md shadow-slate-900/10" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                }`}>
                {selected && <span className="absolute -left-[13px] h-5 w-1 rounded-r-full bg-indigo-500" />}
                <Icon size={15} strokeWidth={selected ? 2.3 : 1.8} />
                <span className="flex-1">{item.label}</span>
                {selected && <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />}
              </button>;
            })}
          </div>}
        </div>

        {renderNavGroup("Sales", primaryNavigation.slice(1))}
        {renderNavGroup("Operations", operationsNavigation)}

        <div className="mb-5">
          <button type="button" title={sidebarCollapsed ? "Settings" : undefined}
            onClick={() => {
              if (active !== "Settings") {
                setActive("Settings");
                setSettingsSection("General");
                setSettingsOpen(true);
              } else {
                setSettingsOpen((v) => !v);
              }
            }}
            aria-current={active === "Settings" ? "page" : undefined}
            className={navClass(active === "Settings", sidebarCollapsed)}>
            {active === "Settings" && <span className="absolute -left-3 h-6 w-1 rounded-r-full bg-indigo-500" />}
            <Settings size={17} strokeWidth={active === "Settings" ? 2.3 : 1.8} />
            {!sidebarCollapsed && <>
              <span className="flex-1">Settings</span>
              <ChevronRight size={15} className={`transition ${settingsOpen ? "rotate-90" : ""}`} />
            </>}
          </button>

          {settingsOpen && !sidebarCollapsed && <div className="ml-5 mt-2 border-l border-slate-200 pl-2">
            {settingsNavigation.map((item) => {
              const selected = active === "Settings" && settingsSection === item.id;
              return <button key={item.id} type="button" onClick={() => navigateSetting(item.id)}
                aria-current={selected ? "page" : undefined}
                className={`group relative flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                  selected ? "bg-slate-950 text-white shadow-md shadow-slate-900/10" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                }`}>
                {selected && <span className="absolute -left-[13px] h-5 w-1 rounded-r-full bg-indigo-500" />}
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${selected ? "bg-indigo-300" : "bg-slate-300 group-hover:bg-slate-500"}`} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-xs font-semibold ${selected ? "text-white" : "text-slate-700"}`}>{item.label}</span>
                  <span className={`hidden text-[10px] leading-4 xl:block ${selected ? "text-slate-300" : "text-slate-400"}`}>{item.description}</span>
                </span>
              </button>;
            })}
          </div>}
        </div>
      </nav>

      <div className="border-t border-slate-100 p-3">
        <Link to="/admin/profile" className={`flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-slate-50 ${sidebarCollapsed ? "justify-center" : ""}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-xs font-black text-white">{initials}</div>
          {!sidebarCollapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-900">{profileName}</p><p className="mt-0.5 text-[10px] text-slate-400">Workspace administrator</p></div>}
          {!sidebarCollapsed && <ChevronDown size={14} className="text-slate-300" />}
=======
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5 [scrollbar-color:#334155_transparent]">
        {renderNavGroup("Sales", primaryNavigation)}
        {renderNavGroup("Operations", operationsNavigation)}
        {renderNavGroup("Online store", storeNavigation)}

        <div className="mb-4">
          <button
            type="button"
            title={sidebarCollapsed ? "Settings" : undefined}
            onClick={() => setSettingsOpen((value) => !value)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${active === "Settings" ? "bg-white text-slate-950" : "text-slate-400 hover:bg-white/[.07] hover:text-white"} ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <Settings size={17} />
            {!sidebarCollapsed && <><span className="flex-1">Settings</span><ChevronRight size={16} className={`transition ${settingsOpen ? "rotate-90" : ""}`} /></>}
          </button>

          {settingsOpen && !sidebarCollapsed && (
            <div className="ml-5 mt-1 border-l border-white/10 pl-2">
              {settingsNavigation.map((item) => {
                const selected = active === "Settings" && settingsSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateSetting(item.id)}
                    className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition ${selected ? "bg-white/10" : "hover:bg-white/[.05]"}`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${selected ? "bg-[#d8ff3e]" : "bg-slate-700 group-hover:bg-slate-500"}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-xs font-semibold ${selected ? "text-white" : "text-slate-400"}`}>{item.label}</span>
                      <span className="hidden text-[10px] leading-4 text-slate-600 xl:block">{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className={`mb-2 flex items-center gap-2 rounded-lg border border-emerald-400/10 bg-emerald-400/[.06] px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-emerald-300 ${sidebarCollapsed ? "justify-center px-1" : ""}`}><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />{!sidebarCollapsed && "Systems operational"}</div>
        <Link to="/admin/profile" className={`flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-white/[.06] ${sidebarCollapsed ? "justify-center" : ""}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black text-white">{initials}</div>
          {!sidebarCollapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{profileName}</p><p className="truncate text-[11px] text-slate-500">Store Owner</p></div>}
>>>>>>> 5095110c003cc39fcdb7e559c7dbc06833130cf1
        </Link>
      </div>
    </aside>
  );

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-[#f5f6fa] text-slate-950">
      {sidebarOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>{sidebar}</div>
=======
    <div className="min-h-screen bg-[#f3f4f6] text-slate-950">
      {sidebarOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className={`fixed inset-y-0 left-0 z-50 transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebar}
      </div>

      <div className={`min-h-screen transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[284px]"}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,.02)] backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button>

            <button type="button" onClick={() => setSidebarCollapsed((value) => !value)} className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:block" title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <Menu size={19} />
            </button>
>>>>>>> 5095110c003cc39fcdb7e559c7dbc06833130cf1

      <div className={`min-h-screen transition-[padding] duration-300 ${sidebarCollapsed ? "lg:pl-[78px]" : "lg:pl-[270px]"}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
          <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button>
            <button type="button" onClick={() => setSidebarCollapsed((v) => !v)} className="hidden rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 lg:block" title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}><Menu size={19} /></button>
            <div className="min-w-0 flex-1">
              <div className="hidden items-center gap-2 text-[11px] font-medium text-slate-400 sm:flex"><span>MEO Commerce</span><ChevronRight size={12} /><span>Global workspace</span><ChevronRight size={12} /><span className="font-bold text-slate-800">{active === "Settings" ? settingsNavigation.find((item) => item.id === settingsSection)?.label || "Settings" : active}</span></div>
              <h1 className="truncate text-sm font-bold sm:hidden">{active === "Settings" ? settingsNavigation.find((item) => item.id === settingsSection)?.label || "Settings" : active}</h1>
            </div>

            <button type="button" onClick={() => { setSearchOpen(true); window.setTimeout(() => searchRef.current?.focus(), 0); }} className="hidden min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white md:flex" title="Search (Ctrl K)">
              <Search size={15} /><span className="hidden lg:inline">Search anything</span><kbd className="ml-2 hidden items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 lg:inline-flex"><Command size={10} />K</kbd>
            </button>
            <button type="button" onClick={openAssistant} className="hidden min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 md:flex"><Sparkles size={15} /><span className="hidden lg:inline">Ask MEO AI</span></button>

            <div ref={notificationsRef} className="relative">
              <button type="button" onClick={() => setNotificationsOpen((v) => !v)} className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" aria-label="Notifications">
                <Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-500 ring-2 ring-white" />
              </button>
              {notificationsOpen && <div className="absolute right-0 top-[calc(100%+12px)] z-[100] w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><p className="text-sm font-bold">Notifications</p><p className="text-[11px] text-slate-400">Your latest store activity</p></div><button type="button" className="text-xs font-bold text-slate-400 hover:text-slate-900" onClick={() => setNotificationsOpen(false)}>Close</button></div>
                <div className="p-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-bold">You&apos;re all caught up</p><p className="mt-1 text-xs leading-5 text-slate-500">New order, payment and fulfillment notifications will appear here.</p></div></div>
              </div>}
            </div>

            <Link to="/store" target="_blank" className="hidden rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 sm:block" aria-label="View storefront"><ExternalLink size={18} /></Link>
            <div ref={profileRef} className="relative">
              <button type="button" onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2 transition hover:border-slate-300 hover:shadow-sm" aria-expanded={profileOpen}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-950 text-xs font-black text-white">{initials}</span><ChevronDown size={14} className={`hidden text-slate-400 transition sm:block ${profileOpen ? "rotate-180" : ""}`} />
              </button>
              {profileOpen && <div className="absolute right-0 top-[calc(100%+12px)] z-[100] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
                <div className="border-b border-slate-100 px-3 py-3"><p className="text-sm font-bold">{profileName}</p><p className="mt-1 text-xs text-slate-400">Store Owner · Administrator</p></div>
                <Link to="/admin/profile" onClick={() => setProfileOpen(false)} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"><User size={16} />Profile</Link>
                <button type="button" onClick={() => { setProfileOpen(false); navigate("Settings"); navigateSetting("General"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"><Settings size={16} />Settings</button>
                <button type="button" onClick={() => { setProfileOpen(false); openAssistant(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"><Sparkles size={16} />MEO AI</button>
                <Link to="/store" target="_blank" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"><ExternalLink size={16} />View storefront</Link>
                <div className="my-1 border-t border-slate-100" />
                <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut size={16} />Sign out</button>
              </div>}
            </div>
          </div>

          {searchOpen && <div className="border-t border-slate-100 px-4 py-3 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/5">
                <Search size={17} className="text-slate-400" />
                <input ref={searchRef} autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search pages, products, orders, settings…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                <button type="button" onClick={() => { setSearch(""); setSearchOpen(false); }} className="rounded-lg px-2 py-1 text-xs font-bold text-slate-400 hover:bg-slate-100">Esc</button>
              </div>
              {search.trim() && <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {filteredSearch.length ? filteredSearch.map((item) => <button key={item.label} type="button" onClick={() => navigate(item.label)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"><Search size={14} className="text-slate-400" /><span className="flex-1 text-sm font-semibold">{item.label}</span><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.group}</span></button>) : <div className="px-3 py-4 text-center text-sm text-slate-500">No admin page found.</div>}
              </div>}
            </div>
          </div>}
        </header>

<<<<<<< HEAD
        <main className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6 lg:px-9 lg:py-8">{renderPage()}</main>
        <footer className="flex flex-col gap-2 border-t border-slate-200/70 px-6 py-4 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-9">
          <span>© {new Date().getFullYear()} MEO Commerce. Your business, in focus.</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={13} />Private workspace</span>
        </footer>
=======
        <main className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 lg:px-9 lg:py-9">{renderPage()}</main>
>>>>>>> 5095110c003cc39fcdb7e559c7dbc06833130cf1
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
  const currency = (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
<<<<<<< HEAD
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[28px] bg-slate-950 px-6 py-7 text-white shadow-xl shadow-slate-900/10 sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300"><Activity size={13} className="text-emerald-400" />Workspace overview</div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Your business, in focus.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">A clear view of your store performance, business health and global activity — all in one place.</p>
          </div>
          <Link to="/store" target="_blank" className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-indigo-50"><ExternalLink size={16} />View storefront<ArrowUpRight size={15} /></Link>
        </div>
        <div className="relative mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-5 text-xs text-slate-400">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" />Global workspace</span>
          <span className="flex items-center gap-2"><ShieldCheck size={14} />Business health connected to your data</span>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div><h2 className="text-sm font-bold text-slate-900">Performance snapshot</h2><p className="mt-1 text-xs text-slate-500">Current reporting period · 30 days</p></div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Live data</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat title="30-day sales" value={currency(revenue)} icon={CreditCard} accent="indigo" description="Revenue recorded for this period" />
          <Stat title="Orders" value={orders.toLocaleString()} icon={ShoppingCart} accent="blue" description="Orders in the reporting period" />
          <Stat title="Profit" value={currency(profit)} icon={BarChart3} accent="emerald" description="Calculated business profit" />
          <Stat title="Profit margin" value={`${margin.toFixed(2)}%`} icon={Activity} accent="violet" description="Profit relative to revenue" />
        </div>
      </section>
=======
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400"><ShieldCheck size={14} className="text-emerald-600" /> Operations overview</div><h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Commerce command center</h1><p className="mt-2 text-sm text-slate-500">Live commercial health, orders, profit and storefront operations.</p></div>
        <Link to="/store" target="_blank" className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-slate-50"><ExternalLink size={16} /> View store</Link>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Gross sales · 30 days" value={`$${revenue.toFixed(2)}`} detail="Confirmed order revenue" />
        <Stat title="Orders processed" value={orders.toString()} detail="Current reporting period" />
        <Stat title="Net operating profit" value={`$${profit.toFixed(2)}`} detail="After recorded product costs" />
        <Stat title="Profit margin" value={`${margin.toFixed(2)}%`} detail="Blended across confirmed sales" />
      </div>
>>>>>>> 5095110c003cc39fcdb7e559c7dbc06833130cf1

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><strong className="font-bold">Business health unavailable.</strong><p className="mt-1">{error}</p></div>}

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-base font-bold tracking-tight">Business performance</h2><p className="mt-1 text-xs text-slate-500">Revenue and profitability from your connected business data.</p></div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500"><Activity size={14} />Performance analytics</span>
        </div>
        {loading ? <div className="flex h-[360px] animate-pulse items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">Loading business performance…</div> : businessHealth ? <BusinessHealthChart data={businessHealth} /> : <div className="flex h-48 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">Business performance data is not available.</div>}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="flex items-center gap-2"><Globe2 size={17} className="text-indigo-600" /><h2 className="text-base font-bold tracking-tight">Global visitor activity</h2></div><p className="mt-1 text-xs text-slate-500">Approximate visitor locations based on network location data.</p></div>
          <span className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">Visitor map</span>
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"><WorldGlobe /></div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-base font-bold tracking-tight">Business health</h2><p className="mt-1 text-xs leading-5 text-slate-500">Calculated from confirmed business orders.</p></div><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><Activity size={18} /></span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <BusinessMetric label="Business status" value={businessHealth?.businessStatus === "profitable" ? "Profitable" : businessHealth?.businessStatus === "loss" ? "Loss" : "Break-even"} />
            <BusinessMetric label="Profit trend" value={businessHealth?.profitTrend === "up" ? "Trending up" : businessHealth?.profitTrend === "down" ? "Trending down" : "Stable"} />
            <BusinessMetric label="Healthy products" value={businessHealth?.healthyProducts.toString() ?? "0"} />
            <BusinessMetric label="Low-margin products" value={businessHealth?.lowMarginProducts.toString() ?? "0"} />
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
          <div className="flex items-start justify-between"><div><h2 className="text-base font-bold tracking-tight">Order status</h2><p className="mt-1 text-xs text-slate-500">Status counters</p></div><span className="rounded-xl bg-slate-100 p-2.5 text-slate-600"><PackageCheck size={18} /></span></div>
          <div className="mt-5 space-y-1">
            <Status label="Payment pending" /><Status label="Settlement pending" /><Status label="Ready to fulfill" /><Status label="Shipped" /><Status label="Delivered" />
          </div>
          <p className="mt-3 text-[10px] leading-4 text-slate-400">Order-status counts will update when connected to the relevant order data.</p>
        </div>
      </section>
    </div>
  );
}

<<<<<<< HEAD
function Stat({
  title, value, icon: Icon, accent, description,
}: {
  title: string;
  value: string;
  icon: typeof CreditCard;
  accent: "indigo" | "blue" | "emerald" | "violet";
  description: string;
}) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    blue: "bg-sky-50 text-sky-600 ring-sky-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
  }[accent];

  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/[0.04]">
      <div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold text-slate-500">{title}</p><span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${styles}`}><Icon size={18} /></span></div>
      <p className="mt-5 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-[28px]">{value}</p>
      <p className="mt-2 text-[11px] leading-5 text-slate-400">{description}</p>
    </div>
  );
}

function BusinessMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-slate-200 hover:bg-white"><p className="text-[11px] font-semibold text-slate-500">{label}</p><p className="mt-2 text-lg font-bold tracking-tight text-slate-950">{value}</p></div>;
}

function Status({ label }: { label: string }) {
  return <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm last:border-0"><span className="text-xs font-medium text-slate-600">{label}</span><span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold tabular-nums text-slate-600">0</span></div>;
}
=======
function Stat({ title, value, detail }: { title: string; value: string; detail: string }) { return <div className="admin-panel group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"><div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-slate-950 via-slate-600 to-transparent opacity-70" /><div className="flex items-start justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[.12em] text-slate-400">{title}</p><span className="h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-50" /></div><p className="mt-5 text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</p><p className="mt-2 text-xs text-slate-400">{detail}</p></div>; }
function BusinessMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-lg font-bold text-slate-950">{value}</p></div>; }
function Status({ label }: { label: string }) { return <div className="flex justify-between border-b border-slate-100 pb-3 text-sm"><span className="text-slate-600">{label}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">0</span></div>; }
>>>>>>> 5095110c003cc39fcdb7e559c7dbc06833130cf1
