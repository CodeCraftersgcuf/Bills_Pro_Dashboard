import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, ChevronDown, Coins, Search, Users, X } from "lucide-react";
import type { User } from "../data/users";
import NairaTxReceiptModal from "./NairaTxReceiptModal";
import type { ProfileTxRow } from "../data/userTransactions";
import StatCard from "./StatCard";
import { fetchAdminTransactions, type AdminTransactionRow } from "../api/adminTransactions";

const GREEN = "#1B800F";
const FILTER_TRACK_BG = "#E8E8E8";
const FILTER_DROPDOWN_BG = "#E5E5E5";
const LATEST_HEADER_GREEN = "#21D721";
const LATEST_SEARCH_BG = "#189016";
const LATEST_ROW_A = "#F9F9F9";
const LATEST_ROW_B = "#E6E6E6";
const LATEST_COL_HEADER_BG = "#EBEBEB";
const LATEST_ACTION_LIGHT = "#34D334";
const STATUS_SUCCESS = "#16A34A";
const STATUS_PENDING = "#CA8A04";
const STATUS_FAILED = "#DC2626";

type CurrencyTab = "all" | "naira" | "crypto";
type TypePill = "all" | "deposits" | "withdrawals" | "bill";

function statusColor(s: ProfileTxRow["status"]): string {
  switch (s) {
    case "Successful":
      return STATUS_SUCCESS;
    case "Pending":
      return STATUS_PENDING;
    case "Failed":
      return STATUS_FAILED;
    default:
      return STATUS_SUCCESS;
  }
}

function matchesTypePill(row: ProfileTxRow, pill: TypePill): boolean {
  if (pill === "all") return true;
  const st = row.subType.toLowerCase();
  if (pill === "deposits") return st.includes("deposit");
  if (pill === "withdrawals") return st.includes("withdraw");
  if (pill === "bill") return st.includes("bill");
  return true;
}

function mapAdminTxToProfile(r: AdminTransactionRow, userId: string): ProfileTxRow {
  const cur = (r.currency || "").toUpperCase();
  const isNaira = !r.currency || cur === "NGN" || cur === "NAIRA";
  const type: ProfileTxRow["type"] = isNaira ? "Naira" : "Crypto";
  const stRaw = (r.status || "").toLowerCase();
  const status: ProfileTxRow["status"] =
    ["successful", "success", "completed", "paid"].includes(stRaw)
      ? "Successful"
      : ["pending", "processing"].includes(stRaw)
        ? "Pending"
        : "Failed";
  const amtNum = parseFloat(String(r.total_amount ?? r.amount ?? "0"));
  const amount =
    isNaira && !Number.isNaN(amtNum)
      ? `₦${amtNum.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
      : `${r.amount ?? "—"} ${r.currency ?? ""}`.trim();
  const blob = `${r.type ?? ""} ${r.category ?? ""} ${r.description ?? ""}`.toLowerCase();
  let cryptoTxKind: ProfileTxRow["cryptoTxKind"];
  if (!isNaira) {
    if (blob.includes("withdraw")) cryptoTxKind = "withdraw";
    else if (blob.includes("sell")) cryptoTxKind = "sell";
    else if (blob.includes("buy")) cryptoTxKind = "buy";
    else if (blob.includes("deposit")) cryptoTxKind = "deposit";
  }
  return {
    id: r.transaction_id || String(r.id),
    userId,
    amount,
    status,
    type,
    subType: String(r.type ?? r.category ?? r.description ?? "—"),
    date: r.created_at ? new Date(r.created_at).toLocaleString() : "—",
    cryptoTxKind,
  };
}

function matchesCryptoTxType(row: ProfileTxRow, v: string): boolean {
  if (!v || v === "" || v === "all-types") return true;
  if (row.type === "Naira") return false;
  const k = row.cryptoTxKind;
  if (!k) {
    const st = row.subType.toLowerCase();
    if (v === "deposit") return st.includes("deposit");
    if (v === "withdraw") return st.includes("withdraw");
    if (v === "buy") return st.includes("buy");
    if (v === "sell") return st.includes("sell");
    return false;
  }
  return k === v;
}

export interface UserProfileTransactionsTabProps {
  user: User;
}

const UserProfileTransactionsTab: React.FC<UserProfileTransactionsTabProps> = ({ user }) => {
  const [currencyTab, setCurrencyTab] = useState<CurrencyTab>("all");
  const [typePill, setTypePill] = useState<TypePill>("all");
  const [cryptoTxType, setCryptoTxType] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [search, setSearch] = useState("");
  const [nairaReceipt, setNairaReceipt] = useState<{
    tx: ProfileTxRow;
    variant: "deposit" | "withdraw" | "bill";
  } | null>(null);
  const [detailTx, setDetailTx] = useState<ProfileTxRow | null>(null);

  const txQ = useQuery({
    queryKey: ["admin", "user-transactions", user.id],
    queryFn: () =>
      fetchAdminTransactions({
        user_id: Number(user.id),
        per_page: 100,
      }),
    enabled: Boolean(user.id) && !Number.isNaN(Number(user.id)),
  });

  const baseRows = useMemo(() => {
    const rows = txQ.data?.data ?? [];
    return rows.map((r) => mapAdminTxToProfile(r, user.id));
  }, [txQ.data, user.id]);

  const stats = useMemo(() => {
    const total = baseRows.length;
    const naira = baseRows.filter((r) => r.type === "Naira").length;
    const crypto = baseRows.filter((r) => r.type === "Crypto").length;
    return {
      total: total.toLocaleString("en-US"),
      naira: naira.toLocaleString("en-US"),
      crypto: crypto.toLocaleString("en-US"),
    };
  }, [baseRows]);

  const filteredRows = useMemo(() => {
    let rows = baseRows;

    if (currencyTab === "naira") rows = rows.filter((r) => r.type === "Naira");
    else if (currencyTab === "crypto") rows = rows.filter((r) => r.type === "Crypto");

    rows = rows.filter((r) => matchesTypePill(r, typePill));

    if (currencyTab === "all" || currencyTab === "crypto") {
      rows = rows.filter((r) => matchesCryptoTxType(r, cryptoTxType));
    }

    if (txStatus && txStatus !== "all-status") {
      const map: Record<string, ProfileTxRow["status"]> = {
        successful: "Successful",
        pending: "Pending",
        failed: "Failed",
      };
      const want = map[txStatus];
      if (want) rows = rows.filter((r) => r.status === want);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.amount.toLowerCase().includes(q) ||
          r.subType.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [baseRows, currencyTab, typePill, cryptoTxType, txStatus, search]);

  const tabBtn = (active: boolean) =>
    `relative pb-3 text-sm font-semibold transition-colors ${
      active ? "" : "text-gray-500 hover:text-gray-700"
    }`;

  const segmentedPill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition-colors md:px-5 md:py-2 ${
      active ? "text-white shadow-sm" : "text-gray-700 hover:text-gray-900 bg-transparent"
    }`;

  const selectClass =
    "min-w-[130px] max-w-[200px] cursor-pointer appearance-none rounded-full border-0 py-2 pl-4 pr-9 text-sm font-semibold text-gray-700 shadow-none focus:outline-none focus:ring-2 focus:ring-[#1B800F]/25 md:py-2.5 md:pl-5 md:pr-10";

  const showCryptoTxDropdown = currencyTab === "all" || currencyTab === "crypto";

  return (
    <div className="space-y-6 md:space-y-8">
      {/* User Transactions hero */}
      <section
        className="rounded-3xl p-6 text-white shadow-md md:p-8"
        style={{ backgroundColor: GREEN }}
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">User Transactions</h1>
          <div className="relative inline-flex w-full sm:w-auto">
            <select
              className="w-full cursor-pointer appearance-none rounded-xl border border-white/25 bg-white/15 py-3 pl-4 pr-10 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 sm:w-[200px]"
              defaultValue="range"
              aria-label="Select date range"
            >
              <option value="range" className="text-gray-900">
                Select Date
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
          <StatCard icon={Users} label="Total Txns" value={stats.total} hint="View total transactions" />
          <StatCard icon={Banknote} label="Naira Txns" value={stats.naira} hint="View Naira transactions" />
          <StatCard icon={Coins} label="Crypto Txns" value={stats.crypto} hint="View crypto transactions" />
        </div>
      </section>

      {/* Primary tabs: All | Naira | Crypto */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {(
            [
              ["all", "All"],
              ["naira", "Naira"],
              ["crypto", "Crypto"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setCurrencyTab(key);
                if (key === "naira") setCryptoTxType("");
              }}
              className={`relative ${tabBtn(currencyTab === key)}`}
              style={currencyTab === key ? { color: GREEN } : undefined}
            >
              {label}
              {currencyTab === key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-full"
                  style={{ backgroundColor: GREEN }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Pills + dropdowns */}
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <div
          className="flex w-fit max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto rounded-full p-1 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-1 md:p-1.5 [&::-webkit-scrollbar]:hidden"
          style={{ backgroundColor: FILTER_TRACK_BG }}
          role="group"
          aria-label="Transaction category"
        >
          <button
            type="button"
            onClick={() => setTypePill("all")}
            className={segmentedPill(typePill === "all")}
            style={typePill === "all" ? { backgroundColor: GREEN } : undefined}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setTypePill("deposits")}
            className={segmentedPill(typePill === "deposits")}
            style={typePill === "deposits" ? { backgroundColor: GREEN } : undefined}
          >
            Deposits
          </button>
          <button
            type="button"
            onClick={() => setTypePill("withdrawals")}
            className={segmentedPill(typePill === "withdrawals")}
            style={typePill === "withdrawals" ? { backgroundColor: GREEN } : undefined}
          >
            Withdrawal
          </button>
          <button
            type="button"
            onClick={() => setTypePill("bill")}
            className={segmentedPill(typePill === "bill")}
            style={typePill === "bill" ? { backgroundColor: GREEN } : undefined}
          >
            Bill Payments
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          {showCryptoTxDropdown ? (
            <div className="relative">
              <select
                className={selectClass}
                style={{ backgroundColor: FILTER_DROPDOWN_BG }}
                value={cryptoTxType}
                onChange={(e) => setCryptoTxType(e.target.value)}
                aria-label="Crypto transaction type"
              >
                <option value="">Crypto Tx Type</option>
                <option value="all-types">All</option>
                <option value="deposit">Deposit</option>
                <option value="withdraw">Withdraw</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 md:right-3.5" />
            </div>
          ) : null}

          <div className="relative">
            <select
              className={selectClass}
              style={{ backgroundColor: FILTER_DROPDOWN_BG }}
              value={txStatus}
              onChange={(e) => setTxStatus(e.target.value)}
              aria-label="Transaction status"
            >
              <option value="">Tx Status</option>
              <option value="all-status">All Status</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 md:right-3.5" />
          </div>

          <div className="relative">
            <select className={selectClass} style={{ backgroundColor: FILTER_DROPDOWN_BG }} defaultValue="">
              <option value="">Bulk Action</option>
              <option value="export">Export</option>
              <option value="archive">Archive</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 md:right-3.5" />
          </div>
        </div>
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: LATEST_HEADER_GREEN }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">Transactions</h2>
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
              style={{ backgroundColor: LATEST_SEARCH_BG }}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: LATEST_COL_HEADER_BG }}>
                <th className="w-12 px-5 py-4 align-middle font-semibold text-gray-600">
                  <span className="sr-only">Select</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-2 border-gray-400 bg-white accent-[#21D721]"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-5 py-4 font-semibold text-gray-700">Transaction id</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Amount</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Status</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Type</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Sub-type</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Date</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {txQ.isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-500">
                    Loading transactions…
                  </td>
                </tr>
              ) : txQ.isError ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-red-600">
                    {(txQ.error as Error)?.message ?? "Could not load transactions."}
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-500">
                    No transactions match your filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, i) => (
                  <tr
                    key={row.id}
                    className="align-middle"
                    style={{ backgroundColor: i % 2 === 0 ? LATEST_ROW_A : LATEST_ROW_B }}
                  >
                    <td className="px-5 py-4 align-middle">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-2 border-gray-400 bg-white accent-[#21D721]"
                        aria-label={`Select ${row.id}`}
                      />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-800 md:text-sm">{row.id}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{row.amount}</td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: statusColor(row.status) }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{row.type}</td>
                    <td className="px-5 py-4 text-gray-700">{row.subType}</td>
                    <td className="px-5 py-4 text-gray-700">{row.date}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (row.type !== "Naira") {
                            setDetailTx(row);
                            return;
                          }
                          const st = row.subType.toLowerCase();
                          if (st.includes("bill")) setNairaReceipt({ tx: row, variant: "bill" });
                          else if (st.includes("withdraw"))
                            setNairaReceipt({ tx: row, variant: "withdraw" });
                          else setNairaReceipt({ tx: row, variant: "deposit" });
                        }}
                        className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                        style={{ backgroundColor: LATEST_ACTION_LIGHT }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {nairaReceipt ? (
        <NairaTxReceiptModal
          open
          onClose={() => setNairaReceipt(null)}
          variant={nairaReceipt.variant}
          tx={nairaReceipt.tx}
          accountHolderName={user.profileFullName}
        />
      ) : null}

      {detailTx ? (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 sm:p-6" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={() => setDetailTx(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-tx-detail-title"
            className="relative z-[261] w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="user-tx-detail-title" className="text-lg font-bold text-gray-900">
                Transaction details
              </h2>
              <button
                type="button"
                onClick={() => setDetailTx(null)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Transaction id</dt>
                <dd className="font-mono text-right text-gray-900">{detailTx.id}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Amount</dt>
                <dd className="font-semibold text-gray-900">{detailTx.amount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Status</dt>
                <dd className="text-gray-900">{detailTx.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Type</dt>
                <dd className="text-gray-900">{detailTx.type}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Sub-type</dt>
                <dd className="text-gray-900">{detailTx.subType}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Date</dt>
                <dd className="text-gray-900">{detailTx.date}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setDetailTx(null)}
              className="mt-6 w-full rounded-full py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: GREEN }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UserProfileTransactionsTab;
