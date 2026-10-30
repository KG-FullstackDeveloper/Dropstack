/**
 * Optional WhatsApp Cloud API notifications for the Global store.
 *
 * WhatsApp business-initiated messages must use approved message templates.
 * Configure template names and matching body placeholders in the Meta dashboard.
 */

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
const API_VERSION = process.env.WHATSAPP_API_VERSION?.trim() || "v23.0";
const LANGUAGE_CODE = process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "en_US";

function normalizePhoneNumber(value: string): string {
  // Meta expects an international number with digits only (no +, spaces or dashes).
  return value.replace(/\D/g, "");
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(ACCESS_TOKEN && PHONE_NUMBER_ID);
}

/** Send an approved WhatsApp template without interrupting checkout if delivery fails. */
export async function sendWhatsAppTemplate(options: {
  to: string;
  templateName: string;
  parameters: string[];
  context: string;
}): Promise<boolean> {
  const recipient = normalizePhoneNumber(options.to);

  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    return false;
  }

  if (!recipient || recipient.length < 8 || !options.templateName.trim()) {
    console.warn(`WhatsApp ${options.context} skipped: recipient or template is missing/invalid.`);
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "template",
          template: {
            name: options.templateName.trim(),
            language: { code: LANGUAGE_CODE },
            components: options.parameters.length
              ? [
                  {
                    type: "body",
                    parameters: options.parameters.map((value) => ({
                      type: "text",
                      text: String(value).slice(0, 1000),
                    })),
                  },
                ]
              : [],
          },
        }),
      },
    );

    if (!response.ok) {
      const responseText = await response.text();
      console.error(
        `WhatsApp ${options.context} failed (${response.status}):`,
        responseText.slice(0, 1200),
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      `WhatsApp ${options.context} failed:`,
      error instanceof Error ? error.message : "Unknown WhatsApp error",
    );
    return false;
  }
}

/** Notify the store owner when a Global order is created. */
export async function sendNewOrderWhatsAppNotification(order: {
  orderId: string;
  customerName: string;
  total: number;
  currency: string;
}): Promise<boolean> {
  const recipient = process.env.STORE_OWNER_WHATSAPP?.trim();
  const templateName = process.env.WHATSAPP_NEW_ORDER_TEMPLATE?.trim();

  if (!recipient || !templateName) return false;

  return sendWhatsAppTemplate({
    to: recipient,
    templateName,
    parameters: [
      order.orderId,
      order.customerName || "Customer",
      `${order.currency} ${Number(order.total).toFixed(2)}`,
    ],
    context: `new-order alert for ${order.orderId}`,
  });
}

/**
 * Customer shipping alerts are disabled unless explicitly enabled. Enable only
 * after customers have opted in and the approved template matches these two
 * body placeholders: order ID, then tracking number.
 */
export async function sendCustomerShippingWhatsAppNotification(order: {
  orderId: string;
  customerPhone: string;
  trackingNumber: string;
}): Promise<boolean> {
  if (process.env.WHATSAPP_CUSTOMER_SHIPPING_UPDATES_ENABLED !== "true") {
    return false;
  }

  const templateName = process.env.WHATSAPP_SHIPPING_TEMPLATE?.trim();
  if (!templateName) return false;

  return sendWhatsAppTemplate({
    to: order.customerPhone,
    templateName,
    parameters: [order.orderId, order.trackingNumber || "Not available"],
    context: `shipping update for ${order.orderId}`,
  });
}
