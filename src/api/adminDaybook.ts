import { apiGet } from "./httpClient";

export type DaybookDay = {
  date: string;
  label: string;
  long_label: string;
  is_today: boolean;
  prev_date: string;
  next_date: string | null;
  timezone: string;
};

export type DaybookLine = {
  type: string;
  label: string;
  amount: number;
  amount_display: string;
  count: number;
  pct: number;
};

export type DaybookSide = {
  total: number;
  total_display: string;
  count: number;
  lines: DaybookLine[];
};

export type DaybookDelta = {
  previous: number;
  diff: number;
  diff_display: string;
  pct: number | null;
  pct_display: string;
  direction: "up" | "down" | "flat";
};

export type DaybookStatusLine = {
  status: string;
  label: string;
  count: number;
  amount: number;
  amount_display: string;
};

export type DaybookHour = {
  hour: number;
  label: string;
  money_in: number;
  money_in_display: string;
  money_out: number;
  money_out_display: string;
  count: number;
};

export type DaybookBillLine = {
  category: string;
  label: string;
  amount: number;
  amount_display: string;
  count: number;
  pct: number;
};

export type DaybookTransaction = {
  id: number;
  transaction_id: string;
  user_id: number;
  user_name: string;
  user_email: string | null;
  type: string;
  type_label: string;
  direction: "in" | "out" | "note";
  category: string | null;
  category_label: string | null;
  status: string;
  currency: string;
  amount: number;
  amount_display: string;
  fee: number;
  fee_display: string;
  description: string | null;
  reference: string | null;
  time: string | null;
  created_at: string | null;
};

export type DaybookReport = {
  day: DaybookDay;
  money_in: DaybookSide;
  money_out: DaybookSide;
  net: {
    amount: number;
    amount_display: string;
    direction: "in" | "out";
    helper: string;
  };
  fees_collected: { amount: number; amount_display: string; helper: string };
  notes: { lines: DaybookLine[]; helper: string };
  cards: {
    spend_usd: number;
    spend_usd_display: string;
    spend_count: number;
    card_fees_usd: number;
    card_fees_usd_display: string;
    card_fees_count: number;
    declines: number;
    helper: string;
  };
  crypto: {
    deposits: number;
    deposits_display: string;
    withdrawals: number;
    withdrawals_display: string;
    tx_count: number;
    helper: string;
  };
  people: { active_users: number; new_users: number };
  statuses: DaybookStatusLine[];
  hourly: DaybookHour[];
  bill_breakdown: DaybookBillLine[];
  top_movements: DaybookTransaction[];
  versus_yesterday: {
    label: string;
    money_in: DaybookDelta;
    money_out: DaybookDelta;
    fees: DaybookDelta;
    previous_money_in_display: string;
    previous_money_out_display: string;
  };
  scope: { include_test: boolean; helper: string };
};

export type DaybookTransactionsPage = {
  data: DaybookTransaction[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export function fetchDaybook(params?: {
  date?: string;
  include_test?: number;
}): Promise<DaybookReport> {
  return apiGet<DaybookReport>("api/admin/daybook", params);
}

export function fetchDaybookTransactions(params?: {
  date?: string;
  type?: string;
  status?: string;
  search?: string;
  include_test?: number;
  page?: number;
  per_page?: number;
}): Promise<DaybookTransactionsPage> {
  return apiGet<DaybookTransactionsPage>("api/admin/daybook/transactions", params);
}
