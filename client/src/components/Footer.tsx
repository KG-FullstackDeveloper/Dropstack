import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#171713] text-[#f4f0e7]">
      <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid gap-14 border-b border-white/15 pb-16 lg:grid-cols-[1.7fr_1fr_1fr]">
          <div>
            <Link
              to="/"
              className="font-serif text-4xl leading-tight sm:text-5xl"
            >
              MEO Store
            </Link>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/55">
              Discover useful essentials, explore our collection, and get clear
              updates and support throughout your shopping experience.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
              Explore
            </p>
            <div className="mt-6 flex flex-col gap-3 text-sm">
              <Link to="/shop" className="hover:text-white/60">
                Shop all
              </Link>
              <Link to="/about" className="hover:text-white/60">
                About us
              </Link>
              <Link to="/shipping" className="hover:text-white/60">
                Shipping
              </Link>
              <Link to="/faq" className="hover:text-white/60">
                FAQ
              </Link>
              <Link to="/contact" className="hover:text-white/60">
                Contact support
              </Link>
              <Link to="/order-tracking" className="hover:text-white/60">
                Order tracking
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
              Policies
            </p>
            <div className="mt-6 flex flex-col gap-3 text-sm">
              <Link to="/privacy" className="hover:text-white/60">
                Privacy policy
              </Link>
              <Link to="/terms" className="hover:text-white/60">
                Terms of service
              </Link>
              <Link to="/refund-returns" className="hover:text-white/60">
                Refunds & returns
              </Link>
            </div>

            <Link
              to="/contact"
              className="mt-7 flex items-center justify-between border-b border-white/30 pb-3 text-sm transition hover:border-white"
            >
              Contact the team
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-7 text-[10px] uppercase tracking-[0.16em] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MEO Store</p>
          <p>Delivery estimates vary by product and destination</p>
        </div>
      </div>
    </footer>
  );
}
