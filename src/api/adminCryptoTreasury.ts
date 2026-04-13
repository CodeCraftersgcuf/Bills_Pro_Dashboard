import { apiGet, apiPost, apiPut } from "./httpClient";
import type { LaravelPaginator } from "./adminBillPayments";

export interface CryptoTreasurySummary {
  virtual_balances_by_asset: Array<{
    blockchain: string;
    currency: string;
    total_available: string;
    accounts: number;
  }>;
  completed_deposits_by_currency: Array<{
    currency: string;
    total_amount: string;
    tx_count: number;
  }>;
}

export interface VirtualAccountHint {
  id: number;
  account_id: string | null;
  available_balance: string;
  currency: string;
  blockchain: string;
  user_id: number;
}

/** On-chain credit row + sweep hints from admin deposits API */
export interface CryptoDepositRow {
  id: number;
  user_id: number;
  type: string;
  currency: string;
  amount: string;
  status: string;
  metadata: Record<string, unknown> | null;
  description?: string | null;
  created_at: string | null;
  user?: { id: number; name: string | null; email: string | null };
  virtual_account_hint: VirtualAccountHint | null;
  custody_status?: string | null;
}

/** Custody ledger: one row per on-chain credit (links to user `transactions`). */
export interface ReceivedAssetRow {
  id: number;
  user_id: number;
  virtual_account_id: number;
  transaction_id: number;
  crypto_deposit_address_id: number | null;
  blockchain: string;
  currency: string;
  amount: string;
  tx_hash: string;
  log_index: number;
  from_address: string | null;
  to_address: string | null;
  source: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  user?: { id: number; name: string | null; email: string | null };
  virtual_account?: {
    id: number;
    currency: string;
    blockchain: string;
    account_id: string | null;
  };
  transaction?: {
    id: number;
    transaction_id: string;
    type: string;
    amount: string;
    currency: string;
    status: string;
  };
  crypto_deposit_address?: {
    id: number;
    address: string;
    blockchain: string;
    currency: string;
  } | null;
}

export interface WalletCurrencyOption {
  id: number;
  blockchain: string;
  currency: string;
  symbol: string | null;
  name: string;
  contract_address: string | null;
  decimals: number;
  is_token: boolean;
  is_active: boolean;
}

export interface CryptoVendorRow {
  id: number;
  name: string;
  code: string;
  blockchain: string;
  currency: string;
  wallet_currency_id: number | null;
  payout_address: string;
  contract_address: string | null;
  is_active: boolean;
  metadata: unknown;
  wallet_currency?: WalletCurrencyOption | null;
  created_at?: string;
  updated_at?: string;
}

export interface MasterWalletMeta {
  id: number;
  blockchain: string;
  address: string;
  label: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CryptoSweepOrder {
  id: number;
  sweep_target: "vendor" | "master";
  crypto_vendor_id: number | null;
  virtual_account_id: number;
  status: string;
  amount: string;
  blockchain: string;
  currency: string;
  from_address: string | null;
  to_address: string | null;
  tx_hash: string | null;
  master_wallet_id: number | null;
  vendor?: CryptoVendorRow | null;
  master_wallet?: MasterWalletMeta | null;
}

export function fetchCryptoTreasurySummary(): Promise<CryptoTreasurySummary> {
  return apiGet<CryptoTreasurySummary>("/admin/crypto/summary");
}

export function fetchCryptoDeposits(params: {
  page?: number;
  per_page?: number;
  currency?: string;
  blockchain?: string;
  user_id?: number;
  tx_hash?: string;
}): Promise<LaravelPaginator<CryptoDepositRow>> {
  return apiGet<LaravelPaginator<CryptoDepositRow>>("/admin/crypto/deposits", {
    page: params.page,
    per_page: params.per_page ?? 25,
    currency: params.currency,
    blockchain: params.blockchain,
    user_id: params.user_id,
    tx_hash: params.tx_hash,
  });
}

export function fetchReceivedAssets(params: {
  page?: number;
  per_page?: number;
  currency?: string;
  blockchain?: string;
  user_id?: number;
  tx_hash?: string;
  status?: string;
}): Promise<LaravelPaginator<ReceivedAssetRow>> {
  return apiGet<LaravelPaginator<ReceivedAssetRow>>("/admin/crypto/received-assets", {
    page: params.page,
    per_page: params.per_page ?? 25,
    currency: params.currency,
    blockchain: params.blockchain,
    user_id: params.user_id,
    tx_hash: params.tx_hash,
    status: params.status,
  });
}

export function fetchWalletCurrencyOptions(activeOnly = true): Promise<WalletCurrencyOption[]> {
  return apiGet<WalletCurrencyOption[]>("/admin/crypto/wallet-currencies", {
    active_only: activeOnly ? 1 : 0,
  });
}

export function fetchCryptoVendors(activeOnly = true): Promise<CryptoVendorRow[]> {
  return apiGet<CryptoVendorRow[]>("/admin/crypto/vendors", { active_only: activeOnly ? 1 : 0 });
}

export function createCryptoVendor(body: {
  name: string;
  code: string;
  payout_address: string;
  wallet_currency_id?: number | null;
  blockchain?: string;
  currency?: string;
  contract_address?: string | null;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<CryptoVendorRow> {
  return apiPost<CryptoVendorRow>("/admin/crypto/vendors", body);
}

export function updateCryptoVendor(
  id: number,
  body: Partial<{
    name: string;
    code: string;
    payout_address: string;
    wallet_currency_id: number | null;
    blockchain: string;
    currency: string;
    contract_address: string | null;
    is_active: boolean;
    metadata: Record<string, unknown>;
  }>
): Promise<CryptoVendorRow> {
  return apiPut<CryptoVendorRow>(`/admin/crypto/vendors/${id}`, body);
}

export function fetchMasterWalletsMeta(): Promise<MasterWalletMeta[]> {
  return apiGet<MasterWalletMeta[]>("/admin/crypto/master-wallets");
}

export function createSweepOrder(body: {
  sweep_target: "vendor" | "master";
  virtual_account_id: number;
  amount: string;
  vendor_id?: number;
}): Promise<CryptoSweepOrder> {
  return apiPost<CryptoSweepOrder>("/admin/crypto/sweeps", body);
}

export function executeSweepOnChain(sweepId: number): Promise<CryptoSweepOrder> {
  return apiPost<CryptoSweepOrder>(`/admin/crypto/sweeps/${sweepId}/execute`, {});
}
