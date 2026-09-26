import {
useEffect,
useMemo,
useRef,
} from "react";

import {
AreaSeries,
ColorType,
CrosshairMode,
createChart,
HistogramSeries,
LineStyle,
type IChartApi,
type ISeriesApi,
type Time,
} from "lightweight-charts";

import type {
AnalyticsPoint,
} from "../../types/analytics";

export type ChartMetric =
| "revenue"
| "profit"
| "loss"
| "orders"
| "units";

interface TradingChartProps {
data: AnalyticsPoint[];
metric: ChartMetric;
currency?: string;
}

interface ChartPoint {
time: Time;
value: number;
revenue: number;
profit: number;
loss: number;
orders: number;
units: number;
}

function getValue(
point: Pick<
AnalyticsPoint,
| "revenue"
| "profit"
| "loss"
| "orders"
| "units"

> ,
 metric: ChartMetric,
 ): number {
switch (metric) {
case "profit":
return point.profit;

case "loss":
  return point.loss;

case "orders":
  return point.orders;

case "units":
  return point.units;

case "revenue":
default:
  return point.revenue;

}
}

function getMetricLabel(
metric: ChartMetric,
): string {
switch (metric) {
case "profit":
return "Profit";

case "loss":
  return "Loss";

case "orders":
  return "Orders";

case "units":
  return "Units sold";

case "revenue":
default:
  return "Sales";

}
}

function getCurrencySymbol(
currency?: string,
): string {
if (!currency) {
return "";
}

try {
return (
new Intl.NumberFormat(
"en-US",
{
style: "currency",
currency,
maximumFractionDigits: 0,
},
)
.formatToParts(0)
.find(
(part) =>
part.type === "currency",
)?.value ?? ""
);
} catch {
return "";
}
}

function createZeroSeries(
data: AnalyticsPoint[],
): ChartPoint[] {
if (data.length > 0) {
return data
.map((point) => {
const timestamp =
new Date(
point.timestamp,
).getTime();

    if (
      !Number.isFinite(timestamp)
    ) {
      return null;
    }

    return {
      time: Math.floor(
        timestamp / 1000,
      ) as Time,

      value: 0,

      revenue: 0,
      profit: 0,
      loss: 0,
      orders: 0,
      units: 0,
    };
  })
  .filter(
    (
      point,
    ): point is ChartPoint =>
      point !== null,
  );

}

const now = Date.now();
const points: ChartPoint[] = [];

for (
let index = 29;
index >= 0;
index -= 1
) {
const timestamp =
now -
index *
24 *
60 *
60 *
1000;

points.push({
  time: Math.floor(
    timestamp / 1000,
  ) as Time,

  value: 0,

  revenue: 0,
  profit: 0,
  loss: 0,
  orders: 0,
  units: 0,
});

}

return points;
}

export default function TradingChart({
data,
metric,
currency,
}: TradingChartProps) {
const containerRef =
useRef<HTMLDivElement | null>(
null,
);

const chartRef =
useRef<IChartApi | null>(
null,
);

const areaRef =
useRef<
ISeriesApi<"Area"> | null
>(null);

const histogramRef =
useRef<
ISeriesApi<"Histogram"> | null
>(null);

const chartData =
useMemo<ChartPoint[]>(() => {
const parsed =
data
.map((point) => {
const timestamp =
new Date(
point.timestamp,
).getTime();

        if (
          !Number.isFinite(
            timestamp,
          )
        ) {
          return null;
        }

        return {
          time: Math.floor(
            timestamp / 1000,
          ) as Time,

          value: getValue(
            point,
            metric,
          ),

          revenue:
            point.revenue,

          profit:
            point.profit,

          loss:
            point.loss,

          orders:
            point.orders,

          units:
            point.units,
        };
      })
      .filter(
        (
          point,
        ): point is ChartPoint =>
          point !== null,
      )
      .sort(
        (a, b) =>
          Number(a.time) -
          Number(b.time),
      );

  if (parsed.length > 0) {
    return parsed;
  }

  return createZeroSeries(data);
}, [data, metric]);

useEffect(() => {
if (!containerRef.current) {
return;
}

const container =
  containerRef.current;

const chart =
  createChart(
    container,
    {
      width:
        container.clientWidth,

      height: 380,

      layout: {
        background: {
          type:
            ColorType.Solid,

          color:
            "transparent",
        },

        textColor:
          "#64748b",

        fontFamily:
          "Inter, ui-sans-serif, system-ui, sans-serif",
      },

      grid: {
        vertLines: {
          color:
            "rgba(148,163,184,0.08)",
        },

        horzLines: {
          color:
            "rgba(148,163,184,0.10)",
        },
      },

      crosshair: {
        mode:
          CrosshairMode.Magnet,

        vertLine: {
          color:
            "rgba(100,116,139,0.45)",

          width: 1,

          style:
            LineStyle.Dashed,

          labelBackgroundColor:
            "#0f172a",
        },

        horzLine: {
          color:
            "rgba(100,116,139,0.45)",

          width: 1,

          style:
            LineStyle.Dashed,

          labelBackgroundColor:
            "#0f172a",
        },
      },

      rightPriceScale: {
        borderColor:
          "rgba(148,163,184,0.15)",

        scaleMargins: {
          top: 0.12,
          bottom: 0.18,
        },
      },

      timeScale: {
        borderColor:
          "rgba(148,163,184,0.15)",

        timeVisible: true,

        secondsVisible:
          false,

        rightOffset: 2,

        barSpacing: 8,

        minBarSpacing: 4,

        fixLeftEdge: true,

        fixRightEdge: true,
      },

      /*
       * Dashboard-style interaction.
       *
       * The chart is NOT a trading terminal.
       * Users cannot pan, swipe, drag, or zoom it.
       * The selected analytics period controls
       * which records appear in the chart.
       */
      handleScroll: false,

      handleScale: false,
    },
  );

const area =
  chart.addSeries(
    AreaSeries,
    {
      lineWidth: 2,

      lineColor:
        "#10b981",

      topColor:
        "rgba(16,185,129,0.18)",

      bottomColor:
        "rgba(16,185,129,0)",

      priceLineVisible:
        false,

      lastValueVisible:
        true,

      crosshairMarkerVisible:
        true,

      crosshairMarkerRadius:
        4,
    },
  );

const histogram =
  chart.addSeries(
    HistogramSeries,
    {
      priceScaleId:
        "business-bars",

      priceFormat: {
        type: "price",

        precision: 2,

        minMove: 0.01,
      },
    },
  );

histogram
  .priceScale()
  .applyOptions({
    scaleMargins: {
      top: 0.82,

      bottom: 0,
    },

    visible: false,
  });

chartRef.current =
  chart;

areaRef.current =
  area;

histogramRef.current =
  histogram;

const resizeObserver =
  new ResizeObserver(() => {
    const width =
      container.clientWidth;

    if (width > 0) {
      chart.applyOptions({
        width,
      });
    }
  });

resizeObserver.observe(
  container,
);

return () => {
  resizeObserver.disconnect();

  chart.remove();

  chartRef.current =
    null;

  areaRef.current =
    null;

  histogramRef.current =
    null;
};

}, []);

useEffect(() => {
const chart =
chartRef.current;

const area =
  areaRef.current;

const histogram =
  histogramRef.current;

if (
  !chart ||
  !area ||
  !histogram
) {
  return;
}

if (!chartData.length) {
  return;
}

area.setData(
  chartData.map(
    (point) => ({
      time: point.time,
      value: point.value,
    }),
  ),
);

histogram.setData(
  chartData.map(
    (point) => {
      const value =
        getValue(
          point,
          metric,
        );

      return {
        time: point.time,

        value,

        color:
          value < 0
            ? "#ef4444"
            : "#10b981",
      };
    },
  ),
);

const latest =
  chartData[
    chartData.length - 1
  ];

const latestValue =
  latest?.value ?? 0;

const positive =
  latestValue >= 0;

area.applyOptions({
  lineColor:
    positive
      ? "#10b981"
      : "#ef4444",

  topColor:
    positive
      ? "rgba(16,185,129,0.18)"
      : "rgba(239,68,68,0.18)",

  bottomColor:
    positive
      ? "rgba(16,185,129,0)"
      : "rgba(239,68,68,0)",
});

/*
 * Always show the entire selected period.
 * No user panning or zooming is necessary.
 */
chart
  .timeScale()
  .fitContent();

}, [
chartData,
metric,
]);

const label =
getMetricLabel(metric);

const symbol =
getCurrencySymbol(
currency,
);

return ( <div className="w-full"> <div className="mb-4 flex flex-wrap items-center justify-between gap-4"> <div> <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
{label} </p>

      <p className="mt-1 text-xs text-slate-500">
        Actual records for the selected period.
      </p>
    </div>

    <div className="flex items-center gap-4 text-xs">
      <span className="flex items-center gap-1.5 text-slate-500">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Profit
      </span>

      <span className="flex items-center gap-1.5 text-slate-500">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        Loss
      </span>
    </div>
  </div>

  <div className="relative">
    <div
      ref={containerRef}
      className="h-[380px] w-full"
      aria-label={`${label} over time`}
    />

    {data.length === 0 && (
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-sm font-medium text-slate-400">
          No sales yet
        </p>

        <p className="mt-1 text-xs text-slate-400/70">
          Your real records will appear here as orders are completed.
        </p>
      </div>
    )}
  </div>

  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
    <span>
      {data.length === 0
        ? "No records"
        : `${data.length} data points`}
    </span>

    {symbol && (
      <span>
        Currency: {symbol}
      </span>
    )}

    <span>
      Hover to inspect records
    </span>
  </div>
</div>

);
}
