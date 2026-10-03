import {
  BarChart3,
  Box,
  ChevronDown,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Package,
  PackageCheck,
  Palette,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  User,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type DashboardNavigationKey =
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

interface DashboardNavigationProps {
  activePage: DashboardNavigationKey;
  onNavigate: (page: DashboardNavigationKey) => void;
  workspaceName: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

type NavigationItem = {
  label: DashboardNavigationKey;
  icon: typeof LayoutDashboard;
};

const commerceItems: NavigationItem[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Stores", icon: Store },
  { label: "Orders", icon: ShoppingCart },
  { label: "Fulfillment", icon: PackageCheck },
  { label: "Products", icon: Package },
  { label: "Customers", icon: Users },
  { label: "Analytics", icon: BarChart3 },
  { label: "Payments", icon: CreditCard },
  { label: "Shipping", icon: Truck },
];

const storeItems: NavigationItem[] = [
  { label: "Storefront", icon: Store },
  { label: "Theme Editor", icon: Palette },
  { label: "Inventory", icon: Box },
];

const systemItems: NavigationItem[] = [
  { label: "Settings", icon: Settings },
];

export default function DashboardNavigation({
  activePage,
  onNavigate,
  workspaceName,
  mobileOpen = false,
  onMobileClose,
}: DashboardNavigationProps) {
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        onMobileClose?.();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onMobileClose]);

  const navigate = (page: DashboardNavigationKey) => {
    onNavigate(page);
    onMobileClose?.();
  };

  const renderGroup = (
    title: string,
    items: NavigationItem[]
  ) => (
    <div className="mb-6">
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.label;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.label)}
              className={[
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.2 : 1.9}
                className={
                  active
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-600"
                }
              />

              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const sidebar = (
    <aside className="flex h-full w-[268px] flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-lg font-black tracking-tight text-slate-900">
          MEO Commerce
        </p>

        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
            {workspaceName.slice(0, 1).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-900">
              {workspaceName}
            </p>

            <p className="text-[11px] text-slate-500">
              Ecommerce workspace
            </p>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        {renderGroup("Commerce", commerceItems)}
        {renderGroup("Store", storeItems)}
        {renderGroup("System", systemItems)}
      </nav>

      <div
        ref={accountRef}
        className="relative border-t border-slate-200 p-3"
      >
        {accountOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-3 right-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-slate-900">
                Store Owner
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Administrator
              </p>
            </div>

            <div className="p-1.5">
              <button
                type="button"
                onClick={() => setAccountOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <User size={17} />
                Profile
              </button>

              <button
                type="button"
                onClick={() => navigate("Settings")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Settings size={17} />
                Account settings
              </button>

              <button
                type="button"
                onClick={() => setAccountOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <ShieldCheck size={17} />
                Security
              </button>

              <button
                type="button"
                onClick={() => setAccountOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <KeyRound size={17} />
                Password & access
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={() => setAccountOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setAccountOpen((value) => !value)}
          className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            M
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              Store Owner
            </p>

            <p className="truncate text-xs text-slate-500">
              Administrator
            </p>
          </div>

          <ChevronDown
            size={17}
            className={[
              "shrink-0 text-slate-400 transition",
              accountOpen ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden h-screen shrink-0 lg:block">
        {sidebar}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onMobileClose}
            className="absolute inset-0 bg-slate-950/40"
          />

          <div className="relative h-full w-[285px] max-w-[88vw] shadow-2xl">
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}