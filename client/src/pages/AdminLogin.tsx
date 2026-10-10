import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";

import {
  forgotPassword,
  verifyForgotPassword,
  resetForgotPassword,
} from "../services/adminApi";

import { useAuth } from "../contexts/AuthContext";

type RecoveryStep =
  | "email"
  | "code"
  | "password"
  | "success";

export default function AdminLogin() {
  const {
    loading,
    admin,
    login,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    recoveryStep,
    setRecoveryStep,
  ] = useState<RecoveryStep>("email");

  const [
    recoveryMode,
    setRecoveryMode,
  ] = useState(false);

  const [recoveryCode, setRecoveryCode] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [resetToken, setResetToken] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    recoveryMessage,
    setRecoveryMessage,
  ] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const mouseX =
    useMotionValue(50);

  const mouseY =
    useMotionValue(50);

  const smoothX =
    useSpring(mouseX, {
      stiffness: 90,
      damping: 24,
      mass: 0.4,
    });

  const smoothY =
    useSpring(mouseY, {
      stiffness: 90,
      damping: 24,
      mass: 0.4,
    });

  const redirectTo =
    (location.state as {
      from?: string;
    } | null)?.from ||
    "/admin";

  useEffect(() => {
    if (admin) {
      navigate(
        redirectTo,
        {
          replace: true,
        }
      );
    }
  }, [
    admin,
    navigate,
    redirectTo,
  ]);

  function handleMouseMove(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    const rect =
      event.currentTarget.getBoundingClientRect();

    mouseX.set(
      ((event.clientX - rect.left) /
        rect.width) *
        100
    );

    mouseY.set(
      ((event.clientY - rect.top) /
        rect.height) *
        100
    );
  }

  function clearMessages() {
    setError("");
    setRecoveryMessage("");
  }

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    clearMessages();
    setSubmitting(true);

    try {
      await login(
        email.trim(),
        password
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    clearMessages();

    if (!email.trim()) {
      setError(
        "Enter your administrator email."
      );
      return;
    }

    setSubmitting(true);

    try {
      await forgotPassword(
        email.trim()
      );

      setRecoveryMessage(
        "If an account exists for that email, a verification code has been sent."
      );

      setRecoveryStep("code");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start password recovery."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    clearMessages();

    if (!/^\d{6}$/.test(recoveryCode)) {
      setError(
        "Enter the 6-digit verification code."
      );
      return;
    }

    setSubmitting(true);

    try {
      const result =
        await verifyForgotPassword(
          email.trim(),
          recoveryCode
        );

      setResetToken(
        result.resetToken
      );

      setRecoveryStep("password");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid verification code."
      );

      setRecoveryCode("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    clearMessages();

    if (
      newPassword.length < 12
    ) {
      setError(
        "Your new password must contain at least 12 characters."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "The passwords do not match."
      );
      return;
    }

    if (!resetToken) {
      setError(
        "Your password reset session has expired. Please start again."
      );
      return;
    }

    setSubmitting(true);

    try {
      await resetForgotPassword(
        resetToken,
        newPassword
      );

      setRecoveryMode(true);
      setRecoveryStep("success");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setResetToken("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset your password."
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

  function formatRecoveryTitle() {
    if (recoveryStep === "email") {
      return "Forgot your password?";
    }

    if (recoveryStep === "code") {
      return "Check your email.";
    }

    if (recoveryStep === "password") {
      return "Create a new password.";
    }

    return "Password updated.";
  }

  function formatRecoveryDescription() {
    if (recoveryStep === "email") {
      return "Enter your administrator email and we'll help you recover access.";
    }

    if (recoveryStep === "code") {
      return "Enter the 6-digit verification code sent to your administrator email.";
    }

    if (recoveryStep === "password") {
      return "Choose a new password with at least 12 characters.";
    }

    return "Your administrator password has been successfully updated.";
  }

  if (
    loading &&
    !admin
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070b]">
        <Loader2
          size={28}
          className="animate-spin text-white/50"
        />
      </div>
    );
  }

  const isRecovery =
    recoveryMode ||
    recoveryStep !== "email" ||
    recoveryMessage.length > 0;

  return (
    <main
      onMouseMove={handleMouseMove}
      className="relative flex min-h-screen overflow-hidden bg-[#05070b] text-white"
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(
            380px circle at ${smoothX}% ${smoothY}%,
            rgba(59,130,246,0.16),
            transparent 70%
          )`,
        }}
      />

      <motion.div
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[120px]"
      />

      <motion.div
        animate={{
          x: [0, -50, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-[120px]"
      />

      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-5 py-12">
        <motion.div
          initial={{
            opacity: 0,
            y: 24,
            scale: 0.97,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="w-full max-w-md"
        >
          <div className="mb-7 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
              className="group inline-flex items-center gap-2 text-sm font-semibold text-white/40 transition hover:text-white"
            >
              <ArrowLeft
                size={15}
                className="transition-transform group-hover:-translate-x-1"
              />
              Marketplace
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-white/40">
              <ShieldCheck size={13} />
              Private access
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-7 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-9">
            <div className="mb-8">
              <motion.div
                key={
                  isRecovery
                    ? "recovery"
                    : "login"
                }
                initial={{
                  scale: 0.8,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 15,
                }}
                className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-xl"
              >
                {recoveryStep ===
                "success" ? (
                  <CheckCircle2
                    size={21}
                  />
                ) : isRecovery ? (
                  <Mail
                    size={21}
                  />
                ) : (
                  <LockKeyhole
                    size={21}
                  />
                )}
              </motion.div>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-300/70">
                <Sparkles size={13} />
                {isRecovery
                  ? "Account recovery"
                  : "Command center"}
              </div>

              <motion.h1
                key={`${recoveryStep}-${isRecovery}`}
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-3 text-3xl font-black tracking-tight"
              >
                {isRecovery
                  ? formatRecoveryTitle()
                  : "Welcome back."}
              </motion.h1>

              <motion.p
                key={`description-${recoveryStep}-${isRecovery}`}
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-2 text-sm leading-6 text-white/40"
              >
                {isRecovery
                  ? formatRecoveryDescription()
                  : "Sign in to securely manage your marketplace."}
              </motion.p>
            </div>

            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
              >
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />
                <span>{error}</span>
              </motion.div>
            )}

            {recoveryMessage && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4 text-sm text-blue-100"
              >
                <Mail
                  size={17}
                  className="mt-0.5 shrink-0"
                />
                <span>
                  {recoveryMessage}
                </span>
              </motion.div>
            )}

            {!isRecovery ? (
              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/45">
                    Email address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="owner@example.com"
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition duration-300 placeholder:text-white/20 focus:border-blue-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/45">
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
                      className="text-xs font-semibold text-blue-300 transition hover:text-blue-200"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition duration-300 placeholder:text-white/20 focus:border-blue-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{
                    scale: submitting
                      ? 1
                      : 1.015,
                  }}
                  whileTap={{
                    scale: submitting
                      ? 1
                      : 0.985,
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-black/20 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight
                        size={16}
                      />
                    </>
                  )}
                </motion.button>
              </form>
            ) : recoveryStep ===
              "email" ? (
              <form
                onSubmit={
                  handleForgotPassword
                }
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/45">
                    Administrator email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="owner@example.com"
                    required
                    autoComplete="email"
                    autoFocus
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition duration-300 placeholder:text-white/20 focus:border-blue-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{
                    scale: submitting
                      ? 1
                      : 1.015,
                  }}
                  whileTap={{
                    scale: submitting
                      ? 1
                      : 0.985,
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-black/20 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Sending...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight
                        size={16}
                      />
                    </>
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={
                    returnToLogin
                  }
                  className="flex w-full items-center justify-center gap-2 pt-1 text-xs font-semibold text-white/35 transition hover:text-white"
                >
                  <ArrowLeft
                    size={13}
                  />
                  Back to login
                </button>
              </form>
            ) : recoveryStep ===
              "code" ? (
              <form
                onSubmit={
                  handleVerifyCode
                }
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/45">
                    Verification code
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={recoveryCode}
                    onChange={(event) => {
                      setRecoveryCode(
                        event.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(0, 6)
                      );
                    }}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-center text-2xl font-bold tracking-[0.45em] text-white outline-none transition duration-300 placeholder:text-white/15 focus:border-blue-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={
                    submitting ||
                    recoveryCode.length !==
                      6
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-slate-950 shadow-xl transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify code
                      <ArrowRight
                        size={16}
                      />
                    </>
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={
                    returnToLogin
                  }
                  className="flex w-full items-center justify-center gap-2 pt-1 text-xs font-semibold text-white/35 transition hover:text-white"
                >
                  <ArrowLeft
                    size={13}
                  />
                  Back to login
                </button>
              </form>
            ) : recoveryStep ===
              "password" ? (
              <form
                onSubmit={
                  handleResetPassword
                }
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/45">
                    New password
                  </label>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    placeholder="At least 12 characters"
                    minLength={12}
                    required
                    autoComplete="new-password"
                    autoFocus
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition duration-300 placeholder:text-white/20 focus:border-blue-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/45">
                    Confirm new password
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Repeat your password"
                    minLength={12}
                    required
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition duration-300 placeholder:text-white/20 focus:border-blue-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-slate-950 shadow-xl transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Updating...
                    </>
                  ) : (
                    <>
                      Update password
                      <ArrowRight
                        size={16}
                      />
                    </>
                  )}
                </motion.button>
              </form>
            ) : (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
                  <CheckCircle2
                    size={20}
                    className="shrink-0"
                  />
                  <span>
                    Your password has been
                    changed successfully.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={
                    returnToLogin
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-slate-950"
                >
                  Return to login
                  <ArrowRight
                    size={16}
                  />
                </button>
              </motion.div>
            )}

            <div className="mt-7 flex items-center justify-center gap-2 text-[11px] text-white/25">
              <ShieldCheck size={13} />
              Protected administrator access
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}