import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import { createHash } from "node:crypto";
import { mkdir, rename, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

export interface AgreementOrder {
  orderId: string;
  orderReference: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  currency: string;
  total: number;
  acceptedAt: string;
  termsVersion: string;
}

export interface GeneratedAgreement {
  absolutePath: string;
  storedPath: string;
  sha256: string;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function safeText(value: unknown, fallback = "Not provided"): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function money(currency: string, total: number): string {
  return `${currency} ${total.toFixed(2)}`;
}

function createPdfBuffer(order: AgreementOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 52, info: {
      Title: "Product Procurement & Supply Chain Fulfillment Agreement",
      Author: process.env.BUSINESS_LEGAL_NAME || "Store Operator",
      Subject: `Order ${order.orderReference}`,
    }});
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const provider = process.env.BUSINESS_LEGAL_NAME?.trim() || "Store Operator";
    const providerEmail = process.env.BUSINESS_SUPPORT_EMAIL?.trim() || "Not provided";
    const fullAddress = [order.shippingAddress, order.city, order.state, order.postalCode, order.country]
      .filter(Boolean).join(", ");

    doc.font("Helvetica-Bold").fontSize(18).fillColor("#111827")
      .text("Product Procurement & Supply Chain Fulfillment Agreement", { align: "left" });
    doc.moveDown(0.5).font("Helvetica").fontSize(9).fillColor("#4B5563")
      .text(`Order reference: ${order.orderReference}`)
      .text(`Generated: ${new Date().toISOString()}`)
      .text(`Terms version: ${order.termsVersion}`);
    doc.moveDown(1).strokeColor("#D1D5DB").moveTo(52, doc.y).lineTo(543, doc.y).stroke();

    const section = (heading: string, body: string) => {
      doc.moveDown(0.8).font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(heading);
      doc.moveDown(0.25).font("Helvetica").fontSize(9.5).fillColor("#374151").text(body, { lineGap: 3 });
    };

    section("1. Parties", `Service Provider: ${provider}\nSupport contact: ${providerEmail}\nClient: ${safeText(order.customerName)}\nClient email: ${safeText(order.customerEmail)}\nDelivery address: ${safeText(fullAddress)}`);
    section("2. Order and amount", `Order ID: ${order.orderId}\nOrder reference: ${order.orderReference}\nOrder total: ${money(order.currency, order.total)}\nPayment status at document generation: Pending Verification. This document records the order total and terms acceptance; it is not proof that funds have been received.`);
    section("3. Scope of work", "Scope of work includes independent verification, inventory allocation reservation, and localized carrier dispatch coordination. The Service Provider may coordinate procurement from third-party suppliers and carriers. Product availability, processing times, carrier service, customs clearance, and delivery timing may vary.");
    section("4. Shipping and fulfillment", "Any delivery estimate shown at checkout is an estimate, not a guaranteed delivery date, unless expressly stated otherwise in the applicable published terms. Tracking information will be shared when it is available from the carrier or supplier. International shipments may be subject to customs duties, import taxes, and local delivery requirements.");
    section("5. Payment and order status", "Submitting checkout creates an order request. Payment is not considered verified merely because this agreement is generated or emailed. The Service Provider will confirm payment through its actual payment records before authorizing fulfillment. If payment is not verified, the order remains pending verification and may be cancelled under the published store terms.");
    section("6. Changes, cancellation, returns and support", "Cancellation, return, refund, and support rights are governed by the store's published Terms of Service, Returns and Refund Policy, and applicable consumer law. This generated record does not remove any non-waivable consumer rights.");
    section("7. Client acknowledgement", `The Client accepted the Terms of Service and Product Procurement & Logistics Fulfillment SLA during checkout at ${order.acceptedAt}. Recorded terms version: ${order.termsVersion}. This record reflects the acceptance event received by the server; retain the published terms version alongside this document.`);
    doc.moveDown(1).font("Helvetica").fontSize(8).fillColor("#6B7280")
      .text("This document is an order and terms-acceptance record. It is not a payment receipt unless payment has separately been verified. Have the final terms reviewed for the jurisdictions in which you operate.", { lineGap: 2 });
    doc.end();
  });
}

/** Writes the agreement outside public/static folders using an atomic rename. */
export async function generateComplianceAgreement(order: AgreementOrder): Promise<GeneratedAgreement> {
  if (!Number.isFinite(order.total) || order.total < 0) throw new Error("Invalid order total.");
  const receiptDir = path.resolve(process.env.COMPLIANCE_RECEIPTS_DIR || path.join(process.cwd(), "compliance_receipts"));
  await mkdir(receiptDir, { recursive: true, mode: 0o700 });
  const fileName = `${order.orderId.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  const absolutePath = path.join(receiptDir, fileName);
  const temporaryPath = `${absolutePath}.tmp`;
  const buffer = await createPdfBuffer(order);
  try {
    await writeFile(temporaryPath, buffer, { flag: "wx", mode: 0o600 });
    await rename(temporaryPath, absolutePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
  return {
    absolutePath,
    // Store a relative identifier, not an absolute host path, in the database.
    storedPath: `compliance_receipts/${fileName}`,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  };
}

export async function sendAgreementEmail(order: AgreementOrder, pdfPath: string): Promise<void> {
  const host = requiredEnv("SMTP_HOST");
  const user = requiredEnv("SMTP_USER");
  const pass = requiredEnv("SMTP_PASSWORD");
  const from = process.env.EMAIL_FROM?.trim() || user;
  const port = Number(process.env.SMTP_PORT || 465);
  const businessName = process.env.BUSINESS_LEGAL_NAME?.trim() || "Store Operator";
  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  const total = money(order.currency, order.total);
  await transporter.sendMail({
    from,
    to: order.customerEmail,
    subject: `Order received — ${order.orderReference}`,
    text: [
      `Hello ${order.customerName},`, "", `We received order ${order.orderReference}.`,
      `Order total: ${total}.`, "Payment status: Pending Verification.",
      "Your order will be prepared for dispatch after payment is verified and supplier availability is confirmed.",
      "Delivery estimates depend on destination, supplier processing, and carrier service; the applicable estimate is the one shown at checkout.",
      "Your Product Procurement & Supply Chain Fulfillment Agreement is attached.", "", businessName,
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;color:#111827;max-width:600px;margin:auto;line-height:1.6"><h1 style="font-size:22px">Order received</h1><p>Hello ${escapeHtml(order.customerName)},</p><p>We received order <strong>${escapeHtml(order.orderReference)}</strong>.</p><p><strong>Order total:</strong> ${escapeHtml(total)}<br><strong>Payment status:</strong> Pending Verification</p><p>Your order will be prepared for dispatch after payment is verified and supplier availability is confirmed. Delivery estimates depend on destination, supplier processing, and carrier service; the applicable estimate is the one shown at checkout.</p><p>Your Product Procurement &amp; Supply Chain Fulfillment Agreement is attached.</p><p>${escapeHtml(businessName)}</p></div>`,
    attachments: [{ filename: `agreement-${fileSafe(order.orderReference)}.pdf`, path: pdfPath, contentType: "application/pdf" }],
  });
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function fileSafe(value: string): string { return value.replace(/[^a-zA-Z0-9_-]/g, "_"); }
