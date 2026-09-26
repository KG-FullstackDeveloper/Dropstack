import {
ArrowUpRight,
ShoppingBag,
} from "lucide-react";

import type { Product } from "../../types/product";

interface StoreProductCardProps {
product: Product;
onClick: (product: Product) => void;
}

export default function StoreProductCard({
product,
onClick,
}: StoreProductCardProps) {
const price = Number(product.price) || 0;
const currency = product.currency || "USD";

const formattedPrice =
new Intl.NumberFormat(undefined, {
style: "currency",
currency,
maximumFractionDigits: 2,
}).format(price);

return ( <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
<button
type="button"
onClick={() => onClick(product)}
aria-label={`View ${product.name}`}
className="block w-full text-left"
> <div className="relative aspect-square overflow-hidden bg-slate-100">
{product.image_url ? ( <img
           src={product.image_url}
           alt={product.name}
           loading="lazy"
           className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
         />
) : ( <div className="flex h-full items-center justify-center text-sm text-slate-400">
No image </div>
)}


      <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-900 opacity-0 shadow-sm transition duration-300 group-hover:opacity-100">
        <ArrowUpRight size={18} />
      </span>
    </div>

    <div className="p-5">
      {product.category && (
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {product.category}
        </p>
      )}

      <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-slate-950">
        {product.name}
      </h3>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-slate-950">
            {formattedPrice}
          </p>

          {product.delivery_time && (
            <p className="mt-1 text-xs text-slate-500">
              {product.delivery_time}
            </p>
          )}
        </div>

        <span className="flex h-9 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-xs font-semibold text-white transition group-hover:bg-slate-800">
          <ShoppingBag size={14} />
          View
        </span>
      </div>
    </div>
  </button>
</article>

);
}
