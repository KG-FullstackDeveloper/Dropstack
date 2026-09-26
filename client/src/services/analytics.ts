import type {
  AnalyticsResponse,
} from "../types/analytics";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

export async function getAnalytics(): Promise<AnalyticsResponse> {
  const response = await fetch(
    `${API_URL}/api/analytics`
  );

  let result: {
    success?: boolean;
    data?: AnalyticsResponse;
    error?: string;
  };

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Server returned an invalid analytics response."
    );
  }

  if (
    !response.ok ||
    !result.success ||
    !result.data
  ) {
    throw new Error(
      result.error ||
        "Failed to load analytics."
    );
  }

  return result.data;
}