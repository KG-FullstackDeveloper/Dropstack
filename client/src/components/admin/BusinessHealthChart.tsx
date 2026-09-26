import {
useEffect,
useMemo,
useRef,
useState,
} from "react";

import type { BusinessHealth } from "../../types/businessHealth";

interface BusinessHealthChartProps {
data: BusinessHealth;
}

type Metric = "profit" | "revenue";

interface ChartPoint {
timestamp: string;
value: number;
profit: number;
loss: number;
revenue: number;
}

const CHART_WIDTH = 1000;
const CHART_HEIGHT = 320;

const PADDING = {
top: 24,
right: 24,
bottom: 42,
left: 58,
};

export default function BusinessHealthChart({
data,
}: BusinessHealthChartProps) {
const [metric, setMetric] =
useState<Metric>("profit");

const [hoveredIndex, setHoveredIndex] =
useState<number | null>(null);

const containerRef =
useRef<HTMLDivElement | null>(null);

const chartPoints = useMemo<ChartPoint[]>(() => {
return data.chart.map((point) => ({
timestamp: point.timestamp,
value:
metric === "profit"
? point.profit - point.loss
: point.revenue,
profit: point.profit,
loss: point.loss,
revenue: point.revenue,
}));
}, [data.chart, metric]);

const values = useMemo(() => {
if (chartPoints.length === 0) {
return [0];
}

const result = chartPoints.map(
  (point) => point.value
);

if (metric === "profit") {
  result.push(0);
}

return result;

}, [chartPoints, metric]);

const minValue = Math.min(...values);
const maxValue = Math.max(...values);

const range =
maxValue - minValue === 0
? Math.max(Math.abs(maxValue), 1)
: maxValue - minValue;

const paddedMin =
minValue - range * 0.12;

const paddedMax =
maxValue + range * 0.12;

const usableWidth =
CHART_WIDTH -
PADDING.left -
PADDING.right;

const usableHeight =
CHART_HEIGHT -
PADDING.top -
PADDING.bottom;

const getX = (index: number) => {
if (chartPoints.length <= 1) {
return PADDING.left + usableWidth / 2;
}

return (
  PADDING.left +
  (index / (chartPoints.length - 1)) *
    usableWidth
);

};

const getY = (value: number) => {
const normalized =
(value - paddedMin) /
(paddedMax - paddedMin);

return (
  PADDING.top +
  (1 - normalized) *
    usableHeight
);

};

const zeroY =
metric === "profit"
? getY(0)
: null;

const linePoints = chartPoints
.map(
(point, index) =>
`${getX(index)},${getY(point.value)}`
)
.join(" ");

const areaPoints =
chartPoints.length > 0
? [
`${getX(0)},${getY(chartPoints[0].value)}`,
...chartPoints.map(
(point, index) =>
`${getX(index)},${getY(point.value)}`
),
`${getX(chartPoints.length - 1)},${
            PADDING.top + usableHeight
          }`,
`${getX(0)},${
            PADDING.top + usableHeight
          }`,
].join(" ")
: "";

const hoveredPoint =
hoveredIndex !== null
? chartPoints[hoveredIndex]
: null;

const formatValue = (value: number) =>
`$${Math.abs(value).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;

const formatDate = (value: string) => {
const date = new Date(value);

if (Number.isNaN(date.getTime())) {
  return value;
}

return date.toLocaleDateString(
  "en-US",
  {
    month: "short",
    day: "numeric",
  }
);

};

const statusText =
data.businessStatus === "profitable"
? "Business is profitable"
: data.businessStatus === "loss"
? "Business is currently operating at a loss"
: "Business is at break-even";

const trendText =
data.profitTrend === "up"
? "Profitability is trending upward"
: data.profitTrend === "down"
? "Profitability is trending downward"
: "Profitability is relatively stable";

const handlePointerMove = (
event: React.PointerEvent<SVGRectElement>
) => {
if (
chartPoints.length === 0 ||
!containerRef.current
) {
return;
}

const rect =
  event.currentTarget.getBoundingClientRect();

const relativeX =
  event.clientX - rect.left;

const ratio =
  relativeX / rect.width;

const index = Math.round(
  ratio * (chartPoints.length - 1)
);

const safeIndex = Math.max(
  0,
  Math.min(
    chartPoints.length - 1,
    index
  )
);

setHoveredIndex(safeIndex);

};

useEffect(() => {
return () => {
setHoveredIndex(null);
};
}, [metric]);

return ( <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"> <div className="border-b border-slate-200 px-5 py-5 sm:px-6"> <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"> <div> <p className="text-sm font-medium text-slate-500">
Business health </p>

        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          {statusText}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {trendText}
        </p>
      </div>

      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setMetric("profit")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            metric === "profit"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-950"
          }`}
        >
          Profit
        </button>

        <button
          type="button"
          onClick={() => setMetric("revenue")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            metric === "revenue"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-950"
          }`}
        >
          Sales
        </button>
      </div>
    </div>
  </div>

  <div
    ref={containerRef}
    className="relative px-2 pb-2 pt-4 sm:px-5"
  >
    {hoveredPoint && hoveredIndex !== null && (
      <div className="pointer-events-none absolute right-6 top-5 z-10 min-w-[170px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <p className="text-xs font-medium text-slate-500">
          {formatDate(
            hoveredPoint.timestamp
          )}
        </p>

        <p className="mt-1 text-lg font-bold text-slate-950">
          {hoveredPoint.value < 0
            ? `-${formatValue(
                hoveredPoint.value
              )}`
            : formatValue(
                hoveredPoint.value
              )}
        </p>

        {metric === "profit" && (
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between gap-5">
              <span className="text-slate-500">
                Profit
              </span>

              <span className="font-medium text-green-600">
                {formatValue(
                  hoveredPoint.profit
                )}
              </span>
            </div>

            <div className="flex justify-between gap-5">
              <span className="text-slate-500">
                Loss
              </span>

              <span className="font-medium text-red-600">
                {formatValue(
                  hoveredPoint.loss
                )}
              </span>
            </div>
          </div>
        )}

        {metric === "revenue" && (
          <div className="mt-2 text-xs text-slate-500">
            Sales generated during this period
          </div>
        )}
      </div>
    )}

    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      className="block h-[360px] w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Business performance chart"
    >
      <defs>
        <linearGradient
          id="businessHealthArea"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="#22c55e"
            stopOpacity="0.18"
          />

          <stop
            offset="100%"
            stopColor="#22c55e"
            stopOpacity="0.01"
          />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map(
        (position) => {
          const y =
            PADDING.top +
            usableHeight * position;

          const value =
            paddedMax -
            (paddedMax - paddedMin) *
              position;

          return (
            <g key={position}>
              <line
                x1={PADDING.left}
                x2={
                  CHART_WIDTH -
                  PADDING.right
                }
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />

              <text
                x={PADDING.left - 10}
                y={y + 4}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="11"
              >
                {value < 0
                  ? `-$${Math.abs(
                      value
                    ).toFixed(0)}`
                  : `$${value.toFixed(0)}`}
              </text>
            </g>
          );
        }
      )}

      {metric === "profit" &&
        zeroY !== null && (
          <line
            x1={PADDING.left}
            x2={
              CHART_WIDTH -
              PADDING.right
            }
            y1={zeroY}
            y2={zeroY}
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
        )}

      {chartPoints.length > 1 && (
        <>
          {metric === "revenue" && (
            <polygon
              points={areaPoints}
              fill="url(#businessHealthArea)"
            />
          )}

          <polyline
            points={linePoints}
            fill="none"
            stroke={
              metric === "profit"
                ? "#22c55e"
                : "#0f172a"
            }
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {metric === "profit" &&
            chartPoints.map(
              (point, index) => {
                if (point.value >= 0) {
                  return null;
                }

                return (
                  <circle
                    key={`loss-${index}`}
                    cx={getX(index)}
                    cy={getY(
                      point.value
                    )}
                    r="4"
                    fill="#ef4444"
                  />
                );
              }
            )}
        </>
      )}

      {chartPoints.length === 0 && (
        <line
          x1={PADDING.left}
          x2={
            CHART_WIDTH -
            PADDING.right
          }
          y1={
            PADDING.top +
            usableHeight / 2
          }
          y2={
            PADDING.top +
            usableHeight / 2
          }
          stroke="#cbd5e1"
          strokeWidth="1"
        />
      )}

      {chartPoints.length > 0 &&
        [0, 0.25, 0.5, 0.75, 1].map(
          (position) => {
            const index = Math.round(
              position *
                (chartPoints.length - 1)
            );

            const point =
              chartPoints[index];

            return (
              <text
                key={`date-${position}`}
                x={getX(index)}
                y={
                  CHART_HEIGHT - 14
                }
                textAnchor={
                  position === 0
                    ? "start"
                    : position === 1
                      ? "end"
                      : "middle"
                }
                fill="#94a3b8"
                fontSize="11"
              >
                {formatDate(
                  point.timestamp
                )}
              </text>
            );
          }
        )}

      {hoveredPoint &&
        hoveredIndex !== null && (
          <>
            <line
              x1={getX(hoveredIndex)}
              x2={getX(hoveredIndex)}
              y1={PADDING.top}
              y2={
                PADDING.top +
                usableHeight
              }
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            <circle
              cx={getX(hoveredIndex)}
              cy={getY(
                hoveredPoint.value
              )}
              r="5"
              fill="white"
              stroke={
                hoveredPoint.value <
                0
                  ? "#ef4444"
                  : "#22c55e"
              }
              strokeWidth="3"
            />
          </>
        )}

      <rect
        x={PADDING.left}
        y={PADDING.top}
        width={usableWidth}
        height={usableHeight}
        fill="transparent"
        onPointerMove={
          handlePointerMove
        }
        onPointerLeave={() =>
          setHoveredIndex(null)
        }
      />
    </svg>

    {chartPoints.length === 0 && (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            No sales yet
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Your business performance will appear
            here when confirmed orders are recorded.
          </p>
        </div>
      </div>
    )}
  </div>

  <div className="grid border-t border-slate-100 sm:grid-cols-4">
    <SummaryItem
      label="Sales"
      value={formatValue(
        data.currentPeriod.revenue
      )}
    />

    <SummaryItem
      label="Profit"
      value={formatValue(
        data.currentPeriod.profit
      )}
      valueClassName="text-green-600"
    />

    <SummaryItem
      label="Margin"
      value={`${data.currentPeriod.margin.toFixed(
        2
      )}%`}
    />

    <SummaryItem
      label="Orders"
      value={data.currentPeriod.orders.toString()}
    />
  </div>
</section>

);
}

function SummaryItem({
label,
value,
valueClassName = "text-slate-950",
}: {
label: string;
value: string;
valueClassName?: string;
}) {
return ( <div className="border-b border-slate-100 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"> <p className="text-xs font-medium text-slate-500">
{label} </p>

  <p
    className={`mt-1 text-lg font-bold ${valueClassName}`}
  >
    {value}
  </p>
</div>

);
}
