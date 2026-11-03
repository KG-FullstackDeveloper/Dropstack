import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { registerCustomer } from "../services/customerApi";

export default function CustomerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);

    try {
      await registerCustomer({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        company: form.company.trim() || null,
      });
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create your account.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0b1220] shadow-[0_40px_120px_rgba(15,23,42,0.85)]">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden lg:flex lg:flex-col lg:justify-between lg:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.2),_transparent_45%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.92))] p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200">
                <ShieldCheck size={12} />
                Dropstack Global
              </div>
              <h1 className="mt-6 max-w-md text-4xl font-black tracking-tight text-white">
                Launch your customer workspace with confidence.
              </h1>
              <p className="mt-4 max-w-lg text-base text-slate-300">
                Build your storefront, manage orders, and handle your customer
                experience from one premium platform.
              </p>
            </div>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <UserRound className="text-sky-300" size={18} />
                Secure customer account with role-based access
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="text-emerald-300" size={18} />
                Protected dashboard scoped to your business only
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                  Create account
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                  Workspace registration
                </h2>
              </div>
              <Link
                to="/customer/login"
                className="text-sm font-semibold text-sky-300 hover:text-sky-200"
              >
                Sign in
              </Link>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block text-sm text-slate-200">
                Full name
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-base text-white outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                  placeholder="Jane Carter"
                />
              </label>

              <label className="block text-sm text-slate-200">
                Email address
                <div className="relative mt-2">
                  <Mail
                    className="pointer-events-none absolute left-3 top-3.5 text-slate-500"
                    size={16}
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 py-3 pl-10 pr-4 text-base text-white outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                    placeholder="you@business.com"
                  />
                </div>
              </label>

              <label className="block text-sm text-slate-200">
                Password
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 pr-12 text-base text-white outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-3.5 text-slate-400 transition hover:text-white"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="block text-sm text-slate-200">
                Company (optional)
                <input
                  value={form.company}
                  onChange={(event) =>
                    setForm({ ...form, company: event.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-base text-white outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                  placeholder="Your company name"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create my account"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/customer/login"
                className="font-semibold text-sky-300 hover:text-sky-200"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
