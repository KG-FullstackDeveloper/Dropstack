import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  HelpCircle,
  Plus,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

export type DashboardWorkspace =
  | "global"
  | "nigeria";

interface DashboardUtilitiesProps {
  workspace: DashboardWorkspace;
  profileName?: string;
  profileRole?: string;
}

function workspaceMeta(
  workspace: DashboardWorkspace,
) {
  if (workspace === "nigeria") {
    return {
      dashboard: "/nigeria-admin",
      profile: "/nigeria-admin/profile",
      store: "/nigeria-store",
      otherDashboard: "/admin",
      otherLabel: "Global Dashboard",
      name: profileNameSafe(
        "Nigeria Ecommerce",
      ),
    };
  }

  return {
    dashboard: "/admin",
    profile: "/admin/profile",
    store: "/store",
    otherDashboard: "/nigeria-admin",
    otherLabel: "Nigeria Dashboard",
    name: profileNameSafe("Store Owner"),
  };
}

function profileNameSafe(fallback: string) {
  try {
    const saved = localStorage.getItem(
      "meo_profile_name",
    );

    return saved?.trim() || fallback;
  } catch {
    return fallback;
  }
}

export function DashboardAccountTools({
  workspace,
  profileName,
  profileRole = "Administrator",
}: DashboardUtilitiesProps) {
  const meta = workspaceMeta(workspace);
  const [open, setOpen] = useState(false);

  const ref =
    useRef<HTMLDivElement | null>(null);

  const name =
    profileName?.trim() || meta.name;

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]?.toUpperCase() || "",
      )
      .join("") || "SO";

  useEffect(() => {
    function handlePointerDown(
      event: MouseEvent,
    ) {
      if (
        !ref.current?.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );
  }, []);

  return (
    <div className="flex items-center gap-2">
      {workspace === "global" && (
        <Link
          to="/admin/ai"
          aria-label="Open MEO AI"
          className="flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
        >
          <Sparkles size={16} />
          <span className="hidden sm:inline">
            MEO AI
          </span>
        </Link>
      )}

      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() =>
            setOpen(
              (current) => !current,
            )
          }
          className="flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
            {initials}
          </span>

          <span className="hidden text-left sm:block">
            <span className="block text-xs font-bold leading-4 text-slate-950">
              {name}
            </span>

            <span className="block text-[11px] leading-4 text-slate-400">
              {profileRole}
            </span>
          </span>

          <ChevronDown
            size={15}
            className={`hidden text-slate-400 transition sm:block ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+10px)] z-[120] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
          >
            <div className="border-b border-slate-100 px-3 py-3">
              <p className="text-sm font-black text-slate-950">
                {name}
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                {profileRole}
              </p>
            </div>

            <Link
              to={meta.profile}
              role="menuitem"
              onClick={() =>
                setOpen(false)
              }
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <UserRound size={17} />
              Profile
            </Link>

            {workspace === "global" && (
              <Link
                to="/admin/ai"
                role="menuitem"
                onClick={() =>
                  setOpen(false)
                }
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Sparkles size={17} />
                MEO AI
              </Link>
            )}

            <Link
              to={meta.store}
              role="menuitem"
              onClick={() =>
                setOpen(false)
              }
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink size={17} />
              Open storefront
            </Link>

            <Link
              to={meta.otherDashboard}
              role="menuitem"
              onClick={() =>
                setOpen(false)
              }
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus size={17} />
              {meta.otherLabel}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardFAB({
  workspace,
}: {
  workspace: DashboardWorkspace;
}) {
  const [open, setOpen] =
    useState(false);

  const meta = workspaceMeta(workspace);

  return (
    <div className="fixed bottom-5 right-5 z-[110] sm:bottom-7 sm:right-7">
      {open && (
        <div className="mb-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
          <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Quick actions
          </p>

          {workspace === "global" && (
            <Link
              to="/admin/ai"
              onClick={() =>
                setOpen(false)
              }
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Sparkles size={17} />
              MEO AI
            </Link>
          )}

          <Link
            to={meta.profile}
            onClick={() =>
              setOpen(false)
            }
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <UserRound size={17} />
            Open Profile
          </Link>

          <Link
            to={meta.store}
            onClick={() =>
              setOpen(false)
            }
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink size={17} />
            Open Storefront
          </Link>

          <Link
            to={meta.otherDashboard}
            onClick={() =>
              setOpen(false)
            }
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus size={17} />
            Switch Dashboard
          </Link>

          <a
            href="mailto:support@example.com"
            onClick={() =>
              setOpen(false)
            }
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <HelpCircle size={17} />
            Support
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) => !current,
          )
        }
        aria-label="Quick actions"
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl transition hover:scale-105 hover:shadow-2xl"
      >
        {open ? (
          <X size={23} />
        ) : (
          <Plus size={23} />
        )}
      </button>
    </div>
  );
}