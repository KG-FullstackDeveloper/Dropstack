import { useEffect, useState } from "react";
import { ArrowLeft, Check, ShoppingCart, Truck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { addToCart, getCart, saveCart } from "../utils/cart";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ShippingNotice from "../components/ShippingNotice";
import { getProduct } from "../services/api";
import type { Product as ProductType } from "../types/product";
import { formatCurrency } from "../utils/currency";
import { getDeliveryTime } from "../utils/shipping";

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!id) { setError("Product not found."); setLoading(false); return; }
    getProduct(id).then((item) => {
      if (active && Number(item.active) === 1) setProduct(item);
      else if (active) setError("This product may no longer be available.");
    }).catch((e: unknown) => {
      if (active) setError(e instanceof Error ? e.message : "Unable to load this product.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <><Navbar/><main className="mx-auto min-h-[70vh] max-w-7xl animate-pulse px-6 py-12"><div className="grid gap-10 lg:grid-cols-2"><div className="aspect-square rounded-3xl bg-slate-200"/><div className="space-y-5 py-8"><div className="h-4 w-1/4 rounded bg-slate-200"/><div className="h-10 w-3/4 rounded bg-slate-200"/><div className="h-7 w-1/4 rounded bg-slate-200"/><div className="h-24 rounded bg-slate-200"/><div className="h-14 rounded bg-slate-200"/></div></div></main><Footer/></>;

  if (!product) return <><Navbar/><main className="flex min-h-[70vh] items-center justify-center px-6"><div className="text-center"><h1 className="text-3xl font-bold text-slate-950">Product unavailable</h1><p className="mt-3 text-slate-500">{error || "This product may no longer be available."}</p><Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-semibold text-white"><ArrowLeft size={18}/>Back to shop</Link></div></main><Footer/></>;

  const image = product.image_url || product.images?.[0];
  return <><Navbar/><main className="min-h-screen bg-white"><div className="mx-auto max-w-7xl px-6 py-8"><Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"><ArrowLeft size={17}/>Back to shop</Link><div className="mt-8 grid gap-12 lg:grid-cols-2 lg:items-start"><div className="overflow-hidden rounded-3xl bg-slate-100">{image ? <img src={image} alt={product.name} className="aspect-square w-full object-cover"/> : <div className="flex aspect-square items-center justify-center text-slate-400">No image available</div>}</div><div><p className="text-sm font-bold uppercase tracking-widest text-slate-400">{product.category}</p><h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">{product.name}</h1><p className="mt-5 text-3xl font-bold text-slate-950">{formatCurrency(product.price, product.currency)}</p><div className="mt-6 h-px bg-slate-200"/><p className="mt-6 leading-7 text-slate-600">{product.description}</p><div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5"><h2 className="font-bold text-slate-950">Product details</h2><div className="mt-5 space-y-4"><Detail label="Availability" value={(product.stock ?? 0) > 0 ? `${product.stock} available` : "Availability confirmed at checkout"}/><Detail label="Ships from" value={product.warehouse_country || "International"}/><Detail label="Processing" value={product.processing_time || "1–3 days"}/><Detail label="Delivery" value={product.delivery_time || getDeliveryTime("NG")}/></div></div><div className="mt-8"><button onClick={() => { const nextCart = addToCart(getCart(), product, 1); saveCart(nextCart); navigate("/store", { state: { openCart: true } }); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 font-bold text-white transition hover:bg-slate-800"><ShoppingCart size={20}/>Buy now</button><div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500"><Check size={17}/>Secure checkout</div></div><div className="mt-8"><ShippingNotice country="NG" deliveryTime={getDeliveryTime("NG")}/></div><div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"><Truck size={19} className="text-slate-700"/></div><div><p className="font-semibold text-slate-900">Delivery updates</p><p className="mt-1 text-sm text-slate-500">Tracking details are shared when your order ships.</p></div></div></div></div></div></main><Footer/></>;
}
function Detail({label,value}:{label:string;value:string}) { return <div className="flex items-start justify-between gap-4 text-sm"><span className="text-slate-500">{label}</span><span className="text-right font-medium text-slate-900">{value}</span></div>; }
