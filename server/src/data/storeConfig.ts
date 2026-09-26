import type { StoreConfig } from "../types/store";

const defaultSettings = {
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

export const storeConfig: StoreConfig = {
  id: "default-store",
  name: "My Store",
  description:
    "A professional ecommerce store.",
  logoUrl: null,
  faviconUrl: null,
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
    ...defaultSettings,
  },

  primaryColor: "#111827",
  accentColor: "#2563eb",
  fontFamily: "Inter",
};