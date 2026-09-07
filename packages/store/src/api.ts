// Shared API client for all stores. Points at the Express backend.
// Vite exposes env vars prefixed VITE_; Expo exposes EXPO_PUBLIC_ prefixed ones.
// Fall back to localhost for local dev when neither is set.

function resolveApiBaseUrl(): string {
  try {
    // @ts-ignore - import.meta is only valid in ESM bundlers (Vite); guarded by try/catch for other runtimes.
    const viteEnv = import.meta.env.VITE_API_URL;
    if (viteEnv) return viteEnv;
  } catch {
    // import.meta not available in this runtime (e.g. some RN environments)
  }

  // Only check process.env when process is defined (Node/Expo environments)
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  return "http://localhost:3001";
}

export const API_BASE_URL = resolveApiBaseUrl();

export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.error || message;
    } catch {
      // response had no JSON body
    }
    throw new ApiRequestError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
