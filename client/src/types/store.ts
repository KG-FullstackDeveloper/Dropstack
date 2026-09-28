import type { CSSProperties } from "react";

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
| "collection"
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
| "header"
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
| "slideshow"
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
| "rich-text"
| "button"
| "image"
| "video"
| "feature"
| "stat"
| "review"
| "faq"
| "slide"
| "product"
| "collection"
| "icon"
| "divider";

export type StoreSettingType =
| "text"
| "textarea"
| "richtext"
| "url"
| "image"
| "video"
| "color"
| "select"
| "toggle"
| "range"
| "number"
| "product"
| "products"
| "collection"
| "collections"
| "font"
| "alignment";

export interface StoreSettingOption {
label: string;
value: string;
}

export interface StoreSetting {
id: string;
type: StoreSettingType;
label: string;
description?: string;
defaultValue?: string | number | boolean | string[];
options?: StoreSettingOption[];
min?: number;
max?: number;
step?: number;
visibleIf?: {
settingId: string;
value: string | number | boolean;
};
}

export interface StoreResponsiveValue<T = string | number | boolean> {
desktop?: T;
tablet?: T;
mobile?: T;
}

export interface StoreAnimationSettings {
enabled?: boolean;
entrance?: "none" | "fade" | "slide-up" | "slide-left" | "slide-right" | "zoom";
hover?: "none" | "lift" | "scale" | "shadow";
duration?: number;
}

export interface StoreSliderSettings {
enabled?: boolean;
autoplay?: boolean;
interval?: number;
loop?: boolean;
showArrows?: boolean;
showDots?: boolean;
pauseOnHover?: boolean;
transition?: "slide" | "fade";
direction?: "left" | "right";
}

export interface StoreBlock {
id: string;
type: StoreBlockType;
label?: string;
enabled: boolean;
settings: Record<string, unknown>;
blocks?: StoreBlock[];
locked?: boolean;
}

export interface StoreSection {
id: string;
type: StoreSectionType;
label?: string;
enabled: boolean;

settings: Record<string, unknown>;

blocks?: StoreBlock[];

maxBlocks?: number;

slider?: StoreSliderSettings;

responsive?: {
columns?: StoreResponsiveValue<number>;
padding?: StoreResponsiveValue<string | number>;
gap?: StoreResponsiveValue<string | number>;
minHeight?: StoreResponsiveValue<string | number>;
headingSize?: StoreResponsiveValue<string | number>;
};

animation?: StoreAnimationSettings;

locked?: boolean;
}

export interface StoreNavigationItem {
id: string;
label: string;
href: string;
enabled?: boolean;
children?: StoreNavigationItem[];
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

animations?: StoreAnimationSettings;

layout?: {
maxWidth?: number;
sectionSpacing?: number;
contentPadding?: number;
borderRadius?: number;
};

typography?: {
headingFont?: string;
bodyFont?: string;
baseSize?: number;
headingWeight?: number;
};

productCards?: {
imageRatio?: "square" | "portrait" | "landscape";
showPrice?: boolean;
showCompareAtPrice?: boolean;
showRating?: boolean;
showQuickAdd?: boolean;
hoverEffect?: "none" | "image-swap" | "zoom";
};

cart?: {
type?: "page" | "drawer";
showRecommendations?: boolean;
showFreeShippingProgress?: boolean;
};

social?: {
instagram?: string;
facebook?: string;
tiktok?: string;
youtube?: string;
pinterest?: string;
};
}

export interface StoreTheme {
id: StoreThemeId;
name: string;
description: string;
category?: string;
previewImage?: string;
settings: StoreThemeSettings;
homeSections: StoreSection[];
productSections: StoreSection[];
collectionSections?: StoreSection[];
pageSections?: StoreSection[];
}

export interface StoreConfig {
id: string;
slug?: string;
name: string;
description?: string;

logoUrl?: string;
faviconUrl?: string;

themeId: StoreThemeId;

navigation: StoreNavigationItem[];

settings: StoreThemeSettings;

primaryColor?: string;
accentColor?: string;

fontFamily?: string;

homeSections?: StoreSection[];
productSections?: StoreSection[];
collectionSections?: StoreSection[];
pageSections?: StoreSection[];

themeSettings?: Record<string, unknown>;

customCss?: string;

published?: boolean;
publishedAt?: string;

domain?: string;

updatedAt?: string;
}

export interface StoreEditorHistoryState {
store: StoreConfig;
}

export type StoreEditorPanel =
| "sections"
| "theme-settings"
| "settings"
| "blocks";

export interface StoreEditorState {
page: StorePageType;
selectedSectionId: string | null;
selectedBlockId: string | null;
panel: StoreEditorPanel;
device: "desktop" | "tablet" | "mobile";
previewInspector: boolean;
isDirty: boolean;
isSaving: boolean;
}

export type StorePreviewStyle = CSSProperties;