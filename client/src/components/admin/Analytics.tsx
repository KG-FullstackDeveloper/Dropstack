import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Globe2,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";

import TradingChart from "../../components/admin/TradingChart";
import WorldGlobe from "../../components/admin/WorldGlobe";

import {
  getAnalytics,
} from "../../services/analytics";

import type {
  AnalyticsRange,
  AnalyticsResponse,
} from "../../types/analytics";

import { formatCurrency } from "../../utils/currency";

type ChartMetric =
  | "revenue"
  | "profit"
  | "loss";

const ranges: {
  label: string;
  value: AnalyticsRange;
}[] = [
  {
    label: "24H",
    value: "24h",
  },
  {
    label: "7D",
    value: "7d",
  },
  {
    label: "30D",
    value: "30d",
  },
  {
    label: "90D",
    value: "90d",
  },
  {
    label: "1Y",
    value: "1y",
  },
];

function StatCard({
  title,
  value,
  icon: Icon,
  change,
}: {
  title: string;
  value: string;
  icon: typeof DollarSign;
  change?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Icon size={19} />
        </div>
      </div>

      {change && (
        <div className="mt-4 flex items-center gap-1 text-xs text-emerald-500">
          <ArrowUpRight size={14} />

          <span>
            {change}
          </span>

          <span className="text-slate-400">
            vs previous period
          </span>
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  const [
    analytics,
    setAnalytics,
  ] =
    useState<AnalyticsResponse | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    range,
    setRange,
  ] =
    useState<AnalyticsRange>(
      "7d"
    );

  const [
    metric,
    setMetric,
  ] =
    useState<ChartMetric>(
      "revenue"
    );

  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      try {
        setLoading(true);

        const result =
          await getAnalytics();

        if (active) {
          setAnalytics(
            result
          );
        }
      } catch (error) {
        console.error(
          "Failed to load analytics:",
          error
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      active = false;
    };
  }, []);

  const filteredSeries =
    useMemo(() => {
      if (!analytics) {
        return [];
      }

      const now =
        Date.now();

      const milliseconds: Record<
        AnalyticsRange,
        number
      > = {
        "24h":
          24 *
          60 *
          60 *
          1000,

        "7d":
          7 *
          24 *
          60 *
          60 *
          1000,

        "30d":
          30 *
          24 *
          60 *
          60 *
          1000,

        "90d":
          90 *
          24 *
          60 *
          60 *
          1000,

        "1y":
          365 *
          24 *
          60 *
          60 *
          1000,
      };

      const cutoff =
        now -
        milliseconds[range];

      return analytics.series.filter(
        (point) =>
          new Date(
            point.timestamp
          ).getTime() >=
          cutoff
      );
    }, [
      analytics,
      range,
    ]);

  const visibleSummary =
    useMemo(() => {
      return filteredSeries.reduce(
        (summary, point) => ({
          revenue:
            summary.revenue +
            point.revenue,

          cost:
            summary.cost +
            point.cost,

          profit:
            summary.profit +
            point.profit,

          loss:
            summary.loss +
            point.loss,

          orders:
            summary.orders +
            point.orders,

          units:
            summary.units +
            point.units,
        }),
        {
          revenue: 0,
          cost: 0,
          profit: 0,
          loss: 0,
          orders: 0,
          units: 0,
        }
      );
    }, []);

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />

          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>

        <div className="h-[420px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
        <p className="font-semibold text-red-700 dark:text-red-400">
          Analytics could not be loaded.
        </p>

        <p className="mt-1 text-sm text-red-600 dark:text-red-400/80">
          Make sure the API server is
          running on port 4000.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3
              size={22}
              className="text-slate-500"
            />

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Analytics
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor your store performance,
            sales and visitor activity.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {ranges.map(
            (item) => (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  setRange(
                    item.value
                  )
                }
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  range ===
                  item.value
                    ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      </div>

      {/* SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Revenue"
          value={formatCurrency(
            visibleSummary.revenue,
            "USD"
          )}
          icon={DollarSign}
          change="+12.4%"
        />

        <StatCard
          title="Profit"
          value={formatCurrency(
            visibleSummary.profit,
            "USD"
          )}
          icon={ArrowUpRight}
          change="+8.7%"
        />

        <StatCard
          title="Orders"
          value={visibleSummary.orders.toLocaleString()}
          icon={ShoppingCart}
          change="+6.2%"
        />

        <StatCard
          title="Units sold"
          value={visibleSummary.units.toLocaleString()}
          icon={Package}
          change="+9.1%"
        />
      </div>

      {/* SECONDARY STATS */}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Costs"
          value={formatCurrency(
            visibleSummary.cost,
            "USD"
          )}
          icon={Activity}
        />

        <StatCard
          title="Loss"
          value={formatCurrency(
            visibleSummary.loss,
            "USD"
          )}
          icon={ArrowDownRight}
        />

        <StatCard
          title="Visitors"
          value={analytics.summary.visitors.toLocaleString()}
          icon={Users}
        />
      </div>

      {/* TRADING CHART */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Performance
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Interactive market-style
              performance chart
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {(
              [
                [
                  "revenue",
                  "Revenue",
                ],
                [
                  "profit",
                  "Profit",
                ],
                [
                  "loss",
                  "Loss",
                ],
              ] as [
                ChartMetric,
                string
              ][]
            ).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setMetric(
                      value
                    )
                  }
                  className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                    metric ===
                    value
                      ? "bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-white"
                      : "text-slate-500"
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        <div className="px-3 pb-3 pt-4 sm:px-5">
          <TradingChart
            data={
              filteredSeries
            }
            metric={metric}
          />
        </div>
      </section>

      {/* GLOBE */}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <WorldGlobe
          locations={
            analytics.visitorLocations
          }
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Globe2
              size={19}
              className="text-slate-500"
            />

            <h2 className="font-semibold text-slate-950 dark:text-white">
              Visitor locations
            </h2>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Approximate visitor activity
            by location.
          </p>

          <div className="mt-5 space-y-3">
            {analytics.visitorLocations
              .slice()
              .sort(
                (a, b) =>
                  b.visitors -
                  a.visitors
              )
              .map(
                (location) => (
                  <div
                    key={
                      location.id
                    }
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-950 dark:text-white">
                        {
                          location.city
                        }
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {
                          location.country
                        }
                      </p>
                    </div>

                    <div className="ml-3 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />

                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {
                          location.visitors
                        }
                      </span>
                    </div>
                  </div>
                )
              )}
          </div>
        </div>
      </section>
    </div>
  );
}