import {
  ChevronDown,
  ChevronRight,
  Mail,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  Globe2,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomerSummary } from "../../types/admin";
import { getCustomers } from "../../services/adminApi";
import { formatCurrency } from "../../utils/currency";
import { useToast } from "../../components/admin/Toast";

type CustomerFilter =
  | "all"
  | "new"
  | "returning"
  | "one-time";

function formatDate(dateStr: string) {
  if (!dateStr) return "—";

  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function isNewCustomer(firstOrderAt: string) {
  if (!firstOrderAt) return false;

  const thirtyDaysAgo =
    Date.now() - 30 * 24 * 60 * 60 * 1000;

  return (
    new Date(firstOrderAt).getTime() >
    thirtyDaysAgo
  );
}

function getInitials(name: string) {
  const value = name.trim();

  if (!value) return "CU";

  const parts = value.split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase();
}

function CustomerBadge({
  customer,
}: {
  customer: CustomerSummary;
}) {
  const orderCount = Number(
    customer.order_count || 0,
  );

  const isReturning = orderCount > 1;
  const isNew = isNewCustomer(
    customer.first_order_at,
  );

  if (isReturning) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
        Returning
      </span>
    );
  }

  if (isNew) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        New
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
      One-time
    </span>
  );
}

export default function Customers() {
  const { addToast } = useToast();

  const [customers, setCustomers] = useState<
    CustomerSummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] =
    useState<CustomerFilter>("all");
  const [sortBy, setSortBy] = useState<
    "recent" | "spend" | "orders" | "name"
  >("recent");
  const [expandedCustomer, setExpandedCustomer] =
    useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getCustomers();

      setCustomers(result);
    } catch (err) {
      console.error(err);
      addToast(
        "Unable to load customers.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const stats = useMemo(() => {
    const totalSpend = customers.reduce(
      (sum, customer) =>
        sum + Number(customer.total_spend || 0),
      0,
    );

    const totalOrders = customers.reduce(
      (sum, customer) =>
        sum + Number(customer.order_count || 0),
      0,
    );

    const newCustomers = customers.filter(
      (customer) =>
        isNewCustomer(customer.first_order_at),
    ).length;

    const returningCustomers = customers.filter(
      (customer) =>
        Number(customer.order_count || 0) > 1,
    ).length;

    const oneTimeCustomers = customers.filter(
      (customer) =>
        Number(customer.order_count || 0) <= 1,
    ).length;

    const countries = new Set(
      customers
        .map((customer) => customer.country)
        .filter(Boolean),
    ).size;

    const averageSpend =
      customers.length > 0
        ? totalSpend / customers.length
        : 0;

    const averageOrders =
      customers.length > 0
        ? totalOrders / customers.length
        : 0;

    const returningRate =
      customers.length > 0
        ? (returningCustomers / customers.length) *
          100
        : 0;

    return {
      total: customers.length,
      newCustomers,
      returningCustomers,
      oneTimeCustomers,
      totalOrders,
      totalSpend,
      averageSpend,
      averageOrders,
      countries,
      returningRate,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = customers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.customer_name
          .toLowerCase()
          .includes(query) ||
        customer.customer_email
          .toLowerCase()
          .includes(query) ||
        String(customer.country || "")
          .toLowerCase()
          .includes(query);

      const orderCount = Number(
        customer.order_count || 0,
      );

      const newCustomer = isNewCustomer(
        customer.first_order_at,
      );

      const matchesFilter =
        customerFilter === "all" ||
        (customerFilter === "new" &&
          newCustomer) ||
        (customerFilter === "returning" &&
          orderCount > 1) ||
        (customerFilter === "one-time" &&
          orderCount <= 1);

      return matchesSearch && matchesFilter;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "spend") {
        return (
          Number(b.total_spend || 0) -
          Number(a.total_spend || 0)
        );
      }

      if (sortBy === "orders") {
        return (
          Number(b.order_count || 0) -
          Number(a.order_count || 0)
        );
      }

      if (sortBy === "name") {
        return a.customer_name.localeCompare(
          b.customer_name,
        );
      }

      return (
        new Date(
          b.last_order_at || 0,
        ).getTime() -
        new Date(
          a.last_order_at || 0,
        ).getTime()
      );
    });
  }, [
    customers,
    search,
    customerFilter,
    sortBy,
  ]);

  const clearFilters = () => {
    setSearch("");
    setCustomerFilter("all");
    setSortBy("recent");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Audience
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Customers
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                View and understand the people who
                purchase from your store.
              </p>
            </div>

            <button
              type="button"
              onClick={loadCustomers}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={16}
                className={
                  loading ? "animate-spin" : ""
                }
              />
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<Users size={19} />}
            title="Total customers"
            value={
              loading
                ? "..."
                : stats.total.toLocaleString()
            }
          />

          <StatCard
            icon={<UserPlus size={19} />}
            title="New customers"
            value={
              loading
                ? "..."
                : stats.newCustomers.toLocaleString()
            }
            description="Last 30 days"
          />

          <StatCard
            icon={<TrendingUp size={19} />}
            title="Returning"
            value={
              loading
                ? "..."
                : stats.returningCustomers.toLocaleString()
            }
            description={
              loading
                ? undefined
                : `${stats.returningRate.toFixed(
                    0,
                  )}% of customers`
            }
          />

          <StatCard
            icon={<ShoppingBag size={19} />}
            title="Orders"
            value={
              loading
                ? "..."
                : stats.totalOrders.toLocaleString()
            }
            description={
              loading
                ? undefined
                : `${stats.averageOrders.toFixed(
                    1,
                  )} avg. per customer`
            }
          />

          <StatCard
            icon={<DollarSign size={19} />}
            title="Customer spend"
            value={
              loading
                ? "..."
                : formatCurrency(
                    stats.totalSpend,
                    "USD",
                  )
            }
            description={
              loading
                ? undefined
                : `Avg. ${formatCurrency(
                    stats.averageSpend,
                    "USD",
                  )}`
            }
          />
        </div>

        {/* Customer insights */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <InsightCard
            icon={<UserPlus size={18} />}
            title="New customers"
            description="First purchase within the last 30 days"
            value={
              loading
                ? "..."
                : stats.newCustomers.toLocaleString()
            }
            detail={
              stats.total > 0
                ? `${(
                    (stats.newCustomers /
                      stats.total) *
                    100
                  ).toFixed(0)}% of customer base`
                : "0% of customer base"
            }
            iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />

          <InsightCard
            icon={<RefreshCw size={18} />}
            title="Returning customers"
            description="Customers with more than one order"
            value={
              loading
                ? "..."
                : stats.returningCustomers.toLocaleString()
            }
            detail={`${stats.returningRate.toFixed(
              0,
            )}% returning rate`}
            iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />

          <InsightCard
            icon={<Globe2 size={18} />}
            title="Customer reach"
            description="Countries represented in your customer base"
            value={
              loading
                ? "..."
                : stats.countries.toLocaleString()
            }
            detail="Countries"
            iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
        </div>

        {/* Directory */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="font-bold">
                  Customer directory
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {loading
                    ? "Loading customers..."
                    : `${filteredCustomers.length} of ${customers.length} customers`}
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-950 md:w-[330px]">
                  <Search
                    size={17}
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search customers..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearch("")
                      }
                      className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <select
                    value={customerFilter}
                    onChange={(event) =>
                      setCustomerFilter(
                        event.target.value as CustomerFilter,
                      )
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium outline-none dark:border-slate-700 dark:bg-slate-950 md:w-[180px]"
                  >
                    <option value="all">
                      All customers
                    </option>
                    <option value="new">
                      New customers
                    </option>
                    <option value="returning">
                      Returning
                    </option>
                    <option value="one-time">
                      One-time
                    </option>
                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(
                        event.target.value as
                          | "recent"
                          | "spend"
                          | "orders"
                          | "name",
                      )
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium outline-none dark:border-slate-700 dark:bg-slate-950 md:w-[170px]"
                  >
                    <option value="recent">
                      Most recent
                    </option>
                    <option value="spend">
                      Highest spend
                    </option>
                    <option value="orders">
                      Most orders
                    </option>
                    <option value="name">
                      Name
                    </option>
                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </div>

            {(search ||
              customerFilter !== "all" ||
              sortBy !== "recent") && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  Filters active
                </span>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-slate-900 hover:underline dark:text-white"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <LoadingState />
          ) : filteredCustomers.length === 0 ? (
            <EmptyState
              hasCustomers={customers.length > 0}
              clearFilters={clearFilters}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/60">
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-6 py-4">
                      Customer
                    </th>
                    <th className="px-6 py-4">
                      Location
                    </th>
                    <th className="px-6 py-4">
                      Orders
                    </th>
                    <th className="px-6 py-4">
                      Spend
                    </th>
                    <th className="px-6 py-4">
                      Customer type
                    </th>
                    <th className="px-6 py-4">
                      Last order
                    </th>
                    <th className="w-10 px-4" />
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map(
                    (customer) => {
                      const orderCount = Number(
                        customer.order_count || 0,
                      );

                      const spend = Number(
                        customer.total_spend || 0,
                      );

                      const customerKey =
                        customer.customer_email;

                      const expanded =
                        expandedCustomer ===
                        customerKey;

                      return (
                        <>
                          <tr
                            key={customerKey}
                            onClick={() =>
                              setExpandedCustomer(
                                expanded
                                  ? null
                                  : customerKey,
                              )
                            }
                            className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                  {getInitials(
                                    customer.customer_name ||
                                      "",
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-[250px] truncate text-sm font-semibold">
                                    {customer.customer_name ||
                                      "Unnamed customer"}
                                  </p>

                                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <Mail
                                      size={12}
                                    />
                                    <span className="max-w-[250px] truncate">
                                      {
                                        customer.customer_email
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <p className="text-sm font-medium">
                                {customer.country ||
                                  "—"}
                              </p>

                              {customer.first_order_at && (
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  Since{" "}
                                  {formatDate(
                                    customer.first_order_at,
                                  )}
                                </p>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <span className="inline-flex min-w-9 justify-center rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold dark:bg-slate-800">
                                {orderCount}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <p className="text-sm font-semibold">
                                {formatCurrency(
                                  spend,
                                  "USD",
                                )}
                              </p>

                              {orderCount > 0 && (
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {formatCurrency(
                                    spend /
                                      orderCount,
                                    "USD",
                                  )}{" "}
                                  / order
                                </p>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <CustomerBadge
                                customer={
                                  customer
                                }
                              />
                            </td>

                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                {formatDate(
                                  customer.last_order_at,
                                )}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <ChevronRight
                                size={17}
                                className={`text-slate-400 transition-transform ${
                                  expanded
                                    ? "rotate-90"
                                    : ""
                                }`}
                              />
                            </td>
                          </tr>

                          {expanded && (
                            <tr
                              key={`${customerKey}-details`}
                              className="border-t border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40"
                            >
                              <td
                                colSpan={7}
                                className="px-6 py-5"
                              >
                                <div className="grid gap-4 md:grid-cols-4">
                                  <MiniDetail
                                    label="First order"
                                    value={formatDate(
                                      customer.first_order_at,
                                    )}
                                  />

                                  <MiniDetail
                                    label="Last order"
                                    value={formatDate(
                                      customer.last_order_at,
                                    )}
                                  />

                                  <MiniDetail
                                    label="Total orders"
                                    value={orderCount.toLocaleString()}
                                  />

                                  <MiniDetail
                                    label="Lifetime spend"
                                    value={formatCurrency(
                                      spend,
                                      "USD",
                                    )}
                                  />
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {icon}
      </div>

      <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
        {title}
      </p>

      <p className="mt-1.5 text-2xl font-bold tracking-tight">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}

function InsightCard({
  icon,
  title,
  description,
  value,
  detail,
  iconClass,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string;
  detail: string;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <p className="text-2xl font-bold">
          {value}
        </p>

        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {detail}
        </p>
      </div>
    </div>
  );
}

function MiniDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />

        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Loading customers...
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  hasCustomers,
  clearFilters,
}: {
  hasCustomers: boolean;
  clearFilters: () => void;
}) {
  return (
    <div className="p-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <Users
          size={27}
          className="text-slate-400"
        />
      </div>

      <h3 className="mt-4 font-semibold">
        {hasCustomers
          ? "No customers match your filters"
          : "No customers yet"}
      </h3>

      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {hasCustomers
          ? "Try changing your search or customer filters."
          : "Customers will automatically appear after their first purchase."}
      </p>

      {hasCustomers && (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}