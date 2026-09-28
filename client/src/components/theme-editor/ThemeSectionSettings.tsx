import {
ChevronDown,
ChevronUp,
Plus,
Trash2,
} from "lucide-react";
import type {
StoreBlock,
StoreBlockType,
StoreSection,
} from "../../types/store";
import type { ThemeEditorDevice } from "./ThemeEditorTypes";
import {
getSetting,
updateSetting,
} from "./themeEditorUtils";
import { THEME_BLOCK_DEFINITIONS } from "./ThemeEditorTypes";

interface ThemeSectionSettingsProps {
section: StoreSection;
device: ThemeEditorDevice;
onChange: (section: StoreSection) => void;
onAddBlock: (type: StoreBlockType) => void;
onSelectBlock: (blockId: string) => void;
onDeleteBlock: (blockId: string) => void;
onMoveBlock: (
blockId: string,
direction: "up" | "down"
) => void;
}

export function ThemeSectionSettings({
section,
device,
onChange,
onAddBlock,
onSelectBlock,
onDeleteBlock,
onMoveBlock,
}: ThemeSectionSettingsProps) {
const settings = section.settings ?? {};

const set = (key: string, value: unknown) => {
onChange({
...section,
settings: updateSetting(settings, key, value),
});
};

const blocks = section.blocks ?? [];

return (
<div className="space-y-6">
<div>
<p className="text-sm font-bold capitalize text-slate-950">
{section.type.replace(/-/g, " ")}
</p>
<p className="mt-1 text-[11px] text-slate-500">
Section settings · {device}
</p>
</div>

  <div className="space-y-4">
    <Field
      label="Title"
      value={getSetting(settings, "title", "")}
      onChange={(value) => set("title", value)}
    />

    <Field
      label="Heading"
      value={getSetting(settings, "heading", "")}
      onChange={(value) => set("heading", value)}
    />

    <TextAreaField
      label="Text"
      value={getSetting(settings, "text", "")}
      onChange={(value) => set("text", value)}
    />

    <Field
      label="Subheading"
      value={getSetting(settings, "subheading", "")}
      onChange={(value) => set("subheading", value)}
    />

    <div className="grid grid-cols-2 gap-3">
      <Field
        label="Button text"
        value={getSetting(settings, "buttonText", "")}
        onChange={(value) => set("buttonText", value)}
      />

      <Field
        label="Button link"
        value={getSetting(settings, "buttonUrl", "")}
        onChange={(value) => set("buttonUrl", value)}
      />
    </div>
  </div>

  {(section.type === "hero" ||
    section.type === "image-text" ||
    section.type === "video") && (
    <div className="border-t border-slate-200 pt-5">
      <p className="mb-4 text-xs font-bold text-slate-900">
        Media
      </p>

      <div className="space-y-4">
        <Field
          label="Image URL"
          value={getSetting(settings, "imageUrl", "")}
          onChange={(value) => set("imageUrl", value)}
        />

        <Field
          label="Mobile image URL"
          value={getSetting(settings, "mobileImageUrl", "")}
          onChange={(value) => set("mobileImageUrl", value)}
        />

        {section.type === "video" && (
          <>
            <Field
              label="Video URL"
              value={getSetting(settings, "videoUrl", "")}
              onChange={(value) => set("videoUrl", value)}
            />

            <Field
              label="Poster URL"
              value={getSetting(settings, "posterUrl", "")}
              onChange={(value) => set("posterUrl", value)}
            />

            <ToggleField
              label="Autoplay"
              checked={getSetting(settings, "autoplay", true)}
              onChange={(value) => set("autoplay", value)}
            />

            <ToggleField
              label="Muted"
              checked={getSetting(settings, "muted", true)}
              onChange={(value) => set("muted", value)}
            />

            <ToggleField
              label="Loop"
              checked={getSetting(settings, "loop", true)}
              onChange={(value) => set("loop", value)}
            />

            <ToggleField
              label="Video controls"
              checked={getSetting(settings, "controls", false)}
              onChange={(value) => set("controls", value)}
            />

            <ToggleField
              label="Text overlay"
              checked={getSetting(settings, "textOverlay", true)}
              onChange={(value) => set("textOverlay", value)}
            />

            <NumberField
              label="Overlay opacity"
              value={getSetting(settings, "overlayOpacity", 40)}
              min={0}
              max={100}
              onChange={(value) => set("overlayOpacity", value)}
            />
          </>
        )}
      </div>
    </div>
  )}

  <div className="border-t border-slate-200 pt-5">
    <p className="mb-4 text-xs font-bold text-slate-900">
      Layout
    </p>

    <div className="grid grid-cols-2 gap-3">
      <NumberField
        label="Top spacing"
        value={getSetting(settings, "paddingTop", 64)}
        min={0}
        max={240}
        onChange={(value) => set("paddingTop", value)}
      />

      <NumberField
        label="Bottom spacing"
        value={getSetting(settings, "paddingBottom", 64)}
        min={0}
        max={240}
        onChange={(value) => set("paddingBottom", value)}
      />
    </div>

    <div className="mt-4">
      <SelectField
        label="Alignment"
        value={getSetting(settings, "alignment", "left")}
        options={[
          ["left", "Left"],
          ["center", "Center"],
          ["right", "Right"],
        ]}
        onChange={(value) => set("alignment", value)}
      />
    </div>
  </div>

  {(section.type === "featured-products" ||
    section.type === "collections" ||
    section.type === "category-cards" ||
    section.type === "product-gallery" ||
    section.type === "related-products" ||
    section.type === "benefits" ||
    section.type === "testimonials" ||
    section.type === "reviews" ||
    section.type === "trust-badges") && (
    <div className="border-t border-slate-200 pt-5">
      <p className="mb-4 text-xs font-bold text-slate-900">
        Carousel / slider
      </p>

      <div className="space-y-4">
        <SelectField
          label="Layout"
          value={getSetting(settings, "layout", "grid")}
          options={[
            ["grid", "Grid"],
            ["carousel", "Carousel"],
          ]}
          onChange={(value) => set("layout", value)}
        />

        <ToggleField
          label="Autoplay"
          checked={getSetting(settings, "autoplay", false)}
          onChange={(value) => set("autoplay", value)}
        />

        <NumberField
          label="Autoplay interval (ms)"
          value={getSetting(settings, "autoplayInterval", 5000)}
          min={1000}
          max={30000}
          onChange={(value) =>
            set("autoplayInterval", value)
          }
        />

        <ToggleField
          label="Loop slides"
          checked={getSetting(settings, "loop", true)}
          onChange={(value) => set("loop", value)}
        />

        <ToggleField
          label="Show arrows"
          checked={getSetting(settings, "showArrows", true)}
          onChange={(value) => set("showArrows", value)}
        />

        <ToggleField
          label="Show dots"
          checked={getSetting(settings, "showDots", true)}
          onChange={(value) => set("showDots", value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Desktop columns"
            value={getSetting(settings, "columns", 4)}
            min={1}
            max={6}
            onChange={(value) => set("columns", value)}
          />

          <NumberField
            label="Mobile columns"
            value={getSetting(settings, "mobileColumns", 2)}
            min={1}
            max={3}
            onChange={(value) =>
              set("mobileColumns", value)
            }
          />
        </div>
      </div>
    </div>
  )}

  {section.type === "video" && (
    <div className="border-t border-slate-200 pt-5">
      <p className="mb-4 text-xs font-bold text-slate-900">
        Video text
      </p>

      <Field
        label="Overlay heading"
        value={getSetting(settings, "heading", "")}
        onChange={(value) => set("heading", value)}
      />

      <div className="mt-4">
        <TextAreaField
          label="Overlay text"
          value={getSetting(settings, "text", "")}
          onChange={(value) => set("text", value)}
        />
      </div>

      <div className="mt-4">
        <Field
          label="Overlay button"
          value={getSetting(settings, "buttonText", "")}
          onChange={(value) => set("buttonText", value)}
        />
      </div>

      <div className="mt-4">
        <Field
          label="Button URL"
          value={getSetting(settings, "buttonUrl", "")}
          onChange={(value) => set("buttonUrl", value)}
        />
      </div>
    </div>
  )}

  <div className="border-t border-slate-200 pt-5">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-slate-900">
          Blocks
        </p>
        <p className="mt-1 text-[10px] text-slate-500">
          Build the content inside this section.
        </p>
      </div>

      <div className="relative">
        <select
          value=""
          onChange={(event) => {
            if (event.target.value) {
              onAddBlock(event.target.value as StoreBlockType);
            }
          }}
          className="appearance-none rounded-lg bg-slate-950 py-2 pl-3 pr-8 text-[11px] font-bold text-white outline-none"
        >
          <option value="">Add block</option>
          {THEME_BLOCK_DEFINITIONS.map((definition) => (
            <option key={definition.type} value={definition.type}>
              {definition.label}
            </option>
          ))}
        </select>

        <Plus
          size={13}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white"
        />
      </div>
    </div>

    {blocks.length === 0 ? (
      <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
        <p className="text-xs font-semibold text-slate-700">
          No blocks
        </p>
        <p className="mt-1 text-[10px] leading-5 text-slate-500">
          Add blocks to build this section.
        </p>
      </div>
    ) : (
      <div className="space-y-2">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3"
          >
            <button
              type="button"
              onClick={() => onSelectBlock(block.id)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="text-xs font-bold capitalize text-slate-800">
                {block.type}
              </p>
            </button>

            <button
              type="button"
              onClick={() => onMoveBlock(block.id, "up")}
              disabled={index === 0}
              className="text-slate-400 disabled:opacity-20"
            >
              <ChevronUp size={14} />
            </button>

            <button
              type="button"
              onClick={() => onMoveBlock(block.id, "down")}
              disabled={index === blocks.length - 1}
              className="text-slate-400 disabled:opacity-20"
            >
              <ChevronDown size={14} />
            </button>

            <button
              type="button"
              onClick={() => onDeleteBlock(block.id)}
              className="text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    )}
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
<label className="block">
<span className="mb-2 block text-xs font-semibold text-slate-700">
{label}
</span>
<input
value={value}
onChange={(event) => onChange(event.target.value)}
className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus"
/>
</label>
);
}

function TextAreaField({
label,
value,
onChange,
}: {
label: string;
value: string;
onChange: (value: string) => void;
}) {
return (
<label className="block">
<span className="mb-2 block text-xs font-semibold text-slate-700">
{label}
</span>
<textarea
value={value}
onChange={(event) => onChange(event.target.value)}
rows={4}
className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus"
/>
</label>
);
}

function NumberField({
label,
value,
min,
max,
onChange,
}: {
label: string;
value: number;
min?: number;
max?: number;
onChange: (value: number) => void;
}) {
return (
<label className="block">
<span className="mb-2 block text-xs font-semibold text-slate-700">
{label}
</span>
<input
type="number"
min={min}
max={max}
value={value}
onChange={(event) => onChange(Number(event.target.value))}
className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus"
/>
</label>
);
}

function SelectField({
label,
value,
options,
onChange,
}: {
label: string;
value: string;
options: [string, string][];
onChange: (value: string) => void;
}) {
return (
<label className="block">
<span className="mb-2 block text-xs font-semibold text-slate-700">
{label}
</span>

  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-slate-950"
  >
    {options.map(([optionValue, optionLabel]) => (
      <option key={optionValue} value={optionValue}>
        {optionLabel}
      </option>
    ))}
  </select>
</label>

);
}

function ToggleField({
label,
checked,
onChange,
}: {
label: string;
checked: boolean;
onChange: (value: boolean) => void;
}) {
return (
<button
type="button"
onClick={() => onChange(!checked)}
className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left"
>
<span className="text-xs font-semibold text-slate-700">
{label}
</span>

  <span
    className={`relative h-5 w-9 rounded-full ${
      checked ? "bg-slate-950" : "bg-slate-200"
    }`}
  >
    <span
      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${
        checked ? "left-[18px]" : "left-0.5"
      }`}
    />
  </span>
</button>

);
}