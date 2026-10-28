import type { StoreTheme, StoreThemeId } from "../../types/store";

interface StoreThemeSelectorProps {
  themes: StoreTheme[];
  selectedThemeId: StoreThemeId;
  onSelect: (themeId: StoreThemeId) => void;
}

export default function StoreThemeSelector({
  themes,
  selectedThemeId,
  onSelect,
}: StoreThemeSelectorProps) {
  return (
    <div className="space-y-3 p-4">
      <h3 className="text-sm font-semibold">Available themes</h3>
      {themes.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onSelect(theme.id)}
          aria-pressed={selectedThemeId === theme.id}
          className={`w-full rounded-xl border p-4 text-left transition ${
            selectedThemeId === theme.id
              ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900 dark:border-white dark:bg-slate-800"
              : "border-slate-200 hover:border-slate-400 dark:border-slate-700"
          }`}
        >
          <span className="flex items-center justify-between gap-3 font-semibold">
            {theme.name}
            {selectedThemeId === theme.id && (
              <span className="text-xs font-medium">Selected</span>
            )}
          </span>
          <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
            {theme.description}
          </span>
        </button>
      ))}
    </div>
  );
}
