
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  Moon,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sun,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  Eye,
  EyeOff,
  Loader2,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { useState, type FormEvent } from "react";
import {
  loginCustomer,
  registerCustomer,
} from "../services/customerApi";

const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

type AuthMode = "login" | "register";

export default function Home() {
  const [dark, setDark] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const theme = dark
    ? {
        page: "bg-[#080b12] text-white",
        muted: "text-slate-400",
        panel: "border-white/[0.09] bg-white/[0.035]",
        card: "border-white/[0.08] bg-[#111620]",
        nav: "border-white/[0.08] bg-[#080b12]/85",
        secondary: "text-slate-300",
        field:
          "border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus:border-emerald-400",
      }
    : {
        page: "bg-[#f6f8fc] text-slate-950",
        muted: "text-slate-500",
        panel: "border-slate-200 bg-white/70",
        card: "border-slate-200 bg-white",
        nav: "border-slate-200 bg-white/85",
        secondary: "text-slate-600",
        field:
          "border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus:border-emerald-500",
      };

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setError("");
    setPassword("");
  }

  function closeAuth() {
    if (loading) return;
    setAuthMode(null);
    setError("");
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (authMode === "register") {
        await registerCustomer({
          name: name.trim(),
          email: email.trim(),
          password,
          company: company.trim() || null,
        });
      } else if (authMode === "login") {
        await loginCustomer({
          email: email.trim(),
          password,
        });
      } else {
        return;
      }

      setAuthMode(null);
      navigate("/customer/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={`min-h-screen overflow-hidden transition-colors duration-500 ${theme.page}`}
    >
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-2xl ${theme.nav}`}
      >
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20">
              <ShoppingBag size={22} />
            </span>
            <span>
              <span className="block text-lg font-black tracking-tight">
                Dropstack
              </span>
              <span
                className={`block text-[9px] font-bold uppercase tracking-[0.25em] ${theme.muted}`}
              >
                Global Ecommerce
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setDark(!dark)}
              aria-label="Toggle color theme"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${theme.panel}`}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              type="button"
              onClick={() => openAuth("login")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-emerald-400 px-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/10 transition hover:-translate-y-0.5 hover:bg-emerald-300 sm:h-11 sm:px-5 sm:text-sm"
            >
              <LockKeyhole size={15} />
              Sign In
            </button>

            <button
              type="button"
              onClick={() => openAuth("register")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-emerald-400/30 px-3 text-xs font-extrabold text-emerald-300 transition hover:-translate-y-0.5 hover:bg-emerald-400/10 sm:h-11 sm:px-5 sm:text-sm"
            >
              Sign Up
            </button>

            <Link
              to="/admin/login"
              className="hidden h-11 items-center gap-2 rounded-full border border-white/10 px-5 text-sm font-bold text-slate-300 transition hover:border-sky-400/50 hover:bg-sky-500/10 md:inline-flex"
            >
              Platform Owner
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate">
        <div className="pointer-events-none absolute -left-40 top-10 h-[450px] w-[450px] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="pointer-events-none absolute right-0 top-24 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[130px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 pt-20 sm:px-8 sm:pb-32 sm:pt-28 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } },
            }}
          >
            <motion.div
              variants={reveal}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${theme.panel} ${theme.secondary}`}
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              YOUR BUSINESS. ONE CONTROL CENTER.
            </motion.div>

            <motion.h1
              variants={reveal}
              className="mt-8 max-w-2xl text-5xl font-black leading-[1.02] tracking-[-0.065em] sm:text-6xl lg:text-7xl"
            >
              Run your commerce.
              <span className="mt-2 block bg-gradient-to-r from-emerald-300 via-teal-400 to-blue-400 bg-clip-text pb-2 text-transparent">
                Own every detail.
              </span>
            </motion.h1>

            <motion.p
              variants={reveal}
              className={`mt-7 max-w-xl text-base leading-8 sm:text-lg ${theme.muted}`}
            >
              Meet Dropstack Global Ecommerce — your ecommerce command center.
              Manage stores, products, orders, customers, inventory, and
              business performance from one intelligent workspace.
            </motion.p>

            <motion.div variants={reveal} className="mt-9 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openAuth("register")}
                className="group inline-flex h-14 items-center gap-3 rounded-full bg-emerald-400 px-7 text-sm font-extrabold text-slate-950 shadow-xl shadow-emerald-500/15 transition hover:-translate-y-1 hover:bg-emerald-300"
              >
                Sign Up
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

              <button
                type="button"
                onClick={() => openAuth("login")}
                className={`inline-flex h-14 items-center gap-2 rounded-full border px-6 text-sm font-bold transition hover:-translate-y-1 hover:border-emerald-400/50 hover:bg-emerald-400/10 ${theme.panel}`}
              >
                <LockKeyhole size={17} className="text-emerald-400" />
                Sign In
              </button>
            </motion.div>

            <motion.div
              variants={reveal}
              className={`mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium ${theme.muted}`}
            >
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-400" />
                Private admin access
              </span>
              <span className="inline-flex items-center gap-2">
                <Zap size={15} className="text-emerald-400" />
                One connected workspace
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, delay: 0.2 }}
            className={`relative rounded-[2rem] border p-3 shadow-2xl shadow-black/20 sm:p-5 ${theme.panel}`}
          >
            <div
              className={`overflow-hidden rounded-[1.4rem] border ${theme.card}`}
            >
              <div
                className={`flex items-center justify-between border-b px-5 py-4 ${theme.panel}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
                    <LayoutDashboard size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Business overview</p>
                    <p className={`text-[10px] ${theme.muted}`}>
                      Your workspace at a glance
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Workspace
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-5">
                <DashboardMetric
                  icon={<Wallet size={17} />}
                  label="Sales overview"
                  value="Track revenue"
                  change="Orders & payments"
                  theme={theme}
                />
                <DashboardMetric
                  icon={<ShoppingBag size={17} />}
                  label="Orders"
                  value="Stay organized"
                  change="Order management"
                  theme={theme}
                />
                <DashboardMetric
                  icon={<Boxes size={17} />}
                  label="Inventory"
                  value="Manage stock"
                  change="Product control"
                  theme={theme}
                />
                <DashboardMetric
                  icon={<Users size={17} />}
                  label="Customers"
                  value="Know your buyers"
                  change="Customer insights"
                  theme={theme}
                />
              </div>

              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <div className={`rounded-2xl border p-4 sm:p-5 ${theme.panel}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">
                        Your commerce ecosystem
                      </p>
                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        Everything connected in one place
                      </p>
                    </div>
                    <BarChart3 size={22} className="text-emerald-400" />
                  </div>

                  <div className="mt-5 flex h-24 items-end gap-2">
                    {[32, 48, 39, 64, 49, 75, 58, 86, 65, 96, 72, 100].map(
                      (height, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{
                            duration: 0.7,
                            delay: 0.5 + i * 0.045,
                          }}
                          className={`flex-1 rounded-t-md ${
                            i === 9
                              ? "bg-emerald-400"
                              : dark
                                ? "bg-emerald-400/25"
                                : "bg-emerald-500/25"
                          }`}
                        />
                      ),
                    )}
                  </div>
                  <div
                    className={`mt-3 flex items-center gap-2 text-xs ${theme.muted}`}
                  >
                    <TrendingUp size={14} className="text-emerald-400" />A
                    clearer view of your business activity
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className={`absolute -right-2 top-20 hidden items-center gap-3 rounded-2xl border p-4 shadow-xl sm:flex lg:-right-8 ${theme.card}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Globe2 size={20} />
              </span>
              <span>
                <span className="block text-xs font-bold">
                  Multiple storefronts
                </span>
                <span className={`mt-1 block text-[10px] ${theme.muted}`}>
                  One management platform
                </span>
              </span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 7, 0] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`absolute -bottom-5 -left-2 hidden items-center gap-3 rounded-2xl border p-4 shadow-xl sm:flex lg:-left-8 ${theme.card}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                <CheckCircle2 size={20} />
              </span>
              <span>
                <span className="block text-xs font-bold">
                  Built for control
                </span>
                <span className={`mt-1 block text-[10px] ${theme.muted}`}>
                  Your business, your decisions
                </span>
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section
        id="platform"
        className={`border-y py-20 sm:py-24 ${theme.panel}`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
            className="mx-auto max-w-2xl text-center"
          >
            <motion.p
              variants={reveal}
              className="text-xs font-black uppercase tracking-[0.22em] text-emerald-500"
            >
              Everything in one place
            </motion.p>
            <motion.h2
              variants={reveal}
              className="mt-4 text-3xl font-black tracking-tight sm:text-5xl"
            >
              Less switching. More control.
            </motion.h2>
            <motion.p
              variants={reveal}
              className={`mt-5 text-sm leading-7 sm:text-base ${theme.muted}`}
            >
              The tools you need to manage your ecommerce operations without
              turning your workflow into a maze.
            </motion.p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<ShoppingBag size={21} />}
              title="Product management"
              text="Organize products, details, pricing, and availability."
              theme={theme}
            />
            <Feature
              icon={<Package size={21} />}
              title="Orders & fulfillment"
              text="Keep order information and delivery workflows organized."
              theme={theme}
            />
            <Feature
              icon={<BarChart3 size={21} />}
              title="Business analytics"
              text="Review business activity and make informed decisions."
              theme={theme}
            />
            <Feature
              icon={<Users size={21} />}
              title="Customer management"
              text="Access customer records and order relationships."
              theme={theme}
            />
            <Feature
              icon={<Globe2 size={21} />}
              title="Store management"
              text="Manage your global and Nigeria storefront experiences."
              theme={theme}
            />
            <Feature
              icon={<ShieldCheck size={21} />}
              title="Private workspace"
              text="Keep administrative tools separate from public storefronts."
              theme={theme}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <a
              href="#platform"
              className="inline-flex h-13 items-center gap-2 rounded-full bg-emerald-400 px-7 py-4 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300"
            >
              Explore features <ArrowRight size={17} />
            </a>
          </motion.div>
        </div>
      </section>

      <footer
        className={`mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8 ${theme.muted}`}
      >
        <span>© {new Date().getFullYear()} Dropstack Global Ecommerce</span>
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-2 transition hover:text-sky-400"
        >
          <LockKeyhole size={13} />
          Platform Owner Login
        </Link>
      </footer>

      {/* Customer authentication modal — stays on the homepage */}
      {authMode && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAuth();
          }}
        >
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`relative my-auto w-full max-w-md rounded-3xl border p-6 shadow-2xl sm:p-8 ${theme.card}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-auth-title"
          >
            <button
              type="button"
              onClick={closeAuth}
              disabled={loading}
              aria-label="Close authentication"
              className={`absolute right-5 top-5 rounded-full p-2 transition hover:bg-white/10 ${theme.muted}`}
            >
              <X size={19} />
            </button>

            <div className="mb-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950">
                <ShoppingBag size={23} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                Dropstack Global
              </p>
              <h2
                id="customer-auth-title"
                className="mt-2 text-2xl font-black tracking-tight"
              >
                {authMode === "register"
                  ? "Create your account"
                  : "Welcome back"}
              </h2>
              <p className={`mt-2 text-sm leading-6 ${theme.muted}`}>
                {authMode === "register"
                  ? "Create your customer account to access your workspace."
                  : "Sign in to continue to your customer workspace."}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "register" && (
                <>
                  <div>
                    <label
                      htmlFor="customer-name"
                      className="mb-2 block text-xs font-semibold"
                    >
                      Full name
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={100}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your full name"
                      className={`h-12 w-full rounded-xl border px-4 text-sm outline-none transition ${theme.field}`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customer-company"
                      className="mb-2 block text-xs font-semibold"
                    >
                      Business name (optional)
                    </label>
                    <input
                      id="customer-company"
                      type="text"
                      autoComplete="organization"
                      maxLength={120}
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      placeholder="Your business"
                      className={`h-12 w-full rounded-xl border px-4 text-sm outline-none transition ${theme.field}`}
                    />
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="customer-email"
                  className="mb-2 block text-xs font-semibold"
                >
                  Business email
                </label>
                <input
                  id="customer-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className={`h-12 w-full rounded-xl border px-4 text-sm outline-none transition ${theme.field}`}
                />
              </div>

              <div>
                <label
                  htmlFor="customer-password"
                  className="mb-2 block text-xs font-semibold"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="customer-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      authMode === "register"
                        ? "new-password"
                        : "current-password"
                    }
                    required
                    minLength={authMode === "register" ? 8 : undefined}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className={`h-12 w-full rounded-xl border px-4 pr-12 text-sm outline-none transition ${theme.field}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${theme.muted}`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {authMode === "register" && (
                  <p className={`mt-2 text-[11px] ${theme.muted}`}>
                    Use at least 8 characters.
                  </p>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Please wait...
                  </>
                ) : authMode === "register" ? (
                  <>
                    Create account <ArrowRight size={17} />
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div className={`mt-6 border-t pt-5 text-center text-sm ${theme.panel}`}>
              {authMode === "register" ? (
                <>
                  <span className={theme.muted}>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => openAuth("login")}
                    className="font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  <span className={theme.muted}>New to Dropstack? </span>
                  <button
                    type="button"
                    onClick={() => openAuth("register")}
                    className="font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    Create an account
                  </button>
                </>
              )}
            </div>
          </motion.section>
        </div>
      )}
    </main>
  );
}

function DashboardMetric({
  icon,
  label,
  value,
  change,
  theme,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  theme: { panel: string; muted: string };
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`rounded-2xl border p-4 ${theme.panel}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-400">{label}</span>
        <span className="text-emerald-400">{icon}</span>
      </div>
      <p className="mt-4 text-base font-extrabold sm:text-lg">{value}</p>
      <p className={`mt-1 text-[10px] ${theme.muted}`}>{change}</p>
    </motion.div>
  );
}

function Feature({
  icon,
  title,
  text,
  theme,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  theme: { card: string; muted: string };
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25 }}
      className={`rounded-3xl border p-6 transition-shadow hover:shadow-xl hover:shadow-emerald-500/5 ${theme.card}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-500">
        {icon}
      </div>
      <h3 className="mt-5 text-base font-extrabold">{title}</h3>
      <p className={`mt-2 text-sm leading-6 ${theme.muted}`}>{text}</p>
    </motion.article>
  );
}
