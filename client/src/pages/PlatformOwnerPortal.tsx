import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Crown,
  Filter,
  Moon,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  X,
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

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#111719] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10";

function formatDate(value?: string | null) {
  if (!value) return "No expiry set";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Invalid date"
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function statusClasses(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "trial":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    case "expired":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

export default function PlatformOwnerPortal() {
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [customers, setCustomers] = useState<PlatformCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isDark = theme === "dark";

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
      setNotice("");

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
      setNotice(`${created.name} was added to your customer accounts.`);

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

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesStatus =
        statusFilter === "all" ||
        customer.status.toLowerCase() === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        [customer.name, customer.email, customer.company ?? "", customer.plan]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [customers, search, statusFilter]);

  const metrics = [
    {
      label: "Total customers",
      value: summary?.customerCount ?? customers.length,
      note: "Customer accounts",
      icon: Users,
      accent: "text-white",
      iconTone: "bg-white/8 text-slate-200",
    },
    {
      label: "Active accounts",
      value: summary?.activeCustomers ?? activeCustomerCount,
      note: "Currently active",
      icon: ShieldCheck,
      accent: "text-emerald-300",
      iconTone: "bg-emerald-400/10 text-emerald-300",
    },
    {
      label: "Trial accounts",
      value: summary?.trialCustomers ?? 0,
      note: "On a trial plan",
      icon: Sparkles,
      accent: "text-amber-300",
      iconTone: "bg-amber-400/10 text-amber-300",
    },
    {
      label: "Store capacity",
      value: summary?.totalStoreCapacity ?? 0,
      note: "Total allocated slots",
      icon: Building2,
      accent: "text-sky-300",
      iconTone: "bg-sky-400/10 text-sky-300",
    },
  ];

  return (
    <main
      className={[
        "min-h-screen space-y-6 p-3 sm:p-5 lg:p-7",
        isDark ? "bg-[#080d0e] text-white" : "bg-slate-100 text-slate-900",
      ].join(" ")}
    >
      {/* Executive header */}
      <section
        className={[
          "relative isolate overflow-hidden rounded-[28px] border p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-7 lg:p-9",
          isDark
            ? "border-white/10 bg-[#101819]"
            : "border-slate-200 bg-white shadow-slate-200/70",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-150px] left-[30%] -z-10 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">
              <Crown size={13} />
              Executive control
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Platform owner
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Dropstack / Platform operations
            </p>

            <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl lg:text-[46px] lg:leading-[1.08]">
              Your platform.
              <span className="block text-emerald-300">One clear view.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-[15px]">
              Oversee customer accounts, subscription status and store
              allocations from your central executive workspace.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col xl:items-end">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Protected workspace
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Executive access enabled
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setTheme((current) => (current === "dark" ? "light" : "dark"))
                }
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold transition",
                  isDark
                    ? "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                    : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
                {isDark ? "Light mode" : "Dark mode"}
              </button>

              <button
                type="button"
                onClick={() => void loadPortalData()}
                disabled={loading}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold transition disabled:opacity-50",
                  isDark
                    ? "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh data
              </button>

              <Link
                to="/admin"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-xs font-bold text-[#07100d] transition hover:bg-emerald-200"
              >
                Admin dashboard
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200">
          <CircleAlert size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">
          <Check size={17} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="ml-auto"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI cards */}
      <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {metrics.map(({ label, value, note, icon: Icon, accent, iconTone }) => (
          <article
            key={label}
            className="group rounded-[22px] border border-white/[0.08] bg-[#101718] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.15]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p
                  className={`mt-4 text-3xl font-semibold tracking-[-0.04em] ${accent}`}
                >
                  {loading ? "—" : value.toLocaleString()}
                </p>
                <p className="mt-2 text-[11px] text-slate-600">{note}</p>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconTone}`}
              >
                <Icon size={18} />
              </div>
            </div>

            <div className="mt-5 h-px w-full bg-white/[0.06]" />

            <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              <span>Platform metric</span>
              <ArrowUpRight
                size={13}
                className="text-slate-500 transition group-hover:text-emerald-300"
              />
            </div>
          </article>
        ))}
      </section>

      {/* Customer directory and controls */}
      <section className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.8fr)]">
        <div className="min-w-0 overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#101718]">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-300">
                    <Users size={16} />
                  </div>
                  <h2 className="text-base font-semibold tracking-tight text-white">
                    Customer directory
                  </h2>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Review account plans, status and allocated store capacity.
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {loading ? "Syncing…" : `${customers.length} accounts`}
              </span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, company or plan…"
                  className="w-full rounded-xl border border-white/10 bg-[#0a1112] py-3 pl-10 pr-4 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50"
                />
              </label>

              <label className="relative sm:w-44">
                <Filter
                  size={14}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-[#0a1112] py-3 pl-10 pr-9 text-xs text-slate-300 outline-none focus:border-emerald-400/50"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="expired">Expired</option>
                </select>
                <ChevronDown
                  size={13}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                />
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Plan</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Subscription</th>
                  <th className="px-5 py-3.5 text-right">Stores</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.055]">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-14 text-center text-xs text-slate-500"
                    >
                      Loading customer accounts…
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-500">
                        <Search size={18} />
                      </div>

                      <p className="mt-3 text-sm font-medium text-slate-300">
                        {customers.length === 0
                          ? "No customer accounts yet"
                          : "No matching customers"}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        {customers.length === 0
                          ? "New customer accounts will appear here."
                          : "Try another search term or status filter."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.045] text-xs font-bold text-slate-300">
                            {customer.name.trim().slice(0, 1).toUpperCase() ||
                              "C"}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-200">
                              {customer.name}
                            </p>
                            <p className="mt-1 truncate text-[11px] text-slate-500">
                              {customer.email}
                            </p>

                            {customer.company && (
                              <p className="mt-0.5 truncate text-[10px] text-slate-600">
                                {customer.company}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5 text-[10px] font-semibold capitalize text-slate-300">
                          {customer.plan}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold capitalize ${statusClasses(customer.status)}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {customer.status}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <CalendarDays size={13} className="text-slate-600" />
                          {formatDate(customer.subscriptionExpiresAt)}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="text-xs font-semibold tabular-nums text-white">
                          {customer.storesUsed}
                        </span>
                        <span className="text-xs text-slate-600">
                          {" "}
                          / {customer.storeLimit}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-white/[0.06] px-5 py-3.5 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {filteredCustomers.length} of {customers.length} accounts
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Account data from platform records
            </span>
          </div>
        </div>

        {/* Right-side controls */}
        <aside className="space-y-5">
          <section className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#101718]">
            <button
              type="button"
              onClick={() => setFormOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-3 p-5 text-left sm:p-6"
              aria-expanded={formOpen}
            >
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-300">
                    <Plus size={17} />
                  </div>
                  <h2 className="text-base font-semibold text-white">
                    Add customer
                  </h2>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Create a platform customer account.
                </p>
              </div>

              <ChevronDown
                size={17}
                className={`text-slate-500 transition ${
                  formOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {formOpen && (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 border-t border-white/[0.06] p-5 sm:p-6"
              >
                <label className="block text-xs font-medium text-slate-300">
                  Customer name
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    className={inputClass}
                    placeholder="Business owner name"
                    required
                  />
                </label>

                <label className="block text-xs font-medium text-slate-300">
                  Email address
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                    className={inputClass}
                    placeholder="owner@business.com"
                    required
                  />
                </label>

                <label className="block text-xs font-medium text-slate-300">
                  Company <span className="text-slate-600">(optional)</span>
                  <input
                    value={form.company}
                    onChange={(event) =>
                      setForm({ ...form, company: event.target.value })
                    }
                    className={inputClass}
                    placeholder="Company or brand"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-medium text-slate-300">
                    Plan
                    <select
                      value={form.plan}
                      onChange={(event) =>
                        setForm({ ...form, plan: event.target.value })
                      }
                      className={inputClass}
                    >
                      <option value="starter">Starter</option>
                      <option value="growth">Growth</option>
                      <option value="scale">Scale</option>
                    </select>
                  </label>

                  <label className="block text-xs font-medium text-slate-300">
                    Status
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm({ ...form, status: event.target.value })
                      }
                      className={inputClass}
                    >
                      <option value="active">Active</option>
                      <option value="trial">Trial</option>
                      <option value="expired">Expired</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-medium text-slate-300">
                    Expiry date
                    <input
                      type="date"
                      value={form.subscriptionExpiresAt}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          subscriptionExpiresAt: event.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </label>

                  <label className="block text-xs font-medium text-slate-300">
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
                      className={inputClass}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3.5 text-xs font-bold text-[#07100d] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      Create customer account
                      <ArrowUpRight size={14} className="ml-auto" />
                    </>
                  )}
                </button>
              </form>
            )}
          </section>

          {/* Store allocation */}
          <section className="rounded-[24px] border border-white/[0.08] bg-[#101718] p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
                <Building2 size={16} />
              </div>
              <h3 className="text-sm font-semibold text-white">
                Store allocation
              </h3>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Store capacity represents the total number of store slots assigned
              across platform customer accounts.
            </p>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold tracking-tight text-white">
                  {loading
                    ? "—"
                    : (summary?.totalStoreCapacity ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-600">
                  Allocated store slots
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-3 text-slate-400">
                <Building2 size={20} />
              </div>
            </div>
          </section>

          <div className="rounded-[20px] border border-emerald-300/15 bg-emerald-300/[0.045] p-4">
            <div className="flex items-center gap-2 text-emerald-200">
              <ShieldCheck size={15} />
              <p className="text-xs font-semibold">
                Executive access protected
              </p>
            </div>

            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              Customer and subscription controls are available only to
              authenticated platform owners.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
