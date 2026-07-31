import { apiGet } from "./httpClient";

export type ReconciliationPeriod = {
  from: string | null;
  to: string | null;
  label: string;
};

export type ReconciliationMoneyIn = {
  deposited: number;
  deposited_display: string;
  deposited_count: number;
  card_refunds?: number;
  card_refunds_display?: string;
  card_refunds_count?: number;
  total?: number;
  total_display?: string;
  helper: string;
};

export type ReconciliationMoneyOut = {
  total: number;
  total_display: string;
  withdrawn: number;
  withdrawn_display: string;
  withdrawn_count: number;
  bill_payments: number;
  bill_payments_display: string;
  bill_payments_count: number;
  card_creation_fees: number;
  card_creation_fees_display: string;
  card_creation_count: number;
  card_funding: number;
  card_funding_display: string;
  card_funding_count: number;
  helper: string;
};

export type ReconciliationStillHeld = {
  naira_balance: number;
  naira_balance_display: string;
  card_balance_usd: number;
  card_balance_usd_display: string;
  helper: string;
};

export type ReconciliationCards = {
  spent_usd: number;
  spent_usd_display: string;
  spent_count: number;
  helper: string;
};

export type ReconciliationCheck = {
  residual: number;
  residual_display: string;
  status: "ok" | "needs_review";
  status_label: string;
  threshold_ngn: number;
  explanation: string;
  all_time: boolean;
  net_flow: number;
  net_flow_display: string;
  net_flow_label: string;
};

export type WhereMoneyWentBar = {
  key: string;
  label: string;
  amount: number;
  amount_display: string;
  pct: number;
};

export type BillBreakdownRow = {
  category: string;
  label: string;
  amount: number;
  amount_display: string;
  count: number;
};

export type ReconciliationOverview = {
  period: ReconciliationPeriod;
  money_in: ReconciliationMoneyIn;
  money_out: ReconciliationMoneyOut;
  still_held: ReconciliationStillHeld;
  cards: ReconciliationCards;
  fees_collected: { amount: number; amount_display: string; helper?: string };
  where_money_went: WhereMoneyWentBar[];
  bill_breakdown: BillBreakdownRow[];
  crypto: {
    deposits: number;
    deposits_display: string;
    withdrawals: number;
    withdrawals_display: string;
    buys: number;
    sells: number;
    tx_count: number;
    helper: string;
  };
  check: ReconciliationCheck;
};

export type ReconciliationUserRow = {
  user_id: number;
  display_name: string;
  email: string | null;
  phone_number: string | null;
  deposited: number;
  deposited_display: string;
  card_refunds?: number;
  card_refunds_display?: string;
  withdrawn: number;
  withdrawn_display: string;
  bill_payments: number;
  bill_payments_display: string;
  card_funding: number;
  card_funding_display: string;
  card_creation_fees: number;
  card_creation_fees_display: string;
  card_spent_usd: number;
  card_spent_usd_display: string;
  naira_balance: number;
  naira_balance_display: string;
  card_balance_usd: number;
  card_balance_usd_display: string;
  review_status: "ok" | "needs_review";
  review_status_label: string;
  residual: number;
  residual_display: string;
};

export type ReconciliationUsersPage = {
  data: ReconciliationUserRow[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type ReconciliationUserStory = ReconciliationOverview & {
  user: {
    user_id: number;
    display_name: string;
    email: string | null;
    phone_number: string | null;
  };
  links: {
    transactions: string;
    virtual_cards: string;
    bill_payments: string;
    profile: string;
  };
};

export type LedgerNairaRow = {
  id: string;
  wallet: "naira";
  wallet_label: string;
  at: string | null;
  type: string;
  label: string;
  category: string | null;
  status: string;
  direction: "in" | "out" | "note" | "unknown";
  amount: number;
  amount_display: string;
  fee: number;
  fee_display: string;
  total: number;
  total_display: string;
  signed_display: string;
  counts_towards_balance: boolean;
  balance_after: number | null;
  balance_after_display: string | null;
  description: string;
  reference: string | null;
};

export type LedgerCardRow = {
  id: string;
  wallet: "card";
  wallet_label: string;
  virtual_card_id: number;
  at: string | null;
  type: string;
  label: string;
  status: string;
  direction: "in" | "out" | "info";
  amount: number;
  amount_display: string;
  fee: number;
  fee_display: string;
  total: number;
  total_display: string;
  description: string;
  reference: string | null;
  is_decline_fee: boolean;
};

export type ReconciliationUserLedger = {
  user: { user_id: number; display_name: string; email: string | null };
  period: ReconciliationPeriod;
  naira_rows: LedgerNairaRow[];
  card_rows: LedgerCardRow[];
  totals: {
    naira_rows_count: number;
    card_rows_count: number;
    ledger_balance: number;
    ledger_balance_display: string;
    wallet_balance: number;
    wallet_balance_display: string;
    drift: number;
    drift_display: string;
    drift_note: string;
    unmapped_types: Record<string, number>;
  };
};

export type ReconciliationQuery = {
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  per_page?: number;
};

export function fetchReconciliationOverview(params?: {
  from?: string;
  to?: string;
}): Promise<ReconciliationOverview> {
  return apiGet<ReconciliationOverview>("api/admin/reconciliation/overview", params);
}

export function fetchReconciliationUsers(
  params?: ReconciliationQuery
): Promise<ReconciliationUsersPage> {
  return apiGet<ReconciliationUsersPage>("api/admin/reconciliation/users", params);
}

export function fetchReconciliationUserStory(
  userId: number,
  params?: { from?: string; to?: string }
): Promise<ReconciliationUserStory> {
  return apiGet<ReconciliationUserStory>(`api/admin/reconciliation/users/${userId}`, params);
}

export function fetchReconciliationUserLedger(
  userId: number,
  params?: { from?: string; to?: string }
): Promise<ReconciliationUserLedger> {
  return apiGet<ReconciliationUserLedger>(
    `api/admin/reconciliation/users/${userId}/ledger`,
    params
  );
}
