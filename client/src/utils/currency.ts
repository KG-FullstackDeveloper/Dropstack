const RATE_STORAGE_KEY = "custom_ecommerce_usd_rates";
const RATE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

const FALLBACK_USD_RATES: Record<string, number> = {
  USD: 1,
  GBP: 0.75,
  EUR: 0.86,
  CAD: 1.41,
  AUD: 1.43,
  NZD: 1.65,
  NGN: 1330.65,
  GHS: 11.6552,
  ZAR: 16.43,
  KES: 129.77,
  UGX: 4029.72,
  TZS: 2640.08,
};

type StoredRates = {
  updatedAt: number;
  rates: Record<string, number>;
};

function readStoredRates(): StoredRates | null {
  if (typeof localStorage === "undefined") return null;

  try {
    const value = localStorage.getItem(RATE_STORAGE_KEY);
    if (!value) return null;

    const parsed = JSON.parse(value) as StoredRates;
    if (
      !parsed ||
      typeof parsed.updatedAt !== "number" ||
      !parsed.rates ||
      typeof parsed.rates !== "object"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

let storedRates = readStoredRates();

export function updateCurrencyRates(
  rates: Record<string, number> | null | undefined,
): void {
  if (!rates || typeof rates !== "object") return;

  const normalized: Record<string, number> = { USD: 1 };
  for (const [currency, rate] of Object.entries(rates)) {
    const code = currency.trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(code) && Number.isFinite(rate) && rate > 0) {
      normalized[code] = rate;
    }
  }

  if (Object.keys(normalized).length < 2) return;

  storedRates = { updatedAt: Date.now(), rates: normalized };
  try {
    localStorage.setItem(RATE_STORAGE_KEY, JSON.stringify(storedRates));
  } catch {
    // Keep the validated rates in memory when storage is unavailable.
  }
}

export function hasFreshCurrencyRates(): boolean {
  return Boolean(
    storedRates && Date.now() - storedRates.updatedAt < 24 * 60 * 60 * 1000,
  );
}

function getUsdRates(): Record<string, number> {
  if (storedRates && Date.now() - storedRates.updatedAt <= RATE_MAX_AGE_MS) {
    return { ...FALLBACK_USD_RATES, ...storedRates.rates };
  }

  return FALLBACK_USD_RATES;
}

export function convertCurrency(
  amount: number,
  fromCurrency = "USD",
  toCurrency = "USD",
): number {
  const from = fromCurrency.trim().toUpperCase();
  const to = toCurrency.trim().toUpperCase();

  if (from === to) {
    return amount;
  }

  const rates = getUsdRates();
  const fromRate = rates[from] ?? 1;
  const toRate = rates[to] ?? 1;

  const amountInUsd = amount / fromRate;
  return amountInUsd * toRate;
}

export function formatCurrency(amount: number, currency = "USD"): string {
  const normalizedCurrency = currency.trim().toUpperCase();

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCurrencyRate(currency: string): number {
  return getUsdRates()[currency.trim().toUpperCase()] ?? 1;
}
