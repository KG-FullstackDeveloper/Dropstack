import type { CSSProperties, ReactNode } from "react";
import type { StoreConfig, StoreSection } from "../../types/store";

interface StoreThemeLivePreviewProps {
store: StoreConfig;
sections: StoreSection[];
selectedSectionId: string | null;
onSelectSection: (id: string) => void;
}

export default function StoreThemeLivePreview({
store,
sections,
selectedSectionId,
onSelectSection,
}: StoreThemeLivePreviewProps) {
const primary = store.primaryColor || "#111827";
const accent = store.accentColor || "#2563eb";

return (
<div
className="mx-auto min-h-[760px] max-w-[1100px] overflow-hidden rounded-xl bg-white text-slate-950 shadow-xl"
style={{ fontFamily: store.fontFamily || "Inter" }}
>
{sections.map((section) => (
<PreviewSection
key={section.id}
section={section}
store={store}
primary={primary}
accent={accent}
selected={selectedSectionId === section.id}
onSelect={() => onSelectSection(section.id)}
/>
))}

  <button
    type="button"
    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    className="fixed bottom-5 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg"
    style={{ backgroundColor: primary }}
    aria-label="Scroll to top"
  >
    ↑
  </button>

  {sections.length === 0 && (
    <div className="flex min-h-[600px] items-center justify-center p-10 text-center">
      <div>
        <p className="text-lg font-bold">Your storefront is empty</p>
        <p className="mt-2 text-sm text-slate-500">
          Add a section from the editor.
        </p>
      </div>
    </div>
  )}
</div>

);
}

function PreviewSection({
section,
store,
primary,
accent,
selected,
onSelect,
}: {
section: StoreSection;
store: StoreConfig;
primary: string;
accent: string;
selected: boolean;
onSelect: () => void;
}) {
if (!section.enabled) return null;

const settings = section.settings || {};

const title = String(
settings.title || settings.heading || defaultTitle(section.type)
);

const text = String(
settings.text || settings.subheading || defaultText(section.type)
);

const selectedStyle: CSSProperties = selected
? {
outline: "2px solid " + accent,
outlineOffset: -2,
}
: {};

const sectionButton = (content: ReactNode, className: string = "") => (
<button
type="button"
onClick={onSelect}
className={
"group relative block w-full text-left transition " + className
}
style={selectedStyle}
>
{content}

  {selected && (
    <span
      className="absolute right-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow"
      style={{ backgroundColor: accent }}
    >
      Editing {section.type}
    </span>
  )}
</button>

);

if (section.type === "announcement") {
return sectionButton(
<div className="bg-slate-950 px-4 py-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-white">
{String(
settings.text ||
"Free shipping • Secure checkout • Easy support"
)}
</div>
);
}

if (section.type === "header") {
return sectionButton(
<header className="flex items-center justify-between border-b bg-white px-6 py-5 sm:px-10">
<div className="flex items-center gap-3">
<div
className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-black text-white"
style={{ backgroundColor: primary }}
>
{(store.name || "S").charAt(0).toUpperCase()}
</div>

      <span className="text-lg font-black">
        {store.name || "Your Store"}
      </span>
    </div>

    <nav className="hidden items-center gap-6 text-xs font-semibold text-slate-600 sm:flex">
      <span>Shop</span>
      <span>Collections</span>
      <span>About</span>
    </nav>

    <div className="flex items-center gap-2">
      <span className="rounded-full border px-3 py-2 text-xs font-semibold">
        Search
      </span>

      <span
        className="rounded-full px-3 py-2 text-xs font-semibold text-white"
        style={{ backgroundColor: primary }}
      >
        Cart
      </span>
    </div>
  </header>
);

}

if (section.type === "hero") {
return sectionButton(
<div className="grid min-h-[420px] items-center gap-8 bg-[#f6f2ed] p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
<div>
<p
className="text-xs font-bold uppercase tracking-[0.2em]"
style={{ color: accent }}
>
{store.name || "Your Store"}
</p>

      <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight sm:text-5xl">
        {String(
          settings.heading ||
            "A storefront built around your brand"
        )}
      </h1>

      <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
        {String(settings.subheading || text)}
      </p>

      <span
        className="mt-7 inline-flex rounded-full px-6 py-3 text-xs font-bold text-white"
        style={{ backgroundColor: primary }}
      >
        {String(settings.buttonText || "Shop now")}
      </span>
    </div>

    <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-stone-200 via-stone-100 to-stone-300" />
  </div>
);

}

if (section.type === "slideshow") {
return sectionButton(
<div className="relative min-h-[420px] overflow-hidden bg-slate-900">
<div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/70 to-transparent" />

    <div className="relative flex min-h-[420px] items-center px-8 py-14 sm:px-12 lg:px-16">
      <div className="max-w-xl text-white">
        <p
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          Featured
        </p>

        <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          {String(
            settings.heading ||
              "Showcase your products with a slideshow"
          )}
        </h2>

        <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300">
          {String(
            settings.subheading ||
              "Create multiple promotional slides and guide customers through your store."
          )}
        </p>

        <span
          className="mt-7 inline-flex rounded-full px-6 py-3 text-xs font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          {String(settings.buttonText || "Explore now")}
        </span>
      </div>
    </div>

    <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
      <span className="h-1.5 w-7 rounded-full bg-white" />
      <span className="h-1.5 w-2 rounded-full bg-white/40" />
      <span className="h-1.5 w-2 rounded-full bg-white/40" />
    </div>
  </div>
);

}

if (
section.type === "featured-products" ||
section.type === "related-products"
) {
return sectionButton(
<div className="bg-white px-6 py-14 sm:px-10">
<PreviewHeading title={title} text={text} />

    <div className="mt-9 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item}>
          <div className="aspect-square rounded-xl bg-slate-100" />
          <div className="mt-3 h-3 w-2/3 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  </div>
);

}

if (section.type === "benefits" || section.type === "trust-badges") {
return sectionButton(
<div className="border-y bg-white px-6 py-12 sm:px-10">
<PreviewHeading title={title} text={text} centered />

    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      {["Secure checkout", "Fast delivery", "Customer support"].map(
        (item) => (
          <div key={item} className="rounded-xl border p-5 text-center">
            <div className="mx-auto h-8 w-8 rounded-full bg-slate-100" />

            <p className="mt-4 text-sm font-bold">{item}</p>

            <p className="mt-1 text-xs text-slate-500">
              Your editable benefit text
            </p>
          </div>
        )
      )}
    </div>
  </div>
);

}

if (section.type === "image-text") {
return sectionButton(
<div className="grid items-center gap-8 bg-[#faf8f5] px-6 py-14 sm:px-10 lg:grid-cols-2">
<div className="aspect-[4/3] rounded-2xl bg-stone-200" />

    <div className="max-w-xl">
      <h2 className="text-3xl font-black">
        {String(settings.heading || title)}
      </h2>

      <p className="mt-4 text-sm leading-7 text-slate-600">
        {text}
      </p>
    </div>
  </div>
);

}

if (section.type === "video") {
return sectionButton(
<div className="bg-slate-950 px-6 py-14 text-white sm:px-10">
<PreviewHeading title={title} text={text} light centered />

    <div className="mx-auto mt-8 flex aspect-video max-w-4xl items-center justify-center rounded-2xl bg-slate-800">
      <span className="rounded-full bg-white/10 px-5 py-3 text-xs font-bold">
        Video / image block
      </span>
    </div>
  </div>
);

}

if (section.type === "how-it-works") {
return sectionButton(
<div className="bg-white px-6 py-14 sm:px-10">
<PreviewHeading title={title} text={text} centered />

    <div className="mt-9 grid gap-4 md:grid-cols-3">
      {[
        "Choose your product",
        "Complete checkout",
        "Receive your order",
      ].map((item, index) => (
        <div key={item} className="rounded-2xl bg-slate-50 p-6">
          <span className="text-xs font-black text-slate-400">
            0{index + 1}
          </span>

          <h3 className="mt-4 font-bold">{item}</h3>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Editable step description.
          </p>
        </div>
      ))}
    </div>
  </div>
);

}

if (section.type === "reviews" || section.type === "testimonials") {
return sectionButton(
<div className="bg-[#f6f2ed] px-6 py-14 sm:px-10">
<PreviewHeading title={title} text={text} centered />

    <div className="mt-9 grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="rounded-2xl bg-white p-6 shadow-sm"
        >
          <div className="text-sm tracking-widest">★★★★★</div>

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
);

}

if (section.type === "faq") {
return sectionButton(
<div className="bg-white px-6 py-14 sm:px-10">
<PreviewHeading title={title} text={text} />

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

if (section.type === "newsletter") {
return sectionButton(
<div className="bg-slate-950 px-6 py-14 text-white sm:px-10">
<PreviewHeading title={title} text={text} light centered />

    <div className="mx-auto mt-7 flex max-w-lg gap-2">
      <div className="h-11 flex-1 rounded-lg bg-white/10" />

      <div
        className="h-11 w-28 rounded-lg"
        style={{ backgroundColor: accent }}
      />
    </div>
  </div>
);

}

if (section.type === "footer") {
return sectionButton(
<footer className="bg-slate-950 px-6 py-12 text-white sm:px-10">
<div className="grid gap-8 md:grid-cols-4">
<div>
<p className="font-black">
{store.name || "Your Store"}
</p>

        <p className="mt-3 text-xs leading-5 text-slate-400">
          {text}
        </p>
      </div>

      {["Shop", "Customer Care", "Policies"].map((group) => (
        <div key={group}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {group}
          </p>

          <div className="mt-3 space-y-2 text-xs text-slate-300">
            <p>Editable link</p>
            <p>Editable link</p>
            <p>Editable link</p>
          </div>
        </div>
      ))}
    </div>
  </footer>
);

}

return sectionButton(
<div className="bg-white px-6 py-14 sm:px-10">
<PreviewHeading title={title} text={text} />
</div>
);
}

function PreviewHeading({
title,
text,
centered = false,
light = false,
}: {
title: string;
text: string;
centered?: boolean;
light?: boolean;
}) {
const headingClassName =
"text-3xl font-black tracking-tight " +
(light ? "text-white" : "text-slate-950");

const textClassName =
"mt-3 text-sm leading-6 " +
(light ? "text-slate-300" : "text-slate-500");

return (
<div
className={
centered
? "mx-auto max-w-2xl text-center"
: "max-w-2xl"
}
>
<h2 className={headingClassName}>{title}</h2>

  <p className={textClassName}>{text}</p>
</div>

);
}

function defaultTitle(type: StoreSection["type"]) {
const titles: Record<StoreSection["type"], string> = {
announcement: "Announcement",
header: "Store header",
hero: "Hero",
slideshow: "Slideshow",
"featured-products": "Featured products",
collections: "Featured collections",
"category-cards": "Shop by category",
"product-gallery": "Product gallery",
"product-info": "Product information",
benefits: "Why shop with us",
"how-it-works": "How it works",
"image-text": "Built around your brand",
video: "Watch our story",
testimonials: "What customers say",
reviews: "Customer reviews",
faq: "Frequently asked questions",
guarantee: "Our guarantee",
shipping: "Shipping information",
"trust-badges": "Shop with confidence",
newsletter: "Stay in the loop",
"related-products": "You may also like",
footer: "Customer care",
};

return titles[type];
}

function defaultText(type: StoreSection["type"]) {
const text: Record<StoreSection["type"], string> = {
announcement: "Important store information.",
header: "Your store navigation and branding.",
hero: "Introduce your brand and guide customers toward your products.",
slideshow:
"Showcase promotions, products, and important store messages.",
"featured-products": "Your real published products will appear here.",
collections: "Organize your products into collections.",
"category-cards": "Help customers discover products by category.",
"product-gallery": "Show your product media.",
"product-info": "Product details and purchasing information.",
benefits: "Explain why customers should shop with you.",
"how-it-works": "Explain the customer journey.",
"image-text": "Tell your brand story.",
video: "Add a video or image from the editor.",
testimonials: "Display customer experiences.",
reviews: "Display verified customer reviews.",
faq: "Answer common customer questions.",
guarantee: "Explain your guarantee.",
shipping: "Explain your delivery expectations.",
"trust-badges": "Reassure customers before checkout.",
newsletter: "Invite customers to stay connected.",
"related-products": "Show relevant products.",
footer: "Important store links and information.",
};

return text[type];
}