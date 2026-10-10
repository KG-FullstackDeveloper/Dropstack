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