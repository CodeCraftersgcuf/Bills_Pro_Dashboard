import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, Search, Users } from "lucide-react";
import {
  fetchReferralRelationships,
  fetchReferralSettings,
  grantManualReferralReward,
  updateReferralRelationship,
  updateReferralSettings,
  updateReferralUser,
  type ReferralActionSettings,
  type ReferralSettings,
} from "../../api/adminReferral";

const GREEN = "#1B800F";

const ACTION_LABELS: Record<string, string> = {
  signup_verified: "Signup (email verified)",
  kyc_approved: "KYC approved",
  first_deposit: "First NGN deposit",
  card_create: "First card created",
  card_fund: "Card funding",
};

const Referrals: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"settings" | "list">("settings");
  const [search, setSearch] = useState("");
  const [manualUserId, setManualUserId] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [editUserId, setEditUserId] = useState("");
  const [editCode, setEditCode] = useState("");

  const settingsQ = useQuery({
    queryKey: ["admin", "referral-settings"],
    queryFn: fetchReferralSettings,
  });

  const listQ = useQuery({
    queryKey: ["admin", "referral-relationships", search],
    queryFn: () => fetchReferralRelationships({ search: search || undefined, per_page: 50 }),
    enabled: tab === "list",
  });

  const [draft, setDraft] = useState<ReferralSettings | null>(null);
  const settings = draft ?? settingsQ.data ?? null;

  React.useEffect(() => {
    if (settingsQ.data) setDraft(settingsQ.data);
  }, [settingsQ.data]);

  const saveSettingsMut = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error("Nothing to save");
      return updateReferralSettings({
        is_enabled: draft.is_enabled,
        min_transfer_to_wallet_ngn: draft.min_transfer_to_wallet_ngn,
        max_referrals_per_user: draft.max_referrals_per_user,
        max_rewards_per_referral_ngn: draft.max_rewards_per_referral_ngn,
        actions: draft.actions,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "referral-settings"] });
    },
  });

  const manualMut = useMutation({
    mutationFn: () =>
      grantManualReferralReward({
        user_id: Number(manualUserId),
        amount_ngn: Number(manualAmount),
        reason: manualReason.trim(),
      }),
    onSuccess: async () => {
      setManualAmount("");
      setManualReason("");
      await qc.invalidateQueries({ queryKey: ["admin", "referral-relationships"] });
    },
  });

  const editCodeMut = useMutation({
    mutationFn: () =>
      updateReferralUser(Number(editUserId), {
        referral_code: editCode.trim() || null,
      }),
    onSuccess: async () => {
      setEditCode("");
      await qc.invalidateQueries({ queryKey: ["admin", "referral-relationships"] });
    },
  });

  const actionKeys = useMemo(
    () => Object.keys(settings?.actions ?? ACTION_LABELS),
    [settings?.actions]
  );

  const updateAction = (key: string, patch: Partial<ReferralActionSettings>) => {
    if (!settings) return;
    setDraft({
      ...settings,
      actions: {
        ...settings.actions,
        [key]: { ...settings.actions[key], ...patch },
      },
    });
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
            <Gift className="h-6 w-6" style={{ color: GREEN }} />
            Referral program
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure Naira rewards, qualification actions, and manage referrals.
          </p>
        </div>
        <div className="flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab("settings")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === "settings" ? "bg-gray-900 text-white" : "text-gray-600"
            }`}
          >
            Settings
          </button>
          <button
            type="button"
            onClick={() => setTab("list")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === "list" ? "bg-gray-900 text-white" : "text-gray-600"
            }`}
          >
            Referrals
          </button>
        </div>
      </div>

      {tab === "settings" && (
        <div className="space-y-6">
          {!settings ? (
            <p className="text-sm text-gray-500">Loading settings…</p>
          ) : (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">Program enabled</p>
                    <p className="text-sm text-gray-500">When off, no auto rewards are granted.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.is_enabled}
                    onClick={() => setDraft({ ...settings, is_enabled: !settings.is_enabled })}
                    className={`relative h-7 w-12 rounded-full ${
                      settings.is_enabled ? "bg-green-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                        settings.is_enabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <label className="block text-sm">
                    <span className="mb-1 block text-gray-600">Min transfer to wallet (₦)</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={settings.min_transfer_to_wallet_ngn}
                      onChange={(e) =>
                        setDraft({
                          ...settings,
                          min_transfer_to_wallet_ngn: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-gray-600">Max referrals / user</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={settings.max_referrals_per_user ?? ""}
                      placeholder="Unlimited"
                      onChange={(e) =>
                        setDraft({
                          ...settings,
                          max_referrals_per_user: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-gray-600">Max rewards / referral (₦)</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      value={settings.max_rewards_per_referral_ngn ?? ""}
                      placeholder="Unlimited"
                      onChange={(e) =>
                        setDraft({
                          ...settings,
                          max_rewards_per_referral_ngn:
                            e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-medium text-gray-900">Reward actions</h2>
                {actionKeys.map((key) => {
                  const row = settings.actions[key] ?? {
                    enabled: false,
                    reward_referrer_fixed_ngn: 0,
                    reward_referrer_percent: 0,
                    reward_referee_fixed_ngn: 0,
                    reward_referee_percent: 0,
                    max_times_per_referral: 1,
                  };
                  return (
                    <div key={key} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900">{ACTION_LABELS[key] ?? key}</p>
                          <p className="font-mono text-xs text-gray-500">{key}</p>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          Enabled
                          <input
                            type="checkbox"
                            checked={!!row.enabled}
                            onChange={(e) => updateAction(key, { enabled: e.target.checked })}
                          />
                        </label>
                      </div>
                      <div className="grid gap-2 md:grid-cols-5">
                        <NumField
                          label="Referrer fixed ₦"
                          value={row.reward_referrer_fixed_ngn}
                          onChange={(v) => updateAction(key, { reward_referrer_fixed_ngn: v })}
                        />
                        <NumField
                          label="Referrer %"
                          value={row.reward_referrer_percent}
                          onChange={(v) => updateAction(key, { reward_referrer_percent: v })}
                        />
                        <NumField
                          label="Referee fixed ₦"
                          value={row.reward_referee_fixed_ngn}
                          onChange={(v) => updateAction(key, { reward_referee_fixed_ngn: v })}
                        />
                        <NumField
                          label="Referee %"
                          value={row.reward_referee_percent}
                          onChange={(v) => updateAction(key, { reward_referee_percent: v })}
                        />
                        <NumField
                          label="Max times (0=∞)"
                          value={row.max_times_per_referral}
                          onChange={(v) => updateAction(key, { max_times_per_referral: v })}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => saveSettingsMut.mutate()}
                disabled={saveSettingsMut.isPending}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: GREEN }}
              >
                {saveSettingsMut.isPending ? "Saving…" : "Save settings"}
              </button>
              {saveSettingsMut.isError && (
                <p className="text-sm text-red-600">{(saveSettingsMut.error as Error).message}</p>
              )}
              {saveSettingsMut.isSuccess && <p className="text-sm text-green-700">Settings saved.</p>}
            </>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-medium text-gray-900">Manual reward (earnings balance)</h3>
              <div className="space-y-2">
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="User ID"
                  value={manualUserId}
                  onChange={(e) => setManualUserId(e.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Amount (NGN)"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Reason"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                />
                <button
                  type="button"
                  disabled={manualMut.isPending}
                  onClick={() => manualMut.mutate()}
                  className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white"
                >
                  Credit reward
                </button>
                {manualMut.isError && (
                  <p className="text-sm text-red-600">{(manualMut.error as Error).message}</p>
                )}
                {manualMut.isSuccess && <p className="text-sm text-green-700">Reward credited.</p>}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-medium text-gray-900">Edit referral code</h3>
              <div className="space-y-2">
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="User ID"
                  value={editUserId}
                  onChange={(e) => setEditUserId(e.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="New code (e.g. PETERVIP)"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                />
                <button
                  type="button"
                  disabled={editCodeMut.isPending}
                  onClick={() => editCodeMut.mutate()}
                  className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white"
                >
                  Update code
                </button>
                {editCodeMut.isError && (
                  <p className="text-sm text-red-600">{(editCodeMut.error as Error).message}</p>
                )}
                {editCodeMut.isSuccess && <p className="text-sm text-green-700">Code updated.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "list" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              className="w-full border-0 text-sm outline-none"
              placeholder="Search email, name, or code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {listQ.isLoading && <p className="text-sm text-gray-500">Loading…</p>}
          {listQ.isError && (
            <p className="text-sm text-red-600">{(listQ.error as Error).message}</p>
          )}

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Referrer</th>
                  <th className="px-3 py-2">Referee</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Rewards ₦</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(listQ.data?.items ?? []).map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.referrer?.name || "—"}</div>
                      <div className="text-xs text-gray-500">{row.referrer?.email}</div>
                      <div className="font-mono text-xs text-gray-400">
                        {row.referrer?.referral_code}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.referee?.name || "—"}</div>
                      <div className="text-xs text-gray-500">{row.referee?.email}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{row.referral_code_used}</td>
                    <td className="px-3 py-2">{Number(row.rewards_total_ngn).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          row.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-xs font-medium text-gray-700 underline"
                        onClick={async () => {
                          await updateReferralRelationship(
                            row.id,
                            row.status === "active" ? "blocked" : "active"
                          );
                          await qc.invalidateQueries({ queryKey: ["admin", "referral-relationships"] });
                        }}
                      >
                        {row.status === "active" ? "Block" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {(listQ.data?.items ?? []).length === 0 && !listQ.isLoading && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                      <Users className="mx-auto mb-2 h-6 w-6 opacity-40" />
                      No referrals yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const NumField: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
}> = ({ label, value, onChange }) => (
  <label className="block text-xs">
    <span className="mb-1 block text-gray-600">{label}</span>
    <input
      type="number"
      className="w-full rounded-lg border border-gray-300 px-2 py-1.5"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </label>
);

export default Referrals;
