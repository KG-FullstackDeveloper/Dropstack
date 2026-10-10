import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  getNigeriaDashboard,
  type NigeriaDashboard,
} from "../../services/nigeriaApi";

function getValue(
  data: NigeriaDashboard | null,
  keys: string[],
  fallback = 0,
): number {
  if (!data) return fallback;

  const record = data as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  positive,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </p>

          <div
            className={`mt-2 flex items-center gap-1 text-xs font-medium ${
              positive === false ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            {positive === false ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )}

            {subtitle}
          </div>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function NigeriaAnalytics() {
  const [dashboard, setDashboard] = useState<NigeriaDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getNigeriaDashboard();
      setDashboard(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Nigeria analytics.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, []);

  const metrics = useMemo(() => {
    const revenue = getValue(dashboard, [
      "revenue",
      "totalRevenue",
      "total_revenue",
    ]);

    const orders = getValue(dashboard, [
      "orders",
      "totalOrders",
      "total_orders",
    ]);

    const customers = getValue(dashboard, [
      "customers",
      "totalCustomers",
      "total_customers",
    ]);

    const products = getValue(dashboard, [
      "products",
      "totalProducts",
      "total_products",
    ]);

    const profit = getValue(dashboard, [
      "profit",
      "totalProfit",
      "total_profit",
    ]);

    const margin = getValue(dashboard, [
      "margin",
      "profitMargin",
      "profit_margin",
    ]);

    const pendingOrders = getValue(dashboard, [
      "pendingOrders",
      "pending_orders",
      "paymentPending",
      "payment_pending",
    ]);

    const lowStock = getValue(dashboard, [
      "lowStock",
      "low_stock",
      "lowStockProducts",
      "low_stock_products",
    ]);

    return {
      revenue,
      orders,
      customers,
      products,
      profit,
      margin,
      pendingOrders,
      lowStock,
    };
  }, [dashboard]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading Nigeria analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Analytics
              </h1>

              <p className="text-sm text-gray-500">
                Nigeria Ecommerce performance and business analytics.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadAnalytics(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

          <div>
            <p className="font-semibold text-blue-900">
              Nigeria Ecommerce analytics
            </p>

            <p className="mt-1 text-sm text-blue-700">
              These figures come only from the Nigeria Ecommerce backend.
              Global Ecommerce orders, customers, products and revenue are not
              included here.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Revenue"
          value={formatCurrency(metrics.revenue)}
          subtitle="Nigeria sales revenue"
          icon={<DollarSign className="h-5 w-5" />}
        />

        <StatCard
          title="Orders"
          value={formatNumber(metrics.orders)}
          subtitle="Nigeria orders"
          icon={<ShoppingCart className="h-5 w-5" />}
        />

        <StatCard
          title="Customers"
          value={formatNumber(metrics.customers)}
          subtitle="Nigeria customers"
          icon={<Users className="h-5 w-5" />}
        />

        <StatCard
          title="Products"
          value={formatNumber(metrics.products)}
          subtitle="Nigeria products"
          icon={<Package className="h-5 w-5" />}
        />

        <StatCard
          title="Profit"
          value={formatCurrency(metrics.profit)}
          subtitle="Calculated Nigeria profit"
          icon={<TrendingUp className="h-5 w-5" />}
          positive={metrics.profit >= 0}
        />

        <StatCard
          title="Profit Margin"
          value={`${metrics.margin.toFixed(2)}%`}
          subtitle="Nigeria average margin"
          icon={<BarChart3 className="h-5 w-5" />}
          positive={metrics.margin >= 15}
        />

        <StatCard
          title="Pending Orders"
          value={formatNumber(metrics.pendingOrders)}
          subtitle="Awaiting payment/processing"
          icon={<Activity className="h-5 w-5" />}
          positive={metrics.pendingOrders === 0}
        />

        <StatCard
          title="Low Stock"
          value={formatNumber(metrics.lowStock)}
          subtitle="Products needing attention"
          icon={<Package className="h-5 w-5" />}
          positive={metrics.lowStock === 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Financial overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current Nigeria Ecommerce financial metrics.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="text-sm text-gray-600">Revenue</span>

              <span className="font-semibold text-gray-900">
                {formatCurrency(metrics.revenue)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="text-sm text-gray-600">Profit</span>

              <span
                className={`font-semibold ${
                  metrics.profit < 0
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                {formatCurrency(metrics.profit)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="text-sm text-gray-600">
                Profit margin
              </span>

              <span className="font-semibold text-gray-900">
                {metrics.margin.toFixed(2)}%
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Operations overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Nigeria store activity that needs attention.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="text-sm text-gray-600">
                Total orders
              </span>

              <span className="font-semibold text-gray-900">
                {formatNumber(metrics.orders)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="text-sm text-gray-600">
                Pending orders
              </span>

              <span className="font-semibold text-gray-900">
                {formatNumber(metrics.pendingOrders)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="text-sm text-gray-600">
                Low-stock products
              </span>

              <span className="font-semibold text-gray-900">
                {formatNumber(metrics.lowStock)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}