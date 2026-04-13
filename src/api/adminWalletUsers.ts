import { apiGet } from "./httpClient";
import type { LaravelPaginator } from "./adminUsers";

export type WalletUserRow = {
  id: number;
  display_name: string;
  email: string | null;
  naira_balance_display: string;
  crypto_balance_display: string;
  naira_tx_count: number;
  crypto_tx_count: number;
};

export function fetchWalletUsers(params: {
  page?: number;
  per_page?: number;
  search?: string;
  from?: string;
  to?: string;
}): Promise<LaravelPaginator<WalletUserRow>> {
  return apiGet<LaravelPaginator<WalletUserRow>>("api/admin/wallet-users", {
    page: params.page,
    per_page: params.per_page ?? 25,
    search: params.search,
    from: params.from,
    to: params.to,
  });
}

export function fetchWalletTotals(): Promise<{
  total_naira_display: string;
  total_crypto_usd_display: string;
}> {
  return apiGet("api/admin/wallet-users/totals");
}
