import {
Check,
Palette,
} from "lucide-react";

import type {
StoreTheme,
StoreThemeId,
} from "../../types/store";

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
return ( <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
{themes.map((theme) => {
const selected =
theme.id === selectedThemeId;

    const isFashion =
      theme.id === "fashion";

    const isMinimal =
      theme.id === "minimal";

    const isModern =
      theme.id === "modern";

    const isCommerce =
      theme.id === "commerce";

    const previewBackground =
      isFashion
        ? "bg-stone-100"
        : isMinimal
          ? "bg-white"
          : isModern
            ? "bg-slate-950"
            : isCommerce
              ? "bg-blue-50"
              : "bg-slate-50";

    return (
      <button
        key={theme.id}
        type="button"
        onClick={() => onSelect(theme.id)}
        className={`group overflow-hidden rounded-2xl border text-left transition ${
          selected
            ? "border-slate-950 shadow-lg ring-2 ring-slate-950/10"
            : "border-slate-200 hover:border-slate-300 hover:shadow-md"
        }`}
      >
        <div
          className={`h-40 w-full p-4 ${previewBackground}`}
        >
          <div className="h-full overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
            <div
              className={`h-7 ${
                isModern
                  ? "bg-slate-900"
                  : isFashion
                    ? "bg-stone-200"
                    : isCommerce
                      ? "bg-blue-100"
                      : "bg-slate-100"
              }`}
            />

            <div className="grid h-[calc(100%-1.75rem)] grid-cols-3 gap-2 p-3">
              <div className="col-span-2 rounded-lg bg-slate-100" />
              <div className="space-y-2">
                <div className="h-3 rounded bg-slate-200" />
                <div className="h-3 w-3/4 rounded bg-slate-200" />
                <div className="h-8 rounded bg-slate-900/10" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-950">
                {theme.name}
              </h3>

              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                {theme.category}
              </p>
            </div>

            {selected && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                <Check size={16} />
              </span>
            )}
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {theme.description}
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-400">
            <Palette size={14} />
            Store theme
          </div>
        </div>
      </button>
    );
  })}
</div>

);
}
