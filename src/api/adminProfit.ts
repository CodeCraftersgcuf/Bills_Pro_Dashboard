import { apiGet, apiPut } from "./httpClient";

export type PercentageBasis = "amount" | "total_amount" | "fee";

export interface ServiceProfitSettingRow {
  id: number;
  service_key: string;
  label: string;
  fixed_fee: string;
  percentage: string;
  percentage_basis: PercentageBasis;
  is_active: boolean;
  sort_order: number;
  updated_at: string | null;
}

export interface ProfitBreakdown {
  fixed_profit: string;
  percentage_profit: string;
  total_profit: string;
  basis_amount: string;
  basis: string;
  service_key: string;
  setting_label: string | null;
}

export interface ProfitTransactionRow {
  id: number;
  transaction_id: string;
  description: string | null;
  type: string | null;
  category: string | null;
  status: string | null;
  currency: string | null;
  amount: string;
  fee: string;
  total_amount: string;
  reference: string | null;
  created_at: string | null;
  user: { id: number; display_name: string; email: string | null } | null;
  profit: ProfitBreakdown;
}

export interface ProfitSummary {
  transaction_count: number;
  sum_transaction_amount: string;
  /** Sum of `transactions.fee` (fees charged on each tx — reflects Rates at execution). */
  sum_fee_collected?: string;
  sum_principal_amount?: string;
  sum_fixed_profit: string;
  sum_percentage_profit: string;
  sum_total_profit: string;
}

export interface ProfitTransactionsResponse {
  summary: ProfitSummary;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  data: ProfitTransactionRow[];
}

export function fetchProfitSettings(): Promise<ServiceProfitSettingRow[]> {
  return apiGet<ServiceProfitSettingRow[]>("admin/profit/settings");
}

export function updateProfitSetting(
  serviceKey: string,
  body: {
    fixed_fee: number;
    percentage: number;
    percentage_basis: PercentageBasis;
    is_active: boolean;
  }
): Promise<ServiceProfitSettingRow> {
  const key = encodeURIComponent(serviceKey);
  return apiPut<ServiceProfitSettingRow>(`admin/profit/settings/${key}`, body);
}

export function fetchProfitTransactions(params: {
  page?: number;
  per_page?: number;
  user_id?: number;
  type?: string;
  currency?: string;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
}): Promise<ProfitTransactionsResponse> {
  return apiGet<ProfitTransactionsResponse>("admin/profit/transactions", {
    page: params.page,
    per_page: params.per_page ?? 25,
    user_id: params.user_id,
    type: params.type && params.type !== "all" ? params.type : undefined,
    currency: params.currency && params.currency !== "all" ? params.currency : undefined,
    status: params.status ?? "completed",
    from: params.from,
    to: params.to,
    search: params.search?.trim() || undefined,
  });
}
