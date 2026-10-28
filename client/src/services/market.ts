import type { MarketInfo, MarketCode } from "../types/market";
import { hasFreshCurrencyRates, updateCurrencyRates } from "../utils/currency";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const STORAGE_KEY = "custom_ecommerce_market";

const EUROPE = new Set([
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
]);

const COUNTRY_CURRENCIES: Record<string, string> = {
  AE: "AED",
  AR: "ARS",
  AU: "AUD",
  BR: "BRL",
  CA: "CAD",
  CH: "CHF",
  CN: "CNY",
  CZ: "CZK",
  DE: "EUR",
  DK: "DKK",
  EG: "EGP",
  ES: "EUR",
  FR: "EUR",
  GH: "GHS",
  HK: "HKD",
  ID: "IDR",
  IE: "EUR",
  IL: "ILS",
  IN: "INR",
  IT: "EUR",
  JP: "JPY",
  KE: "KES",
  KR: "KRW",
  MX: "MXN",
  NG: "NGN",
  NL: "EUR",
  NO: "NOK",
  NZ: "NZD",
  PH: "PHP",
  PL: "PLN",
  PT: "EUR",
  SA: "SAR",
  SE: "SEK",
  SG: "SGD",
  TH: "THB",
  TR: "TRY",
  TW: "TWD",
  TZ: "TZS",
  UG: "UGX",
  US: "USD",
  ZA: "ZAR",
  GB: "GBP",
};

export function buildMarket(
  countryCode: string,
  countryName: string,
  currencyOverride?: string,
): MarketInfo {
  const code = countryCode.toUpperCase();
  const currency =
    currencyOverride?.trim().toUpperCase() || COUNTRY_CURRENCIES[code] || "USD";

  const geographicMarket: MarketCode =
    code === "NG" ||
    code === "GH" ||
    code === "ZA" ||
    code === "KE" ||
    code === "UG" ||
    code === "TZ"
      ? "AFRICA"
      : code === "GB"
        ? "UK"
        : EUROPE.has(code)
          ? "EUROPE"
          : code === "US"
            ? "USA"
            : code === "CA"
              ? "CANADA"
              : "OTHER";

  return {
    countryCode: code,
    countryName,
    currency,
    market: geographicMarket,
  };
}

export function getStoredMarket(): MarketInfo | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    const market = JSON.parse(stored) as MarketInfo;
    if (
      typeof market.detectedAt !== "number" ||
      Date.now() - market.detectedAt > 24 * 60 * 60 * 1000
    ) {
      return null;
    }

    return market;
  } catch {
    return null;
  }
}

export function saveMarket(market: MarketInfo) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...market, detectedAt: Date.now() }),
    );
  } catch {
    // Ignore storage failures.
  }
}

export async function detectMarket(): Promise<MarketInfo> {
  const stored = getStoredMarket();

  if (stored && hasFreshCurrencyRates()) {
    return stored;
  }

  try {
    const response = await fetch(`${API_URL}/api/market`);

    if (!response.ok) {
      throw new Error(`Market request failed with status ${response.status}`);
    }

    const result = (await response.json()) as {
      data?: {
        countryCode?: string;
        countryName?: string;
        currency?: string;
        rates?: Record<string, number> | null;
      };
      countryCode?: string;
      countryName?: string;
      currency?: string;
      rates?: Record<string, number> | null;
    };
    const data = result.data ?? result;

    if (data.rates) updateCurrencyRates(data.rates);

    const market = buildMarket(
      data.countryCode || stored?.countryCode || "US",
      data.countryName || stored?.countryName || "United States",
      data.currency || stored?.currency,
    );

    saveMarket(market);

    return market;
  } catch {
    const fallback = stored || buildMarket("US", "United States", "USD");

    saveMarket(fallback);

    return fallback;
  }
}

export function clearStoredMarket() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function getMarketCode(countryCode: string): MarketCode {
  return buildMarket(countryCode, countryCode).market;
}
