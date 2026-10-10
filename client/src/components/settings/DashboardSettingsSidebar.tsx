import {
  Bell,
  CreditCard,
  Database,
  Globe,
  KeyRound,
  Settings,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
  Users,
} from "lucide-react";

import type { SettingsSection } from "./DashboardSettingsTypes";

interface DashboardSettingsSidebarProps {
  activeSection: SettingsSection;
  onChange: (section: SettingsSection) => void;
}

type SettingItem = {
  id: SettingsSection;
  label: string;
  description: string;
  icon: React.ReactNode;
};

type SettingGroup = {
  label: string;
  items: SettingItem[];
};

const groups: SettingGroup[] = [
  {
    label: "Store",
    items: [
      {
        id: "General",
        label: "General",
        description: "Store identity, contact and regional settings",
        icon: <Store size={17} />,
      },
      {
        id: "Checkout",
        label: "Checkout",
        description: "Customer information and checkout requirements",
        icon: <Settings size={17} />,
      },
      {
        id: "Shipping",
        label: "Shipping & delivery",
        description: "Delivery estimates and shipping charges",
        icon: <Truck size={17} />,
      },
      {
        id: "Policies",
        label: "Policies",
        description: "Refund, return, privacy and store policies",
        icon: <ShieldCheck size={17} />,
      },
    ],
  },
  {
    label: "Payments",
    items: [
      {
        id: "Payments",
        label: "Payment settings",
        description: "Flutterwave and payment configuration",
        icon: <CreditCard size={17} />,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        id: "Account",
        label: "Profile",
        description: "Store owner and account information",
        icon: <UserRound size={17} />,
      },
      {
        id: "Security",
        label: "Security",
        description: "Password and account security",
        icon: <KeyRound size={17} />,
      },
      {
        id: "Users",
        label: "Staff & permissions",
        description: "Team access and permissions",
        icon: <Users size={17} />,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        id: "Notifications",
        label: "Notifications",
        description: "Order, payment and customer notifications",
        icon: <Bell size={17} />,
      },
      {
        id: "Domains",
        label: "Domains",
        description: "Store URL and domain configuration",
        icon: <Globe size={17} />,
      },
    ],
  },
  {
    label: "Advanced",
    items: [
      {
        id: "Data",
        label: "Data & integrations",
        description: "Exports, API access and integrations",
        icon: <Database size={17} />,
      },
      {
        id: "Advanced",
        label: "Store status",
        description: "Store availability and advanced controls",
        icon: <Settings size={17} />,
      },
    ],
  },
];

export default function DashboardSettingsSidebar({
  activeSection,
  onChange,
}: DashboardSettingsSidebarProps) {
  return (
    <aside className="hidden w-[280px] shrink-0 lg:block">
      <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="px-3 pb-3 pt-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Settings
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Manage your store and platform configuration.
          </p>
        </div>

        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {group.label}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onChange(item.id)}
                      className={[
                        "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition",
                        active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          active
                            ? "bg-white/10 text-white"
                            : "bg-slate-100 text-slate-500",
                        ].join(" ")}
                      >
                        {item.icon}
                      </span>

                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {item.label}
                        </span>
                        <span
                          className={[
                            "mt-0.5 block text-[11px] leading-4",
                            active ? "text-slate-300" : "text-slate-500",
                          ].join(" ")}
                        >
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}