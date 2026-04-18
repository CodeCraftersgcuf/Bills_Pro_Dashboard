import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, CreditCard, Banknote, ChevronDown, Search, X } from "lucide-react";
import StatCard from "../../components/StatCard";
import VirtualCardsPanel from "../../components/VirtualCardsPanel";
import {
  fetchAdminVirtualCardSummary,
  fetchVirtualCardUsersOverview,
  type VirtualCardUserOverviewRow,
} from "../../api/adminVirtualCards";
import { getAdminToken } from "../../api/authToken";
import type { User } from "../../data/users";
import { presetToFromTo, type DateRangePreset } from "../../utils/dateRange";
import { downloadCsv } from "../../utils/csvDownload";

const GREEN = "#1B800F";
const TABLE_HEADER_GREEN = "#21D721";
const TABLE_SEARCH_BG = "#189016";
const TABLE_ROW_A = "#F9F9F9";
const TABLE_ROW_B = "#E6E6E6";
const TABLE_COL_HEADER_BG = "#EBEBEB";
const ACTION_GREEN = "#34D334";

function userFromOverview(row: VirtualCardUserOverviewRow): User {
  const name = row.display_name || `User #${row.user_id}`;
  const avatar =
    row.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1B800F&color=fff&size=128`;
  return {
    id: String(row.user_id),
    publicName: name,
    profileFullName: name,
    firstName: "",
    lastName: "",
    email: row.email ?? "",
    phone: row.phone_number ?? "",
    walletBalanceDisplay: "—",
    avatarUrl: avatar,
    kycStatus: "verified",
    dateRegistered: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };
}

type StatusFilter = "all" | "active" | "frozen";
type BulkVc = "bulk" | "export";

function exportVirtualCardOverviewCsv(rows: VirtualCardUserOverviewRow[]): void {
  if (rows.length === 0) return;
  downloadCsv(
    "virtual-cards-users-overview",
    [
      "user_id",
      "display_name",
      "email",
      "phone_number",
      "card_count",
      "total_balance_display",
      "last_tx_display",
    ],
    rows.map((r) => [
      r.user_id,
      r.display_name,
      r.email,
      r.phone_number,
      r.card_count,
      r.total_balance_display,
      r.last_tx_display ?? "",
    ])
  );
}

const VirtualCards: React.FC = () => {
  const hasToken = Boolean(getAdminToken());
  const [status, setStatus] = useState<StatusFilter>("all");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [search, setSearch] = useState("");
  const searchDebounced = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [workspaceUser, setWorkspaceUser] = useState<User | null>(null);
  const [selectedByUserId, setSelectedByUserId] = useState<Map<number, VirtualCardUserOverviewRow>>(() => new Map());
  const [bulkVc, setBulkVc] = useState<BulkVc>("bulk");
  const selectAllRef = useRef<HTMLInputElement>(null);
  const { from, to } = presetToFromTo(datePreset);

  useEffect(() => {
    setSelectedByUserId(new Map());
  }, [status, datePreset, searchDebounced]);

  useEffect(() => {
    setPage(1);
  }, [status, datePreset, searchDebounced]);

  const summaryQuery = useQuery({
    queryKey: ["admin", "vc-summary"],
    queryFn: fetchAdminVirtualCardSummary,
    enabled: hasToken,
  });

  const overviewQuery = useQuery({
    queryKey: ["admin", "vc-users-overview", status, searchDebounced, page, from, to],
    queryFn: () =>
      fetchVirtualCardUsersOverview({
        status,
        search: searchDebounced.trim() || undefined,
        from,
        to,
        page,
        per_page: 25,
      }),
    enabled: hasToken,
  });

  const summary = useMemo(() => {
    if (!hasToken || !summaryQuery.data) {
      return { users_with_cards: 0, total_cards: 0, total_balance_display: "—" };
    }
    return summaryQuery.data;
  }, [hasToken, summaryQuery.data]);

  const tableRows: VirtualCardUserOverviewRow[] = useMemo(() => {
    return overviewQuery.data?.data ?? [];
  }, [overviewQuery.data]);

  const allOnPageSelected =
    tableRows.length > 0 && tableRows.every((r) => selectedByUserId.has(r.user_id));
  const someOnPageSelected = tableRows.some((r) => selectedByUserId.has(r.user_id));

  useEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    el.indeterminate = someOnPageSelected && !allOnPageSelected;
  }, [allOnPageSelected, someOnPageSelected, tableRows]);

  const toggleRow = (row: VirtualCardUserOverviewRow) => {
    setSelectedByUserId((prev) => {
      const next = new Map(prev);
      if (next.has(row.user_id)) next.delete(row.user_id);
      else next.set(row.user_id, row);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    const all = tableRows.length > 0 && tableRows.every((r) => selectedByUserId.has(r.user_id));
    setSelectedByUserId((prev) => {
      const next = new Map(prev);
      if (all) {
        tableRows.forEach((r) => next.delete(r.user_id));
      } else {
        tableRows.forEach((r) => next.set(r.user_id, r));
      }
      return next;
    });
  };

  const onBulkVcChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as BulkVc;
    setBulkVc("bulk");
    if (v !== "export") return;
    const list = Array.from(selectedByUserId.values());
    if (list.length === 0) {
      window.alert("Select at least one row to export.");
      return;
    }
    exportVirtualCardOverviewCsv(list);
  };

  const pillSelect =
    "relative w-full cursor-pointer appearance-none rounded-full border border-gray-200 bg-[#E8E8E8] py-2.5 pl-4 pr-9 text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B800F]/25 sm:w-auto sm:min-w-[160px]";

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <section className="rounded-3xl p-6 text-white shadow-md md:p-8" style={{ backgroundColor: GREEN }}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">Virtual Cards</h1>
          <div className="relative inline-flex w-full sm:w-auto">
            <select
              className="w-full cursor-pointer appearance-none rounded-xl border border-white/25 bg-white/15 py-3 pl-4 pr-10 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 sm:w-[200px]"
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
              aria-label="Select date range"
            >
              <option value="all" className="text-gray-900">
                All time
              </option>
              <option value="7d" className="text-gray-900">
                Last 7 days
              </option>
              <option value="30d" className="text-gray-900">
                Last 30 days
              </option>
              <option value="90d" className="text-gray-900">
                Last 90 days
              </option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/90"
              strokeWidth={2}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          <StatCard
            icon={Users}
            label="Total Users"
            value={summary.users_with_cards.toLocaleString("en-US")}
            hint="Users with virtual cards"
          />
          <StatCard
            icon={CreditCard}
            label="Total Cards"
            value={summary.total_cards.toLocaleString("en-US")}
            hint="Issued virtual cards"
          />
          <StatCard
            icon={Banknote}
            label="Card Balance"
            value={summary.total_balance_display}
            hint="Aggregate card balance"
          />
        </div>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap gap-2 rounded-full bg-gray-200/80 p-1.5">
          {(
            [
              { key: "all" as const, label: "All" },
              { key: "active" as const, label: "Active" },
              { key: "frozen" as const, label: "Frozen" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                status === key
                  ? "bg-[#1B800F] text-white shadow-sm"
                  : "bg-transparent text-gray-800 hover:bg-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-auto">
          <select
            className={pillSelect}
            value={bulkVc}
            onChange={onBulkVcChange}
            aria-label="Bulk action"
          >
            <option value="bulk" className="text-gray-900">
              Bulk Action
            </option>
            <option value="export" className="text-gray-900">
              Export
            </option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: TABLE_HEADER_GREEN }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">Virtual cards details</h2>
          <div className="relative w-full md:max-w-[280px]">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
              strokeWidth={2}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full rounded-full border-0 py-3 pl-11 pr-5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ backgroundColor: TABLE_SEARCH_BG }}
              aria-label="Search users"
            />
          </div>
        </div>

        {hasToken && overviewQuery.isError ? (
          <p className="px-5 py-4 text-sm text-red-600">
            {(overviewQuery.error as Error)?.message ?? "Could not load list."}
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: TABLE_COL_HEADER_BG }}>
                <th className="w-12 px-5 py-4 align-middle font-semibold text-gray-600">
                  <span className="sr-only">Select</span>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                    aria-label="Select all on this page"
                  />
                </th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Name</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">No of cards</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Cards total balance</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Last trx date</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {hasToken && overviewQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : tableRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                tableRows.map((row, i) => {
                  const avatar =
                    row.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(row.display_name)}&background=E5E7EB&color=374151&size=128`;
                  return (
                    <tr
                      key={row.user_id}
                      className="align-middle"
                      style={{ backgroundColor: i % 2 === 0 ? TABLE_ROW_A : TABLE_ROW_B }}
                    >
                      <td className="px-5 py-5 align-middle">
                        <input
                          type="checkbox"
                          checked={selectedByUserId.has(row.user_id)}
                          onChange={() => toggleRow(row)}
                          className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                          aria-label={`Select ${row.display_name}`}
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
                          <span className="font-semibold text-gray-900">{row.display_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-5 align-middle text-gray-800">{row.card_count}</td>
                      <td className="px-5 py-5 align-middle font-semibold text-gray-900">
                        {row.total_balance_display}
                      </td>
                      <td className="px-5 py-5 align-middle text-gray-700">{row.last_tx_display ?? "—"}</td>
                      <td className="px-5 py-5 align-middle">
                        <button
                          type="button"
                          onClick={() => setWorkspaceUser(userFromOverview(row))}
                          className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                          style={{ backgroundColor: ACTION_GREEN }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {hasToken && overviewQuery.data && overviewQuery.data.last_page > 1 ? (
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
              Page {page} of {overviewQuery.data.last_page}
            </span>
            <button
              type="button"
              disabled={page >= overviewQuery.data.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>

      {workspaceUser ? (
        <div
          className="fixed inset-0 z-[190] flex flex-col bg-[#F4F4F5]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vc-workspace-title"
        >
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm md:px-6">
            <div className="min-w-0">
              <h2 id="vc-workspace-title" className="truncate text-lg font-bold text-gray-900">
                Virtual cards — {workspaceUser.publicName}
              </h2>
              <p className="text-xs text-gray-500">Same tools as User Management → Virtual Cards</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/user/management/profile/${workspaceUser.id}`}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Open in User Management
              </Link>
              <button
                type="button"
                onClick={() => setWorkspaceUser(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 md:px-8">
            <VirtualCardsPanel user={workspaceUser} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default VirtualCards;
