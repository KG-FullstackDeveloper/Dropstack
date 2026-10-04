import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
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

function numberValue(value: unknown): number {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function formatCurrency(value: unknown): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(numberValue(value));
}

function formatNumber(value: unknown): string {
  return new Intl.NumberFormat("en-NG").format(numberValue(value));
}

function getValue(
  dashboard: NigeriaDashboard,
  keys: string[],
): unknown {
  const record = dashboard as unknown as Record<string, unknown>;

  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  return 0;
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
  subtitle?: string;
  icon: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 truncate text-2xl font-semibold text-gray-900">
            {value}
          </p>

          {subtitle && (
            <p
              className={`mt-2 flex items-center gap-1 text-xs ${
                positive === true
                  ? "text-emerald-600"
                  : positive === false
                    ? "text-red-600"
                    : "text-gray-500"
              }`}
            >
              {positive === true && (
                <ArrowUpRight className="h-3.5 w-3.5" />
              )}

              {positive === false && (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}

              {subtitle}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function NigeriaDashboard() {
  const [dashboard, setDashboard] = useState<NigeriaDashboard | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(showRefreshState = false) {
    try {
      setError("");

      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getNigeriaDashboard();

      setDashboard(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load Nigeria dashboard.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const stats = useMemo(() => {
    if (!dashboard) {
      return {
        revenue: 0,
        orders: 0,
        customers: 0,
        products: 0,
        profit: 0,
        margin: 0,
        pendingOrders: 0,
        lowStock: 0,
      };
    }

    return {
      revenue: getValue(dashboard, [
        "total_revenue",
        "revenue",
        "sales",
        "totalSales",
      ]),
      orders: getValue(dashboard, [
        "total_orders",
        "orders",
        "order_count",
        "orderCount",
      ]),
      customers: getValue(dashboard, [
        "total_customers",
        "customers",
        "customer_count",
        "customerCount",
      ]),
      products: getValue(dashboard, [
        "total_products",
        "products",
        "product_count",
        "productCount",
      ]),
      profit: getValue(dashboard, [
        "total_profit",
        "profit",
        "net_profit",
        "netProfit",
      ]),
      margin: getValue(dashboard, [
        "profit_margin",
        "margin",
        "average_profit_margin",
        "averageProfitMargin",
      ]),
      pendingOrders: getValue(dashboard, [
        "pending_orders",
        "pendingOrders",
        "payment_pending",
        "paymentPending",
      ]),
      lowStock: getValue(dashboard, [
        "low_stock",
        "lowStock",
        "low_stock_products",
        "lowStockProducts",
      ]),
    };
  }, [dashboard]);

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="flex min-h-72 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Nigeria dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Nigeria Ecommerce
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Overview of your Nigeria store performance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Revenue"
            value={formatCurrency(stats.revenue)}
            icon={<TrendingUp className="h-5 w-5" />}
          />

          <StatCard
            title="Orders"
            value={formatNumber(stats.orders)}
            icon={<ShoppingCart className="h-5 w-5" />}
          />

          <StatCard
            title="Customers"
            value={formatNumber(stats.customers)}
            icon={<Users className="h-5 w-5" />}
          />

          <StatCard
            title="Products"
            value={formatNumber(stats.products)}
            icon={<Package className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total profit
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {formatCurrency(stats.profit)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Profit margin
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {numberValue(stats.margin).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Needs attention
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {formatNumber(
                    numberValue(stats.pendingOrders) +
                      numberValue(stats.lowStock),
                  )}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Pending orders + low stock products
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900">
                Order overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Current Nigeria order activity.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-5">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Total orders</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {formatNumber(stats.orders)}
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-700">Pending</p>
                <p className="mt-2 text-2xl font-semibold text-amber-800">
                  {formatNumber(stats.pendingOrders)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900">
                Inventory overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Current Nigeria inventory health.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-5">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Products</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {formatNumber(stats.products)}
                </p>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">Low stock</p>
                <p className="mt-2 text-2xl font-semibold text-red-800">
                  {formatNumber(stats.lowStock)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <CheckCircle2 className="h-5 w-5 text-gray-600" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Nigeria store data is isolated
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                This dashboard reads from the Nigeria Ecommerce backend only.
                Global Ecommerce orders, customers, products, inventory, and
                revenue are not included here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}