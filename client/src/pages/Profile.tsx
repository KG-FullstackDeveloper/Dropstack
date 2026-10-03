import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeftRight, Save, ShieldCheck, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Profile() {
  const location = useLocation();
  const nigeria = location.pathname.startsWith("/nigeria-admin");
  const backPath = nigeria ? "/nigeria-admin" : "/admin";
  const otherPath = nigeria ? "/admin" : "/nigeria-admin";
  const workspaceLabel = nigeria ? "Nigeria Ecommerce" : "Global Ecommerce";

  const [name, setName] = useState("Store Owner");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("meo_profile_name");
      if (stored?.trim()) setName(stored.trim());
    } catch {
      // Keep default profile name.
    }
  }, []);

  const initials = useMemo(() => {
    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "SO"
    );
  }, [name]);

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim() || "Store Owner";
    setName(nextName);
    localStorage.setItem("meo_profile_name", nextName);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to={backPath}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeftRight size={17} />
            Dashboard
          </Link>
          <Link
            to={otherPath}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            {nigeria ? "Global Dashboard" : "Nigeria Dashboard"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Account</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Profile</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage your personal profile. This is separate from store settings and platform settings.</p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-b border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xl font-black text-white">{initials}</div>
            <div>
              <p className="text-xl font-black">{name}</p>
              <p className="mt-1 text-sm text-slate-500">Store Owner · Administrator</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                <ShieldCheck size={14} />
                {workspaceLabel}
              </div>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-6 p-6 sm:p-8">
            <label className="block max-w-xl">
              <span className="text-sm font-semibold">Full name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={100}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-950/10"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold"><UserRound size={17} />Account role</div>
                <p className="mt-2 text-sm text-slate-500">Store Owner · Administrator</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold">Workspace</p>
                <p className="mt-2 text-sm text-slate-500">{workspaceLabel}</p>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800"
            >
              <Save size={17} />
              {saved ? "Saved" : "Save profile"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
