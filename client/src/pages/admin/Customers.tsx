import {
  Mail,
  Search,
  UserRound,
  Users,
  ShoppingBag,
  DollarSign,
  UserPlus,
  RefreshCw,
  TrendingUp,
  Globe2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomerSummary } from "../../types/admin";
import { getCustomers } from "../../services/adminApi";
import { formatCurrency } from "../../utils/currency";
import { useToast } from "../../components/admin/Toast";

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

  return new Date(firstOrderAt).getTime() > thirtyDaysAgo;
}

export default function Customers() {
  const { addToast } = useToast();

  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<
    "all" | "new" | "returning" | "one-time"
  >("all");

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getCustomers();

      setCustomers(result);
    } catch (err) {
      console.error(err);
      addToast("Unable to load customers.", "error");
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

    const newCustomers = customers.filter((customer) =>
      isNewCustomer(customer.first_order_at),
    ).length;

    const returningCustomers = customers.filter(
      (customer) => Number(customer.order_count || 0) > 1,
    ).length;

    const oneTimeCustomers = customers.filter(
      (customer) => Number(customer.order_count || 0) <= 1,
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
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
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
        (customerFilter === "new" && newCustomer) ||
        (customerFilter === "returning" && orderCount > 1) ||
        (customerFilter === "one-time" && orderCount <= 1);

      return matchesSearch && matchesFilter;
    });
  }, [customers, search, customerFilter]);

  const customerType = useMemo(() => {
    if (stats.total === 0) return 0;

    return Math.round(
      (stats.returningCustomers / stats.total) * 100,
    );
  }, [stats]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Audience
          </p>

          <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Customers
              </h1>

              <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">
                Understand your customer base, purchasing
                activity, and returning customers.
              </p>
            </div>

            <button
              type="button"
              onClick={loadCustomers}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={16}
                className={
                  loading ? "animate-spin" : ""
                }
              />

              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<Users size={20} />}
            title="Total customers"
            value={
              loading ? "..." : stats.total.toLocaleString()
            }
          />

          <StatCard
            icon={<UserPlus size={20} />}
            title="New customers"
            value={
              loading
                ? "..."
                : stats.newCustomers.toLocaleString()
            }
            description="Last 30 days"
          />

          <StatCard
            icon={<TrendingUp size={20} />}
            title="Returning"
            value={
              loading
                ? "..."
                : stats.returningCustomers.toLocaleString()
            }
            description={`${customerType}% of customers`}
          />

          <StatCard
            icon={<ShoppingBag size={20} />}
            title="Total orders"
            value={
              loading
                ? "..."
                : stats.totalOrders.toLocaleString()
            }
            description={
              loading
                ? undefined
                : `${stats.averageOrders.toFixed(1)} avg. orders/customer`
            }
          />

          <StatCard
            icon={<DollarSign size={20} />}
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

        {/* Overview strip */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <UserPlus size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  New customers
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  First purchase within 30 days
                </p>
              </div>
            </div>

            <p className="mt-5 text-2xl font-bold">
              {loading
                ? "..."
                : stats.newCustomers.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <RefreshCw size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  Returning customers
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customers with multiple orders
                </p>
              </div>
            </div>

            <p className="mt-5 text-2xl font-bold">
              {loading
                ? "..."
                : stats.returningCustomers.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Globe2 size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  Customer reach
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Countries represented
                </p>
              </div>
            </div>

            <p className="mt-5 text-2xl font-bold">
              {loading
                ? "..."
                : stats.countries.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Customer directory */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Toolbar */}
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="font-semibold">
                  Customer directory
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {loading
                    ? "Loading customers..."
                    : `${filteredCustomers.length} customer${
                        filteredCustomers.length === 1
                          ? ""
                          : "s"
                      } shown`}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {/* Search */}
                <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:w-[360px] dark:border-slate-700 dark:bg-slate-950">
                  <Search
                    size={18}
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search name, email or country..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="text-xs font-semibold text-slate-500 transition hover:text-slate-900 dark:hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter */}
                <select
                  value={customerFilter}
                  onChange={(event) =>
                    setCustomerFilter(
                      event.target.value as
                        | "all"
                        | "new"
                        | "returning"
                        | "one-time",
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="all">
                    All customers
                  </option>

                  <option value="new">
                    New customers
                  </option>

                  <option value="returning">
                    Returning customers
                  </option>

                  <option value="one-time">
                    One-time customers
                  </option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />

                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Loading customers...
                </p>
              </div>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">
                      Customer
                    </th>

                    <th className="px-6 py-4">
                      Country
                    </th>

                    <th className="px-6 py-4">
                      Orders
                    </th>

                    <th className="px-6 py-4">
                      Total spend
                    </th>

                    <th className="px-6 py-4">
                      Customer type
                    </th>

                    <th className="px-6 py-4">
                      First order
                    </th>

                    <th className="px-6 py-4">
                      Last order
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer) => {
                    const orderCount = Number(
                      customer.order_count || 0,
                    );

                    const returning =
                      orderCount > 1;

                    const newCustomer =
                      isNewCustomer(
                        customer.first_order_at,
                      );

                    return (
                      <tr
                        key={customer.customer_email}
                        className="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                      >
                        {/* Customer */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <UserRound size={18} />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[260px] truncate font-semibold text-slate-900 dark:text-white">
                                {customer.customer_name ||
                                  "Unnamed customer"}
                              </p>

                              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <Mail size={12} />

                                <span className="max-w-[260px] truncate">
                                  {customer.customer_email}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Country */}
                        <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-300">
                          {customer.country || "—"}
                        </td>

                        {/* Orders */}
                        <td className="px-6 py-5">
                          <span className="inline-flex min-w-10 justify-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {orderCount}
                          </span>
                        </td>

                        {/* Spend */}
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(
                              Number(
                                customer.total_spend || 0,
                              ),
                              "USD",
                            )}
                          </p>
                        </td>

                        {/* Customer type */}
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-2">
                            {returning && (
                              <span className="inline-flex rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                Returning
                              </span>
                            )}

                            {newCustomer && (
                              <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                New
                              </span>
                            )}

                            {!returning &&
                              !newCustomer && (
                                <span className="inline-flex rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  One-time
                                </span>
                              )}
                          </div>
                        </td>

                        {/* First order */}
                        <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(
                            customer.first_order_at,
                          )}
                        </td>

                        {/* Last order */}
                        <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(
                            customer.last_order_at,
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Users
                  size={28}
                  className="text-slate-400"
                />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800 dark:text-white">
                {customers.length === 0
                  ? "No customers yet"
                  : "No customers match your filters"}
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {customers.length === 0
                  ? "Customers will automatically appear after their first purchase."
                  : "Try changing your search or customer filter."}
              </p>

              {(search || customerFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCustomerFilter("all");
                  }}
                  className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
                >
                  Clear filters
                </button>
              )}
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {icon}
      </div>

      <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight">
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