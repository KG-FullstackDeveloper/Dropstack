
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  Eye,
  LayoutTemplate,
  LoaderCircle,
  Palette,
  Save,
  Settings2,
  Store,
} from "lucide-react";

import type {
  StoreConfig,
  StorePageType,
  StoreThemeId,
} from "../types/store";

import { DEFAULT_STORE_CONFIG, STORE_THEMES } from "../types/themes/registry";
import StoreThemeSelector from "../components/storefront/StoreThemeSelector";
import { getStoreConfig, updateStoreConfig } from "../services/api";

type Section = "themes" | "pages" | "features" | "branding";

const PAGE_OPTIONS: {
  page: StorePageType;
  label: string;
  description: string;
}[] = [
  {
    page: "home",
    label: "Home",
    description: "Your main storefront page.",
  },
  {
    page: "catalog",
    label: "Catalog",
    description: "Your product catalog.",
  },
  {
    page: "product",
    label: "Product",
    description: "Individual product pages.",
  },
  {
    page: "contact",
    label: "Contact",
    description: "A page customers can use to contact you.",
  },
  {
    page: "cart",
    label: "Cart",
    description: "Customer shopping cart.",
  },
];

type ApiNavigationItem = StoreConfig["navigation"][number] & {
  page?: string;
};

function cloneStore(store: StoreConfig): StoreConfig {
  return {
    ...DEFAULT_STORE_CONFIG,
    ...store,
    navigation: (store.navigation ?? []).map((item) => ({ ...item })),
    settings: {
      ...DEFAULT_STORE_CONFIG.settings,
      ...(store.settings ?? {}),
    },
  };
}

function getNavigationPage(item: ApiNavigationItem): string {
  if (item.page) return item.page.toLowerCase();

  return (item.href ?? "")
    .replace(/^\/+/, "")
    .split("/")[0]
    .toLowerCase();
}

export default function StorefrontAdmin() {
  const [store, setStore] = useState<StoreConfig>(() =>
    cloneStore(DEFAULT_STORE_CONFIG),
  );

  const [section, setSection] = useState<Section>("themes");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedTheme = useMemo(
    () =>
      STORE_THEMES.find((theme) => theme.id === store.themeId) ??
      STORE_THEMES[0],
    [store.themeId],
  );

  useEffect(() => {
    let active = true;

    async function loadStore() {
      setLoading(true);
      setError("");
      setNotice("");

      try {
        const data = await getStoreConfig();

        if (!active) return;

        setStore(cloneStore(data));
        setLoaded(true);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Couldn't load store settings.",
        );
        setLoaded(false);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadStore();

    return () => {
      active = false;
    };
  }, []);

  function updateStore(changes: Partial<StoreConfig>) {
    setStore((current) => ({ ...current, ...changes }));
    setSaved(false);
    setNotice("");
    setError("");
  }

  function updateSettings(
    changes: Partial<StoreConfig["settings"]>,
  ) {
    setStore((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...changes,
      },
    }));

    setSaved(false);
    setNotice("");
    setError("");
  }

  function selectTheme(themeId: StoreThemeId) {
    const theme = STORE_THEMES.find((item) => item.id === themeId);

    if (!theme) return;

    updateStore({
      themeId,
      settings: {
        ...store.settings,
        ...theme.settings,
      },
    });
  }

  function togglePage(page: StorePageType) {
    if (page === "home" || page === "product") return;

    const option = PAGE_OPTIONS.find((item) => item.page === page);
    if (!option) return;

    const existing = store.navigation.find(
      (item) => getNavigationPage(item as ApiNavigationItem) === page,
    );

    const currentlyEnabled =
      page === "catalog"
        ? store.settings.showCatalogPage
        : page === "contact"
          ? store.settings.showContactPage
          : page === "cart"
            ? store.settings.showCartPage
            : (existing?.enabled ?? true);

    const nextEnabled = !currentlyEnabled;

    const navigation = [...store.navigation] as ApiNavigationItem[];
    const existingIndex = navigation.findIndex(
      (item) => getNavigationPage(item) === page,
    );

    if (existingIndex >= 0) {
      navigation[existingIndex] = {
        ...navigation[existingIndex],
        href: navigation[existingIndex].href || `/${page}`,
        enabled: nextEnabled,
      };
    } else {
      navigation.push({
        id: page,
        label: option.label,
        href: `/${page}`,
        enabled: nextEnabled,
      });
    }

    updateStore({
      navigation,
      settings: {
        ...store.settings,
        ...(page === "catalog"
          ? { showCatalogPage: nextEnabled }
          : {}),
        ...(page === "contact"
          ? { showContactPage: nextEnabled }
          : {}),
        ...(page === "cart"
          ? { showCartPage: nextEnabled }
          : {}),
      },
    });
  }

  async function saveStore() {
    if (!loaded || saving) return;

    setSaving(true);
    setSaved(false);
    setError("");
    setNotice("");

    try {
      const updated = await updateStoreConfig(store);

      setStore((current) => ({
        ...current,
        ...updated,
        settings: {
          ...current.settings,
          ...updated.settings,
        },
        navigation: updated.navigation ?? current.navigation,
      }));

      setSaved(true);
      setNotice("Your store settings were saved successfully.");
    } catch (err) {
      setSaved(false);
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't save changes. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  function getStoreUrl() {
    const slug = store.slug?.trim() || "meo-store";

    return `${window.location.origin}/store/${encodeURIComponent(slug)}`;
  }

  function previewStore() {
    window.open(
      getStoreUrl(),
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function copyStoreLink() {
    setCopied(false);
    setError("");
    setNotice("");

    try {
      await navigator.clipboard.writeText(getStoreUrl());
      setCopied(true);
      setNotice("Store link copied.");
    } catch {
      setError(
        "Couldn't copy the store link. Check your browser clipboard permissions.",
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <LoaderCircle
          size={28}
          className="animate-spin text-slate-500"
        />
        <span className="ml-3 text-sm text-slate-500">
          Loading store settings...
        </span>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="mx-auto max-w-3xl p-6 sm:p-8">
        <div className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <h1 className="text-lg font-bold">
                Couldn't load store settings
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {error || "The server did not return your store configuration."}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-900 p-2 text-white dark:bg-white dark:text-slate-900">
              <Store size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-bold">Store Page</h1>
              <p className="text-sm text-slate-500">
                Configure the appearance and features of your customer-facing store.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyStoreLink()}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
              {copied ? "Copied" : "Copy link"}
            </button>

            <button
              type="button"
              onClick={previewStore}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"
            >
              <Eye size={17} />
              Preview
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void saveStore()}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : saved ? (
                <Check size={17} />
              ) : (
                <Save size={17} />
              )}
              {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
            </button>
          </div>
        </header>

        {(error || notice) && (
          <div
            role={error ? "alert" : "status"}
            className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
            }`}
          >
            {error ? (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            ) : (
              <Check size={18} className="mt-0.5 shrink-0" />
            )}
            <span>{error || notice}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <NavButton
              active={section === "themes"}
              icon={<Palette size={18} />}
              label="Themes"
              onClick={() => setSection("themes")}
            />

            <NavButton
              active={section === "pages"}
              icon={<Store size={18} />}
              label="Pages"
              onClick={() => setSection("pages")}
            />

            <NavButton
              active={section === "features"}
              icon={<Settings2 size={18} />}
              label="Features"
              onClick={() => setSection("features")}
            />

            <NavButton
              active={section === "branding"}
              icon={<LayoutTemplate size={18} />}
              label="Branding"
              onClick={() => setSection("branding")}
            />
          </aside>

          <main className="min-w-0">
            {section === "themes" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Themes</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Choose your storefront's visual style.
                    </p>
                  </div>

                  <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:block">
                    {selectedTheme.name}
                  </span>
                </div>

                <StoreThemeSelector
                  themes={STORE_THEMES}
                  selectedThemeId={store.themeId}
                  onSelect={selectTheme}
                />

                <div className="mt-6 flex gap-3 rounded-2xl border border-dashed border-slate-300 p-5 dark:border-slate-700">
                  <div className="h-fit rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
                    <LayoutTemplate size={19} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Theme settings</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Select a theme, then save your changes. Theme selection and
                      supported store settings are saved through the backend.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {section === "pages" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <h2 className="text-xl font-bold">Store pages</h2>
                <p className="mb-6 mt-1 text-sm text-slate-500">
                  Choose which supported pages are enabled for customers.
                </p>

                <div className="space-y-3">
                  {PAGE_OPTIONS.map((option) => {
                    const navigationItem = store.navigation.find(
                      (item) =>
                        getNavigationPage(item as ApiNavigationItem) ===
                        option.page,
                    );

                    const enabled =
                      option.page === "home"
                        ? true
                        : option.page === "catalog"
                          ? store.settings.showCatalogPage
                          : option.page === "contact"
                            ? store.settings.showContactPage
                            : option.page === "cart"
                              ? store.settings.showCartPage
                              : (navigationItem?.enabled ?? true);

                    const unavailable =
                      option.page === "home" ||
                      option.page === "product";

                    return (
                      <PageRow
                        key={option.page}
                        label={option.label}
                        description={option.description}
                        enabled={enabled}
                        disabled={unavailable}
                        onToggle={() => togglePage(option.page)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {section === "features" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <h2 className="text-xl font-bold">Store features</h2>
                <p className="mb-6 mt-1 text-sm text-slate-500">
                  Turn supported storefront features on or off.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FeatureToggle
                    label="Related Products"
                    description="Show related products on product pages."
                    enabled={store.settings.showRelatedProducts}
                    onClick={() =>
                      updateSettings({
                        showRelatedProducts: !store.settings.showRelatedProducts,
                      })
                    }
                  />

                  <FeatureToggle
                    label="Search"
                    description="Show product search in the storefront."
                    enabled={store.settings.showSearch}
                    onClick={() =>
                      updateSettings({
                        showSearch: !store.settings.showSearch,
                      })
                    }
                  />

                  <FeatureToggle
                    label="Newsletter"
                    description="Show the newsletter signup section."
                    enabled={store.settings.showNewsletter}
                    onClick={() =>
                      updateSettings({
                        showNewsletter: !store.settings.showNewsletter,
                      })
                    }
                  />

                  <FeatureToggle
                    label="Testimonials"
                    description="Show customer testimonials."
                    enabled={store.settings.showTestimonials}
                    onClick={() =>
                      updateSettings({
                        showTestimonials: !store.settings.showTestimonials,
                      })
                    }
                  />

                  <FeatureToggle
                    label="Trust Badges"
                    description="Show trust and delivery information."
                    enabled={store.settings.showTrustBadges}
                    onClick={() =>
                      updateSettings({
                        showTrustBadges: !store.settings.showTrustBadges,
                      })
                    }
                  />

                  <FeatureToggle
                    label="Announcement Bar"
                    description="Show a message above the store header."
                    enabled={store.settings.showAnnouncementBar}
                    onClick={() =>
                      updateSettings({
                        showAnnouncementBar: !store.settings.showAnnouncementBar,
                      })
                    }
                  />

                  <FeatureToggle
                    label="Sticky Header"
                    description="Keep store navigation visible while scrolling."
                    enabled={store.settings.stickyHeader}
                    onClick={() =>
                      updateSettings({
                        stickyHeader: !store.settings.stickyHeader,
                      })
                    }
                  />

                  <FeatureToggle
                    label="Dark Mode"
                    description="Allow dark styling in the storefront."
                    enabled={store.settings.darkMode}
                    onClick={() =>
                      updateSettings({
                        darkMode: !store.settings.darkMode,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {section === "branding" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <h2 className="text-xl font-bold">Branding</h2>
                <p className="mb-6 mt-1 text-sm text-slate-500">
                  Customize your store identity and visual branding.
                </p>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="store-name"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Store name
                    </label>
                    <input
                      id="store-name"
                      value={store.name}
                      onChange={(event) =>
                        updateStore({ name: event.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="store-description"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Store description
                    </label>
                    <textarea
                      id="store-description"
                      value={store.description || ""}
                      onChange={(event) =>
                        updateStore({ description: event.target.value })
                      }
                      rows={4}
                      className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <ColorInput
                      label="Primary color"
                      value={store.primaryColor || "#111827"}
                      onChange={(value) =>
                        updateStore({ primaryColor: value })
                      }
                    />

                    <ColorInput
                      label="Accent color"
                      value={store.accentColor || "#2563eb"}
                      onChange={(value) =>
                        updateStore({ accentColor: value })
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="store-font"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Font
                    </label>
                    <select
                      id="store-font"
                      value={store.fontFamily || "Inter"}
                      onChange={(event) =>
                        updateStore({ fontFamily: event.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="system-ui">System UI</option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-sm font-semibold">Store preview URL</p>
                    <p className="mt-1 break-all text-sm text-slate-500">
                      {getStoreUrl()}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Manage store slugs in Store Management. This screen does
                      not pretend to save slug changes that the configuration
                      API does not support.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function NavButton({ active, icon, label, onClick }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
        active
          ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white"
          : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

interface PageRowProps {
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

function PageRow({
  label,
  description,
  enabled,
  disabled,
  onToggle,
}: PageRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div>
        <h3 className="font-semibold">{label}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        aria-pressed={enabled}
        aria-label={`${enabled ? "Disable" : "Enable"} ${label}`}
        className={`relative h-6 w-11 shrink-0 rounded-full p-1 transition ${
          enabled
            ? "bg-slate-900 dark:bg-white"
            : "bg-slate-300 dark:bg-slate-700"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <span
          className={`block h-4 w-4 rounded-full transition ${
            enabled ? "translate-x-5" : ""
          } bg-white dark:bg-slate-900`}
        />
      </button>
    </div>
  );
}

interface FeatureToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onClick: () => void;
}

function FeatureToggle({
  label,
  description,
  enabled,
  onClick,
}: FeatureToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={enabled}
      className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
    >
      <div>
        <h3 className="font-semibold">{label}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <span
        className={`mt-1 h-6 w-11 shrink-0 rounded-full p-1 ${
          enabled
            ? "bg-slate-900 dark:bg-white"
            : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white transition ${
            enabled ? "translate-x-5" : ""
          } dark:bg-slate-900`}
        />
      </span>
    </button>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>

      <div className="flex gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-16 cursor-pointer rounded-lg border border-slate-200 p-1 dark:border-slate-800"
        />

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm dark:border-slate-800 dark:bg-slate-950"
        />
      </div>
    </div>
  );
}
