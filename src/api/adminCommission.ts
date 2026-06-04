import { apiDelete, apiGet, apiPost, apiPut } from "./httpClient";

export interface CommissionVolumeTier {
  id: number;
  tier_key: string;
  label: string;
  min_monthly_volume_ngn: string;
  max_monthly_volume_ngn: string | null;
  sort_order: number;
}

export interface BillCommissionRateRow {
  id: number;
  scene: "airtime" | "data" | "betting";
  entity_key: string;
  tier_key: string;
  commission_pct: string;
  is_active: boolean;
}

export function fetchCommissionTiers(): Promise<CommissionVolumeTier[]> {
  return apiGet<CommissionVolumeTier[]>("/admin/commission/tiers");
}

export function updateCommissionTier(
  tierKey: string,
  body: Partial<Pick<CommissionVolumeTier, "label" | "min_monthly_volume_ngn" | "max_monthly_volume_ngn" | "sort_order">>
): Promise<CommissionVolumeTier> {
  return apiPut<CommissionVolumeTier>(`/admin/commission/tiers/${tierKey}`, body);
}

export function fetchCommissionRates(scene?: string): Promise<BillCommissionRateRow[]> {
  return apiGet<BillCommissionRateRow[]>("/admin/commission/rates", scene ? { scene } : undefined);
}

export function saveCommissionRate(body: {
  scene: string;
  entity_key: string;
  tier_key: string;
  commission_pct: number;
  is_active?: boolean;
}): Promise<BillCommissionRateRow> {
  return apiPost<BillCommissionRateRow>("/admin/commission/rates", body);
}

export function updateCommissionRate(
  id: number,
  body: { commission_pct?: number; is_active?: boolean }
): Promise<BillCommissionRateRow> {
  return apiPut<BillCommissionRateRow>(`/admin/commission/rates/${id}`, body);
}

export function deleteCommissionRate(id: number): Promise<void> {
  return apiDelete(`/admin/commission/rates/${id}`);
}
