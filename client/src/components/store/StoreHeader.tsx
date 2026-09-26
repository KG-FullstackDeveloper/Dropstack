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
page: StorePageType,
) => void;
}

export default function StoreHeader({
store,
currentPage,
cartCount = 0,
onNavigate,
}: StoreHeaderProps) {
const [mobileOpen, setMobileOpen] =
useState(false);

const navigation =
store.navigation?.filter(
(item) => item.enabled,
) || [];

const fallbackNavigation = [
{
label: "Home",
page: "home" as StorePageType,
},
{
label: "Shop",
page: "catalog" as StorePageType,
},
{
label: "About",
page: "about" as StorePageType,
},
{
label: "Contact",
page: "contact" as StorePageType,
},
];

const links =
navigation.length > 0
? navigation
: fallbackNavigation;

function handleNavigate(
page: StorePageType,
) {
setMobileOpen(false);
onNavigate(page);
}

const logo =
store.logoUrl ||
null;

const sticky =
store.settings?.stickyHeader ??
true;

const showSearch =
store.settings?.showSearch ??
true;

const showCart =
store.settings?.showCartPage ??
true;

const showAnnouncement =
store.settings?.showAnnouncementBar ??
false;

return (
<>
{showAnnouncement && (
<div className="bg-slate-950 px-4 py-2.5 text-center text-xs font-medium text-white">
Free shipping on selected orders
</div>
)}

  <header
    className={`z-50 border-b border-slate-200 bg-white/95 backdrop-blur ${
      sticky
        ? "sticky top-0"
        : "relative"
    }`}
  >
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() =>
          handleNavigate("home")
        }
        className="flex min-w-0 items-center gap-3 text-left"
        aria-label={`${store.name} home`}
      >
        {logo ? (
          <img
            src={logo}
            alt={store.name}
            className="h-9 w-auto max-w-[150px] object-contain"
          />
        ) : (
          <span className="truncate text-lg font-bold tracking-tight text-slate-950">
            {store.name}
          </span>
        )}
      </button>

      <nav className="hidden items-center gap-7 md:flex">
        {links.map((item) => (
          <button
            key={`${item.page}-${item.label}`}
            type="button"
            onClick={() =>
              handleNavigate(
                item.page,
              )
            }
            className={`text-sm font-medium transition ${
              currentPage ===
              item.page
                ? "text-slate-950"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-1">
        {showSearch && (
          <button
            type="button"
            onClick={() =>
              handleNavigate(
                "catalog",
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Search products"
          >
            <Search size={19} />
          </button>
        )}

        {showCart && (
          <button
            type="button"
            onClick={() =>
              handleNavigate("cart")
            }
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label={`Cart${
              cartCount > 0
                ? `, ${cartCount} items`
                : ""
            }`}
          >
            <ShoppingBag
              size={19}
            />

            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-slate-950 px-1 text-[9px] font-bold text-white">
                {cartCount >
                99
                  ? "99+"
                  : cartCount}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            setMobileOpen(
              (open) => !open,
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 md:hidden"
          aria-label={
            mobileOpen
              ? "Close menu"
              : "Open menu"
          }
          aria-expanded={
            mobileOpen
          }
        >
          {mobileOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>
      </div>
    </div>

    {mobileOpen && (
      <div className="border-t border-slate-100 bg-white md:hidden">
        <nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="space-y-1">
            {links.map(
              (item) => (
                <button
                  key={`mobile-${item.page}-${item.label}`}
                  type="button"
                  onClick={() =>
                    handleNavigate(
                      item.page,
                    )
                  }
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                    currentPage ===
                    item.page
                      ? "bg-slate-100 text-slate-950"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  {item.label}
                </button>
              ),
            )}
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Information
            </p>

            <div className="grid grid-cols-2 gap-1">
              <MobileLink
                label="FAQ"
                page="faq"
                onNavigate={
                  handleNavigate
                }
              />

              <MobileLink
                label="Shipping"
                page="shipping"
                onNavigate={
                  handleNavigate
                }
              />

              <MobileLink
                label="Refunds"
                page="refund"
                onNavigate={
                  handleNavigate
                }
              />

              <MobileLink
                label="Privacy"
                page="privacy"
                onNavigate={
                  handleNavigate
                }
              />

              <MobileLink
                label="Terms"
                page="terms"
                onNavigate={
                  handleNavigate
                }
              />
            </div>
          </div>
        </nav>
      </div>
    )}
  </header>
</>

);
}

function MobileLink({
label,
page,
onNavigate,
}: {
label: string;
page: StorePageType;
onNavigate: (
page: StorePageType,
) => void;
}) {
return (
<button
type="button"
onClick={() => onNavigate(page)}
className="rounded-xl px-4 py-3 text-left text-sm text-slate-500 transition hover hover"
>
{label}
</button>
);
}