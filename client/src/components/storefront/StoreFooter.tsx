import {
  Globe,
  Mail,
} from "lucide-react";

import type {
  StoreConfig,
  StorePageType,
} from "../../types/store";

interface StoreFooterProps {
  store: StoreConfig;
  onNavigate: (page: StorePageType) => void;
}

export default function StoreFooter({
  store,
  onNavigate,
}: StoreFooterProps) {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="text-left"
            >
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                {store.name}
              </h2>
            </button>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              {store.description ||
                "Shop quality products from our online store."}
            </p>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                aria-label="Website"
                className="rounded-lg border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
              >
                <Globe size={17} />
              </button>

              <button
                type="button"
                aria-label="Email"
                className="rounded-lg border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
              >
                <Mail size={17} />
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
              Shop
            </h3>

            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => onNavigate("home")}
                className="w-fit text-sm text-slate-500 hover:text-slate-950 dark:hover:text-white"
              >
                Home
              </button>

              {store.settings.showCatalogPage && (
                <button
                  type="button"
                  onClick={() => onNavigate("catalog")}
                  className="w-fit text-sm text-slate-500 hover:text-slate-950 dark:hover:text-white"
                >
                  Catalog
                </button>
              )}

              {store.settings.showCartPage && (
                <button
                  type="button"
                  onClick={() => onNavigate("cart")}
                  className="w-fit text-sm text-slate-500 hover:text-slate-950 dark:hover:text-white"
                >
                  Cart
                </button>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
              Support
            </h3>

            <div className="mt-4 flex flex-col gap-3">
              {store.settings.showContactPage && (
                <button
                  type="button"
                  onClick={() => onNavigate("contact")}
                  className="w-fit text-sm text-slate-500 hover:text-slate-950 dark:hover:text-white"
                >
                  Contact
                </button>
              )}

              <button
                type="button"
                className="w-fit text-sm text-slate-500 hover:text-slate-950 dark:hover:text-white"
              >
                Shipping
              </button>

              <button
                type="button"
                className="w-fit text-sm text-slate-500 hover:text-slate-950 dark:hover:text-white"
              >
                FAQ
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()}{" "}
            {store.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}