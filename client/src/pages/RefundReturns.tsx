
import { Link } from "react-router-dom";

export default function RefundReturns() {
  return (
    <main className="min-h-screen bg-[#f6f3ec] px-5 py-16 text-[#171713] sm:px-8 lg:px-12 lg:py-24">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#81796b]">
          MEO Store · Customer care
        </p>

        <h1 className="mt-5 font-serif text-4xl sm:text-6xl">
          Refunds & Returns
        </h1>

        <p className="mt-5 text-sm leading-7 text-[#716d64]">
          Last updated: October 28, 2026
        </p>

        <p className="mt-8 leading-8 text-[#514d45]">
          We want you to understand your options if an order arrives damaged,
          incorrect, or is not what you expected. Please read the policy below
          and contact us for help with a specific order.
        </p>

        <section className="mt-12 space-y-10">
          <div>
            <h2 className="font-serif text-2xl">1. Contact Us First</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              Before returning an item, contact our support team with your
              order number, a description of the issue, and relevant photos
              if the product is damaged or incorrect. We will explain the
              applicable next steps.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">2. Damaged or Incorrect Items</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              If your order arrives damaged, defective, or incorrect, contact
              us promptly so we can review the issue and explain the available
              resolution. Depending on the circumstances and applicable law,
              this may include a replacement, repair, refund, or another
              appropriate remedy.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">3. Change-of-Mind Returns</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              Eligibility for change-of-mind returns depends on the product,
              destination, and applicable consumer law. Contact us before
              sending anything back so we can confirm eligibility, the return
              address, and any applicable conditions. Do not mail a return
              without receiving instructions.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">4. Refund Processing</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              Once a refund is approved, we will explain how it will be
              processed. The time it takes for funds to appear depends on the
              payment provider and financial institution. We cannot promise
              an exact processing time for every payment method.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">5. Cancellations</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              If you need to cancel an order, contact us as soon as possible
              with your order number. Cancellation may not be possible once
              processing or dispatch has begun. Any applicable legal
              cancellation rights will still apply.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">6. Return Shipping</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              We will confirm return-shipping arrangements and who is
              responsible for any costs before a return is sent. Responsibility
              may depend on the reason for the return and applicable law.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">7. Legal Rights</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              This policy does not remove or restrict any consumer rights that
              cannot legally be excluded. Where local law provides stronger
              protections, those protections apply.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">8. Contact Support</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              For help with a return, cancellation, or refund, visit our{" "}
              <Link to="/contact" className="underline underline-offset-4">
                contact page
              </Link>
              . Include your order number, but do not send payment passwords
              or other sensitive account credentials.
            </p>
          </div>
        </section>

        <div className="mt-16 border-t border-black/10 pt-8 text-sm">
          <Link to="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          <span className="mx-3 text-black/30">·</span>
          <Link to="/terms" className="underline underline-offset-4">
            Terms of Service
          </Link>
          <span className="mx-3 text-black/30">·</span>
          <Link to="/" className="underline underline-offset-4">
            Back to store
          </Link>
        </div>
      </article>
    </main>
  );
}
