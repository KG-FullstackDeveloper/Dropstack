import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  CircleDollarSign,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingBag,
  Store as StoreIcon,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { getProducts, getStoreConfig } from "../services/api";

interface StoreRow {
  id: string;
  name: string;
  currency: string;
  slug?: string;
}

interface ProductRow {
  id: string;
  storeId: string;
  price?: number | string;
  cost?: number | string;
  title?: string;
  name?: string;
  supplier_cost?: number | string;
}

interface RawOrder {
  id?: string;
  storeId?: string;
  total?: number | string;
  amount?: number | string;
  subtotal?: number | string;
  shipping?: number | string;
  shippingCost?: number | string;
  shipping_cost?: number | string;
  gatewayFee?: number | string;
  gatewayFees?: number | string;
  gateway_fee?: number | string;
  gateway_fees?: number | string;
  transactionFee?: number | string;
  transactionFees?: number | string;
  transaction_fee?: number | string;
  transaction_fees?: number | string;
  orderStatus?: string;
  order_status?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  date?: string;
  items?: unknown[];
  lineItems?: unknown[];
}

interface StoreMetric {
  store: StoreRow;
  orders: number;
  revenue: number;
  supplierCost: number;
  shippingCost: number;
  gatewayFees: number;
  profit: number;
  margin: number;
}

interface DailyPoint {
  label: string;
  revenue: number;
  profit: number;
}

const ACTIVE_STATUSES = new Set([
  "cancelled",
  "canceled",
  "refunded",
  "chargeback",
]);

function numberValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    const result = numberValue(value);
    if (result !== 0) return result;
  }
  return 0;
}

function itemProductId(item: unknown): string | undefined {
  if (!item || typeof item !== "object") return undefined;
  const record = item as Record<string, unknown>;
  const value = record.productId ?? record.product_id ?? record.id;
  return typeof value === "string" ? value : undefined;
}

function itemQuantity(item: unknown): number {
  if (!item || typeof item !== "object") return 1;
  const record = item as Record<string, unknown>;
  const quantity = firstNumber(record.quantity, record.qty, 1);
  return quantity > 0 ? quantity : 1;
}

function itemCost(item: unknown, productMap: Map<string, ProductRow>): number {
  if (!item || typeof item !== "object") return 0;
  const record = item as Record<string, unknown>;
  const productId = itemProductId(item);
  const product = productId ? productMap.get(productId) : undefined;
  const quantity = itemQuantity(item);

  const explicitLineCost = firstNumber(
    record.supplierCost,
    record.supplier_cost,
    record.cost,
    record.costTotal,
    record.cost_total,
  );

  if (explicitLineCost !== 0) return explicitLineCost;

  const unitCost = firstNumber(
    record.unitCost,
    record.unit_cost,
    product?.cost,
    product?.supplier_cost,
  );

  return unitCost * quantity;
}

function orderRevenue(order: RawOrder): number {
  return firstNumber(
    order.total,
    order.amount,
    order.subtotal,
  );
}

function orderItems(order: RawOrder): unknown[] {
  if (Array.isArray(order.items)) return order.items;
  if (Array.isArray(order.lineItems)) return order.lineItems;
  return [];
}

function formatMoney(value: number, currency: string): string {
  const normalized = currency || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalized,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${normalized} ${value.toFixed(2)}`;
  }
}

function formatCompactMoney(value: number, currency: string): string {
  const normalized = currency || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalized,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${normalized} ${value.toFixed(0)}`;
  }
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getOrderDate(order: RawOrder): Date | null {
  const raw = order.createdAt ?? order.created_at ?? order.date;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getOrderStoreId(order: RawOrder): string | undefined {
  if (typeof order.storeId === "string") return order.storeId;
  const nested = order as unknown as Record<string, unknown>;
  const store = nested.store;
  if (store && typeof store === "object") {
    const storeRecord = store as Record<string, unknown>;
    if (typeof storeRecord.id === "string") return storeRecord.id;
  }
  return undefined;
}

function lineChartPath(points: DailyPoint[], key: "revenue" | "profit", width: number, height: number) {
  if (!points.length) return "";
  const maxValue = Math.max(
    1,
    ...points.map((point) => Math.max(0, point[key])),
  );
  return points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
      const y = height - (Math.max(0, point[key]) / maxValue) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function Bar({
  label,
  value,
  max,
  revenue,
  currency,
}: {
  label: string;
  value: number;
  max: number;
  revenue: number;
  currency: string;
}) {
  const height = max > 0 ? Math.max(4, (value / max) * 100) : 4;

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div className="flex h-64 w-full items-end justify-center rounded-2xl bg-slate-50 px-2 pb-0 dark:bg-white/[0.03]">
        <div
          className="w-full max-w-20 rounded-t-2xl bg-slate-950 transition-all duration-500 dark:bg-white"
          style={{ height: `${height}%` }}
          title={`${label}: ${formatMoney(value, currency)}`}
        />
      </div>
      <div className="w-full truncate text-center text-sm font-semibold text-slate-800 dark:text-slate-100">
        {label}
      </div>
      <div className="text-xs text-slate-500">
        {formatCompactMoney(revenue, currency)}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon,
  positive,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#11151b]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900 dark:bg-white/[0.06] dark:text-white">
          {icon}
        </div>
        {positive !== undefined && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold ${
              positive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {positive ? "Healthy" : "Negative"}
          </span>
        )}
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

export default function StorePerformance() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [orders, setOrders] = useState<RawOrder[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("all");
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:4000";

  async function getOrders(): Promise<RawOrder[]> {
    const response = await fetch(`${API_URL}/api/orders`);
    const result = (await response.json()) as {
      success?: boolean;
      data?: RawOrder[];
      error?: string;
    };

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Unable to load orders.");
    }

    return Array.isArray(result.data) ? result.data : [];
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [storeConfig, nextProducts, nextOrders] = await Promise.all([
        getStoreConfig(),
        getProducts(),
        getOrders(),
      ]);

      const nextStore: StoreRow = {
        id: storeConfig.id,
        name: storeConfig.name,
        currency: "USD",
        slug: storeConfig.slug,
      };

      setStores([nextStore]);
      setProducts(
  nextProducts.map((product) => ({
    ...product,
    storeId: "",
  }))
);
      setOrders(nextOrders);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load store performance.",
      );
      setStores([]);
      setProducts([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const productMap = useMemo(() => {
    const map = new Map<string, ProductRow>();
    for (const product of products) map.set(product.id, product);
    return map;
  }, [products]);

  const metrics = useMemo<StoreMetric[]>(() => {
    const now = Date.now();
    const rangeDays = Number(range);
    const start = now - rangeDays * 24 * 60 * 60 * 1000;
    const metricsByStore = new Map<string, StoreMetric>();

    for (const store of stores) {
      metricsByStore.set(store.id, {
        store,
        orders: 0,
        revenue: 0,
        supplierCost: 0,
        shippingCost: 0,
        gatewayFees: 0,
        profit: 0,
        margin: 0,
      });
    }

    for (const order of orders) {
      const storeId = getOrderStoreId(order);
      if (!storeId || !metricsByStore.has(storeId)) continue;

      const date = getOrderDate(order);
      if (!date || date.getTime() < start) continue;
      if (
        ACTIVE_STATUSES.has(
          String(order.order_status ?? order.orderStatus ?? order.status ?? "").toLowerCase(),
        )
      ) continue;

      const metric = metricsByStore.get(storeId);
      if (!metric) continue;

      const revenue = orderRevenue(order);
      const supplierCost = orderItems(order).reduce<number>(
        (sum, item) => sum + itemCost(item, productMap),
        0,
      );
      const shippingCost = firstNumber(
        order.shippingCost,
        order.shipping_cost,
        (order as unknown as Record<string, unknown>).shippingFee,
        (order as unknown as Record<string, unknown>).shipping_fee,
      );
      const gatewayFees = firstNumber(
        order.gatewayFees,
        order.gatewayFee,
        order.transactionFees,
        order.transactionFee,
        order.gateway_fees,
        order.gateway_fee,
        order.transaction_fees,
        order.transaction_fee,
      );

      metric.orders += 1;
      metric.revenue += revenue;
      metric.supplierCost += supplierCost;
      metric.shippingCost += shippingCost;
      metric.gatewayFees += gatewayFees;
    }

    for (const metric of metricsByStore.values()) {
      metric.profit =
        metric.revenue -
        metric.supplierCost -
        metric.shippingCost -
        metric.gatewayFees;
      metric.margin = metric.revenue > 0 ? (metric.profit / metric.revenue) * 100 : 0;
    }

    return Array.from(metricsByStore.values())
      .filter((metric) => selectedStoreId === "all" || metric.store.id === selectedStoreId)
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders, productMap, range, selectedStoreId, stores]);

  const allMetrics = useMemo<StoreMetric[]>(() => {
    return metrics.length || selectedStoreId === "all"
      ? metrics
      : [];
  }, [metrics, selectedStoreId]);

  const totals = useMemo(() => {
    return allMetrics.reduce(
      (sum, metric) => {
        sum.orders += metric.orders;
        sum.revenue += metric.revenue;
        sum.supplierCost += metric.supplierCost;
        sum.shippingCost += metric.shippingCost;
        sum.gatewayFees += metric.gatewayFees;
        sum.profit += metric.profit;
        return sum;
      },
      {
        orders: 0,
        revenue: 0,
        supplierCost: 0,
        shippingCost: 0,
        gatewayFees: 0,
        profit: 0,
      },
    );
  }, [allMetrics]);

  const selectedCurrency = useMemo(() => {
    const selected = stores.find((store) => store.id === selectedStoreId);
    return selected?.currency || stores[0]?.currency || "USD";
  }, [selectedStoreId, stores]);

  const totalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  const dailySeries = useMemo<DailyPoint[]>(() => {
    const days = Number(range);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const selectedIds = new Set(
      stores
        .filter((store) => selectedStoreId === "all" || store.id === selectedStoreId)
        .map((store) => store.id),
    );

    const map = new Map<string, DailyPoint>();

    for (let index = 0; index < days; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      map.set(key, {
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        revenue: 0,
        profit: 0,
      });
    }

    for (const order of orders) {
      const storeId = getOrderStoreId(order);
      if (!storeId || !selectedIds.has(storeId)) continue;
      if (
        ACTIVE_STATUSES.has(
          String(order.order_status ?? order.orderStatus ?? order.status ?? "").toLowerCase(),
        )
      ) continue;

      const date = getOrderDate(order);
      if (!date) continue;
      const key = date.toISOString().slice(0, 10);
      const point = map.get(key);
      if (!point) continue;

      const revenue = orderRevenue(order);
      const supplierCost = orderItems(order).reduce<number>(
        (sum, item) => sum + itemCost(item, productMap),
        0,
      );
      const shippingCost = firstNumber(
        order.shippingCost,
        order.shipping_cost,
        (order as unknown as Record<string, unknown>).shippingFee,
        (order as unknown as Record<string, unknown>).shipping_fee,
      );
      const gatewayFees = firstNumber(
        order.gatewayFees,
        order.gatewayFee,
        order.transactionFees,
        order.transactionFee,
        order.gateway_fees,
        order.gateway_fee,
        order.transaction_fees,
        order.transaction_fee,
      );

      point.revenue += revenue;
      point.profit += revenue - supplierCost - shippingCost - gatewayFees;
    }

    return Array.from(map.values());
  }, [orders, productMap, range, selectedStoreId, stores]);

  const barMax = Math.max(1, ...allMetrics.map((metric) => metric.revenue));
  const chartWidth = 720;
  const chartHeight = 220;
  const revenuePath = lineChartPath(dailySeries, "revenue", chartWidth, chartHeight);
  const profitPath = lineChartPath(dailySeries, "profit", chartWidth, chartHeight);
  const hasFinancialData = totals.revenue > 0 || totals.orders > 0;

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 dark:bg-[#0b0f14] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <BarChart3 size={17} />
              Store analytics
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Store Performance
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Compare revenue, operating costs and net profit across every store from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <StoreIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <select
                value={selectedStoreId}
                onChange={(event) => setSelectedStoreId(event.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-semibold text-slate-800 outline-none ring-0 dark:border-white/[0.08] dark:bg-[#11151b] dark:text-white"
              >
                <option value="all">All stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>

            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 dark:border-white/[0.08] dark:bg-[#11151b]">
              {(["7", "30", "90"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRange(value)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                    range === value
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {value}d
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 transition hover:border-slate-300 dark:border-white/[0.08] dark:bg-[#11151b] dark:text-white"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Gross revenue"
            value={formatMoney(totals.revenue, selectedCurrency)}
            detail={`${totals.orders} completed orders in ${range} days`}
            icon={<DollarSign size={20} />}
          />
          <MetricCard
            title="Supplier COGS"
            value={formatMoney(totals.supplierCost, selectedCurrency)}
            detail="Product acquisition cost"
            icon={<Package size={20} />}
          />
          <MetricCard
            title="Shipping fees"
            value={formatMoney(totals.shippingCost, selectedCurrency)}
            detail="Order shipping cost"
            icon={<ShoppingBag size={20} />}
          />
          <MetricCard
            title="Gateway fees"
            value={formatMoney(totals.gatewayFees, selectedCurrency)}
            detail="Payment / transaction fees"
            icon={<WalletCards size={20} />}
          />
          <MetricCard
            title="Net profit"
            value={formatMoney(totals.profit, selectedCurrency)}
            detail={`Net margin ${formatPercent(totalMargin)}`}
            icon={<CircleDollarSign size={20} />}
            positive={totals.profit >= 0}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#11151b]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">Revenue by store</h2>
                <p className="text-sm text-slate-500">Gross revenue generated by each store.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <TrendingUp size={15} />
                {range}-day window
              </div>
            </div>

            {loading ? (
              <div className="mt-6 grid h-72 place-items-center text-sm text-slate-400">Loading store performance…</div>
            ) : allMetrics.length === 0 ? (
              <div className="mt-6 grid h-72 place-items-center rounded-2xl bg-slate-50 text-center dark:bg-white/[0.03]">
                <div>
                  <StoreIcon className="mx-auto text-slate-300" size={34} />
                  <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No store performance data yet</p>
                  <p className="mt-1 max-w-sm text-xs text-slate-500">
                    Completed orders will appear here automatically once your stores start receiving sales.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                {allMetrics.map((metric) => (
                  <Bar
                    key={metric.store.id}
                    label={metric.store.name}
                    value={metric.revenue}
                    revenue={metric.revenue}
                    max={barMax}
                    currency={metric.store.currency || selectedCurrency}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#11151b]">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Store profit comparison</h2>
              <p className="text-sm text-slate-500">Revenue minus supplier, shipping and gateway costs.</p>
            </div>

            <div className="mt-5 space-y-4">
              {allMetrics.length === 0 && !loading ? (
                <p className="py-16 text-center text-sm text-slate-400">Nothing to compare yet.</p>
              ) : (
                allMetrics.map((metric) => (
                  <div key={metric.store.id} className="rounded-xl border border-slate-100 p-4 dark:border-white/[0.06]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{metric.store.name}</p>
                        <p className="mt-1 text-xs text-slate-400">{metric.orders} orders</p>
                      </div>
                      <p className={`text-sm font-bold ${metric.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {formatMoney(metric.profit, metric.store.currency || selectedCurrency)}
                      </p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-slate-900 transition-all duration-500 dark:bg-white"
                        style={{ width: `${Math.min(100, Math.max(0, metric.margin))}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Net margin</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{formatPercent(metric.margin)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#11151b]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Revenue vs profit</h2>
              <p className="text-sm text-slate-500">Daily margin spread across the selected performance period.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full bg-slate-950 dark:bg-white" /> Revenue
              </span>
              <span className="inline-flex items-center gap-2 text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Net profit
              </span>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[720px]">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-72 w-full overflow-visible" role="img" aria-label="Revenue versus profit line chart">
                <path d={`M 0 40 H ${chartWidth}`} stroke="currentColor" className="text-slate-100 dark:text-white/[0.06]" />
                <path d={`M 0 110 H ${chartWidth}`} stroke="currentColor" className="text-slate-100 dark:text-white/[0.06]" />
                <path d={`M 0 180 H ${chartWidth}`} stroke="currentColor" className="text-slate-100 dark:text-white/[0.06]" />
                <path d={revenuePath} fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-950 dark:text-white" />
                <path d={profitPath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-1 grid grid-cols-6 text-xs text-slate-400">
                {dailySeries.filter((_, index) => {
                  const step = Math.max(1, Math.floor(dailySeries.length / 5));
                  return index % step === 0 || index === dailySeries.length - 1;
                }).slice(0, 6).map((point, index) => (
                  <span key={`${point.label}-${index}`} className="truncate">{point.label}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#11151b]">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">Store financial breakdown</h2>
                <p className="text-sm text-slate-500">The inputs behind each store's net profit.</p>
              </div>
              <div className="hidden items-center gap-2 text-xs font-semibold text-slate-400 sm:flex">
                <WalletCards size={15} />
                Financial view
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-400 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-5 py-3">Store</th>
                  <th className="px-5 py-3">Orders</th>
                  <th className="px-5 py-3">Revenue</th>
                  <th className="px-5 py-3">Supplier cost</th>
                  <th className="px-5 py-3">Shipping</th>
                  <th className="px-5 py-3">Gateway</th>
                  <th className="px-5 py-3">Net profit</th>
                  <th className="px-5 py-3">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {allMetrics.map((metric) => (
                  <tr key={metric.store.id} className="text-sm">
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{metric.store.name}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{metric.orders}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                      {formatMoney(metric.revenue, metric.store.currency || selectedCurrency)}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {formatMoney(metric.supplierCost, metric.store.currency || selectedCurrency)}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {formatMoney(metric.shippingCost, metric.store.currency || selectedCurrency)}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {formatMoney(metric.gatewayFees, metric.store.currency || selectedCurrency)}
                    </td>
                    <td className={`px-5 py-4 font-bold ${metric.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {formatMoney(metric.profit, metric.store.currency || selectedCurrency)}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-200">{formatPercent(metric.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {!loading && !hasFinancialData && stores.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm dark:border-white/[0.08] dark:bg-[#11151b]">
            Store Performance is connected to the existing stores, products and orders APIs. Because there are no completed financial records in the current data source, the charts remain empty instead of inventing numbers.
          </div>
        )}
      </div>
    </div>
  );
}
