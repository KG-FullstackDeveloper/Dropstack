import { Mail, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

type FormFields = {
  name: string;
  email: string;
  subject: string;
  message: string;
};
const emptyForm: FormFields = { name: "", email: "", subject: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState<FormFields>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: keyof FormFields, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        data?: { message?: string };
      };
      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "We couldn't send your message. Please try again.",
        );
      }
      setSubmitted(true);
      setForm(emptyForm);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We couldn't send your message. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="bg-slate-50">
        <section className="bg-slate-900 px-6 py-20 text-white">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Dropstack Global Ecommerce · Support
            </p>
            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
              How can we help?
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Have a question about a product, order, or delivery? Send our
              support team a message.
            </p>
          </div>
        </section>
        <section className="px-6 py-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <Mail size={24} className="text-slate-900" />
                <h2 className="mt-4 font-bold text-slate-900">
                  Customer support
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use the form to contact us about products, delivery, or other
                  questions.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <MessageCircle size={24} className="text-slate-900" />
                <h2 className="mt-4 font-bold text-slate-900">
                  Order questions
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Include your order number in the message when asking about an
                  existing order. Do not include payment passwords or wallet
                  recovery phrases.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {submitted ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                    <Send size={24} className="text-emerald-700" />
                  </div>
                  <h2 className="mt-5 text-2xl font-bold text-slate-900">
                    Message received
                  </h2>
                  <p className="mt-3 text-slate-600">
                    Your message was saved successfully. Our team can review it
                    from the support message records.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Name
                    </label>
                    <input
                      id="contact-name"
                      required
                      maxLength={100}
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      autoComplete="name"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      id="contact-email"
                      required
                      type="email"
                      maxLength={254}
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      autoComplete="email"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      required
                      maxLength={160}
                      value={form.subject}
                      onChange={(e) => updateField("subject", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-message"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      maxLength={5000}
                      rows={6}
                      value={form.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                      placeholder="Write your message..."
                    />
                  </div>
                  {error && (
                    <p
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                      {error}
                    </p>
                  )}
                  <button
                    disabled={submitting}
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send size={18} />
                    {submitting ? "Sending..." : "Send message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
