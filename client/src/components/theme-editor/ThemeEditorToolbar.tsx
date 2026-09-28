import {
  Eye,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import type { ThemeEditorDevice } from "./ThemeEditorTypes";

interface ThemeEditorToolbarProps {
  device: ThemeEditorDevice;
  onDeviceChange: (device: ThemeEditorDevice) => void;
  onPreview: () => void;
}

export default function ThemeEditorToolbar({
  device,
  onDeviceChange,
  onPreview,
}: ThemeEditorToolbarProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border bg-slate-50 p-1">
      <DeviceButton
        active={device === "desktop"}
        label="Desktop"
        onClick={() => onDeviceChange("desktop")}
      >
        <Monitor size={15} />
      </DeviceButton>

      <DeviceButton
        active={device === "tablet"}
        label="Tablet"
        onClick={() => onDeviceChange("tablet")}
      >
        <Tablet size={15} />
      </DeviceButton>

      <DeviceButton
        active={device === "mobile"}
        label="Mobile"
        onClick={() => onDeviceChange("mobile")}
      >
        <Smartphone size={15} />
      </DeviceButton>

      <button
        type="button"
        onClick={onPreview}
        className="ml-1 flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold text-slate-600 hover:bg-white hover:text-slate-950"
      >
        <Eye size={14} />
        Preview
      </button>
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
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-400 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}