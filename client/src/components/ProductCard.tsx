import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Product } from "../types/product";
import { formatCurrency } from "../utils/currency";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  return (
    <Link
      to={`/product/${product.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 motion-reduce:transform-none motion-reduce:transition-none"
    >
      {/* Product image */}
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No image available
          </div>
        )}

        {/* View product indicator */}
        <div className="absolute inset-0 flex items-end justify-center bg-black/0 pb-5 transition-colors duration-300 group-hover:bg-black/10 motion-reduce:transition-none">
          <span className="translate-y-3 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transform-none motion-reduce:transition-none">
            View product
          </span>
        </div>
      </div>

      {/* Product details */}
      <div className="p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {product.category || "General"}
        </p>

        <h3 className="mt-2 line-clamp-2 min-h-12 text-base font-semibold text-slate-950 transition-colors group-hover:text-slate-600 dark:text-white dark:group-hover:text-slate-300 sm:text-lg">
          {product.name}
        </h3>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="font-bold text-slate-950 dark:text-white">
            {formatCurrency(product.price, product.currency)}
          </span>

          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
            View
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}