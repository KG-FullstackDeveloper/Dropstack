import type { StoreSection } from "../../types/store";

interface StoreSectionEditorProps {
  sections: StoreSection[];
  onChange: (sections: StoreSection[]) => void;
}

export default function StoreSectionEditor({
  sections,
  onChange,
}: StoreSectionEditorProps) {
  if (sections.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-500">
        No editable sections are configured for this page yet.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <h3 className="text-sm font-semibold">Homepage sections</h3>
      {sections.map((section, index) => (
        <label
          key={section.id}
          className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">
              {section.label || section.type.replace(/-/g, " ")}
            </span>
            <span className="text-xs text-slate-500">
              {section.enabled ? "Visible on storefront" : "Hidden from storefront"}
            </span>
          </span>
          <input
            type="checkbox"
            checked={section.enabled}
            onChange={(event) => {
              const next = sections.map((item, itemIndex) =>
                itemIndex === index
                  ? { ...item, enabled: event.target.checked }
                  : item,
              );
              onChange(next);
            }}
            aria-label={`Toggle ${section.label || section.type}`}
          />
        </label>
      ))}
    </div>
  );
}
