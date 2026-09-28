import { ChevronLeft, ChevronRight } from "lucide-react";

interface ThemeCarouselSettingsProps {
  showArrows: boolean;
  showDots: boolean;
  autoplay: boolean;
  loop: boolean;
  autoplayInterval: number;
  slidesPerView: number;
  gap: number;
  onChange: (
    key:
      | "showArrows"
      | "showDots"
      | "autoplay"
      | "loop"
      | "autoplayInterval"
      | "slidesPerView"
      | "gap",
    value: boolean | number
  ) => void;
}

export default function ThemeCarouselSettings({
  showArrows,
  showDots,
  autoplay,
  loop,
  autoplayInterval,
  slidesPerView,
  gap,
  onChange,
}: ThemeCarouselSettingsProps) {
  return (
    <div className="rounded-xl border bg-slate-50 p-3">
      <div className="mb-3">
        <p className="text-xs font-bold">Slider / carousel</p>
        <p className="mt-1 text-[10px] leading-4 text-slate-500">
          Control arrows, dots, autoplay, looping and visible slides.
        </p>
      </div>

      <Toggle
        label="Left / right arrows"
        value={showArrows}
        onChange={(value) => onChange("showArrows", value)}
      />

      <Toggle
        label="Pagination dots"
        value={showDots}
        onChange={(value) => onChange("showDots", value)}
      />

      <Toggle
        label="Automatic sliding"
        value={autoplay}
        onChange={(value) => onChange("autoplay", value)}
      />

      <Toggle
        label="Loop slides"
        value={loop}
        onChange={(value) => onChange("loop", value)}
      />

      <Number
        label="Autoplay interval (ms)"
        value={autoplayInterval}
        min={1000}
        max={30000}
        step={500}
        onChange={(value) => onChange("autoplayInterval", value)}
      />

      <Number
        label="Slides visible"
        value={slidesPerView}
        min={1}
        max={6}
        onChange={(value) => onChange("slidesPerView", value)}
      />

      <Number
        label="Gap"
        value={gap}
        min={0}
        max={80}
        onChange={(value) => onChange("gap", value)}
      />

      <div className="mt-3 flex items-center justify-between rounded-lg bg-white p-2">
        <span className="text-[10px] font-bold text-slate-500">
          Arrow preview
        </span>

        <div className="flex gap-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border">
            <ChevronLeft size={13} />
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border">
            <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}

function Toggle({
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
      className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-left"
    >
      <span className="text-[10px] font-semibold text-slate-700">
        {label}
      </span>

      <span
        className={`flex h-5 w-9 items-center rounded-full p-0.5 ${
          value ? "bg-slate-950" : "bg-slate-200"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow transition ${
            value ? "translate-x-4" : ""
          }`}
        />
      </span>
    </button>
  );
}

function Number({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block py-2">
      <span className="mb-1 block text-[10px] font-semibold text-slate-600">
        {label}
      </span>

      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
        className="h-8 w-full rounded-lg border bg-white px-2 text-[10px] outline-none focus:border-slate-500"
      />
    </label>
  );
}