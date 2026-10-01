import {
ArrowRight,
Check,
ChevronDown,
ShieldCheck,
Truck,
} from "lucide-react";

import type { Product } from "../../types/product";
import type { StoreConfig, StoreSection } from "../../types/store";
import StoreProductCard from "./StoreProductCard";

interface Props {
sections?: StoreSection[];
products: Product[];
loading: boolean;
onProductClick: (product: Product) => void;
store?: StoreConfig;
onAddToCart?: (product: Product) => void;
onSelectSection?: (id: string) => void;
}

const setting = (
section: StoreSection,
key: string,
fallback = ""
): string => {
const value = section.settings?.[key];

return value === undefined || value === null
? fallback
: String(value);
};

const blockSetting = (
block: NonNullable<StoreSection["blocks"]>[number],
key: string,
fallback = ""
): string => {
const value = block.settings?.[key];

return value === undefined || value === null
? fallback
: String(value);
};

export default function StoreSectionRenderer({
sections = [],
products,
loading,
onProductClick,
store,
onAddToCart,
onSelectSection,
}: Props) {
const themeId = store?.themeId ?? "fashion";

return (
<div
className={
themeId === "fashion"
? "bg-white text-neutral-950"
: "bg-white text-slate-950"
}
>
{sections
.filter((section) => section.enabled)
.map((section) => (
<div
key={section.id}
data-theme-section={section.id}
onClick={(event) => {
const target = event.target as HTMLElement;

          if (
            target.closest(
              "button,a,input,textarea,select"
            )
          ) {
            return;
          }

          onSelectSection?.(section.id);
        }}
      >
        <SectionView
          section={section}
          products={products}
          loading={loading}
          onProductClick={onProductClick}
          onAddToCart={onAddToCart}
          store={store}
        />
      </div>
    ))}
</div>

);
}

function SectionView({
section,
products,
loading,
onProductClick,
onAddToCart,
store,
}: Props & { section: StoreSection }) {
switch (section.type) {
case "announcement":
return <Announcement section={section} />;

case "header":
  return <Header section={section} store={store} />;

case "hero":
  return (
    <Hero
      section={section}
      products={products}
      onProductClick={onProductClick}
    />
  );

case "featured-products":
  return (
    <ProductsSection
      section={section}
      products={products}
      loading={loading}
      onProductClick={onProductClick}
      onAddToCart={onAddToCart}
    />
  );

case "related-products":
  return (
    <ProductsSection
      section={section}
      products={products.slice(1)}
      loading={loading}
      onProductClick={onProductClick}
      onAddToCart={onAddToCart}
    />
  );

case "benefits":
  return <Benefits section={section} />;

case "how-it-works":
  return <Steps section={section} />;

case "image-text":
  return <ImageText section={section} />;

case "video":
  return <VideoSection section={section} />;

case "testimonials":
case "reviews":
  return <Reviews section={section} />;

case "faq":
  return <FAQ section={section} />;

case "trust-badges":
  return <Trust section={section} />;

case "newsletter":
  return <Newsletter section={section} />;

case "collections":
case "category-cards":
  return (
    <Collections
      section={section}
      products={products}
    />
  );

case "guarantee":
  return (
    <SimpleStory
      section={section}
      icon={<ShieldCheck size={24} />}
    />
  );

case "shipping":
  return (
    <SimpleStory
      section={section}
      icon={<Truck size={24} />}
    />
  );

case "footer":
  return <SimpleStory section={section} />;

case "product-gallery":
  return (
    <ProductsSection
      section={section}
      products={products}
      loading={loading}
      onProductClick={onProductClick}
      onAddToCart={onAddToCart}
    />
  );

case "product-info":
  return <SimpleStory section={section} />;

default:
  return <SimpleStory section={section} />;

}
}

function Shell({
children,
className = "",
}: {
children: React.ReactNode;
className?: string;
}) {
return (
<section
className={"mx-auto max-w-7xl px-5 py-16 sm lg lg " + className}
>
{children}
</section>
);
}
function Header({
section,
store,
}: {
section: StoreSection;
store?: StoreConfig;
}) {
const logo =
setting(section, "logoUrl") ||
store?.logoUrl ||
"";

return (
<header className="border-b border-neutral-200 bg-white px-5 py-5">
<div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
<div className="flex items-center gap-3">
{logo ? (
<img
src={logo}
alt={store?.name || "Store"}
className="h-10 max-w-[180px] object-contain"
/>
) : (
<span className="text-xl font-black tracking-tight">
{store?.name || "Your Store"}
</span>
)}
</div>

    <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
      {(store?.navigation || []).map((item) => (
        <span key={item.id}>
          {item.label}
        </span>
      ))}
    </nav>

    <button
      type="button"
      className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold"
    >
      {setting(section, "buttonText", "Shop")}
    </button>
  </div>
</header>

);
}

function Heading({
section,
}: {
section: StoreSection;
}) {
const title = setting(
section,
"title",
setting(
section,
"heading",
"Section title"
)
);

const subtitle = setting(
section,
"subtitle",
setting(section, "text")
);

return (
<div className="max-w-2xl">
<h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
{title}
</h2>

  {subtitle && (
    <p className="mt-4 text-base leading-7 text-neutral-500">
      {subtitle}
    </p>
  )}
</div>

);
}

function Announcement({
section,
}: {
section: StoreSection;
}) {
return (
<div
className="px-4 py-3 text-center text-[11px] font-semibold tracking-[0.18em] text-white"
style={{
background: setting(
section,
"background",
"#111111"
),
}}
>
{setting(
section,
"text",
"FREE SHIPPING â€¢ SECURE CHECKOUT"
)}
</div>
);
}

function Hero({
section,
products,
onProductClick,
}: {
section: StoreSection;
products: Product[];
onProductClick: (product: Product) => void;
}) {
const product = products[0];

const image =
setting(section, "imageUrl") ||
product?.image_url ||
"";

return (
<section className="overflow-hidden bg-[#f5f1eb]">
<div className="grid min-h-[680px] lg:grid-cols-2">
<div className="flex items-center px-6 py-20 sm:px-10 lg:px-16 xl:px-24">
<div className="max-w-xl">
<p className="text-xs font-bold tracking-[0.22em] text-neutral-500">
{setting(
section,
"eyebrow",
"NEW SEASON"
)}
</p>

        <h1 className="mt-5 text-5xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
          {setting(
            section,
            "title",
            "Designed to make everyday feel exceptional."
          )}
        </h1>

        <p className="mt-7 max-w-lg text-base leading-7 text-neutral-600">
          {setting(
            section,
            "subtitle",
            "A premium storefront built around your products and your story."
          )}
        </p>

        <button
          type="button"
          onClick={() => {
            if (product) {
              onProductClick(product);
            }
          }}
          className="mt-9 inline-flex items-center gap-3 rounded-full bg-neutral-950 px-7 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5"
        >
          {setting(
            section,
            "buttonText",
            "Shop now"
          )}

          <ArrowRight size={16} />
        </button>
      </div>
    </div>

    <div className="min-h-[520px] bg-neutral-200">
      {image ? (
        <button
          type="button"
          onClick={() => {
            if (product) {
              onProductClick(product);
            }
          }}
          className="h-full w-full"
        >
          <img
            src={image}
            alt={
              product?.name ||
              "Store feature"
            }
            className="h-full w-full object-cover"
          />
        </button>
      ) : (
        <div className="flex h-full min-h-[520px] items-center justify-center text-sm text-neutral-500">
          Add a hero image in the theme editor
        </div>
      )}
    </div>
  </div>
</section>

);
}

function ProductsSection({
section,
products,
loading,
onProductClick,
onAddToCart,
}: {
section: StoreSection;
products: Product[];
loading: boolean;
onProductClick: (product: Product) => void;
onAddToCart?: (product: Product) => void;
}) {
const limit = Math.max(
1,
Number(
setting(section, "limit", "8")
) || 8
);

const items = products.slice(
0,
limit
);

return (
<Shell>
<Heading section={section} />

  {loading ? (
    <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
      {[1, 2, 3, 4].map((number) => (
        <div
          key={number}
          className="aspect-square animate-pulse bg-neutral-100"
        />
      ))}
    </div>
  ) : (
    <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {items.map((product) => (
        <div key={product.id}>
          <StoreProductCard
            product={product}
            onClick={() =>
              onProductClick(product)
            }
          />

          {onAddToCart && (
            <button
              type="button"
              onClick={() =>
                onAddToCart(product)
              }
              className="mt-3 w-full rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold transition hover:bg-neutral-950 hover:text-white"
            >
              Add to cart
            </button>
          )}
        </div>
      ))}
    </div>
  )}
</Shell>

);
}

function Benefits({
section,
}: {
section: StoreSection;
}) {
const blocks =
section.blocks?.filter(
(block) => block.enabled
) ?? [];

return (
<Shell className="border-y border-neutral-200 bg-white">
<Heading section={section} />

  <div className="mt-10 grid gap-0 md:grid-cols-3">
    {blocks.map((block, index) => (
      <div
        key={block.id}
        className={`border-neutral-200 p-7 ${
          index > 0
            ? "border-t md:border-l md:border-t-0"
            : ""
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <Check size={18} />
        </div>

        <h3 className="mt-5 font-semibold">
          {blockSetting(
            block,
            "title",
            "Benefit"
          )}
        </h3>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          {blockSetting(
            block,
            "text",
            "Explain why customers should choose your store."
          )}
        </p>
      </div>
    ))}
  </div>
</Shell>

);
}

function Steps({
section,
}: {
section: StoreSection;
}) {
const blocks =
section.blocks?.filter(
(block) => block.enabled
) ?? [];

return (
<Shell className="bg-[#f7f7f5]">
<Heading section={section} />

  <div className="mt-12 grid gap-8 md:grid-cols-3">
    {blocks.map((block) => (
      <div key={block.id}>
        <p className="text-xs font-bold tracking-[0.2em] text-neutral-400">
          {blockSetting(
            block,
            "number",
            "01"
          )}
        </p>

        <h3 className="mt-5 text-xl font-semibold">
          {blockSetting(
            block,
            "title",
            "Step"
          )}
        </h3>

        <p className="mt-3 text-sm leading-6 text-neutral-500">
          {blockSetting(
            block,
            "text",
            "Describe this step."
          )}
        </p>
      </div>
    ))}
  </div>
</Shell>

);
}

function ImageText({
section,
}: {
section: StoreSection;
}) {
const image = setting(
section,
"imageUrl"
);

const imageFirst =
setting(
section,
"imageSide",
"left"
) === "left";

const copy = (
<div className="flex items-center">
<div className="max-w-xl">
<h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
{setting(
section,
"heading",
"Tell your story."
)}
</h2>

    <p className="mt-6 text-base leading-8 text-neutral-600">
      {setting(
        section,
        "text",
        "Explain what makes your product different."
      )}
    </p>
  </div>
</div>

);

const visual = (
<div className="min-h-[460px] overflow-hidden bg-neutral-100">
{image ? (
<img src={image} alt="Store story" className="h-full w-full object-cover" />
) : (
<div className="flex h-full min-h-[460px] items-center justify-center text-sm text-neutral-400">
Add an image in the editor
</div>
)}
</div>
);

return (
<Shell>
<div className="grid gap-10 lg:grid-cols-2">
{imageFirst ? (
<>
{visual}
{copy}
</>
) : (
<>
{copy}
{visual}
</>
)}
</div>
</Shell>
);
}

function VideoSection({
section,
}: {
section: StoreSection;
}) {
const url = setting(
section,
"videoUrl"
);

return (
<Shell>
<Heading section={section} />

  <div className="mt-10 overflow-hidden rounded-3xl bg-neutral-950">
    {url ? (
      <video
        className="aspect-video w-full"
        src={url}
        controls
      />
    ) : (
      <div className="flex aspect-video items-center justify-center text-sm text-neutral-400">
        Add a video URL in the editor
      </div>
    )}
  </div>
</Shell>

);
}

function Reviews({
section,
}: {
section: StoreSection;
}) {
const blocks =
section.blocks?.filter(
(block) => block.enabled
) ?? [];

return (
<Shell>
<Heading section={section} />

  <div className="mt-10 grid gap-5 md:grid-cols-3">
    {blocks.map((block) => {
      const rating = Math.min(
        5,
        Math.max(
          0,
          Number(
            blockSetting(
              block,
              "rating",
              "5"
            )
          ) || 5
        )
      );

      return (
        <article
          key={block.id}
          className="border border-neutral-200 p-7"
        >
          <div className="text-sm tracking-widest">
            {"â˜…".repeat(rating)}
          </div>

          <p className="mt-5 text-base leading-7 text-neutral-700">
            â€œ
            {blockSetting(
              block,
              "quote",
              "Add a customer review."
            )}
            â€
          </p>

          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-neutral-400">
            {blockSetting(
              block,
              "name",
              "Verified customer"
            )}
          </p>
        </article>
      );
    })}
  </div>
</Shell>

);
}

function FAQ({
section,
}: {
section: StoreSection;
}) {
const blocks =
section.blocks?.filter(
(block) => block.enabled
) ?? [];

return (
<Shell>
<Heading section={section} />

  <div className="mt-10 max-w-4xl divide-y divide-neutral-200 border-y border-neutral-200">
    {blocks.map((block) => (
      <details
        key={block.id}
        className="group py-5"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
          {blockSetting(
            block,
            "question",
            "Question"
          )}

          <ChevronDown
            size={18}
            className="transition group-open:rotate-180"
          />
        </summary>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-500">
          {blockSetting(
            block,
            "answer",
            "Answer"
          )}
        </p>
      </details>
    ))}
  </div>
</Shell>

);
}

function Trust({
section,
}: {
section: StoreSection;
}) {
const items = [
"Secure payment",
"Tracked delivery",
"Customer support",
"Easy returns",
];

return (
<Shell className="border-y border-neutral-200">
<Heading section={section} />

  <div className="mt-8 flex flex-wrap gap-3">
    {items.map((item) => (
      <div
        key={item}
        className="rounded-full border border-neutral-200 px-5 py-3 text-xs font-semibold"
      >
        {item}
      </div>
    ))}
  </div>
</Shell>

);
}

function Newsletter({
section,
}: {
section: StoreSection;
}) {
return (
<Shell className="bg-neutral-950 text-white">
<div className="mx-auto max-w-2xl text-center">
<h2 className="text-4xl font-semibold tracking-[-0.04em]">
{setting(
section,
"title",
"Stay in the loop"
)}
</h2>

    <p className="mt-4 text-sm leading-7 text-neutral-300">
      {setting(
        section,
        "text",
        "Collect customer emails for launches and updates."
      )}
    </p>

    <form className="mx-auto mt-8 flex max-w-lg gap-2">
      <input
        className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm outline-none"
        placeholder="Email address"
        type="email"
      />

      <button
        type="submit"
        className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-950"
      >
        Subscribe
      </button>
    </form>
  </div>
</Shell>

);
}

function Collections({
products,
section,
}: {
products: Product[];
section: StoreSection;
}) {
const categories = Array.from(
new Set(
products
.map((product) => product.category)
.filter(Boolean)
)
).slice(0, 6);

return (
<Shell>
<Heading section={section} />

  <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
    {categories.map((category) => (
      <div
        key={category}
        className="group bg-neutral-100 p-7"
      >
        <div className="aspect-[4/3] bg-neutral-200" />

        <h3 className="mt-5 font-semibold">
          {category}
        </h3>
      </div>
    ))}
  </div>
</Shell>

);
}

function SimpleStory({
section,
icon,
}: {
section: StoreSection;
icon?: React.ReactNode;
}) {
return (
<Shell>
<div className="mx-auto max-w-3xl text-center">
{icon && (
<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
{icon}
</div>
)}

    <div
      className={
        icon ? "mt-6" : ""
      }
    >
      <Heading section={section} />
    </div>
  </div>
</Shell>

);
}




