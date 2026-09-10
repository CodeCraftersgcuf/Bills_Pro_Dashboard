import { apiGet, apiPatch, apiPost, apiPut } from "./httpClient";

export type ReferralActionSettings = {
  enabled: boolean;
  reward_referrer_fixed_ngn: number;
  reward_referrer_percent: number;
  reward_referee_fixed_ngn: number;
  reward_referee_percent: number;
  max_times_per_referral: number;
};

export type ReferralSettings = {
  is_enabled: boolean;
  min_transfer_to_wallet_ngn: number;
  max_referrals_per_user: number | null;
  max_rewards_per_referral_ngn: number | null;
  actions: Record<string, ReferralActionSettings>;
  action_keys?: string[];
};

export type ReferralRelationshipRow = {
  id: number;
  status: string;
  referral_code_used: string;
  created_at: string | null;
  rewards_total_ngn: number;
  referrer: {
    id: number;
    name: string;
    email: string;
    referral_code: string | null;
  } | null;
  referee: {
    id: number;
    name: string;
    email: string;
  } | null;
};

export function fetchReferralSettings() {
  return apiGet<ReferralSettings>("/admin/referral/settings");
}

export function updateReferralSettings(body: Partial<ReferralSettings>) {
  return apiPut<ReferralSettings>("/admin/referral/settings", body);
}

export function fetchReferralRelationships(params?: { search?: string; page?: number; per_page?: number }) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.per_page) q.set("per_page", String(params.per_page));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiGet<{
    items: ReferralRelationshipRow[];
    pagination: { current_page: number; per_page: number; total: number; last_page: number };
  }>(`/admin/referral/relationships${suffix}`);
}

export function updateReferralRelationship(id: number, status: "active" | "blocked") {
  return apiPatch<{ id: number; status: string }>(`/admin/referral/relationships/${id}`, { status });
}

export function updateReferralUser(
  id: number,
  body: {
    referral_code?: string | null;
    referred_by_user_id?: number | null;
    relationship_status?: "active" | "blocked";
  }
) {
  return apiPatch<{
    id: number;
    referral_code: string | null;
    referred_by_user_id: number | null;
    earnings_balance_ngn: number;
  }>(`/admin/referral/users/${id}`, body);
}

export function grantManualReferralReward(body: {
  user_id: number;
  amount_ngn: number;
  reason: string;
  referee_id?: number | null;
}) {
  return apiPost<{ reward_id: number; amount_ngn: number; beneficiary_user_id: number }>(
    "/admin/referral/rewards/manual",
    body
  );
}
