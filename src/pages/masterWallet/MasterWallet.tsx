import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Search } from "lucide-react";
import { BalanceTextureCard, CRYPTO_WALLET_BG, NAIRA_WALLET_BG } from "../../components/WalletPanel";
import { fetchMasterWalletSummary, fetchMasterWalletTransactions } from "../../api/adminMasterWallet";
import { fetchMasterWalletsMeta } from "../../api/adminCryptoTreasury";
import { getAdminToken } from "../../api/authToken";
import { presetToFromTo, type DateRangePreset } from "../../utils/dateRange";
import { humanizeApiLabelOrDash } from "../../utils/humanizeApiLabel";

const TABLE_HEADER_GREEN = "#21D721";
const TABLE_SEARCH_BG = "#189016";
const TABLE_ROW_A = "#F9F9F9";
const TABLE_ROW_B = "#E6E6E6";
const TABLE_COL_HEADER_BG = "#EBEBEB";
const SUCCESS_ICON = "/transaction-success-icon.png";
const PENDING_ICON = "/pending-transaction-icon.png";

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

const MasterWallet: React.FC = () => {
  const hasToken = Boolean(getAdminToken());
  const [tab, setTab] = useState<"all" | "naira" | "crypto">("all");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [txStatus, setTxStatus] = useState("all");
  const [provider, setProvider] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { from, to } = presetToFromTo(datePreset);

  const summaryQ = useQuery({
    queryKey: ["admin", "master-wallet-summary"],
    queryFn: fetchMasterWalletSummary,
    enabled: hasToken,
  });

  const masterAddrQ = useQuery({
    queryKey: ["admin", "master-wallets-meta"],
    queryFn: fetchMasterWalletsMeta,
    enabled: hasToken,
  });

  const txQ = useQuery({
    queryKey: ["admin", "master-wallet-tx", page, search, tab, from, to],
    queryFn: () =>
      fetchMasterWalletTransactions({
        page,
        per_page: 25,
        tab,
        search,
        from,
        to,
      }),
    enabled: hasToken,
  });

  const rows = txQ.data?.data ?? [];
  const totalPages = txQ.data?.last_page ?? 1;

  const nairaDisplay = summaryQ.data
    ? `₦${Number(summaryQ.data.total_naira_balance).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";
  const cryptoDisplay = summaryQ.data
    ? `$${Number(summaryQ.data.total_crypto_usd_estimate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

  const filteredRows = rows.filter((r) => {
    if (txStatus === "all") return true;
    const ok = txStatus === "successful" ? r.status === "Successful" : r.status === "Pending";
    return ok;
  });

  const providerFiltered =
    provider === "all"
      ? filteredRows
      : filteredRows.filter((r) => r.provider.toLowerCase() === provider.toLowerCase());

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Master Wallets</h1>
        <div className="relative w-full sm:w-auto sm:min-w-[200px]">
          <select
            className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-gray-800 shadow-sm"
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value as DateRangePreset);
              setPage(1);
            }}
            aria-label="Select cycle"
          >
            <option value="all">Select Cycle</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {!hasToken ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Log in as <strong>admin</strong> to load master wallet balances and on-chain activity from the API.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <BalanceTextureCard title="Total Naira Balance" amount={nairaDisplay} bgUrl={NAIRA_WALLET_BG} fallbackTint="#0d4a0a" />
        <BalanceTextureCard title="Total Crypto Balance" amount={cryptoDisplay} bgUrl={CRYPTO_WALLET_BG} fallbackTint="#3d2817" />
      </div>

      {hasToken && (masterAddrQ.data?.length ?? 0) > 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Treasury (master) deposit addresses</h2>
          <p className="mt-1 text-sm text-gray-600">
            On-chain addresses used as the sweep destination for custodial funds. Share only for operational reconciliation —
            deposits here are platform treasury, not end-user balances.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(masterAddrQ.data ?? []).map((mw) => (
              <div key={mw.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {mw.label ?? mw.blockchain}
                </div>
                <div className="mt-1 text-sm text-gray-800">{mw.blockchain}</div>
                <div className="mt-2 break-all font-mono text-xs leading-relaxed text-gray-900">{mw.address}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(mw.address);
                    }}
                    className="rounded-lg bg-[#1B800F] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Copy address
                  </button>
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(mw.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-[#1B800F] underline"
                  >
                    Open QR
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "All"],
            ["naira", "Naira"],
            ["crypto", "Crypto"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setTab(k);
              setPage(1);
            }}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              tab === k ? "bg-[#1B800F] text-white shadow-sm" : "bg-[#E8E8E8] text-gray-800 hover:bg-[#DDDDDD]"
            }`}
          >
            {label}
          </button>
        ))}
        <select
          value={txStatus}
          onChange={(e) => setTxStatus(e.target.value)}
          className="rounded-full px-4 py-2 text-sm font-semibold text-gray-800"
          style={{ backgroundColor: "#E8E8E8" }}
          aria-label="Transaction status"
        >
          <option value="all">All statuses</option>
          <option value="successful">Successful</option>
          <option value="pending">Pending</option>
        </select>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="rounded-full px-4 py-2 text-sm font-semibold text-gray-800"
          style={{ backgroundColor: "#E8E8E8" }}
          aria-label="Provider"
        >
          <option value="all">All providers</option>
          <option value="Tatum">Tatum</option>
          <option value="Palmpay">Palmpay</option>
        </select>
        <button type="button" className="ml-auto rounded-full px-5 py-2 text-sm font-semibold text-gray-800" style={{ backgroundColor: "#E8E8E8" }}>
          Bulk Action
        </button>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: TABLE_HEADER_GREEN }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">Wallet transactions</h2>
          <div className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/90" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search…"
              className="w-full rounded-full border-0 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/40"
              style={{ backgroundColor: TABLE_SEARCH_BG }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: TABLE_COL_HEADER_BG }}>
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" className="accent-[#21D721]" aria-label="Select all" />
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700">Wallet Name</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Provider</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Transaction type</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Destination</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Transaction id</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {hasToken && txQ.isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : tab === "naira" ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                    Naira master-ledger rows are not stored in this table. Use Transactions for fiat treasury activity.
                  </td>
                </tr>
              ) : providerFiltered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                    No master wallet transactions found.
                  </td>
                </tr>
              ) : (
                providerFiltered.map((r, i) => (
                  <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? TABLE_ROW_A : TABLE_ROW_B }} className="border-t border-gray-100">
                    <td className="px-3 py-3">
                      <input type="checkbox" className="accent-[#21D721]" aria-label={`Select ${r.id}`} />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.wallet_name}</td>
                    <td className="px-4 py-3 text-gray-800">{r.provider}</td>
                    <td className="px-4 py-3 text-gray-800">{humanizeApiLabelOrDash(r.transaction_type)}</td>
                    <td className="px-4 py-3 text-gray-800">{r.destination}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-800">{r.transaction_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {r.currency === "USDT" || r.currency === "BTC" ? `${r.amount} ${r.currency}` : r.amount}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatTableDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: r.status === "Successful" ? "#DCFCE7" : "#FEF3C7",
                          color: r.status === "Successful" ? "#166534" : "#92400E",
                        }}
                      >
                        {r.status === "Successful" ? (
                          <img src={SUCCESS_ICON} alt="" className="h-4 w-4 object-contain" width={16} height={16} />
                        ) : r.status === "Pending" ? (
                          <img src={PENDING_ICON} alt="" className="h-4 w-4 object-contain" width={16} height={16} />
                        ) : null}
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {hasToken && totalPages > 1 && tab !== "naira" ? (
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
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}

        {txQ.isError ? (
          <p className="px-5 py-3 text-sm text-red-600">{(txQ.error as Error)?.message ?? "Failed to load transactions."}</p>
        ) : null}
      </section>
    </div>
  );
};

export default MasterWallet;
