import {
Search,
SlidersHorizontal,
X,
} from "lucide-react";

export type CatalogSort =
| "featured"
| "price-low"
| "price-high"
| "name";

interface StoreCatalogControlsProps {
search: string;
category: string;
sort: CatalogSort;
categories: string[];
resultCount: number;
onSearchChange: (value: string) => void;
onCategoryChange: (value: string) => void;
onSortChange: (value: CatalogSort) => void;
onClear: () => void;
}

export default function StoreCatalogControls({
search,
category,
sort,
categories,
resultCount,
onSearchChange,
onCategoryChange,
onSortChange,
onClear,
}: StoreCatalogControlsProps) {
const hasFilters =
search.trim().length > 0 ||
category !== "all" ||
sort !== "featured";

return (
<div className="mb-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
<div className="flex flex-col gap-4 lg:flex-row lg:items-center">
<div className="relative min-w-0 flex-1">
<Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

      <input
        type="search"
        value={search}
        onChange={(event) =>
          onSearchChange(event.target.value)
        }
        placeholder="Search products..."
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-950/10"
      />

      {search && (
        <button
          type="button"
          onClick={() => onSearchChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-950"
        >
          <X size={15} />
        </button>
      )}
    </div>

    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative">
        <SlidersHorizontal
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <select
          value={category}
          onChange={(event) =>
            onCategoryChange(
              event.target.value,
            )
          }
          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10 sm:w-48"
        >
          <option value="all">
            All categories
          </option>

          {categories.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ),
          )}
        </select>
      </div>

      <select
        value={sort}
        onChange={(event) =>
          onSortChange(
            event.target.value as CatalogSort,
          )
        }
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10 sm:w-48"
      >
        <option value="featured">
          Featured
        </option>

        <option value="price-low">
          Price: Low to high
        </option>

        <option value="price-high">
          Price: High to low
        </option>

        <option value="name">
          Name: A to Z
        </option>
      </select>
    </div>
  </div>

  <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
    <p className="text-sm text-slate-500">
      {resultCount}{" "}
      {resultCount === 1
        ? "product"
        : "products"}
    </p>

    {hasFilters && (
      <button
        type="button"
        onClick={onClear}
        className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
      >
        Clear filters
      </button>
    )}
  </div>
</div>

);
}