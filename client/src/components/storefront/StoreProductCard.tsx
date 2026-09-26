import type { Product } from "../../types/product";

interface StoreProductCardProps {
product: Product;
onClick?: () => void;
}

export default function StoreProductCard({
product,
onClick,
}: StoreProductCardProps) {
const currency =
product.currency || "USD";

const price =
new Intl.NumberFormat("en-US", {
style: "currency",
currency,
}).format(product.price);

return (
<button type="button" onClick={onClick} className="group block w-full text-left" >
<div className="relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
{product.image_url ? (
<img src={product.image_url} alt={product.name} loading="lazy" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" />
) : (
<div className="flex aspect-square items-center justify-center text-sm text-slate-400">
No image available
</div>
)}

    <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full p-4 transition duration-300 group-hover:translate-y-0">
      <span className="block rounded-xl bg-white/95 px-4 py-3 text-center text-sm font-bold text-slate-950 shadow-lg backdrop-blur dark:bg-slate-950/95 dark:text-white">
        View product
      </span>
    </div>
  </div>

  <div className="mt-4">
    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
      {product.category}
    </p>

    <h3 className="mt-1 line-clamp-2 text-sm font-bold sm:text-base">
      {product.name}
    </h3>

    <div className="mt-2 flex items-center justify-between gap-3">
      <span className="font-black">
        {price}
      </span>

      {product.delivery_time && (
        <span className="text-xs text-slate-400">
          {product.delivery_time}
        </span>
      )}
    </div>
  </div>
</button>

);
}