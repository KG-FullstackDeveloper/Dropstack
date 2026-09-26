import {
  Box,
  Package,
  AlertTriangle,
} from "lucide-react";

import { products } from "../../data/products";

export default function Inventory() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-950">
        Inventory
      </h1>

      <p className="mt-2 text-slate-500">
        Monitor your products and supplier inventory.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <Card
          icon={Package}
          title="Products"
          value={String(products.length)}
        />

        <Card
          icon={Box}
          title="Active products"
          value={String(products.filter((p) => p.active).length)}
        />

        <Card
          icon={AlertTriangle}
          title="Low inventory"
          value="0"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-6">
          <h2 className="font-bold">
            Inventory
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Products currently available in your catalog.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 p-5"
            >
              <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-100">
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="flex-1">
                <p className="font-semibold">
                  {product.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Supplier: {product.supplier_name}
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Package;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <Icon size={20} />

      <p className="mt-5 text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}