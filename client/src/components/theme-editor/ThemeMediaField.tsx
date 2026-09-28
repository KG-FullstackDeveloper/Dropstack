import { Image as ImageIcon, Upload } from "lucide-react";

interface ThemeMediaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function ThemeMediaField({
  label,
  value,
  onChange,
}: ThemeMediaFieldProps) {
  return (
    <div className="rounded-xl p-2">
      <label className="mb-1.5 block text-[11px] font-bold text-slate-700">
        {label}
      </label>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {value ? (
          <div className="relative aspect-video bg-slate-100">
            <img
              src={value}
              alt=""
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-[9px] font-bold shadow">
              <ImageIcon size={11} />
              Media
            </div>
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-slate-50 text-slate-400">
            <div className="text-center">
              <ImageIcon className="mx-auto" size={22} />
              <p className="mt-2 text-[10px]">No media selected</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 border-t p-2">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste media URL"
            className="h-8 min-w-0 flex-1 rounded-lg border px-2 text-[10px] outline-none focus:border-slate-500"
          />

          <button
            type="button"
            className="flex h-8 items-center gap-1 rounded-lg border px-2 text-[10px] font-bold hover:bg-slate-50"
          >
            <Upload size={12} />
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}