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
  | "cart";

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

export interface StoreConfig {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  themeId: StoreThemeId;
  navigation: StoreNavigationItem[];
  settings: StoreThemeSettings;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
}