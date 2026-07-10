import { API_BASE_URL } from "./apiConfig";
import { apiGet, apiPost, ApiError } from "./httpClient";
import { clearAdminToken, getAdminToken } from "./authToken";
import type { LaravelPaginator } from "./adminUsers";

export type KycRecord = {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: string | null;
  date_of_birth?: string | null;
  nin_number?: string | null;
  bvn_number?: string | null;
  location?: string | null;
  nin_verification_report_id?: string | null;
  bvn_verification_report_id?: string | null;
  nin_verification_status?: string | null;
  bvn_verification_status?: string | null;
  nin_verification_data?: Record<string, unknown> | null;
  bvn_verification_data?: Record<string, unknown> | null;
  identity_verified_at?: string | null;
  has_identity_verification?: boolean;
  has_face_verification_video?: boolean;
  face_verification_submitted_at?: string | null;
  rejection_reason?: string | null;
  created_at: string | null;
  user?: {
    id: number;
    name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_number: string | null;
  };
};

function resolveAdminKycFaceVideoUrl(userId: number | string): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const path = `admin/kyc/${userId}/face-video`;
  if (base.endsWith("/api")) {
    return `${base}/${path}`;
  }
  return `${base}/api/${path}`;
}

export function fetchAdminKycList(params: {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
  scope?: "unverified";
  from?: string;
  to?: string;
}): Promise<LaravelPaginator<KycRecord | Record<string, unknown>>> {
  return apiGet<LaravelPaginator<KycRecord | Record<string, unknown>>>("api/admin/kyc", {
    page: params.page,
    per_page: params.per_page ?? 25,
    status: params.status,
    search: params.search,
    scope: params.scope,
    from: params.from,
    to: params.to,
  });
}

export function fetchAdminKycDetail(userId: number | string): Promise<{
  user: Record<string, unknown>;
  kyc: KycRecord | null;
}> {
  return apiGet<{ user: Record<string, unknown>; kyc: KycRecord | null }>(`api/admin/kyc/${userId}`);
}

/** Fetch face verification video as a blob URL (caller must revokeObjectURL). */
export async function fetchAdminKycFaceVideoBlobUrl(userId: number | string): Promise<string> {
  const token = getAdminToken();
  const res = await fetch(resolveAdminKycFaceVideoUrl(userId), {
    method: "GET",
    headers: {
      Accept: "video/*,application/octet-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearAdminToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    let message = "Failed to load face verification video.";
    try {
      const json = (await res.json()) as { message?: string };
      if (json?.message) message = json.message;
    } catch {
      // ignore
    }
    throw new ApiError(message, res.status);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function approveKyc(userId: number | string): Promise<KycRecord> {
  return apiPost<KycRecord>(`api/admin/kyc/${userId}/approve`, {});
}

export function rejectKyc(userId: number | string, reason: string): Promise<KycRecord> {
  return apiPost<KycRecord>(`api/admin/kyc/${userId}/reject`, { reason });
}
