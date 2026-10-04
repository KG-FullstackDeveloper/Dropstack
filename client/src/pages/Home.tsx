import { ArrowDown, ArrowRight, Globe2, MapPin, PackageCheck, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

const markets = [
  {
    eyebrow: "Worldwide shopping",
    title: "Global store",
    description: "Browse the international collection, see prices in supported currencies, and place an order for delivery to your country.",
    detail: "International delivery",
    icon: Globe2,
    href: "/store",
    action: "Shop globally",
    style: "bg-slate-950 text-white",
    muted: "text-slate-300",
    badge: "bg-white/10 text-white",
  },
  {
    eyebrow: "Made for Nigeria",
    title: "Nigeria store",
    description: "Shop the local collection with Nigerian naira pricing, local delivery details, and a checkout designed for Nigeria.",
    detail: "Local shopping · NGN",
    icon: MapPin,
    href: "/nigeria-store",
    action: "Shop in Nigeria",
    style: "bg-white text-slate-950",
    muted: "text-slate-500",
    badge: "bg-emerald-50 text-emerald-800",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="MEO Marketplace home">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white"><ShoppingBag size={19} /></span>
            <span><span className="block text-sm font-black tracking-tight">MEO</span><span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Marketplace</span></span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-5" aria-label="Main navigation">
            <a href="#markets" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-950 sm:inline">Shop by region</a>
            <Link to="/about" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-950 sm:inline">About</Link>
            <Link to="/nigeria-store" className="rounded-full bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 sm:px-5 sm:text-sm">Start shopping <span aria-hidden="true">→</span></Link>
          </nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute -right-36 -top-48 -z-10 h-[520px] w-[520px] rounded-full bg-blue-100/70 blur-3xl" />
        <div className="mx-auto grid min-h-[610px] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm"><span className="h-2 w-2 rounded-full bg-emerald-500" /> One marketplace, two ways to shop</div>
            <h1 className="mt-7 text-5xl font-black leading-[1.04] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">Good finds.<br /><span className="text-slate-400">Wherever you are.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Shop our international collection or choose the Nigeria store for local prices and delivery. Pick the experience that fits your order.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#markets" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-700">Choose your store <ArrowDown size={16} /></a>
              <Link to="/about" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-50">How it works <ArrowRight size={16} /></Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-500"><span className="inline-flex items-center gap-2"><ShieldCheck size={15} /> Clear order details</span><span className="inline-flex items-center gap-2"><Truck size={15} /> Delivery information</span><span className="inline-flex items-center gap-2"><Globe2 size={15} /> Two regional stores</span></div>
          </div>

          <a href="#markets" className="group relative block min-h-[330px] overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-900/10 sm:min-h-[420px] sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(96,165,250,.4),transparent_36%),radial-gradient(circle_at_15%_90%,rgba(52,211,153,.2),transparent_40%)]" />
            <div className="relative flex h-full min-h-[270px] flex-col justify-between sm:min-h-[340px]">
              <div className="flex items-start justify-between"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">Choose your marketplace</span><Globe2 className="text-white/60" size={22} /></div>
              <div><div className="mb-5 flex -space-x-3"><span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-950 bg-blue-400 text-lg">🌍</span><span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-950 bg-emerald-300 text-lg">🇳🇬</span></div><p className="text-3xl font-black tracking-tight sm:text-4xl">Your store.<br />Your destination.</p><p className="mt-3 max-w-sm text-sm leading-6 text-white/60">Start with the right region and see the products, currency, and delivery details for that store.</p><span className="mt-7 inline-flex items-center gap-2 text-sm font-bold">Explore both stores <ArrowRight className="transition-transform group-hover:translate-x-1" size={16} /></span></div>
            </div>
          </a>
        </div>
      </section>

      <section id="markets" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Choose your store</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Two stores, built for their markets</h2><p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">Each store has its own catalog and checkout, so you can shop with the details that apply to you.</p></div>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {markets.map(({ eyebrow, title, description, detail, icon: Icon, href, action, style, muted, badge }) => (
            <article key={title} className={`flex min-h-[310px] flex-col rounded-[1.75rem] border border-slate-200/80 p-7 shadow-sm sm:p-9 ${style}`}>
              <div className="flex items-start justify-between"><span className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${badge}`}>{eyebrow}</span><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-500/10"><Icon size={21} /></span></div>
              <h3 className="mt-8 text-3xl font-black tracking-tight">{title}</h3><p className={`mt-3 max-w-lg text-sm leading-6 ${muted}`}>{description}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8"><span className={`inline-flex items-center gap-2 text-xs font-semibold ${muted}`}><PackageCheck size={15} />{detail}</span><Link to={href} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold transition ${title === "Global store" ? "bg-white text-slate-950 hover:bg-slate-200" : "bg-slate-950 text-white hover:bg-slate-700"}`}>{action}<ArrowRight size={16} /></Link></div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-3">
          <Benefit title="Choose the right region" text="Start in the store that matches where you want your order delivered." icon={<MapPin size={18} />} />
          <Benefit title="Know what you are ordering" text="Review product details, totals, and delivery information as you shop." icon={<ShoppingBag size={18} />} />
          <Benefit title="Keep orders organized" text="Global and Nigeria shopping have separate storefront experiences." icon={<PackageCheck size={18} />} />
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© {new Date().getFullYear()} MEO Marketplace</span><div className="flex flex-wrap gap-5"><Link className="hover:text-slate-900" to="/shipping">Shipping</Link><Link className="hover:text-slate-900" to="/faq">FAQs</Link><Link className="hover:text-slate-900" to="/contact">Contact</Link></div></footer>
    </main>
  );
}

function Benefit({ title, text, icon }: { title: string; text: string; icon: ReactNode }) {
  return <div className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">{icon}</span><div><h3 className="text-sm font-bold text-slate-950">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div></div>;
}
