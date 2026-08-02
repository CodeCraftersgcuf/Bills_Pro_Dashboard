import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Wallet } from "lucide-react";
import {
  createPagocardsWalletRecharge,
  fetchPagocardsWalletRecharges,
  fetchPagocardsWalletSummary,
} from "../../api/adminPagocardsWallet";
import { getAdminToken } from "../../api/authToken";

const GREEN = "#1B800F";
const HEADER = "#21D721";

function usd(n: number | string | null | undefined): string {
  if (n == null) return "—";
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(v)) return "—";
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ngn(n: number | string | null | undefined): string {
  if (n == null) return "—";
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(v)) return "—";
  return `₦${v.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const PagocardsWallet: React.FC = () => {
  const hasToken = Boolean(getAdminToken());
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [ngnSpent, setNgnSpent] = useState("710000");
  const [usdCredited, setUsdCredited] = useState("499");
  const [usdGross, setUsdGross] = useState("508");
  const [notes, setNotes] = useState("");
  const [lastBackfill, setLastBackfill] = useState<{
    processed: number;
    db_backup_path?: string | null;
  } | null>(null);

  const summaryQ = useQuery({
    queryKey: ["admin", "pagocards-wallet", "summary"],
    queryFn: fetchPagocardsWalletSummary,
    enabled: hasToken,
  });

  const listQ = useQuery({
    queryKey: ["admin", "pagocards-wallet", "recharges", page],
    queryFn: () => fetchPagocardsWalletRecharges({ page, per_page: 25 }),
    enabled: hasToken,
  });

  const createM = useMutation({
    mutationFn: createPagocardsWalletRecharge,
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["admin", "pagocards-wallet"] });
      setNotes("");
      if (data.historical_backfill && !data.historical_backfill.skipped) {
        setLastBackfill({
          processed: data.historical_backfill.processed,
          db_backup_path: data.historical_backfill.db_backup_path,
        });
      }
    },
  });

  const previewRate = useMemo(() => {
    const ngnVal = parseFloat(ngnSpent);
    const usdVal = parseFloat(usdCredited);
    if (!Number.isFinite(ngnVal) || !Number.isFinite(usdVal) || usdVal <= 0) {
      return null;
    }
    return ngnVal / usdVal;
  }, [ngnSpent, usdCredited]);

  const summary = summaryQ.data;
  const rows = listQ.data?.data ?? [];
  const lastPage = listQ.data?.last_page ?? 1;
  const visaRates = summary?.visa_fund_rates;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ngnVal = parseFloat(ngnSpent);
    const usdVal = parseFloat(usdCredited);
    const grossVal = usdGross.trim() ? parseFloat(usdGross) : undefined;
    if (!Number.isFinite(ngnVal) || !Number.isFinite(usdVal)) return;

    createM.mutate({
      ngn_spent: ngnVal,
      usd_credited: usdVal,
      usd_gross: grossVal,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagocards wallet</h1>
          <p className="text-sm text-gray-600">
            Log USDT→Pagocards top-ups to track the true USD cost rate used for card-load profit.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void summaryQ.refetch();
            void listQ.refetch();
          }}
          disabled={summaryQ.isFetching || listQ.isFetching}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-700"
        >
          <RefreshCw
            className={`h-4 w-4 ${summaryQ.isFetching || listQ.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Wallet className="h-4 w-4" /> Visa wallet balance
          </div>
          <p className="mt-2 text-xl font-bold">
            {usd(summary?.pagocards_wallet?.visa_wallet_balance)}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Current true rate</p>
          <p className="mt-2 text-xl font-bold">
            {summary?.current_true_rate_display ?? "—"}
          </p>
          <p className="text-sm text-gray-600">
            Last recharge: {formatDate(summary?.last_recharge?.recharged_at)}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Customer load fee (Rates)</p>
          <p className="mt-2 text-xl font-bold">{usd(visaRates?.customer_fee_usd)}</p>
          <p className="text-sm text-gray-600">
            Rate: {visaRates?.customer_rate_ngn_per_usd != null
              ? `₦${visaRates.customer_rate_ngn_per_usd.toLocaleString()}/USD`
              : "—"}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Pagocards provider cost</p>
          <p className="mt-2 text-xl font-bold">
            {usd(visaRates?.provider_cost_usd)} + {visaRates?.provider_pct ?? "—"}%
          </p>
          {visaRates?.margin_hint ? (
            <p className="text-sm text-gray-600">{visaRates.margin_hint}</p>
          ) : null}
        </div>
      </div>

      {visaRates ? (
        <p className="text-sm text-gray-600">
          Customer-facing Visa card load pricing is managed on{" "}
          <Link to={visaRates.rates_page_path} className="font-medium text-green-800 underline">
            Visa card rates
          </Link>
          .
        </p>
      ) : null}

      {summary?.awaiting_first_recharge_for_history ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">First recharge applies to history</p>
          <p className="mt-1">
            Logging your first recharge will automatically backfill profit on historical Naira card loads.
            Profit is written to a separate field (<code>profit_snapshot_backfill</code>) — existing transaction
            data is never overwritten. A full database backup is taken first.
          </p>
        </div>
      ) : null}

      {lastBackfill ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <p className="font-semibold">Historical backfill complete</p>
          <p className="mt-1">
            Updated {lastBackfill.processed} card load(s) with profit snapshots.
            {lastBackfill.db_backup_path ? ` Backup: ${lastBackfill.db_backup_path}` : null}
          </p>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border bg-white p-5 shadow-sm"
      >
        <h2 className="text-base font-semibold text-gray-900">Log wallet recharge</h2>
        <p className="mt-1 text-sm text-gray-600">
          Enter Naira spent and USD credited after Bybit and Pagocards fees.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="text-gray-600">NGN spent</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={ngnSpent}
              onChange={(e) => setNgnSpent(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">USD credited (after fees)</span>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={usdCredited}
              onChange={(e) => setUsdCredited(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">USD gross (optional)</span>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={usdGross}
              onChange={(e) => setUsdGross(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Notes (optional)</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="Bybit ref, etc."
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="text-sm text-gray-700">
            True rate preview:{" "}
            <span className="font-semibold">
              {previewRate != null ? `₦${previewRate.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/USD` : "—"}
            </span>
          </p>
          <button
            type="submit"
            disabled={createM.isPending}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: GREEN }}
          >
            {createM.isPending ? "Saving…" : "Log recharge"}
          </button>
          {createM.isError ? (
            <p className="text-sm text-red-600">Failed to save recharge.</p>
          ) : null}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead style={{ backgroundColor: HEADER }} className="text-left text-white">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">NGN spent</th>
              <th className="px-4 py-3 font-semibold">USD credited</th>
              <th className="px-4 py-3 font-semibold">True rate</th>
              <th className="px-4 py-3 font-semibold">Logged by</th>
              <th className="px-4 py-3 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No recharges logged yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">{formatDate(row.recharged_at)}</td>
                  <td className="px-4 py-3">{ngn(row.ngn_spent)}</td>
                  <td className="px-4 py-3">{usd(row.usd_credited)}</td>
                  <td className="px-4 py-3">{row.true_rate_display}</td>
                  <td className="px-4 py-3">{row.creator?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{row.notes ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {lastPage > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default PagocardsWallet;
