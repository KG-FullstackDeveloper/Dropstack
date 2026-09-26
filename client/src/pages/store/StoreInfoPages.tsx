import {
ChevronDown,
Mail,
MapPin,
ShieldCheck,
Truck,
RotateCcw,
FileText,
Lock,
} from "lucide-react";
import { useState, type ReactNode } from "react";

interface StoreInfoPageProps {
storeName?: string;
onBackHome: () => void;
}

function PageShell({
title,
description,
icon,
children,
onBackHome,
}: {
title: string;
description: string;
icon: ReactNode;
children: ReactNode;
onBackHome: () => void;
}) {
return (
<main className="min-h-screen bg-white">
<section className="border-b border-slate-200 bg-slate-50">
<div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-20">
<button type="button" onClick={onBackHome} className="mb-8 text-sm font-medium text-slate-500 transition hover:text-slate-950" >
← Back to home
</button>

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
          {icon}
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  </section>

  <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
    <div className="prose prose-slate max-w-none">
      {children}
    </div>
  </section>
</main>

);
}

export function AboutPage({
storeName = "Our Store",
onBackHome,
}: StoreInfoPageProps) {
return (
<PageShell
title={`About ${storeName}`}
description="Learn more about our store, products and commitment to a simple shopping experience."
icon={<ShieldCheck size={22} />}
onBackHome={onBackHome}
>
<div className="grid gap-6 md:grid-cols-3">
<div className="rounded-3xl border border-slate-200 p-6">
<ShieldCheck className="mb-4" size={24} />

      <h2 className="text-lg font-semibold text-slate-950">
        Quality
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        We carefully select products based on usefulness,
        quality and value.
      </p>
    </div>

    <div className="rounded-3xl border border-slate-200 p-6">
      <Truck className="mb-4" size={24} />

      <h2 className="text-lg font-semibold text-slate-950">
        Delivery
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Orders are shipped according to the delivery
        timeframe shown for your market.
      </p>
    </div>

    <div className="rounded-3xl border border-slate-200 p-6">
      <Lock className="mb-4" size={24} />

      <h2 className="text-lg font-semibold text-slate-950">
        Secure shopping
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        We use secure payment and checkout processes to
        protect your order information.
      </p>
    </div>
  </div>

  <div className="mt-12">
    <h2 className="text-2xl font-semibold text-slate-950">
      Our approach
    </h2>

    <p className="mt-4 text-base leading-8 text-slate-600">
      Our goal is to make online shopping straightforward.
      We focus on useful products, clear pricing, transparent
      delivery information and a simple checkout experience.
    </p>
  </div>
</PageShell>

);
}

const FAQS = [
{
question: "How long will my order take to arrive?",
answer:
"Delivery time depends on your destination. Your estimated delivery timeframe is shown during checkout before you place your order.",
},
{
question: "How do I track my order?",
answer:
"Once tracking information becomes available, it can be provided through your order information.",
},
{
question: "Can I cancel my order?",
answer:
"Contact us as soon as possible after placing your order. Cancellation depends on the current processing and fulfillment status.",
},
{
question: "What payment methods are available?",
answer:
"Available payment methods are displayed during checkout and may vary by market.",
},
{
question: "Do you ship internationally?",
answer:
"Shipping availability and delivery times depend on the destination country and are calculated for your market.",
},
{
question: "How do refunds work?",
answer:
"Refund eligibility is governed by the Refund Policy. The applicable delivery deadline and refund window depend on your destination.",
},
];

export function FAQPage({
onBackHome,
}: {
onBackHome: () => void;
}) {
const [openIndex, setOpenIndex] = useState<number | null>(null);

return (
<PageShell
title="Frequently Asked Questions"
description="Answers to common questions about orders, delivery, payments and refunds."
icon={<ChevronDown size={22} />}
onBackHome={onBackHome}
>
<div className="space-y-3">
{FAQS.map((faq, index) => {
const open = openIndex === index;

      return (
        <div
          key={faq.question}
          className="overflow-hidden rounded-2xl border border-slate-200"
        >
          <button
            type="button"
            onClick={() =>
              setOpenIndex(open ? null : index)
            }
            className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
          >
            <span className="font-medium text-slate-950">
              {faq.question}
            </span>

            <ChevronDown
              size={19}
              className={`shrink-0 transition ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {open && (
            <div className="border-t border-slate-200 px-5 py-5">
              <p className="text-sm leading-7 text-slate-600">
                {faq.answer}
              </p>
            </div>
          )}
        </div>
      );
    })}
  </div>
</PageShell>

);
}

export function ShippingPolicyPage({
onBackHome,
}: {
onBackHome: () => void;
}) {
return (
<PageShell
title="Shipping Policy"
description="Information about delivery estimates, shipping and order fulfillment."
icon={<Truck size={22} />}
onBackHome={onBackHome}
>
<h2>Delivery estimates</h2>

  <p>
    Delivery estimates depend on the destination market and
    the products included in your order. The applicable
    estimated delivery period is displayed during checkout.
  </p>

  <h2>International shipping</h2>

  <p>
    Some orders may be fulfilled internationally. Delivery
    times can be affected by customs processing, carrier
    delays, weather and other circumstances outside our
    control.
  </p>

  <h2>Address accuracy</h2>

  <p>
    Customers are responsible for providing a complete and
    accurate delivery address, including the correct phone
    number and postal information where applicable.
  </p>

  <h2>Delivery delays</h2>

  <p>
    If an order takes longer than the stated estimated
    delivery period, please contact us with your order
    information so that we can review its status.
  </p>
</PageShell>

);
}

export function RefundPolicyPage({
onBackHome,
}: {
onBackHome: () => void;
}) {
return (
<PageShell
title="Refund Policy"
description="Our policy for refund requests and delivery-related issues."
icon={<RotateCcw size={22} />}
onBackHome={onBackHome}
>
<h2>When can a refund be requested?</h2>

  <p>
    Refund requests become eligible only after the stated
    estimated delivery deadline has passed and the applicable
    additional waiting period has elapsed.
  </p>

  <h2>Refund request window</h2>

  <p>
    Once an order becomes eligible, the refund request window
    is limited. The exact eligibility period depends on the
    destination market and the delivery estimate provided at
    checkout.
  </p>

  <h2>Order review</h2>

  <p>
    Refund requests are reviewed using the order information,
    delivery status and available shipping or tracking
    information.
  </p>

  <h2>Contacting us</h2>

  <p>
    When contacting us about a refund, provide your order
    number, customer email and a clear description of the
    issue.
  </p>
</PageShell>

);
}

export function PrivacyPolicyPage({
onBackHome,
}: {
onBackHome: () => void;
}) {
return (
<PageShell
title="Privacy Policy"
description="How customer information is used to operate the store and fulfill orders."
icon={<Lock size={22} />}
onBackHome={onBackHome}
>
<h2>Information we collect</h2>

  <p>
    We may collect information you provide during shopping and
    checkout, including your name, email address, phone number,
    delivery address and order information.
  </p>

  <h2>How information is used</h2>

  <p>
    Information is used to process orders, communicate with
    customers, arrange delivery, provide customer support and
    maintain the operation of the store.
  </p>

  <h2>Payment information</h2>

  <p>
    Payment information is handled by the payment provider.
    We do not intentionally store customers' full card
    information on the store's own systems.
  </p>

  <h2>Third-party services</h2>

  <p>
    The store may use third-party services for payment,
    delivery, analytics, hosting and other operational
    functions. Information shared with these services is
    limited to what is required for the relevant service.
  </p>

  <h2>Contact</h2>

  <p>
    If you have questions about privacy or your personal
    information, contact the store through the available
    customer-support channel.
  </p>
</PageShell>

);
}

export function TermsPage({
onBackHome,
}: {
onBackHome: () => void;
}) {
return (
<PageShell
title="Terms of Service"
description="The terms that apply when using this store and placing an order."
icon={<FileText size={22} />}
onBackHome={onBackHome}
>
<h2>Using the store</h2>

  <p>
    By using this website, you agree to use the store
    lawfully and provide accurate information when placing an
    order.
  </p>

  <h2>Orders</h2>

  <p>
    An order request is subject to successful payment,
    product availability and confirmation by the store.
  </p>

  <h2>Product information</h2>

  <p>
    Product descriptions, images, availability and prices may
    be updated from time to time. We aim to keep product
    information accurate and current.
  </p>

  <h2>Pricing</h2>

  <p>
    The price displayed at checkout is the amount applicable
    to the selected market and currency at the time the order
    is submitted.
  </p>

  <h2>Delivery</h2>

  <p>
    Delivery estimates are estimates rather than guaranteed
    delivery dates. Customs, carrier delays and other events
    outside the store's control may affect delivery.
  </p>

  <h2>Refunds</h2>

  <p>
    Refunds are handled according to the store's Refund
    Policy.
  </p>

  <h2>Changes</h2>

  <p>
    These terms may be updated when necessary. The version
    published on the website is the version applicable to
    future use of the store.
  </p>
</PageShell>

);
}

export function ContactPage({
storeName = "Our Store",
onBackHome,
}: StoreInfoPageProps) {
return (
<PageShell
title="Contact Us"
description={`Get in touch with ${storeName} about an order, delivery or general question.`}
icon={<Mail size={22} />}
onBackHome={onBackHome}
>
<div className="grid gap-6 md:grid-cols-2">
<div className="rounded-3xl border border-slate-200 p-6">
<Mail className="mb-4" size={24} />

      <h2 className="text-lg font-semibold text-slate-950">
        Email
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Contact the store using the customer-support email
        provided by the store owner.
      </p>
    </div>

    <div className="rounded-3xl border border-slate-200 p-6">
      <MapPin className="mb-4" size={24} />

      <h2 className="text-lg font-semibold text-slate-950">
        Order support
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        When contacting us about an order, include your order
        number so we can locate it quickly.
      </p>
    </div>
  </div>
</PageShell>

);
}