import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  Settings,
} from "lucide-react";
import {
  getNigeriaSettings,
  updateNigeriaSettings,
  type NigeriaSettings as NigeriaSettingsData,
} from "../../services/nigeriaApi";

export default function NigeriaSettings() {
  const [settings, setSettings] =
    useState<NigeriaSettingsData | null>(null);

  const [storeName, setStoreName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState("flutterwave");
  const [shippingFee, setShippingFee] =
    useState("0");
  const [deliveryEstimate, setDeliveryEstimate] =
    useState("2–7 business days");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function loadSettings() {
    try {
      setError("");

      const data = await getNigeriaSettings();

      setSettings(data);
      setStoreName(data.store_name || "");
      setSupplierName(data.supplier_name || "");
      setPaymentMethod(
        data.payment_method || "flutterwave",
      );
      setShippingFee(
        String(data.default_shipping_fee ?? 0),
      );
      setDeliveryEstimate(
        data.delivery_estimate ||
          "2–7 business days",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Nigeria settings.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialise() {
      try {
        setError("");

        const data =
          await getNigeriaSettings();

        if (!active) return;

        setSettings(data);
        setStoreName(
          data.store_name || "",
        );
        setSupplierName(
          data.supplier_name || "",
        );
        setPaymentMethod(
          data.payment_method ||
            "flutterwave",
        );
        setShippingFee(
          String(
            data.default_shipping_fee ??
              0,
          ),
        );
        setDeliveryEstimate(
          data.delivery_estimate ||
            "2–7 business days",
        );
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load Nigeria settings.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void initialise();

    return () => {
      active = false;
    };
  }, []);

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const updated =
        await updateNigeriaSettings({
          storeName: storeName.trim(),
          supplierName:
            supplierName.trim() || undefined,
          paymentMethod,
          shippingFee:
            Number(shippingFee) || 0,
          deliveryEstimate:
            deliveryEstimate.trim() ||
            "2–7 business days",
        });

      setSettings(updated);
      setStoreName(
        updated.store_name || "",
      );
      setSupplierName(
        updated.supplier_name || "",
      );
      setPaymentMethod(
        updated.payment_method ||
          "flutterwave",
      );
      setShippingFee(
        String(
          updated.default_shipping_fee ??
            0,
        ),
      );
      setDeliveryEstimate(
        updated.delivery_estimate ||
          "2–7 business days",
      );

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save Nigeria settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadSettings();
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading Nigeria settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
            <Settings className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Nigeria Settings
            </h1>

            <p className="text-sm text-gray-500">
              Manage the Nigeria Ecommerce workspace.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Nigeria settings saved successfully.
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="space-y-6"
      >
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Store information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Basic information for the Nigeria store.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Store name
              </label>

              <input
                type="text"
                value={storeName}
                onChange={(event) =>
                  setStoreName(event.target.value)
                }
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Supplier name
              </label>

              <input
                type="text"
                value={supplierName}
                onChange={(event) =>
                  setSupplierName(
                    event.target.value,
                  )
                }
                placeholder="Optional"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Payment and delivery
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Nigeria checkout and fulfillment configuration.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Payment method
              </label>

              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              >
                <option value="flutterwave">
                  Flutterwave
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Default shipping fee
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={shippingFee}
                onChange={(event) =>
                  setShippingFee(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Delivery estimate
              </label>

              <input
                type="text"
                value={deliveryEstimate}
                onChange={(event) =>
                  setDeliveryEstimate(
                    event.target.value,
                  )
                }
                placeholder="2–7 business days"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Currency
              </p>

              <p className="mt-1 text-base font-semibold text-gray-900">
                {settings?.currency || "NGN"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Country
              </p>

              <p className="mt-1 text-base font-semibold text-gray-900">
                {settings?.country || "Nigeria"}
              </p>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}