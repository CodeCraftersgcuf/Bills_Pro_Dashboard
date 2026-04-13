import { apiDelete, apiGet, apiPost, apiPut } from "./httpClient";

export type PlatformRateCategory = "fiat" | "crypto" | "virtual_card";

export interface PlatformRateRow {
  id: number;
  category: PlatformRateCategory;
  service_key: string;
  sub_service_key: string | null;
  crypto_asset: string | null;
  network_key: string | null;
  exchange_rate_ngn_per_usd: string | null;
  fixed_fee_ngn: string;
  percentage_fee: string | null;
  min_fee_ngn: string | null;
  is_active: boolean;
  updated_at: string | null;
  created_at: string | null;
}

export interface PlatformRatesMeta {
  fiat: {
    services: { key: string; label: string }[];
    sub_services: { key: string; label: string }[];
  };
  crypto: {
    services: { key: string; label: string }[];
    assets: { asset: string; network_key: string; network_label: string }[];
  };
  virtual_card: {
    services: { key: string; label: string }[];
  };
}

export function fetchPlatformRatesMeta(): Promise<PlatformRatesMeta> {
  return apiGet<PlatformRatesMeta>("/admin/platform-rates/meta");
}

export function fetchPlatformRates(
  category: PlatformRateCategory,
  search?: string
): Promise<{ rates: PlatformRateRow[] }> {
  return apiGet<{ rates: PlatformRateRow[] }>("/admin/platform-rates", {
    category,
    search: search?.trim() || undefined,
  });
}

export type PlatformRatePayload = {
  category: PlatformRateCategory;
  service_key: string;
  sub_service_key?: string | null;
  crypto_asset?: string | null;
  network_key?: string | null;
  exchange_rate_ngn_per_usd?: number | null;
  fixed_fee_ngn?: number | null;
  percentage_fee?: number | null;
  min_fee_ngn?: number | null;
  is_active?: boolean;
};

export function createPlatformRate(body: PlatformRatePayload): Promise<{ rate: PlatformRateRow }> {
  return apiPost<{ rate: PlatformRateRow }>("/admin/platform-rates", body);
}

export function updatePlatformRate(id: number, body: Partial<PlatformRatePayload>): Promise<{ rate: PlatformRateRow }> {
  return apiPut<{ rate: PlatformRateRow }>(`/admin/platform-rates/${id}`, body);
}

export function deletePlatformRate(id: number): Promise<void> {
  return apiDelete(`/admin/platform-rates/${id}`);
}

export function bulkDeletePlatformRates(ids: number[]): Promise<void> {
  return apiPost<Record<string, unknown>>("/admin/platform-rates/bulk-delete", { ids }).then(() => undefined);
}
