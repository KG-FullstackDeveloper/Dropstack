import { ChevronDown, Store } from "lucide-react";

export type AdminStoreOption = {
  id: string;
  name: string;
};

export function StoreSelector({
  stores,
  selectedStoreId,
  onChange,
}: {
  stores: AdminStoreOption[];
  selectedStoreId: string;
  onChange: (storeId: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
        Store
      </span>
      <div className="relative">
        <Store
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <select
          value={selectedStoreId}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
        >
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </label>
  );
}
