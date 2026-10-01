import {
Menu,
Search,
ShoppingBag,
X,
} from "lucide-react";
import { useState } from "react";
import type {
StoreConfig,
StorePageType,
} from "../../types/store";

interface StoreHeaderProps {
store: StoreConfig;
currentPage: StorePageType;
cartCount?: number;
onNavigate: (
page: StorePageType
) => void;
}

export default function StoreHeader({
store,
currentPage,
cartCount = 0,
onNavigate,
}: StoreHeaderProps) {
const [menuOpen, setMenuOpen] =
useState(false);

const enabledNavigation =
store.navigation.filter(
(item) => item.enabled
);

function navigate(page: StorePageType) {
setMenuOpen(false);
onNavigate(page);
}

function pageFromHref(href?: string): StorePageType {
if (!href || href === "/") return "home";
const value = href.replace(/^\//, "").split("/")[0];
const pages: StorePageType[] = [
  "catalog",
  "product",
  "collection",
  "contact",
  "about",
  "faq",
  "shipping",
  "refund",
  "privacy",
  "terms",
  "cart",
  "checkout",
  "order-success",
];
return pages.includes(value as StorePageType)
  ? (value as StorePageType)
  : "home";
}

function navigateHref(href?: string) {
navigate(pageFromHref(href));
}

return (
<header
className={[
"sticky top-0 z-50 border-b",
"border-gray-200/80 bg-white/90",
"backdrop-blur-xl",
store.settings.stickyHeader
? ""
: "relative",
].join(" ")}
>
<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
<button
type="button"
onClick={() =>
navigate("home")
}
className="min-w-0 text-left"
>
<span className="block truncate text-lg font-bold tracking-tight text-gray-950 sm:text-xl">
{store.name}
</span>
</button>

    <nav className="hidden items-center gap-7 md:flex">
      {enabledNavigation.map(
        (item) => (
          <button
            key={`${item.href}-${item.label}`}
            type="button"
            onClick={() =>
              navigateHref(item.href)
            }
            className={[
              "text-sm font-medium transition-colors",
              currentPage === pageFromHref(item.href)
                ? "text-gray-950"
                : "text-gray-500 hover:text-gray-950",
            ].join(" ")}
          >
            {item.label}
          </button>
        )
      )}
    </nav>

    <div className="flex items-center gap-1">
      {store.settings.showSearch && (
        <button
          type="button"
          aria-label="Search"
          className="relative rounded-full p-2.5 text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
        >
          <Search
            size={19}
            strokeWidth={1.8}
          />
        </button>
      )}

      {store.settings.showCartPage && (
        <button
          type="button"
          aria-label="Cart"
          onClick={() =>
            navigate("cart")
          }
          className="relative rounded-full p-2.5 text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
        >
          <ShoppingBag
            size={19}
            strokeWidth={1.8}
          />

          {cartCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-gray-950 px-1 text-[9px] font-bold leading-none text-white">
              {cartCount > 99
                ? "99+"
                : cartCount}
            </span>
          )}
        </button>
      )}

      <button
        type="button"
        aria-label={
          menuOpen
            ? "Close menu"
            : "Open menu"
        }
        onClick={() =>
          setMenuOpen(
            (open) => !open
          )
        }
        className="rounded-full p-2.5 text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 md:hidden"
      >
        {menuOpen ? (
          <X
            size={20}
            strokeWidth={1.8}
          />
        ) : (
          <Menu
            size={20}
            strokeWidth={1.8}
          />
        )}
      </button>
    </div>
  </div>

  {menuOpen && (
    <div className="border-t border-gray-200 bg-white md:hidden">
      <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
        {enabledNavigation.map(
          (item) => (
            <button
              key={`${item.href}-${item.label}-mobile`}
              type="button"
              onClick={() =>
                navigateHref(item.href)
              }
              className={[
                "border-b border-gray-100 px-1 py-4 text-left text-sm font-medium last:border-b-0",
                currentPage ===
                pageFromHref(item.href)
                  ? "text-gray-950"
                  : "text-gray-500",
              ].join(" ")}
            >
              {item.label}
            </button>
          )
        )}
      </nav>
    </div>
  )}
</header>

);
}