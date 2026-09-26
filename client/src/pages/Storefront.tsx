import {
useEffect,
useMemo,
useState,
type DragEvent,
type ReactNode,
} from "react";

import {
Check,
ChevronDown,
ChevronUp,
Copy,
Eye,
GripVertical,
LayoutTemplate,
Palette,
Plus,
Save,
Settings2,
Store,
Trash2,
} from "lucide-react";

import type {
StoreConfig,
StorePageType,
StoreSection,
StoreSectionType,
StoreThemeId,
} from "../types/store";

import {
DEFAULT_STORE_CONFIG,
STORE_THEMES,
} from "../themes/registry";

import StoreThemeSelector from "../components/storefront/StoreThemeSelector";

type Section =
| "themes"
| "editor"
| "pages"
| "features"
| "branding";

type EditorPage = "home" | "product";

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

const SECTION_LABELS: Record<
StoreSectionType,
string
> = {
announcement: "Announcement Bar",
hero: "Hero",
"featured-products": "Featured Products",
collections: "Collections",
"category-cards": "Category Cards",
"product-gallery": "Product Gallery",
"product-info": "Product Information",
benefits: "Benefits",
"how-it-works": "How It Works",
"image-text": "Image + Text",
video: "Video",
testimonials: "Testimonials",
reviews: "Reviews",
faq: "FAQ",
guarantee: "Guarantee",
shipping: "Shipping",
"trust-badges": "Trust Badges",
newsletter: "Newsletter",
"related-products": "Related Products",
footer: "Footer",
};

const AVAILABLE_SECTIONS: StoreSectionType[] = [
"announcement",
"hero",
"featured-products",
"collections",
"category-cards",
"benefits",
"how-it-works",
"image-text",
"video",
"testimonials",
"reviews",
"faq",
"guarantee",
"shipping",
"trust-badges",
"newsletter",
"related-products",
"footer",
];

const SECTION_DEFAULT_SETTINGS: Partial<
Record<StoreSectionType, Record<string, unknown>>
> = {
announcement: {
text: "Free shipping on selected orders",
},
hero: {
layout: "standard",
heading: "Discover products you'll love",
subheading:
"A modern shopping experience built around your products.",
buttonText: "Shop now",
},
"featured-products": {
title: "Featured products",
limit: 8,
},
collections: {
title: "Featured collections",
},
"category-cards": {
title: "Shop by category",
},
benefits: {
title: "Why shop with us",
},
"how-it-works": {
title: "How it works",
},
"image-text": {
heading: "Built around your brand",
text: "Tell customers what makes your store different.",
},
video: {
title: "Watch our story",
videoUrl: "",
},
testimonials: {
title: "What customers say",
},
reviews: {
title: "Customer reviews",
},
faq: {
title: "Frequently asked questions",
},
guarantee: {
title: "Our guarantee",
},
shipping: {
title: "Shipping information",
},
"trust-badges": {
title: "Shop with confidence",
},
newsletter: {
title: "Stay in the loop",
},
"related-products": {
title: "You may also like",
},
footer: {
text: "Thank you for shopping with us.",
},
};

export default function StorefrontAdmin() {
const [store, setStore] =
useState<StoreConfig>(() =>
readSavedStore()
);

const [section, setSection] =
useState<Section>("themes");

const [editorPage, setEditorPage] =
useState<EditorPage>("home");

const [saved, setSaved] =
useState(false);

const [draggedId, setDraggedId] =
useState<string | null>(null);

const [editingId, setEditingId] =
useState<string | null>(null);

const [copied, setCopied] =
useState(false);

const currentSections =
editorPage === "home"
? store.homeSections ?? []
: store.productSections ?? [];

const selectedTheme = useMemo(
() =>
STORE_THEMES.find(
(theme) =>
theme.id === store.themeId
) ?? STORE_THEMES[0],
[store.themeId]
);

useEffect(() => {
setEditingId(null);
}, [editorPage]);

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

setStore((current) => ({
  ...current,
  themeId,
  settings: {
    ...current.settings,
    ...theme.settings,
  },
  homeSections: cloneSections(
    theme.homeSections
  ),
  productSections: cloneSections(
    theme.productSections
  ),
}));

setSaved(false);
setSection("editor");

}

function togglePage(
page: StorePageType
) {
if (page === "home") return;

setStore((current) => ({
  ...current,
  navigation:
    current.navigation.map((item) =>
      item.page === page
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
            !current.settings.showCartPage,
        }
      : {}),
  },
}));

setSaved(false);

}

function updateSections(
sections: StoreSection[]
) {
setStore((current) => ({
...current,
...(editorPage === "home"
? {
homeSections: sections,
}
: {
productSections: sections,
}),
}));

setSaved(false);

}

function toggleSection(
sectionId: string
) {
updateSections(
currentSections.map((item) =>
item.id === sectionId
? {
...item,
enabled: !item.enabled,
}
: item
)
);
}

function removeSection(
sectionId: string
) {
updateSections(
currentSections.filter(
(item) => item.id !== sectionId
)
);

if (editingId === sectionId) {
  setEditingId(null);
}

}

function moveSection(
sectionId: string,
direction: "up" | "down"
) {
const index =
currentSections.findIndex(
(item) => item.id === sectionId
);

if (index === -1) return;

const targetIndex =
  direction === "up"
    ? index - 1
    : index + 1;

if (
  targetIndex < 0 ||
  targetIndex >= currentSections.length
) {
  return;
}

const next =
  [...currentSections];

const current = next[index];

next[index] =
  next[targetIndex];

next[targetIndex] = current;

updateSections(next);

}

function addSection(
type: StoreSectionType
) {
const baseId =
  `${type}-${Date.now()}`;

const newSection: StoreSection = {
  id: baseId,
  type,
  enabled: true,
  settings:
    SECTION_DEFAULT_SETTINGS[type]
      ? {
          ...SECTION_DEFAULT_SETTINGS[
            type
          ],
        }
      : undefined,
};

updateSections([
  ...currentSections,
  newSection,
]);

setEditingId(baseId);

}

function updateSectionSettings(
sectionId: string,
changes: Record<string, unknown>
) {
updateSections(
currentSections.map((item) =>
item.id === sectionId
? {
...item,
settings: {
...(item.settings ?? {}),
...changes,
},
}
: item
)
);
}

function handleDragStart(
event: DragEvent<HTMLDivElement>,
sectionId: string
) {
setDraggedId(sectionId);

event.dataTransfer.effectAllowed =
  "move";

event.dataTransfer.setData(
  "text/plain",
  sectionId
);

}

function handleDrop(
event: DragEvent<HTMLDivElement>,
targetId: string
) {
event.preventDefault();

const sourceId =
  event.dataTransfer.getData(
    "text/plain"
  ) || draggedId;

if (
  !sourceId ||
  sourceId === targetId
) {
  setDraggedId(null);
  return;
}

const sourceIndex =
  currentSections.findIndex(
    (item) => item.id === sourceId
  );

const targetIndex =
  currentSections.findIndex(
    (item) => item.id === targetId
  );

if (
  sourceIndex === -1 ||
  targetIndex === -1
) {
  setDraggedId(null);
  return;
}

const next =
  [...currentSections];

const [moved] =
  next.splice(sourceIndex, 1);

next.splice(
  targetIndex,
  0,
  moved
);

updateSections(next);
setDraggedId(null);

}

function saveChanges() {
localStorage.setItem(
"meo_store_config",
JSON.stringify(store)
);

setSaved(true);

window.setTimeout(() => {
  setSaved(false);
}, 2000);

}

function previewStore() {
const slug =
store.slug?.trim() ||
"my-store";

window.open(
  `/store/${encodeURIComponent(slug)}`,
  "_blank",
  "noopener,noreferrer"
);

}

async function copyStoreLink() {
const slug =
store.slug?.trim() ||
"my-store";

const url =
  `${window.location.origin}/store/${encodeURIComponent(slug)}`;

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
              Design and configure your customer-facing store.
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
          onClick={saveChanges}
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
          icon={<Palette size={18} />}
          label="Themes"
          onClick={() =>
            setSection("themes")
          }
        />

        <NavButton
          active={section === "editor"}
          icon={
            <LayoutTemplate
              size={18}
            />
          }
          label="Theme editor"
          onClick={() =>
            setSection("editor")
          }
        />

        <NavButton
          active={section === "pages"}
          icon={<Store size={18} />}
          label="Pages"
          onClick={() =>
            setSection("pages")
          }
        />

        <NavButton
          active={section === "features"}
          icon={
            <Settings2 size={18} />
          }
          label="Features"
          onClick={() =>
            setSection("features")
          }
        />

        <NavButton
          active={section === "branding"}
          icon={<Palette size={18} />}
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
                    Choose the visual foundation for your storefront.
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
                    Customize this theme
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    After choosing a theme, use the Theme Editor to reorder sections, hide sections, add new sections and edit their content.
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
                    Open Theme Editor
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {section === "editor" && (
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <LayoutTemplate
                      size={20}
                    />

                    <h2 className="text-xl font-bold">
                      Theme Editor
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedTheme.name} · Arrange and customize your storefront sections.
                  </p>
                </div>

                <div className="flex rounded-xl border bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
                  <EditorPageButton
                    active={
                      editorPage ===
                      "home"
                    }
                    label="Home"
                    onClick={() =>
                      setEditorPage(
                        "home"
                      )
                    }
                  />

                  <EditorPageButton
                    active={
                      editorPage ===
                      "product"
                    }
                    label="Product"
                    onClick={() =>
                      setEditorPage(
                        "product"
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold">
                      {editorPage === "home"
                        ? "Home sections"
                        : "Product sections"}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Drag sections to change their order.
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {currentSections.length} sections
                  </span>
                </div>

                <div className="space-y-3">
                  {currentSections.length ===
                    0 && (
                    <div className="rounded-2xl border border-dashed p-10 text-center dark:border-slate-700">
                      <LayoutTemplate
                        className="mx-auto text-slate-400"
                        size={32}
                      />

                      <h3 className="mt-3 font-semibold">
                        No sections yet
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Add a section from the panel on the right.
                      </p>
                    </div>
                  )}

                  {currentSections.map(
                    (item, index) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(
                          event
                        ) =>
                          handleDragStart(
                            event,
                            item.id
                          )
                        }
                        onDragOver={(
                          event
                        ) =>
                          event.preventDefault()
                        }
                        onDrop={(event) =>
                          handleDrop(
                            event,
                            item.id
                          )
                        }
                        onDragEnd={() =>
                          setDraggedId(
                            null
                          )
                        }
                        className={`rounded-2xl border transition ${
                          draggedId ===
                          item.id
                            ? "opacity-40"
                            : ""
                        } ${
                          item.enabled
                            ? "bg-white dark:bg-slate-900"
                            : "bg-slate-50 dark:bg-slate-950"
                        } dark:border-slate-800`}
                      >
                        <div className="flex items-center gap-3 p-4">
                          <div
                            className="cursor-grab text-slate-400 active:cursor-grabbing"
                            title="Drag to reorder"
                          >
                            <GripVertical
                              size={20}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold">
                                {SECTION_LABELS[
                                  item.type
                                ]}
                              </h4>

                              {!item.enabled && (
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800">
                                  Hidden
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              {item.type}
                            </p>
                          </div>

                          <div className="hidden items-center gap-1 sm:flex">
                            <IconButton
                              label="Move up"
                              disabled={
                                index ===
                                0
                              }
                              onClick={() =>
                                moveSection(
                                  item.id,
                                  "up"
                                )
                              }
                            >
                              <ChevronUp
                                                size={
                                                  16
                                                }
                                              />
                            </IconButton>

                            <IconButton
                              label="Move down"
                              disabled={
                                index ===
                                currentSections.length -
                                  1
                              }
                              onClick={() =>
                                moveSection(
                                  item.id,
                                  "down"
                                )
                              }
                            >
                              <ChevronDown
                                size={
                                  16
                                }
                              />
                            </IconButton>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setEditingId(
                                editingId ===
                                  item.id
                                  ? null
                                  : item.id
                              )
                            }
                            className="rounded-lg border px-3 py-2 text-xs font-semibold dark:border-slate-700"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleSection(
                                item.id
                              )
                            }
                            className={`relative h-6 w-11 shrink-0 rounded-full p-1 ${
                              item.enabled
                                ? "bg-slate-900 dark:bg-white"
                                : "bg-slate-300 dark:bg-slate-700"
                            }`}
                          >
                            <span
                              className={`block h-4 w-4 rounded-full bg-white transition ${
                                item.enabled
                                  ? "translate-x-5"
                                  : ""
                              } dark:bg-slate-900`}
                            />
                          </button>

                          <button
                            type="button"
                            aria-label="Remove section"
                            onClick={() =>
                              removeSection(
                                item.id
                              )
                            }
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>
                        </div>

                        {editingId ===
                          item.id && (
                          <SectionEditor
                            section={item}
                            onChange={(
                              changes
                            ) =>
                              updateSectionSettings(
                                item.id,
                                changes
                              )
                            }
                          />
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              <AddSectionPanel
                onAdd={addSection}
                existingTypes={
                  currentSections.map(
                    (item) =>
                      item.type
                  )
                }
              />
            </div>
          </div>
        )}

        {section === "pages" && (
          <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="text-xl font-bold">
              Store pages
            </h2>

            <p className="mt-1 mb-6 text-sm text-slate-500">
              Choose which pages your customers can access.
            </p>

            <div className="space-y-3">
              {PAGE_OPTIONS.map(
                (option) => {
                  const navigation =
                    store.navigation.find(
                      (item) =>
                        item.page ===
                        option.page
                    );

                  const enabled =
                    option.page === "home"
                      ? true
                      : navigation?.enabled ??
                        true;

                  return (
                    <PageRow
                      key={option.page}
                      label={
                        option.label
                      }
                      description={
                        option.description
                      }
                      enabled={enabled}
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

            <p className="mt-1 mb-6 text-sm text-slate-500">
              Control which storefront features are displayed.
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
                      !store.settings
                        .showRelatedProducts,
                  })
                }
              />

              <FeatureToggle
                label="Search"
                description="Show product search in the storefront."
                enabled={
                  store.settings.showSearch
                }
                onClick={() =>
                  updateSettings({
                    showSearch:
                      !store.settings
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
                      !store.settings
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
                      !store.settings
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
                      !store.settings
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
                      !store.settings
                        .showAnnouncementBar,
                  })
                }
              />

              <FeatureToggle
                label="Sticky Header"
                description="Keep the store navigation visible while scrolling."
                enabled={
                  store.settings.stickyHeader
                }
                onClick={() =>
                  updateSettings({
                    stickyHeader:
                      !store.settings
                        .stickyHeader,
                  })
                }
              />

              <FeatureToggle
                label="Dark Mode"
                description="Allow the storefront to use dark styling."
                enabled={
                  store.settings.darkMode
                }
                onClick={() =>
                  updateSettings({
                    darkMode:
                      !store.settings
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

            <p className="mt-1 mb-6 text-sm text-slate-500">
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
                      name: event.target.value,
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
                      store.slug || ""
                    }
                    onChange={(event) =>
                      updateStore({
                        slug: event.target.value
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
                            /^-|-$|/g,
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
                        event.target.value,
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
                  onChange={(event) =>
                    updateStore({
                      fontFamily:
                        event.target.value,
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
    DEFAULT_STORE_CONFIG.navigation,
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
navigation: store.navigation.map(
(item) => ({ ...item })
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

function cloneSections(
sections?: StoreSection[]
): StoreSection[] {
return (sections ?? []).map(
(section) => ({
...section,
settings: section.settings
? {
...section.settings,
}
: undefined,
})
);
}

interface EditorPageButtonProps {
active: boolean;
label: string;
onClick: () => void;
}

function EditorPageButton({
active,
label,
onClick,
}: EditorPageButtonProps) {
return (
<button
type="button"
onClick={onClick}
className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${active ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500"}`}
>
{label}
</button>
);
}

interface AddSectionPanelProps {
onAdd: (
type: StoreSectionType
) => void;
existingTypes: StoreSectionType[];
}

function AddSectionPanel({
onAdd,
existingTypes,
}: AddSectionPanelProps) {
return (
<aside className="h-fit rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
<div className="flex items-center gap-2">
<Plus size={18} />

    <h3 className="font-bold">
      Add section
    </h3>
  </div>

  <p className="mt-1 text-xs leading-5 text-slate-500">
    Add another section to this page. The section will appear at the bottom and can then be dragged into position.
  </p>

  <div className="mt-5 space-y-2">
    {AVAILABLE_SECTIONS.map(
      (type) => {
        const alreadyExists =
          existingTypes.includes(
            type
          );

        return (
          <button
            key={type}
            type="button"
            onClick={() =>
              onAdd(type)
            }
            className="flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm font-medium hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <span>
              {SECTION_LABELS[type]}
            </span>

            <Plus
              size={15}
              className={
                alreadyExists
                  ? "text-slate-300"
                  : "text-slate-500"
              }
            />
          </button>
        );
      }
    )}
  </div>
</aside>

);
}

interface SectionEditorProps {
section: StoreSection;
onChange: (
changes: Record<string, unknown>
) => void;
}

function SectionEditor({
section,
onChange,
}: SectionEditorProps) {
const settings =
section.settings ?? {};

return (
<div className="border-t bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5">
<div className="mb-4 flex items-center justify-between">
<div>
<h4 className="font-semibold">
Edit{" "}
{SECTION_LABELS[
section.type
]}
</h4>

      <p className="mt-1 text-xs text-slate-500">
        Customize this section's content.
      </p>
    </div>

    <Settings2
      size={17}
      className="text-slate-400"
    />
  </div>

  {section.type ===
    "hero" && (
    <div className="grid gap-4">
      <TextField
        label="Heading"
        value={stringValue(
          settings.heading
        )}
        onChange={(value) =>
          onChange({
            heading: value,
          })
        }
      />

      <TextField
        label="Subheading"
        value={stringValue(
          settings.subheading
        )}
        onChange={(value) =>
          onChange({
            subheading: value,
          })
        }
      />

      <TextField
        label="Button text"
        value={stringValue(
          settings.buttonText
        )}
        onChange={(value) =>
          onChange({
            buttonText: value,
          })
        }
      />

      <SelectField
        label="Layout"
        value={stringValue(
          settings.layout ||
            "standard"
        )}
        options={[
          "standard",
          "editorial",
          "commerce",
          "minimal",
          "modern",
        ]}
        onChange={(value) =>
          onChange({
            layout: value,
          })
        }
      />
    </div>
  )}

  {section.type ===
    "announcement" && (
    <TextField
      label="Announcement text"
      value={stringValue(
        settings.text
      )}
      onChange={(value) =>
        onChange({
          text: value,
        })
      }
    />
  )}

  {[
    "featured-products",
    "collections",
    "category-cards",
    "benefits",
    "how-it-works",
    "testimonials",
    "reviews",
    "faq",
    "guarantee",
    "shipping",
    "trust-badges",
    "newsletter",
    "related-products",
    "footer",
  ].includes(section.type) && (
    <TextField
      label="Section title"
      value={stringValue(
        settings.title
      )}
      onChange={(value) =>
        onChange({
          title: value,
        })
      }
    />
  )}

  {section.type ===
    "featured-products" && (
    <div className="mt-4">
      <NumberField
        label="Maximum products"
        value={numberValue(
          settings.limit,
          8
        )}
        min={1}
        max={24}
        onChange={(value) =>
          onChange({
            limit: value,
          })
        }
      />
    </div>
  )}

  {section.type ===
    "image-text" && (
    <div className="grid gap-4">
      <TextField
        label="Heading"
        value={stringValue(
          settings.heading
        )}
        onChange={(value) =>
          onChange({
            heading: value,
          })
        }
      />

      <TextAreaField
        label="Text"
        value={stringValue(
          settings.text
        )}
        onChange={(value) =>
          onChange({
            text: value,
          })
        }
      />
    </div>
  )}

  {section.type ===
    "video" && (
    <div className="grid gap-4">
      <TextField
        label="Title"
        value={stringValue(
          settings.title
        )}
        onChange={(value) =>
          onChange({
            title: value,
          })
        }
      />

      <TextField
        label="Video URL"
        value={stringValue(
          settings.videoUrl
        )}
        placeholder="Paste a video URL"
        onChange={(value) =>
          onChange({
            videoUrl: value,
          })
        }
      />
    </div>
  )}

  {section.type ===
    "product-gallery" && (
    <SelectField
      label="Gallery layout"
      value={stringValue(
        settings.layout ||
          "standard"
      )}
      options={[
        "standard",
        "large",
        "compact",
      ]}
      onChange={(value) =>
        onChange({
          layout: value,
        })
      }
    />
  )}

  {section.type ===
    "product-info" && (
    <ToggleField
      label="Sticky product information"
      enabled={
        Boolean(
          settings.sticky
        )
      }
      onChange={(value) =>
        onChange({
          sticky: value,
        })
      }
    />
  )}

  {![
    "hero",
    "announcement",
    "featured-products",
    "collections",
    "category-cards",
    "benefits",
    "how-it-works",
    "image-text",
    "video",
    "testimonials",
    "reviews",
    "faq",
    "guarantee",
    "shipping",
    "trust-badges",
    "newsletter",
    "related-products",
    "footer",
    "product-gallery",
    "product-info",
  ].includes(section.type) && (
    <p className="rounded-xl border border-dashed p-4 text-xs text-slate-500 dark:border-slate-700">
      This section is ready for additional visual controls. Its storefront renderer will use the section configuration when that component is connected.
    </p>
  )}
</div>

);
}

interface TextFieldProps {
label: string;
value: string;
placeholder?: string;
onChange: (value: string) => void;
}

function TextField({
label,
value,
placeholder,
onChange,
}: TextFieldProps) {
return (
<label className="block">
<span className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-300">
{label}
</span>

  <input
    value={value}
    placeholder={placeholder}
    onChange={(event) =>
      onChange(event.target.value)
    }
    className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900"
  />
</label>

);
}

interface TextAreaFieldProps {
label: string;
value: string;
onChange: (value: string) => void;
}

function TextAreaField({
label,
value,
onChange,
}: TextAreaFieldProps) {
return (
<label className="block">
<span className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-300">
{label}
</span>

  <textarea
    value={value}
    rows={4}
    onChange={(event) =>
      onChange(event.target.value)
    }
    className="w-full resize-none rounded-xl border bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-800 dark:bg-slate-900"
  />
</label>

);
}

interface NumberFieldProps {
label: string;
value: number;
min: number;
max: number;
onChange: (value: number) => void;
}

function NumberField({
label,
value,
min,
max,
onChange,
}: NumberFieldProps) {
return (
<label className="block">
<span className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-300">
{label}
</span>

  <input
    type="number"
    min={min}
    max={max}
    value={value}
    onChange={(event) =>
      onChange(
        Math.max(
          min,
          Math.min(
            max,
            Number(
              event.target.value
            ) || min
          )
        )
      )
    }
    className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-800 dark:bg-slate-900"
  />
</label>

);
}

interface SelectFieldProps {
label: string;
value: string;
options: string[];
onChange: (value: string) => void;
}

function SelectField({
label,
value,
options,
onChange,
}: SelectFieldProps) {
return (
<label className="block">
<span className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-300">
{label}
</span>

  <select
    value={value}
    onChange={(event) =>
      onChange(event.target.value)
    }
    className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-800 dark:bg-slate-900"
  >
    {options.map(
      (option) => (
        <option
          key={option}
          value={option}
        >
          {option}
        </option>
      )
    )}
  </select>
</label>

);
}

interface ToggleFieldProps {
label: string;
enabled: boolean;
onChange: (value: boolean) => void;
}

function ToggleField({
label,
enabled,
onChange,
}: ToggleFieldProps) {
return (
<button
type="button"
onClick={() =>
onChange(!enabled)
}
className="flex w-full items-center justify-between rounded-xl border bg-white p-3 text-left dark dark"
>
<span className="text-sm font-semibold">
{label}
</span>

  <span
    className={`relative h-6 w-11 rounded-full p-1 ${
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

interface IconButtonProps {
label: string;
disabled?: boolean;
onClick: () => void;
children: ReactNode;
}

function IconButton({
label,
disabled,
onClick,
children,
}: IconButtonProps) {
return (
<button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-white" >
{children}
</button>
);
}

function stringValue(
value: unknown
): string {
return typeof value === "string"
? value
: "";
}

function numberValue(
value: unknown,
fallback: number
): number {
return typeof value === "number" &&
Number.isFinite(value)
? value
: fallback;
}