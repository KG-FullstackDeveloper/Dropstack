import type {
MarketInfo,
MarketCode,
} from "../types/market";

const API_URL =
import.meta.env.VITE_API_URL ||
"http://localhost:4000";

const STORAGE_KEY =
"custom_ecommerce_market";

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

function buildMarket(
countryCode: string,
countryName: string,
): MarketInfo {
const code =
countryCode.toUpperCase();

if (code === "NG") {
return {
countryCode: code,
countryName,
currency: "NGN",
market: "AFRICA",
};
}

if (code === "GH") {
return {
countryCode: code,
countryName,
currency: "GHS",
market: "AFRICA",
};
}

if (code === "ZA") {
return {
countryCode: code,
countryName,
currency: "ZAR",
market: "AFRICA",
};
}

if (code === "KE") {
return {
countryCode: code,
countryName,
currency: "KES",
market: "AFRICA",
};
}

if (code === "UG") {
return {
countryCode: code,
countryName,
currency: "UGX",
market: "AFRICA",
};
}

if (code === "TZ") {
return {
countryCode: code,
countryName,
currency: "TZS",
market: "AFRICA",
};
}

if (code === "GB") {
return {
countryCode: code,
countryName,
currency: "GBP",
market: "UK",
};
}

if (EUROPE.has(code)) {
return {
countryCode: code,
countryName,
currency: "EUR",
market: "EUROPE",
};
}

if (code === "US") {
return {
countryCode: code,
countryName,
currency: "USD",
market: "USA",
};
}

if (code === "CA") {
return {
countryCode: code,
countryName,
currency: "CAD",
market: "CANADA",
};
}

return {
countryCode: code,
countryName,
currency: "USD",
market: "OTHER",
};
}

export function getStoredMarket(): MarketInfo | null {
try {
const stored =
localStorage.getItem(
STORAGE_KEY,
);

if (!stored) {
  return null;
}

return JSON.parse(
  stored,
) as MarketInfo;

} catch {
return null;
}
}

export function saveMarket(
market: MarketInfo,
) {
try {
localStorage.setItem(
STORAGE_KEY,
JSON.stringify(market),
);
} catch {
// Ignore storage failures.
}
}

export async function detectMarket(): Promise<MarketInfo> {
const stored =
getStoredMarket();

if (stored) {
return stored;
}

try {
const response = await fetch(
`${API_URL}/api/market`,
);

if (!response.ok) {
  throw new Error(
    `Market request failed with status ${response.status}`,
  );
}

const data = (await response.json()) as {
  countryCode?: string;
  countryName?: string;
};

const market = buildMarket(
  data.countryCode || "NG",
  data.countryName || "Nigeria",
);

saveMarket(market);

return market;

} catch {
const fallback = buildMarket(
"NG",
"Nigeria",
);

saveMarket(fallback);

return fallback;

}
}

export function clearStoredMarket() {
try {
localStorage.removeItem(
STORAGE_KEY,
);
} catch {
// Ignore storage failures.
}
}

export function getMarketCode(
countryCode: string,
): MarketCode {
return buildMarket(
countryCode,
countryCode,
).market;
}