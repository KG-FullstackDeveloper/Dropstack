import type {
StoreConfig,
StoreSection,
StoreTheme,
StoreThemeId,
} from "../types/store";

export const DEFAULT_THEME_SETTINGS = {
showRelatedProducts: true,
showContactPage: true,
showCatalogPage: true,
showCartPage: true,
showSearch: true,
showNewsletter: true,
showTestimonials: true,
showTrustBadges: true,
showAnnouncementBar: false,
stickyHeader: true,
darkMode: true,
};

const DEFAULT_HOME_SECTIONS: StoreSection[] = [
{
id: "announcement",
type: "announcement",
enabled: false,
settings: {
text: "Free shipping on selected orders",
},
},
{
id: "hero",
type: "hero",
enabled: true,
settings: {
layout: "standard",
heading: "Discover products you'll love",
subheading:
"A modern shopping experience built around your products.",
buttonText: "Shop now",
},
},
{
id: "featured-products",
type: "featured-products",
enabled: true,
settings: {
title: "Featured products",
limit: 8,
},
},
{
id: "category-cards",
type: "category-cards",
enabled: true,
settings: {
title: "Shop by category",
},
},
{
id: "benefits",
type: "benefits",
enabled: true,
settings: {
title: "Why shop with us",
},
},
{
id: "testimonials",
type: "testimonials",
enabled: true,
settings: {
title: "What customers say",
},
},
{
id: "trust-badges",
type: "trust-badges",
enabled: true,
settings: {
title: "Shop with confidence",
},
},
{
id: "newsletter",
type: "newsletter",
enabled: true,
settings: {
title: "Stay in the loop",
},
},
];

const DEFAULT_PRODUCT_SECTIONS: StoreSection[] = [
{
id: "product-gallery",
type: "product-gallery",
enabled: true,
settings: {
layout: "standard",
},
},
{
id: "product-info",
type: "product-info",
enabled: true,
settings: {
sticky: true,
},
},
{
id: "benefits",
type: "benefits",
enabled: true,
},
{
id: "related-products",
type: "related-products",
enabled: true,
},
];

const FASHION_HOME_SECTIONS: StoreSection[] = [
{
id: "announcement",
type: "announcement",
enabled: true,
settings: {
text: "New collection available now",
},
},
{
id: "hero",
type: "hero",
enabled: true,
settings: {
layout: "editorial",
heading: "Your style. Your statement.",
subheading:
"A refined storefront for fashion and lifestyle products.",
buttonText: "Explore collection",
},
},
{
id: "collections",
type: "collections",
enabled: true,
settings: {
title: "Featured collections",
},
},
{
id: "featured-products",
type: "featured-products",
enabled: true,
settings: {
title: "New arrivals",
limit: 8,
},
},
{
id: "image-text",
type: "image-text",
enabled: true,
settings: {
heading: "Designed around your brand",
},
},
{
id: "testimonials",
type: "testimonials",
enabled: true,
},
{
id: "newsletter",
type: "newsletter",
enabled: true,
},
];

const FASHION_PRODUCT_SECTIONS: StoreSection[] = [
{
id: "product-gallery",
type: "product-gallery",
enabled: true,
settings: {
layout: "large",
},
},
{
id: "product-info",
type: "product-info",
enabled: true,
settings: {
sticky: true,
},
},
{
id: "trust-badges",
type: "trust-badges",
enabled: true,
},
{
id: "image-text",
type: "image-text",
enabled: true,
},
{
id: "reviews",
type: "reviews",
enabled: true,
},
{
id: "related-products",
type: "related-products",
enabled: true,
},
];

const COMMERCE_HOME_SECTIONS: StoreSection[] = [
{
id: "announcement",
type: "announcement",
enabled: true,
settings: {
text: "Fast delivery available",
},
},
{
id: "hero",
type: "hero",
enabled: true,
settings: {
layout: "commerce",
heading: "Everything you need in one place",
subheading:
"A conversion-focused shopping experience.",
buttonText: "Shop products",
},
},
{
id: "category-cards",
type: "category-cards",
enabled: true,
},
{
id: "featured-products",
type: "featured-products",
enabled: true,
settings: {
title: "Popular products",
limit: 8,
},
},
{
id: "benefits",
type: "benefits",
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
];

const COMMERCE_PRODUCT_SECTIONS: StoreSection[] = [
{
id: "product-gallery",
type: "product-gallery",
enabled: true,
},
{
id: "product-info",
type: "product-info",
enabled: true,
},
{
id: "benefits",
type: "benefits",
enabled: true,
},
{
id: "shipping",
type: "shipping",
enabled: true,
},
{
id: "guarantee",
type: "guarantee",
enabled: true,
},
{
id: "faq",
type: "faq",
enabled: true,
},
{
id: "reviews",
type: "reviews",
enabled: true,
},
{
id: "related-products",
type: "related-products",
enabled: true,
},
];

const MINIMAL_HOME_SECTIONS: StoreSection[] = [
{
id: "hero",
type: "hero",
enabled: true,
settings: {
layout: "minimal",
heading: "Simple. Useful. Yours.",
subheading:
"A clean product-first storefront.",
buttonText: "Shop now",
},
},
{
id: "featured-products",
type: "featured-products",
enabled: true,
settings: {
title: "Products",
limit: 8,
},
},
{
id: "image-text",
type: "image-text",
enabled: true,
},
{
id: "newsletter",
type: "newsletter",
enabled: true,
},
];

const MINIMAL_PRODUCT_SECTIONS: StoreSection[] = [
{
id: "product-gallery",
type: "product-gallery",
enabled: true,
},
{
id: "product-info",
type: "product-info",
enabled: true,
},
{
id: "related-products",
type: "related-products",
enabled: true,
},
];

const MODERN_HOME_SECTIONS: StoreSection[] = [
{
id: "announcement",
type: "announcement",
enabled: true,
settings: {
text: "Welcome to our store",
},
},
{
id: "hero",
type: "hero",
enabled: true,
settings: {
layout: "modern",
heading: "Modern shopping, beautifully presented.",
subheading:
"A bold storefront designed around your products.",
buttonText: "Explore products",
},
},
{
id: "featured-products",
type: "featured-products",
enabled: true,
},
{
id: "video",
type: "video",
enabled: true,
},
{
id: "benefits",
type: "benefits",
enabled: true,
},
{
id: "testimonials",
type: "testimonials",
enabled: true,
},
{
id: "newsletter",
type: "newsletter",
enabled: true,
},
];

const MODERN_PRODUCT_SECTIONS: StoreSection[] = [
{
id: "product-gallery",
type: "product-gallery",
enabled: true,
},
{
id: "product-info",
type: "product-info",
enabled: true,
},
{
id: "benefits",
type: "benefits",
enabled: true,
},
{
id: "image-text",
type: "image-text",
enabled: true,
},
{
id: "reviews",
type: "reviews",
enabled: true,
},
{
id: "related-products",
type: "related-products",
enabled: true,
},
];

export const STORE_THEMES: StoreTheme[] = [
{
id: "meo-default",
name: "MEO Default",
description:
"A professional all-purpose ecommerce theme.",
category: "General",
settings: {
...DEFAULT_THEME_SETTINGS,
},
homeSections: DEFAULT_HOME_SECTIONS,
productSections: DEFAULT_PRODUCT_SECTIONS,
},
{
id: "fashion",
name: "Fashion",
description:
"An editorial storefront designed for fashion and lifestyle brands.",
category: "Fashion",
settings: {
...DEFAULT_THEME_SETTINGS,
showAnnouncementBar: true,
},
homeSections: FASHION_HOME_SECTIONS,
productSections: FASHION_PRODUCT_SECTIONS,
},
{
id: "commerce",
name: "Commerce",
description:
"A conversion-focused storefront designed for product-heavy stores.",
category: "Commerce",
settings: {
...DEFAULT_THEME_SETTINGS,
showAnnouncementBar: true,
},
homeSections: COMMERCE_HOME_SECTIONS,
productSections: COMMERCE_PRODUCT_SECTIONS,
},
{
id: "minimal",
name: "Minimal",
description:
"A clean product-first storefront with minimal distractions.",
category: "Minimal",
settings: {
...DEFAULT_THEME_SETTINGS,
showTestimonials: false,
showNewsletter: true,
showTrustBadges: false,
showAnnouncementBar: false,
},
homeSections: MINIMAL_HOME_SECTIONS,
productSections: MINIMAL_PRODUCT_SECTIONS,
},
{
id: "modern",
name: "Modern",
description:
"A bold contemporary storefront with large visual sections.",
category: "Modern",
settings: {
...DEFAULT_THEME_SETTINGS,
showAnnouncementBar: true,
},
homeSections: MODERN_HOME_SECTIONS,
productSections: MODERN_PRODUCT_SECTIONS,
},
];

export function getTheme(
themeId: StoreThemeId
): StoreTheme {
return (
STORE_THEMES.find(
(theme) => theme.id === themeId
) ?? STORE_THEMES[0]
);
}

export const DEFAULT_STORE_CONFIG: StoreConfig = {
id: "default-store",
name: "My Store",
description:
"A professional ecommerce store.",
slug: "my-store",
themeId: "meo-default",

navigation: [
{
label: "Home",
page: "home",
enabled: true,
},
{
label: "Catalog",
page: "catalog",
enabled: true,
},
{
label: "Contact",
page: "contact",
enabled: true,
},
{
label: "Cart",
page: "cart",
enabled: true,
},
],

settings: {
...DEFAULT_THEME_SETTINGS,
},

primaryColor: "#111827",
accentColor: "#2563eb",
fontFamily: "Inter",

homeSections: DEFAULT_HOME_SECTIONS.map(
(section) => ({
...section,
settings: section.settings
? { ...section.settings }
: undefined,
})
),

productSections: DEFAULT_PRODUCT_SECTIONS.map(
(section) => ({
...section,
settings: section.settings
? { ...section.settings }
: undefined,
})
),
};