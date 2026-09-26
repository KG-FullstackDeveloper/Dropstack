import {
ChevronDown,
ChevronUp,
Eye,
EyeOff,
Plus,
Trash2,
} from "lucide-react";

import type {
StoreSection,
StoreSectionType,
} from "../../types/store";

interface StoreSectionEditorProps {
sections: StoreSection[];
onChange: (
sections: StoreSection[],
) => void;
}

const SECTION_OPTIONS: {
type: StoreSectionType;
label: string;
}[] = [
{
type: "announcement",
label: "Announcement",
},
{
type: "hero",
label: "Hero",
},
{
type: "featured-products",
label: "Featured products",
},
{
type: "collections",
label: "Collections",
},
{
type: "category-cards",
label: "Category cards",
},
{
type: "product-gallery",
label: "Product gallery",
},
{
type: "benefits",
label: "Benefits",
},
{
type: "how-it-works",
label: "How it works",
},
{
type: "image-text",
label: "Image + text",
},
{
type: "video",
label: "Video",
},
{
type: "testimonials",
label: "Testimonials",
},
{
type: "reviews",
label: "Reviews",
},
{
type: "faq",
label: "FAQ",
},
{
type: "guarantee",
label: "Guarantee",
},
{
type: "shipping",
label: "Shipping",
},
{
type: "trust-badges",
label: "Trust badges",
},
{
type: "newsletter",
label: "Newsletter",
},
{
type: "related-products",
label: "Related products",
},
{
type: "footer",
label: "Footer",
},
];

function getSectionLabel(
type: StoreSectionType,
) {
return (
SECTION_OPTIONS.find(
(item) => item.type === type,
)?.label || type
);
}

export default function StoreSectionEditor({
sections,
onChange,
}: StoreSectionEditorProps) {
function moveSection(
index: number,
direction: "up" | "down",
) {
const target =
direction === "up"
? index - 1
: index + 1;

if (
  target < 0 ||
  target >= sections.length
) {
  return;
}

const next = [...sections];

[
  next[index],
  next[target],
] = [
  next[target],
  next[index],
];

onChange(next);

}

function toggleSection(index: number) {
onChange(
sections.map((section, itemIndex) =>
itemIndex === index
? {
...section,
enabled: !section.enabled,
}
: section,
),
);
}

function removeSection(index: number) {
onChange(
sections.filter(
(_, itemIndex) =>
itemIndex !== index,
),
);
}

function addSection(
type: StoreSectionType,
) {
const section: StoreSection = {
id: `${type}-${Date.now()}`,
type,
enabled: true,
settings: {},
};

onChange([
  ...sections,
  section,
]);

}

return (
<div className="space-y-6">
<div className="rounded-2xl border border-slate-200 bg-white p-5">
<div className="flex items-center justify-between gap-4">
<div>
<h3 className="font-semibold text-slate-950">
Page sections
</h3>

        <p className="mt-1 text-sm text-slate-500">
          Reorder, show, hide or remove sections from this page.
        </p>
      </div>

      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        {sections.length} sections
      </span>
    </div>
  </div>

  <div className="space-y-3">
    {sections.length === 0 && (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-slate-700">
          No sections yet
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Add a section below to start building this page.
        </p>
      </div>
    )}

    {sections.map(
      (section, index) => (
        <div
          key={section.id}
          className={`rounded-2xl border bg-white p-4 transition ${
            section.enabled
              ? "border-slate-200"
              : "border-slate-200 opacity-60"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
              {index + 1}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-950">
                {getSectionLabel(
                  section.type,
                )}
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                {section.type}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  moveSection(
                    index,
                    "up",
                  )
                }
                disabled={index === 0}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Move section up"
              >
                <ChevronUp size={17} />
              </button>

              <button
                type="button"
                onClick={() =>
                  moveSection(
                    index,
                    "down",
                  )
                }
                disabled={
                  index ===
                  sections.length - 1
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Move section down"
              >
                <ChevronDown size={17} />
              </button>

              <button
                type="button"
                onClick={() =>
                  toggleSection(
                    index,
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                aria-label={
                  section.enabled
                    ? "Hide section"
                    : "Show section"
                }
              >
                {section.enabled ? (
                  <Eye size={17} />
                ) : (
                  <EyeOff size={17} />
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  removeSection(
                    index,
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Remove section"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs leading-5 text-slate-500">
              Visual section settings can be customized from the theme editor.
            </p>
          </div>
        </div>
      ),
    )}
  </div>

  <div className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex items-center gap-2">
      <Plus size={18} />

      <h3 className="font-semibold text-slate-950">
        Add section
      </h3>
    </div>

    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {SECTION_OPTIONS.map(
        (option) => (
          <button
            key={option.type}
            type="button"
            onClick={() =>
              addSection(
                option.type,
              )
            }
            className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            {option.label}
          </button>
        ),
      )}
    </div>
  </div>
</div>

);
}