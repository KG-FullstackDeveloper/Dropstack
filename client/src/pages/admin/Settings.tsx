import {
  Bell,
  ChevronRight,
  CreditCard,
  Globe2,
  KeyRound,
  LockKeyhole,
  Settings as SettingsIcon,
  ShieldCheck,
  Store,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

type SettingItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  status: string;
  href?: string;
};

type SettingSection = {
  title: string;
  description: string;
  items: SettingItem[];
};

const sections: SettingSection[] = [
  {
    title: "Store",
    description:
      "Manage your storefront identity and business information.",
    items: [
      {
        title: "Store details",
        description:
          "Store name, business information and storefront settings.",
        icon: Store,
        status: "Store",
      },
      {
        title: "Domains",
        description:
          "Manage the public address used by your storefront.",
        icon: Globe2,
        status: "Storefront",
      },
    ],
  },
  {
    title: "Payments",
    description:
      "Control how customers pay for orders.",
    items: [
      {
        title: "Payment providers",
        description:
          "Manage your Flutterwave payment connection.",
        icon: CreditCard,
        status: "Flutterwave",
      },
    ],
  },
  {
    title: "Account & security",
    description:
      "Protect your administrator account and manage access.",
    items: [
      {
        title: "Profile",
        description:
          "Update your name, phone number and administrator details.",
        icon: UserRound,
        status: "Account",
        href: "/admin/profile",
      },
      {
        title: "Security",
        description:
          "Change your password and manage account security.",
        icon: LockKeyhole,
        status: "Protected",
        href: "/admin/profile",
      },
      {
        title: "Authentication",
        description:
          "Review available authentication and verification controls.",
        icon: ShieldCheck,
        status: "Security",
        href: "/admin/profile",
      },
    ],
  },
  {
    title: "Communication",
    description:
      "Control store and administrator notifications.",
    items: [
      {
        title: "Notifications",
        description:
          "Choose which important store events you receive.",
        icon: Bell,
        status: "Notifications",
      },
    ],
  },
];

export default function Settings() {
  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <SettingsIcon size={21} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Administration
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                Settings
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Configure your store, payments, administrator account,
            security and notification preferences.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Link
            to="/admin/profile"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-slate-100 p-2.5">
                <UserRound size={19} />
              </div>

              <ChevronRight
                size={18}
                className="text-slate-400 transition group-hover:translate-x-1"
              />
            </div>

            <h2 className="mt-5 font-bold text-slate-950">
              Administrator profile
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your personal account information.
            </p>
          </Link>

          <Link
            to="/admin/profile"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-slate-100 p-2.5">
                <KeyRound size={19} />
              </div>

              <ChevronRight
                size={18}
                className="text-slate-400 transition group-hover:translate-x-1"
              />
            </div>

            <h2 className="mt-5 font-bold text-slate-950">
              Password & security
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Change your password and review security controls.
            </p>
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-slate-100 p-2.5">
                <ShieldCheck size={19} />
              </div>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                Active
              </span>
            </div>

            <h2 className="mt-5 font-bold text-slate-950">
              Admin protection
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your administrator area is protected by authenticated access.
            </p>
          </div>
        </div>

        <div className="space-y-7">
          {sections.map((section) => (
            <section key={section.title}>
              <div className="mb-3">
                <h2 className="text-lg font-black text-slate-950">
                  {section.title}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {section.description}
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {section.items.map((item, index) => {
                  const Icon = item.icon;

                  const content = (
                    <>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Icon size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-950">
                            {item.title}
                          </h3>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            {item.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.description}
                        </p>
                      </div>

                      <ChevronRight
                        size={19}
                        className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700"
                      />
                    </>
                  );

                  if (item.href) {
                    return (
                      <Link
                        key={item.title}
                        to={item.href}
                        className={`group flex items-center gap-4 p-5 transition hover:bg-slate-50 ${
                          index !== section.items.length - 1
                            ? "border-b border-slate-100"
                            : ""
                        }`}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.title}
                      type="button"
                      className={`group flex w-full items-center gap-4 p-5 text-left transition hover:bg-slate-50 ${
                        index !== section.items.length - 1
                          ? "border-b border-slate-100"
                          : ""
                      }`}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-slate-100 p-2.5">
              <SettingsIcon size={18} />
            </div>

            <div>
              <h2 className="font-bold text-slate-950">
                Global Ecommerce settings
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                These settings belong to the Global Ecommerce workspace.
                Nigeria Ecommerce has its own separate administration,
                products, orders, customers and configuration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}