import { useState } from "react";
import {
Check,
Eye,
Palette,
Save,
Settings2,
Store,
} from "lucide-react";

import type {
StoreConfig,
StorePageType,
StoreSection,
} from "../../types/store";

import {
DEFAULT_STORE_CONFIG,
STORE_THEMES,
} from "../../themes/registry";

import StoreThemeSelector from "../../components/storefront/StoreThemeSelector";
import StoreSectionEditor from "../../components/storefront/StoreSectionEditor";

type EditorTab =
| "themes"
| "sections"
| "pages"
| "settings";

const PAGES: {
page: StorePageType;
label: string;
}[] = [
{ page: "home", label: "Home" },
{ page: "catalog", label: "Catalog" },
{ page: "product", label: "Product" },
{ page: "contact", label: "Contact" },
{ page: "cart", label: "Cart" },
];

export default function StorefrontAdmin() {
const [store, setStore] =
useState<StoreConfig>(DEFAULT_STORE_CONFIG);

const [tab, setTab] =
useState<EditorTab>("themes");

const [selectedPage, setSelectedPage] =
useState<StorePageType>("home");

const [saved, setSaved] =
useState(false);

const sections =
selectedPage === "home"
? store.homeSections ?? []
: selectedPage === "product"
? store.productSections ?? []
: [];

function updateStore(
changes: Partial<StoreConfig>
) {
setStore((current) => ({
...current,
...changes,
}));

setSaved(false);

}

function selectTheme(themeId: StoreConfig["themeId"]) {
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

}

function updateSections(
nextSections: StoreSection[]
) {
if (selectedPage === "home") {
updateStore({
homeSections: nextSections,
});
return;
}

if (selectedPage === "product") {
  updateStore({
    productSections: nextSections,
  });
}

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
}));

setSaved(false);

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
window.open(
"/store",
"_blank",
"noopener,noreferrer"
);
}

return (
<div className="min-h-full bg-slate-100 dark:bg-slate-950">
<header className="border-b bg-white dark:border-slate-800 dark:bg-slate-900">
<div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
<div className="flex items-center gap-3">
<div className="rounded-xl bg-slate-900 p-2 text-white dark:bg-white dark:text-slate-900">
<Store size={20} />
</div>

        <div>
          <h1 className="text-xl font-bold">
            Storefront
          </h1>

          <p className="text-xs text-slate-500">
            Customize your customer-facing store.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={previewStore}
          className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
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
    </div>

    <div className="flex overflow-x-auto px-5">
      <TabButton
        active={tab === "themes"}
        onClick={() => setTab("themes")}
      >
        <Palette size={16} />
        Themes
      </TabButton>

      <TabButton
        active={tab === "sections"}
        onClick={() => setTab("sections")}
      >
        <Settings2 size={16} />
        Sections
      </TabButton>

      <TabButton
        active={tab === "pages"}
        onClick={() => setTab("pages")}
      >
        <Store size={16} />
        Pages
      </TabButton>

      <TabButton
        active={tab === "settings"}
        onClick={() => setTab("settings")}
      >
        <Settings2 size={16} />
        Settings
      </TabButton>
    </div>
  </header>

  <div className="grid lg:grid-cols-[320px_1fr]">
    <aside className="border-b bg-white dark:border-slate-800 dark:bg-slate-900 lg:min-h-[calc(100vh-130px)] lg:border-b-0 lg:border-r">
      {tab === "themes" && (
        <StoreThemeSelector
          themes={STORE_THEMES}
          selectedThemeId={store.themeId}
          onSelect={selectTheme}
        />
      )}

      {tab === "sections" && (
        <StoreSectionEditor
          sections={sections}
          onChange={updateSections}
        />
      )}

      {tab === "pages" && (
        <PagesPanel
          store={store}
          selectedPage={selectedPage}
          onSelectPage={setSelectedPage}
          onTogglePage={togglePage}
        />
      )}

      {tab === "settings" && (
        <SettingsPanel
          store={store}
          onUpdate={updateStore}
        />
      )}
    </aside>

    <main className="p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Editing
          </p>

          <h2 className="text-xl font-bold">
            {
              PAGES.find(
                (item) =>
                  item.page === selectedPage
              )?.label
            }
          </h2>
        </div>

        <button
          type="button"
          onClick={previewStore}
          className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900"
        >
          Open storefront
        </button>
      </div>

      <div className="min-h-[600px] rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div
          className="mx-auto max-w-6xl"
          style={{
            fontFamily:
              store.fontFamily || "Inter",
          }}
        >
          <div className="mb-6 rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
            <p className="text-xs font-semibold text-slate-500">
              Theme
            </p>

            <p className="mt-1 text-lg font-bold">
              {
                STORE_THEMES.find(
                  (theme) =>
                    theme.id === store.themeId
                )?.name
              }
            </p>
          </div>

          <div className="space-y-3">
            {sections.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center dark:border-slate-700">
                <p className="font-semibold">
                  No sections yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Open Sections and add the
                  sections you want.
                </p>
              </div>
            ) : (
              sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`rounded-xl border p-4 ${
                    section.enabled
                      ? "bg-white dark:bg-slate-900"
                      : "bg-slate-100 opacity-60 dark:bg-slate-950"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-400">
                        Section {index + 1}
                      </p>

                      <p className="font-semibold">
                        {formatSectionName(
                          section.type
                        )}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        section.enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {section.enabled
                        ? "Visible"
                        : "Hidden"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  </div>
</div>

);
}

function PagesPanel({
store,
selectedPage,
onSelectPage,
onTogglePage,
}: {
store: StoreConfig;
selectedPage: StorePageType;
onSelectPage: (
page: StorePageType
) => void;
onTogglePage: (
page: StorePageType
) => void;
}) {
return (
<div className="p-4">
<p className="text-xs font-bold uppercase tracking-wider text-slate-400">
Store pages
</p>

  <h2 className="mt-1 text-lg font-bold">
    Pages
  </h2>

  <div className="mt-5 space-y-2">
    {PAGES.map((item) => {
      const navigationItem =
        store.navigation.find(
          (nav) =>
            nav.page === item.page
        );

      const enabled =
        item.page === "home"
          ? true
          : navigationItem?.enabled ?? true;

      return (
        <div
          key={item.page}
          className={`flex items-center gap-3 rounded-xl border p-3 ${
            selectedPage === item.page
              ? "border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800"
              : "dark:border-slate-700"
          }`}
        >
          <button
            type="button"
            onClick={() =>
              onSelectPage(item.page)
            }
            className="flex-1 text-left text-sm font-semibold"
          >
            {item.label}
          </button>

          <button
            type="button"
            disabled={
              item.page === "home"
            }
            onClick={() =>
              onTogglePage(item.page)
            }
            className={`h-6 w-11 rounded-full p-1 ${
              enabled
                ? "bg-slate-900"
                : "bg-slate-300"
            } disabled:opacity-40`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white transition ${
                enabled
                  ? "translate-x-5"
                  : ""
              }`}
            />
          </button>
        </div>
      );
    })}
  </div>
</div>

);
}

function SettingsPanel({
store,
onUpdate,
}: {
store: StoreConfig;
onUpdate: (
changes: Partial<StoreConfig>
) => void;
}) {
return (
<div className="space-y-5 p-4">
<div>
<p className="text-xs font-bold uppercase tracking-wider text-slate-400">
Store settings
</p>

    <h2 className="mt-1 text-lg font-bold">
      Branding
    </h2>
  </div>

  <Field
    label="Store name"
    value={store.name}
    onChange={(name) =>
      onUpdate({ name })
    }
  />

  <div>
    <label className="mb-2 block text-xs font-bold">
      Description
    </label>

    <textarea
      value={store.description || ""}
      onChange={(event) =>
        onUpdate({
          description:
            event.target.value,
        })
      }
      rows={4}
      className="w-full rounded-xl border px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
    />
  </div>

  <Field
    label="Primary color"
    value={
      store.primaryColor || "#111827"
    }
    onChange={(primaryColor) =>
      onUpdate({ primaryColor })
    }
  />

  <Field
    label="Accent color"
    value={
      store.accentColor || "#2563eb"
    }
    onChange={(accentColor) =>
      onUpdate({ accentColor })
    }
  />

  <div>
    <label className="mb-2 block text-xs font-bold">
      Font
    </label>

    <select
      value={
        store.fontFamily || "Inter"
      }
      onChange={(event) =>
        onUpdate({
          fontFamily:
            event.target.value,
        })
      }
      className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
    >
      <option>Inter</option>
      <option>Arial</option>
      <option>Helvetica</option>
      <option>Georgia</option>
      <option>system-ui</option>
    </select>
  </div>
</div>

);
}

function Field({
label,
value,
onChange,
}: {
label: string;
value: string;
onChange: (value: string) => void;
}) {
return (
<div>
<label className="mb-2 block text-xs font-bold">
{label}
</label>

  <input
    value={value}
    onChange={(event) =>
      onChange(event.target.value)
    }
    className="w-full rounded-xl border px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
  />
</div>

);
}

function TabButton({
active,
onClick,
children,
}: {
active: boolean;
onClick: () => void;
children: React.ReactNode;
}) {
return (
<button
type="button"
onClick={onClick}
className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${active ? "border-slate-900 text-slate-950 dark:border-white dark:text-white" : "border-transparent text-slate-500"}`}
>
{children}
</button>
);
}

function cloneSections(
sections: StoreSection[]
): StoreSection[] {
return sections.map((section) => ({
...section,
settings: section.settings
? { ...section.settings }
: undefined,
}));
}

function formatSectionName(
value: string
): string {
return value
.split("-")
.map(
(part) =>
part.charAt(0).toUpperCase() +
part.slice(1)
)
.join(" ");
}