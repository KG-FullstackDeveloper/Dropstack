export type ShippingMarket =
| "AFRICA"
| "UK"
| "EUROPE"
| "USA"
| "CANADA"
| "OTHER";

const AFRICA = [
"NG",
"GH",
"ZA",
"KE",
"UG",
"TZ",
"RW",
"ZM",
"ZW",
"SN",
"CI",
"CM",
];

const EUROPE = [
"DE",
"FR",
"ES",
"IT",
"NL",
"BE",
"AT",
"PT",
"IE",
"SE",
"NO",
"DK",
"FI",
"PL",
"CZ",
"CH",
"GR",
];

const USD_TO_CURRENCY: Record<string, number> = {
USD: 1,
NGN: 1600,
GHS: 15.5,
ZAR: 17.5,
KES: 129,
UGX: 3500,
TZS: 2650,
GBP: 0.75,
EUR: 0.86,
CAD: 1.38,
};

export function getShippingMarket(
country: string,
): ShippingMarket {
const code = country.trim().toUpperCase();

if (AFRICA.includes(code)) {
return "AFRICA";
}

if (code === "GB" || code === "UK") {
return "UK";
}

if (EUROPE.includes(code)) {
return "EUROPE";
}

if (code === "US" || code === "USA") {
return "USA";
}

if (code === "CA" || code === "CAN") {
return "CANADA";
}

return "OTHER";
}

export function getDeliveryTime(
country: string,
): string {
switch (getShippingMarket(country)) {
case "AFRICA":
return "Delivery within 10 days";

case "UK":
  return "Delivery within 10 days";

case "EUROPE":
  return "Delivery within 12 days";

case "USA":
case "CANADA":
  return "Delivery within 16 days";

default:
  return "Delivery time confirmed at checkout";

}
}

export function getShippingBaseAmount(
country: string,
): number {
switch (getShippingMarket(country)) {
case "AFRICA":
return 15;

case "UK":
  return 10;

case "EUROPE":
  return 15;

case "USA":
  return 20;

case "CANADA":
  return 20;

default:
  return 20;

}
}

export function getShippingFee(
country: string,
currency = getDefaultCurrency(country),
): number {
const baseAmount = getShippingBaseAmount(country);

const normalizedCurrency = currency.trim().toUpperCase();

const rate = USD_TO_CURRENCY[normalizedCurrency] ?? 1;

return Math.round(baseAmount * rate);
}

export function getDefaultCurrency(
country: string,
): string {
const code = country.trim().toUpperCase();

switch (code) {
case "NG":
return "NGN";

case "GH":
  return "GHS";

case "ZA":
  return "ZAR";

case "KE":
  return "KES";

case "UG":
  return "UGX";

case "TZ":
  return "TZS";

case "GB":
case "UK":
  return "GBP";

case "DE":
case "FR":
case "ES":
case "IT":
case "NL":
case "BE":
case "AT":
case "PT":
case "IE":
case "SE":
case "NO":
case "DK":
case "FI":
case "PL":
case "CZ":
case "CH":
case "GR":
  return "EUR";

case "US":
case "USA":
  return "USD";

case "CA":
case "CAN":
  return "CAD";

default:
  return "USD";

}
}

export function getRefundWindow(
country: string,
): {
startsAfterDays: number;
requestWindowDays: number;
} {
switch (getShippingMarket(country)) {
case "AFRICA":
case "UK":
return {
startsAfterDays: 13,
requestWindowDays: 5,
};

case "EUROPE":
  return {
    startsAfterDays: 15,
    requestWindowDays: 5,
  };

case "USA":
case "CANADA":
  return {
    startsAfterDays: 19,
    requestWindowDays: 5,
  };

default:
  return {
    startsAfterDays: 19,
    requestWindowDays: 5,
  };

}
}