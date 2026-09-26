import {
useEffect,
useMemo,
useState,
} from "react";

import {
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

import { getAnalytics } from "../../services/analytics";

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
label: "Today",
value: "24h",
},
{
label: "Last 7 days",
value: "7d",
},
{
label: "Last 30 days",
value: "30d",
},
{
label: "Last 90 days",
value: "90d",
},
{
label: "Last year",
value: "1y",
},
];

function StatCard({
title,
value,
icon: Icon,
}: {
title: string;
value: string;
icon: typeof DollarSign;
}) {
return ( <div className="rounded-2xl border border-slate-200 bg-white p-5"> <div className="flex items-start justify-between"> <div> <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
{title} </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
    </div>

    <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
      <Icon size={19} />
    </div>
  </div>
</div>

);
}

export default function Analytics() {
const [analytics, setAnalytics] =
useState<AnalyticsResponse | null>(null);

const [loading, setLoading] =
useState(true);

const [error, setError] =
useState<string | null>(null);

const [range, setRange] =
useState<AnalyticsRange>("7d");

const [metric, setMetric] =
useState<ChartMetric>("revenue");

useEffect(() => {
let active = true;

async function loadAnalytics() {
  try {
    setLoading(true);
    setError(null);

    const result =
      await getAnalytics();

    if (active) {
      setAnalytics(result);
    }
  } catch (err) {
    if (active) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load analytics."
      );
    }
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

}, [range]);

const filteredSeries =
useMemo(() => {
if (!analytics) {
return [];
}

  const now = Date.now();

  const milliseconds: Record<
    AnalyticsRange,
    number
  > = {
    "24h":
      24 * 60 * 60 * 1000,

    "7d":
      7 * 24 * 60 * 60 * 1000,

    "30d":
      30 * 24 * 60 * 60 * 1000,

    "90d":
      90 * 24 * 60 * 60 * 1000,

    "1y":
      365 * 24 * 60 * 60 * 1000,
  };

  const cutoff =
    now - milliseconds[range];

  return analytics.series.filter(
    (point) =>
      new Date(
        point.timestamp
      ).getTime() >= cutoff
  );
}, [analytics, range]);

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
}, [filteredSeries]);

if (loading && !analytics) {
return ( <div className="space-y-6"> <div> <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />

      <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-200" />
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map(
        (_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-slate-200"
          />
        )
      )}
    </div>

    <div className="h-[420px] animate-pulse rounded-2xl bg-slate-200" />
  </div>
);

}

if (!analytics) {
return ( <div className="rounded-2xl border border-red-200 bg-red-50 p-6"> <p className="font-semibold text-red-700">
Analytics could not be loaded. </p>

    <p className="mt-1 text-sm text-red-600">
      {error ||
        "Make sure the API server is running on port 4000."}
    </p>
  </div>
);

}

return ( <div className="space-y-8"> <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"> <div> <div className="flex items-center gap-2"> <BarChart3
           size={22}
           className="text-slate-500"
         />

        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Analytics
        </h1>
      </div>

      <p className="mt-1 text-sm text-slate-500">
        Detailed sales, profit, order and visitor
        performance.
      </p>
    </div>

    <div className="flex max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
      {ranges.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() =>
            setRange(item.value)
          }
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
            range === item.value
              ? "bg-slate-950 text-white"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  </div>

  {error && (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {error}
    </div>
  )}

  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <StatCard
      title="Sales"
      value={formatCurrency(
        visibleSummary.revenue,
        "USD"
      )}
      icon={DollarSign}
    />

    <StatCard
      title="Profit"
      value={formatCurrency(
        visibleSummary.profit,
        "USD"
      )}
      icon={ArrowUpRight}
    />

    <StatCard
      title="Orders"
      value={visibleSummary.orders.toLocaleString()}
      icon={ShoppingCart}
    />

    <StatCard
      title="Units sold"
      value={visibleSummary.units.toLocaleString()}
      icon={Package}
    />
  </div>

  <div className="grid gap-4 sm:grid-cols-3">
    <StatCard
      title="Costs"
      value={formatCurrency(
        visibleSummary.cost,
        "USD"
      )}
      icon={BarChart3}
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

  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center">
      <div>
        <p className="text-sm font-semibold text-slate-950">
          Sales performance
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Shopify-style business reporting for the
          selected period.
        </p>
      </div>

      <div className="flex items-center rounded-lg bg-slate-100 p-1">
        {(
          [
            ["revenue", "Sales"],
            ["profit", "Profit"],
            ["loss", "Loss"],
          ] as [
            ChartMetric,
            string
          ][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              setMetric(value)
            }
            className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
              metric === value
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>

    <div className="px-3 pb-4 pt-4 sm:px-5">
      <TradingChart
        data={filteredSeries}
        metric={metric}
      />
    </div>
  </section>

  <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
    <WorldGlobe
      locations={
        analytics.visitorLocations
      }
    />

    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Globe2
          size={19}
          className="text-slate-500"
        />

        <h2 className="font-semibold text-slate-950">
          Visitor locations
        </h2>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        Approximate visitor activity by location.
      </p>

      <div className="mt-5 space-y-3">
        {analytics.visitorLocations
          .slice()
          .sort(
            (a, b) =>
              b.visitors -
              a.visitors
          )
          .map((location) => (
            <div
              key={location.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-950">
                  {location.city}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {location.country}
                </p>
              </div>

              <div className="ml-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />

                <span className="text-sm font-semibold text-slate-700">
                  {location.visitors}
                </span>
              </div>
            </div>
          ))}

        {analytics.visitorLocations.length === 0 && (
          <div className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
            No visitor locations recorded yet.
          </div>
        )}
      </div>
    </div>
  </section>
</div>

);
}
