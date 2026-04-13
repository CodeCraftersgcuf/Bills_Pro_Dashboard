import React, { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
import {
  BalanceTextureCard,
  CRYPTO_WALLET_BG,
  NAIRA_WALLET_BG,
} from "../../components/WalletPanel";
import { fetchWalletTotals, fetchWalletUsers } from "../../api/adminWalletUsers";
import { getAdminToken } from "../../api/authToken";
import { presetToFromTo, type DateRangePreset } from "../../utils/dateRange";

const TABLE_HEADER_GREEN = "#21D721";
const TABLE_SEARCH_BG = "#189016";
const TABLE_ROW_A = "#F9F9F9";
const TABLE_ROW_B = "#E6E6E6";
const TABLE_COL_HEADER_BG = "#EBEBEB";
const ACTION_GREEN = "#34D334";

const WalletManagement: React.FC = () => {
  const hasToken = Boolean(getAdminToken());
  const [search, setSearch] = useState("");
  const searchDebounced = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const { from, to } = presetToFromTo(datePreset);

  const totalsQ = useQuery({
    queryKey: ["admin", "wallet-totals"],
    queryFn: fetchWalletTotals,
    enabled: hasToken,
  });

  const rowsQ = useQuery({
    queryKey: ["admin", "wallet-users", searchDebounced, page, from, to],
    queryFn: () =>
      fetchWalletUsers({
        page,
        per_page: 25,
        search: searchDebounced.trim() || undefined,
        from,
        to,
      }),
    enabled: hasToken,
  });

  const rows = rowsQ.data?.data ?? [];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Wallet Management</h1>
        <div className="relative w-full sm:w-auto sm:min-w-[200px]">
          <select
            className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B800F]/25"
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value as DateRangePreset);
              setPage(1);
            }}
            aria-label="Select date range"
          >
            <option value="all">Select Date</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <BalanceTextureCard
          title="Total Naira Balance"
          amount={totalsQ.data?.total_naira_display ?? "—"}
          bgUrl={NAIRA_WALLET_BG}
          fallbackTint="#0d4a0a"
        />
        <BalanceTextureCard
          title="Total virtual card balance (USD)"
          amount={totalsQ.data?.total_crypto_usd_display ?? "—"}
          bgUrl={CRYPTO_WALLET_BG}
          fallbackTint="#3d2817"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="w-full rounded-xl bg-[#E8E8E8] px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:bg-[#DDDDDD] sm:w-auto"
        >
          Bulk Action
        </button>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: TABLE_HEADER_GREEN }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">User wallets</h2>
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
              style={{ backgroundColor: TABLE_SEARCH_BG }}
              aria-label="Search users"
            />
          </div>
        </div>

        {rowsQ.isError ? (
          <p className="px-5 py-6 text-sm text-red-600">{(rowsQ.error as Error)?.message ?? "Failed to load."}</p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: TABLE_COL_HEADER_BG }}>
                <th className="w-12 px-5 py-4 align-middle font-semibold text-gray-600">
                  <span className="sr-only">Select</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721]"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-5 py-4 font-semibold text-gray-700">Name</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Naira Wallet balance</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Virtual card balance (USD)</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Naira txns</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Crypto txns</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {rowsQ.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{ backgroundColor: i % 2 === 0 ? TABLE_ROW_A : TABLE_ROW_B }}
                    className="border-t border-gray-100"
                  >
                    <td className="px-3 py-3">
                      <input type="checkbox" className="accent-[#21D721]" aria-label={`Select ${r.id}`} />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.display_name}</td>
                    <td className="px-4 py-3 text-gray-800">{r.naira_balance_display}</td>
                    <td className="px-4 py-3 text-gray-800">{r.crypto_balance_display}</td>
                    <td className="px-4 py-3 text-gray-800">{r.naira_tx_count}</td>
                    <td className="px-4 py-3 text-gray-800">{r.crypto_tx_count}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/user/management/profile/${r.id}`}
                        className="inline-flex whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: ACTION_GREEN }}
                      >
                        View Wallets
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {rowsQ.data && rowsQ.data.last_page > 1 ? (
          <div className="flex items-center justify-center gap-2 border-t border-gray-100 px-4 py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {rowsQ.data.last_page}
            </span>
            <button
              type="button"
              disabled={page >= rowsQ.data.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default WalletManagement;
