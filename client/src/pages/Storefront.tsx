import {
useMemo,
useState,
type ReactNode,
} from "react";

import {
Check,
Copy,
Eye,
LayoutTemplate,
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

import {
DEFAULT_STORE_CONFIG,
STORE_THEMES,
} from "../themes/registry";

import StoreThemeSelector from "../components/storefront/StoreThemeSelector";
import { ThemeEditor } from "../components/theme-editor";

type Section =
| "themes"
| "editor"
| "pages"
| "features"
| "branding";

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
description:
"A page customers can use to contact you.",
},
{
page: "cart",
label: "Cart",
description: "Customer shopping cart.",
},
];

export default function StorefrontAdmin() {
const [store, setStore] = useState<StoreConfig>(() =>
readSavedStore()
);

const [section, setSection] =
useState<Section>("themes");

const [saved, setSaved] =
useState(false);

const [copied, setCopied] =
useState(false);

const selectedTheme = useMemo(
() =>
STORE_THEMES.find(
(theme) =>
theme.id === store.themeId
) ?? STORE_THEMES[0],
[store.themeId]
);

function updateStore(
changes: Partial<StoreConfig>
) {
setStore((current) => ({
...current,
...changes,
}));

setSaved(false);

}

function updateSettings(
changes: Partial<StoreConfig["settings"]>
) {
setStore((current) => ({
...current,
settings: {
...current.settings,
...changes,
},
}));

setSaved(false);

}

function selectTheme(
themeId: StoreThemeId
) {
const theme = STORE_THEMES.find(
(item) => item.id === themeId
);

if (!theme) return;

const nextStore: StoreConfig = {
  ...store,
  themeId,
  settings: {
    ...store.settings,
    ...theme.settings,
  },
  homeSections: cloneSections(
    theme.homeSections
  ),
  productSections: cloneSections(
    theme.productSections
  ),
};

setStore(nextStore);
setSaved(false);

/*
 * Open the real full-screen theme editor
 * immediately after choosing a theme.
 */
setSection("editor");

}

function togglePage(
page: StorePageType
) {
if (page === "home") return;

setStore((current) => ({
  ...current,
  navigation:
    current.navigation.map(
      (item) =>
        item.href === `/${page}`
          ? {
              ...item,
              enabled: !item.enabled,
            }
          : item
    ),
  settings: {
    ...current.settings,
    ...(page === "catalog"
      ? {
          showCatalogPage:
            !current.settings
              .showCatalogPage,
        }
      : {}),
    ...(page === "contact"
      ? {
          showContactPage:
            !current.settings
              .showContactPage,
        }
      : {}),
    ...(page === "cart"
      ? {
          showCartPage:
            !current.settings
              .showCartPage,
        }
      : {}),
  },
}));

setSaved(false);

}

function saveStore(
nextStore: StoreConfig = store
) {
localStorage.setItem(
"meo_store_config",
JSON.stringify(nextStore)
);

setStore(nextStore);
setSaved(true);

window.setTimeout(() => {
  setSaved(false);
}, 2000);

}

function handleEditorChange(
nextStore: StoreConfig
) {
setStore(nextStore);
setSaved(false);
}

function handleEditorSave(
nextStore: StoreConfig
) {
saveStore(nextStore);
}

function handleEditorPublish(
nextStore: StoreConfig
) {
/*
* Publishing currently stores the latest
* configuration locally.
*
* Real public publishing/database deployment
* will be connected later when the backend
* and database are added.
*/
saveStore(nextStore);
}

function previewStore() {
const slug =
store.slug?.trim() ||
"my-store";

window.open(
  `/store/${encodeURIComponent(
    slug
  )}`,
  "_blank",
  "noopener,noreferrer"
);

}

async function copyStoreLink() {
const slug =
store.slug?.trim() ||
"my-store";

const url =
  `${window.location.origin}/store/${encodeURIComponent(
    slug
  )}`;

try {
  await navigator.clipboard.writeText(
    url
  );

  setCopied(true);

  window.setTimeout(() => {
    setCopied(false);
  }, 1800);
} catch {
  setCopied(false);
}

}

/*

IMPORTANT:


The new ThemeEditor is a complete full-screen
editor. Return it directly instead of rendering
the normal Storefront admin shell underneath it.


This removes the old admin sidebar/header while
the theme editor is open.
*/
if (section === "editor") {
return (
<ThemeEditor
store={store}
onChange={handleEditorChange}
onBack={() =>
setSection("themes")
}
onSave={handleEditorSave}
onPublish={handleEditorPublish}
/>
);
}

return (
<div className="min-h-full bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
<div className="mx-auto max-w-7xl">
<header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
<div>
<div className="flex items-center gap-3">
<div className="rounded-xl bg-slate-900 p-2 text-white dark:bg-white dark:text-slate-900">
<Store size={20} />
</div>

          <div>
            <h1 className="text-2xl font-bold">
              Storefront
            </h1>

            <p className="text-sm text-slate-500">
              Design and configure your
              customer-facing store.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyStoreLink}
          className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"
        >
          {copied ? (
            <Check size={17} />
          ) : (
            <Copy size={17} />
          )}

          {copied
            ? "Copied"
            : "Copy link"}
        </button>

        <button
          type="button"
          onClick={previewStore}
          className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"
        >
          <Eye size={17} />
          Preview
        </button>

        <button
          type="button"
          onClick={() =>
            saveStore()
          }
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
        >
          {saved ? (
            <>
              <Check size={17} />
              Saved
            </>
          ) : (
            <>
              <Save size={17} />
              Save
            </>
          )}
        </button>
      </div>
    </header>

    <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <NavButton
          active={section === "themes"}
          icon={
            <Palette size={18} />
          }
          label="Themes"
          onClick={() =>
            setSection("themes")
          }
        />

        <NavButton
          active={section === "pages"}
          icon={
            <Store size={18} />
          }
          label="Pages"
          onClick={() =>
            setSection("pages")
          }
        />

        <NavButton
          active={section === "features"}
          icon={
            <Settings2
              size={18}
            />
          }
          label="Features"
          onClick={() =>
            setSection("features")
          }
        />

        <NavButton
          active={section === "branding"}
          icon={
            <Palette size={18} />
          }
          label="Branding"
          onClick={() =>
            setSection("branding")
          }
        />
      </aside>

      <main className="min-w-0">
        {section === "themes" && (
          <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">
                    Themes
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Choose the visual
                    foundation for
                    your storefront.
                  </p>
                </div>

                <div className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:block">
                  {selectedTheme.name}
                </div>
              </div>
            </div>

            <StoreThemeSelector
              themes={STORE_THEMES}
              selectedThemeId={
                store.themeId
              }
              onSelect={selectTheme}
            />

            <div className="mt-6 rounded-2xl border border-dashed p-5 dark:border-slate-700">
              <div className="flex gap-3">
                <div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
                  <LayoutTemplate
                    size={19}
                  />
                </div>

                <div>
                  <h3 className="font-semibold">
                    Customize this
                    theme
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Use the Theme
                    Editor to
                    visually
                    customize your
                    storefront,
                    reorder
                    sections, add
                    sections and
                    edit content.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setSection(
                        "editor"
                      )
                    }
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
                  >
                    Open Theme
                    Editor
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {section === "pages" && (
          <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="text-xl font-bold">
              Store pages
            </h2>

            <p className="mb-6 mt-1 text-sm text-slate-500">
              Choose which pages your
              customers can access.
            </p>

            <div className="space-y-3">
              {PAGE_OPTIONS.map(
                (option) => {
                  const navigation =
                    store.navigation.find(
                      (item) =>
                        item.href === `/${option.page}`
                    );

                  const enabled =
                    option.page ===
                    "home"
                      ? true
                      : navigation?.enabled ??
                        true;

                  return (
                    <PageRow
                      key={
                        option.page
                      }
                      label={
                        option.label
                      }
                      description={
                        option.description
                      }
                      enabled={
                        enabled
                      }
                      disabled={
                        option.page ===
                        "home"
                      }
                      onToggle={() =>
                        togglePage(
                          option.page
                        )
                      }
                    />
                  );
                }
              )}
            </div>
          </div>
        )}

        {section === "features" && (
          <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="text-xl font-bold">
              Store features
            </h2>

            <p className="mb-6 mt-1 text-sm text-slate-500">
              Control which storefront
              features are displayed.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <FeatureToggle
                label="Related Products"
                description="Show related products on product pages."
                enabled={
                  store.settings
                    .showRelatedProducts
                }
                onClick={() =>
                  updateSettings({
                    showRelatedProducts:
                      !store
                        .settings
                        .showRelatedProducts,
                  })
                }
              />

              <FeatureToggle
                label="Search"
                description="Show product search in the storefront."
                enabled={
                  store.settings
                    .showSearch
                }
                onClick={() =>
                  updateSettings({
                    showSearch:
                      !store
                        .settings
                        .showSearch,
                  })
                }
              />

              <FeatureToggle
                label="Newsletter"
                description="Show the newsletter signup section."
                enabled={
                  store.settings
                    .showNewsletter
                }
                onClick={() =>
                  updateSettings({
                    showNewsletter:
                      !store
                        .settings
                        .showNewsletter,
                  })
                }
              />

              <FeatureToggle
                label="Testimonials"
                description="Show customer testimonials."
                enabled={
                  store.settings
                    .showTestimonials
                }
                onClick={() =>
                  updateSettings({
                    showTestimonials:
                      !store
                        .settings
                        .showTestimonials,
                  })
                }
              />

              <FeatureToggle
                label="Trust Badges"
                description="Show trust and delivery information."
                enabled={
                  store.settings
                    .showTrustBadges
                }
                onClick={() =>
                  updateSettings({
                    showTrustBadges:
                      !store
                        .settings
                        .showTrustBadges,
                  })
                }
              />

              <FeatureToggle
                label="Announcement Bar"
                description="Show a message above the store header."
                enabled={
                  store.settings
                    .showAnnouncementBar
                }
                onClick={() =>
                  updateSettings({
                    showAnnouncementBar:
                      !store
                        .settings
                        .showAnnouncementBar,
                  })
                }
              />

              <FeatureToggle
                label="Sticky Header"
                description="Keep the store navigation visible while scrolling."
                enabled={
                  store.settings
                    .stickyHeader
                }
                onClick={() =>
                  updateSettings({
                    stickyHeader:
                      !store
                        .settings
                        .stickyHeader,
                  })
                }
              />

              <FeatureToggle
                label="Dark Mode"
                description="Allow the storefront to use dark styling."
                enabled={
                  store.settings
                    .darkMode
                }
                onClick={() =>
                  updateSettings({
                    darkMode:
                      !store
                        .settings
                        .darkMode,
                  })
                }
              />
            </div>
          </div>
        )}

        {section === "branding" && (
          <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="text-xl font-bold">
              Branding
            </h2>

            <p className="mb-6 mt-1 text-sm text-slate-500">
              Customize your store identity.
            </p>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Store name
                </label>

                <input
                  value={store.name}
                  onChange={(event) =>
                    updateStore({
                      name: event
                        .target
                        .value,
                    })
                  }
                  className="w-full rounded-xl border px-4 py-3 outline-none dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Store URL slug
                </label>

                <div className="flex overflow-hidden rounded-xl border dark:border-slate-800">
                  <span className="flex items-center bg-slate-100 px-3 text-sm text-slate-500 dark:bg-slate-800">
                    /store/
                  </span>

                  <input
                    value={
                      store.slug ||
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateStore({
                        slug: event
                          .target
                          .value
                          .toLowerCase()
                          .replace(
                            /[^a-z0-9-]/g,
                            "-"
                          )
                          .replace(
                            /-+/g,
                            "-"
                          )
                          .replace(
                            /^-+|-+$/g,
                            ""
                          ),
                      })
                    }
                    className="min-w-0 flex-1 bg-white px-4 py-3 outline-none dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Store description
                </label>

                <textarea
                  value={
                    store.description ||
                    ""
                  }
                  onChange={(event) =>
                    updateStore({
                      description:
                        event
                          .target
                          .value,
                    })
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border px-4 py-3 outline-none dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <ColorInput
                  label="Primary color"
                  value={
                    store.primaryColor ||
                    "#111827"
                  }
                  onChange={(value) =>
                    updateStore({
                      primaryColor:
                        value,
                    })
                  }
                />

                <ColorInput
                  label="Accent color"
                  value={
                    store.accentColor ||
                    "#2563eb"
                  }
                  onChange={(value) =>
                    updateStore({
                      accentColor:
                        value,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Font
                </label>

                <select
                  value={
                    store.fontFamily ||
                    "Inter"
                  }
                  onChange={(
                    event
                  ) =>
                    updateStore({
                      fontFamily:
                        event
                          .target
                          .value,
                    })
                  }
                  className="w-full rounded-xl border bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="Inter">
                    Inter
                  </option>

                  <option value="Arial">
                    Arial
                  </option>

                  <option value="Helvetica">
                    Helvetica
                  </option>

                  <option value="Georgia">
                    Georgia
                  </option>

                  <option value="system-ui">
                    System UI
                  </option>
                </select>
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

function readSavedStore(): StoreConfig {
try {
const raw =
localStorage.getItem(
"meo_store_config"
);

if (!raw) {
  return cloneStore(
    DEFAULT_STORE_CONFIG
  );
}

const saved =
  JSON.parse(raw) as Partial<StoreConfig>;

return {
  ...cloneStore(
    DEFAULT_STORE_CONFIG
  ),
  ...saved,
  settings: {
    ...DEFAULT_STORE_CONFIG.settings,
    ...(saved.settings ?? {}),
  },
  navigation:
    saved.navigation ??
    cloneNavigation(
      DEFAULT_STORE_CONFIG.navigation
    ),
  homeSections:
    saved.homeSections ??
    cloneSections(
      DEFAULT_STORE_CONFIG.homeSections
    ),
  productSections:
    saved.productSections ??
    cloneSections(
      DEFAULT_STORE_CONFIG.productSections
    ),
};

} catch {
return cloneStore(
DEFAULT_STORE_CONFIG
);
}
}

function cloneStore(
store: StoreConfig
): StoreConfig {
return {
...store,

navigation:
  cloneNavigation(
    store.navigation
  ),

settings: {
  ...store.settings,
},

homeSections:
  cloneSections(
    store.homeSections
  ),

productSections:
  cloneSections(
    store.productSections
  ),

};
}

function cloneNavigation(
navigation: StoreConfig["navigation"]
): StoreConfig["navigation"] {
return navigation.map(
(item) => ({
...item,
})
);
}

function cloneSections(
sections?: StoreConfig["homeSections"]
): StoreConfig["homeSections"] {
return (sections ?? []).map(
(section) => ({
...section,

  settings:
    {
      ...section.settings,
    },

  blocks:
    section.blocks?.map(
      (block) => ({
        ...block,
        settings: {
          ...block.settings,
        },
      })
    ),
})

);
}

interface NavButtonProps {
active: boolean;
icon: ReactNode;
label: string;
onClick: () => void;
}

function NavButton({
active,
icon,
label,
onClick,
}: NavButtonProps) {
return (
<button
type="button"
onClick={onClick}
className={`mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${active ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
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
<div className="flex items-center justify-between gap-4 rounded-xl border p-4 dark:border-slate-800">
<div>
<h3 className="font-semibold">
{label}
</h3>

    <p className="mt-1 text-sm text-slate-500">
      {description}
    </p>
  </div>

  <button
    type="button"
    disabled={disabled}
    onClick={onToggle}
    className={`relative h-6 w-11 shrink-0 rounded-full p-1 ${
      enabled
        ? "bg-slate-900 dark:bg-white"
        : "bg-slate-300 dark:bg-slate-700"
    } ${
      disabled
        ? "cursor-not-allowed opacity-60"
        : ""
    }`}
    aria-label={
      enabled
        ? `Disable ${label}`
        : `Enable ${label}`
    }
  >
    <span
      className={`block h-4 w-4 rounded-full bg-white transition ${
        enabled
          ? "translate-x-5"
          : ""
      } dark:bg-slate-900`}
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
<button type="button" onClick={onClick} className="flex items-start justify-between gap-4 rounded-xl border p-4 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800" >
<div>
<h3 className="font-semibold">
{label}
</h3>

    <p className="mt-1 text-sm text-slate-500">
      {description}
    </p>
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
        enabled
          ? "translate-x-5"
          : ""
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

function ColorInput({
label,
value,
onChange,
}: ColorInputProps) {
return (
<div>
<label className="mb-2 block text-sm font-semibold">
{label}
</label>

  <div className="flex gap-3">
    <input
      type="color"
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      className="h-12 w-16 cursor-pointer rounded-lg border p-1"
    />

    <input
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      className="min-w-0 flex-1 rounded-xl border px-4 py-3 font-mono text-sm dark:border-slate-800 dark:bg-slate-950"
    />
  </div>
</div>

);
}

