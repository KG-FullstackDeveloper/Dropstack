import {
  BarChart3,
  Bell,
  Box,
  ChevronDown,
  ChevronLeft,
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
import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { Link, useLocation } from "react-router-dom";
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

type IconType = ComponentType<{
  size?: number;
  className?: string;
  strokeWidth?: number;
}>;

interface NavigationItem {
  label: AdminPageKey;
  icon: IconType;
}

interface SettingsItem {
  id: SettingsSection;
  label: string;
  description: string;
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

const salesNavigation: NavigationItem[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Orders", icon: ShoppingCart },
  { label: "Products", icon: Package },
  { label: "Customers", icon: Users },
  { label: "Inventory", icon: Box },
  { label: "Analytics", icon: BarChart3 },
];

const operationsNavigation: NavigationItem[] = [
  { label: "Fulfillment", icon: PackageCheck },
  { label: "Shipping", icon: Truck },
  { label: "Payments", icon: CreditCard },
];

const storeNavigation: NavigationItem[] = [
  { label: "Stores", icon: Store },
  { label: "Storefront", icon: ExternalLink },
  { label: "Theme Editor", icon: Palette },
];

const settingsNavigation: SettingsItem[] = [
  {
    id: "General",
    label: "General",
    description: "Store information and preferences",
  },
  {
    id: "Checkout",
    label: "Checkout",
    description: "Checkout and customer experience",
  },
  {
    id: "Shipping",
    label: "Shipping & delivery",
    description: "Shipping zones and delivery",
  },
  {
    id: "Taxes",
    label: "Taxes",
    description: "Tax and pricing configuration",
  },
  {
    id: "Policies",
    label: "Policies",
    description: "Refund, return and store policies",
  },
  {
    id: "Payments",
    label: "Payments",
    description: "Payment configuration",
  },
  {
    id: "Account",
    label: "Profile",
    description: "Owner and account information",
  },
  {
    id: "Security",
    label: "Security",
    description: "Password and account security",
  },
  {
    id: "Users",
    label: "Staff & permissions",
    description: "Team access and permissions",
  },
  {
    id: "Notifications",
    label: "Notifications",
    description: "Order and customer notifications",
  },
  {
    id: "Domains",
    label: "Domains",
    description: "Store URL and domain configuration",
  },
  {
    id: "Storefront",
    label: "Storefront",
    description: "Online store preferences",
  },
  {
    id: "Privacy",
    label: "Privacy",
    description: "Privacy and customer data",
  },
  {
    id: "Data",
    label: "Data & exports",
    description: "Store data and exports",
  },
  {
    id: "Integrations",
    label: "Integrations",
    description: "Connected services and tools",
  },
  {
    id: "Advanced",
    label: "Store status",
    description: "Availability and advanced controls",
  },
];

const searchablePages: AdminPageKey[] = [
  ...salesNavigation.map((item) => item.label),
  ...operationsNavigation.map((item) => item.label),
  ...storeNavigation.map((item) => item.label),
  "Settings",
];

function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "SO";
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
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(active === "Settings");
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const isNigeria = workspace === "nigeria";

  const workspaceName = isNigeria
    ? "Nigeria Ecommerce"
    : "Global Ecommerce";

  const workspaceDescription = isNigeria
    ? "Nigeria operations"
    : "Global operations";

  const storefrontPath = isNigeria
    ? "/nigeria-store"
    : "/store";

  const profilePath = isNigeria
    ? "/nigeria-admin/profile"
    : "/admin/profile";

  const otherWorkspacePath = isNigeria
    ? "/admin"
    : "/nigeria-admin";

  const otherWorkspaceName = isNigeria
    ? "Global Ecommerce"
    : "Nigeria Ecommerce";

  const initials = useMemo(
    () => getInitials(profileName),
    [profileName],
  );

  const filteredSearch = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return searchablePages.filter((item) =>
      item.toLowerCase().includes(query),
    );
  }, [search]);

  useEffect(() => {
    if (active === "Settings") {
      setSettingsOpen(true);
    }
  }, [active]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      const modifier = event.ctrlKey || event.metaKey;

      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setSearch("");
        setProfileOpen(false);
        setSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  useEffect(() => {
    function handleAssistantRequest() {
      window.dispatchEvent(
        new CustomEvent("meo:open-assistant", {
          detail: {
            workspace,
            currentPage: active,
            pathname: location.pathname,
          },
        }),
      );
    }

    window.addEventListener(
      "meo:open-assistant-request",
      handleAssistantRequest,
    );

    return () => {
      window.removeEventListener(
        "meo:open-assistant-request",
        handleAssistantRequest,
      );
    };
  }, [active, location.pathname, workspace]);

  function navigate(page: AdminPageKey) {
    onNavigate(page);

    setSidebarOpen(false);
    setProfileOpen(false);

    if (page === "Settings") {
      setSettingsOpen(true);
    }
  }

  function navigateToSettings(section: SettingsSection) {
    onSettingsSectionChange(section);
    onNavigate("Settings");

    setSettingsOpen(true);
    setSidebarOpen(false);
    setProfileOpen(false);
  }

  function openAssistant() {
    window.dispatchEvent(
      new CustomEvent("meo:open-assistant", {
        detail: {
          workspace,
          currentPage: active,
          pathname: location.pathname,
        },
      }),
    );
  }

  function renderNavigationGroup(
    title: string,
    items: NavigationItem[],
  ) {
    return (
      <div className="mb-6">
        {!sidebarCollapsed && (
          <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            {title}
          </p>
        )}

        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const selected = active === item.label;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.label)}
                title={sidebarCollapsed ? item.label : undefined}
                className={[
                  "group flex w-full items-center rounded-xl transition",
                  sidebarCollapsed
                    ? "justify-center px-2 py-3"
                    : "gap-3 px-3 py-2.5",
                  selected
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                ].join(" ")}
              >
                <Icon
                  size={18}
                  strokeWidth={selected ? 2.25 : 1.9}
                  className={
                    selected
                      ? "text-white"
                      : "text-slate-400 group-hover:text-slate-700"
                  }
                />

                {!sidebarCollapsed && (
                  <span className="flex-1 text-left text-sm font-semibold">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6f7] text-slate-950">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-200",
          sidebarCollapsed ? "w-[76px]" : "w-[276px]",
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="border-b border-slate-200 px-3 py-4">
          <div
            className={[
              "flex items-center",
              sidebarCollapsed
                ? "justify-center"
                : "gap-3 px-2",
            ].join(" ")}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
              M
            </div>

            {!sidebarCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black tracking-tight text-slate-950">
                    MEO Commerce
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Admin workspace
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
              </>
            )}
          </div>

          <div className="mt-4">
            <Link
              to={otherWorkspacePath}
              className={[
                "flex items-center rounded-xl border border-slate-200 bg-slate-50 transition hover:bg-slate-100",
                sidebarCollapsed
                  ? "justify-center p-2.5"
                  : "gap-3 p-2.5",
              ].join(" ")}
              title={
                sidebarCollapsed
                  ? `Switch to ${otherWorkspaceName}`
                  : undefined
              }
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-900 shadow-sm">
                <Store size={17} />
              </div>

              {!sidebarCollapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {workspaceName}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {workspaceDescription}
                    </p>
                  </div>

                  <ChevronRight
                    size={15}
                    className="text-slate-400"
                  />
                </>
              )}
            </Link>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          {renderNavigationGroup(
            "Sales",
            salesNavigation,
          )}

          {renderNavigationGroup(
            "Operations",
            operationsNavigation,
          )}

          {renderNavigationGroup(
            "Online store",
            storeNavigation,
          )}

          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                setSettingsOpen((value) => !value);
                onNavigate("Settings");
              }}
              title={sidebarCollapsed ? "Settings" : undefined}
              className={[
                "group flex w-full items-center rounded-xl transition",
                sidebarCollapsed
                  ? "justify-center px-2 py-3"
                  : "gap-3 px-3 py-2.5",
                active === "Settings"
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              ].join(" ")}
            >
              <Settings
                size={18}
                strokeWidth={active === "Settings" ? 2.25 : 1.9}
              />

              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left text-sm font-semibold">
                    Settings
                  </span>

                  <ChevronRight
                    size={16}
                    className={[
                      "transition-transform",
                      settingsOpen ? "rotate-90" : "",
                    ].join(" ")}
                  />
                </>
              )}
            </button>

            {!sidebarCollapsed && settingsOpen && (
              <div className="ml-5 mt-2 border-l border-slate-200 pl-2">
                {settingsNavigation.map((item) => {
                  const selected =
                    active === "Settings" &&
                    settingsSection === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        navigateToSettings(item.id)
                      }
                      className={[
                        "group flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition",
                        selected
                          ? "bg-slate-50"
                          : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                          selected
                            ? "bg-slate-950"
                            : "bg-slate-300 group-hover:bg-slate-500",
                        ].join(" ")}
                      />

                      <span className="min-w-0 flex-1">
                        <span
                          className={[
                            "block text-xs font-semibold",
                            selected
                              ? "text-slate-950"
                              : "text-slate-700",
                          ].join(" ")}
                        >
                          {item.label}
                        </span>

                        <span className="mt-0.5 block text-[10px] leading-4 text-slate-400">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="border-t border-slate-200 p-3">
          <Link
            to={profilePath}
            className={[
              "flex items-center rounded-xl transition hover:bg-slate-50",
              sidebarCollapsed
                ? "justify-center p-2"
                : "gap-3 p-2.5",
            ].join(" ")}
            title={sidebarCollapsed ? "Profile" : undefined}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
              {initials}
            </div>

            {!sidebarCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {profileName}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    Store Owner
                  </p>
                </div>

                <User
                  size={16}
                  className="text-slate-400"
                />
              </>
            )}
          </Link>
        </div>
      </aside>

      <div
        className={[
          "min-h-screen transition-[padding] duration-200",
          sidebarCollapsed
            ? "lg:pl-[76px]"
            : "lg:pl-[276px]",
        ].join(" ")}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            <button
              type="button"
              onClick={() =>
                setSidebarCollapsed(
                  (value) => !value,
                )
              }
              className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950 lg:block"
              aria-label={
                sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              title={
                sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
            >
              {sidebarCollapsed ? (
                <ChevronRight size={19} />
              ) : (
                <ChevronLeft size={19} />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
                <span>{workspaceName}</span>
                <ChevronRight size={13} />
                <span className="font-semibold text-slate-700">
                  {active}
                </span>
              </div>

              <h1 className="truncate text-sm font-bold sm:hidden">
                {active}
              </h1>
            </div>

            <div className="hidden items-center gap-1 md:flex">
              <button
                type="button"
                onClick={() =>
                  setSearchOpen(
                    (value) => !value,
                  )
                }
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                aria-label="Search"
              >
                <Search size={18} />
                <span className="hidden lg:inline text-xs font-semibold">
                  Search
                </span>
                <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 lg:inline">
                  Ctrl K
                </kbd>
              </button>

              <button
                type="button"
                onClick={openAssistant}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                <MessageCircle size={17} />
                <span className="hidden lg:inline">
                  MEO AI
                </span>
              </button>

              <button
                type="button"
                className="relative rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-slate-950" />
              </button>

              <Link
                to={storefrontPath}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                aria-label="View storefront"
                title="View storefront"
              >
                <ExternalLink size={18} />
              </Link>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setProfileOpen(
                    (value) => !value,
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2 hover:bg-slate-50"
                aria-expanded={profileOpen}
                aria-label="Open account menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-white">
                  {initials}
                </span>

                <ChevronDown
                  size={15}
                  className={[
                    "hidden text-slate-400 transition-transform sm:block",
                    profileOpen
                      ? "rotate-180"
                      : "",
                  ].join(" ")}
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                  <div className="border-b border-slate-100 px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">
                          {profileName}
                        </p>

                        <p className="truncate text-xs text-slate-400">
                          Store Owner · Administrator
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Link
                      to={profilePath}
                      onClick={() =>
                        setProfileOpen(false)
                      }
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <User size={17} />
                      Profile
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        navigateToSettings(
                          "General",
                        );
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Settings size={17} />
                      Settings
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigateToSettings(
                          "Security",
                        );
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <ShieldCheck size={17} />
                      Security
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {searchOpen && (
            <div className="border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
              <div className="mx-auto max-w-3xl">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <Search
                    size={17}
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    autoFocus
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search products, orders, customers, settings..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSearchOpen(false);
                    }}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-white hover:text-slate-700"
                  >
                    Esc
                  </button>
                </div>

                {search.trim() && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    {filteredSearch.length > 0 ? (
                      filteredSearch.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            navigate(item);
                            setSearch("");
                            setSearchOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Search
                            size={15}
                            className="text-slate-400"
                          />
                          {item}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-5 text-center">
                        <p className="text-sm font-semibold text-slate-700">
                          No results
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Try another search term.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}