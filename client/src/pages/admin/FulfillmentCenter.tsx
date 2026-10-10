import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Globe2,
  Link2,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { apiGet, getAdminProducts } from "../../services/adminApi";
import type { Product } from "../../types/product";

type OrderStatus =
  | "payment_pending"
  | "payment_confirmed"
  | "settlement_pending"
  | "ready_to_fulfill"
  | "supplier_ordered"
  | "shipped"
  | "delivered"
  | "cancelled"
  | string;

type AdminOrder = {
  id: string;
  customer_name: string;
  customer_email: string;
  country: string;
  currency: string;
  total: number;
  order_status: OrderStatus;
  created_at: string;
  supplier_name?: string | null;
  tracking_number?: string | null;
};

type SupplierSummary = {
  name: string;
  products: number;
  activeProducts: number;
  stockUnits: number;
  pendingOrders: number;
  supplierCost: number;
};

type SupplierFilter = "all" | "assigned" | "unassigned";

function money(value: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  } catch {
    return `${currency || "USD"} ${(Number(value) || 0).toFixed(2)}`;
  }
}

function orderNeedsSupplierAction(order: AdminOrder): boolean {
  if (order.order_status === "cancelled" || order.order_status === "delivered") {
    return false;
  }

  return (
    order.order_status === "payment_confirmed" ||
    order.order_status === "settlement_pending" ||
    order.order_status === "ready_to_fulfill"
  );
}

function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "payment_pending":
      return "Payment pending";
    case "payment_confirmed":
      return "Payment confirmed";
    case "settlement_pending":
      return "Settlement pending";
    case "ready_to_fulfill":
      return "Ready to fulfill";
    case "supplier_ordered":
      return "Supplier ordered";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return status.replace(/_/g, " ");
  }
}

function orderStatusTone(status: OrderStatus): string {
  switch (status) {
    case "supplier_ordered":
    case "shipped":
      return "bg-blue-50 text-blue-700";
    case "payment_confirmed":
    case "ready_to_fulfill":
      return "bg-amber-50 text-amber-700";
    case "delivered":
      return "bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>
        <span className="text-2xl font-black tracking-tight text-slate-950">
          {value}
        </span>
      </div>

      <p className="mt-5 text-sm font-bold text-slate-900">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}

export default function FulfillmentCenter() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeView, setActiveView] = useState<
    "suppliers" | "queue" | "integrations"
  >("suppliers");
  const [supplierFilter, setSupplierFilter] =
    useState<SupplierFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [orderResult, productResult] = await Promise.all([
        apiGet<AdminOrder[]>("/admin/orders"),
        getAdminProducts(),
      ]);

      setOrders(Array.isArray(orderResult) ? orderResult : []);
      setProducts(Array.isArray(productResult) ? productResult : []);
    } catch (requestError) {
      console.error("Failed to load supplier operations:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load supplier operations.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const suppliers = useMemo<SupplierSummary[]>(() => {
    const supplierMap = new Map<string, SupplierSummary>();

    for (const product of products) {
      const supplierName = product.supplier_name?.trim();

      if (!supplierName) {
        continue;
      }

      const existing = supplierMap.get(supplierName);

      if (existing) {
        existing.products += 1;
        existing.activeProducts += product.active ? 1 : 0;
        existing.stockUnits += Number(product.stock) || 0;
        existing.supplierCost +=
          (Number(product.supplier_cost) || 0) *
          (Number(product.stock) || 0);
      } else {
        supplierMap.set(supplierName, {
          name: supplierName,
          products: 1,
          activeProducts: product.active ? 1 : 0,
          stockUnits: Number(product.stock) || 0,
          supplierCost:
            (Number(product.supplier_cost) || 0) *
            (Number(product.stock) || 0),
          pendingOrders: 0,
        });
      }
    }

    for (const order of orders) {
      const supplierName = order.supplier_name?.trim();

      if (!supplierName) {
        continue;
      }

      const supplier = supplierMap.get(supplierName);

      if (supplier && orderNeedsSupplierAction(order)) {
        supplier.pendingOrders += 1;
      }
    }

    return Array.from(supplierMap.values()).sort((a, b) => {
      if (b.pendingOrders !== a.pendingOrders) {
        return b.pendingOrders - a.pendingOrders;
      }

      return a.name.localeCompare(b.name);
    });
  }, [orders, products]);

  const supplierProductsWithoutSupplier = useMemo(
    () =>
      products.filter(
        (product) => !product.supplier_name?.trim(),
      ).length,
    [products],
  );

  const supplierAssignedProducts = useMemo(
    () =>
      products.filter((product) => Boolean(product.supplier_name?.trim()))
        .length,
    [products],
  );

  const pendingSupplierOrders = useMemo(
    () => orders.filter(orderNeedsSupplierAction),
    [orders],
  );

  const ordersWithoutSupplier = useMemo(
    () =>
      pendingSupplierOrders.filter(
        (order) => !order.supplier_name?.trim(),
      ).length,
    [pendingSupplierOrders],
  );

  const ordersWithSupplier = useMemo(
    () =>
      pendingSupplierOrders.filter((order) =>
        Boolean(order.supplier_name?.trim()),
      ).length,
    [pendingSupplierOrders],
  );

  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        !query || supplier.name.toLowerCase().includes(query);

      if (!matchesSearch) {
        return false;
      }

      if (supplierFilter === "assigned") {
        return supplier.products > 0;
      }

      return true;
    });
  }, [search, supplierFilter, suppliers]);

  const filteredQueue = useMemo(() => {
    const query = search.trim().toLowerCase();

    return pendingSupplierOrders.filter((order) => {
      if (!query) {
        return true;
      }

      return (
        order.id.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_email.toLowerCase().includes(query) ||
        order.country.toLowerCase().includes(query) ||
        (order.supplier_name || "").toLowerCase().includes(query)
      );
    });
  }, [pendingSupplierOrders, search]);

  const inventorySupplierCost = useMemo(
    () =>
      products.reduce(
        (total, product) =>
          total +
          (Number(product.supplier_cost) || 0) *
            (Number(product.stock) || 0),
        0,
      ),
    [products],
  );

  function changeView(
    view: "suppliers" | "queue" | "integrations",
  ) {
    setActiveView(view);
    setSearch("");
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Global Ecommerce · Operations
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Suppliers & fulfillment
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage the supplier side of your global store without duplicating
            order, shipping or inventory management.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData(true)}
          disabled={loading || refreshing}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={<Users size={20} />}
          label="Suppliers"
          value={String(suppliers.length)}
          description="Suppliers currently assigned to products."
        />

        <StatCard
          icon={<Package size={20} />}
          label="Supplier products"
          value={String(supplierAssignedProducts)}
          description="Products with a supplier assigned."
        />

        <StatCard
          icon={<Clock3 size={20} />}
          label="Supplier queue"
          value={String(pendingSupplierOrders.length)}
          description="Paid or ready orders requiring supplier action."
        />

        <StatCard
          icon={<AlertCircle size={20} />}
          label="Needs assignment"
          value={String(ordersWithoutSupplier)}
          description="Orders that need a supplier before processing."
        />

        <StatCard
          icon={<WalletCards size={20} />}
          label="Inventory supplier cost"
          value={money(inventorySupplierCost)}
          description="Supplier cost represented by current product stock."
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Unable to load supplier operations</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row">
        <button
          type="button"
          onClick={() => changeView("suppliers")}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
            activeView === "suppliers"
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Users size={17} />
          Suppliers
        </button>

        <button
          type="button"
          onClick={() => changeView("queue")}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
            activeView === "queue"
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <PackageCheck size={17} />
          Supplier queue
          {pendingSupplierOrders.length > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                activeView === "queue"
                  ? "bg-white/15 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {pendingSupplierOrders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => changeView("integrations")}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
            activeView === "integrations"
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Link2 size={17} />
          Integrations
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-slate-300"
            />
            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading supplier operations...
            </p>
          </div>
        </div>
      ) : (
        <>
          {activeView === "suppliers" && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                eyebrow="Supplier directory"
                title="Your suppliers"
                description="This list is built from the suppliers already assigned to your real products. No demo suppliers are created."
                action={
                  <div className="relative w-full lg:w-80">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search suppliers..."
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                    />
                  </div>
                }
              />

              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={() => setSupplierFilter("all")}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    supplierFilter === "all"
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  All suppliers
                </button>

                <button
                  type="button"
                  onClick={() => setSupplierFilter("assigned")}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    supplierFilter === "assigned"
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Assigned
                </button>

                <span className="ml-auto text-xs text-slate-400">
                  {suppliers.length} supplier
                  {suppliers.length === 1 ? "" : "s"}
                </span>
              </div>

              {filteredSuppliers.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <Users size={24} className="text-slate-400" />
                  </div>

                  <h3 className="mt-5 text-base font-bold text-slate-900">
                    No suppliers found
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Suppliers will appear here when products have a supplier
                    assigned.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier.name}
                      className="p-5 transition hover:bg-slate-50/60 sm:p-6"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
                            {supplier.name
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase())
                              .join("") || "S"}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-black text-slate-950">
                              {supplier.name}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {supplier.products} product
                              {supplier.products === 1 ? "" : "s"} assigned
                              {supplier.pendingOrders > 0
                                ? ` · ${supplier.pendingOrders} pending supplier action`
                                : ""}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 xl:min-w-[650px]">
                          <div>
                            <p className="text-[11px] font-medium text-slate-400">
                              Active products
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {supplier.activeProducts}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] font-medium text-slate-400">
                              Stock units
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {supplier.stockUnits.toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] font-medium text-slate-400">
                              Supplier cost
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {money(supplier.supplierCost)}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] font-medium text-slate-400">
                              Pending
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {supplier.pendingOrders}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {supplierProductsWithoutSupplier > 0 && (
                <div className="flex items-start gap-3 border-t border-amber-100 bg-amber-50 px-5 py-4 sm:px-6">
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                  <div>
                    <p className="text-sm font-bold text-amber-900">
                      {supplierProductsWithoutSupplier} product
                      {supplierProductsWithoutSupplier === 1 ? "" : "s"} have no
                      supplier assigned
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      Assign suppliers from the product management workflow.
                      This page only monitors supplier operations.
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeView === "queue" && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                eyebrow="Supplier operations"
                title="Supplier action queue"
                description="Only orders that may require supplier action are shown here. Full order management remains in Orders."
                action={
                  <div className="relative w-full lg:w-80">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search order or supplier..."
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                    />
                  </div>
                }
              />

              <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-5 sm:grid-cols-3 sm:p-6">
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Needs supplier</p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {ordersWithoutSupplier}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Supplier assigned</p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {ordersWithSupplier}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Queue total</p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {pendingSupplierOrders.length}
                  </p>
                </div>
              </div>

              {filteredQueue.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                    <CheckCircle2
                      size={25}
                      className="text-emerald-600"
                    />
                  </div>

                  <h3 className="mt-5 text-base font-bold text-slate-900">
                    Supplier queue is clear
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    No current orders require supplier action.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredQueue.map((order) => {
                    const hasSupplier = Boolean(
                      order.supplier_name?.trim(),
                    );
                    const hasTracking = Boolean(
                      order.tracking_number?.trim(),
                    );

                    return (
                      <article
                        key={order.id}
                        className="p-5 transition hover:bg-slate-50/60 sm:p-6"
                      >
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-black text-slate-950">
                                {order.id}
                              </span>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${orderStatusTone(
                                  order.order_status,
                                )}`}
                              >
                                {orderStatusLabel(order.order_status)}
                              </span>

                              {!hasSupplier && (
                                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
                                  Supplier required
                                </span>
                              )}
                            </div>

                            <p className="mt-2 text-sm font-semibold text-slate-800">
                              {order.customer_name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {order.customer_email} · {order.country}
                            </p>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[600px]">
                            <div>
                              <p className="text-[11px] text-slate-400">
                                Supplier
                              </p>
                              <p className="mt-1 truncate text-sm font-bold text-slate-900">
                                {order.supplier_name || "Not assigned"}
                              </p>
                            </div>

                            <div>
                              <p className="text-[11px] text-slate-400">
                                Order value
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-900">
                                {money(order.total, order.currency)}
                              </p>
                            </div>

                            <div>
                              <p className="text-[11px] text-slate-400">
                                Tracking
                              </p>
                              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900">
                                {hasTracking ? (
                                  <>
                                    <Truck
                                      size={14}
                                      className="text-emerald-600"
                                    />
                                    Added
                                  </>
                                ) : (
                                  <>
                                    <Clock3
                                      size={14}
                                      className="text-slate-400"
                                    />
                                    Not available
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                          <span>
                            Created{" "}
                            {new Date(order.created_at).toLocaleString()}
                          </span>

                          {hasTracking && (
                            <span>
                              Tracking: {order.tracking_number}
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1.5">
                            <Globe2 size={13} />
                            Global order
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeView === "integrations" && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <SectionHeader
                eyebrow="Supplier connections"
                title="Supplier integrations"
                description="Optional connections for the future. Nothing is connected automatically and no specific supplier is assumed."
              />

              <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                    <Link2 size={20} />
                  </div>

                  <h3 className="mt-5 font-black text-slate-950">
                    Custom supplier API
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Connect a supplier later using its own API, order
                    endpoint, inventory feed or other supported connection.
                  </p>

                  <span className="mt-5 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                    Not connected
                  </span>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
                    <Package size={20} />
                  </div>

                  <h3 className="mt-5 font-black text-slate-950">
                    Supplier order automation
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Future automation can send eligible paid orders to a
                    connected supplier without changing your normal Orders
                    workflow.
                  </p>

                  <span className="mt-5 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                    Future feature
                  </span>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
                    <Truck size={20} />
                  </div>

                  <h3 className="mt-5 font-black text-slate-950">
                    Shipment synchronization
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Future supplier connections can return shipment and
                    tracking information when the supplier actually provides
                    it.
                  </p>

                  <span className="mt-5 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                    Future feature
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
                <p className="text-xs leading-5 text-slate-500">
                  This section intentionally does not assume CJ, AliExpress,
                  Spocket, or any other supplier. A specific integration can
                  be added later when you decide which supplier or supplier
                  API you actually want to use.
                </p>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}