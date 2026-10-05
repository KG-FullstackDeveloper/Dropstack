import type {
  StoreConfig,
  StoreSection,
  StoreTheme,
  StoreThemeId,
} from "../store";

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
    enabled: true,
    settings: {
      text: "Free shipping • Secure checkout • Easy support",
    },
  },
  {
    id: "hero",
    type: "hero",
    enabled: true,
    settings: {
      layout: "editorial",
      heading: "Designed to make your everyday better",
      subheading:
        "A conversion-focused storefront with room for your brand, products and story.",
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
    id: "benefits",
    type: "benefits",
    enabled: true,
    settings: {
      title: "Why customers choose us",
    },
  },
  {
    id: "image-text",
    type: "image-text",
    enabled: true,
    settings: {
      heading: "Built around your brand",
      text: "Tell customers what makes your products worth choosing.",
    },
  },
  {
    id: "how-it-works",
    type: "how-it-works",
    enabled: true,
    settings: {
      title: "How it works",
    },
  },
  {
    id: "guarantee",
    type: "guarantee",
    enabled: true,
    settings: {
      title: "Our guarantee",
    },
  },
  {
    id: "shipping",
    type: "shipping",
    enabled: true,
    settings: {
      title: "Shipping & delivery",
    },
  },
  {
    id: "reviews",
    type: "reviews",
    enabled: true,
    settings: {
      title: "Loved by our customers",
    },
  },
  {
    id: "faq",
    type: "faq",
    enabled: true,
    settings: {
      title: "Frequently asked questions",
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
  {
    id: "footer",
    type: "footer",
    enabled: true,
    settings: {
      text: "Important store links and customer information.",
    },
  },
];

const DEFAULT_PRODUCT_SECTIONS: StoreSection[] = [
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
    id: "benefits",
    type: "benefits",
    enabled: true,
    settings: {
      title: "Why you'll love it",
    },
  },
  {
    id: "how-it-works",
    type: "how-it-works",
    enabled: true,
    settings: {
      title: "How it works",
    },
  },
  {
    id: "guarantee",
    type: "guarantee",
    enabled: true,
    settings: {
      title: "Our guarantee",
    },
  },
  {
    id: "shipping",
    type: "shipping",
    enabled: true,
    settings: {
      title: "Shipping & delivery",
    },
  },
  {
    id: "image-text",
    type: "image-text",
    enabled: true,
    settings: {
      heading: "Designed around your customer",
      text: "Explain the product story, materials, use cases or benefits.",
    },
  },
  {
    id: "reviews",
    type: "reviews",
    enabled: true,
    settings: {
      title: "Loved by our customers",
    },
  },
  {
    id: "faq",
    type: "faq",
    enabled: true,
    settings: {
      title: "Frequently asked questions",
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
    id: "related-products",
    type: "related-products",
    enabled: true,
    settings: {
      title: "You may also like",
    },
  },
  {
    id: "footer",
    type: "footer",
    enabled: true,
    settings: {},
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
      subheading: "A refined storefront for fashion and lifestyle products.",
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
    settings: {},
  },
  {
    id: "newsletter",
    type: "newsletter",
    enabled: true,
    settings: {},
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
    settings: {},
  },
  {
    id: "image-text",
    type: "image-text",
    enabled: true,
    settings: {},
  },
  {
    id: "reviews",
    type: "reviews",
    enabled: true,
    settings: {},
  },
  {
    id: "related-products",
    type: "related-products",
    enabled: true,
    settings: {},
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
      subheading: "A conversion-focused shopping experience.",
      buttonText: "Shop products",
    },
  },
  {
    id: "category-cards",
    type: "category-cards",
    enabled: true,
    settings: {},
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
    settings: {},
  },
  {
    id: "trust-badges",
    type: "trust-badges",
    enabled: true,
    settings: {},
  },
  {
    id: "newsletter",
    type: "newsletter",
    enabled: true,
    settings: {},
  },
];

const COMMERCE_PRODUCT_SECTIONS: StoreSection[] = [
  {
    id: "product-gallery",
    type: "product-gallery",
    enabled: true,
    settings: {},
  },
  {
    id: "product-info",
    type: "product-info",
    enabled: true,
    settings: {},
  },
  {
    id: "benefits",
    type: "benefits",
    enabled: true,
    settings: {},
  },
  {
    id: "shipping",
    type: "shipping",
    enabled: true,
    settings: {},
  },
  {
    id: "guarantee",
    type: "guarantee",
    enabled: true,
    settings: {},
  },
  {
    id: "faq",
    type: "faq",
    enabled: true,
    settings: {},
  },
  {
    id: "reviews",
    type: "reviews",
    enabled: true,
    settings: {},
  },
  {
    id: "related-products",
    type: "related-products",
    enabled: true,
    settings: {},
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
      subheading: "A clean product-first storefront.",
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
    settings: {},
  },
  {
    id: "newsletter",
    type: "newsletter",
    enabled: true,
    settings: {},
  },
];

const MINIMAL_PRODUCT_SECTIONS: StoreSection[] = [
  {
    id: "product-gallery",
    type: "product-gallery",
    enabled: true,
    settings: {},
  },
  {
    id: "product-info",
    type: "product-info",
    enabled: true,
    settings: {},
  },
  {
    id: "related-products",
    type: "related-products",
    enabled: true,
    settings: {},
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
      subheading: "A bold storefront designed around your products.",
      buttonText: "Explore products",
    },
  },
  {
    id: "featured-products",
    type: "featured-products",
    enabled: true,
    settings: {},
  },
  {
    id: "video",
    type: "video",
    enabled: true,
    settings: {},
  },
  {
    id: "benefits",
    type: "benefits",
    enabled: true,
    settings: {},
  },
  {
    id: "testimonials",
    type: "testimonials",
    enabled: true,
    settings: {},
  },
  {
    id: "newsletter",
    type: "newsletter",
    enabled: true,
    settings: {},
  },
];

const MODERN_PRODUCT_SECTIONS: StoreSection[] = [
  {
    id: "product-gallery",
    type: "product-gallery",
    enabled: true,
    settings: {},
  },
  {
    id: "product-info",
    type: "product-info",
    enabled: true,
    settings: {},
  },
  {
    id: "benefits",
    type: "benefits",
    enabled: true,
    settings: {},
  },
  {
    id: "image-text",
    type: "image-text",
    enabled: true,
    settings: {},
  },
  {
    id: "reviews",
    type: "reviews",
    enabled: true,
    settings: {},
  },
  {
    id: "related-products",
    type: "related-products",
    enabled: true,
    settings: {},
  },
];

export const STORE_THEMES: StoreTheme[] = [
  {
    id: "meo-default",
    name: "MEO Default",
    description: "A professional all-purpose ecommerce theme.",
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
    description: "A clean product-first storefront with minimal distractions.",
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
    description: "A bold contemporary storefront with large visual sections.",
    category: "Modern",
    settings: {
      ...DEFAULT_THEME_SETTINGS,
      showAnnouncementBar: true,
    },
    homeSections: MODERN_HOME_SECTIONS,
    productSections: MODERN_PRODUCT_SECTIONS,
  },
];

export function getTheme(themeId: StoreThemeId): StoreTheme {
  return STORE_THEMES.find((theme) => theme.id === themeId) ?? STORE_THEMES[0];
}

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  id: "default-store",
  name: "My Store",
  description: "A professional ecommerce store.",
  slug: "my-store",
  themeId: "meo-default",

  navigation: [
    {
      id: "nav-home",
      label: "Home",
      href: "/",
      enabled: true,
    },
    {
      id: "nav-catalog",
      label: "Catalog",
      href: "/shop",
      enabled: true,
    },
    {
      id: "nav-contact",
      label: "Contact",
      href: "/contact",
      enabled: true,
    },
    {
      id: "nav-cart",
      label: "Cart",
      href: "/cart",
      enabled: true,
    },
  ],

  settings: {
    ...DEFAULT_THEME_SETTINGS,
  },

  primaryColor: "#111827",
  accentColor: "#2563eb",
  fontFamily: "Inter",

  homeSections: DEFAULT_HOME_SECTIONS.map((section) => ({
    ...section,
    settings: { ...section.settings },
  })),

  productSections: DEFAULT_PRODUCT_SECTIONS.map((section) => ({
    ...section,
    settings: { ...section.settings },
  })),
};
