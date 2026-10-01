import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Collection" },
  { to: "/about", label: "Our story" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="bg-[#171713] px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f4f0e7] sm:text-xs">Complimentary delivery on curated orders</div>
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f6f3ec]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link to="/" className="group flex items-center gap-3" aria-label="MEO Store home">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#171713] text-xs font-bold tracking-widest text-white transition-transform group-hover:rotate-6">M</span>
            <span className="font-serif text-xl tracking-[-0.02em] text-[#171713]">MEO Store</span>
          </Link>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${isActive ? "text-[#171713]" : "text-[#716d64] hover:text-[#171713]"}`}>{item.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link to="/shop" className="hidden rounded-full p-3 text-[#171713] transition hover:bg-black/5 sm:block" aria-label="Search collection"><Search size={19} strokeWidth={1.7} /></Link>
            <Link to="/shop" className="rounded-full p-3 text-[#171713] transition hover:bg-black/5" aria-label="Shopping bag"><ShoppingBag size={19} strokeWidth={1.7} /></Link>
            <button onClick={() => setOpen(!open)} className="rounded-full p-3 text-[#171713] transition hover:bg-black/5 lg:hidden" aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open}>{open ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-black/10 bg-[#f6f3ec] px-5 py-6 lg:hidden" aria-label="Mobile navigation">
            <div className="mx-auto flex max-w-[1440px] flex-col">
              {navItems.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-black/10 py-4 font-serif text-2xl text-[#171713] last:border-0">{item.label}<ArrowUpRight size={18} /></Link>)}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
