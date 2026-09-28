import type {
  StoreBlock,
  StoreBlockType,
  StoreConfig,
  StoreSection,
  StoreSectionType,
  StoreThemeSettings,
} from "../../types/store";

export type ThemeEditorDevice = "desktop" | "tablet" | "mobile";

export type ThemeEditorPanel =
  | "sections"
  | "theme-settings"
  | "section-settings"
  | "block-settings";

export interface ThemeEditorProps {
  store: StoreConfig;
  onChange: (store: StoreConfig) => void;
  onBack: () => void;
  onSave: (store: StoreConfig) => void;
  onPublish: (store: StoreConfig) => void;
}

export interface ThemeSectionDefinition {
  type: StoreSectionType;
  label: string;
  description: string;
  category: "layout" | "content" | "products" | "media" | "social" | "trust";
  defaultSettings: Record<string, unknown>;
  defaultBlocks?: StoreBlock[];
}

export interface ThemeBlockDefinition {
  type: StoreBlockType;
  label: string;
  description: string;
  defaultSettings: Record<string, unknown>;
}

export interface ThemeEditorHistory {
  past: StoreConfig[];
  future: StoreConfig[];
}

export const THEME_SECTION_DEFINITIONS: ThemeSectionDefinition[] = [
  {
    type: "announcement",
    label: "Announcement bar",
    description: "Promotional or important store message.",
    category: "layout",
    defaultSettings: {
      text: "Free shipping on orders over $50",
      backgroundColor: "#111827",
      textColor: "#ffffff",
      linkText: "",
      linkUrl: "",
      sticky: false,
    },
  },
  {
    type: "hero",
    label: "Hero banner",
    description: "Large visual introduction with text and call to action.",
    category: "content",
    defaultSettings: {
      heading: "Your brand starts here",
      subheading: "Create a storefront that makes your products stand out.",
      buttonText: "Shop now",
      buttonUrl: "/catalog",
      imageUrl: "",
      mobileImageUrl: "",
      overlay: true,
      overlayOpacity: 35,
      contentPosition: "left",
      contentWidth: "medium",
      minHeight: 520,
      textColor: "#ffffff",
      backgroundColor: "#111827",
    },
  },
  {
    type: "featured-products",
    label: "Featured products",
    description: "Show selected products in a product grid.",
    category: "products",
    defaultSettings: {
      title: "Featured products",
      text: "Discover our most popular products.",
      columns: 4,
      mobileColumns: 2,
      productsCount: 8,
      showPrice: true,
      showComparePrice: true,
      showAddToCart: true,
      imageRatio: "square",
    },
  },
  {
    type: "collections",
    label: "Collections",
    description: "Display collections customers can browse.",
    category: "products",
    defaultSettings: {
      title: "Shop our collections",
      text: "Explore products by collection.",
      columns: 4,
      mobileColumns: 2,
    },
  },
  {
    type: "category-cards",
    label: "Category cards",
    description: "Visual category navigation.",
    category: "products",
    defaultSettings: {
      title: "Shop by category",
      text: "",
      columns: 4,
      mobileColumns: 2,
    },
  },
  {
    type: "product-gallery",
    label: "Product gallery",
    description: "Product images with optional carousel controls.",
    category: "products",
    defaultSettings: {
      title: "Product gallery",
      columns: 4,
      mobileColumns: 2,
      imageRatio: "square",
      showArrows: true,
      showDots: true,
      autoplay: false,
      autoplayInterval: 4000,
      loop: true,
      slidesPerView: 4,
      gap: 16,
    },
  },
  {
    type: "product-info",
    label: "Product information",
    description: "Product title, price, description and purchasing controls.",
    category: "products",
    defaultSettings: {
      showTitle: true,
      showPrice: true,
      showComparePrice: true,
      showDescription: true,
      showQuantity: true,
      showAddToCart: true,
      showBuyNow: true,
      showVariantPicker: true,
      showTrustBadges: true,
    },
  },
  {
    type: "benefits",
    label: "Benefits",
    description: "Highlight your store's main benefits.",
    category: "trust",
    defaultSettings: {
      title: "Why shop with us",
      text: "",
      columns: 3,
      iconStyle: "circle",
    },
    defaultBlocks: [
      {
        id: "benefit-1",
        type: "feature",
        settings: {
          title: "Fast delivery",
          text: "Get your order delivered quickly.",
          icon: "truck",
        },
      },
      {
        id: "benefit-2",
        type: "feature",
        settings: {
          title: "Secure checkout",
          text: "Your checkout is protected.",
          icon: "shield",
        },
      },
      {
        id: "benefit-3",
        type: "feature",
        settings: {
          title: "Customer support",
          text: "We are here when you need us.",
          icon: "headphones",
        },
      },
    ],
  },
  {
    type: "how-it-works",
    label: "How it works",
    description: "Explain your customer journey.",
    category: "content",
    defaultSettings: {
      title: "How it works",
      text: "",
      columns: 3,
    },
    defaultBlocks: [
      {
        id: "step-1",
        type: "stat",
        settings: {
          number: "01",
          title: "Choose your product",
          text: "Find what you need.",
        },
      },
      {
        id: "step-2",
        type: "stat",
        settings: {
          number: "02",
          title: "Complete checkout",
          text: "Pay securely online.",
        },
      },
      {
        id: "step-3",
        type: "stat",
        settings: {
          number: "03",
          title: "Receive your order",
          text: "We deliver to your address.",
        },
      },
    ],
  },
  {
    type: "image-text",
    label: "Image with text",
    description: "Combine an image with editable content.",
    category: "content",
    defaultSettings: {
      heading: "Tell your brand story",
      text: "Use this section to explain what makes your store different.",
      imageUrl: "",
      imagePosition: "left",
      buttonText: "",
      buttonUrl: "",
      imageWidth: "50",
    },
  },
  {
    type: "video",
    label: "Video",
    description: "Add video with optional text overlay.",
    category: "media",
    defaultSettings: {
      videoUrl: "",
      posterUrl: "",
      heading: "",
      text: "",
      buttonText: "",
      buttonUrl: "",
      showTextOverlay: true,
      overlayColor: "#000000",
      overlayOpacity: 40,
      contentPosition: "center",
      autoplay: true,
      muted: true,
      loop: true,
      controls: false,
      playsInline: true,
    },
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Customer testimonials in cards or a slider.",
    category: "social",
    defaultSettings: {
      title: "What customers say",
      text: "",
      layout: "grid",
      columns: 3,
      showArrows: true,
      showDots: true,
      autoplay: true,
      autoplayInterval: 5000,
      loop: true,
    },
  },
  {
    type: "reviews",
    label: "Reviews",
    description: "Customer reviews and ratings.",
    category: "social",
    defaultSettings: {
      title: "Customer reviews",
      text: "",
      showRating: true,
      showArrows: true,
      showDots: true,
      autoplay: false,
      autoplayInterval: 5000,
      loop: true,
    },
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Frequently asked questions.",
    category: "content",
    defaultSettings: {
      title: "Frequently asked questions",
      text: "",
      allowMultipleOpen: false,
    },
    defaultBlocks: [
      {
        id: "faq-1",
        type: "faq",
        settings: {
          question: "How fast is shipping?",
          answer: "Shipping times depend on the customer's location and selected delivery method.",
        },
      },
      {
        id: "faq-2",
        type: "faq",
        settings: {
          question: "How do I track my order?",
          answer: "Tracking information will be provided when your order is shipped.",
        },
      },
    ],
  },
  {
    type: "guarantee",
    label: "Guarantee",
    description: "Highlight your store guarantee.",
    category: "trust",
    defaultSettings: {
      title: "Shop with confidence",
      text: "We are committed to providing a reliable shopping experience.",
      badgeText: "Our guarantee",
    },
  },
  {
    type: "shipping",
    label: "Shipping information",
    description: "Explain shipping and delivery.",
    category: "trust",
    defaultSettings: {
      title: "Shipping information",
      text: "Tell customers about your delivery options and timelines.",
    },
  },
  {
    type: "trust-badges",
    label: "Trust badges",
    description: "Security and checkout reassurance.",
    category: "trust",
    defaultSettings: {
      title: "Shop with confidence",
      text: "",
      columns: 4,
    },
  },
  {
    type: "newsletter",
    label: "Newsletter",
    description: "Collect customer email addresses.",
    category: "social",
    defaultSettings: {
      title: "Stay in the loop",
      text: "Sign up for product updates and special offers.",
      placeholder: "Enter your email",
      buttonText: "Subscribe",
      backgroundColor: "#111827",
      textColor: "#ffffff",
    },
  },
  {
    type: "related-products",
    label: "Related products",
    description: "Show products related to the current product.",
    category: "products",
    defaultSettings: {
      title: "You may also like",
      text: "",
      columns: 4,
      mobileColumns: 2,
      productsCount: 4,
    },
  },
  {
    type: "footer",
    label: "Footer",
    description: "Store navigation, policies and contact information.",
    category: "layout",
    defaultSettings: {
      showLogo: true,
      showDescription: true,
      showNavigation: true,
      showSocial: true,
      showPaymentIcons: true,
      copyrightText: "",
      backgroundColor: "#111827",
      textColor: "#ffffff",
    },
  },
];

export const THEME_BLOCK_DEFINITIONS: ThemeBlockDefinition[] = [
  {
    type: "heading",
    label: "Heading",
    description: "Add a heading.",
    defaultSettings: {
      text: "Heading",
      size: "large",
      alignment: "left",
    },
  },
  {
    type: "text",
    label: "Text",
    description: "Add paragraph text.",
    defaultSettings: {
      text: "Add your text here.",
      alignment: "left",
    },
  },
  {
    type: "button",
    label: "Button",
    description: "Add a call-to-action button.",
    defaultSettings: {
      text: "Shop now",
      url: "/catalog",
      style: "primary",
      alignment: "left",
    },
  },
  {
    type: "image",
    label: "Image",
    description: "Add an image.",
    defaultSettings: {
      imageUrl: "",
      alt: "",
      linkUrl: "",
      aspectRatio: "square",
    },
  },
  {
    type: "video",
    label: "Video",
    description: "Add a video.",
    defaultSettings: {
      videoUrl: "",
      posterUrl: "",
      autoplay: true,
      muted: true,
      loop: true,
      controls: false,
    },
  },
  {
    type: "feature",
    label: "Feature",
    description: "Add a benefit or feature.",
    defaultSettings: {
      title: "Feature",
      text: "Describe this feature.",
      icon: "star",
    },
  },
  {
    type: "stat",
    label: "Step / stat",
    description: "Add a numbered step or statistic.",
    defaultSettings: {
      number: "01",
      title: "Step title",
      text: "Describe this step.",
    },
  },
  {
    type: "review",
    label: "Review",
    description: "Add a customer review.",
    defaultSettings: {
      rating: 5,
      text: "Customer review.",
      name: "Customer",
      verified: true,
    },
  },
  {
    type: "faq",
    label: "FAQ item",
    description: "Add a frequently asked question.",
    defaultSettings: {
      question: "Your question",
      answer: "Your answer",
    },
  },
];

export function getThemeSectionDefinition(
  type: StoreSectionType
): ThemeSectionDefinition {
  return (
    THEME_SECTION_DEFINITIONS.find((definition) => definition.type === type) ||
    THEME_SECTION_DEFINITIONS[0]
  );
}

export function createThemeSection(
  type: StoreSectionType,
  index: number
): StoreSection {
  const definition = getThemeSectionDefinition(type);

  return {
    id: `${type}-${Date.now()}-${index}`,
    type,
    enabled: true,
    settings: { ...definition.defaultSettings },
    blocks: definition.defaultBlocks
      ? definition.defaultBlocks.map((block, blockIndex) => ({
          ...block,
          id: `${block.id}-${Date.now()}-${blockIndex}`,
          settings: { ...block.settings },
        }))
      : [],
  };
}

export function createThemeBlock(
  type: StoreBlockType,
  index: number
): StoreBlock {
  const definition =
    THEME_BLOCK_DEFINITIONS.find((item) => item.type === type) ||
    THEME_BLOCK_DEFINITIONS[0];

  return {
    id: `${type}-${Date.now()}-${index}`,
    type,
    settings: { ...definition.defaultSettings },
  };
}

export function getStoreThemeSettings(
  store: StoreConfig
): StoreThemeSettings {
  return store.settings;
}

export function getSectionSettings(
  section: StoreSection
): Record<string, unknown> {
  return (section.settings || {}) as Record<string, unknown>;
}

export function getBlockSettings(
  block: StoreBlock
): Record<string, unknown> {
  return (block.settings || {}) as Record<string, unknown>;
}