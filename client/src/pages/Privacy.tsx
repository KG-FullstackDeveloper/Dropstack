
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <main className="min-h-screen bg-[#f6f3ec] px-5 py-16 text-[#171713] sm:px-8 lg:px-12 lg:py-24">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#81796b]">
          MEO Store · Legal
        </p>

        <h1 className="mt-5 font-serif text-4xl sm:text-6xl">
          Privacy Policy
        </h1>

        <p className="mt-5 text-sm leading-7 text-[#716d64]">
          Last updated: October 28, 2026
        </p>

        <p className="mt-8 leading-8 text-[#514d45]">
          MEO Store respects your privacy. This policy explains how we collect,
          use, store, and protect information when you visit our website,
          contact us, or place an order.
        </p>

        <section className="mt-12 space-y-10">
          <div>
            <h2 className="font-serif text-2xl">1. Information We Collect</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              Depending on how you use our website, we may collect information
              you provide, such as your name, email address, delivery address,
              telephone number, order details, and messages sent to customer
              support. We may also collect basic technical information, such
              as your browser, device information, and website usage data.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">2. How We Use Information</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              We use information to process and manage orders, arrange
              delivery, provide order updates, respond to enquiries, prevent
              fraud, maintain website security, improve our services, and meet
              applicable legal obligations.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">3. Payments</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              Payments may be handled by third-party payment providers when
              payment functionality is available. Those providers may process
              information under their own privacy policies. We will describe
              the applicable payment method and provider when it is offered.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">4. Sharing Information</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              We may share necessary information with service providers who
              help us operate the website, process orders, deliver products,
              send transactional communications, maintain security, or comply
              with the law. We do not promise that every third-party service
              will handle information in the same way; please review their
              applicable policies.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">5. Cookies and Analytics</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              Our website or service providers may use cookies or similar
              technologies to support essential website functions, understand
              usage, and improve performance. You can manage cookies through
              your browser, although disabling certain cookies may affect
              website functionality.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">6. Data Retention and Security</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              We retain information for as long as reasonably necessary for
              the purposes described in this policy, including order
              management, recordkeeping, dispute resolution, and legal
              compliance. We use appropriate safeguards, but no method of
              internet transmission or electronic storage can be guaranteed
              completely secure.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">7. Your Privacy Rights</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              Depending on your location and applicable law, you may have
              rights to request access to, correction of, deletion of, or
              restrictions on certain personal information. Contact us to
              submit a request. We may need to verify your identity before
              responding.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">8. Children’s Privacy</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              Our store is not intended to collect personal information from
              children in violation of applicable law. If you believe a child
              has provided personal information improperly, contact us so we
              can review the matter.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">9. Policy Changes</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              We may update this policy as our services or legal obligations
              change. The revised policy will be published on this page with
              an updated revision date.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">10. Contact</h2>
            <p className="mt-3 leading-8 text-[#514d45]">
              For privacy questions or requests, please use our{" "}
              <Link to="/contact" className="underline underline-offset-4">
                contact page
              </Link>
              . Replace this instruction with your verified business contact
              details before launch.
            </p>
          </div>
        </section>

        <div className="mt-16 border-t border-black/10 pt-8 text-sm">
          <Link to="/terms" className="underline underline-offset-4">
            Terms of Service
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
