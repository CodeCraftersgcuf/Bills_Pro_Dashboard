import { apiGet, apiPost } from "./httpClient";

export type PagocardsWalletBalances = {
  visa_wallet_balance: number | null;
  master_wallet_balance: number | null;
};

export type VisaFundRatesHint = {
  customer_fee_usd: number | null;
  customer_rate_ngn_per_usd: number | null;
  provider_cost_usd: number | null;
  provider_pct: number | null;
  rates_page_path: string;
  margin_hint: string | null;
};

export type PagocardsWalletRecharge = {
  id: number;
  ngn_spent: number;
  ngn_spent_display: string;
  usd_gross: number | null;
  usd_credited: number;
  usd_credited_display: string;
  true_rate_ngn_per_usd: number;
  true_rate_display: string;
  recharged_at: string | null;
  notes: string | null;
  created_by: number | null;
  creator: { id: number; name: string; email: string | null } | null;
  created_at: string | null;
};

export type HistoricalBackfillResult = {
  skipped: boolean;
  reason?: string;
  dry_run?: boolean;
  processed: number;
  skipped_existing: number;
  ineligible: number;
  true_rate_ngn_per_usd?: number;
  recharge_id?: number;
  db_backup_path?: string | null;
  metadata_key?: string;
};

export type PagocardsWalletSummary = {
  pagocards_wallet: PagocardsWalletBalances;
  current_true_rate: number | null;
  current_true_rate_display: string | null;
  last_recharge: PagocardsWalletRecharge | null;
  visa_fund_rates: VisaFundRatesHint | null;
  historical_backfill_completed: boolean;
  awaiting_first_recharge_for_history: boolean;
};

export type CreatePagocardsWalletRechargeResponse = {
  recharge: PagocardsWalletRecharge;
  historical_backfill: HistoricalBackfillResult | null;
};

export type PagocardsWalletRechargesPage = {
  data: PagocardsWalletRecharge[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export function fetchPagocardsWalletSummary(): Promise<PagocardsWalletSummary> {
  return apiGet<PagocardsWalletSummary>("api/admin/pagocards-wallet/summary");
}

export function fetchPagocardsWalletRecharges(params?: {
  page?: number;
  per_page?: number;
}): Promise<PagocardsWalletRechargesPage> {
  return apiGet<PagocardsWalletRechargesPage>("api/admin/pagocards-wallet/recharges", params);
}

export function createPagocardsWalletRecharge(body: {
  ngn_spent: number;
  usd_credited: number;
  usd_gross?: number;
  recharged_at?: string;
  notes?: string;
}): Promise<CreatePagocardsWalletRechargeResponse> {
  return apiPost<CreatePagocardsWalletRechargeResponse>("api/admin/pagocards-wallet/recharges", body);
}
