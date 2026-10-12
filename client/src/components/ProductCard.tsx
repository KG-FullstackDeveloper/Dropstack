import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "../types/product";
import { formatCurrency } from "../utils/currency";

interface Props { product: Product; index?: number }
const palettes = ["from-[#c7b8a0] via-[#e8dfd0] to-[#a5947d]", "from-[#b7c0ad] via-[#e4e8dc] to-[#89937f]", "from-[#b8aab4] via-[#e8dfe4] to-[#8d7e88]", "from-[#b5b6bc] via-[#e5e5e7] to-[#898b92]"];

export default function ProductCard({ product, index = 0 }: Props) {
  return (
<<<<<<< HEAD
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
=======
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-[#ebe7de]">
        {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]" /> : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${palettes[index % palettes.length]}`}>
            <div className="relative grid h-[48%] w-[48%] place-items-center rounded-full border border-white/50 bg-white/15 shadow-[0_30px_70px_rgba(30,25,20,0.18)] backdrop-blur-sm transition duration-700 group-hover:scale-105 group-hover:rotate-3">
              <span className="font-serif text-5xl text-white/85">{product.name.charAt(0)}</span><div className="absolute inset-[14%] rounded-full border border-white/30" />
            </div>
          </div>
        )}
        <span className="absolute left-4 top-4 bg-[#f6f3ec]/90 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#171713] backdrop-blur">Curated</span>
        <span className="absolute bottom-4 right-4 grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-[#171713] text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight size={17} /></span>
      </div>
      <div className="flex items-start justify-between gap-4 pt-5">
        <div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8a857a]">{product.category}</p><h3 className="mt-2 font-serif text-xl leading-tight text-[#171713] transition group-hover:text-[#77664d]">{product.name}</h3></div>
        <span className="shrink-0 text-sm font-semibold text-[#171713]">{formatCurrency(product.price, product.currency)}</span>
>>>>>>> 5095110c003cc39fcdb7e559c7dbc06833130cf1
      </div>
    </Link>
  );
}