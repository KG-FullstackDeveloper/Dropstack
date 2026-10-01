import { ArrowDown, ArrowRight, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { products } from "../data/products";

const categories = [
  { name: "Technology", subtitle: "Smarter everyday essentials", tone: "bg-[#c8c0b1]" },
  { name: "Self care", subtitle: "Rituals worth keeping", tone: "bg-[#a9b09d]" },
  { name: "Living", subtitle: "Small upgrades, lasting impact", tone: "bg-[#b7a6aa]" },
];

export default function Home() {
  return (
    <div className="bg-[#f6f3ec] text-[#171713]">
      <Navbar />
      <main>
        <section className="relative min-h-[calc(100svh-110px)] overflow-hidden border-b border-black/10">
          <div className="absolute inset-y-0 right-0 hidden w-[47%] overflow-hidden bg-[#c4b6a1] lg:block">
            <div className="absolute -right-24 top-[14%] h-[60vw] max-h-[740px] w-[60vw] max-w-[740px] rounded-full border border-white/35 bg-gradient-to-br from-[#eee7dc] via-[#b9a88e] to-[#73634f] shadow-[0_60px_120px_rgba(42,32,22,.26)]" />
            <div className="absolute right-[18%] top-[25%] h-[34vw] max-h-[430px] w-[34vw] max-w-[430px] rounded-full border border-white/35 bg-white/10 backdrop-blur-md" />
            <span className="absolute bottom-9 right-10 text-[10px] font-bold uppercase tracking-[0.24em] text-white/70">Edition 01 / 2026</span>
          </div>
          <div className="mx-auto grid min-h-[calc(100svh-110px)] max-w-[1440px] px-5 sm:px-8 lg:grid-cols-2 lg:px-12">
            <div className="flex flex-col justify-center py-20 lg:pr-16">
              <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#817a6e]"><span className="h-px w-8 bg-[#817a6e]" /> The considered collection</p>
              <h1 className="mt-8 max-w-3xl font-serif text-[clamp(4rem,9vw,8.5rem)] leading-[0.82] tracking-[-0.06em]">Live with<br /><span className="italic text-[#796b55]">intention.</span></h1>
              <p className="mt-10 max-w-lg text-base leading-8 text-[#69645b] sm:text-lg">A refined selection of objects that bring more ease, beauty, and intention to the everyday.</p>
              <div className="mt-10 flex flex-wrap items-center gap-5">
                <Link to="/shop" className="group inline-flex items-center gap-5 rounded-full bg-[#171713] px-7 py-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#403c35]">Explore collection <ArrowRight size={16} className="transition group-hover:translate-x-1" /></Link>
                <a href="#edit" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#514c43]">Discover our edit <ArrowDown size={15} /></a>
              </div>
            </div>
            <div className="relative min-h-[480px] overflow-hidden bg-[#c4b6a1] lg:hidden">
              <div className="absolute left-[10%] top-[12%] aspect-square w-[92%] rounded-full bg-gradient-to-br from-[#eee7dc] via-[#b9a88e] to-[#73634f] shadow-2xl" /><div className="absolute left-[28%] top-[28%] aspect-square w-[58%] rounded-full border border-white/40 bg-white/10 backdrop-blur" />
            </div>
          </div>
        </section>

        <section className="border-b border-black/10">
          <div className="mx-auto grid max-w-[1440px] divide-y divide-black/10 px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-12">
            <Trust icon={<Sparkles size={18} />} title="Purposefully selected" text="Quality over quantity, always." />
            <Trust icon={<Globe2 size={18} />} title="Worldwide delivery" text="Thoughtfully packed and tracked." />
            <Trust icon={<ShieldCheck size={18} />} title="Secure purchasing" text="Protected from cart to delivery." />
          </div>
        </section>

        <section id="edit" className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
          <div className="flex flex-col justify-between gap-8 border-b border-black/15 pb-10 md:flex-row md:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8a8378]">The current edit</p><h2 className="mt-4 font-serif text-5xl tracking-[-0.04em] sm:text-6xl">Objects of interest</h2></div><Link to="/shop" className="group flex items-center gap-4 text-xs font-bold uppercase tracking-[0.14em]">View all pieces <span className="grid h-10 w-10 place-items-center rounded-full border border-black/30 transition group-hover:bg-[#171713] group-hover:text-white"><ArrowRight size={15} /></span></Link></div>
          <div className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">{products.slice(0, 4).map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>
        </section>

        <section className="bg-[#22231e] px-5 py-24 text-[#f4f0e7] sm:px-8 lg:px-12 lg:py-36">
          <div className="mx-auto max-w-[1440px]"><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Shop by mood</p><div className="mt-8 grid gap-3 md:grid-cols-3">{categories.map((category, index) => <Link to="/shop" key={category.name} className={`group relative flex aspect-[4/5] flex-col justify-end overflow-hidden p-7 ${category.tone}`}><div className="absolute left-1/2 top-[38%] h-40 w-40 -translate-x-1/2 rounded-full border border-white/50 bg-white/15 shadow-2xl transition duration-700 group-hover:scale-110 group-hover:rotate-6" /><span className="relative text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">0{index + 1}</span><h3 className="relative mt-3 font-serif text-4xl text-white">{category.name}</h3><p className="relative mt-2 flex items-center justify-between text-sm text-white/70">{category.subtitle}<ArrowRight size={17} className="transition group-hover:translate-x-1" /></p></Link>)}</div></div>
        </section>

        <section className="px-5 py-24 sm:px-8 lg:px-12 lg:py-36"><div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-2 lg:items-center"><p className="font-serif text-5xl leading-[1.05] tracking-[-0.04em] sm:text-6xl">We believe the things around us should earn their place.</p><div className="max-w-xl"><p className="text-lg leading-8 text-[#69645b]">MEO brings together pieces chosen for thoughtful design, daily usefulness, and lasting appeal. Fewer distractions. Better objects. A more considered way to shop.</p><Link to="/about" className="mt-8 inline-flex items-center gap-4 border-b border-black pb-2 text-xs font-bold uppercase tracking-[0.15em]">Read our story <ArrowRight size={15} /></Link></div></div></section>
      </main>
      <Footer />
    </div>
  );
}

function Trust({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex items-center gap-4 py-8 md:px-7 first:pl-0 last:pr-0"><span className="grid h-10 w-10 place-items-center rounded-full border border-black/15">{icon}</span><div><p className="text-xs font-bold uppercase tracking-[0.12em]">{title}</p><p className="mt-1 text-xs text-[#817a6e]">{text}</p></div></div>;
}
