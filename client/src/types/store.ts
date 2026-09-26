export type StoreThemeId =
  | "meo-default"
  | "fashion"
  | "commerce"
  | "minimal"
  | "modern";

export type StorePageType =
  | "home"
  | "catalog"
  | "product"
  | "contact"
  | "about"
  | "faq"
  | "shipping"
  | "refund"
  | "privacy"
  | "terms"
  | "cart"
  | "checkout"
  | "order-success";

export type StoreSectionType =
  | "announcement"
  | "hero"
  | "featured-products"
  | "collections"
  | "category-cards"
  | "product-gallery"
  | "product-info"
  | "benefits"
  | "how-it-works"
  | "image-text"
  | "video"
  | "testimonials"
  | "reviews"
  | "faq"
  | "guarantee"
  | "shipping"
  | "trust-badges"
  | "newsletter"
  | "related-products"
  | "footer";

export type StoreBlockType =
  | "heading"
  | "text"
  | "button"
  | "image"
  | "video"
  | "feature"
  | "stat"
  | "review"
  | "faq";

export interface StoreBlock {
  id: string;
  type: StoreBlockType;
  enabled: boolean;
  settings?: Record<string, unknown>;
}

export interface StoreSection {
  id: string;
  type: StoreSectionType;
  enabled: boolean;
  settings?: Record<string, unknown>;
  blocks?: StoreBlock[];
}

export interface StoreNavigationItem {
  label: string;
  page: StorePageType;
  enabled: boolean;
}

export interface StoreThemeSettings {
  showRelatedProducts: boolean;
  showContactPage: boolean;
  showCatalogPage: boolean;
  showCartPage: boolean;
  showSearch: boolean;
  showNewsletter: boolean;
  showTestimonials: boolean;
  showTrustBadges: boolean;
  showAnnouncementBar: boolean;
  stickyHeader: boolean;
  darkMode: boolean;
}

export interface StoreTheme {
  id: StoreThemeId;
  name: string;
  description: string;
  category: string;
  settings: StoreThemeSettings;
  homeSections: StoreSection[];
  productSections: StoreSection[];
}

export interface StoreConfig {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  themeId: StoreThemeId;
  navigation: StoreNavigationItem[];
  settings: StoreThemeSettings;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  homeSections?: StoreSection[];
  productSections?: StoreSection[];
}
