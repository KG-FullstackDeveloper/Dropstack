import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  createProduct,
  updateProduct,
} from "../../services/adminApi";
import type {
  Product,
  ProductVariant,
} from "../../types/product";

interface ProductModalProps {
  product: Product | null;
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

const categories = [
  "Electronics",
  "Beauty & Skincare",
  "Pet Products",
  "Shapewear",
  "Clothing",
  "Accessories",
  "Home & Garden",
  "Other",
];

const currencies = [
  "USD",
  "GBP",
  "EUR",
  "CAD",
  "AUD",
  "NGN",
];

const countries = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Nigeria",
  "South Africa",
  "Germany",
  "France",
  "China",
  "Other",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function createEmptyVariant(): ProductVariant {
  return {
    id: crypto.randomUUID(),
    name: "",
    value: "",
    price: "",
    sku: "",
    stock: "",
  };
}

function createInitialState(product: Product | null): FormState {
  if (!product) {
    return {
      name: "",
      slug: "",
      sku: "",
      category: "Electronics",
      description: "",
      price: "",
      currency: "USD",
      image_url: "",
      images: [],
      supplier_name: "",
      supplier_product_id: "",
      warehouse_country: "",
      supplier_cost: "",
      shipping_cost: "",
      other_cost: "",
      processing_time: "",
      delivery_time: "",
      stock: "0",
      low_stock_threshold: "5",
      variants: [],
      active: true,
    };
  }

  return {
    name: product.name || "",
    slug: product.slug || "",
    sku: product.sku || "",
    category: product.category || "Other",
    description: product.description || "",
    price: String(product.price ?? ""),
    currency: product.currency || "USD",
    image_url: product.image_url || "",
    images: Array.isArray(product.images)
      ? product.images.filter(Boolean)
      : [],
    supplier_name: product.supplier_name || "",
    supplier_product_id: product.supplier_product_id || "",
    warehouse_country: product.warehouse_country || "",
    supplier_cost: String(product.supplier_cost ?? ""),
    shipping_cost: String(product.shipping_cost ?? ""),
    other_cost: String(product.other_cost ?? ""),
    processing_time: product.processing_time || "",
    delivery_time: product.delivery_time || "",
    stock: String(product.stock ?? 0),
    low_stock_threshold: String(
      product.low_stock_threshold ?? 5,
    ),
    variants: Array.isArray(product.variants)
      ? product.variants
      : [],
    active: Number(product.active) === 1,
  };
}

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function Field({
  label,
  children,
  hint,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      {children}

      {hint && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-500";

const textareaClass =
  "w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-500";

export default function ProductModal({
  product,
  onClose,
  onSaved,
}: ProductModalProps) {
  const isEditing = Boolean(product);

  const [form, setForm] = useState<FormState>(
    createInitialState(product),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newImage, setNewImage] = useState("");
  const [autoSlug, setAutoSlug] = useState(!product);

  useEffect(() => {
    setForm(createInitialState(product));
    setAutoSlug(!product);
    setError("");
  }, [product]);

  const costs = useMemo(() => {
    const supplier = Number(form.supplier_cost) || 0;
    const shipping = Number(form.shipping_cost) || 0;
    const other = Number(form.other_cost) || 0;
    const selling = Number(form.price) || 0;

    const totalCost = supplier + shipping + other;
    const profit = selling - totalCost;
    const margin =
      selling > 0 ? (profit / selling) * 100 : 0;

    return {
      supplier,
      shipping,
      other,
      totalCost,
      selling,
      profit,
      margin,
    };
  }, [
    form.price,
    form.supplier_cost,
    form.shipping_cost,
    form.other_cost,
  ]);

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
      ...(autoSlug
        ? {
            slug: slugify(value),
          }
        : {}),
    }));
  }

  function addImage() {
    const value = newImage.trim();

    if (!value) return;

    setForm((current) => ({
      ...current,
      images: Array.from(
        new Set([...current.images, value]),
      ),
      image_url: current.image_url || value,
    }));

    setNewImage("");
  }

  function removeImage(index: number) {
    setForm((current) => {
      const images = current.images.filter(
        (_, imageIndex) => imageIndex !== index,
      );

      return {
        ...current,
        images,
        image_url:
          current.image_url === current.images[index]
            ? images[0] || ""
            : current.image_url,
      };
    });
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

  function removeVariant(index: number) {
    setForm((current) => ({
      ...current,
      variants: current.variants.filter(
        (_, variantIndex) => variantIndex !== index,
      ),
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!form.slug.trim()) {
      setError("Product slug is required.");
      return;
    }

    if (Number(form.price) <= 0) {
      setError("Selling price must be greater than 0.");
      return;
    }

    if (Number(form.stock) < 0) {
      setError("Stock cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        slug: slugify(form.slug),
        sku: form.sku.trim() || undefined,
        category: form.category,
        description: form.description.trim(),
        price: Number(form.price),
        currency: form.currency,
        image_url:
          form.image_url.trim() ||
          form.images[0] ||
          undefined,
        images: form.images,
        supplier_name:
          form.supplier_name.trim() || undefined,
        supplier_product_id:
          form.supplier_product_id.trim() || undefined,
        warehouse_country:
          form.warehouse_country.trim() || undefined,
        supplier_cost:
          Number(form.supplier_cost) || 0,
        shipping_cost:
          Number(form.shipping_cost) || 0,
        other_cost:
          Number(form.other_cost) || 0,
        processing_time:
          form.processing_time.trim() || undefined,
        delivery_time:
          form.delivery_time.trim() || undefined,
        stock: Number(form.stock) || 0,
        low_stock_threshold:
          Number(form.low_stock_threshold) || 0,
        variants: form.variants,
        active: form.active ? 1 : 0,
      };

      const saved = isEditing
        ? await updateProduct(product!.id, payload)
        : await createProduct(payload);

      onSaved(saved as Product);
    } catch (err) {
      console.error(err);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {isEditing
                ? "Edit product"
                : "Add product"}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {isEditing
                ? "Update your product information and catalog settings."
                : "Create a product for your store catalog."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="flex-1">{error}</span>

                <button
                  type="button"
                  onClick={() => setError("")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Basic information */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Basic information
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  The main information customers will see about this product.
                </p>
              </div>

              <div className="grid gap-5 p-5">
                <Field label="Product name" required>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      handleNameChange(event.target.value)
                    }
                    className={inputClass}
                    placeholder="e.g. Wireless Bluetooth Headphones"
                    autoFocus
                  />
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="URL slug" required>
                    <div className="flex gap-2">
                      <input
                        value={form.slug}
                        onChange={(event) => {
                          setAutoSlug(false);
                          updateField(
                            "slug",
                            slugify(event.target.value),
                          );
                        }}
                        className={inputClass}
                        placeholder="wireless-bluetooth-headphones"
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
                        className="shrink-0 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Auto
                      </button>
                    </div>
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
                      className={inputClass}
                      placeholder="Optional SKU"
                    />
                  </Field>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Category" required>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={(event) =>
                          updateField(
                            "category",
                            event.target.value,
                          )
                        }
                        className={`${inputClass} appearance-none pr-10`}
                      >
                        {categories.map((category) => (
                          <option
                            key={category}
                            value={category}
                          >
                            {category}
                          </option>
                        ))}
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </Field>

                  <Field label="Currency">
                    <div className="relative">
                      <select
                        value={form.currency}
                        onChange={(event) =>
                          updateField(
                            "currency",
                            event.target.value,
                          )
                        }
                        className={`${inputClass} appearance-none pr-10`}
                      >
                        {currencies.map((currency) => (
                          <option
                            key={currency}
                            value={currency}
                          >
                            {currency}
                          </option>
                        ))}
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </Field>
                </div>

                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value,
                      )
                    }
                    rows={5}
                    className={textareaClass}
                    placeholder="Describe the product, its features, materials, benefits, and other useful information."
                  />
                </Field>
              </div>
            </section>

            {/* Pricing */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Pricing & costs
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Track your actual product economics and expected profit.
                </p>
              </div>

              <div className="p-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Selling price" required>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                        {form.currency}
                      </span>

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
                        className={`${inputClass} pl-16`}
                        placeholder="0.00"
                      />
                    </div>
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
                      placeholder="0.00"
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
                      placeholder="0.00"
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
                      placeholder="0.00"
                    />
                  </Field>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Total cost
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {formatMoney(
                        costs.totalCost,
                        form.currency,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Profit / unit
                    </p>
                    <p
                      className={`mt-1 text-lg font-bold ${
                        costs.profit < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {formatMoney(
                        costs.profit,
                        form.currency,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Margin
                    </p>
                    <p
                      className={`mt-1 text-lg font-bold ${
                        costs.margin < 0
                          ? "text-red-600 dark:text-red-400"
                          : costs.margin < 15
                            ? "text-amber-600 dark:text-amber-400"
                            : costs.margin < 25
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {costs.margin.toFixed(1)}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Selling price
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {formatMoney(
                        costs.selling,
                        form.currency,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Inventory */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Inventory
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Manage available units and low-stock warnings.
                </p>
              </div>

              <div className="grid gap-5 p-5 md:grid-cols-2">
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
                    placeholder="0"
                  />
                </Field>

                <Field
                  label="Low-stock threshold"
                  hint="A warning is shown when stock reaches this number."
                >
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.low_stock_threshold}
                    onChange={(event) =>
                      updateField(
                        "low_stock_threshold",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="5"
                  />
                </Field>
              </div>
            </section>

            {/* Media */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Product media
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add product image URLs. The first image is used as the primary image.
                </p>
              </div>

              <div className="p-5">
                <Field label="Primary image URL">
                  <input
                    value={form.image_url}
                    onChange={(event) =>
                      updateField(
                        "image_url",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="https://..."
                  />
                </Field>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      Additional images
                    </p>

                    <span className="text-xs text-slate-500">
                      {form.images.length} image
                      {form.images.length === 1
                        ? ""
                        : "s"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={newImage}
                      onChange={(event) =>
                        setNewImage(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addImage();
                        }
                      }}
                      className={inputClass}
                      placeholder="Add another image URL"
                    />

                    <button
                      type="button"
                      onClick={addImage}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  {form.images.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {form.images.map((image, index) => (
                        <div
                          key={`${image}-${index}`}
                          className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-950"
                        >
                          <div className="aspect-square">
                            <img
                              src={image}
                              alt={`Product image ${index + 1}`}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display =
                                  "none";
                              }}
                            />

                            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                              <ImageIcon className="h-6 w-6" />
                            </div>
                          </div>

                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1.5">
                            <span className="text-[10px] font-semibold text-white">
                              {index === 0
                                ? "Image 1"
                                : `Image ${index + 1}`}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                removeImage(index)
                              }
                              className="rounded-md p-1 text-white transition hover:bg-white/20"
                              aria-label="Remove image"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                      <ImageIcon className="mx-auto h-7 w-7 text-slate-400" />
                      <p className="mt-2 text-xs text-slate-500">
                        No additional images added.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Variants */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Variants
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Add sizes, colors, storage options, or other variations.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addVariant}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Add variant
                </button>
              </div>

              <div className="p-5">
                {form.variants.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      No variants
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Add variants if this product has different options.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.variants.map(
                      (variant, index) => (
                        <div
                          key={variant.id || index}
                          className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Variant {index + 1}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                removeVariant(index)
                              }
                              className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                            <input
                              value={variant.name}
                              onChange={(event) =>
                                updateVariant(
                                  index,
                                  "name",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                              placeholder="Option"
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
                              className={inputClass}
                              placeholder="Value"
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
                              className={inputClass}
                              placeholder="Price"
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
                              className={inputClass}
                              placeholder="SKU"
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
                              className={inputClass}
                              placeholder="Stock"
                            />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Supplier */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Supplier & fulfillment
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Keep supplier and fulfillment information attached to the product.
                </p>
              </div>

              <div className="grid gap-5 p-5 md:grid-cols-2">
                <Field label="Supplier name">
                  <input
                    value={form.supplier_name}
                    onChange={(event) =>
                      updateField(
                        "supplier_name",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="Supplier or vendor name"
                  />
                </Field>

                <Field label="Supplier product ID">
                  <input
                    value={form.supplier_product_id}
                    onChange={(event) =>
                      updateField(
                        "supplier_product_id",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="Supplier product/reference ID"
                  />
                </Field>

                <Field label="Warehouse country">
                  <div className="relative">
                    <select
                      value={form.warehouse_country}
                      onChange={(event) =>
                        updateField(
                          "warehouse_country",
                          event.target.value,
                        )
                      }
                      className={`${inputClass} appearance-none pr-10`}
                    >
                      <option value="">
                        Select country
                      </option>

                      {countries.map((country) => (
                        <option
                          key={country}
                          value={country}
                        >
                          {country}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>

                <Field label="Processing time">
                  <input
                    value={form.processing_time}
                    onChange={(event) =>
                      updateField(
                        "processing_time",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="e.g. 1–3 business days"
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
                    className={inputClass}
                    placeholder="e.g. 5–10 business days"
                  />
                </Field>
              </div>
            </section>

            {/* Status */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4 p-5">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Product status
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Inactive products remain in your catalog but are not active.
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
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                    form.active
                      ? "bg-emerald-500"
                      : "bg-slate-300 dark:bg-slate-700"
                  }`}
                  aria-label="Toggle product status"
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                      form.active
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="border-t border-slate-200 px-5 py-3 dark:border-slate-800">
                <span
                  className={`inline-flex items-center gap-2 text-xs font-semibold ${
                    form.active
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      form.active
                        ? "bg-emerald-500"
                        : "bg-slate-400"
                    }`}
                  />
                  {form.active
                    ? "Active and visible"
                    : "Inactive"}
                </span>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
            <div className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              {isEditing
                ? "Changes are saved to your product catalog."
                : "The product will be added to your catalog."}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {isEditing
                      ? "Save changes"
                      : "Add product"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}