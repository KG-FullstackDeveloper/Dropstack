import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";

import { loginCustomer } from "../services/customerApi";

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setSubmitting(true);

    try {
      await loginCustomer({ email: email.trim(), password });
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-slate-950/90 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.4)] sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 shadow-lg shadow-sky-500/20">
            <LockKeyhole size={22} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
            Welcome back
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            Workspace sign in
          </h1>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm text-slate-200">
            Email address
            <div className="relative mt-2">
              <Mail
                className="pointer-events-none absolute left-3 top-3.5 text-slate-500"
                size={16}
              />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-3 pl-10 pr-4 text-base text-white outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                placeholder="you@business.com"
              />
            </div>
          </label>

          <label className="block text-sm text-slate-200">
            Password
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 pr-12 text-base text-white outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-3.5 text-slate-400 transition hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Need an account?{" "}
          <Link
            to="/customer/register"
            className="font-semibold text-sky-300 hover:text-sky-200"
          >
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );
}
