import {
  ArrowLeft,
  Check,
  KeyRound,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  changeEmail,
  changePassword,
  getMe,
  updateProfile,
  type AdminUser,
} from "../services/adminApi";

export default function Profile() {
  const location = useLocation();
  const nigeria = location.pathname.startsWith("/nigeria-admin");

  const backPath = nigeria ? "/nigeria-admin" : "/admin";
  const otherPath = nigeria ? "/admin/profile" : "/nigeria-admin/profile";
  const workspaceLabel = nigeria ? "Nigeria Ecommerce" : "Global Ecommerce";

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [currentEmailPassword, setCurrentEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getMe()
      .then((result) => {
        if (!active) return;

        setAdmin(result);
        setName(result.name || "Store Owner");
        setPhone(result.phone || "");
        setEmail(result.email || "");
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load profile."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const initials = useMemo(
    () =>
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "SO",
    [name]
  );

  function clearAlerts() {
    setMessage("");
    setError("");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingProfile(true);
    clearAlerts();

    try {
      const result = await updateProfile(
        name.trim(),
        phone.trim() || null
      );

      setAdmin(result);
      setName(result.name);
      setPhone(result.phone || "");
      setEmail(result.email);

      setMessage("Profile saved successfully.");

      window.dispatchEvent(
        new CustomEvent("meo:profile-updated")
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingEmail(true);
    clearAlerts();

    try {
      const result = await changeEmail(
        currentEmailPassword,
        newEmail.trim()
      );

      setEmail(result.email);
      setNewEmail("");
      setCurrentEmailPassword("");

      setMessage(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change email."
      );
    } finally {
      setSavingEmail(false);
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingPassword(true);
    clearAlerts();

    try {
      const result = await changePassword(
        currentPassword,
        newPassword
      );

      setNewPassword("");
      setCurrentPassword("");

      setMessage(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change password."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to={backPath}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <ArrowLeft size={17} />
            Dashboard
          </Link>

          <Link
            to={otherPath}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {nigeria ? "Global Dashboard" : "Nigeria Dashboard"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Account settings
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Profile & security
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage your administrator identity, contact details, email
            address and password.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <Check size={17} />
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Loading profile…
          </div>
        ) : (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-950 px-6 py-8 text-white sm:px-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white text-xl font-black text-slate-950">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-2xl font-black">
                      {name || "Store Owner"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-300">
                      Store Owner · Administrator
                    </p>

                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 ring-1 ring-white/10">
                      <ShieldCheck size={14} />
                      {workspaceLabel}
                    </div>
                  </div>
                </div>
              </div>

              <form
                onSubmit={saveProfile}
                className="space-y-6 p-6 sm:p-8"
              >
                <div>
                  <h3 className="text-lg font-black">
                    Personal information
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Update the information associated with your administrator
                    account.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold">
                      Full name
                    </span>

                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      minLength={2}
                      maxLength={100}
                      required
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-950/10"
                    />
                  </label>

                  <label className="block">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <Phone size={15} />
                      Phone
                    </span>

                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      maxLength={30}
                      placeholder="Optional"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-950/10"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <InfoCard
                    icon={Mail}
                    label="Email"
                    value={email || "—"}
                  />

                  <InfoCard
                    icon={UserRound}
                    label="Role"
                    value="Store Owner · Administrator"
                  />

                  <InfoCard
                    icon={ShieldCheck}
                    label="2FA"
                    value={
                      admin?.twoFactorEnabled
                        ? "Infrastructure enabled"
                        : "Not enabled"
                    }
                  />
                </div>

                <button
                  disabled={savingProfile}
                  type="submit"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={17} />
                  {savingProfile ? "Saving…" : "Save profile"}
                </button>
              </form>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <form
                onSubmit={submitEmail}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-slate-100 p-2.5">
                    <Mail size={19} />
                  </div>

                  <div>
                    <h2 className="font-black">Change email</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Your current password is required to change the
                      administrator email.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <input
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    type="email"
                    required
                    placeholder="New email address"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-950/10"
                  />

                  <input
                    value={currentEmailPassword}
                    onChange={(event) =>
                      setCurrentEmailPassword(event.target.value)
                    }
                    type="password"
                    required
                    placeholder="Current password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-950/10"
                  />
                </div>

                <button
                  disabled={savingEmail}
                  type="submit"
                  className="mt-4 rounded-xl border border-slate-900 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingEmail ? "Updating…" : "Change email"}
                </button>
              </form>

              <form
                onSubmit={submitPassword}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-slate-100 p-2.5">
                    <KeyRound size={19} />
                  </div>

                  <div>
                    <h2 className="font-black">Change password</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Use a strong password with at least 12 characters.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <input
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(event.target.value)
                    }
                    type="password"
                    required
                    placeholder="Current password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-950/10"
                  />

                  <input
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(event.target.value)
                    }
                    type="password"
                    required
                    minLength={12}
                    placeholder="New password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-950/10"
                  />
                </div>

                <button
                  disabled={savingPassword}
                  type="submit"
                  className="mt-4 rounded-xl border border-slate-900 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingPassword ? "Updating…" : "Change password"}
                </button>
              </form>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <h2 className="font-black">Account security</h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    Your account uses authenticated backend access. Password
                    changes are persisted through the server and existing
                    authentication protections remain active.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Icon size={16} />
        {label}
      </div>

      <p className="mt-2 break-words text-sm text-slate-500">
        {value}
      </p>
    </div>
  );
}