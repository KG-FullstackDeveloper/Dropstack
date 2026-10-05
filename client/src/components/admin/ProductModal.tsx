import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createProduct,
  updateProduct,
} from "../../services/adminApi";

import type {
  Product,
  ProductVariant,
} from "../../types/product";

interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
  onSaved: (product: Product) => void;
}

interface FormState {
  name: string;
  slug: string;
  sku: string;
  category: string;
  description: string;

  price: string;
  currency: string;

  image_url: string;
  images: string[];

  supplier_name: string;
  supplier_product_id: string;
  warehouse_country: string;

  supplier_cost: string;
  shipping_cost: string;
  other_cost: string;

  processing_time: string;
  delivery_time: string;

  stock: string;
  low_stock_threshold: string;

  variants: ProductVariant[];

  active: boolean;
}

const CATEGORIES = [
  "Electronics",
  "Beauty & Skincare",
  "Pet Products",
  "Shapewear",
  "Clothing",
  "Accessories",
  "Home & Garden",
  "Other",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createEmptyVariant(): ProductVariant {
  return {
    id: `variant-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    name: "",
    value: "",
    price: "",
    sku: "",
    stock: "",
  };
}

function createInitialState(
  product?: Product | null,
): FormState {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    sku: product?.sku ?? "",
    category: product?.category ?? "Other",
    description: product?.description ?? "",

    price:
      product?.price !== undefined
        ? String(product.price)
        : "",
    currency: product?.currency ?? "USD",

    image_url: product?.image_url ?? "",
    images: Array.isArray(product?.images)
      ? product.images
      : [],

    supplier_name:
      product?.supplier_name ?? "",
    supplier_product_id:
      product?.supplier_product_id ?? "",
    warehouse_country:
      product?.warehouse_country ?? "",

    supplier_cost:
      product?.supplier_cost !== undefined
        ? String(product.supplier_cost)
        : "0",

    shipping_cost:
      product?.shipping_cost !== undefined
        ? String(product.shipping_cost)
        : "0",

    other_cost:
      product?.other_cost !== undefined
        ? String(product.other_cost)
        : "0",

    processing_time:
      product?.processing_time ?? "",

    delivery_time:
      product?.delivery_time ?? "",

    stock:
      product?.stock !== undefined
        ? String(product.stock)
        : "0",

    low_stock_threshold:
      product?.low_stock_threshold !== undefined
        ? String(product.low_stock_threshold)
        : "5",

    variants: Array.isArray(product?.variants)
      ? product.variants
      : [],

    active:
      product?.active === undefined
        ? true
        : Boolean(product.active),
  };
}

export default function ProductModal({
  product,
  onClose,
  onSaved,
}: ProductModalProps) {
  const isEditing = Boolean(product);

  const [form, setForm] = useState<FormState>(
    () => createInitialState(product),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [newImage, setNewImage] =
    useState("");

  const [autoSlug, setAutoSlug] =
    useState(!isEditing);

  useEffect(() => {
    setForm(createInitialState(product));
    setAutoSlug(!product);
    setError("");
  }, [product]);

  const supplierCost = Number(
    form.supplier_cost || 0,
  );

  const shippingCost = Number(
    form.shipping_cost || 0,
  );

  const otherCost = Number(
    form.other_cost || 0,
  );

  const sellingPrice = Number(
    form.price || 0,
  );

  const profit = useMemo(() => {
    return (
      sellingPrice -
      supplierCost -
      shippingCost -
      otherCost
    );
  }, [
    sellingPrice,
    supplierCost,
    shippingCost,
    otherCost,
  ]);

  const margin = useMemo(() => {
    if (sellingPrice <= 0) return 0;

    return (profit / sellingPrice) * 100;
  }, [sellingPrice, profit]);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: autoSlug
        ? slugify(value)
        : current.slug,
    }));
  }

  function addImage() {
    const value = newImage.trim();

    if (!value) return;

    setForm((current) => ({
      ...current,
      images: [
        ...current.images,
        value,
      ],
    }));

    setNewImage("");
  }

  function removeImage(index: number) {
    setForm((current) => ({
      ...current,
      images: current.images.filter(
        (_, imageIndex) =>
          imageIndex !== index,
      ),
    }));
  }

  function updateVariant(
    index: number,
    field: keyof ProductVariant,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map(
        (variant, variantIndex) =>
          variantIndex === index
            ? {
                ...variant,
                [field]: value,
              }
            : variant,
      ),
    }));
  }

  function addVariant() {
    setForm((current) => ({
      ...current,
      variants: [
        ...current.variants,
        createEmptyVariant(),
      ],
    }));
  }

  function removeVariant(index: number) {
    setForm((current) => ({
      ...current,
      variants: current.variants.filter(
        (_, variantIndex) =>
          variantIndex !== index,
      ),
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const name = form.name.trim();
    const slug = form.slug.trim();

    if (!name) {
      setError("Product name is required.");
      return;
    }

    if (!slug) {
      setError("Product slug is required.");
      return;
    }

    if (sellingPrice <= 0) {
      setError(
        "Selling price must be greater than 0.",
      );
      return;
    }

    const stock = Math.max(
      0,
      Number(form.stock || 0),
    );

    const lowStockThreshold = Math.max(
      0,
      Number(
        form.low_stock_threshold || 0,
      ),
    );

    const payload = {
      name,
      slug,
      sku: form.sku.trim() || undefined,

      category: form.category,
      description:
        form.description.trim(),

      price: sellingPrice,
      currency:
        form.currency.trim() || "USD",

      image_url:
        form.image_url.trim() || undefined,

      images: form.images.filter(
        (image) => image.trim(),
      ),

      supplier_name:
        form.supplier_name.trim() ||
        undefined,

      supplier_product_id:
        form.supplier_product_id.trim() ||
        undefined,

      warehouse_country:
        form.warehouse_country.trim() ||
        undefined,

      supplier_cost: supplierCost,
      shipping_cost: shippingCost,
      other_cost: otherCost,

      processing_time:
        form.processing_time.trim() ||
        undefined,

      delivery_time:
        form.delivery_time.trim() ||
        undefined,

      stock,
      low_stock_threshold:
        lowStockThreshold,

      variants: form.variants,

      active: form.active ? 1 : 0,
    };

    try {
      setSaving(true);

      const saved = isEditing
        ? await updateProduct(
            product!.id,
            payload,
          )
        : await createProduct(payload);

      onSaved(saved as Product);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save product.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-6 w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {isEditing
                ? "Edit Product"
                : "Add Product"}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage product details, pricing,
              inventory and fulfillment.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 p-6"
        >
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* BASIC INFORMATION */}
          <section>
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Basic Information
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Core information customers will see.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Product name"
                required
              >
                <input
                  value={form.name}
                  onChange={(event) =>
                    handleNameChange(
                      event.target.value,
                    )
                  }
                  placeholder="Wireless Smart Device"
                  className={inputClass}
                />
              </Field>

              <Field label="SKU">
                <input
                  value={form.sku}
                  onChange={(event) =>
                    updateField(
                      "sku",
                      event.target.value,
                    )
                  }
                  placeholder="MEO-ELEC-001"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Slug"
                required
              >
                <div className="flex gap-2">
                  <input
                    value={form.slug}
                    onChange={(event) => {
                      setAutoSlug(false);

                      updateField(
                        "slug",
                        slugify(
                          event.target.value,
                        ),
                      );
                    }}
                    placeholder="wireless-smart-device"
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setAutoSlug(true);

                      updateField(
                        "slug",
                        slugify(form.name),
                      );
                    }}
                    className="rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Auto
                  </button>
                </div>
              </Field>

              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(event) =>
                    updateField(
                      "category",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                >
                  {CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ),
                  )}
                </select>
              </Field>

              <Field
                label="Description"
                className="md:col-span-2"
              >
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  rows={5}
                  placeholder="Describe the product..."
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          </section>

          {/* PRICING */}
          <section>
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Pricing & Costs
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Set your selling price and product
                costs.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Field
                label="Selling price"
                required
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    updateField(
                      "price",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Currency">
                <select
                  value={form.currency}
                  onChange={(event) =>
                    updateField(
                      "currency",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                >
                  <option value="USD">
                    USD
                  </option>
                  <option value="NGN">
                    NGN
                  </option>
                  <option value="EUR">
                    EUR
                  </option>
                  <option value="GBP">
                    GBP
                  </option>
                </select>
              </Field>

              <Field label="Supplier cost">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.supplier_cost}
                  onChange={(event) =>
                    updateField(
                      "supplier_cost",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Shipping cost">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.shipping_cost}
                  onChange={(event) =>
                    updateField(
                      "shipping_cost",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Other cost">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.other_cost}
                  onChange={(event) =>
                    updateField(
                      "other_cost",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Profit per unit
                </p>

                <p
                  className={`mt-1 text-2xl font-bold ${
                    profit >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {form.currency}{" "}
                  {profit.toFixed(2)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Profit margin
                </p>

                <p
                  className={`mt-1 text-2xl font-bold ${
                    margin >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {margin.toFixed(1)}%
                </p>
              </div>
            </div>
          </section>

          {/* INVENTORY */}
          <section>
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Inventory
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Track available stock and low-stock
                alerts.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Stock quantity">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(event) =>
                    updateField(
                      "stock",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Low stock threshold">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.low_stock_threshold
                  }
                  onChange={(event) =>
                    updateField(
                      "low_stock_threshold",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          {/* IMAGES */}
          <section>
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Product Media
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Add a primary image and additional
                product images.
              </p>
            </div>

            <div className="space-y-4">
              <Field label="Primary image URL">
                <input
                  value={form.image_url}
                  onChange={(event) =>
                    updateField(
                      "image_url",
                      event.target.value,
                    )
                  }
                  placeholder="https://example.com/product.jpg"
                  className={inputClass}
                />
              </Field>

              <Field label="Additional image URL">
                <div className="flex gap-2">
                  <input
                    value={newImage}
                    onChange={(event) =>
                      setNewImage(
                        event.target.value,
                      )
                    }
                    placeholder="https://example.com/image-2.jpg"
                    className={inputClass}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        event.preventDefault();
                        addImage();
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={addImage}
                    className="rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Add
                  </button>
                </div>
              </Field>

              {form.images.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {form.images.map(
                    (image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
                      >
                        <img
                          src={image}
                          alt={`Product image ${
                            index + 1
                          }`}
                          className="h-28 w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />

                        <div className="truncate p-2 text-xs text-slate-500">
                          {image}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeImage(index)
                          }
                          className="absolute right-2 top-2 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100"
                        >
                          Remove
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </section>

          {/* VARIANTS */}
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Variants
                </h3>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Add sizes, colors or other product
                  options.
                </p>
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                + Add variant
              </button>
            </div>

            {form.variants.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No variants added.
              </div>
            ) : (
              <div className="space-y-3">
                {form.variants.map(
                  (variant, index) => (
                    <div
                      key={variant.id}
                      className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 md:grid-cols-6"
                    >
                      <input
                        value={variant.name}
                        onChange={(event) =>
                          updateVariant(
                            index,
                            "name",
                            event.target.value,
                          )
                        }
                        placeholder="Option"
                        className={inputClass}
                      />

                      <input
                        value={variant.value}
                        onChange={(event) =>
                          updateVariant(
                            index,
                            "value",
                            event.target.value,
                          )
                        }
                        placeholder="Value"
                        className={inputClass}
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price}
                        onChange={(event) =>
                          updateVariant(
                            index,
                            "price",
                            event.target.value,
                          )
                        }
                        placeholder="Price"
                        className={inputClass}
                      />

                      <input
                        value={variant.sku}
                        onChange={(event) =>
                          updateVariant(
                            index,
                            "sku",
                            event.target.value,
                          )
                        }
                        placeholder="SKU"
                        className={inputClass}
                      />

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={variant.stock}
                        onChange={(event) =>
                          updateVariant(
                            index,
                            "stock",
                            event.target.value,
                          )
                        }
                        placeholder="Stock"
                        className={inputClass}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeVariant(index)
                        }
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                      >
                        Remove
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>

          {/* SUPPLIER */}
          <section>
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Supplier & Fulfillment
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Keep supplier and fulfillment information
                attached to the product.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Supplier name">
                <input
                  value={form.supplier_name}
                  onChange={(event) =>
                    updateField(
                      "supplier_name",
                      event.target.value,
                    )
                  }
                  placeholder="Supplier name"
                  className={inputClass}
                />
              </Field>

              <Field label="Supplier product ID">
                <input
                  value={
                    form.supplier_product_id
                  }
                  onChange={(event) =>
                    updateField(
                      "supplier_product_id",
                      event.target.value,
                    )
                  }
                  placeholder="Supplier reference"
                  className={inputClass}
                />
              </Field>

              <Field label="Warehouse country">
                <input
                  value={
                    form.warehouse_country
                  }
                  onChange={(event) =>
                    updateField(
                      "warehouse_country",
                      event.target.value,
                    )
                  }
                  placeholder="Nigeria"
                  className={inputClass}
                />
              </Field>

              <Field label="Processing time">
                <input
                  value={
                    form.processing_time
                  }
                  onChange={(event) =>
                    updateField(
                      "processing_time",
                      event.target.value,
                    )
                  }
                  placeholder="1-3 business days"
                  className={inputClass}
                />
              </Field>

              <Field label="Delivery time">
                <input
                  value={form.delivery_time}
                  onChange={(event) =>
                    updateField(
                      "delivery_time",
                      event.target.value,
                    )
                  }
                  placeholder="5-10 business days"
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          {/* STATUS */}
          <section>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Product status
                </h3>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Active products can appear on your
                  storefront.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  updateField(
                    "active",
                    !form.active,
                  )
                }
                className={`relative h-7 w-12 rounded-full transition ${
                  form.active
                    ? "bg-emerald-500"
                    : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                    form.active
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* ACTIONS */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-800";