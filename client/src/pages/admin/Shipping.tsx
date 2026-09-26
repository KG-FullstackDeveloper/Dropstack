import { Globe2, Truck } from "lucide-react";

const regions = [
  {
    region: "Nigeria",
    code: "NG",
    delivery: "6–10 days",
  },
  {
    region: "Ghana",
    code: "GH",
    delivery: "6–10 days",
  },
  {
    region: "South Africa",
    code: "ZA",
    delivery: "6–10 days",
  },
  {
    region: "United States",
    code: "US",
    delivery: "10–14 days",
  },
  {
    region: "United Kingdom",
    code: "GB",
    delivery: "10–14 days",
  },
  {
    region: "Australia",
    code: "AU",
    delivery: "10–14 days",
  },
];

export default function Shipping() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-950">
        Shipping
      </h1>

      <p className="mt-2 text-slate-500">
        Manage delivery regions and shipping times.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <Globe2 size={21} />

            <div>
              <h2 className="font-bold">
                Delivery regions
              </h2>

              <p className="text-sm text-slate-500">
                Current customer-facing delivery estimates.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {regions.map((region) => (
            <div
              key={region.code}
              className="flex items-center justify-between p-5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Truck size={18} />
                </div>

                <div>
                  <p className="font-semibold">
                    {region.region}
                  </p>

                  <p className="text-xs text-slate-500">
                    {region.code}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold">
                {region.delivery}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}