import {
Image as ImageIcon,
Link,
Trash2,
Video,
} from "lucide-react";
import type { StoreBlock } from "../../types/store";
import type { ThemeEditorDevice } from "./ThemeEditorTypes";
import { getSetting, updateSetting } from "./themeEditorUtils";

interface ThemeBlockSettingsProps {
block: StoreBlock;
device: ThemeEditorDevice;
onChange: (block: StoreBlock) => void;
onDelete: () => void;
}

export function ThemeBlockSettings({
block,
device,
onChange,
onDelete,
}: ThemeBlockSettingsProps) {
const settings = block.settings ?? {};

const set = (key: string, value: unknown) => {
onChange({
...block,
settings: updateSetting(settings, key, value),
});
};

return (
<div className="space-y-5">
<div className="flex items-center justify-between">
<div>
<p className="text-sm font-bold capitalize text-slate-950">
{block.type} block
</p>
<p className="mt-1 text-[11px] text-slate-500">
Editing for {device}
</p>
</div>

    <button
      type="button"
      onClick={onDelete}
      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
      title="Delete block"
    >
      <Trash2 size={16} />
    </button>
  </div>

  {block.type === "heading" && (
    <>
      <Field
        label="Heading"
        value={getSetting(settings, "text", "")}
        onChange={(value) => set("text", value)}
      />

      <SelectField
        label="Heading level"
        value={getSetting(settings, "level", "h2")}
        options={[
          ["h1", "H1"],
          ["h2", "H2"],
          ["h3", "H3"],
          ["h4", "H4"],
        ]}
        onChange={(value) => set("level", value)}
      />

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
    </>
  )}

  {block.type === "text" && (
    <>
      <TextAreaField
        label="Text"
        value={getSetting(settings, "text", "")}
        onChange={(value) => set("text", value)}
      />

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
    </>
  )}

  {block.type === "button" && (
    <>
      <Field
        label="Button text"
        value={getSetting(settings, "text", "")}
        onChange={(value) => set("text", value)}
      />

      <Field
        label="Button link"
        value={getSetting(settings, "url", "")}
        onChange={(value) => set("url", value)}
        icon={<Link size={14} />}
      />

      <SelectField
        label="Style"
        value={getSetting(settings, "style", "solid")}
        options={[
          ["solid", "Solid"],
          ["outline", "Outline"],
          ["ghost", "Ghost"],
          ["link", "Link"],
        ]}
        onChange={(value) => set("style", value)}
      />

      <SelectField
        label="Size"
        value={getSetting(settings, "size", "medium")}
        options={[
          ["small", "Small"],
          ["medium", "Medium"],
          ["large", "Large"],
        ]}
        onChange={(value) => set("size", value)}
      />
    </>
  )}

  {block.type === "image" && (
    <>
      <Field
        label="Image URL"
        value={getSetting(settings, "imageUrl", "")}
        onChange={(value) => set("imageUrl", value)}
        icon={<ImageIcon size={14} />}
      />

      <Field
        label="Mobile image URL"
        value={getSetting(settings, "mobileImageUrl", "")}
        onChange={(value) => set("mobileImageUrl", value)}
        icon={<ImageIcon size={14} />}
      />

      <Field
        label="Alt text"
        value={getSetting(settings, "alt", "")}
        onChange={(value) => set("alt", value)}
      />

      <SelectField
        label="Object fit"
        value={getSetting(settings, "objectFit", "cover")}
        options={[
          ["cover", "Cover"],
          ["contain", "Contain"],
          ["fill", "Fill"],
        ]}
        onChange={(value) => set("objectFit", value)}
      />

      <Field
        label="Object position"
        value={getSetting(settings, "objectPosition", "center")}
        onChange={(value) => set("objectPosition", value)}
      />
    </>
  )}

  {block.type === "video" && (
    <>
      <Field
        label="Video URL"
        value={getSetting(settings, "videoUrl", "")}
        onChange={(value) => set("videoUrl", value)}
        icon={<Video size={14} />}
      />

      <Field
        label="Poster image URL"
        value={getSetting(settings, "posterUrl", "")}
        onChange={(value) => set("posterUrl", value)}
        icon={<ImageIcon size={14} />}
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
        label="Controls"
        checked={getSetting(settings, "controls", true)}
        onChange={(value) => set("controls", value)}
      />
    </>
  )}

  {block.type === "feature" && (
    <>
      <Field
        label="Title"
        value={getSetting(settings, "title", "")}
        onChange={(value) => set("title", value)}
      />

      <TextAreaField
        label="Description"
        value={getSetting(settings, "text", "")}
        onChange={(value) => set("text", value)}
      />

      <Field
        label="Icon"
        value={getSetting(settings, "icon", "")}
        onChange={(value) => set("icon", value)}
      />
    </>
  )}

  {block.type === "stat" && (
    <>
      <Field
        label="Value"
        value={getSetting(settings, "value", "")}
        onChange={(value) => set("value", value)}
      />

      <Field
        label="Label"
        value={getSetting(settings, "label", "")}
        onChange={(value) => set("label", value)}
      />
    </>
  )}

  {block.type === "review" && (
    <>
      <TextAreaField
        label="Review"
        value={getSetting(settings, "text", "")}
        onChange={(value) => set("text", value)}
      />

      <Field
        label="Customer name"
        value={getSetting(settings, "author", "")}
        onChange={(value) => set("author", value)}
      />

      <NumberField
        label="Rating"
        value={getSetting(settings, "rating", 5)}
        min={1}
        max={5}
        onChange={(value) => set("rating", value)}
      />

      <ToggleField
        label="Verified"
        checked={getSetting(settings, "verified", true)}
        onChange={(value) => set("verified", value)}
      />
    </>
  )}

  {block.type === "faq" && (
    <>
      <Field
        label="Question"
        value={getSetting(settings, "question", "")}
        onChange={(value) => set("question", value)}
      />

      <TextAreaField
        label="Answer"
        value={getSetting(settings, "answer", "")}
        onChange={(value) => set("answer", value)}
      />

      <ToggleField
        label="Open by default"
        checked={getSetting(settings, "open", false)}
        onChange={(value) => set("open", value)}
      />
    </>
  )}
</div>

);
}

function Field({
label,
value,
onChange,
icon,
}: {
label: string;
value: string;
onChange: (value: string) => void;
icon?: React.ReactNode;
}) {
return (
<label className="block">
<span className="mb-2 block text-xs font-semibold text-slate-700">
{label}
</span>
<div className="relative">
{icon && (
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
{icon}
</span>
)}
<input
value={value}
onChange={(event) => onChange(event.target.value)}
className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition focus ${icon ? "pl-9" : ""}`}
/>
</div>
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
className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition focus"
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
className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus"
>
{options.map(([optionValue, labelText]) => (
<option key={optionValue} value={optionValue}>
{labelText}
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
<span className="text-xs font-semibold text-slate-700">{label}</span>

  <span
    className={`relative h-5 w-9 rounded-full transition ${
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

