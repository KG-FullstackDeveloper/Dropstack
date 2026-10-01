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
category:
| "layout"
| "content"
| "products"
| "media"
| "social"
| "trust";
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

// Shared layout defaults.

const DEFAULT_LAYOUT_SETTINGS = {
width: "full",
maxWidth: 1200,
contentWidth: "medium",

paddingTop: 64,
paddingRight: 24,
paddingBottom: 64,
paddingLeft: 24,

marginTop: 0,
marginBottom: 0,

backgroundColor: "",
backgroundImage: "",

borderTop: false,
borderBottom: false,
borderColor: "#e5e7eb",
borderWidth: 1,

borderRadius: 0,

boxShadow: "none",

desktopVisible: true,
tabletVisible: true,
mobileVisible: true,
};

const DEFAULT_BLOCK_LAYOUT_SETTINGS = {
width: "auto",
maxWidth: "100%",

marginTop: 0,
marginRight: 0,
marginBottom: 0,
marginLeft: 0,

paddingTop: 0,
paddingRight: 0,
paddingBottom: 0,
paddingLeft: 0,

alignSelf: "auto",
horizontalAlign: "left",
verticalAlign: "center",

desktopVisible: true,
tabletVisible: true,
mobileVisible: true,
};

const DEFAULT_TYPOGRAPHY_SETTINGS = {
fontFamily: "inherit",
fontSize: 16,
mobileFontSize: 16,
fontWeight: 400,
lineHeight: 1.5,
letterSpacing: 0,
textTransform: "none",
color: "",
alignment: "left",
};

const DEFAULT_MEDIA_SETTINGS = {
imageUrl: "",
mobileImageUrl: "",
alt: "",
linkUrl: "",

aspectRatio: "auto",
objectFit: "cover",
objectPosition: "center",

width: "100%",
height: "auto",

borderRadius: 0,
borderWidth: 0,
borderColor: "#e5e7eb",

boxShadow: "none",

hoverEffect: "none",
hoverScale: 1,

overlayEnabled: false,
overlayColor: "#000000",
overlayOpacity: 0,
};

const DEFAULT_CAROUSEL_SETTINGS = {
layoutMode: "carousel",

showArrows: true,
showDots: true,

autoplay: false,
autoplayInterval: 4000,

loop: true,

draggable: true,
swipe: true,

pauseOnHover: false,

desktopSlides: 4,
tabletSlides: 3,
mobileSlides: 1,

gap: 16,

arrowStyle: "circle",
arrowPosition: "inside",

transition: "slide",
transitionDuration: 500,
};

const DEFAULT_MARQUEE_SETTINGS = {
marqueeEnabled: false,
marqueeDirection: "left",
marqueeSpeed: 40,
marqueeGap: 32,
marqueePauseOnHover: true,
};

// Section definitions.

export const THEME_SECTION_DEFINITIONS: ThemeSectionDefinition[] = [
{
type: "announcement",
label: "Announcement bar",
description: "Promotional or important store message.",
category: "layout",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  text: "50% OFF TODAY ONLY",
  linkText: "",
  linkUrl: "",

  backgroundColor: "#111111",
  textColor: "#ffffff",

  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.5,
  alignment: "center",

  sticky: false,

  ...DEFAULT_MARQUEE_SETTINGS,
},

},

{
type: "header",
label: "Header",
description: "Store navigation, logo, search and customer actions.",
category: "layout",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  logoUrl: "",
  logoWidth: 150,

  showSearch: true,
  showAccount: true,
  showCart: true,

  sticky: false,

  desktopMenuPosition: "center",
  mobileMenuEnabled: true,

  backgroundColor: "#ffffff",
  textColor: "#111111",

  borderBottom: true,
  borderColor: "#e5e7eb",
},

},

{
type: "hero",
label: "Hero banner",
description: "Large visual introduction with editable content blocks.",
category: "content",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  heading: "Your brand starts here",
  subheading:
    "Create a storefront that makes your products stand out.",
  buttonText: "Shop now",
  buttonUrl: "/catalog",

  imageUrl: "",
  mobileImageUrl: "",

  overlay: true,
  overlayOpacity: 35,
  overlayColor: "#000000",

  contentPosition: "left",
  contentVerticalPosition: "center",
  contentWidth: "medium",

  minHeight: 520,
  mobileMinHeight: 480,

  textColor: "#ffffff",
  backgroundColor: "#111827",

  horizontalAlign: "left",
  verticalAlign: "center",
},

defaultBlocks: [
  {
    id: "hero-eyebrow",
    type: "text",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      text: "NEW COLLECTION",

      fontSize: 12,
      mobileFontSize: 11,
      fontWeight: 700,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: "#ffffff",
      alignment: "left",
    },
  },
  {
    id: "hero-heading",
    type: "heading",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      text: "Your brand starts here",

      fontSize: 56,
      mobileFontSize: 36,
      fontWeight: 700,
      lineHeight: 1.05,
      letterSpacing: -1,
      color: "#ffffff",
      alignment: "left",

      maxWidth: 720,
    },
  },
  {
    id: "hero-text",
    type: "text",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      text: "Create a storefront that makes your products stand out.",

      fontSize: 18,
      mobileFontSize: 16,
      lineHeight: 1.6,
      color: "#ffffff",
      alignment: "left",

      maxWidth: 600,
    },
  },
  {
    id: "hero-button",
    type: "button",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      text: "Shop now",
      url: "/catalog",

      alignment: "left",

      style: "primary",
      size: "medium",

      backgroundColor: "#ffffff",
      textColor: "#111111",

      borderWidth: 0,
      borderColor: "#111111",
      borderRadius: 6,

      paddingTop: 14,
      paddingRight: 24,
      paddingBottom: 14,
      paddingLeft: 24,

      boxShadow: "none",

      hoverBackgroundColor: "#111111",
      hoverTextColor: "#ffffff",
      hoverEffect: "color",
    },
  },
  {
    id: "hero-image",
    type: "image",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_MEDIA_SETTINGS,
    },
  },
],

},

{
type: "featured-products",
label: "Featured products",
description: "Show selected products in a professional product grid.",
category: "products",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  title: "Featured products",
  text: "Discover our most popular products.",

  columns: 4,
  tabletColumns: 3,
  mobileColumns: 2,

  productsCount: 8,

  showPrice: true,
  showComparePrice: true,
  showAddToCart: true,
  showQuickView: false,

  imageRatio: "square",

  cardStyle: "standard",
  cardRadius: 0,

  ...DEFAULT_CAROUSEL_SETTINGS,
},

},

{
type: "collections",
label: "Collections",
description: "Display collections customers can browse.",
category: "products",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  title: "Shop our collections",
  text: "Explore products by collection.",

  columns: 4,
  tabletColumns: 3,
  mobileColumns: 2,

  imageRatio: "square",

  cardRadius: 0,
  showTitle: true,
  showText: true,
},

},

{
type: "category-cards",
label: "Category cards",
description: "Visual category navigation.",
category: "products",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  title: "Shop by category",
  text: "",

  columns: 4,
  tabletColumns: 3,
  mobileColumns: 2,

  imageRatio: "square",

  showOverlay: true,
  overlayOpacity: 30,

  cardRadius: 0,
},

},

{
type: "product-gallery",
label: "Product gallery",
description: "Product images with carousel, slider and marquee controls.",
category: "products",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  title: "Product gallery",

  columns: 4,
  tabletColumns: 3,
  mobileColumns: 2,

  imageRatio: "square",

  ...DEFAULT_CAROUSEL_SETTINGS,

  ...DEFAULT_MARQUEE_SETTINGS,
},

},

{
type: "product-info",
label: "Product information",
description: "Product title, price, description and purchasing controls.",
category: "products",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  showTitle: true,
  showPrice: true,
  showComparePrice: true,
  showDescription: true,
  showQuantity: true,
  showAddToCart: true,
  showBuyNow: true,
  showVariantPicker: true,
  showTrustBadges: true,

  titleAlignment: "left",
  contentWidth: "medium",

  sticky: false,
},

},

{
type: "benefits",
label: "Benefits",
description: "Highlight your store's main benefits.",
category: "trust",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  title: "Why shop with us",
  text: "",

  columns: 3,
  tabletColumns: 2,
  mobileColumns: 1,

  iconStyle: "circle",
  iconPosition: "top",

  textAlignment: "center",
},

defaultBlocks: [
  {
    id: "benefit-1",
    type: "feature",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      title: "Fast delivery",
      text: "Get your order delivered quickly.",
      icon: "truck",

      iconSize: 32,
      iconColor: "#111111",

      titleFontSize: 17,
      titleFontWeight: 600,

      textFontSize: 14,
      textColor: "#666666",

      alignment: "center",
    },
  },

  {
    id: "benefit-2",
    type: "feature",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      title: "Secure checkout",
      text: "Your checkout is protected.",
      icon: "shield",

      iconSize: 32,
      iconColor: "#111111",

      titleFontSize: 17,
      titleFontWeight: 600,

      textFontSize: 14,
      textColor: "#666666",

      alignment: "center",
    },
  },

  {
    id: "benefit-3",
    type: "feature",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      title: "Customer support",
      text: "We are here when you need us.",
      icon: "headphones",

      iconSize: 32,
      iconColor: "#111111",

      titleFontSize: 17,
      titleFontWeight: 600,

      textFontSize: 14,
      textColor: "#666666",

      alignment: "center",
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
...DEFAULT_LAYOUT_SETTINGS,

  title: "How it works",
  text: "",

  columns: 3,
  tabletColumns: 3,
  mobileColumns: 1,

  connectorLine: true,
  alignment: "center",
},

defaultBlocks: [
  {
    id: "step-1",
    type: "stat",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      number: "01",
      title: "Choose your product",
      text: "Find what you need.",

      numberFontSize: 42,
      numberFontWeight: 700,

      titleFontSize: 18,
      titleFontWeight: 600,

      textFontSize: 14,
      textColor: "#666666",

      alignment: "center",
    },
  },

  {
    id: "step-2",
    type: "stat",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      number: "02",
      title: "Complete checkout",
      text: "Pay securely online.",

      numberFontSize: 42,
      numberFontWeight: 700,

      titleFontSize: 18,
      titleFontWeight: 600,

      textFontSize: 14,
      textColor: "#666666",

      alignment: "center",
    },
  },

  {
    id: "step-3",
    type: "stat",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      number: "03",
      title: "Receive your order",
      text: "We deliver to your address.",

      numberFontSize: 42,
      numberFontWeight: 700,

      titleFontSize: 18,
      titleFontWeight: 600,

      textFontSize: 14,
      textColor: "#666666",

      alignment: "center",
    },
  },
],

},

{
type: "image-text",
label: "Image with text",
description: "Combine editable image and content blocks.",
category: "content",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  heading: "Tell your brand story",
  text: "Use this section to explain what makes your store different.",

  imageUrl: "",
  imagePosition: "left",
  imageWidth: "50",

  buttonText: "",
  buttonUrl: "",

  gap: 48,

  verticalAlignment: "center",
},

defaultBlocks: [
  {
    id: "image-text-image",
    type: "image",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_MEDIA_SETTINGS,

      width: "100%",
      aspectRatio: "square",
    },
  },

  {
    id: "image-text-heading",
    type: "heading",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      text: "Tell your brand story",

      fontSize: 38,
      mobileFontSize: 30,
      fontWeight: 700,
      lineHeight: 1.1,

      color: "#111111",
      alignment: "left",
    },
  },

  {
    id: "image-text-body",
    type: "text",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      text: "Use this section to explain what makes your store different.",

      fontSize: 16,
      mobileFontSize: 15,
      lineHeight: 1.7,

      color: "#555555",
      alignment: "left",
    },
  },

  {
    id: "image-text-button",
    type: "button",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      text: "Learn more",
      url: "/about",

      style: "primary",
      size: "medium",

      backgroundColor: "#111111",
      textColor: "#ffffff",

      borderRadius: 4,

      hoverBackgroundColor: "#333333",
      hoverTextColor: "#ffffff",
      hoverEffect: "color",
    },
  },
],

},

{
type: "video",
label: "Video",
description: "Add video with editable overlay content.",
category: "media",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

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

  minHeight: 500,
  mobileMinHeight: 420,
},

defaultBlocks: [
  {
    id: "video-heading",
    type: "heading",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      text: "Video heading",

      fontSize: 48,
      mobileFontSize: 32,
      fontWeight: 700,

      color: "#ffffff",
      alignment: "center",
    },
  },

  {
    id: "video-text",
    type: "text",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      text: "Tell your story through video.",

      fontSize: 17,
      mobileFontSize: 15,

      color: "#ffffff",
      alignment: "center",
    },
  },

  {
    id: "video-button",
    type: "button",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      text: "Shop now",
      url: "/catalog",

      style: "primary",

      backgroundColor: "#ffffff",
      textColor: "#111111",

      borderRadius: 4,

      hoverBackgroundColor: "#111111",
      hoverTextColor: "#ffffff",
    },
  },
],

},

{
type: "testimonials",
label: "Testimonials",
description: "Customer testimonials in cards or a slider.",
category: "social",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  title: "What customers say",
  text: "",

  layout: "grid",

  columns: 3,
  tabletColumns: 2,
  mobileColumns: 1,

  ...DEFAULT_CAROUSEL_SETTINGS,
},

defaultBlocks: [
  {
    id: "testimonial-1",
    type: "review",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      rating: 5,
      text: "Customer review.",
      name: "Customer",
      verified: true,

      imageUrl: "",

      alignment: "center",

      cardBackground: "#ffffff",
      cardPadding: 24,
      cardRadius: 8,
      cardShadow: "small",
    },
  },

  {
    id: "testimonial-2",
    type: "review",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      rating: 5,
      text: "Another customer review.",
      name: "Customer",
      verified: true,

      imageUrl: "",

      alignment: "center",

      cardBackground: "#ffffff",
      cardPadding: 24,
      cardRadius: 8,
      cardShadow: "small",
    },
  },

  {
    id: "testimonial-3",
    type: "review",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      rating: 5,
      text: "A third customer review.",
      name: "Customer",
      verified: true,

      imageUrl: "",

      alignment: "center",

      cardBackground: "#ffffff",
      cardPadding: 24,
      cardRadius: 8,
      cardShadow: "small",
    },
  },
],

},

{
type: "reviews",
label: "Reviews",
description: "Customer reviews and ratings.",
category: "social",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  title: "Customer reviews",
  text: "",

  showRating: true,

  ...DEFAULT_CAROUSEL_SETTINGS,
},

defaultBlocks: [
  {
    id: "review-1",
    type: "review",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      rating: 5,
      text: "Customer review.",
      name: "Customer",
      verified: true,

      imageUrl: "",

      alignment: "left",

      cardBackground: "#ffffff",
      cardPadding: 24,
      cardRadius: 8,
      cardShadow: "small",
    },
  },
],

},

{
type: "faq",
label: "FAQ",
description: "Frequently asked questions using editable blocks.",
category: "content",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  title: "Frequently asked questions",
  text: "",

  allowMultipleOpen: false,

  itemSpacing: 0,
  borderColor: "#e5e7eb",

  answerFontSize: 15,
  questionFontSize: 16,
},

defaultBlocks: [
  {
    id: "faq-1",
    type: "faq",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      question: "How fast is shipping?",
      answer:
        "Shipping times depend on the customer's location and selected delivery method.",

      questionFontSize: 16,
      questionFontWeight: 600,

      answerFontSize: 15,
      answerLineHeight: 1.6,

      paddingTop: 20,
      paddingBottom: 20,

      borderBottom: true,
    },
  },

  {
    id: "faq-2",
    type: "faq",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      question: "How do I track my order?",
      answer:
        "Tracking information will be provided when your order is shipped.",

      questionFontSize: 16,
      questionFontWeight: 600,

      answerFontSize: 15,
      answerLineHeight: 1.6,

      paddingTop: 20,
      paddingBottom: 20,

      borderBottom: true,
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
...DEFAULT_LAYOUT_SETTINGS,

  title: "Shop with confidence",

  text: "We are committed to providing a reliable shopping experience.",

  badgeText: "Our guarantee",

  alignment: "center",

  badgeStyle: "circle",
  badgeSize: 96,
},

defaultBlocks: [
  {
    id: "guarantee-heading",
    type: "heading",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      text: "Shop with confidence",

      fontSize: 36,
      mobileFontSize: 30,
      fontWeight: 700,

      alignment: "center",
    },
  },

  {
    id: "guarantee-text",
    type: "text",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      text:
        "We are committed to providing a reliable shopping experience.",

      fontSize: 16,
      mobileFontSize: 15,

      color: "#555555",
      alignment: "center",
    },
  },
],

},

{
type: "shipping",
label: "Shipping information",
description: "Explain shipping and delivery.",
category: "trust",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  title: "Shipping information",

  text:
    "Tell customers about your delivery options and timelines.",

  alignment: "left",

  showIcon: true,
  icon: "truck",
},

defaultBlocks: [
  {
    id: "shipping-heading",
    type: "heading",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      text: "Shipping information",

      fontSize: 32,
      mobileFontSize: 28,
      fontWeight: 700,

      alignment: "left",
    },
  },

  {
    id: "shipping-text",
    type: "text",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      text:
        "Tell customers about your delivery options and timelines.",

      fontSize: 16,
      mobileFontSize: 15,

      color: "#555555",
      alignment: "left",
    },
  },
],

},

{
type: "trust-badges",
label: "Trust badges",
description: "Security and checkout reassurance.",
category: "trust",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  title: "Shop with confidence",
  text: "",

  columns: 4,
  tabletColumns: 2,
  mobileColumns: 2,

  iconSize: 32,
  alignment: "center",
},

defaultBlocks: [
  {
    id: "trust-1",
    type: "feature",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      title: "Secure checkout",
      text: "Protected payment processing.",
      icon: "shield",

      alignment: "center",
    },
  },

  {
    id: "trust-2",
    type: "feature",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      title: "Fast shipping",
      text: "Reliable delivery options.",
      icon: "truck",

      alignment: "center",
    },
  },

  {
    id: "trust-3",
    type: "feature",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      title: "Quality support",
      text: "Customer support when needed.",
      icon: "headphones",

      alignment: "center",
    },
  },

  {
    id: "trust-4",
    type: "feature",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,

      title: "Shop confidently",
      text: "A shopping experience you can trust.",
      icon: "star",

      alignment: "center",
    },
  },
],

},

{
type: "newsletter",
label: "Newsletter",
description: "Collect customer email addresses.",
category: "social",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  title: "Stay in the loop",

  text:
    "Sign up for product updates and special offers.",

  placeholder: "Enter your email",
  buttonText: "Subscribe",

  backgroundColor: "#111827",
  textColor: "#ffffff",

  alignment: "center",

  formWidth: 520,
},

defaultBlocks: [
  {
    id: "newsletter-heading",
    type: "heading",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      text: "Stay in the loop",

      fontSize: 34,
      mobileFontSize: 28,
      fontWeight: 700,

      color: "#ffffff",
      alignment: "center",
    },
  },

  {
    id: "newsletter-text",
    type: "text",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      text:
        "Sign up for product updates and special offers.",

      fontSize: 16,
      mobileFontSize: 15,

      color: "#ffffff",
      alignment: "center",
    },
  },
],

},

{
type: "related-products",
label: "Related products",
description: "Show products related to the current product.",
category: "products",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  title: "You may also like",
  text: "",

  columns: 4,
  tabletColumns: 3,
  mobileColumns: 2,

  productsCount: 4,

  showPrice: true,
  showComparePrice: true,
  showAddToCart: true,

  imageRatio: "square",
},

},

{
type: "footer",
label: "Footer",
description: "Store navigation, policies and contact information.",
category: "layout",
defaultSettings: {
...DEFAULT_LAYOUT_SETTINGS,

  showLogo: true,
  showDescription: true,
  showNavigation: true,
  showSocial: true,
  showPaymentIcons: true,

  copyrightText: "",

  backgroundColor: "#111827",
  textColor: "#ffffff",

  columns: 4,
  mobileColumns: 1,
},

defaultBlocks: [
  {
    id: "footer-description",
    type: "text",
    enabled: true,
    settings: {
      ...DEFAULT_BLOCK_LAYOUT_SETTINGS,
      ...DEFAULT_TYPOGRAPHY_SETTINGS,

      text:
        "Your store description goes here.",

      fontSize: 14,
      mobileFontSize: 14,

      color: "#d1d5db",
      alignment: "left",
    },
  },
],

},
];

// Block definitions.

export const THEME_BLOCK_DEFINITIONS: ThemeBlockDefinition[] = [
{
type: "heading",
label: "Heading",
description: "Add a fully editable heading.",
defaultSettings: {
...DEFAULT_BLOCK_LAYOUT_SETTINGS,
...DEFAULT_TYPOGRAPHY_SETTINGS,

  text: "Heading",

  fontSize: 36,
  mobileFontSize: 28,
  fontWeight: 700,
  lineHeight: 1.1,

  color: "#111111",
  alignment: "left",

  maxWidth: 1000,
},

},

{
type: "text",
label: "Text",
description: "Add editable paragraph text.",
defaultSettings: {
...DEFAULT_BLOCK_LAYOUT_SETTINGS,
...DEFAULT_TYPOGRAPHY_SETTINGS,

  text: "Add your text here.",

  fontSize: 16,
  mobileFontSize: 15,
  fontWeight: 400,
  lineHeight: 1.6,

  color: "#555555",
  alignment: "left",

  maxWidth: 800,
},

},

{
type: "button",
label: "Button",
description: "Add a fully customizable call-to-action button.",
defaultSettings: {
...DEFAULT_BLOCK_LAYOUT_SETTINGS,

  text: "Shop now",
  url: "/catalog",

  style: "primary",
  size: "medium",

  alignment: "left",

  backgroundColor: "#111111",
  textColor: "#ffffff",

  fontSize: 14,
  fontWeight: 600,

  borderWidth: 0,
  borderColor: "#111111",
  borderRadius: 4,

  paddingTop: 13,
  paddingRight: 24,
  paddingBottom: 13,
  paddingLeft: 24,

  boxShadow: "none",

  hoverBackgroundColor: "#333333",
  hoverTextColor: "#ffffff",

  hoverEffect: "color",

  width: "auto",
},

},

{
type: "image",
label: "Image",
description: "Add an image with picker, sizing, hover and shadow controls.",
defaultSettings: {
...DEFAULT_BLOCK_LAYOUT_SETTINGS,
...DEFAULT_MEDIA_SETTINGS,

  width: "100%",
  maxWidth: "100%",

  aspectRatio: "square",

  objectFit: "cover",
  objectPosition: "center",

  borderRadius: 0,

  borderWidth: 0,
  borderColor: "#e5e7eb",

  boxShadow: "none",

  hoverEffect: "none",
  hoverScale: 1,

  overlayEnabled: false,
  overlayColor: "#000000",
  overlayOpacity: 0,
},

},

{
type: "video",
label: "Video",
description: "Add an editable video block.",
defaultSettings: {
...DEFAULT_BLOCK_LAYOUT_SETTINGS,

  videoUrl: "",
  posterUrl: "",

  width: "100%",
  height: "auto",

  aspectRatio: "16/9",
  objectFit: "cover",

  borderRadius: 0,

  autoplay: true,
  muted: true,
  loop: true,
  controls: false,
  playsInline: true,

  hoverEffect: "none",
},

},

{
type: "feature",
label: "Feature",
description: "Add a benefit or feature card.",
defaultSettings: {
...DEFAULT_BLOCK_LAYOUT_SETTINGS,

  title: "Feature",
  text: "Describe this feature.",
  icon: "star",

  iconSize: 32,
  iconColor: "#111111",

  titleFontSize: 17,
  titleFontWeight: 600,

  textFontSize: 14,
  textColor: "#666666",

  alignment: "center",

  backgroundColor: "",
  padding: 0,
  borderRadius: 0,
  boxShadow: "none",
},

},

{
type: "stat",
label: "Step / stat",
description: "Add a numbered step or statistic.",
defaultSettings: {
...DEFAULT_BLOCK_LAYOUT_SETTINGS,

  number: "01",
  title: "Step title",
  text: "Describe this step.",

  numberFontSize: 42,
  numberFontWeight: 700,

  titleFontSize: 18,
  titleFontWeight: 600,

  textFontSize: 14,
  textColor: "#666666",

  alignment: "center",
},

},

{
type: "review",
label: "Review",
description: "Add a customer review card.",
defaultSettings: {
...DEFAULT_BLOCK_LAYOUT_SETTINGS,

  rating: 5,
  text: "Customer review.",
  name: "Customer",
  verified: true,

  imageUrl: "",

  alignment: "left",

  cardBackground: "#ffffff",
  cardPadding: 24,
  cardRadius: 8,
  cardShadow: "small",

  hoverEffect: "none",
},

},

{
type: "faq",
label: "FAQ item",
description: "Add an expandable FAQ item.",
defaultSettings: {
...DEFAULT_BLOCK_LAYOUT_SETTINGS,

  question: "Your question",
  answer: "Your answer",

  questionFontSize: 16,
  questionFontWeight: 600,

  answerFontSize: 15,
  answerLineHeight: 1.6,

  paddingTop: 20,
  paddingBottom: 20,

  borderBottom: true,
  borderColor: "#e5e7eb",
},

},
];

// Section helpers.

export function getThemeSectionDefinition(
type: StoreSectionType,
): ThemeSectionDefinition {
return (
THEME_SECTION_DEFINITIONS.find(
(definition) => definition.type === type,
) || THEME_SECTION_DEFINITIONS[0]
);
}

export function getThemeBlockDefinition(
type: StoreBlockType,
): ThemeBlockDefinition {
return (
THEME_BLOCK_DEFINITIONS.find(
(definition) => definition.type === type,
) || THEME_BLOCK_DEFINITIONS[0]
);
}

// Create section.

export function createThemeSection(
type: StoreSectionType,
): StoreSection {
const definition = getThemeSectionDefinition(type);

const timestamp = Date.now();

return {
id: `${type}-${timestamp}`,
type,
enabled: true,

settings: {
  ...definition.defaultSettings,
},

blocks: definition.defaultBlocks
  ? definition.defaultBlocks.map((block, blockIndex) => ({
      ...block,

      id: `${type}-${block.type}-${timestamp}-${blockIndex}`,

      enabled:
        typeof block.enabled === "boolean"
          ? block.enabled
          : true,

      settings: {
        ...block.settings,
      },
    }))
  : [],

};
}

// Create block.

export function createThemeBlock(
type: StoreBlockType,
): StoreBlock {
const definition = getThemeBlockDefinition(type);

return {
id: `${type}-${Date.now()}`,
type,
enabled: true,

settings: {
  ...definition.defaultSettings,
},

};
}
// Store theme settings.

export function getStoreThemeSettings(
store: StoreConfig,
): StoreThemeSettings {
return store.settings;
}

// Settings helpers.

export function getSectionSettings(
section: StoreSection,
): Record<string, unknown> {
return (section.settings || {}) as Record<string, unknown>;
}

export function getBlockSettings(
block: StoreBlock,
): Record<string, unknown> {
return (block.settings || {}) as Record<string, unknown>;
}

// Setting utilities.

export function stringSetting(
settings: Record<string, unknown>,
key: string,
fallback = "",
): string {
const value = settings[key];

return typeof value === "string" ? value : fallback;
}

export function numberSetting(
settings: Record<string, unknown>,
key: string,
fallback = 0,
): number {
const value = settings[key];

return typeof value === "number" && Number.isFinite(value)
? value
: fallback;
}

export function booleanSetting(
settings: Record<string, unknown>,
key: string,
fallback = false,
): boolean {
const value = settings[key];

return typeof value === "boolean" ? value : fallback;
}

// Section classification.

export function isProductSection(
type: StoreSectionType,
): boolean {
return (
type === "featured-products" ||
type === "collections" ||
type === "category-cards" ||
type === "product-gallery" ||
type === "product-info" ||
type === "related-products"
);
}

export function isMediaSection(
type: StoreSectionType,
): boolean {
return (
type === "hero" ||
type === "image-text" ||
type === "video" ||
type === "product-gallery"
);
}

export function isCarouselSection(
type: StoreSectionType,
): boolean {
return (
type === "product-gallery" ||
type === "testimonials" ||
type === "reviews"
);
}

// Allowed block types.

export function getAllowedBlockTypes(
sectionType: StoreSectionType,
): StoreBlockType[] {
switch (sectionType) {
case "hero":
return ["heading", "text", "button", "image", "video"];

case "image-text":
  return ["heading", "text", "button", "image", "video"];

case "video":
  return ["heading", "text", "button"];

case "benefits":
  return ["feature", "heading", "text"];

case "how-it-works":
  return ["stat", "heading", "text", "button"];

case "testimonials":
case "reviews":
  return ["review", "heading", "text"];

case "faq":
  return ["faq", "heading", "text"];

case "guarantee":
case "shipping":
  return ["heading", "text", "image", "button"];

case "trust-badges":
  return ["feature", "image", "text"];

case "newsletter":
  return ["heading", "text", "button"];

case "footer":
  return ["heading", "text", "image", "button"];

case "announcement":
  return ["text", "button"];

case "header":
  return ["image", "text", "button"];

default:
  return THEME_BLOCK_DEFINITIONS.map(
    (definition) => definition.type,
  );

}
}

// Formatting.

export function formatThemeLabel(
value: string,
): string {
return value
.replace(/[-_]/g, " ")
.replace(/\b\w/g, (character) =>
character.toUpperCase(),
);
}



