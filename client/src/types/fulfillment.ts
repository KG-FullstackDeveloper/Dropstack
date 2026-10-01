export type FulfillmentMode =
  | "local_stock"
  | "local_supplier"
  | "international_dropship"
  | "mixed"
  | "unset";

export type PaymentMethod =
  | "online"
  | "cod"
  | "manual";

export type FulfillmentLane = "local" | "international" | "mixed" | "unset";

export interface FulfillmentModeOption {
  id: Exclude<FulfillmentMode, "mixed" | "unset">;
  label: string;
  shortLabel: string;
  description: string;
  lane: Exclude<FulfillmentLane, "mixed" | "unset">;
}

export const FULFILLMENT_MODE_OPTIONS: FulfillmentModeOption[] = [
  {
    id: "local_stock",
    label: "Local stock",
    shortLabel: "Local stock",
    description: "You already have the product and dispatch it locally.",
    lane: "local",
  },
  {
    id: "local_supplier",
    label: "Local supplier",
    shortLabel: "Local supplier",
    description: "A Nigerian supplier provides the product after the order is received.",
    lane: "local",
  },
  {
    id: "international_dropship",
    label: "International dropshipping",
    shortLabel: "International",
    description: "Customer pays online first, then you order from the international supplier.",
    lane: "international",
  },
];

export function getFulfillmentLane(
  mode: FulfillmentMode | null | undefined,
): FulfillmentLane {
  if (mode === "local_stock" || mode === "local_supplier") {
    return "local";
  }

  if (mode === "international_dropship") {
    return "international";
  }

  if (mode === "mixed") {
    return "mixed";
  }

  return "unset";
}

export function getFulfillmentLabel(
  mode: FulfillmentMode | null | undefined,
): string {
  switch (mode) {
    case "local_stock":
      return "Local stock";
    case "local_supplier":
      return "Local supplier";
    case "international_dropship":
      return "International dropshipping";
    case "mixed":
      return "Mixed fulfillment";
    default:
      return "Not configured";
  }
}

export function getPaymentMethodLabel(
  method: PaymentMethod | null | undefined,
): string {
  switch (method) {
    case "online":
      return "Online payment";
    case "cod":
      return "Cash on delivery";
    case "manual":
      return "Manual payment";
    default:
      return "Payment not selected";
  }
}
