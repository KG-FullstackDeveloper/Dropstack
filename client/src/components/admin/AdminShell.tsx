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
  Store,
  Truck,
  User,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { SettingsSection } from "../settings/DashboardSettingsTypes";

export type AdminPageKey =
  | "Overview"
  | "Stores"
  | "Orders"
  | "Fulfillment"
  | "Products"
  | "Customers"
  | "Analytics"
  | "Payments"
  | "Shipping"
  | "Inventory"
  | "Storefront"
  | "Theme Editor"
  | "Settings";

export type AdminWorkspace = "global" | "nigeria";

type IconType = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

const primaryNavigation: { label: AdminPageKey; icon: IconType }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Orders", icon: ShoppingCartIcon },
  { label: "Products", icon: Package },
  { label: "Customers", icon: Users },
  { label: "Inventory", icon: Box },
  { label: "Analytics", icon: BarChart3 },
];

const operationsNavigation: { label: AdminPageKey; icon: IconType }[] = [
  { label: "Fulfillment", icon: PackageCheck },
  { label: "Shipping", icon: Truck },
  { label: "Payments", icon: CreditCard },
];

const storeNavigation: { label: AdminPageKey; icon: IconType }[] = [
  { label: "Stores", icon: Store },
  { label: "Storefront", icon: ExternalLink },
  { label: "Theme Editor", icon: Palette },
];

const settingsNavigation: { id: SettingsSection; label: string; description: string }[] = [
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

function ShoppingCartIcon(props: { size?: number; className?: string; strokeWidth?: number }) {
  return <ShoppingCart {...props} />;
}

function ShoppingCart(props: { size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth ?? 2} width={props.size ?? 24} height={props.size ?? 24} className={props.className} aria-hidden="true">
      <circle cx="9" cy="20" r="1" />
      <circle cx="19" cy="20" r="1" />
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6" />
    </svg>
  );
}

interface AdminShellProps {
  workspace: AdminWorkspace;
  active: AdminPageKey;
  onNavigate: (page: AdminPageKey) => void;
  settingsSection: SettingsSection;
  onSettingsSectionChange: (section: SettingsSection) => void;
  profileName?: string;
  children: ReactNode;
}

export default function AdminShell({
  workspace,
  active,
  onNavigate,
  settingsSection,
  onSettingsSectionChange,
  profileName = "Store Owner",
  children,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(active === "Settings");
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const workspaceName = workspace === "nigeria" ? "Nigeria Ecommerce" : "Global Ecommerce";
  const storefrontPath = workspace === "nigeria" ? "/nigeria-store" : "/store";
  const profilePath = workspace === "nigeria" ? "/nigeria-admin/profile" : "/admin/profile";

  const initials = useMemo(
    () => profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "SO",
    [profileName],
  );

  const allSearchItems = useMemo(
    () => [...primaryNavigation, ...operationsNavigation, ...storeNavigation].map((item) => item.label).concat("Settings"),
    [],
  );

  const filteredSearch = allSearchItems.filter((item) => item.toLowerCase().includes(search.trim().toLowerCase()));

  function navigate(page: AdminPageKey) {
    onNavigate(page);
    setSidebarOpen(false);
    setProfileOpen(false);
    if (page === "Settings") setSettingsOpen(true);
    else setSettingsOpen(false);
  }

  function openAssistant() {
    window.dispatchEvent(new CustomEvent("meo:open-assistant", { detail: { workspace } }));
  }

  function renderNavGroup(title: string, items: { label: AdminPageKey; icon: IconType }[]) {
    return (
      <div className="mb-6">
        <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</p>
        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const selected = active === item.label;
            return (
              <button key={item.label} type="button" onClick={() => navigate(item.label)} className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${selected ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
                <Icon size={17} strokeWidth={selected ? 2.2 : 1.9} />
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6f7] text-slate-950">
      {sidebarOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
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
              <p className="truncate text-[11px] text-slate-500">{workspaceName}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          {renderNavGroup("Sales", primaryNavigation)}
          {renderNavGroup("Operations", operationsNavigation)}
          {renderNavGroup("Online store", storeNavigation)}

          <div className="mb-3">
            <button type="button" onClick={() => { setSettingsOpen((value) => !value); onNavigate("Settings"); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${active === "Settings" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
              <Settings size={17} />
              <span className="flex-1">Settings</span>
              <ChevronRight size={16} className={`transition ${settingsOpen ? "rotate-90" : ""}`} />
            </button>

            {settingsOpen && (
              <div className="ml-5 mt-1 border-l border-slate-200 pl-2">
                {settingsNavigation.map((item, index) => (
                  <button key={item.id} type="button" onClick={() => { onSettingsSectionChange(item.id); onNavigate("Settings"); setSidebarOpen(false); }} className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${settingsSection === item.id && active === "Settings" ? "bg-slate-50" : "hover:bg-slate-50"}`}>
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
          <Link to={profilePath} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900">{profileName}</p>
              <p className="truncate text-[11px] text-slate-400">Store Owner</p>
            </div>
            <User size={16} className="text-slate-400" />
          </Link>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[276px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button>
            <div className="min-w-0 flex-1">
              <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex"><span>{workspaceName}</span><ChevronRight size={13} /><span className="font-semibold text-slate-600">{active}</span></div>
              <h1 className="truncate text-sm font-bold sm:hidden">{active}</h1>
            </div>

            <div className="hidden items-center gap-1 md:flex">
              <button type="button" onClick={() => setSearchOpen((value) => !value)} className="rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Search"><Search size={18} /></button>
              <button type="button" onClick={openAssistant} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"><MessageCircle size={17} /> AI assistant</button>
              <button type="button" className="relative rounded-lg p-2.5 text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-slate-900" /></button>
              <Link to={storefrontPath} target="_blank" className="rounded-lg p-2.5 text-slate-500 hover:bg-slate-100" aria-label="View storefront"><ExternalLink size={18} /></Link>
            </div>

            <div className="relative">
              <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2 hover:bg-slate-50" aria-expanded={profileOpen}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-white">{initials}</span>
                <ChevronDown size={15} className={`hidden text-slate-400 sm:block ${profileOpen ? "rotate-180" : ""}`} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                  <div className="border-b border-slate-100 px-3 py-3"><p className="text-sm font-bold">{profileName}</p><p className="mt-0.5 text-xs text-slate-400">Store Owner · Administrator</p></div>
                  <Link to={profilePath} onClick={() => setProfileOpen(false)} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><User size={17} /> Profile</Link>
                  <button type="button" onClick={() => { onNavigate("Settings"); setSettingsOpen(true); onSettingsSectionChange("General"); setProfileOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"><Settings size={17} /> Settings</button>
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
              {search.trim() && <div className="mx-auto mt-2 max-w-3xl rounded-xl border border-slate-200 bg-white p-2 shadow-sm">{filteredSearch.map((item) => <button key={item} type="button" onClick={() => { navigate(item as AdminPageKey); setSearchOpen(false); setSearch(""); }} className="flex w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50">{item}</button>)}</div>}
            </div>
          )}
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
