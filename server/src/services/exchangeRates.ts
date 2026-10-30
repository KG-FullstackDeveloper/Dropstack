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

type ExchangeRate = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

let cachedRates: {
  expiresAt: number;
  rates: Record<string, number>;
} | null = null;

export async function getUsdRates(): Promise<Record<string, number>> {
  if (cachedRates && cachedRates.expiresAt > Date.now()) {
    return cachedRates.rates;
  }

  try {
    const response = await fetch(
      "https://api.frankfurter.dev/v2/rates?base=USD",
      { signal: AbortSignal.timeout(4000) },
    );

    if (!response.ok) throw new Error("Exchange-rate service unavailable.");

    const rows = (await response.json()) as ExchangeRate[];
    const rates: Record<string, number> = { USD: 1 };

    for (const row of rows) {
      if (
        typeof row.quote === "string" &&
        /^[A-Z]{3}$/.test(row.quote) &&
        Number.isFinite(row.rate) &&
        row.rate > 0
      ) {
        rates[row.quote] = row.rate;
      }
    }

    if (Object.keys(rates).length < 2) {
      throw new Error("Exchange-rate response contained no rates.");
    }

    cachedRates = {
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      rates,
    };
    return rates;
  } catch {
    return cachedRates?.rates ?? FALLBACK_USD_RATES;
  }
}

export function convertWithUsdRates(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
): number {
  const amountValue = Number(amount);
  const from = fromCurrency.trim().toUpperCase();
  const to = toCurrency.trim().toUpperCase();
  const fromRate = rates[from];
  const toRate = rates[to];

  if (!Number.isFinite(amountValue) || amountValue < 0) {
    throw new Error("Cannot convert an invalid amount.");
  }

  if (!fromRate || !toRate || fromRate <= 0 || toRate <= 0) {
    throw new Error(`Exchange rate is unavailable for ${from} or ${to}.`);
  }

  return (
    Math.round(((amountValue / fromRate) * toRate + Number.EPSILON) * 100) / 100
  );
}

export async function convertCurrencyAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<number> {
  if (fromCurrency.trim().toUpperCase() === toCurrency.trim().toUpperCase()) {
    return amount;
  }

  return convertWithUsdRates(
    amount,
    fromCurrency,
    toCurrency,
    await getUsdRates(),
  );
}
