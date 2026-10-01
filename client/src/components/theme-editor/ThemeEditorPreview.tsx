import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";

import type {
  StoreBlock,
  StoreConfig,
  StoreSection,
} from "../../types/store";

interface ThemeEditorPreviewProps {
  store: StoreConfig;
  sections: StoreSection[];
  selectedSectionId: string | null;
  selectedBlockId: string | null;
  device: "desktop" | "tablet" | "mobile";
  inspector: boolean;

  onSelectSection: (id: string) => void;
  onSelectBlock: (sectionId: string, blockId: string) => void;
}

export default function ThemeEditorPreview({
  store,
  sections,
  selectedSectionId,
  selectedBlockId,
  device,
  inspector,
  onSelectSection,
  onSelectBlock,
}: ThemeEditorPreviewProps) {
  const width =
    device === "mobile"
      ? "390px"
      : device === "tablet"
      ? "768px"
      : "100%";

  return (
    <div className="flex min-h-full justify-center">
      <div
        className="min-h-[900px] overflow-hidden bg-white shadow-2xl transition-all duration-300"
        style={{
          width,
          maxWidth: "100%",
        }}
      >
        <PreviewHeader store={store} />

        {sections
          .filter((section) => section.enabled)
          .map((section) => (
            <PreviewSection
              key={section.id}
              store={store}
              section={section}
              selected={selectedSectionId === section.id}
              selectedBlockId={
                selectedSectionId === section.id
                  ? selectedBlockId
                  : null
              }
              inspector={inspector}
              onSelectSection={() =>
                onSelectSection(section.id)
              }
              onSelectBlock={(blockId) =>
                onSelectBlock(section.id, blockId)
              }
            />
          ))}
      </div>
    </div>
  );
}

function PreviewHeader({ store }: { store: StoreConfig }) {
  return (
    <header
      className="sticky top-0 z-20 border-b bg-white/95 px-5 py-4 backdrop-blur"
      style={{
        color: store.primaryColor || "#111827",
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="font-black">
          {store.name || "Your Store"}
        </div>

        <nav className="hidden items-center gap-5 text-xs font-semibold sm:flex">
          {(store.navigation || []).map((item) => (
            <span key={item.id}>{item.label}</span>
          ))}
        </nav>

        <div className="h-9 w-9 rounded-full bg-slate-100" />
      </div>
    </header>
  );
}

function PreviewSection({
  store,
  section,
  selected,
  selectedBlockId,
  inspector,
  onSelectSection,
  onSelectBlock,
}: {
  store: StoreConfig;
  section: StoreSection;
  selected: boolean;
  selectedBlockId: string | null;
  inspector: boolean;
  onSelectSection: () => void;
  onSelectBlock: (id: string) => void;
}) {
  const accent = store.accentColor || "#2563eb";

  const outline = selected
    ? {
        outline: `2px solid ${accent}`,
        outlineOffset: "-2px",
      }
    : undefined;

  const settings = section.settings || {};

  if (section.type === "slideshow") {
    return (
      <SlideshowPreview
        section={section}
        selected={selected}
        selectedBlockId={selectedBlockId}
        onSelectSection={onSelectSection}
        onSelectBlock={onSelectBlock}
        accent={accent}
      />
    );
  }

  return (
    <div
      className="group relative cursor-pointer"
      style={outline}
      onClick={onSelectSection}
    >
      {selected && (
        <SelectionBadge
          label={section.label || formatLabel(section.type)}
          color={accent}
        />
      )}

      {section.type === "hero" && (
        <HeroPreview
          section={section}
          selectedBlockId={selectedBlockId}
          inspector={inspector}
          onSelectBlock={onSelectBlock}
          accent={accent}
        />
      )}

      {section.type === "featured-products" && (
        <ProductsPreview section={section} />
      )}

      {section.type === "collections" && (
        <CollectionsPreview section={section} />
      )}

      {section.type === "image-text" && (
        <ImageTextPreview section={section} />
      )}

      {section.type === "video" && (
        <VideoPreview section={section} />
      )}

      {section.type === "benefits" && (
        <BenefitsPreview section={section} />
      )}

      {section.type === "testimonials" && (
        <TestimonialsPreview section={section} />
      )}

      {section.type === "reviews" && (
        <TestimonialsPreview section={section} />
      )}

      {section.type === "faq" && (
        <FaqPreview section={section} />
      )}

      {section.type === "newsletter" && (
        <NewsletterPreview section={section} />
      )}

      {section.type === "trust-badges" && (
        <BenefitsPreview section={section} />
      )}

      {![
        "hero",
        "featured-products",
        "collections",
        "image-text",
        "video",
        "benefits",
        "testimonials",
        "reviews",
        "faq",
        "newsletter",
        "trust-badges",
      ].includes(section.type) && (
        <div className="px-6 py-16">
          <h2 className="text-3xl font-black">
            {String(
              settings.title ||
                settings.heading ||
                formatLabel(section.type)
            )}
          </h2>

          <p className="mt-3 max-w-2xl text-sm text-slate-500">
            {String(
              settings.text ||
                settings.subheading ||
                "Customize this section from the editor."
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function HeroPreview({
  section,
  selectedBlockId,
  inspector,
  onSelectBlock,
  accent,
}: {
  section: StoreSection;
  selectedBlockId: string | null;
  inspector: boolean;
  onSelectBlock: (id: string) => void;
  accent: string;
}) {
  const settings = section.settings || {};

  const blocks = section.blocks || [];

  return (
    <div className="grid min-h-[500px] items-center gap-8 bg-[#f5f2ed] p-8 sm:grid-cols-2 sm:p-12">
      <div>
        {blocks.map((block) => (
          <EditableBlock
            key={block.id}
            block={block}
            selected={selectedBlockId === block.id}
            inspector={inspector}
            accent={accent}
            onSelect={() => onSelectBlock(block.id)}
          />
        ))}

        {!blocks.length && (
          <>
            <h1 className="text-5xl font-black tracking-tight">
              {String(
                settings.heading ||
                  "Build a store customers remember"
              )}
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              {String(
                settings.subheading ||
                  "Create a beautiful ecommerce experience around your brand."
              )}
            </p>
          </>
        )}
      </div>

      <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-stone-200 via-stone-100 to-stone-300" />
    </div>
  );
}

function EditableBlock({
  block,
  selected,
  inspector,
  accent,
  onSelect,
}: {
  block: StoreBlock;
  selected: boolean;
  inspector: boolean;
  accent: string;
  onSelect: () => void;
}) {
  if (!block.enabled) return null;

  const settings = block.settings || {};

  const style = selected
    ? {
        outline: `2px solid ${accent}`,
        outlineOffset: "3px",
      }
    : undefined;

  if (block.type === "heading") {
    return (
      <div
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        style={style}
        className="cursor-pointer text-5xl font-black tracking-tight"
      >
        {String(settings.text || "Your headline")}

        {selected && inspector && (
          <BlockBadge label="Heading" />
        )}
      </div>
    );
  }

  if (block.type === "text" || block.type === "rich-text") {
    return (
      <div
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        style={style}
        className="mt-5 max-w-xl cursor-pointer text-base leading-7 text-slate-600"
      >
        {String(
          settings.text ||
            "Tell customers what makes your store different."
        )}

        {selected && inspector && (
          <BlockBadge label="Text" />
        )}
      </div>
    );
  }

  if (block.type === "button") {
    return (
      <div
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        style={style}
        className="mt-7 inline-flex cursor-pointer rounded-full bg-slate-950 px-7 py-3 text-xs font-bold text-white"
      >
        {String(settings.text || "Shop now")}

        {selected && inspector && (
          <BlockBadge label="Button" />
        )}
      </div>
    );
  }

  return null;
}

function ProductsPreview({
  section,
}: {
  section: StoreSection;
}) {
  return (
    <div className="px-6 py-16">
      <SectionHeading
        title={String(
          section.settings?.title || "Featured products"
        )}
      />

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item}>
            <div className="aspect-square rounded-2xl bg-slate-100" />
            <div className="mt-3 h-3 w-2/3 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CollectionsPreview({
  section,
}: {
  section: StoreSection;
}) {
  return (
    <div className="px-6 py-16">
      <SectionHeading
        title={String(
          section.settings?.title || "Shop by category"
        )}
      />

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="aspect-[4/5] rounded-2xl bg-slate-100 p-5"
          >
            <div className="h-full rounded-xl border border-white/70" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageTextPreview({
  section,
}: {
  section: StoreSection;
}) {
  return (
    <div className="grid items-center gap-10 bg-[#faf8f5] px-6 py-16 md:grid-cols-2">
      <div className="aspect-[4/3] rounded-3xl bg-stone-200" />

      <div>
        <h2 className="text-4xl font-black">
          {String(
            section.settings?.heading ||
              section.settings?.title ||
              "Built around your brand"
          )}
        </h2>

        <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600">
          {String(
            section.settings?.text ||
              section.settings?.subheading ||
              "Tell your customers your story."
          )}
        </p>
      </div>
    </div>
  );
}

function VideoPreview({
  section,
}: {
  section: StoreSection;
}) {
  return (
    <div className="bg-slate-950 px-6 py-16 text-white">
      <SectionHeading
        title={String(
          section.settings?.heading ||
            section.settings?.title ||
            "Watch our story"
        )}
        light
      />

      <div className="mx-auto mt-8 flex aspect-video max-w-4xl items-center justify-center rounded-3xl bg-slate-800">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-950">
          <Play size={20} fill="currentColor" />
        </div>
      </div>
    </div>
  );
}

function BenefitsPreview({
  section,
}: {
  section: StoreSection;
}) {
  return (
    <div className="border-y px-6 py-16">
      <SectionHeading
        title={String(
          section.settings?.title || "Why shop with us"
        )}
      />

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {["Secure checkout", "Fast delivery", "Support"].map(
          (item) => (
            <div
              key={item}
              className="rounded-2xl border p-6"
            >
              <div className="h-9 w-9 rounded-full bg-slate-100" />

              <h3 className="mt-5 font-bold">{item}</h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Your editable benefit description.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function TestimonialsPreview({
  section,
}: {
  section: StoreSection;
}) {
  return (
    <div className="bg-[#f6f2ed] px-6 py-16">
      <SectionHeading
        title={String(
          section.settings?.title ||
            section.settings?.heading ||
            "What customers say"
        )}
      />

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="rounded-2xl bg-white p-6 shadow-sm"
          >
            <div className="text-sm">★★★★★</div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Customer review content will appear here.
            </p>

            <p className="mt-5 text-xs font-bold">
              Customer
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqPreview({
  section,
}: {
  section: StoreSection;
}) {
  return (
    <div className="px-6 py-16">
      <SectionHeading
        title={String(
          section.settings?.title ||
            "Frequently asked questions"
        )}
      />

      <div className="mt-8 divide-y rounded-2xl border">
        {[
          "How fast is shipping?",
          "How do I track my order?",
          "What is your refund policy?",
        ].map((question) => (
          <div
            key={question}
            className="flex items-center justify-between px-5 py-5 text-sm font-semibold"
          >
            {question}
            <span>+</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsletterPreview({
  section,
}: {
  section: StoreSection;
}) {
  return (
    <div className="bg-slate-950 px-6 py-16 text-white">
      <SectionHeading
        title={String(
          section.settings?.title || "Stay in the loop"
        )}
        light
      />

      <div className="mx-auto mt-7 flex max-w-xl gap-2">
        <div className="h-12 flex-1 rounded-xl bg-white/10" />
        <div className="h-12 w-28 rounded-xl bg-white/20" />
      </div>
    </div>
  );
}

function SlideshowPreview({
  section,
  selected,
  selectedBlockId,
  onSelectSection,
  onSelectBlock,
  accent,
}: {
  section: StoreSection;
  selected: boolean;
  selectedBlockId: string | null;
  onSelectSection: () => void;
  onSelectBlock: (id: string) => void;
  accent: string;
}) {
  const blocks = section.blocks || [];

  const [active, setActive] = useState(0);

  const interval = section.slider?.interval || 5000;

  const autoplay = section.slider?.autoplay ?? false;

  const showArrows = section.slider?.showArrows ?? true;

  const showDots = section.slider?.showDots ?? true;

  const loop = section.slider?.loop ?? true;

  const pauseOnHover =
    section.slider?.pauseOnHover ?? true;

  const timer = useRef<number | null>(null);

  function next() {
    if (!blocks.length) return;

    setActive((current) => {
      if (current >= blocks.length - 1) {
        return loop ? 0 : current;
      }

      return current + 1;
    });
  }

  function previous() {
    if (!blocks.length) return;

    setActive((current) => {
      if (current <= 0) {
        return loop ? blocks.length - 1 : current;
      }

      return current - 1;
    });
  }

  useEffect(() => {
    if (!autoplay || blocks.length <= 1) return;

    timer.current = window.setInterval(next, interval);

    return () => {
      if (timer.current) {
        window.clearInterval(timer.current);
      }
    };
  }, [autoplay, interval, blocks.length, loop]);

  const slide = blocks[active];

  const settings = slide?.settings || {};

  return (
    <div
      className="relative cursor-pointer overflow-hidden bg-slate-900 text-white"
      style={
        selected
          ? {
              outline: `2px solid ${accent}`,
              outlineOffset: "-2px",
            }
          : undefined
      }
      onClick={onSelectSection}
      onMouseEnter={() => {
        if (pauseOnHover && timer.current) {
          window.clearInterval(timer.current);
        }
      }}
      onMouseLeave={() => {
        if (pauseOnHover && autoplay) {
          timer.current = window.setInterval(
            next,
            interval
          );
        }
      }}
    >
      {selected && (
        <SelectionBadge
          label="Slideshow"
          color={accent}
        />
      )}

      <div className="relative flex min-h-[500px] items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 px-8 py-20">
        <div className="relative z-10 max-w-2xl text-center">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              if (slide) {
                onSelectBlock(slide.id);
              }
            }}
            className={
              selectedBlockId === slide?.id
                ? "rounded-lg outline outline-2"
                : ""
            }
            style={
              selectedBlockId === slide?.id
                ? { outlineColor: accent }
                : undefined
            }
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              Your brand
            </p>

            <h2 className="mt-5 text-4xl font-black sm:text-6xl">
              {String(
                settings.heading ||
                  section.settings?.heading ||
                  "Your slideshow"
              )}
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/70">
              {String(
                settings.text ||
                  section.settings?.subheading ||
                  "Add images, text and calls to action."
              )}
            </p>

            <span className="mt-7 inline-flex rounded-full bg-white px-7 py-3 text-xs font-bold text-slate-950">
              {String(
                settings.buttonText || "Shop now"
              )}
            </span>
          </button>
        </div>

        {showArrows && blocks.length > 1 && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                previous();
              }}
              className="absolute left-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/20 backdrop-blur hover:bg-black/40"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                next();
              }}
              className="absolute right-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/20 backdrop-blur hover:bg-black/40"
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {showDots && blocks.length > 1 && (
          <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {blocks.map((block, index) => (
              <button
                key={block.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setActive(index);
                }}
                className={`h-2 rounded-full transition-all ${
                  index === active
                    ? "w-7 bg-white"
                    : "w-2 bg-white/40"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectionBadge({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <div
      className="absolute left-3 top-3 z-50 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg"
      style={{ backgroundColor: color }}
    >
      {label}
    </div>
  );
}

function BlockBadge({ label }: { label: string }) {
  return (
    <span className="ml-2 rounded bg-slate-950 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
      {label}
    </span>
  );
}

function SectionHeading({
  title,
  light = false,
}: {
  title: string;
  light?: boolean;
}) {
  return (
    <div>
      <h2
        className={`text-3xl font-black tracking-tight ${
          light ? "text-white" : "text-slate-950"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

function formatLabel(type: string) {
  return type
    .split("-")
    .map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}