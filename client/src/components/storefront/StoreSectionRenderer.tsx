import type { Product } from "../../types/product";
import type {
StoreConfig,
StoreSection,
} from "../../types/store";
import StoreProductCard from "./StoreProductCard";

interface StoreSectionRendererProps {
section: StoreSection;
store: StoreConfig;
products: Product[];
loading: boolean;
onProductClick: (
product: Product
) => void;
}

export default function StoreSectionRenderer({
section,
store,
products,
loading,
onProductClick,
}: StoreSectionRendererProps) {
if (!section.enabled) {
return null;
}

const settings =
section.settings ?? {};

const heading =
String(
settings.heading ||
getDefaultHeading(
section.type
)
);

const description =
String(
settings.description ||
getDefaultDescription(
section.type
)
);

const background =
getBackground(
String(
settings.background ||
"default"
)
);

return (
<section
className={`${background} px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24`}
>
<div
className={`mx-auto ${settings.layout === "wide" ? "max-w-[1500px]" : "max-w-7xl"}`}
>
{section.type ===
"hero" && (
<HeroSection
heading={heading}
description={
description
}
store={store}
/>
)}

    {section.type ===
      "featured-products" && (
      <ProductSection
        heading={heading}
        description={
          description
        }
        products={products}
        loading={loading}
        onProductClick={
          onProductClick
        }
      />
    )}

    {section.type ===
      "related-products" && (
      <ProductSection
        heading={heading}
        description={
          description
        }
        products={products}
        loading={loading}
        onProductClick={
          onProductClick
        }
      />
    )}

    {section.type ===
      "collections" && (
      <CollectionSection
        heading={heading}
        description={
          description
        }
      />
    )}

    {section.type ===
      "category-cards" && (
      <CategorySection
        heading={heading}
        description={
          description
        }
        products={products}
      />
    )}

    {section.type ===
      "benefits" && (
      <BenefitsSection
        heading={heading}
        description={
          description
        }
      />
    )}

    {section.type ===
      "how-it-works" && (
      <HowItWorksSection
        heading={heading}
        description={
          description
        }
      />
    )}

    {section.type ===
      "image-text" && (
      <ImageTextSection
        heading={heading}
        description={
          description
        }
      />
    )}

    {(section.type ===
      "testimonials" ||
      section.type ===
        "reviews") && (
      <SimpleContentSection
        heading={heading}
        description={
          description
        }
      />
    )}

    {section.type ===
      "faq" && (
      <FaqSection
        heading={heading}
        description={
          description
        }
      />
    )}

    {section.type ===
      "shipping" && (
      <SimpleContentSection
        heading={heading}
        description={
          description
        }
      />
    )}

    {section.type ===
      "trust-badges" && (
      <TrustSection
        heading={heading}
        description={
          description
        }
      />
    )}

    {section.type ===
      "newsletter" && (
      <NewsletterSection
        heading={heading}
        description={
          description
        }
        accentColor={
          store.accentColor
        }
      />
    )}

    {section.type ===
      "guarantee" && (
      <SimpleContentSection
        heading={heading}
        description={
          description
        }
      />
    )}

    {section.type ===
      "announcement" && (
      <div className="text-center">
        <p className="text-sm font-bold">
          {heading}
        </p>

        <p className="mt-2 text-sm opacity-70">
          {description}
        </p>
      </div>
    )}

    {section.type ===
      "footer" && (
      <SimpleContentSection
        heading={heading}
        description={
          description
        }
      />
    )}
  </div>
</section>

);
}

function HeroSection({
heading,
description,
store,
}: {
heading: string;
description: string;
store: StoreConfig;
}) {
return (
<div className="grid items-center gap-12 lg:grid-cols-2">
<div>
<p
className="text-xs font-black uppercase tracking-[0.2em]"
style={{
color:
store.accentColor ||
"#2563eb",
}}
>
{store.name ||
"Your Store"}
</p>

    <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
      {heading}
    </h1>

    <p className="mt-6 max-w-xl text-base leading-7 text-slate-500 dark:text-slate-400 sm:text-lg">
      {description}
    </p>

    <button
      type="button"
      className="mt-8 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
      style={{
        backgroundColor:
          store.primaryColor ||
          "#111827",
      }}
    >
      Shop now
    </button>
  </div>

  <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 dark:from-slate-800 dark:via-slate-900 dark:to-slate-700">
    <div className="flex h-full items-center justify-center">
      <span className="text-sm font-semibold text-slate-400">
        Store hero image
      </span>
    </div>
  </div>
</div>

);
}

function ProductSection({
heading,
description,
products,
loading,
onProductClick,
}: {
heading: string;
description: string;
products: Product[];
loading: boolean;
onProductClick: (
product: Product
) => void;
}) {
return (
<div>
<SectionHeading
heading={heading}
description={
description
}
/>

  {loading ? (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map(
        (item) => (
          <div key={item}>
            <div className="aspect-square animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />

            <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />

            <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        )
      )}
    </div>
  ) : products.length === 0 ? (
    <div className="mt-10 rounded-2xl border border-dashed p-10 text-center dark:border-slate-800">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
        No products are currently
        published in this store.
      </p>
    </div>
  ) : (
    <div className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {products
        .slice(0, 8)
        .map((product) => (
          <StoreProductCard
            key={product.id}
            product={product}
            onClick={() =>
              onProductClick(
                product
              )
            }
          />
        ))}
    </div>
  )}
</div>

);
}

function CollectionSection({
heading,
description,
}: {
heading: string;
description: string;
}) {
return (
<div>
<SectionHeading
heading={heading}
description={
description
}
/>

  <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {[
      "Collection",
      "Collection",
      "Collection",
    ].map((label, index) => (
      <button
        key={index}
        type="button"
        className="group overflow-hidden rounded-2xl bg-slate-100 text-left dark:bg-slate-800"
      >
        <div className="aspect-[4/3] bg-slate-200 transition duration-500 group-hover:scale-[1.02] dark:bg-slate-700" />

        <div className="p-5">
          <p className="font-bold">
            {label}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Explore products
          </p>
        </div>
      </button>
    ))}
  </div>
</div>

);
}

function CategorySection({
heading,
description,
products,
}: {
heading: string;
description: string;
products: Product[];
}) {
const categories = Array.from(
new Set(
products
.map(
(product) =>
product.category
)
.filter(Boolean)
)
).slice(0, 8);

return (
<div>
<SectionHeading
heading={heading}
description={
description
}
/>

  {categories.length === 0 ? (
    <div className="mt-10 rounded-2xl border border-dashed p-10 text-center dark:border-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Categories will appear when
        products are published.
      </p>
    </div>
  ) : (
    <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
      {categories.map(
        (category) => (
          <button
            key={category}
            type="button"
            className="rounded-2xl bg-slate-100 p-6 text-left font-bold transition hover:-translate-y-1 dark:bg-slate-800"
          >
            {category}
          </button>
        )
      )}
    </div>
  )}
</div>

);
}

function BenefitsSection({
heading,
description,
}: {
heading: string;
description: string;
}) {
return (
<div>
<SectionHeading
heading={heading}
description={
description
}
/>

  <div className="mt-10 grid gap-5 md:grid-cols-3">
    {[
      "Quality products",
      "Secure checkout",
      "Reliable delivery",
    ].map((item) => (
      <div
        key={item}
        className="rounded-2xl border p-6 dark:border-slate-800"
      >
        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800" />

        <h3 className="mt-5 font-bold">
          {item}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Built to give customers a
          simple and confident shopping
          experience.
        </p>
      </div>
    ))}
  </div>
</div>

);
}

function HowItWorksSection({
heading,
description,
}: {
heading: string;
description: string;
}) {
return (
<div>
<SectionHeading
heading={heading}
description={
description
}
/>

  <div className="mt-10 grid gap-5 md:grid-cols-3">
    {[
      "Choose your products",
      "Complete checkout",
      "Receive your order",
    ].map((item, index) => (
      <div
        key={item}
        className="rounded-2xl bg-slate-50 p-7 dark:bg-slate-900"
      >
        <span className="text-sm font-black text-slate-400">
          {String(index + 1).padStart(
            2,
            "0"
          )}
        </span>

        <h3 className="mt-5 font-bold">
          {item}
        </h3>
      </div>
    ))}
  </div>
</div>

);
}

function ImageTextSection({
heading,
description,
}: {
heading: string;
description: string;
}) {
return (
<div className="grid items-center gap-10 lg:grid-cols-2">
<div className="aspect-[4/3] rounded-3xl bg-slate-100 dark:bg-slate-800" />

  <div>
    <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
      {heading}
    </h2>

    <p className="mt-5 max-w-xl text-base leading-7 text-slate-500 dark:text-slate-400">
      {description}
    </p>
  </div>
</div>

);
}

function SimpleContentSection({
heading,
description,
}: {
heading: string;
description: string;
}) {
return (
<div className="mx-auto max-w-3xl text-center">
<SectionHeading
heading={heading}
description={
description
}
/>
</div>
);
}

function FaqSection({
heading,
description,
}: {
heading: string;
description: string;
}) {
return (
<div className="mx-auto max-w-4xl">
<SectionHeading
heading={heading}
description={
description
}
/>

  <div className="mt-10 space-y-3">
    {[
      "How long does delivery take?",
      "How can I track my order?",
      "What payment methods are accepted?",
    ].map((question) => (
      <details
        key={question}
        className="rounded-xl border p-5 dark:border-slate-800"
      >
        <summary className="cursor-pointer font-semibold">
          {question}
        </summary>

        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Information about this
          question will appear here.
        </p>
      </details>
    ))}
  </div>
</div>

);
}

function TrustSection({
heading,
description,
}: {
heading: string;
description: string;
}) {
return (
<div>
<SectionHeading
heading={heading}
description={
description
}
/>

  <div className="mt-10 flex flex-wrap justify-center gap-3">
    {[
      "Secure checkout",
      "Protected payment",
      "Reliable delivery",
      "Customer support",
    ].map((item) => (
      <div
        key={item}
        className="rounded-full border px-5 py-3 text-sm font-semibold dark:border-slate-800"
      >
        {item}
      </div>
    ))}
  </div>
</div>

);
}

function NewsletterSection({
heading,
description,
accentColor,
}: {
heading: string;
description: string;
accentColor?: string;
}) {
return (
<div className="rounded-3xl bg-slate-100 p-8 text-center dark:bg-slate-900 sm:p-12">
<h2 className="text-3xl font-black">
{heading}
</h2>

  <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
    {description}
  </p>

  <div className="mx-auto mt-7 flex max-w-md flex-col gap-2 sm:flex-row">
    <input
      type="email"
      placeholder="Email address"
      className="min-w-0 flex-1 rounded-xl border bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
    />

    <button
      type="button"
      className="rounded-xl px-5 py-3 text-sm font-bold text-white"
      style={{
        backgroundColor:
          accentColor ||
          "#111827",
      }}
    >
      Subscribe
    </button>
  </div>
</div>

);
}

function SectionHeading({
heading,
description,
}: {
heading: string;
description: string;
}) {
return (
<div className="max-w-3xl">
<h2 className="text-3xl font-black tracking-tight sm:text-4xl">
{heading}
</h2>

  <p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-400">
    {description}
  </p>
</div>

);
}

function getBackground(
background: string
): string {
switch (background) {
case "muted":
return "bg-slate-50 dark";

case "dark":
  return "bg-slate-950 text-white";

case "accent":
  return "bg-slate-100 dark:bg-slate-800";

default:
  return "bg-white dark:bg-slate-950";

}
}

function getDefaultHeading(
type: StoreSection["type"]
): string {
const headings: Record<
StoreSection["type"],
string
> = {
announcement: "Important store update",
hero: "Build your brand around your products",
"featured-products": "Featured products",
collections: "Shop our collections",
"category-cards": "Explore categories",
"product-gallery": "Product gallery",
"product-info": "Product information",
benefits: "Why customers choose us",
"how-it-works": "How it works",
"image-text": "Designed around your customers",
video: "See it in action",
testimonials: "What customers are saying",
reviews: "Customer reviews",
faq: "Frequently asked questions",
guarantee: "Shop with confidence",
shipping: "Shipping information",
"trust-badges": "Shop with confidence",
newsletter: "Stay in the loop",
"related-products": "You may also like",
footer: "Everything customers need",
};

return headings[type];
}

function getDefaultDescription(
type: StoreSection["type"]
): string {
const descriptions: Record<
StoreSection["type"],
string
> = {
announcement:
"Important information for your customers.",
hero:
"Introduce your store and direct customers toward your products.",
"featured-products":
"Your published products will appear here.",
collections:
"Organize and showcase your product collections.",
"category-cards":
"Help customers discover products by category.",
"product-gallery":
"Showcase product images and media.",
"product-info":
"Present important product information.",
benefits:
"Communicate the reasons customers should shop with you.",
"how-it-works":
"Explain the shopping and delivery process.",
"image-text":
"Tell your brand story with image and text.",
video:
"Show your product or brand in action.",
testimonials:
"Display real customer testimonials.",
reviews:
"Display real product reviews.",
faq:
"Answer common customer questions.",
guarantee:
"Explain your customer guarantee.",
shipping:
"Explain your delivery expectations.",
"trust-badges":
"Reassure customers about shopping with your store.",
newsletter:
"Give customers an option to subscribe.",
"related-products":
"Show products related to what customers are viewing.",
footer:
"Important store links and customer information.",
};

return descriptions[type];
}