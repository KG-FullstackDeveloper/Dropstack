import {
Package,
Plus,
Search,
} from "lucide-react";
import {
useEffect,
useMemo,
useState,
} from "react";

import type { Product } from "../../types/product";
import { getProducts } from "../../services/api";
import { formatCurrency } from "../../utils/currency";

export default function Products() {
const [
products,
setProducts,
] = useState<Product[]>([]);

const [
search,
setSearch,
] = useState("");

const [
loading,
setLoading,
] = useState(true);

const [
error,
setError,
] = useState("");

useEffect(() => {
let active = true;

async function loadProducts() {
  try {
    setLoading(true);
    setError("");

    const result =
      await getProducts();

    if (active) {
      setProducts(
        result
      );
    }
  } catch (err) {
    console.error(
      "Failed to load products:",
      err
    );

    if (active) {
      setError(
        "Unable to load products."
      );
    }
  } finally {
    if (active) {
      setLoading(false);
    }
  }
}

loadProducts();

return () => {
  active = false;
};

}, []);

const filteredProducts =
useMemo(() => {
const query =
search
.trim()
.toLowerCase();

  if (!query) {
    return products;
  }

  return products.filter(
    (product) =>
      product.name
        .toLowerCase()
        .includes(query) ||
      product.category
        .toLowerCase()
        .includes(query) ||
      product.slug
        .toLowerCase()
        .includes(query)
  );
}, [
  products,
  search,
]);

return ( <div> <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"> <div> <p className="text-sm text-slate-500">
Catalog </p>

      <h1 className="mt-1 text-3xl font-bold text-slate-950">
        Products
      </h1>

      <p className="mt-2 text-slate-500">
        Manage the products you sell and their real costs.
      </p>
    </div>

    <button
      type="button"
      className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      <Plus size={18} />
      Add product
    </button>
  </div>

  <div className="mt-8 rounded-2xl border border-slate-200 bg-white">
    <div className="flex items-center gap-3 border-b border-slate-200 p-5">
      <Search
        size={18}
        className="text-slate-400"
      />

      <input
        value={search}
        onChange={(event) =>
          setSearch(
            event.target.value
          )
        }
        placeholder="Search products..."
        className="w-full bg-transparent text-sm outline-none"
      />
    </div>

    {loading && (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-500">
          Loading products...
        </p>
      </div>
    )}

    {!loading && error && (
      <div className="p-12 text-center">
        <p className="text-sm text-red-500">
          {error}
        </p>
      </div>
    )}

    {!loading &&
      !error &&
      filteredProducts.length > 0 && (
        <div className="divide-y divide-slate-100">
          {filteredProducts.map(
            (product) => {
              const profit =
                Number(
                  product.profit_per_unit
                ) || 0;

              const margin =
                Number(
                  product.profit_margin
                ) || 0;

              return (
                <div
                  key={
                    product.id
                  }
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {product.image_url ? (
                      <img
                        src={
                          product.image_url
                        }
                        alt={
                          product.name
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package
                          size={24}
                          className="text-slate-300"
                        />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-900">
                      {
                        product.name
                      }
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        product.category
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {product.supplier_name ||
                        "No supplier assigned"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:flex sm:items-center sm:gap-8">
                    <div>
                      <p className="text-xs text-slate-400">
                        Selling
                      </p>

                      <p className="mt-1 font-semibold">
                        {formatCurrency(
                          product.price,
                          product.currency
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Supplier
                      </p>

                      <p className="mt-1 font-semibold">
                        {formatCurrency(
                          product.supplier_cost,
                          product.currency
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Profit
                      </p>

                      <p
                        className={`mt-1 font-semibold ${
                          profit >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(
                          profit,
                          product.currency
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Margin
                      </p>

                      <p
                        className={`mt-1 font-semibold ${
                          margin >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {margin.toFixed(
                          1
                        )}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

    {!loading &&
      !error &&
      filteredProducts.length ===
        0 && (
        <div className="p-12 text-center">
          <Package
            size={40}
            className="mx-auto text-slate-300"
          />

          <p className="mt-3 font-medium text-slate-600">
            {products.length ===
            0
              ? "No products yet."
              : "No products match your search."}
          </p>

          {products.length ===
            0 && (
            <p className="mt-1 text-sm text-slate-400">
              Add your first real product to your catalog.
            </p>
          )}
        </div>
      )}
  </div>
</div>

);
}
