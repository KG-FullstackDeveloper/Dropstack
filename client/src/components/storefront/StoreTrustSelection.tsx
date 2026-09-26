import {
  Headphones,
  ShieldCheck,
  Truck,
} from "lucide-react";

interface StoreTrustSectionProps {
  primaryColor?: string;
}

export default function StoreTrustSection({
  primaryColor = "#111827",
}: StoreTrustSectionProps) {
  const items = [
    {
      icon: Truck,
      title: "Reliable delivery",
      description:
        "Delivery information is shown during checkout.",
    },
    {
      icon: ShieldCheck,
      title: "Secure shopping",
      description:
        "Your checkout information is handled securely.",
    },
    {
      icon: Headphones,
      title: "Customer support",
      description:
        "Get help when you need it.",
    },
  ];

  return (
    <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto grid max-w-7xl gap-0 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className={`flex items-center gap-4 py-7 lg:px-8 ${
                index !== 0
                  ? "border-t border-slate-200 lg:border-l lg:border-t-0 dark:border-slate-800"
                  : ""
              }`}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                style={{
                  backgroundColor:
                    primaryColor,
                }}
              >
                <Icon size={20} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                  {item.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}