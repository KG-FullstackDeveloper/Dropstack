import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
<<<<<<< HEAD
    <footer className="mt-20 border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <h2 className="text-xl font-bold">MEO Store</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
            Quality products sourced from trusted private suppliers
            and delivered to customers internationally.
          </p>
        </div>

        <div>
          <h3 className="font-semibold">Shop</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-400">
            <p>Electronics</p>
            <p>Beauty & Skincare</p>
            <p>Pet Products</p>
            <p>Shapewear</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Customer care</h3>
          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400">
            <a className="hover:text-white" href="/order-tracking">Order tracking</a>
            <a className="hover:text-white" href="/refund-returns">Refunds & returns</a>
            <a className="hover:text-white" href="/privacy">Privacy policy</a>
            <a className="hover:text-white" href="/terms">Terms of service</a>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Shipping</h3>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Nigeria, Ghana and South Africa: 6–10 days.
            <br />
            US, UK and Australia: 10–14 days.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-800 px-6 py-5 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} MEO Store. All rights reserved.
=======
    <footer className="bg-[#171713] text-[#f4f0e7]">
      <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid gap-14 border-b border-white/15 pb-16 lg:grid-cols-[1.7fr_1fr_1fr]">
          <div><p className="font-serif text-4xl leading-tight sm:text-5xl">Objects for a life<br />well considered.</p><p className="mt-6 max-w-md text-sm leading-7 text-white/55">A thoughtful edit of useful, beautiful products sourced from independent suppliers around the world.</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Explore</p><div className="mt-6 flex flex-col gap-3 text-sm"><Link to="/shop" className="hover:text-white/60">Shop all</Link><Link to="/about" className="hover:text-white/60">Our story</Link><Link to="/shipping" className="hover:text-white/60">Delivery</Link><Link to="/faq" className="hover:text-white/60">FAQ</Link></div></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Keep in touch</p><a href="mailto:hello@meostore.com" className="mt-6 flex items-center justify-between border-b border-white/30 pb-3 text-sm transition hover:border-white">hello@meostore.com <ArrowUpRight size={16} /></a><p className="mt-6 text-xs uppercase tracking-widest text-white/60">New releases · Product stories</p></div>
        </div>
        <div className="flex flex-col gap-3 pt-7 text-[10px] uppercase tracking-[0.16em] text-white/35 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} MEO Store</p><p>Secure checkout · Worldwide delivery</p></div>
>>>>>>> 5095110c003cc39fcdb7e559c7dbc06833130cf1
      </div>
    </footer>
  );
}
