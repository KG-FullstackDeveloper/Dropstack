import React, { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import {
  getNigeriaCustomers,
  type NigeriaCustomer,
} from "../../services/nigeriaApi";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string): string {
  const value = name.trim();

  if (!value) return "CU";

  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function CustomerDetailsModal({
  customer,
  onClose,
}: {
  customer: NigeriaCustomer;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Customer Details
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Nigeria Ecommerce customer
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close customer details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-semibold text-gray-700">
              {getInitials(customer.name)}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-xl font-semibold text-gray-900">
                {customer.name || "Unnamed customer"}
              </h3>

              <p className="mt-1 break-all text-sm text-gray-500">
                {customer.email || "No email"}
              </p>
            </div>
          </div>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Contact information
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs font-medium">Email</span>
                </div>

                <p className="mt-2 break-all text-sm font-medium text-gray-900">
                  {customer.email || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Phone className="h-4 w-4" />
                  <span className="text-xs font-medium">Phone</span>
                </div>

                <p className="mt-2 text-sm font-medium text-gray-900">
                  {customer.phone || "—"}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Address
            </h3>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />

                <div>
                  <p className="text-sm text-gray-900">
                    {customer.address || "No address provided"}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {[
                      customer.city,
                      customer.state,
                      customer.postal_code,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {customer.country || "Nigeria"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Customer activity
            </h3>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Orders</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {Number(customer.total_orders) || 0}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Total spent</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {formatCurrency(customer.total_spent)}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Customer since</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(customer.created_at)}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function NigeriaCustomers() {
  const [customers, setCustomers] = useState<NigeriaCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<NigeriaCustomer | null>(null);

  async function loadCustomers(showRefreshState = false) {
    try {
      setError("");

      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getNigeriaCustomers();

      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load Nigeria customers.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) =>
      [
        customer.id,
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        customer.city,
        customer.state,
        customer.postal_code,
        customer.country,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [customers, search]);

  const stats = useMemo(() => {
    const totalCustomers = customers.length;

    const totalOrders = customers.reduce(
      (sum, customer) => sum + Number(customer.total_orders || 0),
      0,
    );

    const totalSpent = customers.reduce(
      (sum, customer) => sum + Number(customer.total_spent || 0),
      0,
    );

    const repeatCustomers = customers.filter(
      (customer) => Number(customer.total_orders || 0) > 1,
    ).length;

    return {
      totalCustomers,
      totalOrders,
      totalSpent,
      repeatCustomers,
    };
  }, [customers]);

  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Nigeria Customers
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage customers from the Nigeria Ecommerce store.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadCustomers(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total customers"
            value={stats.totalCustomers}
            icon={<User className="h-5 w-5" />}
          />

          <StatCard
            title="Total orders"
            value={stats.totalOrders}
            icon={<ShoppingBag className="h-5 w-5" />}
          />

          <StatCard
            title="Total spent"
            value={formatCurrency(stats.totalSpent)}
            icon={<span className="text-lg font-semibold">₦</span>}
          />

          <StatCard
            title="Repeat customers"
            value={stats.repeatCustomers}
            icon={<User className="h-5 w-5" />}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customers..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading Nigeria customers...
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <User className="h-5 w-5 text-gray-500" />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-gray-900">
                {customers.length === 0
                  ? "No Nigeria customers yet"
                  : "No matching customers"}
              </h2>

              <p className="mt-1 max-w-md text-sm text-gray-500">
                {customers.length === 0
                  ? "Customers created through the Nigeria Ecommerce checkout will appear here."
                  : "Try changing your search."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Customer
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Contact
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Location
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Orders
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Total spent
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Joined
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                            {getInitials(customer.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {customer.name || "Unnamed customer"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              #{customer.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-xs truncate text-sm text-gray-900">
                          {customer.email || "—"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {customer.phone || "No phone"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-xs truncate text-sm text-gray-900">
                          {customer.city || customer.state || "—"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {customer.country || "Nigeria"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                        {Number(customer.total_orders) || 0}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(customer.total_spent)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        {formatDate(customer.created_at)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(customer)}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredCustomers.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
              Showing {filteredCustomers.length} of {customers.length} Nigeria
              {customers.length === 1 ? " customer" : " customers"}.
            </div>
          )}
        </div>
      </div>

      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}