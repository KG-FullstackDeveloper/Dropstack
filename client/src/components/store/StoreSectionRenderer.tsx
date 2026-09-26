import {
ArrowRight,
Check,
ChevronDown,
Play,
ShieldCheck,
Truck,
} from "lucide-react";

import type { Product } from "../../types/product";
import type {
StoreSection,
} from "../../types/store";

import StoreProductCard from "./StoreProductCard";

interface StoreSectionRendererProps {
sections?: StoreSection[];
products: Product[];
loading: boolean;
onProductClick: (product: Product) => void;
}

interface SectionProps {
section: StoreSection;
products: Product[];
loading: boolean;
onProductClick: (product: Product) => void;
}

function getSetting(
section: StoreSection,
key: string,
fallback: string,
): string {
const value = section.settings?.[key];

return typeof value === "string"
? value
: fallback;
}

function AnnouncementSection({
section,
}: SectionProps) {
const text = getSetting(
section,
"text",
"Free shipping on selected orders",
);

return (
<div className="bg-slate-950 px-4 py-3 text-center text-xs font-medium text-white sm:text-sm">
{text}
</div>
);
}

function HeroSection({
section,
products,
onProductClick,
}: SectionProps) {
const title = getSetting(
section,
"title",
"Discover products made for everyday life.",
);

const subtitle = getSetting(
section,
"subtitle",
"Explore carefully selected products with simple shopping and reliable delivery.",
);

const buttonText = getSetting(
section,
"buttonText",
"Shop now",
);

const featuredProduct =
products[0];

return (
<section className="relative overflow-hidden bg-slate-950 text-white">
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_35%)]" />

  <div className="relative mx-auto grid min-h-[560px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
        Shop confidently
      </p>

      <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        {title}
      </h1>

      <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
        {subtitle}
      </p>

      <button
        type="button"
        onClick={() =>
          featuredProduct &&
          onProductClick(
            featuredProduct,
          )
        }
        className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
      >
        {buttonText}

        <ArrowRight size={17} />
      </button>
    </div>

    <div className="relative">
      <div className="absolute -inset-10 rounded-full bg-white/5 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur">
        {featuredProduct?.image_url ? (
          <button
            type="button"
            onClick={() =>
              onProductClick(
                featuredProduct,
              )
            }
            className="block w-full overflow-hidden rounded-[1.5rem]"
          >
            <img
              src={
                featuredProduct.image_url
              }
              alt={
                featuredProduct.name
              }
              className="aspect-square w-full object-cover transition duration-700 hover:scale-105"
            />
          </button>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-[1.5rem] bg-white/10">
            <span className="text-sm text-slate-400">
              Store hero image
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
</section>

);
}

function FeaturedProductsSection({
section,
products,
loading,
onProductClick,
}: SectionProps) {
const title = getSetting(
section,
"title",
"Featured products",
);

const subtitle = getSetting(
section,
"subtitle",
"Explore some of our latest products.",
);

const limit = Number(
getSetting(section, "limit", "8"),
);

const featuredProducts =
products.slice(
0,
Number.isFinite(limit) &&
limit > 0
? limit
: 8,
);

return (
<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
<div className="mb-8 flex items-end justify-between gap-4">
<div>
<p className="text-sm font-medium text-slate-500">
Featured
</p>

      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        {subtitle}
      </p>
    </div>
  </div>

  {loading ? (
    <ProductSkeleton />
  ) : featuredProducts.length ===
    0 ? (
    <EmptyProducts />
  ) : (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {featuredProducts.map(
        (product) => (
          <StoreProductCard
            key={product.id}
            product={product}
            onClick={() =>
              onProductClick(
                product,
              )
            }
          />
        ),
      )}
    </div>
  )}
</section>

);
}

function CollectionsSection({
section: _section,
products,
onProductClick,
}: SectionProps) {
const categories =
Array.from(
new Set(
products
.map(
(product) =>
product.category,
)
.filter(Boolean),
),
).slice(0, 6);

return (
<section className="border-y border-slate-100 bg-slate-50">
<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
<div className="mb-8">
<p className="text-sm font-medium text-slate-500">
Collections
</p>

      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
        Shop by collection
      </h2>
    </div>

    {categories.length === 0 ? (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
        Collections will appear
        when products are added.
      </div>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(
          (category) => {
            const product =
              products.find(
                (item) =>
                  item.category ===
                  category,
              );

            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  product &&
                  onProductClick(
                    product,
                  )
                }
                className="group relative min-h-48 overflow-hidden rounded-3xl bg-slate-200 text-left"
              >
                {product?.image_url ? (
                  <img
                    src={
                      product.image_url
                    }
                    alt={category}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-200" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-lg font-semibold">
                    {category}
                  </p>

                  <span className="mt-2 inline-flex items-center gap-2 text-sm text-white/80">
                    Explore
                    <ArrowRight
                      size={15}
                    />
                  </span>
                </div>
              </button>
            );
          },
        )}
      </div>
    )}
  </div>
</section>

);
}

function CategoryCardsSection({
products,
onProductClick,
}: SectionProps) {
const categories =
Array.from(
new Set(
products
.map(
(product) =>
product.category,
)
.filter(Boolean),
),
).slice(0, 4);

return (
<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
{categories.map(
(category) => {
const product =
products.find(
(item) =>
item.category ===
category,
);

        return (
          <button
            key={category}
            type="button"
            onClick={() =>
              product &&
              onProductClick(
                product,
              )
            }
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-semibold text-slate-950">
              {category}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Explore products in
              this collection.
            </p>

            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
              Shop collection
              <ArrowRight
                size={15}
                className="transition group-hover:translate-x-1"
              />
            </span>
          </button>
        );
      },
    )}
  </div>
</section>

);
}

function ProductGallerySection({
section,
products,
onProductClick,
}: SectionProps) {
const limit = Number(
getSetting(section, "limit", "6"),
);

const galleryProducts =
products.slice(
0,
Number.isFinite(limit) &&
limit > 0
? limit
: 6,
);

return (
<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
<div className="mb-8">
<p className="text-sm font-medium text-slate-500">
Products
</p>

    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
      Product gallery
    </h2>
  </div>

  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
    {galleryProducts.map(
      (product) => (
        <button
          key={product.id}
          type="button"
          onClick={() =>
            onProductClick(product)
          }
          className="group overflow-hidden rounded-2xl bg-slate-100"
        >
          {product.image_url ? (
            <img
              src={
                product.image_url
              }
              alt={product.name}
              className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center text-xs text-slate-400">
              No image
            </div>
          )}
        </button>
      ),
    )}
  </div>
</section>

);
}

function BenefitsSection({
section: _section,
}: SectionProps) {
const items = [
{
icon: Truck,
title: "Reliable delivery",
text: "Clear delivery information is shown before you complete your order.",
},
{
icon: ShieldCheck,
title: "Secure shopping",
text: "Your checkout information is handled through secure payment infrastructure.",
},
{
icon: Check,
title: "Selected products",
text: "Products are selected and managed by the store.",
},
];

return (
<section className="border-y border-slate-100 bg-slate-50">
<div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
{items.map(
({
icon: Icon,
title,
text,
}) => (
<div key={title} className="rounded-3xl bg-white p-6 shadow-sm" >
<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
<Icon size={19} />
</div>

          <h3 className="mt-5 font-semibold text-slate-950">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {text}
          </p>
        </div>
      ),
    )}
  </div>
</section>

);
}

function HowItWorksSection(_props: SectionProps) {
const steps = [
{
number: "01",
title: "Choose your product",
text: "Browse the store and select the product you want.",
},
{
number: "02",
title: "Complete checkout",
text: "Provide your delivery details and complete checkout.",
},
{
number: "03",
title: "Receive your order",
text: "Your order is processed and shipped to the provided address.",
},
];

return (
<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
<div className="max-w-2xl">
<p className="text-sm font-medium text-slate-500">
Simple shopping
</p>

    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
      How it works
    </h2>
  </div>

  <div className="mt-10 grid gap-5 md:grid-cols-3">
    {steps.map((step) => (
      <div
        key={step.number}
        className="rounded-3xl border border-slate-200 bg-white p-7"
      >
        <span className="text-sm font-bold text-slate-400">
          {step.number}
        </span>

        <h3 className="mt-6 text-lg font-semibold text-slate-950">
          {step.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {step.text}
        </p>
      </div>
    ))}
  </div>
</section>

);
}

function ImageTextSection({
section,
products,
onProductClick,
}: SectionProps) {
const title = getSetting(
section,
"title",
"A better way to discover products.",
);

const text = getSetting(
section,
"text",
"Browse products, compare options and complete your order in a simple shopping experience.",
);

const product =
products[1] || products[0];

return (
<section className="bg-slate-950 text-white">
<div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
<div>
<p className="text-sm font-medium text-slate-400">
Designed for shoppers
</p>

      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>

      <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
        {text}
      </p>

      {product && (
        <button
          type="button"
          onClick={() =>
            onProductClick(product)
          }
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
        >
          Explore product
          <ArrowRight
            size={16}
          />
        </button>
      )}
    </div>

    <div className="overflow-hidden rounded-[2rem] bg-white/5 p-2">
      {product?.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="aspect-[4/3] w-full rounded-[1.5rem] object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-[1.5rem] bg-white/5 text-sm text-slate-500">
          Image
        </div>
      )}
    </div>
  </div>
</section>

);
}

function VideoSection(_props: SectionProps) {
return (
<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
<div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[2rem] bg-slate-950">
<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_45%)]" />

    <button
      type="button"
      className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-950 shadow-xl transition hover:scale-105"
      aria-label="Play video"
    >
      <Play
        size={22}
        fill="currentColor"
        className="ml-1"
      />
    </button>
  </div>
</section>

);
}

function TestimonialsSection(_props: SectionProps) {
const testimonials = [
{
text: "A clean shopping experience with useful product information.",
name: "Verified customer",
},
{
text: "The checkout process is straightforward and easy to follow.",
name: "Verified customer",
},
{
text: "Product information and delivery details are easy to find.",
name: "Verified customer",
},
];

return (
<section className="border-y border-slate-100 bg-slate-50">
<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
<div className="text-center">
<p className="text-sm font-medium text-slate-500">
Customer feedback
</p>

      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
        What shoppers say
      </h2>
    </div>

    <div className="mt-10 grid gap-5 md:grid-cols-3">
      {testimonials.map(
        (item, index) => (
          <div
            key={index}
            className="rounded-3xl bg-white p-7 shadow-sm"
          >
            <div className="flex gap-1 text-slate-950">
              {Array.from({
                length: 5,
              }).map(
                (_, starIndex) => (
                  <span
                    key={starIndex}
                    aria-hidden="true"
                  >
                    ★
                  </span>
                ),
              )}
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600">
              “{item.text}”
            </p>

            <p className="mt-5 text-sm font-semibold text-slate-950">
              {item.name}
            </p>
          </div>
        ),
      )}
    </div>
  </div>
</section>

);
}

function FAQSection(_props: SectionProps) {
const questions = [
{
question: "How long does delivery take?",
answer:
"Delivery time depends on the destination market and is shown during the shopping and checkout process.",
},
{
question: "Can I track my order?",
answer:
"Order tracking will be available once shipment tracking is assigned to your order.",
},
{
question: "What happens after I place an order?",
answer:
"Your order is received, payment is processed, and fulfillment begins after the required payment confirmation and settlement steps.",
},
];

return (
<section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
<div className="text-center">
<p className="text-sm font-medium text-slate-500">
FAQ
</p>

    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
      Frequently asked questions
    </h2>
  </div>

  <div className="mt-10 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white">
    {questions.map(
      (item, index) => (
        <details
          key={index}
          className="group p-6"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-sm font-semibold text-slate-950">
            {item.question}

            <ChevronDown
              size={18}
              className="shrink-0 transition group-open:rotate-180"
            />
          </summary>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">
            {item.answer}
          </p>
        </details>
      ),
    )}
  </div>
</section>

);
}

function GuaranteeSection(_props: SectionProps) {
return (
<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
<div className="rounded-[2rem] bg-slate-950 px-6 py-10 text-white sm:px-10">
<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
<div>
<p className="text-sm font-medium text-slate-400">
Shop with confidence
</p>

        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          Clear policies. Clear delivery information.
        </h2>
      </div>

      <ShieldCheck
        size={42}
        strokeWidth={1.5}
      />
    </div>
  </div>
</section>

);
}

function ShippingSection(_props: SectionProps) {
return (
<section className="border-y border-slate-100 bg-slate-50">
<div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
<div className="flex items-start gap-4">
<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
<Truck size={20} className="text-slate-950" />
</div>

      <div>
        <h2 className="font-semibold text-slate-950">
          Delivery information
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Delivery times depend on your
          destination and are shown
          throughout the shopping
          experience.
        </p>
      </div>
    </div>

    <span className="inline-flex w-fit rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
      Delivery details at checkout
    </span>
  </div>
</section>

);
}

function TrustBadgesSection(_props: SectionProps) {
const badges = [
"Secure checkout",
"Clear delivery information",
"Customer support",
"Transparent policies",
];

return (
<section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
{badges.map((badge) => (
<div key={badge} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-xs font-semibold text-slate-600" >
<Check size={15} />
{badge}
</div>
))}
</div>
</section>
);
}

function NewsletterSection(_props: SectionProps) {
const enabled = true;

if (!enabled) {
return null;
}

return (
<section className="bg-slate-100">
<div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
<p className="text-sm font-medium text-slate-500">
Stay updated
</p>

    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
      Get updates from the store
    </h2>

    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
      Subscribe for product updates,
      offers and important store
      announcements.
    </p>

    <form
      onSubmit={(event) =>
        event.preventDefault()
      }
      className="mx-auto mt-7 flex max-w-xl flex-col gap-3 sm:flex-row"
    >
      <input
        type="email"
        placeholder="Your email address"
        aria-label="Email address"
        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
      />

      <button
        type="submit"
        className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Subscribe
      </button>
    </form>
  </div>
</section>

);
}

function RelatedProductsSection({
products,
onProductClick,
}: SectionProps) {
const related =
products.slice(0, 4);

if (related.length === 0) {
return null;
}

return (
<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
<div className="mb-8 flex items-end justify-between gap-4">
<div>
<p className="text-sm font-medium text-slate-500">
You may also like
</p>

      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
        Related products
      </h2>
    </div>
  </div>

  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
    {related.map(
      (product) => (
        <StoreProductCard
          key={product.id}
          product={product}
          onClick={() =>
            onProductClick(
              product,
            )
          }
        />
      ),
    )}
  </div>
</section>

);
}

function FooterSection(_props: SectionProps) {
return (
<div className="border-t border-slate-200 bg-slate-950 px-4 py-12 text-center text-sm text-slate-400">
Store footer
</div>
);
}

function ProductSkeleton() {
return (
<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
{Array.from({
length: 8,
}).map((_, index) => (
<div key={index} className="overflow-hidden rounded-3xl border border-slate-200 bg-white" >
<div className="aspect-square animate-pulse bg-slate-100" />

      <div className="space-y-3 p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />

        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />

        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  ))}
</div>

);
}

function EmptyProducts() {
return (
<div className="rounded-3xl border border-dashed border-slate-300 px-6 py-20 text-center">
<h3 className="text-lg font-semibold text-slate-950">
No products yet
</h3>

  <p className="mt-2 text-sm text-slate-500">
    Products added to the store will
    appear here.
  </p>
</div>

);
}

export default function StoreSectionRenderer({
sections: providedSections,
products,
loading,
onProductClick,
}: StoreSectionRendererProps) {
const defaultSections: StoreSection[] = [
{
id: "announcement",
type: "announcement",
enabled: true,
},
{
id: "hero",
type: "hero",
enabled: true,
},
{
id: "featured-products",
type: "featured-products",
enabled: true,
},
{
id: "collections",
type: "collections",
enabled: true,
},
{
id: "category-cards",
type: "category-cards",
enabled: true,
},
{
id: "benefits",
type: "benefits",
enabled: true,
},
{
id: "how-it-works",
type: "how-it-works",
enabled: true,
},
{
id: "image-text",
type: "image-text",
enabled: true,
},
{
id: "video",
type: "video",
enabled: false,
},
{
id: "testimonials",
type: "testimonials",
enabled: true,
},
{
id: "faq",
type: "faq",
enabled: true,
},
{
id: "guarantee",
type: "guarantee",
enabled: true,
},
{
id: "shipping",
type: "shipping",
enabled: true,
},
{
id: "trust-badges",
type: "trust-badges",
enabled: true,
},
{
id: "newsletter",
type: "newsletter",
enabled: true,
},
{
id: "related-products",
type: "related-products",
enabled: true,
},
{
id: "footer",
type: "footer",
enabled: false,
},
];

const sections = providedSections ?? defaultSections;

return (
<>
{sections
.filter(
(section) =>
section.enabled,
)
.map((section) => {
switch (section.type) {
case "announcement":
return (
<AnnouncementSection
key={section.id}
section={section}
products={products}
loading={loading}
onProductClick={
onProductClick
}
/>
);

        case "hero":
          return (
            <HeroSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "featured-products":
          return (
            <FeaturedProductsSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "collections":
          return (
            <CollectionsSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "category-cards":
          return (
            <CategoryCardsSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "product-gallery":
          return (
            <ProductGallerySection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "benefits":
          return (
            <BenefitsSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "how-it-works":
          return (
            <HowItWorksSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "image-text":
          return (
            <ImageTextSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "video":
          return (
            <VideoSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "testimonials":
          return (
            <TestimonialsSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "faq":
          return (
            <FAQSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "guarantee":
          return (
            <GuaranteeSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "shipping":
          return (
            <ShippingSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "trust-badges":
          return (
            <TrustBadgesSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "newsletter":
          return (
            <NewsletterSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "related-products":
          return (
            <RelatedProductsSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        case "footer":
          return (
            <FooterSection
              key={section.id}
              section={section}
              products={products}
              loading={loading}
              onProductClick={
                onProductClick
              }
            />
          );

        default:
          return null;
      }
    })}
</>

);
}