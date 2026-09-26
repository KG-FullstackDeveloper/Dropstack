import type {
  FormEvent,
} from "react";
import { useState } from "react";

interface StoreNewsletterProps {
  primaryColor?: string;
}

export default function StoreNewsletter({
  primaryColor = "#111827",
}: StoreNewsletterProps) {
  const [email, setEmail] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    setSubmitted(true);
    setEmail("");
  }

  return (
    <section className="border-t border-slate-200 py-16 dark:border-slate-800">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          Stay updated
        </p>

        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
          Get updates from our store
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Subscribe for product updates,
          new arrivals and special offers.
        </p>

        {submitted ? (
          <div className="mx-auto mt-7 max-w-md rounded-xl border border-slate-200 px-5 py-4 text-sm font-medium dark:border-slate-800">
            Thanks for subscribing.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-7 flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Email address"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />

            <button
              type="submit"
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{
                backgroundColor:
                  primaryColor,
              }}
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}