import { apiGet, apiPut } from "./httpClient";

export type PercentageBasis = "amount" | "total_amount" | "fee" | "ngn_notional";

export type RevenueKind =
  | "fiat_fee"
  | "bill_fee"
  | "crypto_usd_notional_fee"
  | "exchange_trade"
  | "virtual_card_fee"
  | "other";

export interface TransactionRevenueInfo {
  revenue_kind: RevenueKind;
  label_customer_flow: string;
  label_fee_line: string;
  ngn_notional: string | null;
  crypto_units: string | null;
  reference_ngn_per_crypto: string | null;
  applied_ngn_per_crypto: string | null;
  implied_spread_ngn: string | null;
}

export type MarginMode = "ledger_rule" | "charge_minus_cost" | "commission";

export interface ServiceProfitSettingRow {
  id: number;
  service_key: string;
  label: string;
  fixed_fee: string;
  percentage: string;
  percentage_basis: PercentageBasis;
  margin_mode?: MarginMode;
  provider_cost_ngn?: string | null;
  provider_cost_usd?: string | null;
  provider_pct?: string | null;
  provider_pct_cap_ngn?: string | null;
  linked_rate_slug?: string | null;
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
  profit_currency?: string | null;
  admin_profit_percent?: string | null;
  customer_revenue_ngn?: string;
  provider_cost_ngn?: string;
  net_margin_ngn?: string;
  pricing_source?: string;
  commission_pct?: string | null;
}

export interface PricingCatalogRow {
  source: string;
  rate_id?: number;
  slug?: string;
  category?: string;
  service_key?: string;
  label: string;
  provider_cost_display: string;
  billspro_charge_display: string;
  estimated_profit_display: string;
  edit_path: string;
}

/** Snapshot of the matching Rates row (fixed + % + min, etc.) for this transaction. */
export interface PlatformRateSnapshot {
  category: string;
  service_key: string;
  sub_service_key: string | null;
  crypto_asset: string | null;
  network_key: string | null;
  fixed_fee_ngn: string | null;
  percentage_fee: string | null;
  min_fee_ngn: string | null;
  fee_usd: string | null;
  exchange_rate_ngn_per_usd: string | null;
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
  /** How customer pricing works for this row (fee vs exchange vs crypto USD fee). */
  revenue?: TransactionRevenueInfo;
  /** Present when the API can match this ledger row to a Rates configuration. */
  rate_from_admin?: PlatformRateSnapshot | null;
  /** For virtual card ledger rows: `visa` or `mastercard` when stored on the transaction. */
  virtual_card_scheme?: string | null;
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
  sum_net_margin?: string;
  sum_provider_cost?: string;
  sum_customer_revenue?: string;
  sum_commission?: string;
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

export function fetchPricingCatalog(): Promise<PricingCatalogRow[]> {
  return apiGet<PricingCatalogRow[]>("/admin/profit/catalog");
}

export function fetchProfitSettings(): Promise<ServiceProfitSettingRow[]> {
  return apiGet<ServiceProfitSettingRow[]>("/admin/profit/settings");
}

export function updateProfitSetting(
  serviceKey: string,
  body: {
    fixed_fee: number;
    percentage: number;
    percentage_basis: PercentageBasis;
    margin_mode?: MarginMode;
    provider_cost_ngn?: number | null;
    provider_cost_usd?: number | null;
    provider_pct?: number | null;
    provider_pct_cap_ngn?: number | null;
    linked_rate_slug?: string | null;
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
