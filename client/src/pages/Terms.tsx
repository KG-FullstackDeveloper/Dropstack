
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <main className="min-h-screen bg-[#f6f3ec] px-5 py-16 text-[#171713] sm:px-8 lg:px-12 lg:py-24">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#81796b]">
          MEO Store · Legal
        </p>

        <h1 className="mt-5 font-serif text-4xl sm:text-6xl">
          Terms of Service
        </h1>

        <p className="mt-5 text-sm leading-7 text-[#716d64]">
          Last updated: October 28, 2026
        </p>

        <p className="mt-8 leading-8 text-[#514d45]">
          These terms apply to your use of the MEO Store website and any
          purchases made through it. By using the website, you agree to
          applicable terms and laws. If you do not agree, please do not use
          the website.
        </p>

        <section className="mt-12 space-y-10">
          <div>
            <h2 className="font-serif text-2xl">1. Eligibility and Use</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              You must be legally able to enter into a purchase agreement in
              your jurisdiction or use the website with appropriate permission
              and supervision. You agree not to misuse the website, interfere
              with its operation, attempt unauthorized access, or provide
              intentionally false information.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">2. Products and Availability</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              We aim to display accurate product descriptions, images, prices,
              and availability. Product appearance may vary slightly depending
              on display settings or supplier variations. We may correct
              errors, update listings, or discontinue products where permitted
              by law. Your statutory consumer rights remain unaffected.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">3. Prices and Orders</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              Prices, available payment methods, applicable taxes, and delivery
              information should be reviewed during checkout. Placing an order
              is a request to purchase; an order confirmation does not
              necessarily mean the order has been accepted or dispatched.
              We will communicate any material issue with an order and handle
              cancellations or refunds in accordance with applicable law and
              our published policies.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">4. Payment</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              Orders must be paid using a payment method actually offered by
              MEO Store at checkout. Payment verification and order processing
              times may vary. Do not assume an order is paid or confirmed
              until the website or our authorized support team confirms its
              status.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">5. Shipping and Delivery</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              Delivery estimates are estimates rather than guaranteed arrival
              dates unless explicitly stated otherwise. Delivery options,
              eligible destinations, fees, and tracking availability may vary
              by product and destination. For details, see our{" "}
              <Link to="/shipping" className="underline underline-offset-4">
                shipping information
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">6. Returns and Refunds</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              Return eligibility, procedures, and refund handling are described
              in our{" "}
              <Link
                to="/refund-returns"
                className="underline underline-offset-4"
              >
                Refunds & Returns policy
              </Link>
              . Nothing in these terms excludes consumer rights that cannot
              legally be excluded or restricted.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">7. Intellectual Property</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              Website content, branding, graphics, and original materials may
              be protected by intellectual property laws. You may not copy,
              distribute, or commercially exploit protected content without
              permission, except where the law allows.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">8. Third-Party Services</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              The website may rely on third-party services for payments,
              delivery, hosting, analytics, or other functions. We are not
              responsible for independent third-party websites or services
              beyond responsibilities imposed on us by applicable law.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">9. Liability</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              To the extent permitted by law, MEO Store is not responsible for
              losses caused by events beyond our reasonable control or
              unauthorized use of the website. Nothing in these terms limits
              liability or consumer protections where such a limitation would
              be unlawful.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">10. Changes to These Terms</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              We may revise these terms when our services or legal obligations
              change. Updated terms will be published on this page with a
              revised date. Changes apply as permitted by applicable law.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">11. Contact</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              For questions about these terms or an order, please visit our{" "}
              <Link to="/contact" className="underline underline-offset-4">
                contact page
              </Link>
              . Add your verified business contact details before launch.
            </p>
          </div>
        </section>

        <div className="mt-16 border-t border-black/10 pt-8 text-sm">
          <Link to="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          <span className="mx-3 text-black/30">·</span>
          <Link to="/refund-returns" className="underline underline-offset-4">
            Refunds & Returns
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
