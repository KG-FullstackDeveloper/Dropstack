export type MarketCode =
| "AFRICA"
| "UK"
| "EUROPE"
| "USA"
| "CANADA"
| "OTHER";

export interface MarketInfo {
countryCode: string;
countryName: string;
currency: string;
market: MarketCode;
}