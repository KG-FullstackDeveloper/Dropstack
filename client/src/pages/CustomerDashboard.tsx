import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  LogOut,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import {
  getCustomerDashboard,
  logoutCustomer,
  type CustomerSession,
} from "../services/customerApi";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomer() {
      try {
        const session = await getCustomerDashboard();
        setCustomer({
          id: session.id,
          name: session.name,
          email: session.email,
          company: session.company ?? null,
          plan: session.plan,
          role: "customer",
          status: session.status,
          storeLimit: session.storeLimit,
          storesUsed: session.storesUsed,
          subscriptionExpiresAt: session.subscriptionExpiresAt ?? null,
          createdAt: session.createdAt,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your customer dashboard.",
        );
        logoutCustomer();
        navigate("/customer/login", { replace: true });
      } finally {
        setLoading(false);
      }
    }

    void loadCustomer();
  }, [navigate]);

  function handleLogout() {
    logoutCustomer();
    navigate("/customer/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] text-slate-200">
        Loading your workspace...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] px-6 text-center text-slate-200">
        <div className="max-w-md rounded-[28px] border border-red-500/30 bg-red-500/10 p-6 text-red-100">
          {error || "Access denied."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.7)] md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200">
              <Sparkles size={12} />
              Customer workspace
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
              Welcome back, {customer.name}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            <LogOut size={16} />
            Log out
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[26px] border border-white/10 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Current plan</p>
              <ShieldCheck className="text-emerald-300" size={18} />
            </div>
            <p className="mt-4 text-3xl font-black text-white">
              {customer.plan}
            </p>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Store usage</p>
              <Building2 className="text-sky-300" size={18} />
            </div>
            <p className="mt-4 text-3xl font-black text-white">
              {customer.storesUsed}/{customer.storeLimit}
            </p>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Account status</p>
              <Users className="text-violet-300" size={18} />
            </div>
            <p className="mt-4 text-3xl font-black capitalize text-white">
              {customer.status}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[26px] border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-bold text-white">Account overview</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span>Email</span>
                <span className="font-medium text-white">{customer.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span>Company</span>
                <span className="font-medium text-white">
                  {customer.company || "Not provided"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span>Plan</span>
                <span className="font-medium text-white">{customer.plan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Subscription expiry</span>
                <span className="font-medium text-white">
                  {customer.subscriptionExpiresAt
                    ? new Date(
                        customer.subscriptionExpiresAt,
                      ).toLocaleDateString()
                    : "Not set"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-xl font-bold text-white">Quick actions</h2>
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => navigate("/store")}
                className="flex w-full items-center justify-between rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-left text-sm font-semibold text-sky-100 transition hover:bg-sky-500/15"
              >
                Open storefront
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Go to control center
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
