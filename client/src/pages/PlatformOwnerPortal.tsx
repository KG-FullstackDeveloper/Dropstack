import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CreditCard,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { apiGet, apiPost } from "../services/adminApi";

interface PlatformCustomer {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  plan: string;
  status: string;
  subscriptionExpiresAt?: string | null;
  storeLimit: number;
  storesUsed: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PlatformSummary {
  customerCount: number;
  activeCustomers: number;
  trialCustomers: number;
  expiredCustomers: number;
  totalStoreCapacity: number;
}

const emptyForm = {
  name: "",
  email: "",
  company: "",
  plan: "starter",
  status: "active",
  subscriptionExpiresAt: "",
  storeLimit: 1,
};

export default function PlatformOwnerPortal() {
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [customers, setCustomers] = useState<PlatformCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadPortalData();
  }, []);

  async function loadPortalData() {
    try {
      setLoading(true);
      const [summaryResult, customerResult] = await Promise.all([
        apiGet<PlatformSummary>("/admin/platform-owner/summary"),
        apiGet<PlatformCustomer[]>("/admin/platform-owner/customers"),
      ]);

      setSummary(summaryResult);
      setCustomers(Array.isArray(customerResult) ? customerResult : []);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the platform owner portal.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setError("Customer name and email are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = {
        ...form,
        company: form.company.trim() || null,
        storeLimit: Number(form.storeLimit) || 1,
        subscriptionExpiresAt: form.subscriptionExpiresAt || null,
      };

      const created = await apiPost<PlatformCustomer>(
        "/admin/platform-owner/customers",
        payload,
      );

      setCustomers((current) => [created, ...current]);
      setForm(emptyForm);
      setNotice(`Added ${created.name} to the platform.`);
      await loadPortalData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Customer record could not be created.",
      );
    } finally {
      setSaving(false);
    }
  }

  const activeCustomerCount = useMemo(
    () => customers.filter((customer) => customer.status === "active").length,
    [customers],
  );

  return (
    <div className="space-y-6 p-2">
      <section className="rounded-[28px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
              <ShieldCheck size={13} className="text-emerald-400" />
              Platform owner portal
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Customer lifecycle and store limits
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Manage paying customers, plan expiry, approval state, and store
              capacity from a single protected control center.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200">
            <Sparkles size={16} className="text-emerald-300" />
            Secure platform access
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Customers",
            value: summary?.customerCount ?? 0,
            icon: Users,
            tone: "bg-slate-900 text-white",
          },
          {
            label: "Active",
            value: summary?.activeCustomers ?? activeCustomerCount,
            icon: ShieldCheck,
            tone: "bg-emerald-100 text-emerald-700",
          },
          {
            label: "Trials",
            value: summary?.trialCustomers ?? 0,
            icon: CreditCard,
            tone: "bg-amber-100 text-amber-700",
          },
          {
            label: "Store capacity",
            value: summary?.totalStoreCapacity ?? 0,
            icon: Building2,
            tone: "bg-indigo-100 text-indigo-700",
          },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
              >
                <Icon size={18} />
              </div>
            </div>
            <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Customer accounts
            </h2>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              {loading ? "Loading" : `${customers.length} records`}
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Expiry</th>
                  <th className="px-4 py-3 font-semibold">Stores</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      No customers added yet.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="align-top hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {customer.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {customer.email}
                        </div>
                        {customer.company && (
                          <div className="text-[11px] text-slate-400">
                            {customer.company}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {customer.plan}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            customer.status === "trial"
                              ? "bg-amber-100 text-amber-700"
                              : customer.status === "expired"
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {customer.subscriptionExpiresAt
                          ? new Date(
                              customer.subscriptionExpiresAt,
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {customer.storesUsed}/{customer.storeLimit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Create customer
            </h2>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              <Plus size={12} />
              Add account
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                placeholder="Acme Retail"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                placeholder="owner@business.com"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Company
              <input
                value={form.company}
                onChange={(event) =>
                  setForm({ ...form, company: event.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                placeholder="Optional company name"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Plan
                <select
                  value={form.plan}
                  onChange={(event) =>
                    setForm({ ...form, plan: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                >
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="scale">Scale</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="expired">Expired</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Subscription expiry
                <input
                  type="date"
                  value={form.subscriptionExpiresAt}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      subscriptionExpiresAt: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Store limit
                <input
                  type="number"
                  min={1}
                  value={form.storeLimit}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      storeLimit: Number(event.target.value) || 1,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save customer"}
            <ArrowUpRight size={15} />
          </button>
        </form>
      </section>

      <section className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5" />
          <div>
            <p className="text-sm font-bold">Platform readiness checklist</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
              <li>
                Customer accounts are only available to authenticated platform
                owners.
              </li>
              <li>
                Store limits and expiry dates are stored with each customer
                record.
              </li>
              <li>
                Existing global storefront admin remains independent and
                unchanged.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
