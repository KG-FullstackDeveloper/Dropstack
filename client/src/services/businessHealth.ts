import type { BusinessHealth } from "../types/businessHealth";
import { apiGet } from "./adminApi";

export async function getBusinessHealth(): Promise<BusinessHealth> {
  return apiGet<BusinessHealth>("/business-health");
}
