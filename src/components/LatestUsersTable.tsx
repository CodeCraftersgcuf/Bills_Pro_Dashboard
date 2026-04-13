import React, { useDeferredValue, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical } from "lucide-react";
import { fetchAdminUsers, type AdminUserRow } from "../api/adminUsers";
import { getAdminToken } from "../api/authToken";
import { avatarUrlForName } from "../utils/avatarUrl";
import { presetToFromTo, type DateRangePreset } from "../utils/dateRange";

const GREEN = "#1B800F";
const LATEST_HEADER_GREEN = "#21D721";
const LATEST_SEARCH_BG = "#189016";
const LATEST_ROW_A = "#F9F9F9";
const LATEST_ROW_B = "#E6E6E6";
const LATEST_COL_HEADER_BG = "#EBEBEB";
const LATEST_ACTION_LIGHT = "#34D334";

function displayName(u: AdminUserRow): string {
  const n = u.name?.trim();
  if (n) return n;
  const fl = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return fl || `User #${u.id}`;
}

function formatTableDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  let h = d.getHours();
  const m = d.getMinutes();
  const am = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${mm}/${dd}/${yy} - ${h}:${String(m).padStart(2, "0")} ${am}`;
}

export type LatestUsersTableProps = {
  /** Narrow filters for the management page */
  accountStatus?: "all" | "active" | "banned" | "suspended";
  /** KYC: verified = completed; pending = KYC submission pending review */
  kycFilter?: "all" | "verified" | "pending";
  datePreset?: DateRangePreset;
  title?: string;
  perPage?: number;
};

const LatestUsersTable: React.FC<LatestUsersTableProps> = ({
  accountStatus = "all",
  kycFilter = "all",
  datePreset = "all",
  title = "Latest Users",
  perPage = 12,
}) => {
  const navigate = useNavigate();
  const hasToken = Boolean(getAdminToken());
  const [search, setSearch] = useState("");
  const searchDebounced = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const { from, to } = presetToFromTo(datePreset);

  useEffect(() => {
    setPage(1);
  }, [accountStatus, kycFilter, datePreset]);

  const q = useQuery({
    queryKey: ["admin", "users-latest", searchDebounced, page, perPage, accountStatus, kycFilter, from, to],
    queryFn: () =>
      fetchAdminUsers({
        page,
        per_page: perPage,
        search: searchDebounced.trim() || undefined,
        account_status:
          accountStatus === "all" ? undefined : accountStatus === "banned" ? "banned" : accountStatus,
        kyc_filter: kycFilter === "all" ? undefined : kycFilter,
        from,
        to,
      }),
    enabled: hasToken,
  });

  const rows = q.data?.data ?? [];

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-md">
      <div
        className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
        style={{ backgroundColor: LATEST_HEADER_GREEN }}
      >
        <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">{title}</h2>
        <div className="relative w-full md:max-w-[280px]">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
            strokeWidth={2}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search"
            className="w-full rounded-full border-0 py-3 pl-11 pr-5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            style={{ backgroundColor: LATEST_SEARCH_BG }}
          />
        </div>
      </div>

      {q.isError ? (
        <p className="px-5 py-6 text-sm text-red-600">{(q.error as Error)?.message ?? "Failed to load users."}</p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead>
            <tr style={{ backgroundColor: LATEST_COL_HEADER_BG }}>
              <th className="w-12 px-5 py-4 align-middle font-semibold text-gray-600">
                <span className="sr-only">Select</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                  aria-label="Select all"
                />
              </th>
              <th className="px-5 py-4 align-middle font-semibold text-gray-700">User Name</th>
              <th className="px-5 py-4 align-middle font-semibold text-gray-700">Email</th>
              <th className="px-5 py-4 align-middle font-semibold text-gray-700">Phone No</th>
              <th className="px-5 py-4 align-middle font-semibold text-gray-700">Account</th>
              <th className="px-5 py-4 align-middle font-semibold text-gray-700">KYC</th>
              <th className="px-5 py-4 align-middle font-semibold text-gray-700">Registered</th>
              <th className="px-5 py-4 align-middle font-semibold text-gray-700">Actions</th>
              <th className="w-16 px-5 py-4 align-middle font-semibold text-gray-700">Other</th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-gray-500">
                  Loading users…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              rows.map((u, i) => {
                const name = displayName(u);
                const avatar = avatarUrlForName(name);
                const kycDot =
                  u.kyc_completed || false
                    ? LATEST_HEADER_GREEN
                    : u.account_status === "banned"
                      ? "#EF4444"
                      : "#F59E0B";
                return (
                  <tr
                    key={u.id}
                    className="align-middle"
                    style={{ backgroundColor: i % 2 === 0 ? LATEST_ROW_A : LATEST_ROW_B }}
                  >
                    <td className="px-5 py-5 align-middle">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                        aria-label={`Select ${name}`}
                      />
                    </td>
                    <td className="px-5 py-5 align-middle">
                      <div className="flex items-center gap-3">
                        <img
                          src={avatar}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white"
                          width={40}
                          height={40}
                        />
                        <span className="font-semibold text-gray-900">{name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-5 align-middle text-gray-700">{u.email ?? "—"}</td>
                    <td className="px-5 py-5 align-middle text-gray-700">{u.phone_number ?? "—"}</td>
                    <td className="px-5 py-5 align-middle text-gray-800">{u.account_status ?? "—"}</td>
                    <td className="px-5 py-5 align-middle">
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full ring-2 ring-white"
                        style={{ backgroundColor: kycDot }}
                        title={u.kyc_completed ? "KYC completed" : "KYC incomplete"}
                      />
                    </td>
                    <td className="px-5 py-5 align-middle text-gray-700">{formatTableDate(u.created_at)}</td>
                    <td className="px-5 py-5 align-middle">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/user/management/profile/${u.id}`)}
                          className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                          style={{ backgroundColor: LATEST_ACTION_LIGHT }}
                        >
                          User Details
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/transaction?user_id=${u.id}`)}
                          className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                          style={{ backgroundColor: GREEN }}
                        >
                          Transactions
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-5 align-middle">
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D9D9D9] text-gray-600 transition-colors hover:bg-[#CCCCCC]"
                        aria-label="More options"
                      >
                        <MoreVertical className="h-5 w-5" strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {q.data && q.data.last_page > 1 ? (
        <div className="flex items-center justify-center gap-3 border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {q.data.last_page}
          </span>
          <button
            type="button"
            disabled={page >= q.data.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default LatestUsersTable;
