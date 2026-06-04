import { apiGet, apiPost } from "./httpClient";

/** Matches `AdminVirtualCardController::formatAdminCardSummary` */
export interface AdminVirtualCardSummary {
  id: number;
  user_id: number;
  title: string;
  short_name: string;
  balance_display: string;
  last_four: string;
  status: "active" | "frozen";
  details_button_variant: "green" | "orange" | "pink";
  is_frozen: boolean;
  is_active: boolean;
  card_color: string;
  /** `visa` or `mastercard` from API */
  card_scheme?: string;
}

export interface AdminVirtualCardListPayload {
  cards: AdminVirtualCardSummary[];
}

export interface AdminVirtualCardTxRow {
  id: string;
  database_id: number;
  virtual_card_id: number;
  amount: string;
  status: "Successful" | "Pending" | "Failed";
  card_label: string;
  /** `visa` or `mastercard` */
  card_scheme?: string;
  sub_type: string;
  date: string;
  kind: "deposit" | "withdrawal" | "payment";
}

export type VirtualCardScheme = "visa" | "mastercard";

export interface AdminCardFundingEstimate {
  principal_usd?: number;
  charge_ngn?: number;
  charge_usd?: number;
  load_fee_usd?: number;
  processing_fee_ngn?: number;
  exchange_rate_ngn_per_usd?: number;
  card_funding_fee_usd?: number;
  billspro_transaction_fee_percent?: number;
}

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

export function fetchAdminVirtualCardsForUser(
  userId: string,
  status: "all" | "active" | "frozen"
): Promise<AdminVirtualCardListPayload> {
  return apiGet<AdminVirtualCardListPayload>(`/admin/users/${userId}/virtual-cards`, { status });
}

export function fetchAdminVirtualCardTransactions(
  userId: string,
  params: {
    category?: "all" | "deposits" | "withdrawals" | "payments";
    tx_status?: "all" | "successful" | "pending" | "failed";
    virtual_card_id?: number;
    search?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
  }
): Promise<LaravelPaginator<AdminVirtualCardTxRow>> {
  const q: Record<string, string | number | undefined> = {
    per_page: params.per_page ?? 50,
    page: params.page,
  };
  if (params.category && params.category !== "all") q.category = params.category;
  if (params.tx_status && params.tx_status !== "all") q.tx_status = params.tx_status;
  if (params.virtual_card_id) q.virtual_card_id = params.virtual_card_id;
  if (params.search?.trim()) q.search = params.search.trim();
  if (params.date_from) q.date_from = params.date_from;
  if (params.date_to) q.date_to = params.date_to;

  return apiGet<LaravelPaginator<AdminVirtualCardTxRow>>(
    `/admin/users/${userId}/virtual-card-transactions`,
    q
  );
}

export async function adminFreezeVirtualCard(cardId: number): Promise<unknown> {
  return apiPost<unknown>(`/admin/virtual-cards/${cardId}/freeze`);
}

export async function adminUnfreezeVirtualCard(cardId: number): Promise<unknown> {
  return apiPost<unknown>(`/admin/virtual-cards/${cardId}/unfreeze`);
}

export async function adminFundVirtualCard(
  cardId: number,
  body: {
    amount: number;
    payment_wallet_type: "naira_wallet" | "crypto_wallet";
    payment_wallet_currency?: string;
  }
): Promise<Record<string, unknown>> {
  return apiPost<Record<string, unknown>>(`/admin/virtual-cards/${cardId}/fund`, body);
}

/** Scheme-aware funding quote (`fund` vs `visa_fund` rates). */
export function fetchAdminVirtualCardFundingEstimate(
  cardId: number,
  params: {
    amount: number;
    payment_wallet_type: "naira_wallet" | "crypto_wallet";
    payment_wallet_currency?: string;
  }
): Promise<AdminCardFundingEstimate> {
  return apiGet<AdminCardFundingEstimate>(`/admin/virtual-cards/${cardId}/funding-estimate`, {
    amount: params.amount,
    payment_wallet_type: params.payment_wallet_type,
    payment_wallet_currency: params.payment_wallet_currency ?? "NGN",
  });
}

/** Full card row for details modal (admin show; refreshes balance/PAN from Pagocards). */
export async function fetchAdminVirtualCard(cardId: number): Promise<Record<string, unknown>> {
  return apiGet<Record<string, unknown>>(`/admin/virtual-cards/${cardId}`);
}

/** Per-card transactions (same sync path as mobile GET /virtual-cards/{id}/transactions). */
export async function fetchAdminVirtualCardTransactionsByCard(
  cardId: number,
  params?: { limit?: number }
): Promise<unknown[]> {
  const raw = await apiGet<unknown>(`/admin/virtual-cards/${cardId}/transactions`, {
    limit: params?.limit ?? 50,
  });
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const d = raw as Record<string, unknown>;
    if (Array.isArray(d.transactions)) return d.transactions;
    if (Array.isArray(d.data)) return d.data;
  }
  return [];
}

export interface AdminVirtualCardGlobalSummary {
  users_with_cards: number;
  total_cards: number;
  total_balance_display: string;
}

export interface VirtualCardUserOverviewRow {
  user_id: number;
  display_name: string;
  email: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  card_count: number;
  total_balance_display: string;
  last_tx_display: string | null;
}

export function fetchAdminVirtualCardSummary(): Promise<AdminVirtualCardGlobalSummary> {
  return apiGet<AdminVirtualCardGlobalSummary>("/admin/virtual-cards/summary");
}

export function fetchVirtualCardUsersOverview(params: {
  status?: "all" | "active" | "frozen";
  search?: string;
  per_page?: number;
  page?: number;
  from?: string;
  to?: string;
}): Promise<LaravelPaginator<VirtualCardUserOverviewRow>> {
  const q: Record<string, string | number | undefined> = {
    per_page: params.per_page ?? 25,
    page: params.page,
  };
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.search?.trim()) q.search = params.search.trim();
  if (params.from) q.from = params.from;
  if (params.to) q.to = params.to;
  return apiGet<LaravelPaginator<VirtualCardUserOverviewRow>>("/admin/virtual-cards/users-overview", q);
}
