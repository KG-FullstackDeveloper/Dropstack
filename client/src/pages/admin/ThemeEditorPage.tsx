import { useState } from "react";
import { ThemeEditor } from "../../components/theme-editor";
import type { StoreConfig } from "../../types/store";
import { DEFAULT_STORE_CONFIG } from "../../types/themes/registry";

export default function ThemeEditorPage() {
  const [store, setStore] = useState<StoreConfig>(() => {
    try {
      const saved = localStorage.getItem("meo_store_config");

      if (saved) {
        return {
          ...DEFAULT_STORE_CONFIG,
          ...JSON.parse(saved),
        };
      }
    } catch {
      // Use the default store configuration if saved data is invalid.
    }

    return DEFAULT_STORE_CONFIG;
  });

  function handleChange(nextStore: StoreConfig) {
    setStore(nextStore);
  }

  function handleSave(nextStore: StoreConfig) {
    setStore(nextStore);
    localStorage.setItem("meo_store_config", JSON.stringify(nextStore));
  }

  function handlePublish(nextStore: StoreConfig) {
    setStore(nextStore);
    localStorage.setItem("meo_store_config", JSON.stringify(nextStore));
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white">
      <ThemeEditor
        store={store}
        onChange={handleChange}
        onBack={() => window.history.back()}
        onSave={handleSave}
        onPublish={handlePublish}
      />
    </div>
  );
}
