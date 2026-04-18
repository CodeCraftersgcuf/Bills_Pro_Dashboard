import { apiGet } from "./httpClient";

export type AdminDashboardStats = {
  /** Echo of `range` query param (default `12m`). */
  range?: "7d" | "30d" | "90d" | "12m";
  users_total: number;
  new_users_30d: number;
  active_users: number;
  pending_kyc: number;
  kyc_approved: number;
  kyc_rejected: number;
  users_without_kyc: number;
  open_support_tickets: number;
  failed_jobs: number;
  recent_transaction_volume_7d: number;
  deposits_pending: number;
  transactions_total: number;
  revenue_ngn: number;
  revenue_ngn_display: string;
  virtual_cards: {
    users_with_cards: number;
    total_cards: number;
    total_balance_display: string;
  };
  total_naira_in_wallets: number;
  total_naira_in_wallets_display: string;
  chart: {
    labels: string[];
    withdrawals_ngn: number[];
    deposits_ngn: number[];
  };
  latest_users: {
    id: number;
    display_name: string;
    email: string | null;
    account_status: string | null;
    kyc_completed: boolean;
    created_at: string | null;
  }[];
};

/** Omit `range` for legacy behaviour: all-time transaction count & NGN revenue; chart defaults to last 12 months. */
export function fetchAdminStats(range?: "7d" | "30d" | "90d" | "12m"): Promise<AdminDashboardStats> {
  return apiGet<AdminDashboardStats>("api/admin/stats", range != null ? { range } : undefined);
}
