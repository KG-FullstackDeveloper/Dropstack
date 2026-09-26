import type { StoreConfig } from "../types/store";
import { DEFAULT_STORE_CONFIG } from "../themes/registry";

const STORE_CONFIG_KEY =
  "meo_store_config";

export function getStoreConfig(): StoreConfig {
  try {
    const saved = localStorage.getItem(
      STORE_CONFIG_KEY
    );

    if (!saved) {
      return DEFAULT_STORE_CONFIG;
    }

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_STORE_CONFIG,
      ...parsed,
      navigation:
        parsed.navigation ??
        DEFAULT_STORE_CONFIG.navigation,
      settings: {
        ...DEFAULT_STORE_CONFIG.settings,
        ...(parsed.settings ?? {}),
      },
    };
  } catch {
    return DEFAULT_STORE_CONFIG;
  }
}

export function saveStoreConfig(
  store: StoreConfig
): void {
  localStorage.setItem(
    STORE_CONFIG_KEY,
    JSON.stringify(store)
  );
}

export function resetStoreConfig(): void {
  localStorage.removeItem(
    STORE_CONFIG_KEY
  );
}