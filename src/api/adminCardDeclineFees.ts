import { apiGet, apiPost } from "./httpClient";

export type CardDeclineFeeCharge = {
  id: number;
  user_id: number;
  virtual_card_id: number;
  pagocards_admin_tx_id: number | null;
  provider_card_id: string | null;
  declined_reference: string | null;
  provider_cost_usd: string;
  billable_usd: string;
  exchange_rate_ngn_per_usd: string;
  amount_ngn: string;
  funding_source: "merchant" | "card";
  detection_method: string;
  recovery_status: "charged" | "recovered" | "waived";
  card_subsidy_sequence: number | null;
  created_at: string;
  user?: { id: number; name: string; email: string };
  virtual_card?: { id: number; card_name: string; provider_card_id: string; is_frozen: boolean };
};

export type CardDeclineFeeSummary = {
  merchant_paid_count: number;
  merchant_paid_total_ngn: number;
  outstanding_count: number;
  outstanding_total_ngn: number;
  users_with_negative_naira: number;
  pagocards_wallet: {
    visa_wallet_balance: number | null;
    master_wallet_balance: number | null;
  };
  recovery_enabled: boolean;
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export async function fetchCardDeclineFeeSummary(): Promise<CardDeclineFeeSummary> {
  return apiGet<CardDeclineFeeSummary>("/api/admin/card-decline-fees/summary");
}

export async function fetchCardDeclineFees(params: {
  page?: number;
  per_page?: number;
  funding_source?: string;
  recovery_status?: string;
  exclude_waived?: boolean;
}): Promise<Paginated<CardDeclineFeeCharge>> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.per_page) q.set("per_page", String(params.per_page));
  if (params.funding_source) q.set("funding_source", params.funding_source);
  if (params.recovery_status) q.set("recovery_status", params.recovery_status);
  if (params.exclude_waived !== false) q.set("exclude_waived", "1");
  return apiGet<Paginated<CardDeclineFeeCharge>>(`/api/admin/card-decline-fees?${q.toString()}`);
}

export async function reconcileCardDeclineFees(): Promise<{ processed: number }> {
  return apiPost<{ processed: number }>("/api/admin/card-decline-fees/reconcile", {});
}

export async function waiveCardDeclineFee(id: number): Promise<void> {
  await apiPost(`/api/admin/card-decline-fees/${id}/waive`, {});
}
