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
              <h1 style="margin:0 0 16px;font-size:24px;">
                Password recovery
              </h1>

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

              <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0 0 12px;">
                This code expires in ${expiresInMinutes} minutes.
              </p>

              <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0 0 12px;">
                If you did not request a password reset, you can safely ignore
                this email.
              </p>

              <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0;">
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
export interface OrderEmailDetails {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  currency: string;
  items?: Array<{ product_name: string; quantity: number; total: number }>;
  trackingNumber?: string | null;
  shippingAddress?: string;
}

async function sendBestEffortEmail(message: { to: string; subject: string; text: string; html?: string }): Promise<void> {
  try {
    if (!EMAIL_FROM) throw new Error("EMAIL_FROM is not configured.");
    const transporter = getTransporter();
    await transporter.sendMail({ from: EMAIL_FROM, ...message });
  } catch (error) {
    // Email is deliberately best-effort: mail failures must never roll back an order update.
    console.error("Email delivery failed.", error instanceof Error ? error.message : "Unknown email error");
  }
}

export async function sendOrderConfirmationEmail(order: OrderEmailDetails): Promise<void> {
  const lines = (order.items ?? []).map((item) => `• ${item.product_name} × ${item.quantity}: ${order.currency} ${item.total.toFixed(2)}`);
  await sendBestEffortEmail({
    to: order.customerEmail,
    subject: `We received your order ${order.orderId}`,
    text: [`Hello ${order.customerName},`, "", `We received order ${order.orderId}. Its current status is pending payment confirmation.`, ...lines, "", `Order total: ${order.currency} ${order.total.toFixed(2)}`, "We will send another email when shipping and tracking details are available."].join("\n"),
  });
}

export async function sendNewOrderNotificationEmail(order: OrderEmailDetails): Promise<void> {
  const recipient = process.env.STORE_OWNER_EMAIL?.trim() || SMTP_USER;
  if (!recipient) {
    console.error("New-order notification skipped: STORE_OWNER_EMAIL is not configured.");
    return;
  }
  await sendBestEffortEmail({
    to: recipient,
    subject: `New store order ${order.orderId}`,
    text: [`New order received: ${order.orderId}`, `Customer: ${order.customerName} (${order.customerEmail})`, `Total: ${order.currency} ${order.total.toFixed(2)}`, `Shipping address: ${order.shippingAddress || "Not provided"}`, "Payment status: pending"].join("\n"),
  });
}

export async function sendShippingUpdateEmail(order: OrderEmailDetails): Promise<void> {
  await sendBestEffortEmail({
    to: order.customerEmail,
    subject: `Shipping update for order ${order.orderId}`,
    text: [`Hello ${order.customerName},`, "", `Your order ${order.orderId} has been marked as shipped.`, `Tracking number: ${order.trackingNumber || "Pending"}`, "Please use the tracking number with the carrier when tracking becomes available."].join("\n"),
  });
}

export async function sendNewLoginAlertEmail(options: { recipientEmail: string; recipientName?: string | null }): Promise<void> {
  const name = options.recipientName?.trim() || "Store Owner";
  await sendBestEffortEmail({
    to: options.recipientEmail,
    subject: "New login to your MEO Store admin account",
    text: [`Hello ${name},`, "", "A successful login to your MEO Store admin account was just recorded.", "If this was you, no action is needed.", "If you do not recognize this login, change your password and review your account security immediately."].join("\n"),
  });
}
