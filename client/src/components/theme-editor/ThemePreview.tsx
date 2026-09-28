import {
ChevronLeft,
ChevronRight,
Play,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
StoreBlock,
StoreConfig,
StoreSection,
} from "../../types/store";
import type { ThemeEditorDevice } from "./ThemeEditorTypes";
import {
getEditorSections,
getSetting,
} from "./themeEditorUtils";

interface ThemePreviewProps {
store: StoreConfig;
device: ThemeEditorDevice;
selectedSectionId: string | null;
selectedBlockId: string | null;
onSelectSection: (sectionId: string) => void;
onSelectBlock: (sectionId: string, blockId: string) => void;
}

export function ThemePreview({
store,
device,
selectedSectionId,
selectedBlockId,
onSelectSection,
onSelectBlock,
}: ThemePreviewProps) {
const sections = getEditorSections(store);

return (
<div className="min-h-full bg-slate-100 p-5">
<div
className="mx-auto overflow-hidden rounded-xl bg-white shadow-2xl transition-all"
style={{
width:
device === "desktop"
? "100%"
: device === "tablet"
? "768px"
: "390px",
maxWidth: "100%",
}}
>
<StoreHeader store={store} />

    {sections.map((section) => (
      <PreviewSection
        key={section.id}
        store={store}
        section={section}
        selected={section.id === selectedSectionId}
        selectedBlockId={selectedBlockId}
        onSelect={() => onSelectSection(section.id)}
        onSelectBlock={(blockId) =>
          onSelectBlock(section.id, blockId)
        }
      />
    ))}

    {sections.length === 0 && (
      <div className="flex min-h-[650px] items-center justify-center p-10 text-center">
        <div>
          <p className="text-lg font-black text-slate-900">
            Your storefront is empty
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Add a section from the editor.
          </p>
        </div>
      </div>
    )}

    <StoreFooter store={store} />
  </div>
</div>

);
}

function StoreHeader({ store }: { store: StoreConfig }) {
return (
<header
className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-5 py-4"
style={{
fontFamily: store.fontFamily || "Inter",
}}
>
<div className="flex items-center gap-3">
{store.logoUrl ? (
<img src={store.logoUrl} alt={store.name} className="h-8 max-w-[120px] object-contain" />
) : (
<div
className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-white"
style={{
backgroundColor: store.primaryColor || "#111827",
}}
>
{(store.name || "S").slice(0, 1).toUpperCase()}
</div>
)}

    <span className="text-sm font-black">
      {store.name || "Your Store"}
    </span>
  </div>

  <nav className="hidden items-center gap-5 sm:flex">
    {store.navigation.slice(0, 4).map((item) => (
      <span
        key={item.id}
        className="text-[11px] font-semibold text-slate-600"
      >
        {item.label}
      </span>
    ))}
  </nav>
</header>

);
}

function PreviewSection({
section,
store,
selected,
selectedBlockId,
onSelect,
onSelectBlock,
}: {
section: StoreSection;
store: StoreConfig;
selected: boolean;
selectedBlockId: string | null;
onSelect: () => void;
onSelectBlock: (blockId: string) => void;
}) {
if (!section.enabled) {
return null;
}

const settings = section.settings ?? {};
const primary = store.primaryColor || "#111827";
const accent = store.accentColor || "#2563eb";

const paddingTop = getSetting(settings, "paddingTop", 64);
const paddingBottom = getSetting(settings, "paddingBottom", 64);

const wrapperStyle = {
paddingTop,
paddingBottom,
};

const selectClass = selected
? "relative outline outline-2 outline-offset-[-2px]"
: "relative";

if (section.type === "announcement") {
return (
<button
type="button"
onClick={onSelect}
className={`block w-full text-center ${selectClass}`}
style={{
backgroundColor: getSetting(
settings,
"backgroundColor",
"#111827"
),
color: getSetting(
settings,
"textColor",
"#ffffff"
),
outlineColor: accent,
}}
>
<div className="px-4 py-2.5 text-[11px] font-bold">
{getSetting(
settings,
"text",
"Free shipping on qualifying orders"
)}
</div>

    {selected && <SelectionLabel accent={accent} />}
  </button>
);

}

if (section.type === "hero") {
return (
<button
type="button"
onClick={onSelect}
className={`grid min-h-[460px] w-full grid-cols-1 gap-8 bg-[#f5f1ec] p-8 text-left sm lg ${selectClass}`}
style={{ outlineColor: accent }}
>
<div className="flex flex-col justify-center">
<p
className="text-[10px] font-black uppercase tracking-[0.2em]"
style={{ color: accent }}
>
{store.name || "Your Store"}
</p>

      <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
        {getSetting(
          settings,
          "heading",
          "A storefront built around your brand"
        )}
      </h1>

      <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600">
        {getSetting(
          settings,
          "subheading",
          "Introduce your store and guide customers toward your products."
        )}
      </p>

      {getSetting(settings, "buttonText", "") && (
        <span
          className="mt-7 inline-flex w-fit rounded-full px-6 py-3 text-xs font-bold text-white"
          style={{ backgroundColor: primary }}
        >
          {getSetting(settings, "buttonText", "Shop now")}
        </span>
      )}
    </div>

    <MediaPlaceholder
      url={getSetting(settings, "imageUrl", "")}
      label="Hero media"
    />

    {selected && <SelectionLabel accent={accent} />}
  </button>
);

}

if (
section.type === "featured-products" ||
section.type === "related-products"
) {
return (
<ProductSection section={section} selected={selected} accent={accent} wrapperStyle={wrapperStyle} onSelect={onSelect} />
);
}

if (
section.type === "testimonials" ||
section.type === "reviews"
) {
return (
<ReviewsSection section={section} selected={selected} accent={accent} wrapperStyle={wrapperStyle} onSelect={onSelect} />
);
}

if (section.type === "video") {
return (
<VideoSection section={section} selected={selected} selectedBlockId={selectedBlockId} accent={accent} wrapperStyle={wrapperStyle} onSelect={onSelect} onSelectBlock={onSelectBlock} />
);
}

return (
<button
type="button"
onClick={onSelect}
className={`block w-full bg-white px-7 text-left ${selectClass}`}
style={{
...wrapperStyle,
outlineColor: accent,
}}
>
<div className="mx-auto max-w-5xl">
<h2 className="text-3xl font-black tracking-tight text-slate-950">
{getSetting(
settings,
"heading",
getSetting(
settings,
"title",
section.type.replace(/-/g, " ")
)
)}
</h2>

    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
      {getSetting(
        settings,
        "text",
        "Your editable section content appears here."
      )}
    </p>

    <Blocks
      blocks={section.blocks ?? []}
      selectedBlockId={selectedBlockId}
      accent={accent}
      onSelectBlock={onSelectBlock}
    />
  </div>

  {selected && <SelectionLabel accent={accent} />}
</button>

);
}

function ProductSection({
section,
selected,
accent,
wrapperStyle,
onSelect,
}: {
section: StoreSection;
selected: boolean;
accent: string;
wrapperStyle: React.CSSProperties;
onSelect: () => void;
}) {
const settings = section.settings ?? {};
const [slide, setSlide] = useState(0);

const autoplay = getSetting(settings, "autoplay", false);
const interval = getSetting(
settings,
"autoplayInterval",
5000
);

const items = [1, 2, 3, 4, 5, 6];

useEffect(() => {
if (!autoplay || items.length <= 1) {
return;
}

const timer = window.setInterval(() => {
  setSlide((current) => (current + 1) % items.length);
}, interval);

return () => window.clearInterval(timer);

}, [autoplay, interval]);

const carousel =
getSetting(settings, "layout", "grid") === "carousel";

return (
<section
className={`relative bg-white px-7 ${selected ? "outline outline-2 outline-offset-[-2px]" : ""}`}
style={{
...wrapperStyle,
outlineColor: accent,
}}
onClick={onSelect}
>
<div className="mx-auto max-w-6xl">
<h2 className="text-3xl font-black tracking-tight">
{getSetting(
settings,
"title",
section.type === "related-products"
? "You may also like"
: "Featured products"
)}
</h2>

    <p className="mt-3 text-sm text-slate-500">
      {getSetting(
        settings,
        "text",
        "Discover products selected for your store."
      )}
    </p>

    <div
      className={`mt-8 grid gap-4 ${
        carousel ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"
      }`}
    >
      {(carousel ? items.slice(slide, slide + 4) : items.slice(0, 4)).map(
        (item) => (
          <div key={item}>
            <div className="aspect-square rounded-xl bg-slate-100" />
            <div className="mt-3 h-3 w-2/3 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
          </div>
        )
      )}
    </div>

    {carousel &&
      getSetting(settings, "showArrows", true) && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSlide(
                (current) =>
                  (current - 1 + items.length) %
                  items.length
              );
            }}
            className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md"
          >
            <ChevronLeft size={17} />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSlide(
                (current) =>
                  (current + 1) % items.length
              );
            }}
            className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md"
          >
            <ChevronRight size={17} />
          </button>
        </>
      )}
  </div>

  {selected && <SelectionLabel accent={accent} />}
</section>

);
}

function ReviewsSection({
section,
selected,
accent,
wrapperStyle,
onSelect,
}: {
section: StoreSection;
selected: boolean;
accent: string;
wrapperStyle: React.CSSProperties;
onSelect: () => void;
}) {
const settings = section.settings ?? {};

return (
<section
onClick={onSelect}
className={`bg-[#f6f2ed] px-7 ${selected ? "relative outline outline-2 outline-offset-[-2px]" : ""}`}
style={{
...wrapperStyle,
outlineColor: accent,
}}
>
<div className="mx-auto max-w-6xl">
<div className="mx-auto max-w-2xl text-center">
<h2 className="text-3xl font-black">
{getSetting(
settings,
"title",
"What customers say"
)}
</h2>

      <p className="mt-3 text-sm text-slate-500">
        {getSetting(settings, "text", "")}
      </p>
    </div>

    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="rounded-2xl bg-white p-6 shadow-sm"
        >
          <p className="text-sm tracking-widest">â˜…â˜…â˜…â˜…â˜…</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Customer review content will be editable here.
          </p>
          <p className="mt-5 text-xs font-bold">
            Verified customer
          </p>
        </div>
      ))}
    </div>
  </div>

  {selected && <SelectionLabel accent={accent} />}
</section>

);
}

function VideoSection({
section,
selected,
selectedBlockId,
accent,
wrapperStyle,
onSelect,
onSelectBlock,
}: {
section: StoreSection;
selected: boolean;
selectedBlockId: string | null;
accent: string;
wrapperStyle: React.CSSProperties;
onSelect: () => void;
onSelectBlock: (blockId: string) => void;
}) {
const settings = section.settings ?? {};

const videoUrl = getSetting(settings, "videoUrl", "");
const posterUrl = getSetting(settings, "posterUrl", "");
const autoplay = getSetting(settings, "autoplay", true);
const muted = getSetting(settings, "muted", true);
const loop = getSetting(settings, "loop", true);
const controls = getSetting(settings, "controls", false);
const textOverlay = getSetting(
settings,
"textOverlay",
true
);
const opacity = getSetting(
settings,
"overlayOpacity",
40
);

return (
<section
onClick={onSelect}
className={`relative overflow-hidden bg-slate-950 text-white ${selected ? "outline outline-2 outline-offset-[-2px]" : ""}`}
style={{
...wrapperStyle,
outlineColor: accent,
}}
>
{videoUrl ? (
<video
src={videoUrl}
poster={posterUrl || undefined}
autoPlay={autoplay}
muted={muted}
loop={loop}
controls={controls}
playsInline
className="absolute inset-0 h-full w-full object-cover"
/>
) : (
<div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
)}

  <div
    className="absolute inset-0 bg-black"
    style={{ opacity: opacity / 100 }}
  />

  <div className="relative z-10 flex min-h-[430px] items-center justify-center px-7 py-16 text-center">
    {textOverlay && (
      <div className="max-w-2xl">
        <h2 className="text-4xl font-black">
          {getSetting(
            settings,
            "heading",
            "Tell your story"
          )}
        </h2>

        <p className="mt-4 text-sm leading-7 text-slate-200">
          {getSetting(
            settings,
            "text",
            "Add text directly over your video."
          )}
        </p>

        {getSetting(settings, "buttonText", "") && (
          <span className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-xs font-bold text-slate-950">
            {getSetting(settings, "buttonText", "")}
          </span>
        )}
      </div>
    )}

    {!videoUrl && (
      <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[10px] font-bold">
        <Play size={12} />
        Add a video URL
      </div>
    )}
  </div>

  <Blocks
    blocks={section.blocks ?? []}
    selectedBlockId={selectedBlockId}
    accent={accent}
    onSelectBlock={onSelectBlock}
  />

  {selected && <SelectionLabel accent={accent} />}
</section>

);
}

function Blocks({
blocks,
selectedBlockId,
accent,
onSelectBlock,
}: {
blocks: StoreBlock[];
selectedBlockId: string | null;
accent: string;
onSelectBlock: (blockId: string) => void;
}) {
if (!blocks.length) {
return null;
}

return (
<div className="mt-8 space-y-3">
{blocks.map((block) => {
const settings = block.settings ?? {};
const selected = selectedBlockId === block.id;

    return (
      <button
        key={block.id}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onSelectBlock(block.id);
        }}
        className={`block w-full rounded-xl p-4 text-left ${
          selected
            ? "outline outline-2 outline-offset-[-2px]"
            : ""
        }`}
        style={{
          outlineColor: accent,
        }}
      >
        {block.type === "heading" && (
          <p className="text-2xl font-black">
            {getSetting(settings, "text", "Heading")}
          </p>
        )}

        {block.type === "text" && (
          <p className="text-sm leading-6 text-slate-600">
            {getSetting(
              settings,
              "text",
              "Text block"
            )}
          </p>
        )}

        {block.type === "button" && (
          <span className="inline-flex rounded-lg bg-slate-950 px-5 py-3 text-xs font-bold text-white">
            {getSetting(
              settings,
              "text",
              "Button"
            )}
          </span>
        )}

        {block.type === "image" && (
          <MediaPlaceholder
            url={getSetting(settings, "imageUrl", "")}
            label="Image block"
          />
        )}

        {block.type === "video" && (
          <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-900 text-white">
            <Play size={20} />
          </div>
        )}

        {block.type === "feature" && (
          <div>
            <p className="font-bold">
              {getSetting(
                settings,
                "title",
                "Feature"
              )}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {getSetting(
                settings,
                "text",
                "Feature description"
              )}
            </p>
          </div>
        )}

        {block.type === "stat" && (
          <div>
            <p className="text-3xl font-black">
              {getSetting(settings, "value", "100%")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {getSetting(
                settings,
                "label",
                "Statistic"
              )}
            </p>
          </div>
        )}

        {block.type === "review" && (
          <div>
            <p className="text-sm tracking-widest">
              â˜…â˜…â˜…â˜…â˜…
            </p>
            <p className="mt-3 text-sm text-slate-600">
              {getSetting(
                settings,
                "text",
                "Customer review"
              )}
            </p>
            <p className="mt-3 text-xs font-bold">
              {getSetting(
                settings,
                "author",
                "Customer"
              )}
            </p>
          </div>
        )}

        {block.type === "faq" && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">
              {getSetting(
                settings,
                "question",
                "Frequently asked question"
              )}
            </span>
            <span>+</span>
          </div>
        )}
      </button>
    );
  })}
</div>

);
}

function MediaPlaceholder({
url,
label,
}: {
url: string;
label: string;
}) {
if (url) {
return (
<div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
<img src={url} alt="" className="h-full w-full object-cover" />
</div>
);
}

return (
<div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br from-stone-200 via-stone-100 to-stone-300">
<span className="text-xs font-bold text-slate-500">
{label}
</span>
</div>
);
}

function SelectionLabel({ accent }: { accent: string }) {
return (
<span
className="absolute right-3 top-3 z-30 rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow"
style={{ backgroundColor: accent }}
>
Editing
</span>
);
}

function StoreFooter({ store }: { store: StoreConfig }) {
return (
<footer className="bg-slate-950 px-7 py-12 text-white">
<div className="grid gap-8 sm:grid-cols-3">
<div>
<p className="font-black">
{store.name || "Your Store"}
</p>
<p className="mt-3 text-xs leading-6 text-slate-400">
{store.description ||
"Your store description appears here."}
</p>
</div>

    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Store
      </p>
      <div className="mt-3 space-y-2 text-xs text-slate-300">
        <p>Catalog</p>
        <p>Contact</p>
        <p>Shipping</p>
      </div>
    </div>

    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Customer care
      </p>
      <div className="mt-3 space-y-2 text-xs text-slate-300">
        <p>FAQ</p>
        <p>Refund policy</p>
        <p>Privacy</p>
      </div>
    </div>
  </div>
</footer>

);
}

