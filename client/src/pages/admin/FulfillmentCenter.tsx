import {
  CheckCircle2,
  Clock3,
  Globe2,
  Package,
  PackageCheck,
  Search,
  Truck,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Order } from "../../types/order";
import type { FulfillmentMode, PaymentMethod } from "../../types/fulfillment";
import {
  getFulfillmentLabel,
  getFulfillmentLane,
  getPaymentMethodLabel,
} from "../../types/fulfillment";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

type AdminOrder = Order & {
  fulfillment_mode?: FulfillmentMode | "mixed" | "unset" | null;
  payment_method?: PaymentMethod | null;
};

type Lane = "local" | "international";

function readFulfillmentMode(order: AdminOrder): Exclude<FulfillmentMode, "unset"> | "unset" {
  if (order.fulfillment_mode) {
    return order.fulfillment_mode;
  }

  return "unset";
}

function statusLabel(status: Order["order_status"]): string {
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
      return status;
  }
}

function statusTone(status: Order["order_status"]): string {
  switch (status) {
    case "delivered":
      return "bg-emerald-50 text-emerald-700";
    case "shipped":
    case "supplier_ordered":
      return "bg-blue-50 text-blue-700";
    case "payment_confirmed":
    case "ready_to_fulfill":
      return "bg-amber-50 text-amber-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function money(value: number, currency: string): string {
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

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
          {icon}
        </div>
        <span className="text-2xl font-bold text-slate-950">{value}</span>
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

export default function FulfillmentCenter() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [activeLane, setActiveLane] = useState<Lane>("local");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/admin/orders`);
        const result = (await response.json()) as {
          success?: boolean;
          data?: AdminOrder[];
          error?: string;
        };

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to load orders.");
        }

        if (active) {
          setOrders(Array.isArray(result.data) ? result.data : []);
        }
      } catch (requestError) {
        console.error("Failed to load fulfillment orders:", requestError);

        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load orders.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  const laneOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const mode = readFulfillmentMode(order);
      const lane = getFulfillmentLane(mode);

      const matchesLane = lane === activeLane || lane === "mixed";
      if (!matchesLane) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        order.id.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_email.toLowerCase().includes(query) ||
        order.country.toLowerCase().includes(query) ||
        getFulfillmentLabel(mode).toLowerCase().includes(query)
      );
    });
  }, [activeLane, orders, search]);

  const metrics = useMemo(() => {
    const localOrders = orders.filter(
      (order) => {
        const lane = getFulfillmentLane(readFulfillmentMode(order));
        return lane === "local" || lane === "mixed";
      },
    );

    const internationalOrders = orders.filter(
      (order) => {
        const lane = getFulfillmentLane(readFulfillmentMode(order));
        return lane === "international" || lane === "mixed";
      },
    );

    const codOrders = orders.filter(
      (order) => order.payment_method === "cod",
    );

    const readyOrders = orders.filter(
      (order) => order.order_status === "ready_to_fulfill",
    );

    const inTransitOrders = orders.filter(
      (order) => order.order_status === "shipped",
    );

    return {
      localOrders: localOrders.length,
      internationalOrders: internationalOrders.length,
      codOrders: codOrders.length,
      readyOrders: readyOrders.length,
      inTransitOrders: inTransitOrders.length,
    };
  }, [orders]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Operations
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Fulfillment Center
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Run your local ecommerce and international dropshipping orders from separate operational lanes.
          </p>
        </div>

        <div className="flex w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveLane("local")}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
              activeLane === "local"
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Truck size={17} />
            Local Commerce
          </button>
          <button
            type="button"
            onClick={() => setActiveLane("international")}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
              activeLane === "international"
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Globe2 size={17} />
            International Dropshipping
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={<Truck size={20} />}
          label="Local orders"
          value={metrics.localOrders}
          description="Orders assigned to the local fulfillment lane."
        />
        <StatCard
          icon={<Globe2 size={20} />}
          label="International orders"
          value={metrics.internationalOrders}
          description="Orders that require international supplier fulfillment."
        />
        <StatCard
          icon={<WalletCards size={20} />}
          label="COD orders"
          value={metrics.codOrders}
          description="Orders waiting for cash-on-delivery collection."
        />
        <StatCard
          icon={<Clock3 size={20} />}
          label="Ready to fulfill"
          value={metrics.readyOrders}
          description="Orders that have cleared their next fulfillment gate."
        />
        <StatCard
          icon={<PackageCheck size={20} />}
          label="In transit"
          value={metrics.inTransitOrders}
          description="Orders currently marked as shipped."
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {activeLane === "local"
                ? "Local fulfillment queue"
                : "International dropshipping queue"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeLane === "local"
                ? "Prepare supplier or stocked orders for Nigerian delivery, including COD."
                : "Handle prepaid orders, supplier purchasing and international shipping."
              }
            </p>
          </div>

          <div className="relative w-full lg:w-80">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, customer or mode..."
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>
        </div>

        {loading && (
          <div className="p-12 text-center">
            <Package size={38} className="mx-auto text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">Loading fulfillment orders...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && laneOrders.length === 0 && (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              {activeLane === "local" ? <Truck size={24} /> : <Globe2 size={24} />}
            </div>
            <h3 className="mt-5 text-base font-semibold text-slate-900">
              No {activeLane === "local" ? "local" : "international"} fulfillment orders yet
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Orders will appear here once products are assigned to this fulfillment model.
            </p>
          </div>
        )}

        {!loading && !error && laneOrders.length > 0 && (
          <div className="divide-y divide-slate-100">
            {laneOrders.map((order) => {
              const mode = readFulfillmentMode(order);

              return (
                <article key={order.id} className="p-5 transition hover:bg-slate-50/70">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-950">{order.id}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {getFulfillmentLabel(mode)}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(order.order_status)}`}>
                          {statusLabel(order.order_status)}
                        </span>
                      </div>

                      <p className="mt-2 truncate text-sm font-medium text-slate-800">
                        {order.customer_name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {order.customer_email} · {order.country}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4 lg:min-w-[520px] lg:grid-cols-4">
                      <div>
                        <p className="text-xs text-slate-400">Payment</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {getPaymentMethodLabel(order.payment_method)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Total</p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {money(order.total, order.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Supplier</p>
                        <p className="mt-1 truncate font-semibold text-slate-800">
                          {order.supplier_name || "Not assigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Tracking</p>
                        <p className="mt-1 truncate font-semibold text-slate-800">
                          {order.tracking_number || "Not shipped"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    {order.order_status === "delivered" ? (
                      <CheckCircle2 size={15} className="text-emerald-600" />
                    ) : (
                      <Clock3 size={15} />
                    )}
                    <span>
                      Created {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
