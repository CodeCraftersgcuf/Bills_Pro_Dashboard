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
 * Join `API_BASE_URL` with a request path. When the base already ends with `/api`
 * (e.g. `https://host/api`) and the path starts with `api/...`, the extra `api/`
 * is dropped so we call `/api/admin/...` instead of `/api/api/admin/...` (404).
 */
function resolveApiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = API_BASE_URL.replace(/\/$/, "");
  let p = path.replace(/^\//, "");
  if (base.endsWith("/api") && p.startsWith("api/")) {
    p = p.slice(4);
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
