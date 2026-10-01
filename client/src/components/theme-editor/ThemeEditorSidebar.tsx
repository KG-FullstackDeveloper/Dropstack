import {
ChevronDown,
ChevronUp,
Copy,
Eye,
EyeOff,
GripVertical,
Plus,
Settings2,
Trash2,
} from "lucide-react";
import type { StoreConfig } from "../../types/store";
import {
getEditorSections,
getSection,
} from "./themeEditorUtils";
import {
getThemeSectionDefinition,
type ThemeEditorDevice,
} from "./ThemeEditorTypes";

interface ThemeEditorSidebarProps {
store: StoreConfig;
selectedSectionId: string | null;
selectedBlockId: string | null;
device: ThemeEditorDevice;
onSelectSection: (sectionId: string) => void;
onSelectBlock: (sectionId: string, blockId: string) => void;
onAddSection: () => void;
onDuplicateSection: (sectionId: string) => void;
onDeleteSection: (sectionId: string) => void;
onToggleSection: (sectionId: string) => void;
onMoveSection: (
sectionId: string,
direction: "up" | "down"
) => void;
onMoveBlock: (
sectionId: string,
blockId: string,
direction: "up" | "down"
) => void;
}

export function ThemeEditorSidebar({
store,
selectedSectionId,
selectedBlockId,
onSelectSection,
onSelectBlock,
onAddSection,
onDuplicateSection,
onDeleteSection,
onToggleSection,
onMoveSection,
onMoveBlock,
}: ThemeEditorSidebarProps) {
const sections = getEditorSections(store);
const selectedSection = getSection(store, selectedSectionId);

return (
<aside className="flex h-full w-[360px] shrink-0 flex-col border-r border-slate-200 bg-white">
<div className="border-b border-slate-200 px-5 py-4">
<div className="flex items-center justify-between">
<div>
<p className="text-sm font-bold text-slate-950">Theme editor</p>
<p className="mt-1 text-xs text-slate-500">
{store.name || "Untitled store"}
</p>
</div>

      <button
        type="button"
        onClick={onAddSection}
        className="flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white transition hover:bg-slate-800"
      >
        <Plus size={15} />
        Add section
      </button>
    </div>
  </div>

  <div className="border-b border-slate-200 p-3">
    <button
      type="button"
      onClick={() => {
        if (selectedSection) {
          onSelectSection(selectedSection.id);
        }
      }}
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
        selectedSection
          ? "border-slate-300 bg-slate-50"
          : "border-transparent hover:bg-slate-50"
      }`}
    >
      <Settings2 size={17} className="text-slate-500" />
      <span className="flex-1">
        <span className="block text-xs font-bold text-slate-900">
          Current selection
        </span>
        <span className="mt-1 block truncate text-[11px] text-slate-500">
          {selectedSection
            ? getThemeSectionDefinition(selectedSection.type).label
            : "Select a section"}
        </span>
      </span>
    </button>
  </div>

  <div className="min-h-0 flex-1 overflow-y-auto">
    <div className="px-3 py-3">
      <div className="mb-2 px-2">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          Sections
        </p>
      </div>

      {sections.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No sections yet
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Add your first section to start building the storefront.
          </p>
          <button
            type="button"
            onClick={onAddSection}
            className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-xs font-bold text-white"
          >
            Add section
          </button>
        </div>
      )}

      <div className="space-y-2">
        {sections.map((section, index) => {
          const definition = getThemeSectionDefinition(section.type);
          const selected = section.id === selectedSectionId;

          return (
            <div key={section.id}>
              <div
                className={`group rounded-xl border transition ${
                  selected
                    ? "border-slate-950 bg-slate-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 p-2">
                  <button
                    type="button"
                    className="cursor-grab p-1 text-slate-400 hover:text-slate-700"
                    title="Drag section"
                  >
                    <GripVertical size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSection(section.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-xs font-bold text-slate-900">
                      {definition.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                      {section.blocks?.length ?? 0} block
                      {(section.blocks?.length ?? 0) === 1 ? "" : "s"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleSection(section.id)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
                    title={section.enabled ? "Hide section" : "Show section"}
                  >
                    {section.enabled ? (
                      <Eye size={15} />
                    ) : (
                      <EyeOff size={15} />
                    )}
                  </button>
                </div>

                {selected && (
                  <div className="border-t border-slate-200 px-2 pb-2 pt-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onMoveSection(section.id, "up")
                        }
                        disabled={index === 0}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                        title="Move up"
                      >
                        <ChevronUp size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onMoveSection(section.id, "down")
                        }
                        disabled={index === sections.length - 1}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                        title="Move down"
                      >
                        <ChevronDown size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onDuplicateSection(section.id)
                        }
                        className="rounded-md p-1.5 text-slate-500 hover:bg-white"
                        title="Duplicate section"
                      >
                        <Copy size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onDeleteSection(section.id)
                        }
                        className="ml-auto rounded-md p-1.5 text-red-500 hover:bg-red-50"
                        title="Delete section"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {(section.blocks?.length ?? 0) > 0 && (
                      <div className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                        {section.blocks?.map((block, blockIndex) => (
                          <div
                            key={block.id}
                            className={`flex items-center gap-2 rounded-lg px-2 py-2 ${
                              selectedBlockId === block.id
                                ? "bg-white shadow-sm"
                                : "hover:bg-white/70"
                            }`}
                          >
                            <button
                              type="button"
                              className="text-slate-400"
                              title="Drag block"
                            >
                              <GripVertical size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onSelectBlock(section.id, block.id)
                              }
                              className="min-w-0 flex-1 truncate text-left text-[11px] font-semibold text-slate-700"
                            >
                              {block.type}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onMoveBlock(
                                  section.id,
                                  block.id,
                                  "up"
                                )
                              }
                              disabled={blockIndex === 0}
                              className="text-slate-400 disabled:opacity-20"
                            >
                              <ChevronUp size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onMoveBlock(
                                  section.id,
                                  block.id,
                                  "down"
                                )
                              }
                              disabled={
                                blockIndex ===
                                (section.blocks?.length ?? 1) - 1
                              }
                              className="text-slate-400 disabled:opacity-20"
                            >
                              <ChevronDown size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
</aside>

);
}