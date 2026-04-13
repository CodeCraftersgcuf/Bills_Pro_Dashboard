import { apiGet } from "./httpClient";
import type { LaravelPaginator } from "./adminUsers";

export type AdminTransactionRow = {
  id: number;
  user_id: number | null;
  transaction_id: string | null;
  type: string | null;
  category: string | null;
  status: string | null;
  currency: string | null;
  amount: string | number | null;
  fee: string | number | null;
  total_amount: string | number | null;
  reference: string | null;
  description: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  created_at: string | null;
  user?: {
    id: number;
    name: string | null;
    email: string | null;
  } | null;
};

export function fetchAdminTransactions(params: {
  page?: number;
  per_page?: number;
  user_id?: number;
  type?: string;
  status?: string;
  currency?: string;
  from?: string;
  to?: string;
  search?: string;
}): Promise<LaravelPaginator<AdminTransactionRow>> {
  return apiGet<LaravelPaginator<AdminTransactionRow>>("api/admin/transactions", {
    page: params.page,
    per_page: params.per_page ?? 25,
    user_id: params.user_id,
    type: params.type,
    status: params.status,
    currency: params.currency,
    from: params.from,
    to: params.to,
    search: params.search?.trim() || undefined,
  });
}

export function fetchAdminTransaction(transactionId: string): Promise<AdminTransactionRow> {
  return apiGet<AdminTransactionRow>(`api/admin/transactions/${encodeURIComponent(transactionId)}`);
}
