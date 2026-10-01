import type {
StoreBlock,
StoreBlockType,
StoreConfig,
StoreSection,
StoreSectionType,
} from "../../types/store";

export function createId(prefix: string): string {
return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function cloneStore(store: StoreConfig): StoreConfig {
return JSON.parse(JSON.stringify(store)) as StoreConfig;
}

export function getEditorSections(store: StoreConfig): StoreSection[] {
return [...(store.homeSections ?? [])];
}

export function updateEditorSections(
store: StoreConfig,
sections: StoreSection[]
): StoreConfig {
return {
...store,
homeSections: sections,
};
}

export function getSection(
store: StoreConfig,
sectionId: string | null
): StoreSection | null {
if (!sectionId) {
return null;
}

return (
getEditorSections(store).find((section) => section.id === sectionId) ?? null
);
}

export function getBlock(
section: StoreSection | null,
blockId: string | null
): StoreBlock | null {
if (!section || !blockId) {
return null;
}

return section.blocks?.find((block) => block.id === blockId) ?? null;
}

export function updateSection(
store: StoreConfig,
sectionId: string,
updater: (section: StoreSection) => StoreSection
): StoreConfig {
const sections = getEditorSections(store);

return updateEditorSections(
store,
sections.map((section) =>
section.id === sectionId ? updater(section) : section
)
);
}

export function updateBlock(
store: StoreConfig,
sectionId: string,
blockId: string,
updater: (block: StoreBlock) => StoreBlock
): StoreConfig {
return updateSection(store, sectionId, (section) => ({
...section,
blocks: (section.blocks ?? []).map((block) =>
block.id === blockId ? updater(block) : block
),
}));
}

export function removeSection(
store: StoreConfig,
sectionId: string
): StoreConfig {
return updateEditorSections(
store,
getEditorSections(store).filter((section) => section.id !== sectionId)
);
}

export function duplicateSection(
store: StoreConfig,
sectionId: string
): StoreConfig {
const sections = getEditorSections(store);
const index = sections.findIndex((section) => section.id === sectionId);

if (index === -1) {
return store;
}

const original = sections[index];

const duplicate: StoreSection = {
...JSON.parse(JSON.stringify(original)),
id: createId("section"),
blocks: (original.blocks ?? []).map((block) => ({
...JSON.parse(JSON.stringify(block)),
id: createId("block"),
})),
};

const nextSections = [...sections];
nextSections.splice(index + 1, 0, duplicate);

return updateEditorSections(store, nextSections);
}

export function moveSection(
store: StoreConfig,
sectionId: string,
direction: "up" | "down"
): StoreConfig {
const sections = [...getEditorSections(store)];
const index = sections.findIndex((section) => section.id === sectionId);

if (index === -1) {
return store;
}

const targetIndex = direction === "up" ? index - 1 : index + 1;

if (targetIndex < 0 || targetIndex >= sections.length) {
return store;
}

[sections[index], sections[targetIndex]] = [
sections[targetIndex],
sections[index],
];

return updateEditorSections(store, sections);
}

export function moveBlock(
store: StoreConfig,
sectionId: string,
blockId: string,
direction: "up" | "down"
): StoreConfig {
return updateSection(store, sectionId, (section) => {
const blocks = [...(section.blocks ?? [])];
const index = blocks.findIndex((block) => block.id === blockId);

if (index === -1) {
  return section;
}

const targetIndex = direction === "up" ? index - 1 : index + 1;

if (targetIndex < 0 || targetIndex >= blocks.length) {
  return section;
}

[blocks[index], blocks[targetIndex]] = [
  blocks[targetIndex],
  blocks[index],
];

return {
  ...section,
  blocks,
};

});
}

export function createDefaultSection(
type: StoreSectionType
): StoreSection {
const baseSettings: Record<string, unknown> = {
title: "",
heading: "",
text: "",
subheading: "",
buttonText: "",
buttonUrl: "",
backgroundColor: "",
textColor: "",
alignment: "left",
paddingTop: 64,
paddingBottom: 64,
};

const section: StoreSection = {
id: createId("section"),
type,
enabled: true,
settings: baseSettings,
blocks: [],
};

if (type === "announcement") {
section.settings = {
...baseSettings,
text: "Free shipping on qualifying orders",
backgroundColor: "#111827",
textColor: "#ffffff",
alignment: "center",
};
}

if (type === "hero") {
section.settings = {
...baseSettings,
heading: "A storefront built around your brand",
subheading:
"Introduce your store and guide customers toward the products you sell.",
buttonText: "Shop now",
buttonUrl: "/catalog",
imageUrl: "",
mobileImageUrl: "",
overlay: false,
overlayOpacity: 30,
contentPosition: "center-left",
height: "large",
};
}

if (
type === "featured-products" ||
type === "related-products" ||
type === "product-gallery"
) {
section.settings = {
...baseSettings,
title:
type === "related-products"
? "You may also like"
: "Featured products",
text: "Discover products selected for your store.",
layout: "grid",
columns: 4,
mobileColumns: 2,
gap: 16,
showArrows: true,
showDots: true,
autoplay: false,
autoplayInterval: 5000,
loop: true,
};
}

if (type === "video") {
section.settings = {
...baseSettings,
videoUrl: "",
posterUrl: "",
autoplay: true,
muted: true,
loop: true,
controls: false,
playsInline: true,
textOverlay: true,
overlayColor: "#000000",
overlayOpacity: 40,
heading: "Tell your story",
text: "Add text directly over your video.",
buttonText: "",
buttonUrl: "",
contentPosition: "center",
};
}

if (type === "image-text") {
section.settings = {
...baseSettings,
heading: "Built around your brand",
text: "Tell customers about your store, products and values.",
imageUrl: "",
imagePosition: "left",
imageWidth: 50,
};
}

if (
type === "testimonials" ||
type === "reviews" ||
type === "benefits" ||
type === "trust-badges"
) {
section.settings = {
...baseSettings,
title:
type === "benefits"
? "Why shop with us"
: type === "trust-badges"
? "Shop with confidence"
: "What customers say",
text: "",
layout: "grid",
columns: 3,
showArrows: true,
showDots: true,
autoplay: true,
autoplayInterval: 5000,
loop: true,
};
}

return section;
}

export function createDefaultBlock(type: StoreBlockType): StoreBlock {
const block: StoreBlock = {
id: createId("block"),
type,
enabled: true,
settings: {},
};

if (type === "heading") {
block.settings = {
text: "Your heading",
level: "h2",
alignment: "left",
};
}

if (type === "text") {
block.settings = {
text: "Add your text here.",
alignment: "left",
};
}

if (type === "button") {
block.settings = {
text: "Shop now",
url: "/catalog",
style: "solid",
size: "medium",
alignment: "left",
};
}

if (type === "image") {
block.settings = {
imageUrl: "",
mobileImageUrl: "",
alt: "",
objectFit: "cover",
objectPosition: "center",
};
}

if (type === "video") {
block.settings = {
videoUrl: "",
posterUrl: "",
autoplay: true,
muted: true,
loop: true,
controls: true,
playsInline: true,
};
}

if (type === "feature") {
block.settings = {
title: "Feature title",
text: "Explain this benefit to customers.",
icon: "star",
};
}

if (type === "stat") {
block.settings = {
value: "100%",
label: "Customer satisfaction",
};
}

if (type === "review") {
block.settings = {
rating: 5,
text: "Customer review content.",
author: "Customer",
verified: true,
};
}

if (type === "faq") {
block.settings = {
question: "Frequently asked question",
answer: "Write the answer here.",
open: false,
};
}

return block;
}

export function updateSetting(
settings: Record<string, unknown> | undefined,
key: string,
value: unknown
): Record<string, unknown> {
return {
...(settings ?? {}),
[key]: value,
};
}

export function getSetting<T>(
settings: Record<string, unknown> | undefined,
key: string,
fallback: T
): T {
const value = settings?.[key];

return value === undefined ? fallback : (value as T);
}

export function slugifyStoreName(value: string): string {
return value
.toLowerCase()
.trim()
.replace(/[^a-z0-9]+/g, "-")
.replace(/^-+|-+$/g, "");
}

export function getStorefrontUrl(store: StoreConfig): string {
const slug = store.slug || slugifyStoreName(store.name);

const configuredDomain = import.meta.env.VITE_STOREFRONT_DOMAIN;

if (configuredDomain) {
return `https://${slug}.${configuredDomain}`;
}

return `${window.location.origin}/store/${slug}`;
}

