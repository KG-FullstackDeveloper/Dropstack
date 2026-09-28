import {
  ChevronDown,
  ChevronLeft,
  Image as ImageIcon,
  Link,
  Play,
  Settings2,
  Type,
  Video,
} from "lucide-react";

import type {
  StoreBlock,
  StoreConfig,
  StoreSection,
} from "../../types/store";

interface ThemeEditorSettingsProps {
  store: StoreConfig;
  section?: StoreSection;
  block?: StoreBlock;

  onClose: () => void;

  onUpdateSection: (
    id: string,
    patch: Partial<StoreSection>
  ) => void;

  onUpdateSectionSettings: (
    id: string,
    settings: Record<string, unknown>
  ) => void;

  onUpdateBlock: (
    id: string,
    patch: Partial<StoreBlock>
  ) => void;

  onUpdateBlockSettings: (
    id: string,
    settings: Record<string, unknown>
  ) => void;
}

export default function ThemeEditorSettings({
  store,
  section,
  block,
  onClose,
  onUpdateSection,
  onUpdateSectionSettings,
  onUpdateBlock,
  onUpdateBlockSettings,
}: ThemeEditorSettingsProps) {
  if (!section) {
    return (
      <aside className="hidden w-[330px] shrink-0 flex-col border-l bg-white xl:flex">
        <div className="border-b px-5 py-4">
          <p className="text-sm font-bold">Theme settings</p>
        </div>

        <ThemeSettings store={store} />
      </aside>
    );
  }

  return (
    <aside className="flex w-[330px] shrink-0 flex-col border-l bg-white">
      <div className="flex h-14 items-center border-b px-4">
        <button
          type="button"
          onClick={onClose}
          className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100"
        >
          <ChevronLeft size={17} />
        </button>

        <div>
          <p className="text-sm font-bold">
            {block
              ? block.label || formatLabel(block.type)
              : section.label || formatLabel(section.type)}
          </p>

          <p className="text-[10px] text-slate-500">
            {block ? "Block settings" : "Section settings"}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {block ? (
          <BlockSettings
            block={block}
            onUpdate={onUpdateBlock}
            onUpdateSettings={onUpdateBlockSettings}
          />
        ) : (
          <SectionSettings
            section={section}
            onUpdate={onUpdateSection}
            onUpdateSettings={onUpdateSectionSettings}
          />
        )}
      </div>
    </aside>
  );
}

function SectionSettings({
  section,
  onUpdate,
  onUpdateSettings,
}: {
  section: StoreSection;
  onUpdate: (
    id: string,
    patch: Partial<StoreSection>
  ) => void;
  onUpdateSettings: (
    id: string,
    settings: Record<string, unknown>
  ) => void;
}) {
  const settings = section.settings || {};

  return (
    <div>
      <SettingsGroup title="Content" defaultOpen>
        <TextField
          label="Heading"
          value={String(
            settings.heading || settings.title || ""
          )}
          onChange={(value) =>
            onUpdateSettings(section.id, {
              heading: value,
            })
          }
        />

        <TextAreaField
          label="Text"
          value={String(
            settings.subheading ||
              settings.text ||
              ""
          )}
          onChange={(value) =>
            onUpdateSettings(section.id, {
              subheading: value,
            })
          }
        />

        <TextField
          label="Button text"
          value={String(
            settings.buttonText || ""
          )}
          onChange={(value) =>
            onUpdateSettings(section.id, {
              buttonText: value,
            })
          }
        />

        <TextField
          label="Button link"
          value={String(
            settings.buttonUrl || ""
          )}
          onChange={(value) =>
            onUpdateSettings(section.id, {
              buttonUrl: value,
            })
          }
        />
      </SettingsGroup>

      {(section.type === "slideshow" ||
        section.type === "featured-products" ||
        section.type === "testimonials" ||
        section.type === "collections") && (
        <SettingsGroup
          title="Carousel"
          defaultOpen
        >
          <ToggleField
            label="Enable sliding"
            value={Boolean(
              section.slider?.enabled
            )}
            onChange={(value) =>
              onUpdate(section.id, {
                slider: {
                  ...section.slider,
                  enabled: value,
                },
              })
            }
          />

          <ToggleField
            label="Auto slide"
            value={Boolean(
              section.slider?.autoplay
            )}
            onChange={(value) =>
              onUpdate(section.id, {
                slider: {
                  ...section.slider,
                  autoplay: value,
                },
              })
            }
          />

          <NumberField
            label="Slide interval"
            value={
              section.slider?.interval || 5000
            }
            suffix="ms"
            onChange={(value) =>
              onUpdate(section.id, {
                slider: {
                  ...section.slider,
                  interval: value,
                },
              })
            }
          />

          <ToggleField
            label="Show arrows"
            value={
              section.slider?.showArrows ?? true
            }
            onChange={(value) =>
              onUpdate(section.id, {
                slider: {
                  ...section.slider,
                  showArrows: value,
                },
              })
            }
          />

          <ToggleField
            label="Show dots"
            value={
              section.slider?.showDots ?? true
            }
            onChange={(value) =>
              onUpdate(section.id, {
                slider: {
                  ...section.slider,
                  showDots: value,
                },
              })
            }
          />

          <ToggleField
            label="Pause on hover"
            value={
              section.slider?.pauseOnHover ?? true
            }
            onChange={(value) =>
              onUpdate(section.id, {
                slider: {
                  ...section.slider,
                  pauseOnHover: value,
                },
              })
            }
          />

          <ToggleField
            label="Loop slides"
            value={
              section.slider?.loop ?? true
            }
            onChange={(value) =>
              onUpdate(section.id, {
                slider: {
                  ...section.slider,
                  loop: value,
                },
              })
            }
          />

          <SelectField
            label="Transition"
            value={
              section.slider?.transition ||
              "slide"
            }
            options={[
              {
                label: "Slide",
                value: "slide",
              },
              {
                label: "Fade",
                value: "fade",
              },
            ]}
            onChange={(value) =>
              onUpdate(section.id, {
                slider: {
                  ...section.slider,
                  transition:
                    value as "slide" | "fade",
                },
              })
            }
          />
        </SettingsGroup>
      )}

      <SettingsGroup title="Layout">
        <SelectField
          label="Content alignment"
          value={String(
            settings.alignment || "left"
          )}
          options={[
            {
              label: "Left",
              value: "left",
            },
            {
              label: "Center",
              value: "center",
            },
            {
              label: "Right",
              value: "right",
            },
          ]}
          onChange={(value) =>
            onUpdateSettings(section.id, {
              alignment: value,
            })
          }
        />

        <NumberField
          label="Section spacing"
          value={Number(
            settings.sectionSpacing || 64
          )}
          suffix="px"
          onChange={(value) =>
            onUpdateSettings(section.id, {
              sectionSpacing: value,
            })
          }
        />

        <NumberField
          label="Border radius"
          value={Number(
            settings.borderRadius || 0
          )}
          suffix="px"
          onChange={(value) =>
            onUpdateSettings(section.id, {
              borderRadius: value,
            })
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Background">
        <ColorField
          label="Background color"
          value={String(
            settings.backgroundColor ||
              "#ffffff"
          )}
          onChange={(value) =>
            onUpdateSettings(section.id, {
              backgroundColor: value,
            })
          }
        />

        <ColorField
          label="Text color"
          value={String(
            settings.textColor ||
              "#111827"
          )}
          onChange={(value) =>
            onUpdateSettings(section.id, {
              textColor: value,
            })
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Animation">
        <ToggleField
          label="Enable animation"
          value={
            section.animation?.enabled ?? false
          }
          onChange={(value) =>
            onUpdate(section.id, {
              animation: {
                ...section.animation,
                enabled: value,
              },
            })
          }
        />

        <SelectField
          label="Entrance"
          value={
            section.animation?.entrance ||
            "none"
          }
          options={[
            {
              label: "None",
              value: "none",
            },
            {
              label: "Fade",
              value: "fade",
            },
            {
              label: "Slide up",
              value: "slide-up",
            },
            {
              label: "Slide left",
              value: "slide-left",
            },
            {
              label: "Slide right",
              value: "slide-right",
            },
            {
              label: "Zoom",
              value: "zoom",
            },
          ]}
          onChange={(value) =>
            onUpdate(section.id, {
              animation: {
                ...section.animation,
                entrance:
                  value as NonNullable<
                    typeof section.animation
                  >["entrance"],
              },
            })
          }
        />
      </SettingsGroup>
    </div>
  );
}

function BlockSettings({
  block,
  onUpdate,
  onUpdateSettings,
}: {
  block: StoreBlock;
  onUpdate: (
    id: string,
    patch: Partial<StoreBlock>
  ) => void;
  onUpdateSettings: (
    id: string,
    settings: Record<string, unknown>
  ) => void;
}) {
  const settings = block.settings || {};

  return (
    <div>
      <SettingsGroup title="Content" defaultOpen>
        {(block.type === "heading" ||
          block.type === "text" ||
          block.type === "rich-text") && (
          <TextAreaField
            label="Text"
            value={String(
              settings.text || ""
            )}
            onChange={(value) =>
              onUpdateSettings(block.id, {
                text: value,
              })
            }
          />
        )}

        {block.type === "button" && (
          <>
            <TextField
              label="Button text"
              value={String(
                settings.text || ""
              )}
              onChange={(value) =>
                onUpdateSettings(block.id, {
                  text: value,
                })
              }
            />

            <TextField
              label="Link"
              value={String(
                settings.url || ""
              )}
              onChange={(value) =>
                onUpdateSettings(block.id, {
                  url: value,
                })
              }
            />
          </>
        )}

        {block.type === "image" && (
          <>
            <MediaField
              label="Image"
              icon={<ImageIcon size={15} />}
              value={String(
                settings.src || ""
              )}
              onChange={(value) =>
                onUpdateSettings(block.id, {
                  src: value,
                })
              }
            />

            <TextField
              label="Alt text"
              value={String(
                settings.alt || ""
              )}
              onChange={(value) =>
                onUpdateSettings(block.id, {
                  alt: value,
                })
              }
            />

            <TextField
              label="Link"
              value={String(
                settings.link || ""
              )}
              onChange={(value) =>
                onUpdateSettings(block.id, {
                  link: value,
                })
              }
            />
          </>
        )}

        {block.type === "video" && (
          <>
            <MediaField
              label="Video"
              icon={<Video size={15} />}
              value={String(
                settings.src || ""
              )}
              onChange={(value) =>
                onUpdateSettings(block.id, {
                  src: value,
                })
              }
            />

            <ToggleField
              label="Autoplay"
              value={Boolean(
                settings.autoplay
              )}
              onChange={(value) =>
                onUpdateSettings(block.id, {
                  autoplay: value,
                })
              }
            />

            <ToggleField
              label="Muted"
              value={
                settings.muted !== false
              }
              onChange={(value) =>
                onUpdateSettings(block.id, {
                  muted: value,
                })
              }
            />

            <ToggleField
              label="Loop"
              value={Boolean(
                settings.loop
              )}
              onChange={(value) =>
                onUpdateSettings(block.id, {
                  loop: value,
                })
              }
            />
          </>
        )}

        {block.type === "slide" && (
          <>
            <TextField
              label="Heading"
              value={String(
                settings.heading || ""
              )}
              onChange={(value) =>
                onUpdateSettings(block.id, {
                  heading: value,
                })
              }
            />

            <TextAreaField
              label="Text"
              value={String(
                settings.text || ""
              )}
              onChange={(value) =>
                onUpdateSettings(block.id, {
                  text: value,
                })
              }
            />

            <MediaField
              label="Slide image"
              icon={<ImageIcon size={15} />}
              value={String(
                settings.image || ""
              )}
              onChange={(value) =>
                onUpdateSettings(block.id, {
                  image: value,
                })
              }
            />

            <TextField
              label="Button text"
              value={String(
                settings.buttonText || ""
              )}
              onChange={(value) =>
                onUpdateSettings(block.id, {
                  buttonText: value,
                })
              }
            />

            <TextField
              label="Button link"
              value={String(
                settings.buttonUrl || ""
              )}
              onChange={(value) =>
                onUpdateSettings(block.id, {
                  buttonUrl: value,
                })
              }
            />
          </>
        )}
      </SettingsGroup>

      <SettingsGroup title="Visibility">
        <ToggleField
          label="Show block"
          value={block.enabled}
          onChange={(value) =>
            onUpdate(block.id, {
              enabled: value,
            })
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Link">
        <TextField
          label="Link URL"
          value={String(
            settings.url || ""
          )}
          onChange={(value) =>
            onUpdateSettings(block.id, {
              url: value,
            })
          }
        />

        <ToggleField
          label="Open in new tab"
          value={Boolean(
            settings.openNewTab
          )}
          onChange={(value) =>
            onUpdateSettings(block.id, {
              openNewTab: value,
            })
          }
        />
      </SettingsGroup>
    </div>
  );
}

function ThemeSettings({
  store,
}: {
  store: StoreConfig;
}) {
  return (
    <div className="p-4">
      <div className="rounded-xl border p-4">
        <div className="flex items-center gap-2">
          <Settings2 size={16} />
          <span className="text-sm font-bold">
            Global theme settings
          </span>
        </div>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Global settings will control the entire
          storefront.
        </p>
      </div>

      <div className="mt-4 rounded-xl border p-4">
        <p className="text-xs font-bold">
          Brand colors
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg"
            style={{
              backgroundColor:
                store.primaryColor ||
                "#111827",
            }}
          />

          <div>
            <p className="text-xs font-semibold">
              Primary
            </p>

            <p className="text-[10px] text-slate-500">
              {store.primaryColor ||
                "#111827"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg"
            style={{
              backgroundColor:
                store.accentColor ||
                "#2563eb",
            }}
          />

          <div>
            <p className="text-xs font-semibold">
              Accent
            </p>

            <p className="text-[10px] text-slate-500">
              {store.accentColor ||
                "#2563eb"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsGroup({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="border-b"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-xs font-bold">
        {title}
        <ChevronDown size={14} />
      </summary>

      <div className="space-y-4 px-5 pb-5">
        {children}
      </div>
    </details>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-600">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 w-full rounded-lg border bg-white px-3 text-xs outline-none transition focus:border-slate-500"
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
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-600">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={4}
        className="w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-xs outline-none transition focus:border-slate-500"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-600">
        {label}
      </span>

      <div className="flex items-center">
        <input
          type="number"
          value={value}
          onChange={(event) =>
            onChange(Number(event.target.value))
          }
          className="h-10 w-full rounded-lg border bg-white px-3 text-xs outline-none focus:border-slate-500"
        />

        {suffix && (
          <span className="-ml-10 text-[10px] text-slate-400">
            {suffix}
          </span>
        )}
      </div>
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
  options: {
    label: string;
    value: string;
  }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-600">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 w-full rounded-lg border bg-white px-3 text-xs outline-none focus:border-slate-500"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
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
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-xs font-medium">
        {label}
      </span>

      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${
          value ? "bg-slate-950" : "bg-slate-200"
        }`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            value ? "left-6" : "left-1"
          }`}
        />
      </button>
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
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-600">
        {label}
      </span>

      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-10 w-12 cursor-pointer rounded-lg border bg-white p-1"
        />

        <input
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-10 min-w-0 flex-1 rounded-lg border px-3 text-xs"
        />
      </div>
    </label>
  );
}

function MediaField({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-600">
        {label}
      </span>

      <button
        type="button"
        className="flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-slate-50 text-xs font-semibold hover:bg-slate-100"
      >
        {icon}
        Choose media
      </button>

      {value && (
        <input
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder="Media URL"
          className="mt-2 h-9 w-full rounded-lg border px-3 text-xs"
        />
      )}
    </div>
  );
}

function formatLabel(type: string) {
  return type
    .split("-")
    .map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}