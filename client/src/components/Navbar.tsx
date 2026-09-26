import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight text-slate-950"
        >
          MEO Store
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            className="text-sm font-medium text-slate-700 hover:text-slate-950"
          >
            Home
          </Link>

          <Link
            to="/shop"
            className="text-sm font-medium text-slate-700 hover:text-slate-950"
          >
            Shop
          </Link>

          <Link
            to="/admin"
            className="text-sm font-medium text-slate-700 hover:text-slate-950"
          >
            Admin
          </Link>

          <Link
            to="/shop"
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Shop now
          </Link>
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 md:hidden"
          aria-label={
            open ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 px-6 py-5 md:hidden">
          <div className="flex flex-col gap-5">
            <Link
              to="/"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>

            <Link
              to="/shop"
              onClick={() => setOpen(false)}
            >
              Shop
            </Link>

            <Link
              to="/admin"
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}