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

const fromRate = USD_TO_CURRENCY[from] ?? 1;
const toRate = USD_TO_CURRENCY[to] ?? 1;

const amountInUsd = amount / fromRate;
return amountInUsd * toRate;
}

export function formatCurrency(
amount: number,
currency = "USD",
): string {
const normalizedCurrency = currency.trim().toUpperCase();

return new Intl.NumberFormat("en-US", {
style: "currency",
currency: normalizedCurrency,
maximumFractionDigits: 2,
}).format(amount);
}

export function getCurrencyRate(currency: string): number {
return USD_TO_CURRENCY[currency.trim().toUpperCase()] ?? 1;
}