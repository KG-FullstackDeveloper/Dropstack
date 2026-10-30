import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER?.trim();
const SMTP_PASSWORD = process.env.SMTP_PASSWORD?.trim();
const EMAIL_FROM = process.env.EMAIL_FROM?.trim() || SMTP_USER;

function getTransporter() {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    throw new Error(
      "Email service is not configured. Set SMTP_USER and SMTP_PASSWORD in the server .env file."
    );
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(currency: string, amount: number): string {
  return `${currency} ${Number(amount).toFixed(2)}`;
}

export interface SendPasswordResetCodeOptions {
  recipientEmail: string;
  recipientName?: string | null;
  code: string;
  expiresInMinutes: number;
}

export async function sendPasswordResetCode({
  recipientEmail,
  recipientName,
  code,
  expiresInMinutes,
}: SendPasswordResetCodeOptions): Promise<void> {
  const transporter = getTransporter();
  const displayName =
    recipientName?.trim() || recipientEmail.split("@")[0] || "there";

  if (!EMAIL_FROM) {
    throw new Error("EMAIL_FROM is not configured.");
  }

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: recipientEmail,
    subject: "Your password recovery code",
    text: [
      `Hello ${displayName},`,
      "",
      "We received a request to reset your ecommerce admin password.",
      "",
      `Your 6-digit recovery code is: ${code}`,
      "",
      `This code expires in ${expiresInMinutes} minutes.`,
      "",
      "If you did not request a password reset, you can safely ignore this email.",
      "",
      "Do not share this code with anyone.",
    ].join("\n"),
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">
          <div style="max-width:560px;margin:40px auto;padding:24px;">
            <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
              <h1 style="margin:0 0 16px;font-size:24px;">Password recovery</h1>
              <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
                Hello ${escapeHtml(displayName)},
              </p>
              <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
                We received a request to reset your ecommerce admin password.
              </p>
              <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">
                  YOUR RECOVERY CODE
                </div>
                <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;">
                  ${escapeHtml(code)}
                </div>
              </div>
              <p style="font-size:14px;line-height:1.6;color:#4b5563;">
                This code expires in ${expiresInMinutes} minutes.
              </p>
              <p style="font-size:14px;line-height:1.6;color:#4b5563;">
                If you did not request a password reset, you can safely ignore this email.
              </p>
              <p style="font-size:14px;line-height:1.6;color:#4b5563;">
                Do not share this code with anyone.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function verifyEmailConnection(): Promise<void> {
  const transporter = getTransporter();
  await transporter.verify();
}

export interface OrderEmailDetails {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  currency: string;
  items?: Array<{
    product_name: string;
    quantity: number;
    total: number;
  }>;
  trackingNumber?: string | null;
  shippingAddress?: string;
}

/**
 * Best-effort delivery is used for secondary notifications.
 * Failures are logged and do not interrupt the underlying order operation.
 */
async function sendBestEffortEmail(message: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  try {
    if (!EMAIL_FROM) {
      throw new Error("EMAIL_FROM is not configured.");
    }

    const transporter = getTransporter();

    await transporter.sendMail({
      from: EMAIL_FROM,
      ...message,
    });
  } catch (error) {
    console.error(
      "Email delivery failed.",
      error instanceof Error ? error.message : "Unknown email error"
    );
  }
}

/**
 * Sends the customer's order-confirmation email.
 *
 * IMPORTANT:
 * This function intentionally throws if delivery fails.
 * The caller must set email_sent = 1 only after this function succeeds.
 * That allows failed messages to be retried without marking them as sent.
 */
export async function sendOrderConfirmationEmail(
  order: OrderEmailDetails
): Promise<void> {
  if (!EMAIL_FROM) {
    throw new Error("EMAIL_FROM is not configured.");
  }

  if (!order.customerEmail?.trim()) {
    throw new Error("Cannot send order confirmation: customer email is missing.");
  }

  const transporter = getTransporter();
  const customerName = order.customerName?.trim() || "Customer";
  const safeOrderId = escapeHtml(order.orderId);
  const safeCustomerName = escapeHtml(customerName);
  const safeCurrency = escapeHtml(order.currency);

  const items = order.items ?? [];

  const textItems = items.map(
    (item) =>
      `${item.product_name} x ${item.quantity}: ${formatMoney(
        order.currency,
        item.total
      )}`
  );

  const htmlItems = items.length
    ? items
        .map(
          (item) => `
            <tr>
              <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;color:#111827;">
                ${escapeHtml(item.product_name)}
                <span style="color:#6b7280;"> × ${item.quantity}</span>
              </td>
              <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap;color:#111827;">
                ${escapeHtml(formatMoney(order.currency, item.total))}
              </td>
            </tr>
          `
        )
        .join("")
    : `
        <tr>
          <td colspan="2" style="padding:12px 8px;color:#6b7280;">
            Order items are being prepared.
          </td>
        </tr>
      `;

  const shippingAddress = order.shippingAddress?.trim()
    ? escapeHtml(order.shippingAddress)
    : "Your shipping address is on file.";

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: order.customerEmail,
    subject: `Confirm your MEO Store order ${order.orderId}`,
    text: [
      `Hello ${customerName},`,
      "",
      `We received your order ${order.orderId}.`,
      "",
      "Your order is awaiting payment confirmation. No payment has been marked as received by this email.",
      "",
      "Order items:",
      ...textItems,
      "",
      `Order total: ${formatMoney(order.currency, order.total)}`,
      "",
      `Shipping address: ${order.shippingAddress || "On file"}`,
      "",
      "Please return to the order confirmation page and select “Confirm Payment & Finalize Order” when you are ready for your payment to be reviewed.",
      "",
      "This action submits your order for payment review. It does not itself verify or complete payment.",
      "",
      "MEO Store",
    ].join("\n"),
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Your MEO Store Order</title>
        </head>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
            We received your order ${safeOrderId}. Your payment is awaiting review.
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:28px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
                  <tr>
                    <td style="background:#111827;padding:28px 32px;">
                      <div style="font-size:12px;font-weight:700;letter-spacing:3px;color:#a7f3d0;">
                        MEO STORE
                      </div>
                      <h1 style="margin:12px 0 0;color:#ffffff;font-size:26px;line-height:1.3;">
                        We received your order
                      </h1>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:30px 32px;">
                      <p style="margin:0 0 14px;font-size:16px;line-height:1.7;">
                        Hello ${safeCustomerName},
                      </p>

                      <p style="margin:0 0 22px;font-size:14px;line-height:1.8;color:#4b5563;">
                        Thank you for shopping with MEO Store. Your order has been recorded and is awaiting payment review.
                      </p>

                      <div style="padding:18px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
                        <div style="font-size:12px;color:#6b7280;margin-bottom:7px;">
                          YOUR ORDER NUMBER
                        </div>
                        <div style="font-size:22px;font-weight:700;color:#111827;word-break:break-word;">
                          ${safeOrderId}
                        </div>
                        <div style="margin-top:12px;display:inline-block;background:#fef3c7;color:#92400e;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;">
                          Payment Review Pending
                        </div>
                      </div>

                      <h2 style="font-size:17px;margin:0 0 12px;color:#111827;">
                        Order summary
                      </h2>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:16px;">
                        ${htmlItems}
                        <tr>
                          <td style="padding:16px 8px;font-weight:700;color:#111827;">
                            Order total
                          </td>
                          <td style="padding:16px 8px;text-align:right;font-size:18px;font-weight:700;color:#111827;white-space:nowrap;">
                            ${safeCurrency} ${Number(order.total).toFixed(2)}
                          </td>
                        </tr>
                      </table>

                      <h2 style="font-size:17px;margin:24px 0 10px;color:#111827;">
                        Shipping address
                      </h2>
                      <p style="font-size:14px;line-height:1.7;color:#4b5563;margin:0 0 24px;">
                        ${shippingAddress}
                      </p>

                      <div style="border-top:1px solid #e5e7eb;padding-top:22px;">
                        <p style="font-size:14px;line-height:1.8;color:#4b5563;margin:0 0 12px;">
                          Your order is not marked as paid yet. Payment must be verified separately by the store.
                        </p>
                        <p style="font-size:14px;line-height:1.8;color:#4b5563;margin:0;">
                          Please return to your order confirmation page and select
                          <strong>Confirm Payment &amp; Finalize Order</strong>
                          when you are ready for your payment to be reviewed. This action submits your order for review; it does not itself verify or complete payment.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;">
                      <p style="margin:0;font-size:12px;line-height:1.7;color:#6b7280;">
                        Thank you for choosing MEO Store.
                        If you need assistance, please contact the store using its official contact details.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

export async function sendNewOrderNotificationEmail(
  order: OrderEmailDetails
): Promise<void> {
  const recipient = process.env.STORE_OWNER_EMAIL?.trim() || SMTP_USER;

  if (!recipient) {
    console.error(
      "New-order notification skipped: STORE_OWNER_EMAIL is not configured."
    );
    return;
  }

  await sendBestEffortEmail({
    to: recipient,
    subject: `New store order ${order.orderId}`,
    text: [
      `New order received: ${order.orderId}`,
      `Customer: ${order.customerName} (${order.customerEmail})`,
      `Total: ${formatMoney(order.currency, order.total)}`,
      `Shipping address: ${order.shippingAddress || "Not provided"}`,
      "Payment status: pending",
    ].join("\n"),
  });
}

export async function sendShippingUpdateEmail(
  order: OrderEmailDetails
): Promise<void> {
  await sendBestEffortEmail({
    to: order.customerEmail,
    subject: `Shipping update for order ${order.orderId}`,
    text: [
      `Hello ${order.customerName},`,
      "",
      `Your order ${order.orderId} has been marked as shipped.`,
      `Tracking number: ${order.trackingNumber || "Pending"}`,
      "Please use the tracking number with the carrier when tracking becomes available.",
    ].join("\n"),
  });
}

export async function sendNewLoginAlertEmail(options: {
  recipientEmail: string;
  recipientName?: string | null;
}): Promise<void> {
  const name = options.recipientName?.trim() || "Store Owner";

  await sendBestEffortEmail({
    to: options.recipientEmail,
    subject: "New login to your MEO Store admin account",
    text: [
      `Hello ${name},`,
      "",
      "A successful login to your MEO Store admin account was just recorded.",
      "If this was you, no action is needed.",
      "If you do not recognize this login, change your password and review your account security immediately.",
    ].join("\n"),
  });
}