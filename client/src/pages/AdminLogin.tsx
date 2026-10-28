
import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff,
  LockKeyhole, Loader2, Mail, ShieldCheck, Sparkles, Zap, Crown,
  Boxes, Globe2,
} from "lucide-react";
import { motion, useMotionValue, useSpring } from "framer-motion";

import {
  forgotPassword,
  verifyForgotPassword,
  resetForgotPassword,
} from "../services/adminApi";
import { useAuth } from "../contexts/AuthContext";

type RecoveryStep = "email" | "code" | "password" | "success";

const fieldClass =
  "w-full rounded-2xl border border-white/[0.12] bg-[#080d1b]/80 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-4 focus:ring-blue-500/10";

export default function AdminLogin() {
  const { loading, admin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const [recoveryStep, setRecoveryStep] =
    useState<RecoveryStep>("email");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [error, setError] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);
  const smoothX = useSpring(mouseX, { stiffness: 70, damping: 25 });
  const smoothY = useSpring(mouseY, { stiffness: 70, damping: 25 });

  const redirectTo =
    (location.state as { from?: string } | null)?.from || "/admin";

  useEffect(() => {
    if (admin) navigate(redirectTo, { replace: true });
  }, [admin, navigate, redirectTo]);

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(((event.clientX - rect.left) / rect.width) * 100);
    mouseY.set(((event.clientY - rect.top) / rect.height) * 100);
  }

  function clearMessages() {
    setError("");
    setRecoveryMessage("");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (!email.trim()) {
      setError("Enter your administrator email.");
      return;
    }

    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setRecoveryMessage(
        "If an account exists for that email, a verification code has been sent."
      );
      setRecoveryStep("code");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start password recovery."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(recoveryCode)) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await verifyForgotPassword(email.trim(), recoveryCode);
      setResetToken(result.resetToken);
      setRecoveryStep("password");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid verification code."
      );
      setRecoveryCode("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    if (!resetToken) {
      setError("Your password reset session has expired. Please start again.");
      return;
    }

    setSubmitting(true);
    try {
      await resetForgotPassword(resetToken, newPassword);
      setRecoveryMode(true);
      setRecoveryStep("success");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setResetToken("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to reset your password."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function returnToLogin() {
    clearMessages();
    setRecoveryMode(false);
    setRecoveryStep("email");
    setRecoveryCode("");
    setNewPassword("");
    setConfirmPassword("");
    setResetToken("");
  }

  const isRecovery =
    recoveryMode || recoveryStep !== "email" || recoveryMessage.length > 0;

  const recoveryTitle: Record<RecoveryStep, string> = {
    email: "Recover your access.",
    code: "Verify it's you.",
    password: "Create a new password.",
    success: "You're all set.",
  };

  const recoveryDescription: Record<RecoveryStep, string> = {
    email: "Enter your administrator email to begin secure account recovery.",
    code: "Enter the six-digit verification code sent to your email.",
    password: "Choose a strong new password with at least 12 characters.",
    success: "Your administrator password has been updated successfully.",
  };

  const busyButton = (label: string) => (
    <span className="flex items-center justify-center gap-2">
      <Loader2 size={17} className="animate-spin" />
      {label}
    </span>
  );

  const primaryButton = (label: string, busyLabel: string) => (
    <motion.button
      type="submit"
      disabled={submitting}
      whileHover={{ scale: submitting ? 1 : 1.015 }}
      whileTap={{ scale: submitting ? 1 : 0.985 }}
      className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
      <span className="relative">
        {submitting ? busyButton(busyLabel) : (
          <span className="flex items-center justify-center gap-2">
            {label}<ArrowRight size={17} />
          </span>
        )}
      </span>
    </motion.button>
  );

  if (loading && !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050814]">
        <Loader2 size={30} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <main
      onMouseMove={handleMouseMove}
      className="relative min-h-screen overflow-hidden bg-[#050814] text-white selection:bg-blue-500/30"
    >
      {/* Ambient lighting */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(500px circle at ${smoothX}% ${smoothY}%, rgba(37,99,235,.14), transparent 72%)`,
        }}
      />
      <div className="pointer-events-none absolute -left-48 top-32 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
      <div className="pointer-events-none absolute -right-48 top-1/3 h-[520px] w-[520px] rounded-full bg-violet-600/10 blur-[150px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(148,163,184,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.6)_1px,transparent_1px)] [background-size:58px_58px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1500px] flex-col px-5 sm:px-8 lg:px-12">
        {/* Header */}
        <header className="flex items-center justify-between py-7 sm:py-9">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="group flex items-center gap-3 text-left"
          >
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-blue-300/20 bg-gradient-to-br from-blue-400/20 to-violet-500/20 shadow-lg shadow-blue-500/10">
              <Boxes size={22} className="text-blue-300" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent" />
            </div>
            <div>
              <div className="text-sm font-black tracking-[0.22em]">DROPSTACK</div>
              <div className="mt-0.5 text-[9px] font-semibold tracking-[0.28em] text-slate-500">
                GLOBAL ECOMMERCE
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:border-blue-400/40 hover:bg-white/[0.07] hover:text-white sm:text-sm"
          >
            <ArrowLeft size={15} className="transition group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Back to platform</span>
            <span className="sm:hidden">Back</span>
          </button>
        </header>

        {/* Main layout */}
        <section className="grid flex-1 items-center gap-12 pb-12 pt-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:py-12">
          {/* Brand panel */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="relative mx-auto w-full max-w-xl lg:mx-0"
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/[0.07] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
              <Sparkles size={13} />
              Private administrator portal
            </div>

            {/* Abstract animated orbital artwork */}
            <div className="relative mb-7 flex h-52 items-center justify-center sm:h-64">
              <div className="absolute h-44 w-44 rounded-full border border-blue-400/15 sm:h-56 sm:w-56" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
                className="absolute h-48 w-48 rounded-full border border-dashed border-violet-400/30 sm:h-60 sm:w-60"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                className="absolute h-36 w-36 rounded-full border border-sky-400/30 sm:h-44 sm:w-44"
              />
              <motion.div
                animate={{ y: [0, -9, 0], rotate: [0, 4, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] border border-blue-300/40 bg-gradient-to-br from-blue-400/20 via-[#111b3a] to-violet-600/20 shadow-[0_0_80px_rgba(59,130,246,0.18)] sm:h-36 sm:w-36"
              >
                <div className="absolute inset-2 rounded-[1.5rem] border border-white/[0.07]" />
                <Crown size={48} strokeWidth={1.2} className="text-blue-200 sm:h-14 sm:w-14" />
                <div className="absolute -right-3 top-4 h-3 w-3 rounded-full bg-sky-300 shadow-[0_0_20px_#38bdf8]" />
                <div className="absolute -bottom-2 left-5 h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_18px_#a78bfa]" />
              </motion.div>
              <div className="absolute left-[12%] top-[24%] h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_18px_#60a5fa]" />
              <div className="absolute right-[14%] bottom-[24%] h-2.5 w-2.5 rounded-full bg-violet-300 shadow-[0_0_20px_#a78bfa]" />
            </div>

            <div className="max-w-lg">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-sky-300">
                Your workspace. Your rules.
              </p>
              <h1 className="text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">
                Your control center
                <br />
                <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  awaits.
                </span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-400 sm:text-base">
                Manage your marketplace, oversee products, and stay in control
                of your commerce operations from one powerful workspace.
              </p>
            </div>

            <div className="mt-9 grid max-w-lg grid-cols-3 gap-3">
              {[
                { icon: ShieldCheck, title: "Secure", detail: "Protected access" },
                { icon: Zap, title: "Real-time", detail: "Fast control" },
                { icon: Crown, title: "Powerful", detail: "Admin tools" },
              ].map(({ icon: Icon, title, detail }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 sm:p-4"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/[0.08]">
                    <Icon size={17} className="text-blue-300" />
                  </div>
                  <p className="text-xs font-bold text-white sm:text-sm">{title}</p>
                  <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">{detail}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Login card */}
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative mx-auto w-full max-w-[480px]"
          >
            <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-br from-sky-400/50 via-blue-500/10 to-violet-500/50 opacity-80 blur-[1px]" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-[#0a1020]/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-9">
              <div className="absolute left-1/4 right-1/4 top-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-500/[0.08] blur-3xl" />

              <div className="relative">
                <div className="mb-7 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-300/20 bg-gradient-to-br from-blue-400/20 to-violet-500/20">
                    {recoveryStep === "success" ? (
                      <CheckCircle2 size={23} className="text-emerald-300" />
                    ) : isRecovery ? (
                      <Mail size={23} className="text-blue-300" />
                    ) : (
                      <LockKeyhole size={23} className="text-blue-300" />
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[10px] font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Secure session
                  </div>
                </div>

                <motion.div
                  key={`${isRecovery}-${recoveryStep}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-3xl font-black tracking-tight sm:text-[2.15rem]">
                    {isRecovery ? recoveryTitle[recoveryStep] : "Welcome back."}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {isRecovery
                      ? recoveryDescription[recoveryStep]
                      : "Sign in to access your commerce command center."}
                  </p>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-4 text-sm text-red-200"
                  >
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {recoveryMessage && (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-400/20 bg-blue-400/[0.07] p-4 text-sm leading-6 text-blue-100">
                    <Mail size={17} className="mt-0.5 shrink-0" />
                    <span>{recoveryMessage}</span>
                  </div>
                )}

                {!isRecovery ? (
                  <form onSubmit={handleLogin} className="mt-8 space-y-5">
                    <div>
                      <label className="mb-2.5 block text-xs font-semibold text-slate-300">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@yourcompany.com"
                          required
                          autoComplete="email"
                          className={`${fieldClass} pl-11`}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2.5 flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            clearMessages();
                            setRecoveryMode(true);
                            setRecoveryStep("email");
                            setRecoveryCode("");
                            setResetToken("");
                          }}
                          className="text-xs font-semibold text-blue-300 transition hover:text-sky-200"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          autoComplete="current-password"
                          className={`${fieldClass} pl-11 pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>

                    <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 accent-blue-500"
                      />
                      Keep me signed in
                    </label>

                    {primaryButton("Enter command center", "Signing in...")}
                    <p className="text-center text-[11px] leading-5 text-slate-500">
                      Authorized administrators only. All access is protected.
                    </p>
                  </form>
                ) : recoveryStep === "email" ? (
                  <form onSubmit={handleForgotPassword} className="mt-8 space-y-5">
                    <div>
                      <label className="mb-2.5 block text-xs font-semibold text-slate-300">
                        Administrator email
                      </label>
                      <div className="relative">
                        <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@yourcompany.com"
                          required
                          autoComplete="email"
                          autoFocus
                          className={`${fieldClass} pl-11`}
                        />
                      </div>
                    </div>
                    {primaryButton("Send verification code", "Sending...")}
                    <button type="button" onClick={returnToLogin} className="flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-400 transition hover:text-white">
                      <ArrowLeft size={14} /> Back to login
                    </button>
                  </form>
                ) : recoveryStep === "code" ? (
                  <form onSubmit={handleVerifyCode} className="mt-8 space-y-5">
                    <div>
                      <label className="mb-2.5 block text-xs font-semibold text-slate-300">
                        Six-digit verification code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={recoveryCode}
                        onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        required
                        autoFocus
                        className={`${fieldClass} text-center text-2xl font-bold tracking-[0.5em]`}
                      />
                    </div>
                    {primaryButton("Verify code", "Verifying...")}
                    <button type="button" onClick={returnToLogin} className="flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-400 transition hover:text-white">
                      <ArrowLeft size={14} /> Back to login
                    </button>
                  </form>
                ) : recoveryStep === "password" ? (
                  <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
                    <div>
                      <label className="mb-2.5 block text-xs font-semibold text-slate-300">New password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 12 characters"
                        minLength={8}
                        required
                        autoComplete="new-password"
                        autoFocus
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className="mb-2.5 block text-xs font-semibold text-slate-300">Confirm new password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your new password"
                        minLength={12}
                        required
                        autoComplete="new-password"
                        className={fieldClass}
                      />
                    </div>
                    {primaryButton("Update password", "Updating...")}
                  </form>
                ) : (
                  <div className="mt-8 space-y-5">
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4 text-sm text-emerald-200">
                      <CheckCircle2 size={21} className="shrink-0" />
                      Password changed successfully.
                    </div>
                    <button
                      type="button"
                      onClick={returnToLogin}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-bold text-slate-950 transition hover:bg-blue-50"
                    >
                      Return to login <ArrowRight size={17} />
                    </button>
                  </div>
                )}

                <div className="my-7 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/[0.08]" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                    Dropstack protected access
                  </span>
                  <div className="h-px flex-1 bg-white/[0.08]" />
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Private workspace · Secure administrator access
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Bottom feature strip */}
        <footer className="border-t border-white/[0.08] py-6">
          <div className="grid gap-5 sm:grid-cols-3 sm:gap-8">
            {[
              { icon: ShieldCheck, title: "Secure by design", text: "Protected tools for authorized administrators." },
              { icon: Globe2, title: "One command center", text: "Manage your commerce operations in one place." },
              { icon: Zap, title: "Made for momentum", text: "A focused workspace built for efficient decisions." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035]">
                  <Icon size={16} className="text-blue-300" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">{title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-600">
            Dropstack Global Ecommerce · Your business, under your control
          </p>
        </footer>
      </div>
    </main>
  );
}
