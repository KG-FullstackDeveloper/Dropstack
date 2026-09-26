import type { Product } from "../../types/product";
import { formatCurrency } from "../../utils/currency";

interface RelatedProductsProps {
  products: Product[];
  currentProductId?: string;
  onProductClick: (
    product: Product
  ) => void;
}

export default function RelatedProducts({
  products,
  currentProductId,
  onProductClick,
}: RelatedProductsProps) {
  const related = products
    .filter(
      (product) =>
        product.id !== currentProductId
    )
    .slice(0, 4);

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-slate-200 py-14 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              You may also like
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
              Related products
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((product) => (
            <button
              type="button"
              key={product.id}
              onClick={() =>
                onProductClick(product)
              }
              className="group min-w-0 text-left"
            >
              <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    No image
                  </div>
                )}
              </div>

              <div className="pt-3">
                <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                  {product.name}
                </h3>

                <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                  {formatCurrency(
                    product.price,
                    product.currency
                  )}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}