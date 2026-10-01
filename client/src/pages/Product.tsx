import { ArrowLeft, ArrowRight, Check, Globe2, ShieldCheck, ShoppingBag } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { products } from "../data/products";
import { formatCurrency } from "../utils/currency";
import { getDeliveryTime } from "../utils/shipping";

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find((item) => item.id === id);

  if (!product) return <><Navbar /><main className="grid min-h-[65vh] place-items-center bg-[#f6f3ec] px-5 text-center"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#817a6e]">404 · Product unavailable</p><h1 className="mt-4 font-serif text-5xl">This piece has moved on.</h1><Link to="/shop" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#171713] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white"><ArrowLeft size={15} /> Return to collection</Link></div></main><Footer /></>;

  const related = products.filter((item) => item.id !== product.id).slice(0, 3);
  return (
    <div className="bg-[#f6f3ec] text-[#171713]">
      <Navbar />
      <main>
        <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 lg:px-12"><Link to="/shop" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#777168] hover:text-black"><ArrowLeft size={14} /> Back to collection</Link></div>
        <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-24 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:gap-20 lg:px-12">
          <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-[#d8cdbd] via-[#b5a58e] to-[#766751] lg:sticky lg:top-32">
            {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : <><div className="absolute left-1/2 top-1/2 aspect-square w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 bg-white/15 shadow-[0_45px_90px_rgba(40,30,20,.25)] backdrop-blur-md" /><div className="absolute left-1/2 top-1/2 grid aspect-square w-[36%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/30"><span className="font-serif text-8xl text-white/80">{product.name.charAt(0)}</span></div></>}
            <span className="absolute left-5 top-5 bg-[#f6f3ec]/90 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] backdrop-blur">MEO selected</span>
          </div>
          <div className="py-4 lg:py-14">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#817a6e]">{product.category}</p>
            <h1 className="mt-5 font-serif text-5xl leading-[.95] tracking-[-0.04em] sm:text-6xl">{product.name}</h1>
            <p className="mt-6 text-2xl font-medium">{formatCurrency(product.price, product.currency)}</p>
            <p className="mt-8 max-w-xl border-t border-black/15 pt-8 text-base leading-8 text-[#69645b]">{product.description}</p>
            <button onClick={() => navigate(`/checkout/${product.id}`)} className="group mt-9 flex w-full items-center justify-between rounded-full bg-[#171713] px-7 py-5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#403c35]"><span className="flex items-center gap-3"><ShoppingBag size={17} /> Purchase now</span><ArrowRight size={17} className="transition group-hover:translate-x-1" /></button>
            <p className="mt-3 text-center text-[10px] uppercase tracking-[0.15em] text-[#817a6e]">Secure checkout · Taxes calculated at checkout</p>
            <div className="mt-10 divide-y divide-black/10 border-y border-black/10">
              <Detail icon={<Check size={17} />} title="Considered quality" value="Selected for function and lasting appeal" />
              <Detail icon={<Globe2 size={17} />} title="Delivery" value={product.delivery_time || getDeliveryTime("NG")} />
              <Detail icon={<ShieldCheck size={17} />} title="Protected purchase" value="Secure payment processing" />
            </div>
            <dl className="mt-10 grid grid-cols-2 gap-x-7 gap-y-6 text-sm"><Meta label="Ships from" value={product.warehouse_country || "International"} /><Meta label="Processing" value={product.processing_time || "1–3 days"} /><Meta label="Supplier" value={product.supplier_name || "Private supplier"} /><Meta label="Reference" value={product.slug} /></dl>
          </div>
        </section>
        {related.length > 0 && <section className="border-t border-black/10 px-5 py-24 sm:px-8 lg:px-12"><div className="mx-auto max-w-[1440px]"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#817a6e]">Continue exploring</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">You may also like</h2></div><Link to="/shop" className="hidden items-center gap-3 text-xs font-bold uppercase tracking-widest sm:flex">View all <ArrowRight size={15} /></Link></div><div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">{related.map((item, index) => <ProductCard key={item.id} product={item} index={index + 1} />)}</div></div></section>}
      </main>
      <Footer />
    </div>
  );
}

function Detail({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) { return <div className="flex items-center gap-4 py-5"><span className="grid h-9 w-9 place-items-center rounded-full border border-black/15">{icon}</span><div><p className="text-xs font-bold uppercase tracking-[0.1em]">{title}</p><p className="mt-1 text-xs text-[#817a6e]">{value}</p></div></div>; }
function Meta({ label, value }: { label: string; value: string }) { return <div><dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8b857b]">{label}</dt><dd className="mt-2 text-sm text-[#39362f]">{value}</dd></div>; }
