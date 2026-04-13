import { apiGet } from "./httpClient";

export interface LaravelPaginator<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: { url: string | null; label: string; active: boolean }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface BillPaymentSummary {
  users_with_bill_payments: number;
  total_bill_transactions: number;
  total_revenue_ngn: string;
}

export interface BillPaymentListRow {
  id: number;
  transaction_id: string;
  reference: string;
  amount: string;
  fee: string;
  total_amount: string;
  currency: string;
  status: string;
  status_label: string;
  service_label: string;
  bill_category: string | null;
  user: {
    id: number;
    display_name: string;
    email: string | null;
    avatar_url: string | null;
  } | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BillPaymentReceipt {
  amount_display: string;
  fee_display: string;
  total_amount_display: string;
  biller_type: string;
  phone_number: string;
  transaction_id: string;
  transaction_type: string;
  reference: string;
  description: string | null;
  status_label: string;
  subtitle_amount_display: string;
  date_display: string;
}

export interface BillPaymentDetailPayload {
  transaction: Record<string, unknown>;
  palm_pay_bill_order: Record<string, unknown> | null;
  receipt: BillPaymentReceipt;
}

export function fetchBillPaymentSummary(): Promise<BillPaymentSummary> {
  return apiGet<BillPaymentSummary>("/admin/bill-payments/summary");
}

export function fetchBillPayments(params: {
  per_page?: number;
  page?: number;
  status?: string;
  bill_type?: string;
  search?: string;
  from?: string;
  to?: string;
}): Promise<LaravelPaginator<BillPaymentListRow>> {
  return apiGet<LaravelPaginator<BillPaymentListRow>>("/admin/bill-payments", {
    per_page: params.per_page ?? 25,
    page: params.page,
    status: params.status && params.status !== "all" ? params.status : undefined,
    bill_type: params.bill_type && params.bill_type !== "all" ? params.bill_type : undefined,
    search: params.search?.trim() || undefined,
    from: params.from,
    to: params.to,
  });
}

export function fetchBillPaymentDetail(id: string | number): Promise<BillPaymentDetailPayload> {
  return apiGet<BillPaymentDetailPayload>(`/admin/bill-payments/${id}`);
}
