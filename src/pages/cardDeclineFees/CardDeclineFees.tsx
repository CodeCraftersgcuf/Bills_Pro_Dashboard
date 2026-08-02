import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, RefreshCw, Wallet } from "lucide-react";
import {
  fetchCardDeclineFeeSummary,
  fetchCardDeclineFees,
  reconcileCardDeclineFees,
  waiveCardDeclineFee,
  type CardDeclineFeeCharge,
} from "../../api/adminCardDeclineFees";
import { getAdminToken } from "../../api/authToken";

const GREEN = "#1B800F";
const HEADER = "#21D721";

function ngn(n: number | string): string {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(v)) return "—";
  return `₦${v.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function usd(n: number | string): string {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(v)) return "—";
  return `$${v.toFixed(2)}`;
}

const CardDeclineFees: React.FC = () => {
  const hasToken = Boolean(getAdminToken());
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [fundingFilter, setFundingFilter] = useState("merchant");

  const summaryQ = useQuery({
    queryKey: ["admin", "card-decline-fees", "summary"],
    queryFn: fetchCardDeclineFeeSummary,
    enabled: hasToken,
  });

  const listQ = useQuery({
    queryKey: ["admin", "card-decline-fees", page, fundingFilter],
    queryFn: () =>
      fetchCardDeclineFees({
        page,
        per_page: 25,
        funding_source: fundingFilter === "all" ? undefined : fundingFilter,
      }),
    enabled: hasToken,
  });

  const reconcileM = useMutation({
    mutationFn: reconcileCardDeclineFees,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "card-decline-fees"] });
    },
  });

  const waiveM = useMutation({
    mutationFn: waiveCardDeclineFee,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "card-decline-fees"] });
    },
  });

  const summary = summaryQ.data;
  const rows = listQ.data?.data ?? [];
  const lastPage = listQ.data?.last_page ?? 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Decline fees (merchant-paid)</h1>
          <p className="text-sm text-gray-600">
            BillsPro visa wallet subsidies recovered from users in Naira at the admin decline-fee rate.
          </p>
        </div>
        <button
          type="button"
          onClick={() => reconcileM.mutate()}
          disabled={reconcileM.isPending}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: GREEN }}
        >
          <RefreshCw className={`h-4 w-4 ${reconcileM.isPending ? "animate-spin" : ""}`} />
          Reconcile now
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Wallet className="h-4 w-4" /> Pagocards visa wallet
          </div>
          <p className="mt-2 text-xl font-bold">
            {summary?.pagocards_wallet?.visa_wallet_balance != null
              ? usd(summary.pagocards_wallet.visa_wallet_balance)
              : "—"}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Merchant-paid charges</p>
          <p className="mt-2 text-xl font-bold">{summary?.merchant_paid_count ?? "—"}</p>
          <p className="text-sm text-gray-600">{ngn(summary?.merchant_paid_total_ngn ?? 0)} billed</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Outstanding debt</p>
          <p className="mt-2 text-xl font-bold">{summary?.outstanding_count ?? "—"}</p>
          <p className="text-sm text-gray-600">{ngn(summary?.outstanding_total_ngn ?? 0)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Users with negative Naira</p>
          <p className="mt-2 text-xl font-bold">{summary?.users_with_negative_naira ?? "—"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "merchant", label: "Merchant-paid" },
          { id: "card", label: "User card-paid (audit)" },
          { id: "all", label: "All" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setFundingFilter(f.id);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              fundingFilter === f.id ? "text-white" : "bg-gray-100 text-gray-700"
            }`}
            style={fundingFilter === f.id ? { backgroundColor: GREEN } : undefined}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead style={{ backgroundColor: HEADER }} className="text-left text-white">
            <tr>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Card</th>
              <th className="px-4 py-3 font-semibold">Provider cost</th>
              <th className="px-4 py-3 font-semibold">Billed (admin rate)</th>
              <th className="px-4 py-3 font-semibold">NGN charge</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Subsidy #</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row: CardDeclineFeeCharge, i: number) => (
              <tr key={row.id} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="px-4 py-3">
                  {row.user ? (
                    <Link
                      to={`/user/management/profile/${row.user_id}`}
                      className="font-medium text-[#1B800F] underline"
                    >
                      {row.user.name || row.user.email}
                    </Link>
                  ) : (
                    row.user_id
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    {row.virtual_card?.card_name ?? row.provider_card_id ?? "—"}
                    {row.virtual_card?.is_frozen ? (
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-700">frozen</span>
                    ) : null}
                  </span>
                </td>
                <td className="px-4 py-3">{usd(row.provider_cost_usd)}</td>
                <td className="px-4 py-3 font-medium">{usd(row.billable_usd)}</td>
                <td className="px-4 py-3">{ngn(row.amount_ngn)}</td>
                <td className="px-4 py-3 capitalize">{row.recovery_status}</td>
                <td className="px-4 py-3">{row.card_subsidy_sequence ?? "—"}</td>
                <td className="px-4 py-3">
                  {row.funding_source === "merchant" && row.recovery_status === "charged" ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-700 underline"
                      onClick={() => waiveM.mutate(row.id)}
                      disabled={waiveM.isPending}
                    >
                      Waive
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No decline fee charges found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {lastPage > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
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
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default CardDeclineFees;
