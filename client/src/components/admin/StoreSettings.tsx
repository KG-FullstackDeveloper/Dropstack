import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  Check,
  CirclePercent,
  CreditCard,
  Globe2,
  Megaphone,
  Package,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
  Users,
} from "lucide-react";
import { apiClient } from "../../services/adminApi";

type StoreRecord = {
  id: string;
  name: string;
  currency?: string;
  description?: string;
  platformHostname?: string;
  customDomain?: string | null;
};

type DiscountRule = {
  id: string;
  name: string;
  code: string;
  active: boolean;
  type: "percentage" | "fixed" | "free_shipping" | "buy_x_get_y";
  value: number;
  target: "order" | "products" | "collections";
  productIds: string[];
  collectionIds: string[];
  minimumOrderAmount?: number;
  minimumQuantity?: number;
  usageLimit?: number;
  usageCount: number;
  perCustomerLimit?: number;
  startAt?: string;
  endAt?: string;
  buyQuantity?: number;
  getQuantity?: number;
  getDiscountPercent?: number;
  combinesWithDiscounts: boolean;
};

type MarketRule = {
  id: string;
  name: string;
  countries: string[];
  currency: string;
  priceAdjustmentPercent: number;
  shippingMarkup: number;
  enabled: boolean;
};

type ShippingRate = {
  id: string;
  name: string;
  type: "flat" | "price" | "weight" | "free";
  amount: number;
  threshold?: number;
  minWeight?: number;
  maxWeight?: number;
  estimatedDelivery: string;
  active: boolean;
};

type StoreSettingsData = {
  general: {
    storeName: string;
    description: string;
    contactEmail: string;
    phone: string;
    address: string;
    country: string;
    currency: string;
    timezone: string;
    weightUnit: "kg" | "g" | "lb" | "oz";
  };
  checkout: {
    requireAccount: boolean;
    allowGuestCheckout: boolean;
    collectPhone: boolean;
    marketingOptIn: boolean;
    allowOrderNotes: boolean;
    processingMode: "manual" | "automatic";
  };
  discounts: {
    rules: DiscountRule[];
    allowCombination: boolean;
  };
  markets: {
    enabled: boolean;
    autoDetectCountry: boolean;
    defaultMarketId: string;
    markets: MarketRule[];
  };
  shipping: {
    enabled: boolean;
    supplierDefaultCost: number;
    rates: ShippingRate[];
  };
  taxes: {
    enabled: boolean;
    pricesIncludeTax: boolean;
    collectImportDuties: boolean;
    taxLabel: string;
  };
  notifications: {
    orderConfirmation: boolean;
    orderUpdates: boolean;
    customerMessages: boolean;
    refundNotifications: boolean;
    abandonedCartEnabled: boolean;
    abandonedCartDelayHours: number;
    merchantEmail: string;
  };
  customers: {
    accounts: "optional" | "required" | "disabled";
    wishlistEnabled: boolean;
    recentlyViewedEnabled: boolean;
    loyaltyEnabled: boolean;
  };
  marketing: {
    newsletterEnabled: boolean;
    firstOrderDiscountEnabled: boolean;
    firstOrderDiscountPercent: number;
    exitIntentEnabled: boolean;
    metaPixelId: string;
    googleAnalyticsId: string;
    tiktokPixelId: string;
  };
  seo: {
    title: string;
    description: string;
    noIndex: boolean;
  };
  policies: {
    refund: string;
    privacy: string;
    terms: string;
    shipping: string;
  };
};

type SettingsSection =
  | "general"
  | "checkout"
  | "discounts"
  | "markets"
  | "shipping"
  | "taxes"
  | "notifications"
  | "customers"
  | "marketing"
  | "seo"
  | "policies"
  | "payments";

const sections: Array<{
  id: SettingsSection;
  label: string;
  description: string;
  icon: typeof Settings2;
}> = [
  { id: "general", label: "General", description: "Store identity and defaults", icon: Settings2 },
  { id: "checkout", label: "Checkout", description: "Customer and order behavior", icon: ShoppingCart },
  { id: "discounts", label: "Discounts", description: "Codes and automatic promotions", icon: CirclePercent },
  { id: "markets", label: "Markets", description: "Countries, currencies and markups", icon: Globe2 },
  { id: "shipping", label: "Shipping & delivery", description: "Rates, thresholds and supplier costs", icon: Truck },
  { id: "taxes", label: "Taxes & duties", description: "Regional tax and import behavior", icon: ReceiptText },
  { id: "notifications", label: "Notifications", description: "Customer and merchant messages", icon: Bell },
  { id: "customers", label: "Customer accounts", description: "Accounts, wishlist and loyalty", icon: Users },
  { id: "marketing", label: "Marketing", description: "Email capture and tracking", icon: Megaphone },
  { id: "seo", label: "SEO", description: "Search and social metadata", icon: Search },
  { id: "policies", label: "Policies", description: "Refund, privacy, terms and shipping", icon: ShieldCheck },
  { id: "payments", label: "Payments", description: "Payment provider configuration", icon: CreditCard },
];

const defaultSettings: StoreSettingsData = {
  general: {
    storeName: "",
    description: "",
    contactEmail: "",
    phone: "",
    address: "",
    country: "",
    currency: "USD",
    timezone: "Africa/Lagos",
    weightUnit: "kg",
  },
  checkout: {
    requireAccount: false,
    allowGuestCheckout: true,
    collectPhone: true,
    marketingOptIn: false,
    allowOrderNotes: true,
    processingMode: "manual",
  },
  discounts: {
    rules: [],
    allowCombination: false,
  },
  markets: {
    enabled: true,
    autoDetectCountry: true,
    defaultMarketId: "default-market",
    markets: [
      {
        id: "default-market",
        name: "Default market",
        countries: [],
        currency: "USD",
        priceAdjustmentPercent: 0,
        shippingMarkup: 0,
        enabled: true,
      },
    ],
  },
  shipping: {
    enabled: true,
    supplierDefaultCost: 0,
    rates: [
      {
        id: "standard",
        name: "Standard shipping",
        type: "flat",
        amount: 0,
        estimatedDelivery: "",
        active: true,
      },
    ],
  },
  taxes: {
    enabled: false,
    pricesIncludeTax: false,
    collectImportDuties: false,
    taxLabel: "Tax",
  },
  notifications: {
    orderConfirmation: true,
    orderUpdates: true,
    customerMessages: true,
    refundNotifications: true,
    abandonedCartEnabled: false,
    abandonedCartDelayHours: 4,
    merchantEmail: "",
  },
  customers: {
    accounts: "optional",
    wishlistEnabled: true,
    recentlyViewedEnabled: true,
    loyaltyEnabled: false,
  },
  marketing: {
    newsletterEnabled: true,
    firstOrderDiscountEnabled: true,
    firstOrderDiscountPercent: 10,
    exitIntentEnabled: true,
    metaPixelId: "",
    googleAnalyticsId: "",
    tiktokPixelId: "",
  },
  seo: {
    title: "",
    description: "",
    noIndex: false,
  },
  policies: {
    refund: "",
    privacy: "",
    terms: "",
    shipping: "",
  },
};

export default function StoreSettings() {
  const queryStoreId = new URLSearchParams(window.location.search).get("storeId") || "";
  const [storeId, setStoreId] = useState(queryStoreId);
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [active, setActive] = useState<SettingsSection>("general");
  const [data, setData] = useState<StoreSettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const currentStore = useMemo(
    () => stores.find((store) => store.id === storeId),
    [stores, storeId]
  );

  async function loadStoreSettings(id: string) {
    if (!id) return;
    setLoading(true);
    setError("");

    try {
      const result = await apiClient.get<{ settings?: Partial<StoreSettingsData> }>(
        `/store-settings/${encodeURIComponent(id)}`
      );
      setData(mergeSettings(result.settings));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load this store's settings."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError("");

      try {
        const result = await apiClient.stores();
        if (cancelled) return;

        const list = Array.isArray(result.stores)
          ? (result.stores as StoreRecord[])
          : [];
        setStores(list);

        const id = list.some((store) => store.id === queryStoreId)
          ? queryStoreId
          : list[0]?.id || "";

        setStoreId(id);

        if (id) {
          await loadStoreSettings(id);
        } else {
          setLoading(false);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load your stores."
          );
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queryStoreId]);

  function changeStore(id: string) {
    setStoreId(id);
    setMessage("");
    setError("");
    window.history.replaceState(
      null,
      "",
      `/admin/settings?storeId=${encodeURIComponent(id)}`
    );
    void loadStoreSettings(id);
  }

  function updateSection<K extends keyof StoreSettingsData>(
    section: K,
    patch: Partial<StoreSettingsData[K]>
  ) {
    setData((current) => ({
      ...current,
      [section]: {
        ...(current[section] as object),
        ...patch,
      },
    }));
  }

  async function save() {
    if (!storeId || active === "payments") return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (active === "general") {
        await apiClient.patch(`/stores/${encodeURIComponent(storeId)}`, {
          name: data.general.storeName,
          description: data.general.description,
          currency: data.general.currency,
        });
      }

      await apiClient.patch(
        `/store-settings/${encodeURIComponent(storeId)}`,
        {
          [active]: data[active],
        }
      );

      setMessage("Changes saved successfully.");

      if (active === "general") {
        const refreshed = await apiClient.stores();
        setStores(
          Array.isArray(refreshed.stores)
            ? (refreshed.stores as StoreRecord[])
            : []
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save your changes."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-6 h-32 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (!stores.length) {
    return (
      <div className="min-h-full bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-10 text-center">
          <Package className="mx-auto text-slate-400" size={28} />
          <h1 className="mt-4 text-xl font-black text-slate-950">No stores found</h1>
          <p className="mt-2 text-sm text-slate-500">
            Create a store first, then return here to configure it.
          </p>
        </div>
      </div>
    );
  }

  const currentSection = sections.find((item) => item.id === active);

  return (
    <div className="min-h-full bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-[1440px] p-4 md:p-6 lg:p-8">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Store settings
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">
                {currentStore?.name || data.general.storeName || "Store"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Configure this store independently from every other store on your account.
              </p>
            </div>

            <label className="w-full max-w-sm">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Store
              </span>
              <select
                value={storeId}
                onChange={(event) => changeStore(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-slate-500"
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <div className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:mx-6">
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mx-5 mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:mx-6">
              <Check size={16} />
              {message}
            </div>
          )}

          <div className="grid lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="border-b p-3 lg:border-b-0 lg:border-r lg:p-4">
              <nav className="space-y-1">
                {sections.map((item) => {
                  const Icon = item.icon;
                  const selected = active === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActive(item.id);
                        setMessage("");
                        setError("");
                      }}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${
                        selected
                          ? "bg-slate-950 text-white"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={17} className="mt-0.5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-xs font-bold">{item.label}</span>
                        <span
                          className={`mt-0.5 block text-[10px] leading-4 ${
                            selected ? "text-white/60" : "text-slate-400"
                          }`}
                        >
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <main className="min-w-0 p-5 md:p-7">
              <div className="mb-6 border-b pb-5">
                <p className="text-lg font-black">{currentSection?.label}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {currentSection?.description}
                </p>
              </div>

              {active === "general" && (
                <GeneralSettings
                  value={data.general}
                  onChange={(patch) => updateSection("general", patch)}
                />
              )}

              {active === "checkout" && (
                <CheckoutSettings
                  value={data.checkout}
                  onChange={(patch) => updateSection("checkout", patch)}
                />
              )}

              {active === "discounts" && (
                <DiscountSettings
                  value={data.discounts}
                  onChange={(value) => updateSection("discounts", value)}
                />
              )}

              {active === "markets" && (
                <MarketSettings
                  value={data.markets}
                  onChange={(value) => updateSection("markets", value)}
                />
              )}

              {active === "shipping" && (
                <ShippingSettings
                  value={data.shipping}
                  onChange={(value) => updateSection("shipping", value)}
                />
              )}

              {active === "taxes" && (
                <TaxesSettings
                  value={data.taxes}
                  onChange={(value) => updateSection("taxes", value)}
                />
              )}

              {active === "notifications" && (
                <NotificationSettings
                  value={data.notifications}
                  onChange={(value) => updateSection("notifications", value)}
                />
              )}

              {active === "customers" && (
                <CustomerSettings
                  value={data.customers}
                  onChange={(value) => updateSection("customers", value)}
                />
              )}

              {active === "marketing" && (
                <MarketingSettings
                  value={data.marketing}
                  onChange={(value) => updateSection("marketing", value)}
                />
              )}

              {active === "seo" && (
                <SEOSettings
                  value={data.seo}
                  onChange={(value) => updateSection("seo", value)}
                />
              )}

              {active === "policies" && (
                <PolicySettings
                  value={data.policies}
                  onChange={(value) => updateSection("policies", value)}
                />
              )}

              {active === "payments" && <PaymentsSettings />}

              {active !== "payments" && (
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                  <p className="text-xs text-slate-400">
                    Changes apply only to {currentStore?.name || "this store"}.
                  </p>
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check size={15} />
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings({
  value,
  onChange,
}: {
  value: StoreSettingsData["general"];
  onChange: (patch: Partial<StoreSettingsData["general"]>) => void;
}) {
  return (
    <Section title="Store identity" description="Core information for this store.">
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Store name" value={value.storeName} onChange={(v) => onChange({ storeName: v })} />
        <Input label="Contact email" type="email" value={value.contactEmail} onChange={(v) => onChange({ contactEmail: v })} />
        <Input label="Phone / WhatsApp" value={value.phone} onChange={(v) => onChange({ phone: v })} />
        <Input label="Country" value={value.country} onChange={(v) => onChange({ country: v })} />
        <Input label="Currency" value={value.currency} onChange={(v) => onChange({ currency: v.toUpperCase() })} />
        <Input label="Timezone" value={value.timezone} onChange={(v) => onChange({ timezone: v })} />
        <SelectField label="Weight unit" value={value.weightUnit} options={["kg", "g", "lb", "oz"]} onChange={(v) => onChange({ weightUnit: v as typeof value.weightUnit })} />
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-xs font-bold">Store address</span>
          <textarea value={value.address} onChange={(event) => onChange({ address: event.target.value })} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500" />
        </label>
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-xs font-bold">Store description</span>
          <textarea value={value.description} onChange={(event) => onChange({ description: event.target.value })} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-slate-500" />
        </label>
      </div>
    </Section>
  );
}

function CheckoutSettings({
  value,
  onChange,
}: {
  value: StoreSettingsData["checkout"];
  onChange: (patch: Partial<StoreSettingsData["checkout"]>) => void;
}) {
  return (
    <Section title="Checkout behavior" description="Decide what customers must provide and how paid orders are processed.">
      <Toggle label="Allow guest checkout" checked={value.allowGuestCheckout} onChange={(checked) => onChange({ allowGuestCheckout: checked })} />
      <Toggle label="Require customer account" checked={value.requireAccount} onChange={(checked) => onChange({ requireAccount: checked })} />
      <Toggle label="Collect phone / WhatsApp" checked={value.collectPhone} onChange={(checked) => onChange({ collectPhone: checked })} />
      <Toggle label="Offer marketing opt-in" checked={value.marketingOptIn} onChange={(checked) => onChange({ marketingOptIn: checked })} />
      <Toggle label="Allow order notes" checked={value.allowOrderNotes} onChange={(checked) => onChange({ allowOrderNotes: checked })} />
      <SelectField label="Order processing" value={value.processingMode} options={["manual", "automatic"]} onChange={(v) => onChange({ processingMode: v as typeof value.processingMode })} />
    </Section>
  );
}

function DiscountSettings({
  value,
  onChange,
}: {
  value: StoreSettingsData["discounts"];
  onChange: (value: StoreSettingsData["discounts"]) => void;
}) {
  function addRule() {
    const rule: DiscountRule = {
      id: `discount-${Date.now()}`,
      name: "New discount",
      code: "",
      active: true,
      type: "percentage",
      value: 10,
      target: "order",
      productIds: [],
      collectionIds: [],
      usageCount: 0,
      combinesWithDiscounts: false,
    };
    onChange({ ...value, rules: [...value.rules, rule] });
  }

  function updateRule(id: string, patch: Partial<DiscountRule>) {
    onChange({
      ...value,
      rules: value.rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    });
  }

  function removeRule(id: string) {
    onChange({ ...value, rules: value.rules.filter((rule) => rule.id !== id) });
  }

  return (
    <Section title="Discount engine" description="Create percentage, fixed amount, free-shipping and Buy X Get Y rules for this store.">
      <Toggle label="Allow discount combinations" checked={value.allowCombination} onChange={(checked) => onChange({ ...value, allowCombination: checked })} />

      {value.rules.map((rule) => (
        <div key={rule.id} className="md:col-span-2 rounded-2xl border border-slate-200 p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Input label="Name" value={rule.name} onChange={(v) => updateRule(rule.id, { name: v })} />
                <Input label="Code" value={rule.code} onChange={(v) => updateRule(rule.id, { code: v.toUpperCase() })} />
                <SelectField label="Type" value={rule.type} options={["percentage", "fixed", "free_shipping", "buy_x_get_y"]} onChange={(v) => updateRule(rule.id, { type: v as DiscountRule["type"] })} />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <NumberInput label="Value" value={rule.value} onChange={(v) => updateRule(rule.id, { value: v })} />
                <SelectField label="Applies to" value={rule.target} options={["order", "products", "collections"]} onChange={(v) => updateRule(rule.id, { target: v as DiscountRule["target"] })} />
                <NumberInput label="Minimum order" value={rule.minimumOrderAmount ?? 0} onChange={(v) => updateRule(rule.id, { minimumOrderAmount: v > 0 ? v : undefined })} />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <NumberInput label="Minimum quantity" value={rule.minimumQuantity ?? 0} onChange={(v) => updateRule(rule.id, { minimumQuantity: v > 0 ? v : undefined })} />
                <NumberInput label="Usage limit" value={rule.usageLimit ?? 0} onChange={(v) => updateRule(rule.id, { usageLimit: v > 0 ? v : undefined })} />
                <NumberInput label="Per customer" value={rule.perCustomerLimit ?? 0} onChange={(v) => updateRule(rule.id, { perCustomerLimit: v > 0 ? v : undefined })} />
              </div>

              {rule.type === "buy_x_get_y" && (
                <div className="grid gap-3 md:grid-cols-3">
                  <NumberInput label="Buy quantity" value={rule.buyQuantity ?? 1} onChange={(v) => updateRule(rule.id, { buyQuantity: Math.max(1, v) })} />
                  <NumberInput label="Get quantity" value={rule.getQuantity ?? 1} onChange={(v) => updateRule(rule.id, { getQuantity: Math.max(1, v) })} />
                  <NumberInput label="Get discount %" value={rule.getDiscountPercent ?? 100} onChange={(v) => updateRule(rule.id, { getDiscountPercent: Math.min(100, Math.max(0, v)) })} />
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Starts" type="datetime-local" value={toDateTimeLocal(rule.startAt)} onChange={(v) => updateRule(rule.id, { startAt: v ? new Date(v).toISOString() : undefined })} />
                <Input label="Ends" type="datetime-local" value={toDateTimeLocal(rule.endAt)} onChange={(v) => updateRule(rule.id, { endAt: v ? new Date(v).toISOString() : undefined })} />
              </div>
            </div>

            <button type="button" onClick={() => removeRule(rule.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete discount">
              <Trash2 size={16} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-5 border-t pt-3">
            <ToggleCompact label="Active" checked={rule.active} onChange={(checked) => updateRule(rule.id, { active: checked })} />
            <ToggleCompact label="Can combine" checked={rule.combinesWithDiscounts} onChange={(checked) => updateRule(rule.id, { combinesWithDiscounts: checked })} />
          </div>
        </div>
      ))}

      <button type="button" onClick={addRule} className="md:col-span-2 inline-flex w-fit items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs font-bold hover:border-slate-500 hover:bg-slate-50">
        <Plus size={15} />
        Create discount
      </button>
    </Section>
  );
}

function MarketSettings({
  value,
  onChange,
}: {
  value: StoreSettingsData["markets"];
  onChange: (value: StoreSettingsData["markets"]) => void;
}) {
  function addMarket() {
    onChange({
      ...value,
      markets: [
        ...value.markets,
        {
          id: `market-${Date.now()}`,
          name: "New market",
          countries: [],
          currency: "USD",
          priceAdjustmentPercent: 0,
          shippingMarkup: 0,
          enabled: true,
        },
      ],
    });
  }

  function updateMarket(id: string, patch: Partial<MarketRule>) {
    onChange({
      ...value,
      markets: value.markets.map((market) => (market.id === id ? { ...market, ...patch } : market)),
    });
  }

  function removeMarket(id: string) {
    onChange({ ...value, markets: value.markets.filter((market) => market.id !== id) });
  }

  return (
    <Section title="Markets & currencies" description="Set country groups, currencies and store-level price/shipping adjustments.">
      <Toggle label="Enable regional markets" checked={value.enabled} onChange={(checked) => onChange({ ...value, enabled: checked })} />
      <Toggle label="Automatically detect customer country" checked={value.autoDetectCountry} onChange={(checked) => onChange({ ...value, autoDetectCountry: checked })} />

      {value.markets.map((market) => (
        <div key={market.id} className="md:col-span-2 rounded-2xl border border-slate-200 p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Input label="Market name" value={market.name} onChange={(v) => updateMarket(market.id, { name: v })} />
            <Input label="Countries" value={market.countries.join(", ")} onChange={(v) => updateMarket(market.id, { countries: v.split(",").map((item) => item.trim()).filter(Boolean) })} />
            <Input label="Currency" value={market.currency} onChange={(v) => updateMarket(market.id, { currency: v.toUpperCase() })} />
            <NumberInput label="Price adjustment %" value={market.priceAdjustmentPercent} onChange={(v) => updateMarket(market.id, { priceAdjustmentPercent: v })} />
            <NumberInput label="Shipping markup" value={market.shippingMarkup} onChange={(v) => updateMarket(market.id, { shippingMarkup: v })} />
            <div className="flex items-end justify-between gap-3">
              <ToggleCompact label="Enabled" checked={market.enabled} onChange={(checked) => updateMarket(market.id, { enabled: checked })} />
              <button type="button" onClick={() => removeMarket(market.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={addMarket} className="inline-flex w-fit items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs font-bold hover:border-slate-500 hover:bg-slate-50">
        <Plus size={15} />
        Add market
      </button>
    </Section>
  );
}

function ShippingSettings({
  value,
  onChange,
}: {
  value: StoreSettingsData["shipping"];
  onChange: (value: StoreSettingsData["shipping"]) => void;
}) {
  function addRate() {
    onChange({
      ...value,
      rates: [
        ...value.rates,
        {
          id: `rate-${Date.now()}`,
          name: "New shipping rate",
          type: "flat",
          amount: 0,
          estimatedDelivery: "",
          active: true,
        },
      ],
    });
  }

  function updateRate(id: string, patch: Partial<ShippingRate>) {
    onChange({ ...value, rates: value.rates.map((rate) => (rate.id === id ? { ...rate, ...patch } : rate)) });
  }

  return (
    <Section title="Shipping & delivery" description="Keep supplier costs and customer-facing shipping rules separate so margin calculations remain clear.">
      <Toggle label="Enable shipping" checked={value.enabled} onChange={(checked) => onChange({ ...value, enabled: checked })} />
      <NumberInput label="Default supplier shipping cost" value={value.supplierDefaultCost} onChange={(v) => onChange({ ...value, supplierDefaultCost: v })} />

      {value.rates.map((rate) => (
        <div key={rate.id} className="md:col-span-2 rounded-2xl border border-slate-200 p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Input label="Rate name" value={rate.name} onChange={(v) => updateRate(rate.id, { name: v })} />
            <SelectField label="Type" value={rate.type} options={["flat", "price", "weight", "free"]} onChange={(v) => updateRate(rate.id, { type: v as ShippingRate["type"] })} />
            <NumberInput label="Amount" value={rate.amount} onChange={(v) => updateRate(rate.id, { amount: v })} />
            <NumberInput label="Threshold" value={rate.threshold ?? 0} onChange={(v) => updateRate(rate.id, { threshold: v > 0 ? v : undefined })} />
            <NumberInput label="Minimum weight" value={rate.minWeight ?? 0} onChange={(v) => updateRate(rate.id, { minWeight: v > 0 ? v : undefined })} />
            <NumberInput label="Maximum weight" value={rate.maxWeight ?? 0} onChange={(v) => updateRate(rate.id, { maxWeight: v > 0 ? v : undefined })} />
            <Input label="Estimated delivery" value={rate.estimatedDelivery} onChange={(v) => updateRate(rate.id, { estimatedDelivery: v })} />
            <div className="flex items-end"><ToggleCompact label="Active" checked={rate.active} onChange={(checked) => updateRate(rate.id, { active: checked })} /></div>
          </div>
        </div>
      ))}

      <button type="button" onClick={addRate} className="inline-flex w-fit items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs font-bold hover:border-slate-500 hover:bg-slate-50">
        <Plus size={15} />
        Add shipping rate
      </button>
    </Section>
  );
}

function TaxesSettings({
  value,
  onChange,
}: {
  value: StoreSettingsData["taxes"];
  onChange: (patch: Partial<StoreSettingsData["taxes"]>) => void;
}) {
  return (
    <Section title="Taxes & duties" description="Store tax behavior independently so it can later feed the storefront and checkout calculations.">
      <Toggle label="Enable taxes" checked={value.enabled} onChange={(checked) => onChange({ enabled: checked })} />
      <Toggle label="Prices include tax" checked={value.pricesIncludeTax} onChange={(checked) => onChange({ pricesIncludeTax: checked })} />
      <Toggle label="Collect import duties at checkout" checked={value.collectImportDuties} onChange={(checked) => onChange({ collectImportDuties: checked })} />
      <Input label="Tax label" value={value.taxLabel} onChange={(v) => onChange({ taxLabel: v })} />
    </Section>
  );
}

function NotificationSettings({
  value,
  onChange,
}: {
  value: StoreSettingsData["notifications"];
  onChange: (patch: Partial<StoreSettingsData["notifications"]>) => void;
}) {
  return (
    <Section title="Notifications" description="Choose which operational messages this store sends and when abandoned-cart recovery starts.">
      <Toggle label="Order confirmation" checked={value.orderConfirmation} onChange={(checked) => onChange({ orderConfirmation: checked })} />
      <Toggle label="Shipping updates" checked={value.orderUpdates} onChange={(checked) => onChange({ orderUpdates: checked })} />
      <Toggle label="Customer messages" checked={value.customerMessages} onChange={(checked) => onChange({ customerMessages: checked })} />
      <Toggle label="Refund notifications" checked={value.refundNotifications} onChange={(checked) => onChange({ refundNotifications: checked })} />
      <Toggle label="Abandoned-cart recovery" checked={value.abandonedCartEnabled} onChange={(checked) => onChange({ abandonedCartEnabled: checked })} />
      <Input label="Merchant notification email" type="email" value={value.merchantEmail} onChange={(v) => onChange({ merchantEmail: v })} />
      <NumberInput label="Abandoned-cart delay (hours)" value={value.abandonedCartDelayHours} onChange={(v) => onChange({ abandonedCartDelayHours: Math.max(1, v) })} />
    </Section>
  );
}

function CustomerSettings({
  value,
  onChange,
}: {
  value: StoreSettingsData["customers"];
  onChange: (patch: Partial<StoreSettingsData["customers"]>) => void;
}) {
  return (
    <Section title="Customer accounts" description="Control optional accounts and shopping conveniences without forcing account creation on every customer.">
      <SelectField label="Account policy" value={value.accounts} options={["optional", "required", "disabled"]} onChange={(v) => onChange({ accounts: v as typeof value.accounts })} />
      <Toggle label="Wishlist" checked={value.wishlistEnabled} onChange={(checked) => onChange({ wishlistEnabled: checked })} />
      <Toggle label="Recently viewed products" checked={value.recentlyViewedEnabled} onChange={(checked) => onChange({ recentlyViewedEnabled: checked })} />
      <Toggle label="Loyalty / rewards" checked={value.loyaltyEnabled} onChange={(checked) => onChange({ loyaltyEnabled: checked })} />
    </Section>
  );
}

function MarketingSettings({
  value,
  onChange,
}: {
  value: StoreSettingsData["marketing"];
  onChange: (patch: Partial<StoreSettingsData["marketing"]>) => void;
}) {
  return (
    <Section title="Marketing" description="Store-specific acquisition and tracking controls.">
      <Toggle label="Newsletter signup" checked={value.newsletterEnabled} onChange={(checked) => onChange({ newsletterEnabled: checked })} />
      <Toggle label="First-order discount" checked={value.firstOrderDiscountEnabled} onChange={(checked) => onChange({ firstOrderDiscountEnabled: checked })} />
      <Toggle label="Exit-intent email capture" checked={value.exitIntentEnabled} onChange={(checked) => onChange({ exitIntentEnabled: checked })} />
      <NumberInput label="First-order discount %" value={value.firstOrderDiscountPercent} onChange={(v) => onChange({ firstOrderDiscountPercent: Math.min(100, Math.max(0, v)) })} />
      <Input label="Meta Pixel ID" value={value.metaPixelId} onChange={(v) => onChange({ metaPixelId: v })} />
      <Input label="Google Analytics ID" value={value.googleAnalyticsId} onChange={(v) => onChange({ googleAnalyticsId: v })} />
      <Input label="TikTok Pixel ID" value={value.tiktokPixelId} onChange={(v) => onChange({ tiktokPixelId: v })} />
    </Section>
  );
}

function SEOSettings({
  value,
  onChange,
}: {
  value: StoreSettingsData["seo"];
  onChange: (patch: Partial<StoreSettingsData["seo"]>) => void;
}) {
  return (
    <Section title="SEO" description="Store metadata and indexing rules.">
      <Input label="SEO title" value={value.title} onChange={(v) => onChange({ title: v })} />
      <Toggle label="Prevent search engine indexing" checked={value.noIndex} onChange={(checked) => onChange({ noIndex: checked })} />
      <label className="md:col-span-2">
        <span className="mb-1.5 block text-xs font-bold">Meta description</span>
        <textarea value={value.description} onChange={(event) => onChange({ description: event.target.value })} rows={5} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-slate-500" />
      </label>
    </Section>
  );
}

function PolicySettings({
  value,
  onChange,
}: {
  value: StoreSettingsData["policies"];
  onChange: (patch: Partial<StoreSettingsData["policies"]>) => void;
}) {
  return (
    <Section title="Policies" description="Keep each store's customer-facing legal and fulfilment policies separate.">
      <PolicyField label="Refund policy" value={value.refund} onChange={(v) => onChange({ refund: v })} />
      <PolicyField label="Shipping policy" value={value.shipping} onChange={(v) => onChange({ shipping: v })} />
      <PolicyField label="Privacy policy" value={value.privacy} onChange={(v) => onChange({ privacy: v })} />
      <PolicyField label="Terms of service" value={value.terms} onChange={(v) => onChange({ terms: v })} />
    </Section>
  );
}

function PaymentsSettings() {
  return (
    <div className="rounded-2xl border bg-slate-50 p-5">
      <div className="flex gap-3">
        <CreditCard className="shrink-0 text-slate-700" size={22} />
        <div>
          <p className="text-sm font-black">Payment providers</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Payment credentials and provider connections stay in the Payments area so secrets are not exposed in store configuration forms. This page still belongs to the currently selected store.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-black">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-500" />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold">{label}</span>
      <input type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-500" />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-500">
        {options.map((option) => (
          <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex min-h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:bg-slate-50">
      <span className="text-xs font-bold text-slate-800">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-slate-950" : "bg-slate-200"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

function ToggleCompact({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
      <span className={`relative h-5 w-9 rounded-full ${checked ? "bg-slate-950" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-4" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

function PolicyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="md:col-span-2">
      <span className="mb-1.5 block text-xs font-bold">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={8} className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-slate-500" />
    </label>
  );
}

function mergeSettings(value?: Partial<StoreSettingsData>): StoreSettingsData {
  const source = value || {};

  return {
    general: { ...defaultSettings.general, ...(source.general || {}) },
    checkout: { ...defaultSettings.checkout, ...(source.checkout || {}) },
    discounts: {
      ...defaultSettings.discounts,
      ...(source.discounts || {}),
      rules: Array.isArray(source.discounts?.rules) ? source.discounts.rules : defaultSettings.discounts.rules,
    },
    markets: {
      ...defaultSettings.markets,
      ...(source.markets || {}),
      markets: Array.isArray(source.markets?.markets) && source.markets!.markets.length ? source.markets!.markets : defaultSettings.markets.markets,
    },
    shipping: {
      ...defaultSettings.shipping,
      ...(source.shipping || {}),
      rates: Array.isArray(source.shipping?.rates) && source.shipping!.rates.length ? source.shipping!.rates : defaultSettings.shipping.rates,
    },
    taxes: { ...defaultSettings.taxes, ...(source.taxes || {}) },
    notifications: { ...defaultSettings.notifications, ...(source.notifications || {}) },
    customers: { ...defaultSettings.customers, ...(source.customers || {}) },
    marketing: { ...defaultSettings.marketing, ...(source.marketing || {}) },
    seo: { ...defaultSettings.seo, ...(source.seo || {}) },
    policies: { ...defaultSettings.policies, ...(source.policies || {}) },
  };
}

function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
