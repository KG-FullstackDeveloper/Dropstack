import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { Product, CreateProductInput } from "../../types/product";
import { createProduct, updateProduct } from "../../services/adminApi";
import { useToast } from "./Toast";

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface Props {
  product?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductModal({ product, onClose, onSuccess }: Props) {
  const { addToast } = useToast();
  const isEditing = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [category, setCategory] = useState(product?.category ?? CATEGORIES[0]);
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [currency, setCurrency] = useState(product?.currency ?? "USD");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [supplierName, setSupplierName] = useState(product?.supplier_name ?? "");
  const [supplierCost, setSupplierCost] = useState(product?.supplier_cost?.toString() ?? "0");
  const [shippingCost, setShippingCost] = useState(product?.shipping_cost?.toString() ?? "0");
  const [otherCost, setOtherCost] = useState(product?.other_cost?.toString() ?? "0");
  const [processingTime, setProcessingTime] = useState(product?.processing_time ?? "");
  const [deliveryTime, setDeliveryTime] = useState(product?.delivery_time ?? "");
  const [active, setActive] = useState(product ? product.active === 1 : true);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(name));
    }
  }, [name, slugManuallyEdited]);

  const sellingPrice = parseFloat(price) || 0;
  const supplierCostNum = parseFloat(supplierCost) || 0;
  const shippingCostNum = parseFloat(shippingCost) || 0;
  const otherCostNum = parseFloat(otherCost) || 0;

  const profitPerUnit = sellingPrice - supplierCostNum - shippingCostNum - otherCostNum;
  const profitMargin = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0;

  async function handleSave() {
    if (!name.trim()) {
      addToast("Product name is required.", "error");
      return;
    }
    if (!description.trim()) {
      addToast("Description is required.", "error");
      return;
    }
    if (!price || sellingPrice <= 0) {
      addToast("A valid selling price is required.", "error");
      return;
    }

    setSaving(true);

    const data: CreateProductInput & { active?: number } = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      category,
      description: description.trim(),
      price: sellingPrice,
      currency,
      image_url: imageUrl.trim() || undefined,
      supplier_name: supplierName.trim() || undefined,
      supplier_cost: supplierCostNum,
      shipping_cost: shippingCostNum,
      other_cost: otherCostNum,
      processing_time: processingTime.trim() || undefined,
      delivery_time: deliveryTime.trim() || undefined,
      ...(isEditing ? { active: active ? 1 : 0 } : {}),
    };

    try {
      if (isEditing && product) {
        await updateProduct(product.id, data);
        addToast("Product updated successfully.", "success");
      } else {
        await createProduct(data);
        addToast("Product created successfully.", "success");
      }
      onSuccess();
      onClose();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to save product.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-950">
            {isEditing ? "Edit product" : "Add product"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Product name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wireless Earbuds Pro"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Slug
              </label>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setSlug(e.target.value);
                }}
                placeholder="product-url-slug"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the product..."
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* Price + Currency */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Selling price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="29.99"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
                >
                  <option value="USD">USD</option>
                  <option value="NGN">NGN</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Image URL
              </label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* Supplier section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-4 text-sm font-bold text-slate-700">Supplier</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Supplier name
                  </label>
                  <input
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. AliExpress Seller"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Supplier cost
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={supplierCost}
                      onChange={(e) => setSupplierCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Shipping cost
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Other cost
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={otherCost}
                      onChange={(e) => setOtherCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Processing time
                    </label>
                    <input
                      value={processingTime}
                      onChange={(e) => setProcessingTime(e.target.value)}
                      placeholder="e.g. 1-3 days"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Delivery time
                    </label>
                    <input
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      placeholder="e.g. 7-14 days"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Profit preview */}
            <div
              className={`rounded-xl border p-4 ${
                profitPerUnit >= 0
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <h3 className="mb-3 text-sm font-bold text-slate-700">Profit calculation</h3>
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Profit per unit</p>
                  <p
                    className={`mt-1 text-lg font-bold ${
                      profitPerUnit >= 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {currency} {profitPerUnit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Profit margin</p>
                  <p
                    className={`mt-1 text-lg font-bold ${
                      profitMargin >= 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {profitMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Active toggle (edit mode only) */}
            {isEditing && (
              <div className="flex items-center gap-3">
                <input
                  id="active-toggle"
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-slate-950"
                />
                <label htmlFor="active-toggle" className="text-sm font-medium text-slate-700">
                  Active (visible in store)
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save product"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
