
import {
  ArrowUpRight,
  Check,
  Globe2,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Store as StoreIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getStoreConfig, updateStoreConfig } from "../services/api";
import type { StoreConfig } from "../types/store";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

const labelClass = "block text-sm font-semibold text-slate-700";

export default function StoreContent() {
  const [store, setStore] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadStore() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await getStoreConfig();
      setStore(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't load your store content.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStore();
  }, []);

  function updateField<K extends keyof StoreConfig>(
    field: K,
    value: StoreConfig[K],
  ) {
    setStore((current) =>
      current ? { ...current, [field]: value } : current,
    );
    setSuccess("");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!store) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const saved = await updateStoreConfig(store);
      setStore(saved);
      setSuccess("Your store content has been saved.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't save your changes. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="animate-spin" size={20} />
          Loading your store content…
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-3xl border border-red-100 bg-white p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <StoreIcon size={22} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-950">
            Store content couldn't load
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadStore()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const storeName = store.name?.trim() || "Your Store";

  const description =
    store.description?.trim() ||
    "Add a short description to introduce your store to customers.";

  const primaryColor = store.primaryColor || "#111827";
  const accentColor = store.accentColor || "#10b981";

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Sparkles size={14} />
              Store management
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Store content
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Manage the brand information customers see when they visit your
              store. Changes are saved to your existing store configuration.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadStore()}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:self-auto"
          >
            <RefreshCw size={16} />
            Reload content
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            <Check size={17} />
            {success}
          </div>
        )}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
          {/* Editable content */}
          <form onSubmit={handleSave} className="space-y-6">
            {/* Store identity */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <StoreIcon size={21} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-950">
                      Store identity
                    </h2>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      The name and description that introduce your business.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-6 sm:p-8">
                <label className={labelClass}>
                  Store name
                  <input
                    className={inputClass}
                    value={store.name || ""}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="e.g. LumiFlex"
                    maxLength={100}
                    required
                  />
                  <span className="mt-1.5 block text-xs font-normal text-slate-400">
                    This is your public-facing business name.
                  </span>
                </label>

                <label className={labelClass}>
                  Store description
                  <textarea
                    className={`${inputClass} min-h-32 resize-y`}
                    value={store.description || ""}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    placeholder="Tell customers what makes your store special…"
                    maxLength={1000}
                    rows={4}
                  />
                  <span className="mt-1.5 block text-xs font-normal text-slate-400">
                    {store.description?.length || 0}/1000 characters
                  </span>
                </label>
              </div>
            </section>

            {/* Brand assets */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                    <ImageIcon size={21} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-950">
                      Brand assets
                    </h2>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Add image URLs for your logo and browser tab icon.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-6 sm:p-8">
                <label className={labelClass}>
                  Logo image URL
                  <input
                    className={inputClass}
                    type="url"
                    value={store.logoUrl || ""}
                    onChange={(event) =>
                      updateField("logoUrl", event.target.value)
                    }
                    placeholder="https://example.com/logo.png"
                  />
                </label>

                {store.logoUrl && (
                  <div className="flex min-h-24 items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <img
                        src={store.logoUrl}
                        alt="Store logo preview"
                        className="h-full w-full object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        Logo preview
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {store.logoUrl}
                      </p>
                    </div>
                  </div>
                )}

                <label className={labelClass}>
                  Favicon URL
                  <input
                    className={inputClass}
                    type="url"
                    value={store.faviconUrl || ""}
                    onChange={(event) =>
                      updateField("faviconUrl", event.target.value)
                    }
                    placeholder="https://example.com/favicon.png"
                  />
                  <span className="mt-1.5 block text-xs font-normal text-slate-400">
                    The small icon shown in a browser tab, if your storefront
                    supports it.
                  </span>
                </label>
              </div>
            </section>

            {/* Brand colours */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Globe2 size={21} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-950">
                      Brand colours
                    </h2>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Maintain consistent brand colours across supported
                      storefront elements.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
                <label className={labelClass}>
                  Primary colour
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(event) =>
                        updateField("primaryColor", event.target.value)
                      }
                      aria-label="Choose primary colour"
                      className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
                    />
                    <span className="text-sm font-medium uppercase text-slate-600">
                      {primaryColor}
                    </span>
                  </div>
                </label>

                <label className={labelClass}>
                  Accent colour
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(event) =>
                        updateField("accentColor", event.target.value)
                      }
                      aria-label="Choose accent colour"
                      className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
                    />
                    <span className="text-sm font-medium uppercase text-slate-600">
                      {accentColor}
                    </span>
                  </div>
                </label>
              </div>
            </section>

            {/* Save changes */}
            <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">
                Save to update the store configuration on your server.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : (
                  <Save size={17} />
                )}
                {saving ? "Saving changes…" : "Save store content"}
              </button>
            </div>
          </form>

          {/* Live-style preview */}
          <aside className="space-y-5 xl:sticky xl:top-6">
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Store identity preview
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Preview of the information you're editing
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Preview
                </span>
              </div>

              <div className="p-5">
                <div
                  className="overflow-hidden rounded-2xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 text-white">
                      {store.logoUrl ? (
                        <img
                          src={store.logoUrl}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <StoreIcon size={20} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {storeName}
                      </p>
                      <p className="mt-0.5 text-xs text-white/60">
                        Online store
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-8">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={{
                        backgroundColor: `${accentColor}25`,
                        color: "#ffffff",
                      }}
                    >
                      <Sparkles size={13} />
                      Welcome to our store
                    </span>

                    <h3 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-white">
                      {storeName}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-white/75">
                      {description}
                    </p>

                    <div
                      className="mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      Explore the store
                      <ArrowUpRight size={16} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={18}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Keep your branding consistent
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Use a clear logo and a concise description that tells
                        customers what your business offers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-950">
                What this page manages
              </h3>

              <ul className="mt-4 space-y-3">
                {[
                  "Store name and description",
                  "Logo and favicon URLs",
                  "Primary and accent colours",
                  "Saving through the existing store API",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-slate-600"
                  >
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />
                    {item}
                  </li>
                ))}
              </ul>

              <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                This page manages store information and brand settings. It
                does not replace your product management page or rebuild your
                storefront.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
