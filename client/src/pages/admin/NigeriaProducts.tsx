import {
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  createNigeriaProduct,
  deleteNigeriaProduct,
  getNigeriaProducts,
  updateNigeriaProduct,
  type CreateNigeriaProductInput,
  type NigeriaProduct,
  type UpdateNigeriaProductInput,
} from "../../services/nigeriaApi";
import { formatCurrency } from "../../utils/currency";

export default function NigeriaProducts() {
  const [products, setProducts] = useState<
    NigeriaProduct[]
  >([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<NigeriaProduct | null>(null);

  const loadProducts = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getNigeriaProducts();

        setProducts(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load Nigeria products.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const query =
      search.trim().toLowerCase();

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
          .includes(query),
    );
  }, [products, search]);

  function handleCreated(
    product: NigeriaProduct,
  ) {
    setProducts((current) => [
      product,
      ...current,
    ]);
    setModalOpen(false);
  }

  function handleUpdated(
    product: NigeriaProduct,
  ) {
    setProducts((current) =>
      current.map((item) =>
        item.id === product.id
          ? product
          : item,
      ),
    );
    setEditingProduct(null);
  }

  async function handleDelete(
    product: NigeriaProduct,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${product.name}" from Nigeria Ecommerce? This cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteNigeriaProduct(
        product.id,
      );

      setProducts((current) =>
        current.filter(
          (item) =>
            item.id !== product.id,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete Nigeria product.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Package size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                Nigeria Products
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Products belonging only to the Nigeria Ecommerce workspace.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setModalOpen(true)
          }
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          <Plus size={17} />
          Add product
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search Nigeria products..."
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-slate-950 focus:bg-white focus:ring-2 focus:ring-slate-950/10"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 rounded-lg p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center text-sm font-semibold text-slate-500">
            Loading Nigeria products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Package size={24} />
            </div>

            <h2 className="mt-4 text-lg font-black text-slate-900">
              {search
                ? "No products found"
                : "No Nigeria products yet"}
            </h2>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              {search
                ? "Try a different product name, category or slug."
                : "Add your first Nigeria Ecommerce product to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                    Product
                  </th>

                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                    Category
                  </th>

                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                    Price
                  </th>

                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                    Inventory
                  </th>

                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                    Profit
                  </th>

                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(
                  (product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onEdit={() =>
                        setEditingProduct(
                          product,
                        )
                      }
                      onDelete={() =>
                        void handleDelete(
                          product,
                        )
                      }
                    />
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <CreateProductModal
          onClose={() =>
            setModalOpen(false)
          }
          onCreated={handleCreated}
        />
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() =>
            setEditingProduct(null)
          }
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Product Row                                                                */
/* -------------------------------------------------------------------------- */

function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: NigeriaProduct;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const inventory = Number(
    product.inventory,
  );

  const lowStock =
    inventory <=
    Number(
      product.low_stock_threshold,
    );

  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <Package size={19} />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {product.name}
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-400">
              {product.slug}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-slate-600">
        {product.category || "Uncategorized"}
      </td>

      <td className="px-5 py-4 text-sm font-bold text-slate-900">
        {formatCurrency(
          Number(product.price) || 0,
          "NGN",
        )}
      </td>

      <td className="px-5 py-4">
        <div>
          <p
            className={`text-sm font-bold ${
              lowStock
                ? "text-amber-600"
                : "text-slate-900"
            }`}
          >
            {inventory}
          </p>

          <p className="text-xs text-slate-400">
            {lowStock
              ? "Low stock"
              : "In stock"}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <p
          className={`text-sm font-bold ${
            Number(product.profit_margin) >= 25
              ? "text-emerald-600"
              : Number(product.profit_margin) >=
                  15
                ? "text-slate-700"
                : Number(product.profit_margin) >
                    0
                  ? "text-amber-600"
                  : "text-red-600"
          }`}
        >
          {formatCurrency(
            Number(
              product.profit_per_unit,
            ) || 0,
            "NGN",
          )}
        </p>

        <p className="text-xs text-slate-400">
          {Number(
            product.profit_margin,
          ).toFixed(1)}
          %
        </p>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
            product.active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {product.active
            ? "Active"
            : "Inactive"}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            title="Edit product"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Delete product"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Create Product Modal                                                       */
/* -------------------------------------------------------------------------- */

function CreateProductModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (
    product: NigeriaProduct,
  ) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [category, setCategory] =
    useState("");
  const [price, setPrice] =
    useState("");
  const [supplierCost, setSupplierCost] =
    useState("");
  const [shippingCost, setShippingCost] =
    useState("");
  const [otherCost, setOtherCost] =
    useState("");
  const [inventory, setInventory] =
    useState("");
  const [lowStockThreshold, setLowStockThreshold] =
    useState("5");
  const [imageUrl, setImageUrl] =
    useState("");
  const [videoUrl, setVideoUrl] =
    useState("");
  const [supplierName, setSupplierName] =
    useState("");
  const [supplierProductId, setSupplierProductId] =
    useState("");
  const [active, setActive] =
    useState(true);

  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");

  const previewProfit =
    (Number(price) || 0) -
    (Number(supplierCost) || 0) -
    (Number(shippingCost) || 0) -
    (Number(otherCost) || 0);

  const previewMargin =
    Number(price) > 0
      ? (previewProfit /
          Number(price)) *
        100
      : 0;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Product name is required.",
      );
      return;
    }

    const payload: CreateNigeriaProductInput =
      {
        name: name.trim(),
        description:
          description.trim(),
        category: category.trim(),
        price: Number(price) || 0,
        supplierCost:
          Number(supplierCost) || 0,
        shippingCost:
          Number(shippingCost) || 0,
        otherCost:
          Number(otherCost) || 0,
        inventory:
          Number(inventory) || 0,
        lowStockThreshold:
          Number(
            lowStockThreshold,
          ) || 0,
        imageUrl:
          imageUrl.trim() || undefined,
        videoUrl:
          videoUrl.trim() || undefined,
        supplierName:
          supplierName.trim() ||
          undefined,
        supplierProductId:
          supplierProductId.trim() ||
          undefined,
        active,
      };

    try {
      setSaving(true);
      setError("");

      const product =
        await createNigeriaProduct(
          payload,
        );

      onCreated(product);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create Nigeria product.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProductModalShell
      title="Add Nigeria product"
      description="This product will belong only to Nigeria Ecommerce."
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="overflow-y-auto p-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Product name"
            value={name}
            onChange={setName}
            required
          />

          <Field
            label="Category"
            value={category}
            onChange={setCategory}
          />

          <div className="sm:col-span-2">
            <Field
              label="Description"
              value={description}
              onChange={setDescription}
              textarea
            />
          </div>

          <Field
            label="Selling price (NGN)"
            value={price}
            onChange={setPrice}
            type="number"
            min="0"
          />

          <Field
            label="Supplier cost (NGN)"
            value={supplierCost}
            onChange={setSupplierCost}
            type="number"
            min="0"
          />

          <Field
            label="Shipping cost (NGN)"
            value={shippingCost}
            onChange={setShippingCost}
            type="number"
            min="0"
          />

          <Field
            label="Other cost (NGN)"
            value={otherCost}
            onChange={setOtherCost}
            type="number"
            min="0"
          />

          <Field
            label="Inventory"
            value={inventory}
            onChange={setInventory}
            type="number"
            min="0"
          />

          <Field
            label="Low stock threshold"
            value={lowStockThreshold}
            onChange={
              setLowStockThreshold
            }
            type="number"
            min="0"
          />

          <Field
            label="Image URL"
            value={imageUrl}
            onChange={setImageUrl}
            type="url"
          />

          <Field
            label="Video URL"
            value={videoUrl}
            onChange={setVideoUrl}
            type="url"
          />

          <Field
            label="Supplier name"
            value={supplierName}
            onChange={setSupplierName}
          />

          <Field
            label="Supplier product ID"
            value={supplierProductId}
            onChange={
              setSupplierProductId
            }
          />
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <PreviewStat
              label="Profit / unit"
              value={formatCurrency(
                previewProfit,
                "NGN",
              )}
            />

            <PreviewStat
              label="Profit margin"
              value={`${previewMargin.toFixed(1)}%`}
            />

            <PreviewStat
              label="Selling price"
              value={formatCurrency(
                Number(price) || 0,
                "NGN",
              )}
            />
          </div>
        </div>

        <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) =>
              setActive(
                event.target.checked,
              )
            }
            className="h-4 w-4"
          />
          Product is active
        </label>

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="min-h-11 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving
              ? "Creating..."
              : "Create product"}
          </button>
        </div>
      </form>
    </ProductModalShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Edit Product Modal                                                         */
/* -------------------------------------------------------------------------- */

function EditProductModal({
  product,
  onClose,
  onUpdated,
}: {
  product: NigeriaProduct;
  onClose: () => void;
  onUpdated: (
    product: NigeriaProduct,
  ) => void;
}) {
  const [name, setName] =
    useState(product.name);
  const [description, setDescription] =
    useState(product.description || "");
  const [category, setCategory] =
    useState(product.category || "");
  const [price, setPrice] =
    useState(String(product.price ?? ""));
  const [supplierCost, setSupplierCost] =
    useState(
      String(product.supplier_cost ?? ""),
    );
  const [shippingCost, setShippingCost] =
    useState(
      String(product.shipping_cost ?? ""),
    );
  const [otherCost, setOtherCost] =
    useState(
      String(product.other_cost ?? ""),
    );
  const [inventory, setInventory] =
    useState(
      String(product.inventory ?? ""),
    );
  const [lowStockThreshold, setLowStockThreshold] =
    useState(
      String(
        product.low_stock_threshold ?? 5,
      ),
    );
  const [imageUrl, setImageUrl] =
    useState(product.image_url || "");
  const [videoUrl, setVideoUrl] =
    useState(product.video_url || "");
  const [supplierName, setSupplierName] =
    useState(product.supplier_name || "");
  const [supplierProductId, setSupplierProductId] =
    useState(
      product.supplier_product_id || "",
    );
  const [active, setActive] =
    useState(Boolean(product.active));

  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");

  const previewProfit =
    (Number(price) || 0) -
    (Number(supplierCost) || 0) -
    (Number(shippingCost) || 0) -
    (Number(otherCost) || 0);

  const previewMargin =
    Number(price) > 0
      ? (previewProfit /
          Number(price)) *
        100
      : 0;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Product name is required.",
      );
      return;
    }

    const payload: UpdateNigeriaProductInput =
      {
        name: name.trim(),
        description:
          description.trim(),
        category: category.trim(),
        price: Number(price) || 0,
        supplierCost:
          Number(supplierCost) || 0,
        shippingCost:
          Number(shippingCost) || 0,
        otherCost:
          Number(otherCost) || 0,
        inventory:
          Number(inventory) || 0,
        lowStockThreshold:
          Number(
            lowStockThreshold,
          ) || 0,
        imageUrl:
          imageUrl.trim() || null,
        videoUrl:
          videoUrl.trim() || null,
        supplierName:
          supplierName.trim() || null,
        supplierProductId:
          supplierProductId.trim() ||
          null,
        active,
      };

    try {
      setSaving(true);
      setError("");

      const updated =
        await updateNigeriaProduct(
          product.id,
          payload,
        );

      onUpdated(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update Nigeria product.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProductModalShell
      title="Edit Nigeria product"
      description="Changes apply only to this Nigeria Ecommerce product."
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="overflow-y-auto p-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Product name"
            value={name}
            onChange={setName}
            required
          />

          <Field
            label="Category"
            value={category}
            onChange={setCategory}
          />

          <div className="sm:col-span-2">
            <Field
              label="Description"
              value={description}
              onChange={setDescription}
              textarea
            />
          </div>

          <Field
            label="Selling price (NGN)"
            value={price}
            onChange={setPrice}
            type="number"
            min="0"
          />

          <Field
            label="Supplier cost (NGN)"
            value={supplierCost}
            onChange={setSupplierCost}
            type="number"
            min="0"
          />

          <Field
            label="Shipping cost (NGN)"
            value={shippingCost}
            onChange={setShippingCost}
            type="number"
            min="0"
          />

          <Field
            label="Other cost (NGN)"
            value={otherCost}
            onChange={setOtherCost}
            type="number"
            min="0"
          />

          <Field
            label="Inventory"
            value={inventory}
            onChange={setInventory}
            type="number"
            min="0"
          />

          <Field
            label="Low stock threshold"
            value={lowStockThreshold}
            onChange={
              setLowStockThreshold
            }
            type="number"
            min="0"
          />

          <Field
            label="Image URL"
            value={imageUrl}
            onChange={setImageUrl}
            type="url"
          />

          <Field
            label="Video URL"
            value={videoUrl}
            onChange={setVideoUrl}
            type="url"
          />

          <Field
            label="Supplier name"
            value={supplierName}
            onChange={setSupplierName}
          />

          <Field
            label="Supplier product ID"
            value={supplierProductId}
            onChange={
              setSupplierProductId
            }
          />
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <PreviewStat
              label="Profit / unit"
              value={formatCurrency(
                previewProfit,
                "NGN",
              )}
            />

            <PreviewStat
              label="Profit margin"
              value={`${previewMargin.toFixed(1)}%`}
            />

            <PreviewStat
              label="Selling price"
              value={formatCurrency(
                Number(price) || 0,
                "NGN",
              )}
            />
          </div>
        </div>

        <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) =>
              setActive(
                event.target.checked,
              )
            }
            className="h-4 w-4"
          />
          Product is active
        </label>

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="min-h-11 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save changes"}
          </button>
        </div>
      </form>
    </ProductModalShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal Shell                                                                */
/* -------------------------------------------------------------------------- */

function ProductModalShell({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Field                                                                      */
/* -------------------------------------------------------------------------- */

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">
        {label}
      </span>

      {textarea ? (
        <textarea
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          required={required}
          rows={4}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          required={required}
          min={min}
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
        />
      )}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Preview Stat                                                               */
/* -------------------------------------------------------------------------- */

function PreviewStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}