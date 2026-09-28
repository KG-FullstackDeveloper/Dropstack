import {
  useMemo,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  GripVertical,
  Monitor,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Plus,
  Redo2,
  Save,
  Settings2,
  Smartphone,
  Tablet,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import type {
  StoreBlock,
  StoreConfig,
  StoreSection,
  StoreSectionType,
} from "../../types/store";
import {
  createThemeBlock,
  createThemeSection,
  getBlockSettings,
  getSectionSettings,
  THEME_BLOCK_DEFINITIONS,
  THEME_SECTION_DEFINITIONS,
  type ThemeEditorDevice,
  type ThemeEditorPanel,
  type ThemeEditorProps,
} from "./ThemeEditorTypes";

export function ThemeEditor({
  store,
  onChange,
  onBack,
  onSave,
  onPublish,
}: ThemeEditorProps) {
  const [draft, setDraft] = useState<StoreConfig>(store);
  const [device, setDevice] = useState<ThemeEditorDevice>("desktop");
  const [panel, setPanel] = useState<ThemeEditorPanel>("sections");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [past, setPast] = useState<StoreConfig[]>([]);
  const [future, setFuture] = useState<StoreConfig[]>([]);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(
    null
  );
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);

  const sections = useMemo(
    () => [...(draft.homeSections || [])],
    [draft.homeSections]
  );

  const selectedSection = sections.find(
    (section) => section.id === selectedSectionId
  );

  const selectedBlock = selectedSection?.blocks?.find(
    (block) => block.id === selectedBlockId
  );

  function commit(nextStore: StoreConfig) {
    setPast((current) => [...current.slice(-30), draft]);
    setFuture([]);
    setDraft(nextStore);
    onChange(nextStore);
    setSaved(false);
  }

  function updateSection(
    sectionId: string,
    updater: (section: StoreSection) => StoreSection
  ) {
    const nextSections = sections.map((section) =>
      section.id === sectionId ? updater(section) : section
    );

    commit({
      ...draft,
      homeSections: nextSections,
    });
  }

  function updateBlock(
    sectionId: string,
    blockId: string,
    updater: (block: StoreBlock) => StoreBlock
  ) {
    updateSection(sectionId, (section) => ({
      ...section,
      blocks: (section.blocks || []).map((block) =>
        block.id === blockId ? updater(block) : block
      ),
    }));
  }

  function deleteSection(sectionId: string) {
    commit({
      ...draft,
      homeSections: sections.filter((section) => section.id !== sectionId),
    });

    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
      setPanel("sections");
    }
  }

  function duplicateSection(sectionId: string) {
    const source = sections.find((section) => section.id === sectionId);

    if (!source) return;

    const copy: StoreSection = {
      ...source,
      id: `${source.type}-${Date.now()}`,
      settings: { ...(source.settings || {}) },
      blocks: (source.blocks || []).map((block) => ({
        ...block,
        id: `${block.type}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,
        settings: { ...(block.settings || {}) },
      })),
    };

    const index = sections.findIndex((section) => section.id === sectionId);
    const nextSections = [...sections];
    nextSections.splice(index + 1, 0, copy);

    commit({
      ...draft,
      homeSections: nextSections,
    });

    setSelectedSectionId(copy.id);
    setPanel("section-settings");
  }

  function addSection(type: StoreSectionType) {
    const section = createThemeSection(type, sections.length);

    commit({
      ...draft,
      homeSections: [...sections, section],
    });

    setShowAddSection(false);
    setSelectedSectionId(section.id);
    setSelectedBlockId(null);
    setPanel("section-settings");
  }

  function addBlock(type: StoreBlock["type"]) {
    if (!selectedSectionId) return;

    const block = createThemeBlock(
      type,
      selectedSection?.blocks?.length || 0
    );

    updateSection(selectedSectionId, (section) => ({
      ...section,
      blocks: [...(section.blocks || []), block],
    }));

    setSelectedBlockId(block.id);
    setPanel("block-settings");
  }

  function deleteBlock(sectionId: string, blockId: string) {
    updateSection(sectionId, (section) => ({
      ...section,
      blocks: (section.blocks || []).filter((block) => block.id !== blockId),
    }));

    setSelectedBlockId(null);
    setPanel("section-settings");
  }

  function moveSection(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;

    const sourceIndex = sections.findIndex(
      (section) => section.id === sourceId
    );
    const targetIndex = sections.findIndex(
      (section) => section.id === targetId
    );

    if (sourceIndex < 0 || targetIndex < 0) return;

    const nextSections = [...sections];
    const [removed] = nextSections.splice(sourceIndex, 1);
    nextSections.splice(targetIndex, 0, removed);

    commit({
      ...draft,
      homeSections: nextSections,
    });
  }

  function moveBlock(
    sectionId: string,
    sourceId: string,
    targetId: string
  ) {
    if (sourceId === targetId) return;

    updateSection(sectionId, (section) => {
      const blocks = [...(section.blocks || [])];
      const sourceIndex = blocks.findIndex((block) => block.id === sourceId);
      const targetIndex = blocks.findIndex((block) => block.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0) return section;

      const [removed] = blocks.splice(sourceIndex, 1);
      blocks.splice(targetIndex, 0, removed);

      return {
        ...section,
        blocks,
      };
    });
  }

  function undo() {
    const previous = past[past.length - 1];

    if (!previous) return;

    setPast((current) => current.slice(0, -1));
    setFuture((current) => [draft, ...current]);
    setDraft(previous);
    onChange(previous);
    setSaved(false);
  }

  function redo() {
    const next = future[0];

    if (!next) return;

    setFuture((current) => current.slice(1));
    setPast((current) => [...current, draft]);
    setDraft(next);
    onChange(next);
    setSaved(false);
  }

  function handleSave() {
    onSave(draft);
    setSaved(true);
  }

  function handlePublish() {
    onPublish(draft);
    setSaved(true);
  }

  function handleSectionDragStart(
    event: DragEvent<HTMLDivElement>,
    sectionId: string
  ) {
    setDraggedSectionId(sectionId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", sectionId);
  }

  function handleSectionDrop(
    event: DragEvent<HTMLDivElement>,
    targetId: string
  ) {
    event.preventDefault();

    const sourceId =
      draggedSectionId || event.dataTransfer.getData("text/plain");

    if (sourceId) {
      moveSection(sourceId, targetId);
    }

    setDraggedSectionId(null);
  }

  function handleBlockDragStart(
    event: DragEvent<HTMLDivElement>,
    blockId: string
  ) {
    setDraggedBlockId(blockId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", blockId);
  }

  function handleBlockDrop(
    event: DragEvent<HTMLDivElement>,
    targetId: string
  ) {
    event.preventDefault();

    if (!selectedSectionId) return;

    const sourceId =
      draggedBlockId || event.dataTransfer.getData("text/plain");

    if (sourceId) {
      moveBlock(selectedSectionId, sourceId, targetId);
    }

    setDraggedBlockId(null);
  }

  const previewWidth =
    device === "mobile"
      ? "390px"
      : device === "tablet"
      ? "768px"
      : "100%";

  return (
    <div className="fixed inset-0 z-[100] flex h-screen w-screen flex-col overflow-hidden bg-slate-100 text-slate-950">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg border text-slate-600 transition hover:bg-slate-50"
            title="Back to themes"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="hidden h-7 w-px bg-slate-200 sm:block" />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{draft.name}</p>
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  saved ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span className="text-[11px] text-slate-500">
                {saved ? "Saved" : "Unsaved changes"}
              </span>
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-xl border bg-slate-50 p-1 md:flex">
          <DeviceButton
            active={device === "desktop"}
            label="Desktop"
            onClick={() => setDevice("desktop")}
          >
            <Monitor size={16} />
          </DeviceButton>

          <DeviceButton
            active={device === "tablet"}
            label="Tablet"
            onClick={() => setDevice("tablet")}
          >
            <Tablet size={16} />
          </DeviceButton>

          <DeviceButton
            active={device === "mobile"}
            label="Mobile"
            onClick={() => setDevice("mobile")}
          >
            <Smartphone size={16} />
          </DeviceButton>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={!past.length}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 sm:flex"
            title="Undo"
          >
            <Undo2 size={17} />
          </button>

          <button
            type="button"
            onClick={redo}
            disabled={!future.length}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 sm:flex"
            title="Redo"
          >
            <Redo2 size={17} />
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="hidden h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 lg:flex"
          >
            <Eye size={15} />
            Preview
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="hidden h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:flex"
          >
            <Save size={15} />
            Save
          </button>

          <button
            type="button"
            onClick={handlePublish}
            className="flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Upload size={15} />
            Publish
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[340px] shrink-0 flex-col border-r bg-white">
          <div className="flex h-12 shrink-0 border-b">
            <button
              type="button"
              onClick={() => {
                setPanel("sections");
                setSelectedSectionId(null);
                setSelectedBlockId(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 text-xs font-bold ${
                panel === "sections" ||
                panel === "section-settings" ||
                panel === "block-settings"
                  ? "border-b-2 border-slate-950 text-slate-950"
                  : "text-slate-400"
              }`}
            >
              <PanelLeft size={15} />
              Sections
            </button>

            <button
              type="button"
              onClick={() => {
                setPanel("theme-settings");
                setSelectedSectionId(null);
                setSelectedBlockId(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 text-xs font-bold ${
                panel === "theme-settings"
                  ? "border-b-2 border-slate-950 text-slate-950"
                  : "text-slate-400"
              }`}
            >
              <Settings2 size={15} />
              Theme settings
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {panel === "theme-settings" ? (
              <ThemeSettingsPanel
                store={draft}
                onChange={(next) => commit(next)}
              />
            ) : panel === "section-settings" && selectedSection ? (
              <SectionSettingsPanel
                section={selectedSection}
                onChange={(next) =>
                  updateSection(selectedSection.id, () => next)
                }
                onBack={() => {
                  setPanel("sections");
                  setSelectedBlockId(null);
                }}
                onAddBlock={addBlock}
                onSelectBlock={(id) => {
                  setSelectedBlockId(id);
                  setPanel("block-settings");
                }}
                onDeleteBlock={deleteBlock}
                onDuplicate={() => duplicateSection(selectedSection.id)}
                onDelete={() => deleteSection(selectedSection.id)}
                draggedBlockId={draggedBlockId}
                onBlockDragStart={handleBlockDragStart}
                onBlockDrop={handleBlockDrop}
              />
            ) : panel === "block-settings" && selectedSection && selectedBlock ? (
              <BlockSettingsPanel
                block={selectedBlock}
                onChange={(next) =>
                  updateBlock(
                    selectedSection.id,
                    selectedBlock.id,
                    () => next
                  )
                }
                onBack={() => {
                  setPanel("section-settings");
                  setSelectedBlockId(null);
                }}
              />
            ) : (
              <SectionsPanel
                sections={sections}
                selectedSectionId={selectedSectionId}
                onSelect={(id) => {
                  setSelectedSectionId(id);
                  setSelectedBlockId(null);
                  setPanel("section-settings");
                }}
                onToggle={(id) =>
                  updateSection(id, (section) => ({
                    ...section,
                    enabled: !section.enabled,
                  }))
                }
                onAdd={() => setShowAddSection(true)}
                onDuplicate={duplicateSection}
                onDelete={deleteSection}
                draggedSectionId={draggedSectionId}
                onDragStart={handleSectionDragStart}
                onDrop={handleSectionDrop}
              />
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto bg-slate-100">
          <div className="flex min-h-full justify-center p-4 md:p-8">
            <div
              className="relative shrink-0 overflow-hidden rounded-xl border bg-white shadow-xl transition-all duration-200"
              style={{
                width: previewWidth,
                minHeight: "calc(100vh - 128px)",
                maxWidth: "100%",
              }}
            >
              <ThemeStorePreview
                store={draft}
                sections={sections}
                selectedSectionId={selectedSectionId}
                onSelectSection={(id) => {
                  setSelectedSectionId(id);
                  setSelectedBlockId(null);
                  setPanel("section-settings");
                }}
              />
            </div>
          </div>
        </main>

        <div className="hidden w-10 shrink-0 border-l bg-white xl:flex xl:flex-col xl:items-center xl:gap-2 xl:pt-3">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            title="Editor panel"
          >
            <PanelRight size={16} />
          </button>
        </div>
      </div>

      {showAddSection && (
        <AddSectionModal
          onClose={() => setShowAddSection(false)}
          onSelect={addSection}
        />
      )}

      {showPreview && (
        <PreviewModal
          store={draft}
          sections={sections}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

function DeviceButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`flex h-8 w-9 items-center justify-center rounded-lg transition ${
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-400 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function SectionsPanel({
  sections,
  selectedSectionId,
  onSelect,
  onToggle,
  onAdd,
  onDuplicate,
  onDelete,
  draggedSectionId,
  onDragStart,
  onDrop,
}: {
  sections: StoreSection[];
  selectedSectionId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  draggedSectionId: string | null;
  onDragStart: (
    event: DragEvent<HTMLDivElement>,
    sectionId: string
  ) => void;
  onDrop: (
    event: DragEvent<HTMLDivElement>,
    sectionId: string
  ) => void;
}) {
  return (
    <div className="p-3">
      <div className="mb-3 rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-bold text-slate-900">Storefront</p>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">
          Drag sections to change their order. Select a section to edit its
          content, layout and behavior.
        </p>
      </div>

      <div className="space-y-1.5">
        {sections.map((section) => (
          <div
            key={section.id}
            draggable
            onDragStart={(event) => onDragStart(event, section.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onDrop(event, section.id)}
            className={`group flex items-center gap-2 rounded-xl border bg-white p-2 transition ${
              selectedSectionId === section.id
                ? "border-slate-950 shadow-sm"
                : "border-slate-200 hover:border-slate-300"
            } ${draggedSectionId === section.id ? "opacity-40" : ""}`}
          >
            <div className="cursor-grab p-1 text-slate-300 group-hover:text-slate-500">
              <GripVertical size={15} />
            </div>

            <button
              type="button"
              onClick={() => onSelect(section.id)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-xs font-bold capitalize">
                {formatLabel(section.type)}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {section.enabled ? "Visible" : "Hidden"}
              </p>
            </button>

            <button
              type="button"
              onClick={() => onToggle(section.id)}
              className={`h-6 w-10 rounded-full p-0.5 transition ${
                section.enabled ? "bg-slate-950" : "bg-slate-200"
              }`}
              aria-label={section.enabled ? "Hide section" : "Show section"}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow transition ${
                  section.enabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>

            <div className="relative">
              <details>
                <summary className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <MoreHorizontal size={16} />
                </summary>
                <div className="absolute right-0 top-8 z-20 w-32 rounded-lg border bg-white p-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => onDuplicate(section.id)}
                    className="w-full rounded-md px-2 py-1.5 text-left text-[11px] hover:bg-slate-50"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(section.id)}
                    className="w-full rounded-md px-2 py-1.5 text-left text-[11px] text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </details>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs font-bold text-slate-600 transition hover:border-slate-500 hover:bg-slate-50"
      >
        <Plus size={15} />
        Add section
      </button>
    </div>
  );
}

function SectionSettingsPanel({
  section,
  onChange,
  onBack,
  onAddBlock,
  onSelectBlock,
  onDeleteBlock,
  onDuplicate,
  onDelete,
  draggedBlockId,
  onBlockDragStart,
  onBlockDrop,
}: {
  section: StoreSection;
  onChange: (section: StoreSection) => void;
  onBack: () => void;
  onAddBlock: (type: StoreBlock["type"]) => void;
  onSelectBlock: (id: string) => void;
  onDeleteBlock: (sectionId: string, blockId: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  draggedBlockId: string | null;
  onBlockDragStart: (
    event: DragEvent<HTMLDivElement>,
    blockId: string
  ) => void;
  onBlockDrop: (
    event: DragEvent<HTMLDivElement>,
    blockId: string
  ) => void;
}) {
  const settings = getSectionSettings(section);

  function setSetting(key: string, value: unknown) {
    onChange({
      ...section,
      settings: {
        ...settings,
        [key]: value,
      },
    });
  }

  return (
    <div>
      <EditorSubHeader
        title={formatLabel(section.type)}
        onBack={onBack}
        right={
          <details>
            <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
              <MoreHorizontal size={16} />
            </summary>
            <div className="absolute right-3 z-30 mt-1 w-32 rounded-lg border bg-white p-1 shadow-xl">
              <button
                type="button"
                onClick={onDuplicate}
                className="w-full rounded-md px-2 py-2 text-left text-[11px] hover:bg-slate-50"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="w-full rounded-md px-2 py-2 text-left text-[11px] text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </details>
        }
      />

      <div className="space-y-1 border-b p-3">
        {isTextSetting(section.type, "heading") && (
          <Field
            label="Heading"
            value={stringValue(settings.heading)}
            onChange={(value) => setSetting("heading", value)}
          />
        )}

        {isTextSetting(section.type, "title") && (
          <Field
            label="Title"
            value={stringValue(settings.title)}
            onChange={(value) => setSetting("title", value)}
          />
        )}

        {isTextSetting(section.type, "subheading") && (
          <TextAreaField
            label="Subheading"
            value={stringValue(settings.subheading)}
            onChange={(value) => setSetting("subheading", value)}
          />
        )}

        {isTextSetting(section.type, "text") && (
          <TextAreaField
            label="Text"
            value={stringValue(settings.text)}
            onChange={(value) => setSetting("text", value)}
          />
        )}

        {section.type === "hero" && (
          <>
            <Field
              label="Button text"
              value={stringValue(settings.buttonText)}
              onChange={(value) => setSetting("buttonText", value)}
            />
            <Field
              label="Button link"
              value={stringValue(settings.buttonUrl)}
              onChange={(value) => setSetting("buttonUrl", value)}
            />
            <MediaField
              label="Desktop image"
              value={stringValue(settings.imageUrl)}
              onChange={(value) => setSetting("imageUrl", value)}
            />
            <MediaField
              label="Mobile image"
              value={stringValue(settings.mobileImageUrl)}
              onChange={(value) => setSetting("mobileImageUrl", value)}
            />
            <SelectField
              label="Content position"
              value={stringValue(settings.contentPosition, "left")}
              options={["left", "center", "right"]}
              onChange={(value) => setSetting("contentPosition", value)}
            />
            <NumberField
              label="Minimum height"
              value={numberValue(settings.minHeight, 520)}
              min={300}
              max={900}
              onChange={(value) => setSetting("minHeight", value)}
            />
            <ToggleField
              label="Overlay"
              value={booleanValue(settings.overlay, true)}
              onChange={(value) => setSetting("overlay", value)}
            />
            <NumberField
              label="Overlay opacity"
              value={numberValue(settings.overlayOpacity, 35)}
              min={0}
              max={100}
              onChange={(value) => setSetting("overlayOpacity", value)}
            />
          </>
        )}

        {section.type === "video" && (
          <>
            <MediaField
              label="Video URL"
              value={stringValue(settings.videoUrl)}
              onChange={(value) => setSetting("videoUrl", value)}
            />
            <MediaField
              label="Poster image"
              value={stringValue(settings.posterUrl)}
              onChange={(value) => setSetting("posterUrl", value)}
            />
            <Field
              label="Heading overlay"
              value={stringValue(settings.heading)}
              onChange={(value) => setSetting("heading", value)}
            />
            <TextAreaField
              label="Text overlay"
              value={stringValue(settings.text)}
              onChange={(value) => setSetting("text", value)}
            />
            <Field
              label="Button text"
              value={stringValue(settings.buttonText)}
              onChange={(value) => setSetting("buttonText", value)}
            />
            <Field
              label="Button link"
              value={stringValue(settings.buttonUrl)}
              onChange={(value) => setSetting("buttonUrl", value)}
            />
            <ToggleField
              label="Show text overlay"
              value={booleanValue(settings.showTextOverlay, true)}
              onChange={(value) => setSetting("showTextOverlay", value)}
            />
            <ToggleField
              label="Autoplay"
              value={booleanValue(settings.autoplay, true)}
              onChange={(value) => setSetting("autoplay", value)}
            />
            <ToggleField
              label="Muted"
              value={booleanValue(settings.muted, true)}
              onChange={(value) => setSetting("muted", value)}
            />
            <ToggleField
              label="Loop video"
              value={booleanValue(settings.loop, true)}
              onChange={(value) => setSetting("loop", value)}
            />
            <ToggleField
              label="Video controls"
              value={booleanValue(settings.controls, false)}
              onChange={(value) => setSetting("controls", value)}
            />
            <SelectField
              label="Text position"
              value={stringValue(settings.contentPosition, "center")}
              options={["top", "center", "bottom", "left", "right"]}
              onChange={(value) => setSetting("contentPosition", value)}
            />
          </>
        )}

        {isProductSection(section.type) && (
          <>
            <NumberField
              label="Products"
              value={numberValue(settings.productsCount, 8)}
              min={1}
              max={50}
              onChange={(value) => setSetting("productsCount", value)}
            />
            <NumberField
              label="Desktop columns"
              value={numberValue(settings.columns, 4)}
              min={1}
              max={6}
              onChange={(value) => setSetting("columns", value)}
            />
            <NumberField
              label="Mobile columns"
              value={numberValue(settings.mobileColumns, 2)}
              min={1}
              max={3}
              onChange={(value) => setSetting("mobileColumns", value)}
            />
            <ToggleField
              label="Show price"
              value={booleanValue(settings.showPrice, true)}
              onChange={(value) => setSetting("showPrice", value)}
            />
            <ToggleField
              label="Show add to cart"
              value={booleanValue(settings.showAddToCart, true)}
              onChange={(value) => setSetting("showAddToCart", value)}
            />
          </>
        )}

        {isCarouselSection(section.type) && (
          <CarouselSettings
            settings={settings}
            onChange={setSetting}
          />
        )}

        {section.type === "image-text" && (
          <>
            <MediaField
              label="Image"
              value={stringValue(settings.imageUrl)}
              onChange={(value) => setSetting("imageUrl", value)}
            />
            <SelectField
              label="Image position"
              value={stringValue(settings.imagePosition, "left")}
              options={["left", "right"]}
              onChange={(value) => setSetting("imagePosition", value)}
            />
            <Field
              label="Button text"
              value={stringValue(settings.buttonText)}
              onChange={(value) => setSetting("buttonText", value)}
            />
            <Field
              label="Button link"
              value={stringValue(settings.buttonUrl)}
              onChange={(value) => setSetting("buttonUrl", value)}
            />
          </>
        )}

        {section.type === "newsletter" && (
          <>
            <Field
              label="Input placeholder"
              value={stringValue(settings.placeholder, "Enter your email")}
              onChange={(value) => setSetting("placeholder", value)}
            />
            <Field
              label="Button text"
              value={stringValue(settings.buttonText, "Subscribe")}
              onChange={(value) => setSetting("buttonText", value)}
            />
            <ColorField
              label="Background"
              value={stringValue(settings.backgroundColor, "#111827")}
              onChange={(value) => setSetting("backgroundColor", value)}
            />
          </>
        )}
      </div>

      {(section.blocks || []).length > 0 && (
        <div className="border-b p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold">Blocks</p>
              <p className="text-[10px] text-slate-400">
                Drag blocks to reorder them.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            {(section.blocks || []).map((block) => (
              <div
                key={block.id}
                draggable
                onDragStart={(event) =>
                  onBlockDragStart(event, block.id)
                }
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => onBlockDrop(event, block.id)}
                className={`flex items-center gap-2 rounded-lg border bg-white p-2 ${
                  draggedBlockId === block.id ? "opacity-40" : ""
                }`}
              >
                <GripVertical
                  size={14}
                  className="shrink-0 cursor-grab text-slate-300"
                />

                <button
                  type="button"
                  onClick={() => onSelectBlock(block.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-[11px] font-bold">
                    {formatLabel(block.type)}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onDeleteBlock(section.id, block.id)
                  }
                  className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-3">
        <details className="rounded-xl border">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-3 text-xs font-bold">
            <span>Add block</span>
            <ChevronDown size={14} />
          </summary>

          <div className="grid grid-cols-2 gap-2 border-t p-2">
            {THEME_BLOCK_DEFINITIONS.map((definition) => (
              <button
                key={definition.type}
                type="button"
                onClick={() => onAddBlock(definition.type)}
                className="rounded-lg border p-2 text-left hover:bg-slate-50"
              >
                <p className="text-[11px] font-bold">{definition.label}</p>
                <p className="mt-1 text-[9px] leading-4 text-slate-400">
                  {definition.description}
                </p>
              </button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

function BlockSettingsPanel({
  block,
  onChange,
  onBack,
}: {
  block: StoreBlock;
  onChange: (block: StoreBlock) => void;
  onBack: () => void;
}) {
  const settings = getBlockSettings(block);

  function setSetting(key: string, value: unknown) {
    onChange({
      ...block,
      settings: {
        ...settings,
        [key]: value,
      },
    });
  }

  return (
    <div>
      <EditorSubHeader
        title={formatLabel(block.type)}
        onBack={onBack}
      />

      <div className="space-y-1 p-3">
        {(block.type === "heading" || block.type === "text") && (
          <TextAreaField
            label="Text"
            value={stringValue(settings.text)}
            onChange={(value) => setSetting("text", value)}
          />
        )}

        {block.type === "button" && (
          <>
            <Field
              label="Button text"
              value={stringValue(settings.text, "Shop now")}
              onChange={(value) => setSetting("text", value)}
            />
            <Field
              label="Link"
              value={stringValue(settings.url)}
              onChange={(value) => setSetting("url", value)}
            />
            <SelectField
              label="Style"
              value={stringValue(settings.style, "primary")}
              options={["primary", "secondary", "outline", "text"]}
              onChange={(value) => setSetting("style", value)}
            />
          </>
        )}

        {block.type === "image" && (
          <>
            <MediaField
              label="Image"
              value={stringValue(settings.imageUrl)}
              onChange={(value) => setSetting("imageUrl", value)}
            />
            <Field
              label="Alt text"
              value={stringValue(settings.alt)}
              onChange={(value) => setSetting("alt", value)}
            />
            <Field
              label="Link"
              value={stringValue(settings.linkUrl)}
              onChange={(value) => setSetting("linkUrl", value)}
            />
          </>
        )}

        {block.type === "video" && (
          <>
            <MediaField
              label="Video URL"
              value={stringValue(settings.videoUrl)}
              onChange={(value) => setSetting("videoUrl", value)}
            />
            <MediaField
              label="Poster image"
              value={stringValue(settings.posterUrl)}
              onChange={(value) => setSetting("posterUrl", value)}
            />
            <ToggleField
              label="Autoplay"
              value={booleanValue(settings.autoplay, true)}
              onChange={(value) => setSetting("autoplay", value)}
            />
            <ToggleField
              label="Muted"
              value={booleanValue(settings.muted, true)}
              onChange={(value) => setSetting("muted", value)}
            />
            <ToggleField
              label="Loop"
              value={booleanValue(settings.loop, true)}
              onChange={(value) => setSetting("loop", value)}
            />
            <ToggleField
              label="Controls"
              value={booleanValue(settings.controls, false)}
              onChange={(value) => setSetting("controls", value)}
            />
          </>
        )}

        {block.type === "feature" && (
          <>
            <Field
              label="Title"
              value={stringValue(settings.title)}
              onChange={(value) => setSetting("title", value)}
            />
            <TextAreaField
              label="Text"
              value={stringValue(settings.text)}
              onChange={(value) => setSetting("text", value)}
            />
            <Field
              label="Icon"
              value={stringValue(settings.icon)}
              onChange={(value) => setSetting("icon", value)}
            />
          </>
        )}

        {block.type === "stat" && (
          <>
            <Field
              label="Number"
              value={stringValue(settings.number)}
              onChange={(value) => setSetting("number", value)}
            />
            <Field
              label="Title"
              value={stringValue(settings.title)}
              onChange={(value) => setSetting("title", value)}
            />
            <TextAreaField
              label="Text"
              value={stringValue(settings.text)}
              onChange={(value) => setSetting("text", value)}
            />
          </>
        )}

        {block.type === "review" && (
          <>
            <NumberField
              label="Rating"
              value={numberValue(settings.rating, 5)}
              min={1}
              max={5}
              onChange={(value) => setSetting("rating", value)}
            />
            <TextAreaField
              label="Review"
              value={stringValue(settings.text)}
              onChange={(value) => setSetting("text", value)}
            />
            <Field
              label="Customer name"
              value={stringValue(settings.name)}
              onChange={(value) => setSetting("name", value)}
            />
            <ToggleField
              label="Verified"
              value={booleanValue(settings.verified, true)}
              onChange={(value) => setSetting("verified", value)}
            />
          </>
        )}

        {block.type === "faq" && (
          <>
            <TextAreaField
              label="Question"
              value={stringValue(settings.question)}
              onChange={(value) => setSetting("question", value)}
            />
            <TextAreaField
              label="Answer"
              value={stringValue(settings.answer)}
              onChange={(value) => setSetting("answer", value)}
            />
          </>
        )}
      </div>
    </div>
  );
}

function ThemeSettingsPanel({
  store,
  onChange,
}: {
  store: StoreConfig;
  onChange: (store: StoreConfig) => void;
}) {
  const settings = store.settings;

  return (
    <div>
      <div className="border-b p-4">
        <p className="text-sm font-bold">Theme settings</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Global settings apply across your storefront.
        </p>
      </div>

      <div className="space-y-1 p-3">
        <ColorField
          label="Primary color"
          value={store.primaryColor || "#111827"}
          onChange={(value) =>
            onChange({
              ...store,
              primaryColor: value,
            })
          }
        />

        <ColorField
          label="Accent color"
          value={store.accentColor || "#2563eb"}
          onChange={(value) =>
            onChange({
              ...store,
              accentColor: value,
            })
          }
        />

        <Field
          label="Font family"
          value={store.fontFamily || "Inter"}
          onChange={(value) =>
            onChange({
              ...store,
              fontFamily: value,
            })
          }
        />

        <ToggleField
          label="Sticky header"
          value={Boolean(settings.stickyHeader)}
          onChange={(value) =>
            onChange({
              ...store,
              settings: {
                ...settings,
                stickyHeader: value,
              },
            })
          }
        />

        <ToggleField
          label="Search"
          value={Boolean(settings.showSearch)}
          onChange={(value) =>
            onChange({
              ...store,
              settings: {
                ...settings,
                showSearch: value,
              },
            })
          }
        />

        <ToggleField
          label="Cart"
          value={Boolean(settings.showCartPage)}
          onChange={(value) =>
            onChange({
              ...store,
              settings: {
                ...settings,
                showCartPage: value,
              },
            })
          }
        />

        <ToggleField
          label="Newsletter"
          value={Boolean(settings.showNewsletter)}
          onChange={(value) =>
            onChange({
              ...store,
              settings: {
                ...settings,
                showNewsletter: value,
              },
            })
          }
        />

        <ToggleField
          label="Related products"
          value={Boolean(settings.showRelatedProducts)}
          onChange={(value) =>
            onChange({
              ...store,
              settings: {
                ...settings,
                showRelatedProducts: value,
              },
            })
          }
        />
      </div>
    </div>
  );
}

function CarouselSettings({
  settings,
  onChange,
}: {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="mt-2 rounded-xl border bg-slate-50 p-3">
      <p className="mb-2 text-xs font-bold">Carousel settings</p>

      <ToggleField
        label="Show arrows"
        value={booleanValue(settings.showArrows, true)}
        onChange={(value) => onChange("showArrows", value)}
      />

      <ToggleField
        label="Show dots"
        value={booleanValue(settings.showDots, true)}
        onChange={(value) => onChange("showDots", value)}
      />

      <ToggleField
        label="Autoplay"
        value={booleanValue(settings.autoplay, false)}
        onChange={(value) => onChange("autoplay", value)}
      />

      <ToggleField
        label="Loop slides"
        value={booleanValue(settings.loop, true)}
        onChange={(value) => onChange("loop", value)}
      />

      <NumberField
        label="Autoplay interval"
        value={numberValue(settings.autoplayInterval, 4000)}
        min={1000}
        max={30000}
        step={500}
        onChange={(value) => onChange("autoplayInterval", value)}
      />

      <NumberField
        label="Slides per view"
        value={numberValue(settings.slidesPerView, 4)}
        min={1}
        max={6}
        onChange={(value) => onChange("slidesPerView", value)}
      />

      <NumberField
        label="Gap"
        value={numberValue(settings.gap, 16)}
        min={0}
        max={60}
        onChange={(value) => onChange("gap", value)}
      />
    </div>
  );
}

function AddSectionModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (type: StoreSectionType) => void;
}) {
  const categories = [
    "layout",
    "content",
    "products",
    "media",
    "social",
    "trust",
  ] as const;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-base font-bold">Add section</p>
            <p className="mt-1 text-xs text-slate-500">
              Choose a section to add to your storefront.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100"
          >
            <X size={17} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {categories.map((category) => {
            const definitions = THEME_SECTION_DEFINITIONS.filter(
              (definition) => definition.category === category
            );

            return (
              <div key={category} className="mb-7">
                <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  {formatLabel(category)}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {definitions.map((definition) => (
                    <button
                      key={definition.type}
                      type="button"
                      onClick={() => onSelect(definition.type)}
                      className="rounded-xl border p-4 text-left transition hover:border-slate-950 hover:bg-slate-50"
                    >
                      <p className="text-sm font-bold">
                        {definition.label}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {definition.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PreviewModal({
  store,
  sections,
  onClose,
}: {
  store: StoreConfig;
  sections: StoreSection[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[140] flex flex-col bg-slate-950/70 p-3 backdrop-blur-sm md:p-6">
      <div className="mb-3 flex items-center justify-between text-white">
        <div>
          <p className="text-sm font-bold">{store.name}</p>
          <p className="text-[11px] text-white/60">Store preview</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
        >
          <X size={17} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-white">
        <ThemeStorePreview
          store={store}
          sections={sections}
          selectedSectionId={null}
          onSelectSection={() => undefined}
        />
      </div>
    </div>
  );
}

function ThemeStorePreview({
  store,
  sections,
  selectedSectionId,
  onSelectSection,
}: {
  store: StoreConfig;
  sections: StoreSection[];
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
}) {
  return (
    <div
      className="min-h-full overflow-hidden bg-white text-slate-950"
      style={{
        fontFamily: store.fontFamily || "Inter",
      }}
    >
      <div
        className={`border-b bg-white px-5 py-4 ${
          store.settings.stickyHeader ? "sticky top-0 z-40" : ""
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
          <p className="font-black">{store.name || "Your Store"}</p>

          <nav className="hidden items-center gap-5 text-xs font-semibold sm:flex">
            {(store.navigation || []).slice(0, 5).map((item) => (
              <span key={item.id}>{item.label}</span>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {store.settings.showSearch && (
              <span className="rounded-lg border px-2 py-1 text-[10px]">
                Search
              </span>
            )}
            {store.settings.showCartPage && (
              <span className="rounded-lg border px-2 py-1 text-[10px]">
                Cart
              </span>
            )}
          </div>
        </div>
      </div>

      {sections.map((section) => {
        if (!section.enabled) return null;

        const selected = selectedSectionId === section.id;

        return (
          <PreviewSection
            key={section.id}
            store={store}
            section={section}
            selected={selected}
            onSelect={() => onSelectSection(section.id)}
          />
        );
      })}

      {sections.length === 0 && (
        <div className="flex min-h-[700px] items-center justify-center p-10 text-center">
          <div>
            <p className="text-xl font-black">Your storefront is empty</p>
            <p className="mt-2 text-sm text-slate-500">
              Add sections from the editor.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewSection({
  store,
  section,
  selected,
  onSelect,
}: {
  store: StoreConfig;
  section: StoreSection;
  selected: boolean;
  onSelect: () => void;
}) {
  const settings = getSectionSettings(section);
  const accent = store.accentColor || "#2563eb";
  const primary = store.primaryColor || "#111827";

  const wrapper =
    "relative transition-all " +
    (selected ? "outline outline-2 outline-offset-[-2px]" : "");

  const wrapperStyle = selected
    ? { outlineColor: accent }
    : undefined;

  if (section.type === "announcement") {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full ${wrapper}`}
        style={wrapperStyle}
      >
        <div
          className="px-4 py-2 text-center text-[11px] font-bold"
          style={{
            backgroundColor: stringValue(
              settings.backgroundColor,
              "#111827"
            ),
            color: stringValue(settings.textColor, "#ffffff"),
          }}
        >
          {stringValue(settings.text, "Free shipping on orders over $50")}
        </div>
      </button>
    );
  }

  if (section.type === "hero") {
    const position = stringValue(settings.contentPosition, "left");

    return (
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full text-left ${wrapper}`}
        style={wrapperStyle}
      >
        <div
          className="relative flex min-h-[420px] items-center overflow-hidden bg-slate-900 px-8 py-14 md:px-14"
          style={{
            minHeight: `${numberValue(settings.minHeight, 520)}px`,
          }}
        >
          {stringValue(settings.imageUrl) ? (
            <img
              src={stringValue(settings.imageUrl)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-900 to-black" />
          )}

          {booleanValue(settings.overlay, true) && (
            <div
              className="absolute inset-0 bg-black"
              style={{
                opacity:
                  numberValue(settings.overlayOpacity, 35) / 100,
              }}
            />
          )}

          <div
            className={`relative z-10 w-full ${
              position === "center"
                ? "mx-auto text-center"
                : position === "right"
                ? "ml-auto text-right"
                : "text-left"
            } max-w-2xl`}
          >
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              {store.name}
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">
              {stringValue(
                settings.heading,
                "Your brand starts here"
              )}
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/75 md:text-base">
              {stringValue(
                settings.subheading,
                "Create a storefront that makes your products stand out."
              )}
            </p>

            <span
              className="mt-7 inline-flex rounded-full px-6 py-3 text-xs font-bold text-white"
              style={{ backgroundColor: primary }}
            >
              {stringValue(settings.buttonText, "Shop now")}
            </span>
          </div>
        </div>
      </button>
    );
  }

  if (section.type === "video") {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full text-left ${wrapper}`}
        style={wrapperStyle}
      >
        <div className="relative min-h-[420px] overflow-hidden bg-black">
          {stringValue(settings.videoUrl) ? (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={stringValue(settings.videoUrl)}
              poster={stringValue(settings.posterUrl) || undefined}
              autoPlay={booleanValue(settings.autoplay, true)}
              muted={booleanValue(settings.muted, true)}
              loop={booleanValue(settings.loop, true)}
              controls={booleanValue(settings.controls, false)}
              playsInline
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-black" />
          )}

          {booleanValue(settings.showTextOverlay, true) && (
            <div
              className="absolute inset-0 flex items-center justify-center p-8 text-center"
              style={{
                backgroundColor: `rgba(0,0,0,${
                  numberValue(settings.overlayOpacity, 40) / 100
                })`,
              }}
            >
              <div className="max-w-2xl text-white">
                {stringValue(settings.heading) && (
                  <h2 className="text-4xl font-black">
                    {stringValue(settings.heading)}
                  </h2>
                )}

                {stringValue(settings.text) && (
                  <p className="mt-4 text-sm leading-7 text-white/80">
                    {stringValue(settings.text)}
                  </p>
                )}

                {stringValue(settings.buttonText) && (
                  <span
                    className="mt-6 inline-flex rounded-full px-6 py-3 text-xs font-bold"
                    style={{ backgroundColor: accent }}
                  >
                    {stringValue(settings.buttonText)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </button>
    );
  }

  if (
    section.type === "featured-products" ||
    section.type === "related-products" ||
    section.type === "product-gallery"
  ) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full text-left ${wrapper}`}
        style={wrapperStyle}
      >
        <div className="bg-white px-6 py-14 md:px-10">
          <PreviewHeading
            title={stringValue(
              settings.title,
              section.type === "related-products"
                ? "You may also like"
                : "Featured products"
            )}
            text={stringValue(settings.text)}
          />

          <div
            className="mt-9 grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${Math.min(
                numberValue(settings.columns, 4),
                4
              )}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({
              length: Math.min(
                numberValue(settings.productsCount, 4),
                8
              ),
            }).map((_, index) => (
              <div key={index}>
                <div className="aspect-square rounded-xl bg-slate-100" />
                <div className="mt-3 h-3 w-2/3 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </button>
    );
  }

  if (section.type === "image-text") {
    const imageFirst =
      stringValue(settings.imagePosition, "left") === "left";

    return (
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full text-left ${wrapper}`}
        style={wrapperStyle}
      >
        <div
          className={`grid items-center gap-10 bg-slate-50 px-6 py-14 md:grid-cols-2 md:px-10 ${
            imageFirst ? "" : "md:[&>div:first-child]:order-2"
          }`}
        >
          {stringValue(settings.imageUrl) ? (
            <img
              src={stringValue(settings.imageUrl)}
              alt=""
              className="aspect-[4/3] w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="aspect-[4/3] rounded-2xl bg-slate-200" />
          )}

          <div>
            <h2 className="text-3xl font-black">
              {stringValue(
                settings.heading,
                "Tell your brand story"
              )}
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              {stringValue(
                settings.text,
                "Use this section to explain what makes your store different."
              )}
            </p>

            {stringValue(settings.buttonText) && (
              <span
                className="mt-6 inline-flex rounded-lg px-5 py-3 text-xs font-bold text-white"
                style={{ backgroundColor: primary }}
              >
                {stringValue(settings.buttonText)}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  if (
    section.type === "benefits" ||
    section.type === "trust-badges" ||
    section.type === "how-it-works"
  ) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full text-left ${wrapper}`}
        style={wrapperStyle}
      >
        <div className="bg-white px-6 py-14 md:px-10">
          <PreviewHeading
            centered
            title={stringValue(
              settings.title,
              section.type === "how-it-works"
                ? "How it works"
                : "Why shop with us"
            )}
            text={stringValue(settings.text)}
          />

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {(section.blocks || []).length > 0
              ? (section.blocks || []).map((block) => {
                  const blockSettings = getBlockSettings(block);

                  return (
                    <div
                      key={block.id}
                      className="rounded-2xl border bg-white p-6"
                    >
                      <p className="text-xs font-black text-slate-400">
                        {stringValue(blockSettings.number, "01")}
                      </p>
                      <h3 className="mt-3 font-bold">
                        {stringValue(
                          blockSettings.title,
                          "Feature"
                        )}
                      </h3>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {stringValue(
                          blockSettings.text,
                          "Editable description."
                        )}
                      </p>
                    </div>
                  );
                })
              : ["Secure checkout", "Fast delivery", "Support"].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-2xl border p-6 text-center"
                    >
                      <div className="mx-auto h-9 w-9 rounded-full bg-slate-100" />
                      <p className="mt-4 text-sm font-bold">{item}</p>
                    </div>
                  )
                )}
          </div>
        </div>
      </button>
    );
  }

  if (
    section.type === "reviews" ||
    section.type === "testimonials"
  ) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full text-left ${wrapper}`}
        style={wrapperStyle}
      >
        <div className="bg-slate-50 px-6 py-14 md:px-10">
          <PreviewHeading
            centered
            title={stringValue(
              settings.title,
              "What customers say"
            )}
            text={stringValue(settings.text)}
          />

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="text-sm tracking-widest">
                  ★★★★★
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Customer review content will appear here.
                </p>
                <p className="mt-5 text-xs font-bold">
                  Verified customer
                </p>
              </div>
            ))}
          </div>
        </div>
      </button>
    );
  }

  if (section.type === "faq") {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full text-left ${wrapper}`}
        style={wrapperStyle}
      >
        <div className="bg-white px-6 py-14 md:px-10">
          <PreviewHeading
            title={stringValue(
              settings.title,
              "Frequently asked questions"
            )}
            text={stringValue(settings.text)}
          />

          <div className="mt-8 divide-y rounded-2xl border">
            {(section.blocks || []).map((block) => {
              const blockSettings = getBlockSettings(block);

              return (
                <div
                  key={block.id}
                  className="flex items-center justify-between px-5 py-5 text-sm font-semibold"
                >
                  <span>
                    {stringValue(
                      blockSettings.question,
                      "Your question"
                    )}
                  </span>
                  <span>+</span>
                </div>
              );
            })}
          </div>
        </div>
      </button>
    );
  }

  if (section.type === "newsletter") {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full text-left ${wrapper}`}
        style={wrapperStyle}
      >
        <div
          className="px-6 py-14 text-white md:px-10"
          style={{
            backgroundColor: stringValue(
              settings.backgroundColor,
              "#111827"
            ),
          }}
        >
          <PreviewHeading
            centered
            light
            title={stringValue(settings.title, "Stay in the loop")}
            text={stringValue(settings.text)}
          />

          <div className="mx-auto mt-7 flex max-w-lg gap-2">
            <div className="h-11 flex-1 rounded-lg bg-white/10" />
            <div
              className="h-11 w-28 rounded-lg"
              style={{ backgroundColor: accent }}
            />
          </div>
        </div>
      </button>
    );
  }

  if (section.type === "footer") {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full text-left ${wrapper}`}
        style={wrapperStyle}
      >
        <footer
          className="px-6 py-12 md:px-10"
          style={{
            backgroundColor: stringValue(
              settings.backgroundColor,
              "#111827"
            ),
            color: stringValue(settings.textColor, "#ffffff"),
          }}
        >
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <p className="font-black">{store.name}</p>
              <p className="mt-3 text-xs leading-5 opacity-60">
                {store.description ||
                  "Important store information and customer links."}
              </p>
            </div>

            {["Shop", "Customer Care", "Policies"].map((group) => (
              <div key={group}>
                <p className="text-xs font-bold uppercase tracking-wider opacity-60">
                  {group}
                </p>
                <div className="mt-3 space-y-2 text-xs opacity-75">
                  <p>Store link</p>
                  <p>Store link</p>
                  <p>Store link</p>
                </div>
              </div>
            ))}
          </div>
        </footer>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`block w-full text-left ${wrapper}`}
      style={wrapperStyle}
    >
      <div className="bg-white px-6 py-14 md:px-10">
        <PreviewHeading
          title={stringValue(
            settings.title,
            formatLabel(section.type)
          )}
          text={stringValue(settings.text)}
        />
      </div>
    </button>
  );
}

function PreviewHeading({
  title,
  text,
  centered = false,
  light = false,
}: {
  title: string;
  text: string;
  centered?: boolean;
  light?: boolean;
}) {
  return (
    <div
      className={
        centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"
      }
    >
      <h2
        className={`text-3xl font-black tracking-tight ${
          light ? "text-white" : "text-slate-950"
        }`}
      >
        {title}
      </h2>

      {text && (
        <p
          className={`mt-3 text-sm leading-6 ${
            light ? "text-slate-300" : "text-slate-500"
          }`}
        >
          {text}
        </p>
      )}
    </div>
  );
}

function EditorSubHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="relative flex h-14 items-center gap-2 border-b px-3">
      <button
        type="button"
        onClick={onBack}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
      >
        <ChevronLeft size={17} />
      </button>

      <p className="flex-1 text-sm font-bold">{title}</p>

      {right}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-xl p-2 hover:bg-slate-50">
      <span className="mb-1.5 block text-[11px] font-bold text-slate-700">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-slate-500"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-xl p-2 hover:bg-slate-50">
      <span className="mb-1.5 block text-[11px] font-bold text-slate-700">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-5 outline-none transition focus:border-slate-500"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-xl p-2 hover:bg-slate-50">
      <span className="mb-1.5 block text-[11px] font-bold text-slate-700">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-slate-500"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-xl p-2 hover:bg-slate-50">
      <span className="mb-1.5 block text-[11px] font-bold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-slate-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-xl p-2 hover:bg-slate-50">
      <span className="mb-1.5 block text-[11px] font-bold text-slate-700">
        {label}
      </span>

      <div className="flex gap-2">
        <input
          type="color"
          value={isColor(value) ? value : "#111827"}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-11 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
        />

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-slate-500"
        />
      </div>
    </label>
  );
}

function MediaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-xl p-2 hover:bg-slate-50">
      <span className="mb-1.5 block text-[11px] font-bold text-slate-700">
        {label}
      </span>

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://..."
          className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-slate-500"
        />

        <button
          type="button"
          className="flex h-9 shrink-0 items-center gap-1 rounded-lg border px-2 text-[10px] font-bold text-slate-500 hover:bg-slate-50"
          title="Media upload will connect to store storage"
        >
          <Upload size={12} />
        </button>
      </div>
    </label>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-xl p-2 text-left hover:bg-slate-50"
    >
      <span className="text-[11px] font-bold text-slate-700">
        {label}
      </span>

      <span
        className={`flex h-6 w-10 items-center rounded-full p-0.5 transition ${
          value ? "bg-slate-950" : "bg-slate-200"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition ${
            value ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function isTextSetting(
  type: StoreSectionType,
  setting: "heading" | "title" | "text" | "subheading"
) {
  if (type === "announcement") {
    return setting === "text";
  }

  if (type === "hero") {
    return (
      setting === "heading" ||
      setting === "subheading"
    );
  }

  return setting === "title" || setting === "text";
}

function isProductSection(type: StoreSectionType) {
  return (
    type === "featured-products" ||
    type === "related-products" ||
    type === "product-gallery"
  );
}

function isCarouselSection(type: StoreSectionType) {
  return (
    type === "product-gallery" ||
    type === "testimonials" ||
    type === "reviews"
  );
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function isColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function formatLabel(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}