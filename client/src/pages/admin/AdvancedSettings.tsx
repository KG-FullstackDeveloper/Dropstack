import {
  AlertTriangle,
  Bell,
  Check,
  ChevronDown,
  CreditCard,
  Database,
  Globe,
  KeyRound,
  Lock,
  Save,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import DashboardPageShell from "../../components/dasboard/DashboardPageShell";
import DashboardSettingsSidebar from "../../components/settings/DashboardSettingsSidebar";

import type {
  DashboardSettingsData,
  SettingsSection,
} from "../../components/settings/DashboardSettingsTypes";

interface AdvancedSettingsProps {
  workspaceKey: "global" | "nigeria";
  initialSettings: DashboardSettingsData;
  onSave: (settings: DashboardSettingsData) => void;
}

const sectionMeta: Record<
  SettingsSection,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
  }
> = {
  General: {
    title: "General",
    description:
      "Manage your store identity, contact information and regional preferences.",
    icon: <Store size={20} />,
  },
  Checkout: {
    title: "Checkout",
    description:
      "Control what information customers provide when placing an order.",
    icon: <Check size={20} />,
  },
  Shipping: {
    title: "Shipping & delivery",
    description:
      "Configure delivery estimates, shipping charges and free-shipping rules.",
    icon: <Truck size={20} />,
  },
  Policies: {
    title: "Policies",
    description:
      "Manage the policies customers see throughout your store.",
    icon: <ShieldCheck size={20} />,
  },
  Payments: {
    title: "Payment settings",
    description:
      "Configure how customers pay and connect your payment provider.",
    icon: <CreditCard size={20} />,
  },
  Account: {
    title: "Profile",
    description:
      "Manage the primary store owner information.",
    icon: <UserRound size={20} />,
  },
  Security: {
    title: "Security",
    description:
      "Control account and storefront security settings.",
    icon: <KeyRound size={20} />,
  },
  Users: {
    title: "Staff & permissions",
    description:
      "Manage team access to this ecommerce workspace.",
    icon: <Users size={20} />,
  },
  Notifications: {
    title: "Notifications",
    description:
      "Choose which operational notifications are enabled.",
    icon: <Bell size={20} />,
  },
  Domains: {
    title: "Domains",
    description:
      "Configure your storefront address and publishing status.",
    icon: <Globe size={20} />,
  },
  Data: {
    title: "Data & integrations",
    description:
      "Manage exports, API access, analytics and external integrations.",
    icon: <Database size={20} />,
  },
  Advanced: {
    title: "Store status",
    description:
      "Control whether the storefront is available to customers.",
    icon: <Lock size={20} />,
  },
  Taxes: {
    title: "Taxes",
    description: "Configure store tax behaviour.",
    icon: <Store size={20} />,
  },
  Storefront: {
    title: "Storefront",
    description: "Configure storefront behaviour.",
    icon: <Store size={20} />,
  },
  Privacy: {
    title: "Privacy",
    description: "Configure privacy behaviour.",
    icon: <ShieldCheck size={20} />,
  },
  Integrations: {
    title: "Integrations",
    description: "Configure connected services.",
    icon: <Database size={20} />,
  },
};

const sectionOptions: SettingsSection[] = [
  "General",
  "Checkout",
  "Shipping",
  "Policies",
  "Payments",
  "Account",
  "Security",
  "Users",
  "Notifications",
  "Domains",
  "Data",
  "Advanced",
];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-6 w-11 rounded-full transition",
        checked ? "bg-slate-900" : "bg-slate-200",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
          checked ? "left-6" : "left-1",
        ].join(" ")}
      />
    </button>
  );
}

function Field({
  label,
  description,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  description?: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-900">
        {label}
      </span>

      {description && (
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      )}

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </label>
  );
}

function SelectField({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-900">
        {label}
      </span>

      {description && (
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      )}

      <div className="relative mt-3">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </label>
  );
}

function SettingCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>

        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function AdvancedSettings({
  workspaceKey,
  initialSettings,
  onSave,
}: AdvancedSettingsProps) {
  const [settings, setSettings] =
    useState<DashboardSettingsData>(initialSettings);

  const [activeSection, setActiveSection] =
    useState<SettingsSection>("General");

  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const meta = sectionMeta[activeSection];

  const workspaceLabel =
    workspaceKey === "nigeria"
      ? "Nigeria Ecommerce"
      : "Global Ecommerce";

  const update = <K extends keyof DashboardSettingsData>(
    key: K,
    value: DashboardSettingsData[K]
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  };

  const save = () => {
    onSave(settings);
    setSaved(true);
  };

  const currentSectionIndex = useMemo(
    () => sectionOptions.indexOf(activeSection),
    [activeSection]
  );

  const renderContent = () => {
    switch (activeSection) {
      case "General":
        return (
          <>
            <SettingCard
              title="Store information"
              description="This information identifies your ecommerce store."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Store name"
                  description="The name displayed throughout your admin and storefront."
                  value={settings.storeName}
                  onChange={(value) => update("storeName", value)}
                />

                <Field
                  label="Store email"
                  description="Primary business email for store operations."
                  value={settings.storeEmail}
                  onChange={(value) => update("storeEmail", value)}
                />

                <Field
                  label="Support email"
                  description="Email customers can use when they need help."
                  value={settings.supportEmail}
                  onChange={(value) => update("supportEmail", value)}
                />

                <Field
                  label="Support phone"
                  description="Customer support phone or WhatsApp number."
                  value={settings.supportPhone}
                  onChange={(value) => update("supportPhone", value)}
                />
              </div>

              <Field
                label="Store description"
                description="A short description of what your store sells."
                value={settings.storeDescription}
                onChange={(value) =>
                  update("storeDescription", value)
                }
              />
            </SettingCard>

            <SettingCard
              title="Regional settings"
              description="These settings control how dates, language and money are displayed."
            >
              <div className="grid gap-5 md:grid-cols-3">
                <SelectField
                  label="Currency"
                  value={settings.currency}
                  options={
                    workspaceKey === "nigeria"
                      ? ["NGN"]
                      : ["USD", "GBP", "EUR", "CAD", "AUD"]
                  }
                  onChange={(value) => update("currency", value)}
                />

                <SelectField
                  label="Timezone"
                  value={settings.timezone}
                  options={
                    workspaceKey === "nigeria"
                      ? ["Africa/Lagos", "UTC"]
                      : ["UTC", "America/New_York", "Europe/London"]
                  }
                  onChange={(value) => update("timezone", value)}
                />

                <SelectField
                  label="Language"
                  value={settings.language}
                  options={["English"]}
                  onChange={(value) => update("language", value)}
                />
              </div>
            </SettingCard>
          </>
        );

      case "Checkout":
        return (
          <>
            <SettingCard
              title="Customer information"
              description="Choose the information customers must provide before an order can be submitted."
            >
              <ToggleRow
                title="Require email"
                description="Customers must provide an email address during checkout."
                checked={settings.checkoutRequireEmail}
                onChange={(value) =>
                  update("checkoutRequireEmail", value)
                }
              />

              <ToggleRow
                title="Require phone"
                description="Customers must provide a phone number."
                checked={settings.checkoutRequirePhone}
                onChange={(value) =>
                  update("checkoutRequirePhone", value)
                }
              />

              <ToggleRow
                title="Require delivery address"
                description="Customers must provide a complete delivery address."
                checked={settings.checkoutRequireAddress}
                onChange={(value) =>
                  update("checkoutRequireAddress", value)
                }
              />

              <ToggleRow
                title="Allow order notes"
                description="Customers can leave additional instructions with their order."
                checked={settings.checkoutAllowNotes}
                onChange={(value) =>
                  update("checkoutAllowNotes", value)
                }
              />

              <ToggleRow
                title="Require terms acceptance"
                description="Customers must accept your store terms before completing checkout."
                checked={settings.checkoutRequireTerms}
                onChange={(value) =>
                  update("checkoutRequireTerms", value)
                }
              />
            </SettingCard>
          </>
        );

      case "Shipping":
        return (
          <>
            <SettingCard
              title="Shipping charges"
              description="Configure the default shipping behaviour for this workspace."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Default shipping fee"
                  description="The amount charged when free shipping does not apply."
                  type="number"
                  value={settings.shippingFee}
                  onChange={(value) =>
                    update("shippingFee", Number(value) || 0)
                  }
                />

                <Field
                  label="Free shipping minimum"
                  description="Orders at or above this amount qualify for free shipping. Use 0 to disable."
                  type="number"
                  value={settings.freeShippingMinimum}
                  onChange={(value) =>
                    update(
                      "freeShippingMinimum",
                      Number(value) || 0
                    )
                  }
                />
              </div>

              <Field
                label="Delivery estimate"
                description="The delivery estimate shown to customers."
                value={settings.deliveryEstimate}
                onChange={(value) =>
                  update("deliveryEstimate", value)
                }
                placeholder="3–7 business days"
              />
            </SettingCard>

            <SettingCard
              title="Delivery information"
              description="Keep your customer-facing delivery estimate accurate."
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Current estimate
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {settings.deliveryEstimate ||
                    "No delivery estimate configured."}
                </p>
              </div>
            </SettingCard>
          </>
        );

      case "Policies":
        return (
          <>
            <SettingCard
              title="Refunds & returns"
              description="Configure the customer-facing refund policy."
            >
              <Field
                label="Refund window after estimated delivery"
                description="Customers can request a refund within this number of days after the stated estimated delivery deadline."
                type="number"
                value={settings.refundWindowDays}
                onChange={(value) =>
                  update(
                    "refundWindowDays",
                    Number(value) || 0
                  )
                }
              />

              <Field
                label="Return policy"
                value={settings.returnPolicy}
                onChange={(value) =>
                  update("returnPolicy", value)
                }
              />
            </SettingCard>

            <SettingCard
              title="Store policies"
              description="These policies can be displayed to customers."
            >
              <Field
                label="Shipping policy"
                value={settings.shippingPolicy}
                onChange={(value) =>
                  update("shippingPolicy", value)
                }
              />

              <Field
                label="Privacy policy"
                value={settings.privacyPolicy}
                onChange={(value) =>
                  update("privacyPolicy", value)
                }
              />

              <Field
                label="Terms of service"
                value={settings.termsPolicy}
                onChange={(value) =>
                  update("termsPolicy", value)
                }
              />
            </SettingCard>
          </>
        );

      case "Payments":
        return (
          <>
            <SettingCard
              title="Payment provider"
              description="Configure the payment method used by this workspace."
            >
              <SelectField
                label="Payment method"
                value={settings.paymentMethod}
                options={[
                  "Flutterwave",
                  "Manual",
                  "Cash on delivery",
                ]}
                onChange={(value) =>
                  update(
                    "paymentMethod",
                    value as DashboardSettingsData["paymentMethod"]
                  )
                }
              />

              {settings.paymentMethod === "Flutterwave" && (
                <Field
                  label="Flutterwave public key"
                  description="Your public Flutterwave key. Secret credentials should remain server-side."
                  value={settings.flutterwavePublicKey}
                  onChange={(value) =>
                    update("flutterwavePublicKey", value)
                  }
                  placeholder="FLWPUBK-..."
                />
              )}

              <ToggleRow
                title="Test mode"
                description="Use payment test mode while configuring and testing checkout."
                checked={settings.paymentTestMode}
                onChange={(value) =>
                  update("paymentTestMode", value)
                }
              />
            </SettingCard>

            <SettingCard
              title="Payment behaviour"
              description="Operational payment controls for this store."
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Settlement workflow
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Customer payments remain associated with this workspace.
                  Fulfillment can be handled separately from payment
                  processing.
                </p>
              </div>
            </SettingCard>
          </>
        );

      case "Account":
        return (
          <>
            <SettingCard
              title="Store owner"
              description="Primary account information for this workspace."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Owner name"
                  value={settings.ownerName}
                  onChange={(value) =>
                    update("ownerName", value)
                  }
                />

                <Field
                  label="Owner email"
                  value={settings.ownerEmail}
                  onChange={(value) =>
                    update("ownerEmail", value)
                  }
                />
              </div>
            </SettingCard>

            <SettingCard
              title="Workspace"
              description="This settings page only changes the selected ecommerce workspace."
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Workspace
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {workspaceLabel}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Workspace key: {workspaceKey}
                </p>
              </div>
            </SettingCard>
          </>
        );

      case "Security":
        return (
          <>
            <SettingCard
              title="Storefront security"
              description="Control whether customers can access the public storefront."
            >
              <ToggleRow
                title="Password-protected storefront"
                description="Require a password before customers can access the storefront."
                checked={settings.passwordProtectedStore}
                onChange={(value) =>
                  update("passwordProtectedStore", value)
                }
              />
            </SettingCard>

            <SettingCard
              title="Account security"
              description="Authentication controls can be connected to the platform authentication system."
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Authentication
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Password and session management belong to the platform
                  account system and are not stored as storefront settings.
                </p>
              </div>
            </SettingCard>
          </>
        );

      case "Users":
        return (
          <>
            <SettingCard
              title="Staff access"
              description="Team permissions will control what members can access inside this workspace."
            >
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                <Users
                  size={26}
                  className="mx-auto text-slate-400"
                />
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Staff permissions
                </p>
                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
                  The permission system can be connected to your platform
                  accounts without mixing users between Global and Nigeria
                  Ecommerce.
                </p>
              </div>
            </SettingCard>
          </>
        );

      case "Notifications":
        return (
          <>
            <SettingCard
              title="Operational notifications"
              description="Choose which events should generate notifications for the store."
            >
              <ToggleRow
                title="New orders"
                description="Notify administrators when a new order is received."
                checked={settings.notificationsNewOrder}
                onChange={(value) =>
                  update("notificationsNewOrder", value)
                }
              />

              <ToggleRow
                title="Payments"
                description="Notify administrators when payment status changes."
                checked={settings.notificationsPayment}
                onChange={(value) =>
                  update("notificationsPayment", value)
                }
              />

              <ToggleRow
                title="Fulfillment"
                description="Notify administrators when fulfillment status changes."
                checked={settings.notificationsFulfillment}
                onChange={(value) =>
                  update("notificationsFulfillment", value)
                }
              />

              <ToggleRow
                title="Customer activity"
                description="Enable notifications related to important customer activity."
                checked={settings.notificationsCustomer}
                onChange={(value) =>
                  update("notificationsCustomer", value)
                }
              />
            </SettingCard>
          </>
        );

      case "Domains":
        return (
          <>
            <SettingCard
              title="Store address"
              description="Configure the address used to access this storefront."
            >
              <Field
                label="Custom domain"
                description="Your custom storefront domain, when configured."
                value={settings.domain}
                onChange={(value) => update("domain", value)}
                placeholder="store.example.com"
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Workspace
                </p>
                <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                  {workspaceLabel}
                </p>
              </div>
            </SettingCard>
          </>
        );

      case "Data":
        return (
          <>
            <SettingCard
              title="Data & integrations"
              description="Controls for analytics, API access and external services."
            >
              <ToggleRow
                title="Analytics"
                description="Allow analytics features to collect store performance information."
                checked={settings.analyticsEnabled}
                onChange={(value) =>
                  update("analyticsEnabled", value)
                }
              />

              <ToggleRow
                title="Tracking"
                description="Enable supported customer and conversion tracking."
                checked={settings.trackingEnabled}
                onChange={(value) =>
                  update("trackingEnabled", value)
                }
              />

              <ToggleRow
                title="API access"
                description="Allow API-based integrations to interact with this workspace."
                checked={settings.apiAccessEnabled}
                onChange={(value) =>
                  update("apiAccessEnabled", value)
                }
              />

              <ToggleRow
                title="Webhooks"
                description="Enable event delivery to configured integrations."
                checked={settings.webhooksEnabled}
                onChange={(value) =>
                  update("webhooksEnabled", value)
                }
              />
            </SettingCard>

            <SettingCard
              title="Workspace data"
              description="Global and Nigeria Ecommerce data remain stored separately."
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Current workspace
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {workspaceLabel} · {workspaceKey}
                </p>
              </div>
            </SettingCard>
          </>
        );

      case "Advanced":
        return (
          <>
            <SettingCard
              title="Store status"
              description="Control whether customers can access this storefront."
            >
              <ToggleRow
                title="Store online"
                description="When disabled, the storefront can be taken offline while the admin remains accessible."
                checked={settings.storeOnline}
                onChange={(value) =>
                  update("storeOnline", value)
                }
              />
            </SettingCard>

            <SettingCard
              title="Advanced controls"
              description="Use these controls carefully because they affect storefront availability."
            >
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle
                    size={20}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Store availability
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      Turning the store offline should only affect this
                      workspace. It does not disable the other ecommerce
                      workspace.
                    </p>
                  </div>
                </div>
              </div>
            </SettingCard>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardPageShell
      breadcrumbs={[
        { label: "Dashboard" },
        { label: "Settings" },
      ]}
      title="Settings"
      description={`Configure ${workspaceLabel} without affecting the other ecommerce workspace.`}
      actions={[
        {
          label: saved ? "Saved" : "Save changes",
          icon: saved ? <Check size={17} /> : <Save size={17} />,
          onClick: save,
        },
      ]}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  {workspaceLabel}
                </span>

                {!saved && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Unsaved changes
                  </span>
                )}
              </div>

              <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                Store configuration
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Manage the settings that control this ecommerce workspace.
              </p>
            </div>

            <div className="relative min-w-[250px] lg:hidden">
              <select
                value={activeSection}
                onChange={(event) =>
                  setActiveSection(
                    event.target.value as SettingsSection
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-900"
              >
                {sectionOptions.map((section) => (
                  <option key={section} value={section}>
                    {sectionMeta[section].title}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-6">
          <DashboardSettingsSidebar
            activeSection={activeSection}
            onChange={setActiveSection}
          />

          <main className="min-w-0 flex-1">
            <div className="mb-5 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                {meta.icon}
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {meta.title}
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  {meta.description}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {renderContent()}
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {saved ? "All changes saved" : "You have unsaved changes"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Settings are stored separately for this workspace.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {currentSectionIndex > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(
                        sectionOptions[currentSectionIndex - 1]
                      )
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                )}

                {!saved && (
                  <button
                    type="button"
                    onClick={save}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                  >
                    <Save size={16} />
                    Save changes
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardPageShell>
  );
}