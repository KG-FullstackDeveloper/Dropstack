// All Selar links live in one place.
// Add new products and variants here as your store grows.

export type ProductPaymentConfig = {
  variants: Record<
    string,
    {
      label: string;
      price: number;
      currency: string;
      selarUrl: string;
    }
  >;
};

export const selarProducts: Record<string, ProductPaymentConfig> = {
  // Example product 1: two variants sharing the same Selar link.
  "product-001": {
    variants: {
      small: {
        label: "Small",
        price: 25,
        currency: "USD",
        selarUrl: "https://selar.co/YOUR_SHARED_LINK",
      },
      medium: {
        label: "Medium",
        price: 25,
        currency: "USD",
        selarUrl: "https://selar.co/YOUR_SHARED_LINK",
      },
    },
  },

  // Example product 2: each variant has a different price and link.
  "product-002": {
    variants: {
      single: {
        label: "Single Pack",
        price: 20,
        currency: "USD",
        selarUrl: "https://selar.co/YOUR_SINGLE_LINK",
      },
      double: {
        label: "Double Pack",
        price: 35,
        currency: "USD",
        selarUrl: "https://selar.co/YOUR_DOUBLE_LINK",
      },
    },
  },
};

// Replace this with your actual WhatsApp business number.
// Use international format without +, spaces, or dashes.
const WHATSAPP_NUMBER = "234XXXXXXXXXX";

export function getWhatsAppBulkOrderUrl(
  productName?: string,
): string {
  const message = productName
    ? `Hello! I would like to discuss a custom mixed bundle or bulk order for ${productName}.`
    : "Hello! I would like to discuss a custom mixed bundle or bulk order.";

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}