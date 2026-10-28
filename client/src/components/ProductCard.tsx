import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "../types/product";
import { convertCurrency, formatCurrency } from "../utils/currency";

interface Props {
  product: Product;
  index?: number;
  currency?: string;
}

// Different fallback gradients when a product has no image.
const palettes = [
  "from-[#c7b8a0] via-[#e8dfd0] to-[#a5947d]",
  "from-[#b7c0ad] via-[#e4e8dc] to-[#89937f]",
  "from-[#b8aab4] via-[#e8dfe4] to-[#8d7e88]",
  "from-[#b5b6bc] via-[#e5e5e7] to-[#898b92]",
];

export default function ProductCard({ product, index = 0, currency }: Props) {
  const displayCurrency = currency || product.currency || "USD";

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 motion-reduce:transform-none motion-reduce:transition-none"
    >
      {/* Product image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${
              palettes[index % palettes.length]
            }`}
          >
            <div className="relative grid h-[48%] w-[48%] place-items-center rounded-full border border-white/50 bg-white/15 shadow-[0_30px_70px_rgba(30,25,20,0.18)] backdrop-blur-sm transition duration-700 group-hover:scale-105">
              <span className="font-serif text-5xl text-white/85">
                {product.name.charAt(0)}
              </span>
              <div className="absolute inset-[14%] rounded-full border border-white/30" />
            </div>
          </div>
        )}

        {/* Product category badge */}
        <span className="absolute left-3 top-3 max-w-[75%] truncate rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-900 backdrop-blur dark:bg-slate-950/90 dark:text-white sm:left-4 sm:top-4">
          {product.category || "General"}
        </span>

        {/* Hover action */}
        <span className="absolute bottom-4 right-4 grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-slate-950 text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 dark:bg-white dark:text-slate-950 motion-reduce:transform-none motion-reduce:transition-none">
          <ArrowUpRight size={17} />
        </span>
      </div>

      {/* Product details */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 line-clamp-2 font-serif text-lg leading-tight text-slate-950 transition-colors group-hover:text-slate-600 dark:text-white dark:group-hover:text-slate-300 sm:text-xl">
            {product.name}
          </h3>

          <span className="shrink-0 text-sm font-semibold text-slate-950 dark:text-white">
            {formatCurrency(
              convertCurrency(
                product.price,
                product.currency || "USD",
                displayCurrency,
              ),
              displayCurrency,
            )}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>Explore product</span>
          <ArrowUpRight
            size={15}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
          />
        </div>
      </div>
    </Link>
  );
}
