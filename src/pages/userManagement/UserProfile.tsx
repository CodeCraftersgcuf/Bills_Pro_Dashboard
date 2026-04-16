import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Check, MoreVertical, Search } from "lucide-react";
import {
  banAdminUser,
  fetchAdminUser,
  fetchAdminUserTimeline,
  resetAdminUserPassword,
  revokeUserTokens,
  suspendAdminUser,
  type AdminUserRow,
  unsuspendAdminUser,
} from "../../api/adminUsers";
import { approveKyc, fetchAdminKycDetail, rejectKyc, type KycRecord } from "../../api/adminKyc";
import KycDetailsModal, { type KycDetailsInitial } from "../../components/KycDetailsModal";
import type { User } from "../../data/users";
import AddUserModal from "../../components/AddUserModal";
import WithdrawalAccountsModal from "../../components/WithdrawalAccountsModal";
import UserProfileWalletTab from "../../components/UserProfileWalletTab";
import UserProfileVirtualCardsTab from "../../components/UserProfileVirtualCardsTab";
import UserProfileTransactionsTab from "../../components/UserProfileTransactionsTab";
import { avatarUrlForName } from "../../utils/avatarUrl";
import { humanizeApiLabelOrDash } from "../../utils/humanizeApiLabel";

const GREEN = "#1B800F";
const BRIGHT_GREEN = "#21D721";
const LATEST_SEARCH_BG = "#189016";

const PANEL_LEFT = "#0B4305";
const PANEL_RIGHT = "#1B800F";
const ACCENT_BTN = "#42AC36";
const DIVIDER = "#174A13";
const VERIFIED_GREEN = "#008000";

const profileCardFont = { fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif" } as const;

type ProfileTab = "details" | "wallet" | "virtual-cards" | "transactions";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-[13px]">
      <p className="text-xs font-normal leading-4 text-white/50">{label}</p>
      <p className="break-words text-sm font-normal leading-[19px] text-white">{value}</p>
    </div>
  );
}

function DetailFieldButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-col gap-[13px] rounded-xl text-left ring-offset-2 ring-offset-transparent transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <span className="text-xs font-normal leading-4 text-white/50">{label}</span>
      <span className="break-words text-sm font-normal leading-[19px] text-white underline decoration-white/30 underline-offset-2 hover:decoration-white">
        {value}
      </span>
    </button>
  );
}

function adminToLegacyUser(u: AdminUserRow): User {
  const profileFullName =
    u.name?.trim() || [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.email || "User";
  const kycStatus = u.kyc_completed ? "verified" : "pending";
  return {
    id: String(u.id),
    publicName: profileFullName,
    profileFullName,
    firstName: u.first_name ?? "",
    lastName: u.last_name ?? "",
    email: u.email ?? "",
    phone: u.phone_number ?? "",
    walletBalanceDisplay: "N0",
    avatarUrl: avatarUrlForName(profileFullName),
    kycStatus,
    dateRegistered: u.created_at ?? new Date().toISOString(),
    lastLogin: u.created_at ?? new Date().toISOString(),
  };
}

function formatActivityDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function nameToFirstLast(fullName: string): Pick<KycDetailsInitial, "firstName" | "lastName"> {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function mapKycDbStatusToUi(s: string | null | undefined): KycDetailsInitial["status"] {
  const st = String(s ?? "").toLowerCase();
  if (st === "approved") return "Verified";
  if (st === "pending") return "Pending";
  if (st === "rejected") return "Rejected";
  return "Unverified";
}

function formatDobInput(v: unknown): string {
  if (v == null || v === "") return "";
  const s = typeof v === "string" ? v : String(v);
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : s.slice(0, 10);
}

function mapKycShowToInitial(data: { user: Record<string, unknown>; kyc: KycRecord | null }): KycDetailsInitial {
  const u = data.user;
  const kyc = data.kyc;
  const userName =
    String(u.name ?? "")
      .trim() ||
    [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
    "User";
  const fromParts = nameToFirstLast(userName);

  if (kyc) {
    return {
      firstName: String(kyc.first_name ?? u.first_name ?? fromParts.firstName).trim(),
      lastName: String(kyc.last_name ?? u.last_name ?? fromParts.lastName).trim(),
      email: String(kyc.email ?? u.email ?? ""),
      status: mapKycDbStatusToUi(kyc.status),
      dateOfBirth: formatDobInput(kyc.date_of_birth),
      nin: kyc.nin_number != null && kyc.nin_number !== "" ? String(kyc.nin_number) : "",
      bvn: kyc.bvn_number != null && kyc.bvn_number !== "" ? String(kyc.bvn_number) : "",
    };
  }

  return {
    firstName: String(u.first_name ?? fromParts.firstName),
    lastName: String(u.last_name ?? fromParts.lastName),
    email: String(u.email ?? ""),
    status: "Unverified",
    dateOfBirth: "",
    nin: "",
    bvn: "",
  };
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<ProfileTab>("details");
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [withdrawalAccountsOpen, setWithdrawalAccountsOpen] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const userQ = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => fetchAdminUser(userId!),
    enabled: Boolean(userId),
  });

  const timelineQ = useQuery({
    queryKey: ["admin", "user-timeline", userId],
    queryFn: () => fetchAdminUserTimeline(userId!, 30),
    enabled: Boolean(userId),
  });

  const kycDetailQ = useQuery({
    queryKey: ["admin", "kyc-detail", userId],
    queryFn: () => fetchAdminKycDetail(userId!),
    enabled: Boolean(userId) && kycModalOpen,
  });

  const kycModalInitial = useMemo((): KycDetailsInitial | null => {
    if (!kycDetailQ.data) return null;
    return mapKycShowToInitial(kycDetailQ.data);
  }, [kycDetailQ.data]);

  const refreshUserState = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin", "user", userId] }),
      qc.invalidateQueries({ queryKey: ["admin", "user-timeline", userId] }),
    ]);
  };

  const suspendMut = useMutation({
    mutationFn: () => suspendAdminUser(userId!, "Suspended by admin"),
    onSuccess: async () => {
      setActionNotice("User suspended.");
      await refreshUserState();
    },
  });
  const unsuspendMut = useMutation({
    mutationFn: () => unsuspendAdminUser(userId!),
    onSuccess: async () => {
      setActionNotice("User reactivated.");
      await refreshUserState();
    },
  });
  const banMut = useMutation({
    mutationFn: () => banAdminUser(userId!, "Banned by admin"),
    onSuccess: async () => {
      setActionNotice("User banned.");
      await refreshUserState();
    },
  });
  const revokeMut = useMutation({
    mutationFn: () => revokeUserTokens(userId!),
    onSuccess: async () => {
      setActionNotice("All user sessions revoked.");
      await refreshUserState();
    },
  });
  const resetMut = useMutation({
    mutationFn: () => resetAdminUserPassword(userId!),
    onSuccess: async (data) => {
      setActionNotice(`Temporary password: ${data.temporary_password}`);
      await refreshUserState();
    },
  });

  const approveKycMut = useMutation({
    mutationFn: () => approveKyc(userId!),
    onSuccess: async () => {
      setActionNotice("KYC approved.");
      await refreshUserState();
      await qc.invalidateQueries({ queryKey: ["admin", "kyc-detail", userId] });
      await qc.invalidateQueries({ queryKey: ["admin", "kyc-list"] });
      setKycModalOpen(false);
    },
  });

  const rejectKycMut = useMutation({
    mutationFn: (reason: string) => rejectKyc(userId!, reason),
    onSuccess: async () => {
      setActionNotice("KYC rejected.");
      await refreshUserState();
      await qc.invalidateQueries({ queryKey: ["admin", "kyc-detail", userId] });
      await qc.invalidateQueries({ queryKey: ["admin", "kyc-list"] });
      setKycModalOpen(false);
    },
  });

  const user = useMemo(() => (userQ.data ? adminToLegacyUser(userQ.data) : null), [userQ.data]);

  const activities = useMemo(() => {
    const t = timelineQ.data?.transactions ?? [];
    return t.map((row, i) => ({
      id: `tx-${i}-${String((row as { id?: unknown }).id ?? i)}`,
      userId: userId ?? "",
      activity: `${humanizeApiLabelOrDash(String((row as { type?: string }).type ?? "txn"))} · ${humanizeApiLabelOrDash(String((row as { status?: string }).status ?? ""))}`,
      occurredAt: String((row as { created_at?: string }).created_at ?? new Date().toISOString()),
    }));
  }, [timelineQ.data, userId]);

  const withdrawalAccounts: never[] = [];

  const bankAccountSummary = "Linked accounts are managed in the mobile app (no admin list yet).";
  const accountStatusLc = String(userQ.data?.account_status ?? "").toLowerCase();

  if (!userId) {
    return <Navigate to="/user/management" replace />;
  }

  if (userQ.isError) {
    return (
      <div className="mx-auto max-w-[1600px] p-6">
        <p className="text-red-600">{(userQ.error as Error)?.message ?? "User not found."}</p>
        <button type="button" className="mt-2 text-sm text-[#1B800F] underline" onClick={() => navigate("/user/management")}>
          Back
        </button>
      </div>
    );
  }

  if (userQ.isLoading || !user) {
    return (
      <div className="mx-auto max-w-[1600px] p-6">
        <p className="text-gray-600">Loading user…</p>
      </div>
    );
  }

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "details", label: "User Details" },
    { id: "wallet", label: "Wallet" },
    { id: "virtual-cards", label: "Virtual Cards" },
    { id: "transactions", label: "Transactions" },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <button
        type="button"
        onClick={() => navigate("/user/management")}
        className="text-sm font-medium text-gray-600 underline-offset-2 hover:text-[#1B800F] hover:underline"
      >
        ← User Management
      </button>

      <div className="rounded-full bg-[#E5E7EB] p-1.5 shadow-inner md:inline-flex md:w-auto md:max-w-full">
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                tab === t.id ? "text-white shadow-md" : "text-gray-600 hover:bg-white/50"
              }`}
              style={tab === t.id ? { backgroundColor: GREEN } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {actionNotice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {actionNotice}
        </div>
      ) : null}

      {tab === "details" && (
        <>
          <div
            className="overflow-hidden rounded-[30px] shadow-xl md:flex md:min-h-[363px]"
            style={{
              fontFamily: profileCardFont.fontFamily,
              backgroundColor: PANEL_RIGHT,
              boxShadow: "inset 5px 5px 30px rgba(0, 128, 0, 0.25)",
            }}
          >
            <div
              className="relative flex w-full flex-col items-center overflow-hidden px-6 pb-10 pt-10 text-center md:w-[430px] md:max-w-[430px] md:shrink-0 md:px-8 md:pb-10 md:pt-10"
              style={{ backgroundColor: PANEL_LEFT }}
            >
              <div className="relative flex w-full max-w-[320px] flex-col items-center">
                <div
                  className="flex h-[116px] w-[116px] items-center justify-center overflow-hidden rounded-full"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                >
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" width={116} height={116} />
                </div>
                <h1 className="mt-6 max-w-[260px] text-center text-[20px] font-bold leading-[27px] text-white">
                  {user.profileFullName}
                </h1>
                {user.kycStatus === "verified" && (
                  <div
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-black/30 bg-white px-[11px] py-[5px] shadow-sm"
                    style={{ color: VERIFIED_GREEN }}
                  >
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    <span className="text-[8px] font-normal leading-[11px]">Verified</span>
                  </div>
                )}
                {user.kycStatus === "pending" && (
                  <div className="mt-3 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900">
                    KYC Pending
                  </div>
                )}
                <div className="mt-8 flex w-full max-w-[360px] flex-row justify-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setEditDetailsOpen(true)}
                    className="h-[60px] min-w-0 max-w-[176px] flex-1 rounded-full text-sm font-normal leading-[19px] text-white transition-opacity hover:opacity-95"
                    style={{ backgroundColor: ACCENT_BTN }}
                  >
                    Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setKycModalOpen(true)}
                    className="h-[60px] min-w-0 max-w-[176px] flex-1 rounded-full bg-white text-sm font-normal leading-[19px] text-black transition-colors hover:bg-gray-50"
                  >
                    KYC Details
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col px-6 pb-8 pt-8 md:px-10 md:pb-10 md:pt-9" style={{ backgroundColor: PANEL_RIGHT }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-[30px] font-bold leading-[41px] text-white">User Details</h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setWithdrawalAccountsOpen(true)}
                    className="flex h-[35px] min-w-[119px] items-center justify-center rounded-full px-4 text-[10px] font-normal leading-[14px] text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: ACCENT_BTN }}
                  >
                    View Accounts
                  </button>
                  <button
                    type="button"
                    className="flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-xl border border-[#989898] text-white transition-colors hover:bg-white/5"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </div>

              <div className="my-6 h-px w-full shrink-0 md:my-7" style={{ backgroundColor: DIVIDER }} />

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-0">
                <DetailField label="First Name" value={user.firstName || "—"} />
                <DetailField label="Last Name" value={user.lastName || "—"} />
                <DetailField label="Email" value={user.email} />
              </div>

              <div className="my-6 h-px w-full shrink-0 md:my-7" style={{ backgroundColor: DIVIDER }} />

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-0">
                <DetailField label="Phone Number" value={user.phone} />
                <DetailField label="Date Registered" value={new Date(user.dateRegistered).toLocaleString()} />
                <DetailField label="Account" value={userQ.data?.account_status ?? "—"} />
              </div>

              <div className="my-6 h-px w-full shrink-0 md:my-7" style={{ backgroundColor: DIVIDER }} />

              <div className="grid grid-cols-1 gap-8 sm:max-w-md">
                <DetailFieldButton label="Bank Account" value={bankAccountSummary} onClick={() => setWithdrawalAccountsOpen(true)} />
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {accountStatusLc === "active" ? (
                <button
                  type="button"
                  onClick={() => suspendMut.mutate()}
                  disabled={suspendMut.isPending}
                  className="rounded-full bg-[#E8E8E8] px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-[#DDDDDD] disabled:opacity-60"
                >
                  Suspend
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => unsuspendMut.mutate()}
                  disabled={unsuspendMut.isPending}
                  className="rounded-full bg-[#E8E8E8] px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-[#DDDDDD] disabled:opacity-60"
                >
                  Unsuspend
                </button>
              )}
              <button
                type="button"
                onClick={() => banMut.mutate()}
                disabled={banMut.isPending}
                className="rounded-full bg-[#FEE2E2] px-5 py-2.5 text-sm font-semibold text-[#B91C1C] shadow-sm hover:bg-[#FECACA] disabled:opacity-60"
              >
                Ban User
              </button>
              <button
                type="button"
                onClick={() => revokeMut.mutate()}
                disabled={revokeMut.isPending}
                className="rounded-full bg-[#E8E8E8] px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-[#DDDDDD] disabled:opacity-60"
              >
                Revoke Sessions
              </button>
              <button
                type="button"
                onClick={() => resetMut.mutate()}
                disabled={resetMut.isPending}
                className="rounded-full bg-[#E8E8E8] px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-[#DDDDDD] disabled:opacity-60"
              >
                Reset Password
              </button>
            </div>
          </div>

          <section className="overflow-hidden rounded-3xl bg-white shadow-md">
            <div
              className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
              style={{ backgroundColor: BRIGHT_GREEN }}
            >
              <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">User Activity</h2>
              <div className="relative w-full md:max-w-[280px]">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
                  strokeWidth={2}
                />
                <input
                  type="search"
                  placeholder="Search"
                  className="w-full rounded-full border-0 py-3 pl-11 pr-5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  style={{ backgroundColor: LATEST_SEARCH_BG }}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[#EBEBEB]">
                    <th className="w-14 px-5 py-4 align-middle font-semibold text-gray-600">
                      <span className="sr-only">Select</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721]"
                        aria-label="Select all activities"
                      />
                    </th>
                    <th className="px-5 py-4 font-semibold text-gray-700">Activity</th>
                    <th className="px-5 py-4 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineQ.isLoading ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-6 text-center text-gray-500">
                        Loading activity…
                      </td>
                    </tr>
                  ) : activities.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-6 text-center text-gray-500">
                        No recent transactions.
                      </td>
                    </tr>
                  ) : (
                    activities.map((row, i) => (
                      <tr
                        key={row.id}
                        className="align-middle"
                        style={{ backgroundColor: i % 2 === 0 ? "#F9F9F9" : "#FFFFFF" }}
                      >
                        <td className="px-5 py-4 align-middle">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721]"
                            aria-label={`Select ${row.activity}`}
                          />
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-900">{row.activity}</td>
                        <td className="px-5 py-4 text-gray-700">{formatActivityDateTime(row.occurredAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === "wallet" && <UserProfileWalletTab user={user} />}

      {tab === "virtual-cards" && <UserProfileVirtualCardsTab user={user} />}

      {tab === "transactions" && <UserProfileTransactionsTab user={user} />}

      <AddUserModal open={editDetailsOpen} onClose={() => setEditDetailsOpen(false)} mode="edit" user={user} />

      <WithdrawalAccountsModal
        open={withdrawalAccountsOpen}
        onClose={() => setWithdrawalAccountsOpen(false)}
        accounts={withdrawalAccounts}
        userDisplayName={user.profileFullName}
      />

      <KycDetailsModal
        open={kycModalOpen}
        onClose={() => {
          setKycModalOpen(false);
          void qc.removeQueries({ queryKey: ["admin", "kyc-detail", userId] });
        }}
        initial={kycModalInitial}
        loading={kycDetailQ.isLoading}
        errorMessage={
          kycDetailQ.isError ? ((kycDetailQ.error as Error)?.message ?? "Could not load KYC.") : null
        }
        busy={approveKycMut.isPending || rejectKycMut.isPending}
        onApprove={() => approveKycMut.mutate()}
        onReject={
          kycDetailQ.data?.kyc
            ? (reason) => rejectKycMut.mutate(reason)
            : undefined
        }
      />
    </div>
  );
};

export default UserProfile;
