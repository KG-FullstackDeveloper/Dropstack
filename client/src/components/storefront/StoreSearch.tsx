import {
  Search,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Product } from "../../types/product";

interface StoreSearchProps {
  open: boolean;
  products: Product[];
  onClose: () => void;
  onProductClick: (product: Product) => void;
}

export default function StoreSearch({
  open,
  products,
  onClose,
  onProductClick,
}: StoreSearchProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQuery("");
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, onClose]);

  const filteredProducts = useMemo(() => {
    const trimmedQuery = query
      .trim()
      .toLowerCase();

    if (!trimmedQuery) {
      return [];
    }

    return products.filter((product) => {
      const searchableText = [
        product.name,
        product.description,
        product.category,
        product.slug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        trimmedQuery
      );
    });
  }, [products, query]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="mx-auto mt-20 w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Search
              size={20}
              className="text-slate-500"
            />

            <h2 className="font-semibold text-slate-950 dark:text-white">
              Search products
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close search"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-slate-400 dark:border-slate-700 dark:focus-within:border-slate-500">
            <Search
              size={20}
              className="shrink-0 text-slate-400"
            />

            <input
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search products..."
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="text-slate-400 hover:text-slate-950 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {query.trim() && (
            <div className="mt-5">
              {filteredProducts.length > 0 ? (
                <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {filteredProducts.map(
                    (product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() =>
                          onProductClick(product)
                        }
                        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                            {product.name}
                          </p>

                          {product.category && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {product.category}
                            </p>
                          )}
                        </div>

                        <span className="shrink-0 text-xs font-medium text-slate-500">
                          View
                        </span>
                      </button>
                    )
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 px-5 py-8 text-center dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No products found
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Try a different search term.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}