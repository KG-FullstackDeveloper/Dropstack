const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data
        ? String(
            (data as { message?: unknown }).message,
          )
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export const apiClient = {
  get: <T = unknown>(path: string) =>
    request<T>(path, { method: "GET" }),

  post: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  patch: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  put: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  delete: <T = unknown>(path: string) =>
    request<T>(path, { method: "DELETE" }),

  stores: () =>
    request<{ stores: unknown[] }>("/stores", { method: "GET" }),
};

export { API_URL };
