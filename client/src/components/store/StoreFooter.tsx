import {
AtSign,
Globe2,
Mail,
MessageCircle,
} from "lucide-react";

import type {
StoreConfig,
StorePageType,
} from "../../types/store";

interface StoreFooterProps {
store: StoreConfig;
onNavigate: (
page: StorePageType,
) => void;
}

export default function StoreFooter({
store,
onNavigate,
}: StoreFooterProps) {
const year = new Date().getFullYear();

const logo =
store.logoUrl || null;

function navigate(page: StorePageType) {
onNavigate(page);
}

return (
<footer className="border-t border-slate-200 bg-slate-950 text-white">
<div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
<div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
<div className="lg:col-span-2">
<button
type="button"
onClick={() =>
navigate("home")
}
className="flex items-center gap-3 text-left"
>
{logo ? (
<img src={logo} alt={store.name} className="h-10 w-auto max-w-[170px] object-contain" />
) : (
<span className="text-xl font-bold tracking-tight">
{store.name}
</span>
)}
</button>

        {store.description && (
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
            {store.description}
          </p>
        )}

        <div className="mt-6 flex items-center gap-2">
          <SocialButton
            label="Facebook"
            icon={<Globe2 size={17} />}
          />

          <SocialButton
            label="Instagram"
            icon={<MessageCircle size={17} />}
          />

          <SocialButton
            label="Twitter"
            icon={<AtSign size={17} />}
          />

          <SocialButton
            label="Email"
            icon={<Mail size={17} />}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">
          Store
        </h3>

        <div className="mt-5 space-y-3">
          <FooterLink
            label="Home"
            onClick={() =>
              navigate("home")
            }
          />

          <FooterLink
            label="Shop"
            onClick={() =>
              navigate("catalog")
            }
          />

          <FooterLink
            label="About"
            onClick={() =>
              navigate("about")
            }
          />

          <FooterLink
            label="Contact"
            onClick={() =>
              navigate("contact")
            }
          />

          <FooterLink
            label="FAQ"
            onClick={() =>
              navigate("faq")
            }
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">
          Policies
        </h3>

        <div className="mt-5 space-y-3">
          <FooterLink
            label="Shipping"
            onClick={() =>
              navigate("shipping")
            }
          />

          <FooterLink
            label="Refund policy"
            onClick={() =>
              navigate("refund")
            }
          />

          <FooterLink
            label="Privacy policy"
            onClick={() =>
              navigate("privacy")
            }
          />

          <FooterLink
            label="Terms of service"
            onClick={() =>
              navigate("terms")
            }
          />
        </div>
      </div>
    </div>

    <div className="mt-12 border-t border-white/10 pt-7">
      <div className="flex flex-col gap-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {store.name}. All
          rights reserved.
        </p>

        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <span>
            Secure shopping
          </span>

          <span>
            Worldwide delivery
          </span>

          <span>
            Customer support
          </span>
        </div>
      </div>
    </div>
  </div>
</footer>

);
}

function FooterLink({
label,
onClick,
}: {
label: string;
onClick: () => void;
}) {
return (
<button type="button" onClick={onClick} className="block text-left text-sm text-slate-400 transition hover:text-white" >
{label}
</button>
);
}

function SocialButton({
label,
icon,
}: {
label: string;
icon: React.ReactNode;
}) {
return (
<button type="button" aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:border-white/20 hover:bg-white/10 hover:text-white" >
{icon}
</button>
);
}