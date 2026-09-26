import type {
  CSSProperties,
  ReactNode,
} from "react";

import type { StoreConfig } from "../../types/store";

interface StoreCSSProperties
  extends CSSProperties {
  "--store-primary"?: string;
  "--store-accent"?: string;
}

interface StoreThemeProviderProps {
  store: StoreConfig;
  children: ReactNode;
}

export default function StoreThemeProvider({
  store,
  children,
}: StoreThemeProviderProps) {
  const primary =
    store.primaryColor || "#111827";

  const accent =
    store.accentColor || "#2563eb";

  const style: StoreCSSProperties = {
    "--store-primary": primary,
    "--store-accent": accent,
    fontFamily:
      store.fontFamily ||
      "Inter, ui-sans-serif, system-ui, sans-serif",
  };

  return (
    <div
      className="min-h-screen bg-white text-slate-950 dark:bg-slate-950 dark:text-white"
      style={style}
    >
      {children}
    </div>
  );
}