/**
 * Tiny fetch wrapper around the Laravel API.
 *
 *   • Sends the Sanctum session cookie via `credentials: 'include'`.
 *   • Reads the `XSRF-TOKEN` cookie set by Sanctum and forwards it as the
 *     `X-XSRF-TOKEN` header on every mutating request — required by the
 *     ValidateCsrfToken middleware.
 *   • Surfaces server validation errors as a structured object.
 */

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    public errors?: Record<string, string[]>
  ) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : `Request failed with status ${status}`;
    super(message);
    this.name = "ApiError";
  }
}

let csrfBootstrapped = false;

/** Hit Sanctum's CSRF endpoint once per app boot to seed XSRF-TOKEN cookie. */
export async function ensureCsrf(): Promise<void> {
  if (csrfBootstrapped) return;
  await fetch(`${API_BASE}/sanctum/csrf-cookie`, { credentials: "include" });
  csrfBootstrapped = true;
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip auto CSRF bootstrap for the request (e.g. /me on boot). */
  skipCsrf?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const mutating = method !== "GET" && method !== "HEAD";

  if (mutating && !options.skipCsrf) {
    await ensureCsrf();
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  if (mutating) {
    const xsrf = readCookie("XSRF-TOKEN");
    if (xsrf) headers.set("X-XSRF-TOKEN", xsrf);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    method,
    headers,
    body,
    credentials: "include",
  });

  if (res.status === 204) return null as T;

  const ct = res.headers.get("content-type") ?? "";
  const payload = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const errors = (payload && typeof payload === "object" && "errors" in payload)
      ? (payload.errors as Record<string, string[]>)
      : undefined;
    throw new ApiError(res.status, payload, errors);
  }

  return payload as T;
}
