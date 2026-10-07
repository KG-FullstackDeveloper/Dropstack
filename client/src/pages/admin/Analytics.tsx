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
import { useEffect, useMemo, useState } from "react";
import WorldGlobe from "../../components/admin/WorldGlobe";
import { getAnalytics } from "../../services/analytics";
import type {
  AnalyticsRange,
  AnalyticsResponse,
} from "../../types/analytics";
import { formatCurrency } from "../../utils/currency";

type ChartMetric = "revenue" | "profit" | "loss";

type AnalyticsSummary = {
  revenue: number;
  profit: number;
  loss: number;
  orders: number;
  units: number;
  visitors: number;
  costs: number;
};

const RANGES: Array<{
  value: AnalyticsRange;
  label: string;
}> = [
  { value: "24h", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
];

const CHART_WIDTH = 1200;
const CHART_HEIGHT = 390;

function createEmptySummary(): AnalyticsSummary {
  return {
    revenue: 0,
    profit: 0,
    loss: 0,
    orders: 0,
    units: 0,
    visitors: 0,
    costs: 0,
  };
}

function getMetricValue(
  point: unknown,
  metric: ChartMetric,
): number {
  if (!point || typeof point !== "object") return 0;

  const value = (point as Record<string, unknown>)[metric];

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const converted = Number(value ?? 0);

  return Number.isFinite(converted) ? converted : 0;
}

function getPointDate(point: unknown): string {
  if (!point || typeof point !== "object") return "";

  const item = point as Record<string, unknown>;

  return String(
    item.date ??
      item.timestamp ??
      item.time ??
      item.label ??
      item.period ??
      "",
  );
}

function getPointOrders(point: unknown): number {
  if (!point || typeof point !== "object") return 0;

  const value = Number(
    (point as Record<string, unknown>).orders ?? 0,
  );

  return Number.isFinite(value) ? value : 0;
}

function getPointUnits(point: unknown): number {
  if (!point || typeof point !== "object") return 0;

  const value = Number(
    (point as Record<string, unknown>).units ?? 0,
  );

  return Number.isFinite(value) ? value : 0;
}

function formatDate(
  value: string,
  range: AnalyticsRange,
) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (range === "24h") {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (range === "1y") {
    return date.toLocaleDateString([], {
      month: "short",
      year: "numeric",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function StatCard({
  title,
  value,
  icon: Icon,
  detail,
  positive,
}: {
  title: string;
  value: string;
  icon: typeof DollarSign;
  detail?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>

          {detail && (
            <p
              className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                positive === false
                  ? "text-red-600"
                  : positive
                    ? "text-emerald-600"
                    : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {positive === false ? (
                <ArrowDownRight size={14} />
              ) : positive ? (
                <ArrowUpRight size={14} />
              ) : null}

              {detail}
            </p>
          )}
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function SalesMovementChart({
  data,
  metric,
  range,
}: {
  data: unknown[];
  metric: ChartMetric;
  range: AnalyticsRange;
}) {
  const [hoveredIndex, setHoveredIndex] =
    useState<number | null>(null);

  const points = useMemo(
    () =>
      data.map((point) => ({
        value: getMetricValue(point, metric),
        date: getPointDate(point),
        orders: getPointOrders(point),
        units: getPointUnits(point),
      })),
    [data, metric],
  );

  if (!points.length) {
    return (
      <div className="flex h-[390px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm dark:bg-slate-900">
            <BarChart3 size={22} />
          </div>

          <p className="font-semibold text-slate-900 dark:text-white">
            No analytics data yet
          </p>

          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Your real store activity will appear here as sales and
            orders are recorded.
          </p>
        </div>
      </div>
    );
  }

  const values = points.map((point) => point.value);

  const highest = Math.max(...values, 0);
  const lowest = Math.min(...values, 0);

  const paddingLeft = 72;
  const paddingRight = 24;
  const paddingTop = 26;
  const paddingBottom = 48;

  const chartWidth =
    CHART_WIDTH - paddingLeft - paddingRight;

  const chartHeight =
    CHART_HEIGHT - paddingTop - paddingBottom;

  const valuePadding =
    Math.max((highest - lowest) * 0.12, 1);

  const maxValue = highest + valuePadding;
  const minValue = Math.min(
    0,
    lowest - valuePadding,
  );

  const valueRange = Math.max(
    maxValue - minValue,
    1,
  );

  const xFor = (index: number) => {
    if (points.length === 1) {
      return paddingLeft + chartWidth / 2;
    }

    return (
      paddingLeft +
      (index / (points.length - 1)) * chartWidth
    );
  };

  const yFor = (value: number) =>
    paddingTop +
    ((maxValue - value) / valueRange) * chartHeight;

  const baseY = yFor(Math.max(0, minValue));

  const linePath = points
    .map((point, index) => {
      const x = xFor(index);
      const y = yFor(point.value);

      if (index === 0) {
        return `M ${x} ${y}`;
      }

      const previousX = xFor(index - 1);
      const previousY = yFor(
        points[index - 1].value,
      );

      const controlX =
        (previousX + x) / 2;

      return `C ${controlX} ${previousY}, ${controlX} ${y}, ${x} ${y}`;
    })
    .join(" ");

  const areaPath =
  linePath +
  `L ${xFor(points.length - 1)} ${baseY} ` +
  `L ${xFor(0)} ${baseY} Z`;

  const gridRatios = [0, 0.25, 0.5, 0.75, 1];

  const latest =
    points[points.length - 1].value;

  const previous =
    points.length > 1
      ? points[points.length - 2].value
      : latest;

  const change = latest - previous;

  const changePercent =
    previous === 0
      ? latest > 0
        ? 100
        : 0
      : (change / Math.abs(previous)) * 100;

  const isPositive = change >= 0;

  const hovered =
    hoveredIndex !== null
      ? points[hoveredIndex]
      : null;

  const hoveredValue =
    hovered?.value ?? latest;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              {formatCurrency(
                hoveredIndex !== null
                  ? hoveredValue
                  : latest,
              )}
            </p>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                isPositive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight size={13} />
              ) : (
                <ArrowDownRight size={13} />
              )}

              {Math.abs(changePercent).toFixed(1)}%
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {metric === "revenue"
              ? "Sales"
              : metric === "profit"
                ? "Profit"
                : "Loss"}{" "}
            ·{" "}
            {
              RANGES.find(
                (item) => item.value === range,
              )?.label
            }
          </p>
        </div>

        {hovered && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-right shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatDate(hovered.date, range)}
            </p>

            <p className="mt-0.5 text-sm font-bold text-slate-950 dark:text-white">
              {formatCurrency(hovered.value)}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              {hovered.orders} orders · {hovered.units} units
            </p>
          </div>
        )}
      </div>

      <div className="px-2 pt-4">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-[390px] w-full"
          preserveAspectRatio="none"
          onMouseLeave={() =>
            setHoveredIndex(null)
          }
        >
          <defs>
            <linearGradient
              id="salesArea"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={
                  isPositive
                    ? "#10b981"
                    : "#ef4444"
                }
                stopOpacity="0.16"
              />

              <stop
                offset="100%"
                stopColor={
                  isPositive
                    ? "#10b981"
                    : "#ef4444"
                }
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {gridRatios.map((ratio) => {
            const value =
              minValue +
              valueRange * (1 - ratio);

            const y = yFor(value);

            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  x2={CHART_WIDTH - paddingRight}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-100 dark:text-slate-800"
                />

                <text
                  x={paddingLeft - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[12px]"
                >
                  {formatCurrency(value)}
                </text>
              </g>
            );
          })}

          <path
            d={areaPath}
            fill="url(#salesArea)"
          />

          {points.length > 1 &&
            points.map((point, index) => {
              if (index === 0) return null;

              const previousPoint =
                points[index - 1];

              const rising =
                point.value >=
                previousPoint.value;

              const previousX =
                xFor(index - 1);

              const previousY = yFor(
                previousPoint.value,
              );

              const currentX = xFor(index);
              const currentY = yFor(
                point.value,
              );

              const controlX =
                (previousX + currentX) / 2;

              const path = `M ${previousX} ${previousY} C ${controlX} ${previousY}, ${controlX} ${currentY}, ${currentX} ${currentY}`;

              return (
                <path
                  key={`segment-${index}`}
                  d={path}
                  fill="none"
                  stroke={
                    rising
                      ? "#10b981"
                      : "#ef4444"
                  }
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              );
            })}

          {points.length === 1 && (
            <circle
              cx={xFor(0)}
              cy={yFor(points[0].value)}
              r="5"
              fill="#10b981"
            />
          )}

          {hoveredIndex !== null && (
            <>
              <line
                x1={xFor(hoveredIndex)}
                x2={xFor(hoveredIndex)}
                y1={paddingTop}
                y2={
                  CHART_HEIGHT -
                  paddingBottom
                }
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 5"
                className="text-slate-300 dark:text-slate-700"
              />

              <circle
                cx={xFor(hoveredIndex)}
                cy={yFor(
                  points[hoveredIndex].value,
                )}
                r="7"
                fill="white"
                stroke={
                  hoveredIndex === 0 ||
                  points[hoveredIndex].value >=
                    points[hoveredIndex - 1]
                      .value
                    ? "#10b981"
                    : "#ef4444"
                }
                strokeWidth="3"
              />
            </>
          )}

          {points.map((_, index) => {
            const spacing =
              chartWidth /
              Math.max(
                points.length - 1,
                1,
              );

            const hitWidth = Math.max(
              spacing * 0.8,
              24,
            );

            return (
              <rect
                key={`hit-${index}`}
                x={
                  xFor(index) -
                  hitWidth / 2
                }
                y={paddingTop}
                width={hitWidth}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() =>
                  setHoveredIndex(index)
                }
              />
            );
          })}

          {points.map((point, index) => {
            const shouldShow =
              points.length <= 7 ||
              index === 0 ||
              index === points.length - 1 ||
              index %
                Math.max(
                  1,
                  Math.ceil(
                    points.length / 6,
                  ),
                ) ===
                0;

            if (!shouldShow) return null;

            return (
              <text
                key={`date-${index}`}
                x={xFor(index)}
                y={CHART_HEIGHT - 14}
                textAnchor="middle"
                className="fill-slate-400 text-[11px]"
              >
                {formatDate(
                  point.date,
                  range,
                )}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span
            className={`h-2 w-2 rounded-full ${
              isPositive
                ? "bg-emerald-500"
                : "bg-red-500"
            }`}
          />

          <span>
            {isPositive
              ? "Performance is moving up"
              : "Performance is moving down"}
          </span>
        </div>

        <span className="text-xs text-slate-400">
          Hover the graph to inspect each period
        </span>
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
    useState("");

  const [range, setRange] =
    useState<AnalyticsRange>("30d");

  const [metric, setMetric] =
    useState<ChartMetric>("revenue");

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const result = await getAnalytics();

        if (!mounted) return;

        setAnalytics(result);
      } catch (err) {
        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load analytics.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredSeries = useMemo(() => {
    if (!analytics?.series) return [];

    const now = Date.now();

    const durations: Record<
      AnalyticsRange,
      number
    > = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };

    const cutoff =
      now - durations[range];

    return (analytics.series as unknown[]).filter(
      (point) => {
        const date = getPointDate(point);

        if (!date) return true;

        const timestamp =
          new Date(date).getTime();

        if (Number.isNaN(timestamp)) {
          return true;
        }

        return timestamp >= cutoff;
      },
    );
  }, [analytics, range]);

  const summary = useMemo<AnalyticsSummary>(() => {
    const empty = createEmptySummary();

    if (!analytics) return empty;

    const result =
      filteredSeries.reduce<AnalyticsSummary>(
        (total, point) => {
          total.revenue += getMetricValue(
            point,
            "revenue",
          );

          total.profit += getMetricValue(
            point,
            "profit",
          );

          total.loss += getMetricValue(
            point,
            "loss",
          );

          total.orders +=
            getPointOrders(point);

          total.units +=
            getPointUnits(point);

          return total;
        },
        { ...empty },
      );

    const analyticsSummary =
      analytics.summary as unknown as Record<
        string,
        unknown
      >;

    result.visitors =
      Number(
        analyticsSummary?.visitors ?? 0,
      ) || 0;

    result.costs =
      Number(
        analyticsSummary?.costs ??
          analyticsSummary?.totalCost ??
          0,
      ) || 0;

    return result;
  }, [analytics, filteredSeries]);

  const latestMovement = useMemo(() => {
    if (filteredSeries.length < 2) return 0;

    const previous =
      getMetricValue(
        filteredSeries[
          filteredSeries.length - 2
        ],
        metric,
      );

    const current =
      getMetricValue(
        filteredSeries[
          filteredSeries.length - 1
        ],
        metric,
      );

    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return (
      ((current - previous) /
        Math.abs(previous)) *
      100
    );
  }, [filteredSeries, metric]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900"
              />
            ),
          )}
        </div>

        <div className="h-[540px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
        <p className="font-semibold text-red-700 dark:text-red-400">
          Unable to load analytics
        </p>

        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <BarChart3 size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                Analytics
              </h1>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                See how your store is performing over
                time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {RANGES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                setRange(item.value)
              }
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                range === item.value
                  ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Sales"
          value={formatCurrency(
            summary.revenue,
          )}
          icon={DollarSign}
          detail={`${latestMovement >= 0 ? "+" : ""}${latestMovement.toFixed(1)}% latest movement`}
          positive={latestMovement >= 0}
        />

        <StatCard
          title="Profit"
          value={formatCurrency(
            summary.profit,
          )}
          icon={ArrowUpRight}
          detail={
            summary.profit > 0
              ? "Profit recorded"
              : "No profit recorded yet"
          }
          positive={summary.profit > 0}
        />

        <StatCard
          title="Orders"
          value={summary.orders.toLocaleString()}
          icon={ShoppingCart}
          detail="Orders in selected period"
        />

        <StatCard
          title="Units sold"
          value={summary.units.toLocaleString()}
          icon={Package}
          detail="Units in selected period"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Costs"
          value={formatCurrency(
            summary.costs,
          )}
          icon={DollarSign}
          detail="Recorded store costs"
        />

        <StatCard
          title="Loss"
          value={formatCurrency(
            summary.loss,
          )}
          icon={ArrowDownRight}
          detail={
            summary.loss > 0
              ? "Loss recorded"
              : "No loss recorded"
          }
          positive={
            summary.loss > 0
              ? false
              : undefined
          }
        />

        <StatCard
          title="Visitors"
          value={summary.visitors.toLocaleString()}
          icon={Users}
          detail="Store traffic"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                Sales performance
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Follow your real store performance as
                it changes.
              </p>
            </div>

            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950">
              {(
                [
                  ["revenue", "Sales"],
                  ["profit", "Profit"],
                  ["loss", "Loss"],
                ] as Array<
                  [ChartMetric, string]
                >
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setMetric(value)
                  }
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    metric === value
                      ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SalesMovementChart
          data={filteredSeries}
          metric={metric}
          range={range}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Globe2 size={19} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">
                Visitor locations
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Where your store traffic is coming from.
              </p>
            </div>
          </div>

          <div className="h-[360px] overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
            <WorldGlobe />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5">
            <h2 className="font-semibold text-slate-950 dark:text-white">
              Traffic by location
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Countries generating store visits.
            </p>
          </div>

          <div className="space-y-4">
            {analytics?.visitorLocations?.length ? (
              analytics.visitorLocations.map(
                (location, index) => (
                  <div
                    key={`${location.country}-${index}`}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {location.country}
                      </p>

                      <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-slate-900 dark:bg-white"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                5,
                                (Number(
                                  location.visitors ??
                                    0,
                                ) /
                                  Math.max(
                                    Number(
                                      analytics
                                        .visitorLocations?.[0]
                                        ?.visitors ??
                                        1,
                                    ),
                                    1,
                                  )) *
                                  100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {Number(
                        location.visitors ?? 0,
                      ).toLocaleString()}
                    </span>
                  </div>
                ),
              )
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  No visitor location data yet
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Location analytics will appear when
                  traffic is recorded.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}