import type { AnalyticsResponse } from "../types/analytics";
import { apiGet } from "./adminApi";

export async function getAnalytics(): Promise<AnalyticsResponse> {
  return apiGet<AnalyticsResponse>("/analytics");
}
