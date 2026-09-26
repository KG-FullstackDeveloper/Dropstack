import {
BarChart3,
Bell,
Box,
ChevronDown,
CreditCard,
LayoutDashboard,
Menu,
Package,
Settings,
ShoppingCart,
Store,
Truck,
Users,
X,
} from "lucide-react";
import { useEffect, useState } from "react";

import Orders from "./admin/Orders";
import Products from "./admin/Products";
import Analytics from "./admin/Analytics";
import Payments from "./admin/Payments";
import Shipping from "./admin/Shipping";
import SettingsPage from "./admin/Settings";
import Customers from "./admin/Customers";
import Inventory from "./admin/Inventory";
import Storefront from "./admin/Storefront";

import BusinessHealthChart from "../components/admin/BusinessHealthChart";
import WorldGlobe from "../components/admin/WorldGlobe";

import { getBusinessHealth } from "../services/businessHealth";
import type { BusinessHealth } from "../types/businessHealth";

const navigation = [
{ label: "Overview", icon: LayoutDashboard },
{ label: "Orders", icon: ShoppingCart },
{ label: "Products", icon: Package },
{ label: "Customers", icon: Users },
{ label: "Analytics", icon: BarChart3 },
{ label: "Payments", icon: CreditCard },
{ label: "Shipping", icon: Truck },
];

export default function Admin() {
const [sidebarOpen, setSidebarOpen] = useState(false);
const [active, setActive] = useState("Overview");

function renderPage() {
switch (active) {
case "Orders":
return <Orders />;

  case "Products":
    return <Products />;

  case "Customers":
    return <Customers />;

  case "Analytics":
    return <Analytics />;

  case "Payments":
    return <Payments />;

  case "Shipping":
    return <Shipping />;

  case "Inventory":
    return <Inventory />;

  case "Storefront":
    return <Storefront />;

  case "Settings":
    return <SettingsPage />;

  default:
    return <Overview />;
}

}

return ( <div className="min-h-screen bg-slate-50">
{sidebarOpen && (
<div
className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
onClick={() => setSidebarOpen(false)}
/>
)}

  <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:hidden">
    <button
      type="button"
      onClick={() => setSidebarOpen(true)}
      aria-label="Open navigation"
    >
      <Menu size={22} />
    </button>

    <strong>MEO Store</strong>

    <Bell size={20} />
  </header>

  <aside
    className={`fixed bottom-0 left-0 top-0 z-50 w-64 border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center justify-between border-b px-6">
        <div>
          <h1 className="font-bold text-slate-950">
            MEO Store
          </h1>

          <p className="text-xs text-slate-500">
            Admin dashboard
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden"
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
      </div>

      <div className="border-b p-4">
        <div className="flex items-center gap-3 rounded-xl border p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Store size={17} />
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold">
              My Store
            </p>

            <p className="text-xs text-slate-500">
              Online store
            </p>
          </div>

          <ChevronDown size={16} />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Management
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const selected = active === item.label;

            return (
              <button
                type="button"
                key={item.label}
                onClick={() => {
                  setActive(item.label);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  selected
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </div>

        <p className="mb-3 mt-8 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Store
        </p>

        <button
          type="button"
          onClick={() => {
            setActive("Storefront");
            setSidebarOpen(false);
          }}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
            active === "Storefront"
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Store size={18} />
          Storefront
        </button>

        <button
          type="button"
          onClick={() => {
            setActive("Inventory");
            setSidebarOpen(false);
          }}
          className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
            active === "Inventory"
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Box size={18} />
          Inventory
        </button>
      </nav>

      <div className="border-t p-4">
        <button
          type="button"
          onClick={() => {
            setActive("Settings");
            setSidebarOpen(false);
          }}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
            active === "Settings"
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Settings size={18} />
          Settings
        </button>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
            M
          </div>

          <div>
            <p className="text-sm font-semibold">
              Store Owner
            </p>

            <p className="text-xs text-slate-500">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <main className="min-h-screen lg:ml-64">
    <header className="hidden h-20 items-center justify-between border-b bg-white px-8 lg:flex">
      <div>
        <h2 className="text-xl font-bold">
          {active}
        </h2>

        <p className="text-sm text-slate-500">
          Manage your ecommerce business
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Bell size={19} />

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
            M
          </div>

          <div>
            <p className="text-sm font-semibold">
              Store Owner
            </p>

            <p className="text-xs text-slate-500">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </header>

    <div className="px-5 pb-12 pt-24 lg:px-8 lg:pt-8">
      {renderPage()}
    </div>
  </main>
</div>

);
}

function Overview() {
const [businessHealth, setBusinessHealth] =
useState<BusinessHealth | null>(null);

const [loading, setLoading] = useState(true);
const [error, setError] =
useState<string | null>(null);

useEffect(() => {
let mounted = true;

async function loadBusinessHealth() {
  try {
    setLoading(true);
    setError(null);

    const result = await getBusinessHealth();

    if (mounted) {
      setBusinessHealth(result);
    }
  } catch (err) {
    if (mounted) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load business health."
      );
    }
  } finally {
    if (mounted) {
      setLoading(false);
    }
  }
}

loadBusinessHealth();

return () => {
  mounted = false;
};

}, []);

const revenue =
businessHealth?.currentPeriod.revenue ?? 0;

const orders =
businessHealth?.currentPeriod.orders ?? 0;

const profit =
businessHealth?.currentPeriod.profit ?? 0;

const margin =
businessHealth?.currentPeriod.margin ?? 0;

return ( <div> <div> <p className="text-sm text-slate-500">
Dashboard </p>


    <h1 className="mt-1 text-3xl font-bold">
      Good afternoon 👋
    </h1>

    <p className="mt-2 text-slate-500">
      Here's what's happening with your store.
    </p>
  </div>

  <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
    <Stat
      title="30-day sales"
      value={`$${revenue.toFixed(2)}`}
    />

    <Stat
      title="Orders"
      value={orders.toString()}
    />

    <Stat
      title="Profit"
      value={`$${profit.toFixed(2)}`}
    />

    <Stat
      title="Profit margin"
      value={`${margin.toFixed(2)}%`}
    />
  </div>

  {error && (
    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {error}
    </div>
  )}

  <div className="mt-6">
    {loading ? (
      <div className="flex h-[460px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
        Loading business health...
      </div>
    ) : businessHealth ? (
      <BusinessHealthChart data={businessHealth} />
    ) : null}
  </div>

  <div className="mt-6">
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Visitors around the world
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-950">
          Live visitor locations
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Approximate visitor locations based on
          network location data.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
        <WorldGlobe />
      </div>
    </div>
  </div>

  <div className="mt-6 grid gap-6 xl:grid-cols-3">
    <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
      <h2 className="font-bold">
        Business profitability
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Your overall business performance is
        calculated from confirmed business orders.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <BusinessMetric
          label="Business status"
          value={
            businessHealth?.businessStatus ===
            "profitable"
              ? "Profitable"
              : businessHealth?.businessStatus ===
                  "loss"
                ? "Loss"
                : "Break-even"
          }
        />

        <BusinessMetric
          label="Profit trend"
          value={
            businessHealth?.profitTrend === "up"
              ? "Trending up"
              : businessHealth?.profitTrend ===
                  "down"
                ? "Trending down"
                : "Stable"
          }
        />

        <BusinessMetric
          label="Healthy products"
          value={
            businessHealth?.healthyProducts.toString() ??
            "0"
          }
        />

        <BusinessMetric
          label="Low-margin products"
          value={
            businessHealth?.lowMarginProducts.toString() ??
            "0"
          }
        />
      </div>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-bold">
        Order status
      </h2>

      <div className="mt-6 space-y-4">
        <Status label="Payment pending" />
        <Status label="Settlement pending" />
        <Status label="Ready to fulfill" />
        <Status label="Shipped" />
        <Status label="Delivered" />
      </div>
    </div>
  </div>
</div>

);
}

function Stat({
title,
value,
}: {
title: string;
value: string;
}) {
return ( <div className="rounded-2xl border border-slate-200 bg-white p-5"> <p className="text-sm text-slate-500">
{title} </p>

  <p className="mt-3 text-2xl font-bold">
    {value}
  </p>
</div>

);
}

function BusinessMetric({
label,
value,
}: {
label: string;
value: string;
}) {
return ( <div className="rounded-xl bg-slate-50 p-4"> <p className="text-xs font-medium text-slate-500">
{label} </p>

  <p className="mt-2 text-lg font-bold text-slate-950">
    {value}
  </p>
</div>

);
}

function Status({
label,
}: {
label: string;
}) {
return ( <div className="flex justify-between border-b border-slate-100 pb-3 text-sm"> <span className="text-slate-600">
{label} </span>

  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
    0
  </span>
</div>


);
}
