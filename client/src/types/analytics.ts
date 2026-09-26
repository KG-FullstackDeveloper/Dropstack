export type AnalyticsRange =
  | "24h"
  | "7d"
  | "30d"
  | "90d"
  | "1y";

export interface AnalyticsPoint {
  timestamp: string;
  revenue: number;
  cost: number;
  profit: number;
  loss: number;
  orders: number;
  units: number;
}

export interface VisitorLocation {
  id: string;
  country: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  visitors: number;
  lastSeenAt: string;
}

export interface AnalyticsSummary {
  revenue: number;
  cost: number;
  profit: number;
  loss: number;
  orders: number;
  units: number;
  visitors: number;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  series: AnalyticsPoint[];
  visitorLocations: VisitorLocation[];
}