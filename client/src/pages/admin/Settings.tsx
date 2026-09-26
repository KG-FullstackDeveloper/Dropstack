import {
  Settings as SettingsIcon,
  Store,
  CreditCard,
  Bell,
} from "lucide-react";

export default function Settings() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-950">
        Settings
      </h1>

      <p className="mt-2 text-slate-500">
        Configure your store and account.
      </p>

      <div className="mt-8 space-y-4">
        <Setting
          icon={Store}
          title="Store settings"
          description="Store name, domain and storefront information."
        />

        <Setting
          icon={CreditCard}
          title="Payment settings"
          description="Configure your Flutterwave payment connection."
        />

        <Setting
          icon={Bell}
          title="Notifications"
          description="Choose which store notifications you receive."
        />

        <Setting
          icon={SettingsIcon}
          title="General settings"
          description="Manage general preferences for your store."
        />
      </div>
    </div>
  );
}

function Setting({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Store;
  title: string;
  description: string;
}) {
  return (
    <button className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left transition hover:border-slate-300 hover:shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
        <Icon size={20} />
      </div>

      <div>
        <h2 className="font-semibold text-slate-950">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>
    </button>
  );
}