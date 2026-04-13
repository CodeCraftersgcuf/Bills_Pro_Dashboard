import { apiDelete, apiGet, apiPatch, apiPost } from "./httpClient";

export type LaravelPaginator<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type AdminUserRow = {
  id: number;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  account_status: string | null;
  kyc_completed: boolean;
  email_verified: boolean;
  is_admin: boolean;
  created_at: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
};

export function fetchAdminUsers(params: {
  page?: number;
  per_page?: number;
  search?: string;
  account_status?: string;
  is_admin?: boolean | string;
  /** Backend: verified = kyc_completed; pending = KYC row status pending */
  kyc_filter?: "verified" | "pending";
  from?: string;
  to?: string;
}): Promise<LaravelPaginator<AdminUserRow>> {
  return apiGet<LaravelPaginator<AdminUserRow>>("api/admin/users", {
    page: params.page,
    per_page: params.per_page ?? 25,
    search: params.search,
    account_status: params.account_status,
    is_admin: params.is_admin === undefined ? undefined : params.is_admin ? "1" : "0",
    kyc_filter: params.kyc_filter,
    from: params.from,
    to: params.to,
  });
}

export function fetchAdminUser(userId: number | string): Promise<AdminUserRow> {
  return apiGet<AdminUserRow>(`api/admin/users/${userId}`);
}

export function patchAdminUser(
  userId: number | string,
  body: { internal_notes?: string | null; suspension_reason?: string | null }
): Promise<AdminUserRow> {
  return apiPatch<AdminUserRow>(`api/admin/users/${userId}`, body);
}

export function suspendAdminUser(userId: number | string, reason?: string): Promise<AdminUserRow> {
  return apiPost<AdminUserRow>(`api/admin/users/${userId}/suspend`, reason ? { reason } : {});
}

export function unsuspendAdminUser(userId: number | string): Promise<AdminUserRow> {
  return apiPost<AdminUserRow>(`api/admin/users/${userId}/unsuspend`, {});
}

export function banAdminUser(userId: number | string, reason?: string): Promise<AdminUserRow> {
  return apiPost<AdminUserRow>(`api/admin/users/${userId}/ban`, reason ? { reason } : {});
}

export function revokeUserTokens(userId: number | string): Promise<void> {
  return apiPost<void>(`api/admin/users/${userId}/tokens/revoke`, {});
}

export function resetAdminUserPassword(
  userId: number | string
): Promise<{ temporary_password: string }> {
  return apiPost<{ temporary_password: string }>(`api/admin/users/${userId}/password/reset`, {});
}

export function createAdminUser(body: {
  first_name?: string;
  last_name?: string;
  email: string;
  password: string;
}): Promise<AdminUserRow> {
  return apiPost<AdminUserRow>("api/admin/users/admin-create", body);
}

export function deleteAdminUser(userId: number | string): Promise<void> {
  return apiDelete(`api/admin/users/${userId}`);
}

export type FiatWalletDto = {
  id: number;
  currency: string;
  balance: string | number;
};

export function fetchAdminUserFiatWallets(userId: number | string): Promise<FiatWalletDto[]> {
  return apiGet<FiatWalletDto[]>(`api/admin/users/${userId}/fiat-wallets`);
}

export type VirtualAccountDto = {
  id: number;
  currency: string | null;
  blockchain?: string | null;
  account_id?: string | null;
  account_code?: string | null;
  account_balance?: string | null;
  available_balance?: string | null;
  accounting_currency?: string | null;
  /** Present when API loads `walletCurrency` — used to convert token balance → USD */
  wallet_currency?: {
    rate?: string | number | null;
    price?: string | number | null;
    exchange_rate?: {
      rate_buy?: string | number | null;
      rate_sell?: string | number | null;
    } | null;
  } | null;
};

export function fetchAdminUserVirtualAccounts(userId: number | string): Promise<VirtualAccountDto[]> {
  return apiGet<VirtualAccountDto[]>(`api/admin/users/${userId}/virtual-accounts`);
}

export function fetchAdminUserTimeline(
  userId: number | string,
  limit = 50
): Promise<{
  transactions: Record<string, unknown>[];
  deposits: Record<string, unknown>[];
}> {
  return apiGet(`api/admin/users/${userId}/timeline`, { limit });
}

export type AdminAuditLogRow = {
  id: number;
  action: string;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
};

export function fetchAdminUserAuditLogs(
  userId: number | string,
  params?: { page?: number; per_page?: number }
): Promise<LaravelPaginator<AdminAuditLogRow>> {
  return apiGet<LaravelPaginator<AdminAuditLogRow>>(`api/admin/users/${userId}/audit-logs`, params);
}

export type AdminUserDepositAddress = {
  id: number;
  blockchain: string;
  currency: string;
  address: string;
  virtual_account?: {
    id: number;
    currency?: string | null;
    blockchain?: string | null;
    available_balance?: string | null;
    account_balance?: string | null;
    accounting_currency?: string | null;
  } | null;
};

export function fetchAdminUserDepositAddresses(
  userId: number | string
): Promise<AdminUserDepositAddress[]> {
  return apiGet<AdminUserDepositAddress[]>(`api/admin/users/${userId}/deposit-addresses`);
}
