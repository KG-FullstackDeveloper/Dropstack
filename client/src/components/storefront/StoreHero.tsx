import { ArrowRight } from "lucide-react";

import type { Product } from "../../types/product";

interface StoreHeroProps {
  storeName: string;
  description?: string;
  product?: Product;
  primaryColor?: string;
  accentColor?: string;
  onShop: () => void;
  onContact?: () => void;
}

export default function StoreHero({
  storeName,
  description,
  product,
  primaryColor = "#111827",
  accentColor = "#2563eb",
  onShop,
  onContact,
}: StoreHeroProps) {
  return (
    <section className="overflow-hidden">
      <div className="mx-auto grid min-h-[560px] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8">
        <div className="max-w-2xl">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em] sm:text-sm"
            style={{
              color: accentColor,
            }}
          >
            {storeName}
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            Discover products
            made for your everyday.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
            {description ||
              "Explore our latest products and discover something you'll love."}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onShop}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{
                backgroundColor:
                  primaryColor,
              }}
            >
              Shop now
              <ArrowRight size={17} />
            </button>

            {onContact && (
              <button
                type="button"
                onClick={onContact}
                className="rounded-xl border border-slate-300 px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-900"
              >
                Contact us
              </button>
            )}
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl">
          <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-slate-100 dark:bg-slate-900">
            {product?.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-400">
                Your featured product image
                will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}