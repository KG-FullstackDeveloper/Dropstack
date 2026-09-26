import type { BusinessHealth } from "../types/businessHealth";

const API_URL =
import.meta.env.VITE_API_URL ||
"http://localhost:4000";

export async function getBusinessHealth(): Promise<BusinessHealth> {
const response = await fetch(
`${API_URL}/api/business-health`
);

let result: {
success?: boolean;
data?: BusinessHealth;
error?: string;
message?: string;
};

try {
result = await response.json();
} catch {
throw new Error(
"Server returned an invalid business health response."
);
}

if (
!response.ok ||
!result.success ||
!result.data
) {
throw new Error(
result.error ||
result.message ||
"Failed to load business health."
);
}

return result.data;
}
