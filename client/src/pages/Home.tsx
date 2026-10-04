import {
  ArrowDown,
  ArrowRight,
  Globe2,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useSpring,
  type Variants,
} from "framer-motion";
import type { ReactNode, MouseEvent } from "react";

const markets = [
  {
    eyebrow: "Worldwide shopping",
    title: "Global store",
    description:
      "Browse the international collection, see prices in supported currencies, and place an order for delivery to your country.",
    detail: "International delivery",
    icon: Globe2,
    href: "/store",
    action: "Shop globally",
    dark: true,
  },
  {
    eyebrow: "Made for Nigeria",
    title: "Nigeria store",
    description:
      "Shop the local collection with Nigerian naira pricing, local delivery details, and a checkout designed for Nigeria.",
    detail: "Local shopping · NGN",
    icon: MapPin,
    href: "/nigeria-store",
    action: "Shop in Nigeria",
    dark: false,
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const spring = {
  type: "spring" as const,
  stiffness: 180,
  damping: 18,
};

export default function Home() {
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);

  const smoothX = useSpring(mouseX, {
    stiffness: 100,
    damping: 25,
    mass: 0.4,
  });

  const smoothY = useSpring(mouseY, {
    stiffness: 100,
    damping: 25,
    mass: 0.4,
  });

  function handleHeroMouseMove(event: MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    mouseX.set(x);
    mouseY.set(y);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f8fa] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/"
            className="group flex items-center gap-3"
            aria-label="MEO Marketplace home"
          >
            <motion.span
              whileHover={{ rotate: -5, scale: 1.04 }}
              transition={spring}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/10"
            >
              <ShoppingBag size={19} />
            </motion.span>

            <span>
              <span className="block text-sm font-black tracking-tight">
                MEO
              </span>

              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Marketplace
              </span>
            </span>
          </Link>

          <nav
            className="flex items-center gap-2 sm:gap-3"
            aria-label="Main navigation"
          >
            <a
              href="#markets"
              className="hidden px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 sm:inline"
            >
              Shop by region
            </a>

            <Link
              to="/about"
              className="hidden px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 sm:inline"
            >
              About
            </Link>

            <Link
              to="/admin/login"
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:px-5 sm:text-sm"
            >
              Admin
            </Link>

            <Link
              to="/nigeria-store"
              className="rounded-full bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800 sm:px-5 sm:text-sm"
            >
              Start shopping <span aria-hidden="true">→</span>
            </Link>
          </nav>
        </div>
      </header>

      <section
        onMouseMove={handleHeroMouseMove}
        className="relative isolate min-h-[720px] overflow-hidden bg-[#05070b] text-white"
      >
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(
              420px circle at ${smoothX}% ${smoothY}%,
              rgba(96,165,250,0.18),
              transparent 70%
            )`,
          }}
        />

        <motion.div
          className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]"
          animate={{
            x: [0, 70, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-emerald-500/15 blur-[120px]"
          animate={{
            x: [0, -60, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:70px_70px]" />

        <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:py-24">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/70 backdrop-blur-xl"
            >
              <motion.span
                animate={{
                  scale: [1, 1.35, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="h-2 w-2 rounded-full bg-emerald-400"
              />

              One marketplace. Two ways to shop.
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-8 text-5xl font-black leading-[0.98] tracking-[-0.065em] sm:text-6xl lg:text-8xl"
            >
              Good finds.
              <br />
              <span className="bg-gradient-to-r from-white via-slate-300 to-slate-500 bg-clip-text text-transparent">
                Wherever you are.
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-7 max-w-xl text-base leading-7 text-white/55 sm:text-lg sm:leading-8"
            >
              Shop our international collection or choose the Nigeria store
              for local prices and delivery. One marketplace, two distinct
              shopping experiences.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <motion.a
                href="#markets"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-slate-950 shadow-xl shadow-black/20"
              >
                Choose your store
                <ArrowDown size={16} />
              </motion.a>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
              >
                <Link
                  to="/about"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-6 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/10"
                >
                  How it works
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-white/40"
            >
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={15} />
                Clear order details
              </span>

              <span className="inline-flex items-center gap-2">
                <Truck size={15} />
                Delivery information
              </span>

              <span className="inline-flex items-center gap-2">
                <Globe2 size={15} />
                Two regional stores
              </span>
            </motion.div>
          </motion.div>

          <motion.a
            href="#markets"
            initial={{
              opacity: 0,
              scale: 0.92,
              y: 30,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              duration: 0.9,
              delay: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{
              scale: 1.015,
              y: -4,
            }}
            className="group relative block min-h-[400px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-7 shadow-2xl backdrop-blur-xl sm:min-h-[470px] sm:p-10"
          >
            <motion.div
              className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.div
              className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="relative flex h-full min-h-[340px] flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-white/60">
                  Choose your marketplace
                </span>

                <Globe2
                  className="text-white/30"
                  size={22}
                />
              </div>

              <div>
                <motion.div
                  animate={{
                    y: [0, -7, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="mb-6 flex -space-x-3"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#10131a] bg-blue-400 text-xl shadow-xl">
                    🌍
                  </span>

                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#10131a] bg-emerald-300 text-xl shadow-xl">
                    🇳🇬
                  </span>
                </motion.div>

                <p className="text-3xl font-black tracking-tight sm:text-4xl">
                  Your store.
                  <br />
                  Your destination.
                </p>

                <p className="mt-4 max-w-sm text-sm leading-6 text-white/45">
                  Start with the right region and see the products, currency,
                  and delivery details for that store.
                </p>

                <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-white">
                  Explore both stores
                  <ArrowRight
                    className="transition-transform duration-300 group-hover:translate-x-2"
                    size={16}
                  />
                </span>
              </div>
            </div>
          </motion.a>
        </div>

        <motion.div
          animate={{
            y: [0, 8, 0],
            opacity: [0.35, 0.7, 0.35],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 text-white/30"
        >
          <ArrowDown size={18} />
        </motion.div>
      </section>

      <motion.section
        id="markets"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28"
      >
        <motion.div
          variants={itemVariants}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Choose your store
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Two stores, built for their markets
          </h2>

          <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">
            Each store has its own catalog and checkout, so you can shop with
            the details that apply to you.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {markets.map(
            ({
              eyebrow,
              title,
              description,
              detail,
              icon: Icon,
              href,
              action,
              dark,
            }) => (
              <motion.article
                key={title}
                variants={itemVariants}
                whileHover={{
                  y: -8,
                  transition: {
                    duration: 0.25,
                  },
                }}
                className={`group flex min-h-[320px] flex-col overflow-hidden rounded-[1.75rem] border p-7 shadow-sm sm:p-9 ${
                  dark
                    ? "border-slate-800 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-950"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                      dark
                        ? "bg-white/10 text-white"
                        : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {eyebrow}
                  </span>

                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                      dark ? "bg-white/10" : "bg-slate-100"
                    }`}
                  >
                    <Icon size={21} />
                  </span>
                </div>

                <h3 className="mt-8 text-3xl font-black tracking-tight">
                  {title}
                </h3>

                <p
                  className={`mt-3 max-w-lg text-sm leading-6 ${
                    dark ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {description}
                </p>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8">
                  <span
                    className={`inline-flex items-center gap-2 text-xs font-semibold ${
                      dark ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    <PackageCheck size={15} />
                    {detail}
                  </span>

                  <Link
                    to={href}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold transition ${
                      dark
                        ? "bg-white text-slate-950 hover:bg-slate-200"
                        : "bg-slate-950 text-white hover:bg-slate-700"
                    }`}
                  >
                    {action}
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </motion.article>
            ),
          )}
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="border-y border-slate-200 bg-white"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-3">
          <Benefit
            title="Choose the right region"
            text="Start in the store that matches where you want your order delivered."
            icon={<MapPin size={18} />}
          />

          <Benefit
            title="Know what you are ordering"
            text="Review product details, totals, and delivery information as you shop."
            icon={<ShoppingBag size={18} />}
          />

          <Benefit
            title="Keep orders organized"
            text="Global and Nigeria shopping have separate storefront experiences."
            icon={<PackageCheck size={18} />}
          />
        </div>
      </motion.section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>
          © {new Date().getFullYear()} MEO Marketplace
        </span>

        <div className="flex flex-wrap gap-5">
          <Link
            className="hover:text-slate-900"
            to="/shipping"
          >
            Shipping
          </Link>

          <Link
            className="hover:text-slate-900"
            to="/faq"
          >
            FAQs
          </Link>

          <Link
            className="hover:text-slate-900"
            to="/contact"
          >
            Contact
          </Link>

          <Link
            className="font-semibold text-slate-700 hover:text-slate-950"
            to="/admin/login"
          >
            Admin
          </Link>
        </div>
      </footer>
    </main>
  );
}

function Benefit({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: ReactNode;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex gap-4"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        {icon}
      </span>

      <div>
        <h3 className="text-sm font-bold text-slate-950">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {text}
        </p>
      </div>
    </motion.div>
  );
}