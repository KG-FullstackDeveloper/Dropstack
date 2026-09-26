import {
  Mail,
  MessageCircle,
  Send,
} from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <Navbar />

      <main className="bg-slate-50">
        <section className="bg-slate-900 px-6 py-20 text-white">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Contact
            </p>

            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
              How can we help?
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Have a question about a product, order, shipping, or
              anything else? Send us a message.
            </p>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <Mail
                  size={24}
                  className="text-slate-900"
                />

                <h2 className="mt-4 font-bold text-slate-900">
                  Email support
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Send us your question and our support team can help
                  with your request.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <MessageCircle
                  size={24}
                  className="text-slate-900"
                />

                <h2 className="mt-4 font-bold text-slate-900">
                  Order questions
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Include your order information when contacting us
                  about an existing order.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {submitted ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                    <Send
                      size={24}
                      className="text-slate-900"
                    />
                  </div>

                  <h2 className="mt-5 text-2xl font-bold text-slate-900">
                    Message received
                  </h2>

                  <p className="mt-3 text-slate-600">
                    Your message has been prepared successfully.
                  </p>

                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Name
                    </label>

                    <input
                      required
                      type="text"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </label>

                    <input
                      required
                      type="email"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Subject
                    </label>

                    <input
                      required
                      type="text"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Message
                    </label>

                    <textarea
                      required
                      rows={6}
                      className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                      placeholder="Write your message..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 font-semibold text-white hover:bg-slate-800"
                  >
                    <Send size={18} />
                    Send message
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