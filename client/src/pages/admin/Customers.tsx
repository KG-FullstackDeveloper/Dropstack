import { Search, Users, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomerSummary } from "../../types/admin";
import { getCustomers } from "../../services/adminApi";
import { formatCurrency } from "../../utils/currency";
import { useToast } from "../../components/admin/Toast";

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function isNewCustomer(firstOrderAt: string): boolean {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return new Date(firstOrderAt).getTime() > thirtyDaysAgo;
}

export default function Customers() {
  const { addToast } = useToast();

  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getCustomers();
      setCustomers(result);
    } catch (err) {
      addToast("Unable to load customers.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const newCount = useMemo(
    () => customers.filter((c) => isNewCustomer(c.first_order_at)).length,
    [customers]
  );
  const returningCount = useMemo(
    () => customers.filter((c) => c.order_count > 1).length,
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(query) ||
        c.customer_email.toLowerCase().includes(query)
    );
  }, [customers, search]);

  return (
    <div>
      <div>
        <p className="text-sm text-slate-500">Audience</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Customers</h1>
        <p className="mt-2 text-slate-500">
          View and manage customers who purchase from your store.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <Card title="Total customers" value={loading ? "..." : customers.length.toString()} />
        <Card title="New (last 30 days)" value={loading ? "..." : newCount.toString()} />
        <Card title="Returning customers" value={loading ? "..." : returningCount.toString()} />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 p-5">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500">Loading customers...</p>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Country</th>
                  <th className="px-6 py-4">Orders</th>
                  <th className="px-6 py-4">Total Spend</th>
                  <th className="px-6 py-4">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.customer_email}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{customer.customer_name}</p>
                      <p className="text-xs text-slate-500">{customer.customer_email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.country || "—"}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {customer.order_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {formatCurrency(customer.total_spend, "USD")}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(customer.last_order_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-14 text-center">
            <Users size={42} className="mx-auto text-slate-300" />
            <h3 className="mt-4 font-semibold text-slate-800">
              {customers.length === 0 ? "No customers yet" : "No customers match your search"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {customers.length === 0
                ? "Customers will automatically appear after their first purchase."
                : "Try a different search term."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <UserRound size={20} />
      <p className="mt-5 text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
