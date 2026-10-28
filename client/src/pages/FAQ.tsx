import { useState } from "react";
import { ChevronDown } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const questions = [
  {
    question: "How long does delivery take?",
    answer:
      "Delivery time depends on the product, destination, supplier processing, customs and carrier. Check the shipping information shown for your order. We will share tracking details when they are available.",
  },
  {
    question: "Where do you ship?",
    answer:
      "Shipping availability depends on the destination and the products in your order. Available destinations should be confirmed before you place an order.",
  },
  {
    question: "Can I track my order?",
    answer:
      "Use the Order Tracking page with your order number and checkout email. A tracking number may not be available until the order has been dispatched.",
  },
  {
    question: "When is my order processed?",
    answer:
      "Orders move into processing only after the store has confirmed the order according to the payment process shown at checkout. Processing time can vary by product and supplier.",
  },
  {
    question: "Can I cancel an order?",
    answer:
      "Cancellation depends on the current status of the order. Contact support as soon as possible if you need help with an order.",
  },
  {
    question: "How can I contact support?",
    answer:
      "Use the Contact page to send your question. Never send passwords, full card details or payment account credentials in a support message.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <Navbar />

      <main className="bg-slate-50">
        <section className="bg-slate-900 px-6 py-20 text-white">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              FAQ
            </p>

            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
              Frequently asked questions
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Find answers to common questions about shopping, orders,
              and delivery.
            </p>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-3xl space-y-3">
            {questions.map((item, index) => {
              const isOpen = open === index;

              return (
                <div
                  key={item.question}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpen(
                        isOpen ? null : index
                      )
                    }
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
                  >
                    <span className="font-semibold text-slate-900">
                      {item.question}
                    </span>

                    <ChevronDown
                      size={20}
                      className={`shrink-0 transition-transform ${
                        isOpen
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-200 px-6 py-5">
                      <p className="text-sm leading-7 text-slate-600">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}