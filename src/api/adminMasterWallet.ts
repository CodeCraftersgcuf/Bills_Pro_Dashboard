import { apiGet } from "./httpClient";
import type { LaravelPaginator } from "./adminBillPayments";

export interface MasterWalletSummary {
  total_naira_balance: string;
  total_crypto_usd_estimate: string;
  virtual_accounts_count: number;
}

export interface MasterWalletTxRow {
  id: number;
  wallet_name: string;
  provider: string;
  transaction_type: string;
  destination: string;
  transaction_id: string;
  tx_hash: string | null;
  amount: string;
  network_fee: string | null;
  currency: string;
  blockchain: string;
  status: string;
  created_at: string | null;
  master_wallet_label: string | null;
}

export function fetchMasterWalletSummary(): Promise<MasterWalletSummary> {
  return apiGet<MasterWalletSummary>("/admin/master-wallet/summary");
}

export function fetchMasterWalletTransactions(params: {
  per_page?: number;
  page?: number;
  tab?: "all" | "naira" | "crypto";
  search?: string;
  from?: string;
  to?: string;
}): Promise<LaravelPaginator<MasterWalletTxRow>> {
  return apiGet<LaravelPaginator<MasterWalletTxRow>>("/admin/master-wallet/transactions", {
    per_page: params.per_page ?? 25,
    page: params.page,
    tab: params.tab && params.tab !== "all" ? params.tab : undefined,
    search: params.search?.trim() || undefined,
    from: params.from,
    to: params.to,
  });
}
