import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Megaphone,
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

    if (typeof value === "string" && value.trim()) {
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
  return new Intl.NumberFormat("en-NG").format(value);
}

export default function NigeriaMarketing() {
  const [dashboard, setDashboard] = useState<NigeriaDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = async (manual = false) => {
    try {
      setError("");

      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getNigeriaDashboard();
      setDashboard(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Nigeria marketing data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
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

    const averageOrderValue =
      orders > 0 ? revenue / orders : 0;

    return {
      revenue,
      orders,
      customers,
      products,
      averageOrderValue,
    };
  }, [dashboard]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading Nigeria marketing...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
            <Megaphone className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
            <p className="text-sm text-gray-500">
              Nigeria Ecommerce marketing performance.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <Megaphone className="mt-0.5 h-5 w-5 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-900">
              Nigeria marketing workspace
            </p>
            <p className="mt-1 text-sm text-blue-700">
              This page is isolated to Nigeria Ecommerce. Global Ecommerce
              marketing data is not included.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Revenue
            </p>
            <TrendingUp className="h-5 w-5 text-gray-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {formatCurrency(metrics.revenue)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Nigeria store revenue
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Orders
            </p>
            <ShoppingCart className="h-5 w-5 text-gray-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {formatNumber(metrics.orders)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Nigeria orders
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Customers
            </p>
            <Users className="h-5 w-5 text-gray-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {formatNumber(metrics.customers)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Nigeria customers
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Average order value
            </p>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {formatCurrency(metrics.averageOrderValue)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Revenue ÷ orders
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Campaign planning
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Marketing channels for the Nigeria store.
            </p>
          </div>

          <div className="space-y-3">
            {[
              ["Meta Ads", "Facebook and Instagram campaigns"],
              ["TikTok Ads", "Short-form product campaigns"],
              ["WhatsApp", "Customer follow-up and promotions"],
              ["Email", "Customer retention campaigns"],
            ].map(([name, description]) => (
              <div
                key={name}
                className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {description}
                  </p>
                </div>

                <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
                  Ready
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Marketing metrics
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Current store figures that can be used when evaluating
              campaigns.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="text-sm text-gray-600">
                Products available
              </span>
              <span className="font-semibold text-gray-900">
                {formatNumber(metrics.products)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="text-sm text-gray-600">
                Customers reached
              </span>
              <span className="font-semibold text-gray-900">
                {formatNumber(metrics.customers)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="text-sm text-gray-600">
                Orders generated
              </span>
              <span className="font-semibold text-gray-900">
                {formatNumber(metrics.orders)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="text-sm text-gray-600">
                Revenue generated
              </span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(metrics.revenue)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}