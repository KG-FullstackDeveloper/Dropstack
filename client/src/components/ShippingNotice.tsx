import {
  Clock3,
  ShieldCheck,
} from "lucide-react";

interface ShippingNoticeProps {
  deliveryTime?: string;
  country?: string;
}

export default function ShippingNotice({
  deliveryTime,
  country,
}: ShippingNoticeProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex gap-3">
        <div className="mt-0.5 shrink-0">
          <Clock3
            size={18}
            className="text-slate-700 dark:text-slate-200"
          />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            {deliveryTime ||
              "Delivery time confirmed at checkout"}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Delivery availability is based
            on your shipping destination
            {country
              ? ` (${country})`
              : ""}.
          </p>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <ShieldCheck size={15} />
            <span>
              Shipping updates will be
              provided after fulfillment.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}