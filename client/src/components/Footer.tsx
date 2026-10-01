import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#171713] text-[#f4f0e7]">
      <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid gap-14 border-b border-white/15 pb-16 lg:grid-cols-[1.7fr_1fr_1fr]">
          <div><p className="font-serif text-4xl leading-tight sm:text-5xl">Objects for a life<br />well considered.</p><p className="mt-6 max-w-md text-sm leading-7 text-white/55">A thoughtful edit of useful, beautiful products sourced from independent suppliers around the world.</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Explore</p><div className="mt-6 flex flex-col gap-3 text-sm"><Link to="/shop" className="hover:text-white/60">Shop all</Link><Link to="/about" className="hover:text-white/60">Our story</Link><Link to="/shipping" className="hover:text-white/60">Delivery</Link><Link to="/faq" className="hover:text-white/60">FAQ</Link></div></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Keep in touch</p><a href="mailto:hello@meostore.com" className="mt-6 flex items-center justify-between border-b border-white/30 pb-3 text-sm transition hover:border-white">hello@meostore.com <ArrowUpRight size={16} /></a><p className="mt-6 text-xs uppercase tracking-widest text-white/60">New releases · Product stories</p></div>
        </div>
        <div className="flex flex-col gap-3 pt-7 text-[10px] uppercase tracking-[0.16em] text-white/35 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} MEO Store</p><p>Secure checkout · Worldwide delivery</p></div>
      </div>
    </footer>
  );
}
