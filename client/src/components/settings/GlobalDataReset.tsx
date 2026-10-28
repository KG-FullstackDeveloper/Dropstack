import { useState } from "react";
import { AlertTriangle, LoaderCircle, ShieldCheck } from "lucide-react";
import { apiPost } from "../../services/adminApi";

type ResetResult = {
  deletedOrders: number;
  deletedOrderItems: number;
  deletedProducts: number;
  deletedInventoryMovements: number;
  removedStores: number;
  deletedSupportMessages: number;
};

export default function GlobalDataReset() {
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResetResult | null>(null);

  async function handleReset() {
    setError("");
    setResult(null);
    if (confirmation !== "RESET GLOBAL DATA") {
      setError("Type RESET GLOBAL DATA exactly to continue.");
      return;
    }

    const approved = window.confirm(
      "Final warning: this permanently deletes Global products, orders, inventory, support messages, extra stores, visitor analytics, and Global workspace preferences. Admin login/security records and all Nigeria Ecommerce data are preserved. Continue?",
    );
    if (!approved) return;

    setBusy(true);
    try {
      const response = await apiPost<ResetResult>("/admin/system-reset", {
        workspace: "global",
        confirmation,
      });
      setResult(response);
      setConfirmation("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Reset failed. Please check the server and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
      <div className="border-b border-red-100 bg-red-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={21} />
          <div>
            <h3 className="font-semibold text-red-950">
              Reset Global Ecommerce
            </h3>
            <p className="mt-1 text-sm leading-6 text-red-800">
              Remove demo/business data and return Global workspace preferences
              to their defaults. This does not delete your admin account or
              touch Nigeria Ecommerce.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-900">
            This reset will delete
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>All products in the Global product catalog</li>
            <li>Global orders and their order items</li>
            <li>Global inventory movement history</li>
            <li>Support messages and visitor analytics</li>
            <li>Additional Global stores and Global workspace preferences</li>
          </ul>
          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            Admin login/security records and Nigeria Ecommerce tables/settings
            are preserved. Back up <code>server/dropstack.db</code> before
            resetting.
          </p>
        </div>

        <div>
          <label
            htmlFor="global-reset-confirmation"
            className="mb-2 block text-sm font-medium text-slate-800"
          >
            Type <code>RESET GLOBAL DATA</code> to enable the reset
          </label>
          <input
            id="global-reset-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="RESET GLOBAL DATA"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            disabled={busy}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {result && (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800"
          >
            Reset completed. Removed {result.deletedProducts} products,{" "}
            {result.deletedOrders} orders, {result.deletedInventoryMovements}{" "}
            inventory records, {result.deletedSupportMessages} support messages,
            and {result.removedStores} additional stores. Nigeria Ecommerce and
            admin login were preserved.
          </div>
        )}

        <button
          type="button"
          onClick={handleReset}
          disabled={busy || confirmation !== "RESET GLOBAL DATA"}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <LoaderCircle className="animate-spin" size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {busy ? "Resetting Global data…" : "Reset Global Ecommerce"}
        </button>
      </div>
    </section>
  );
}
