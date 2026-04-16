import { apiGet, apiPost } from "./httpClient";
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

export function approveKyc(userId: number | string): Promise<KycRecord> {
  return apiPost<KycRecord>(`api/admin/kyc/${userId}/approve`, {});
}

export function rejectKyc(userId: number | string, reason: string): Promise<KycRecord> {
  return apiPost<KycRecord>(`api/admin/kyc/${userId}/reject`, { reason });
}
