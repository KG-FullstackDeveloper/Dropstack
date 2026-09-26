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
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="aspect-square overflow-hidden bg-slate-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            No image
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {product.category}
        </p>

        <h3 className="mt-2 text-lg font-semibold text-slate-950">
          {product.name}
        </h3>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-bold text-slate-950">
            {formatCurrency(product.price, product.currency)}
          </span>

          <span className="flex items-center gap-1 text-sm font-semibold text-slate-700">
            View
            <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}
