export interface ShippingInfo {
  country: string;
  deliveryTime: string;
  fee: number;
}

const AFRICA = ["NG", "GH", "ZA"];

const DOMESTIC = ["US", "GB", "AU"];

export function getShippingInfo(
  country: string
): ShippingInfo {
  const code = country.toUpperCase();

  if (AFRICA.includes(code)) {
    return {
      country: code,
      deliveryTime: "6–10 days",
      fee: 15,
    };
  }

  if (DOMESTIC.includes(code)) {
    return {
      country: code,
      deliveryTime: "10–14 days",
      fee: 10,
    };
  }

  return {
    country: code,
    deliveryTime: "Shipping time confirmed at checkout",
    fee: 20,
  };
}