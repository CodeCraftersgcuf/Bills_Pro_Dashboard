import { API_BASE_URL } from "./apiConfig";
import { clearAdminToken, getAdminToken } from "./authToken";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type JsonSuccess<T> = { success: boolean; message?: string; data: T };

/**
 * Join `API_BASE_URL` (e.g. `https://billspro.hmstech.org/api`) with a request path.
 * When the path starts with `api/...`, the duplicate segment is dropped so the final URL
 * is `…/api/admin/...` not `…/api/api/admin/...`.
 */
function resolveApiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = API_BASE_URL.replace(/\/$/, "");
  let p = path.replace(/^\//, "");
  if (base.endsWith("/api") && p.startsWith("api/")) {
    p = p.slice(4);
  }
  // Laravel routes live under /api. When VITE_API_BASE_URL is origin-only (no /api),
  // paths like `/admin/profit/catalog` must become `/api/admin/...` (same as `api/admin/stats`).
  if (!base.endsWith("/api") && !p.startsWith("api/")) {
    p = `api/${p}`;
  }
  return `${base}/${p}`;
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("Invalid JSON response", res.status);
  }
}

export async function apiGet<T>(path: string, params?: Record<string, string | number | undefined | null>): Promise<T> {
  const full = resolveApiUrl(path);
  const url = new URL(full);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  const token = getAdminToken();
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const json = await parseJson<JsonSuccess<T> | { success: false; message?: string }>(res);
  if (!res.ok) {
    if (res.status === 401) {
      clearAdminToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    throw new ApiError(
      (json as { message?: string }).message || res.statusText || "Request failed",
      res.status,
      json
    );
  }
  if (!(json as JsonSuccess<T>).success) {
    throw new ApiError((json as { message?: string }).message || "Request failed", res.status, json);
  }
  return (json as JsonSuccess<T>).data;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const url = resolveApiUrl(path);
  const token = getAdminToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await parseJson<JsonSuccess<T> | { success: false; message?: string }>(res);
  if (!res.ok) {
    if (res.status === 401) {
      clearAdminToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    throw new ApiError(
      (json as { message?: string }).message || res.statusText || "Request failed",
      res.status,
      json
    );
  }
  if (!(json as JsonSuccess<T>).success) {
    throw new ApiError((json as { message?: string }).message || "Request failed", res.status, json);
  }
  return (json as JsonSuccess<T>).data;
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const url = resolveApiUrl(path);
  const token = getAdminToken();
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await parseJson<JsonSuccess<T> | { success: false; message?: string }>(res);
  if (!res.ok) {
    if (res.status === 401) {
      clearAdminToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    throw new ApiError(
      (json as { message?: string }).message || res.statusText || "Request failed",
      res.status,
      json
    );
  }
  if (!(json as JsonSuccess<T>).success) {
    throw new ApiError((json as { message?: string }).message || "Request failed", res.status, json);
  }
  return (json as JsonSuccess<T>).data;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const url = resolveApiUrl(path);
  const token = getAdminToken();
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await parseJson<JsonSuccess<T> | { success: false; message?: string }>(res);
  if (!res.ok) {
    if (res.status === 401) {
      clearAdminToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    throw new ApiError(
      (json as { message?: string }).message || res.statusText || "Request failed",
      res.status,
      json
    );
  }
  if (!(json as JsonSuccess<T>).success) {
    throw new ApiError((json as { message?: string }).message || "Request failed", res.status, json);
  }
  return (json as JsonSuccess<T>).data;
}

export async function apiDelete(path: string): Promise<void> {
  const url = resolveApiUrl(path);
  const token = getAdminToken();
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const json = await parseJson<JsonSuccess<unknown> | { success: false; message?: string }>(res);
  if (!res.ok) {
    if (res.status === 401) {
      clearAdminToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    throw new ApiError(
      (json as { message?: string }).message || res.statusText || "Request failed",
      res.status,
      json
    );
  }
  if (!(json as { success?: boolean }).success) {
    throw new ApiError((json as { message?: string }).message || "Request failed", res.status, json);
  }
}
