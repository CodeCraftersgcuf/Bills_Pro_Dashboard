import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Search,
  TriangleAlert,
  Wallet,
  X,
} from "lucide-react";
import {
  fetchReconciliationOverview,
  fetchReconciliationUserLedger,
  fetchReconciliationUserStory,
  fetchReconciliationUsers,
  type ReconciliationUserLedger,
  type ReconciliationUserRow,
  type ReconciliationUserStory,
} from "../../api/adminReconciliation";
import { getAdminToken } from "../../api/authToken";
import {
  defaultCustomRangeLocal,
  presetToFromTo,
  type DateRangePreset,
} from "../../utils/dateRange";
import { downloadCsv } from "../../utils/csvDownload";

ChartJS.register(ArcElement, Tooltip, Legend);

const GREEN = "#1B800F";
const BRIGHT_GREEN = "#21D721";
const TABLE_HEADER_GREEN = "#21D721";
const TABLE_SEARCH_BG = "#189016";
const TABLE_COL_HEADER_BG = "#EBEBEB";
const ACTION_GREEN = "#34D334";

/** One colour per outflow bucket so the bars and the doughnut tell the same story. */
const OUTFLOW_COLORS: Record<string, string> = {
  withdrawn: "#1B800F",
  bill_payments: "#21D721",
  card_funding: "#0E5C08",
  card_creation_fees: "#E08707",
};

const DATE_PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "all", label: "All time" },
  { id: "custom", label: "Custom" },
];

function exportReconUsersCsv(rows: ReconciliationUserRow[]): void {
  if (rows.length === 0) return;
  downloadCsv(
    "reconciliation-users",
    [
      "user_id",
      "display_name",
      "email",
      "deposited",
      "card_refunds",
      "withdrawn",
      "bill_payments",
      "card_creation_fees",
      "card_funding",
      "card_spent_usd",
      "naira_balance",
      "card_balance_usd",
      "review_status",
      "residual",
    ],
    rows.map((r) => [
      r.user_id,
      r.display_name,
      r.email,
      r.deposited,
      r.card_refunds ?? 0,
      r.withdrawn,
      r.bill_payments,
      r.card_creation_fees,
      r.card_funding,
      r.card_spent_usd,
      r.naira_balance,
      r.card_balance_usd,
      r.review_status_label,
      r.residual,
    ])
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";

  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function statusPill(status: string): string {
  const s = status.toLowerCase();
  if (s === "completed") return "bg-emerald-100 text-emerald-800";
  if (s === "pending") return "bg-amber-100 text-amber-800";
  if (s === "failed" || s === "cancelled") return "bg-rose-100 text-rose-800";
  return "bg-gray-100 text-gray-700";
}

function LedgerSection({ ledger, loading }: { ledger: ReconciliationUserLedger | null; loading: boolean }) {
  const [tab, setTab] = useState<"naira" | "card">("naira");

  if (loading) {
    return <p className="text-sm text-gray-500">Loading complete ledger…</p>;
  }
  if (!ledger) return null;

  const { totals } = ledger;
  const driftClean = Math.abs(totals.drift) < 1;

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800">Complete ledger</h3>
        <div className="flex gap-1 rounded-full bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setTab("naira")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              tab === "naira" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Naira wallet ({totals.naira_rows_count})
          </button>
          <button
            type="button"
            onClick={() => setTab("card")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              tab === "card" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Card USD ({totals.card_rows_count})
          </button>
        </div>
      </div>

      <div
        className={`mb-3 rounded-xl px-4 py-2.5 text-xs ${
          driftClean ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
        }`}
      >
        Ledger adds up to {totals.ledger_balance_display} · wallet holds{" "}
        {totals.wallet_balance_display}
        {driftClean ? " — matches." : ` — unexplained ${totals.drift_display}.`}
      </div>

      {tab === "naira" ? (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">What happened</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-right">Fee</th>
                <th className="px-3 py-2 text-right">Balance after</th>
              </tr>
            </thead>
            <tbody>
              {ledger.naira_rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    No Naira activity in this period.
                  </td>
                </tr>
              ) : (
                ledger.naira_rows.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                      {r.at ? r.at.slice(0, 16).replace("T", " ") : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{r.label}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusPill(r.status)}`}>
                          {r.status}
                        </span>
                      </div>
                      {r.description ? (
                        <p className="mt-0.5 text-[11px] text-gray-500">{r.description}</p>
                      ) : null}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-2 text-right font-semibold ${
                        r.direction === "in" ? "text-emerald-700" : "text-gray-900"
                      }`}
                    >
                      {r.signed_display}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-gray-500">
                      {r.fee > 0 ? r.fee_display : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-gray-700">
                      {r.balance_after_display ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Card activity</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-right">Fee</th>
              </tr>
            </thead>
            <tbody>
              {ledger.card_rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                    No card activity in this period.
                  </td>
                </tr>
              ) : (
                ledger.card_rows.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                      {r.at ? r.at.slice(0, 16).replace("T", " ") : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">{r.label}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusPill(r.status)}`}>
                          {r.status}
                        </span>
                        {r.is_decline_fee ? (
                          <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                            decline fee
                          </span>
                        ) : null}
                      </div>
                      {r.description ? (
                        <p className="mt-0.5 text-[11px] text-gray-500">{r.description}</p>
                      ) : null}
                      <p className="text-[10px] text-gray-400">{r.wallet_label}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-gray-900">
                      {r.total_display}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-gray-500">
                      {r.fee > 0 ? r.fee_display : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MoneyStoryPanel({
  story,
  ledger,
  ledgerLoading,
  onClose,
  loading,
}: {
  story: ReconciliationUserStory | null;
  ledger: ReconciliationUserLedger | null;
  ledgerLoading: boolean;
  onClose: () => void;
  loading: boolean;
}) {
  if (!story && !loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Money story</p>
            <h2 className="text-lg font-semibold text-gray-900">
              {story?.user.display_name ?? "Loading…"}
            </h2>
            {story?.period.label ? (
              <p className="text-xs text-gray-500">{story.period.label}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading || !story ? (
            <p className="text-sm text-gray-500">Loading money story…</p>
          ) : (
            <div className="space-y-5">
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  story.check.status === "needs_review"
                    ? "bg-amber-50 text-amber-900"
                    : "bg-emerald-50 text-emerald-900"
                }`}
              >
                <p className="font-semibold">Does this add up? — {story.check.status_label}</p>
                <p className="mt-1 text-xs opacity-80">{story.check.explanation}</p>
                <p className="mt-2 font-medium">Difference: {story.check.residual_display}</p>
                <p className="mt-1 text-xs opacity-80">
                  {story.check.net_flow_label}: {story.check.net_flow_display}
                </p>
              </div>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-gray-800">Money in</h3>
                <div className="space-y-2">
                  <div className="rounded-xl bg-[#F3F4F6] px-4 py-3">
                    <p className="text-xs text-gray-500">Deposited</p>
                    <p className="text-xl font-bold text-gray-900">{story.money_in.deposited_display}</p>
                    <p className="text-xs text-gray-500">{story.money_in.deposited_count} deposits</p>
                  </div>
                  {(story.money_in.card_refunds ?? 0) > 0 ? (
                    <div className="rounded-xl bg-[#F3F4F6] px-4 py-3">
                      <p className="text-xs text-gray-500">Card refunds</p>
                      <p className="text-lg font-bold text-gray-900">
                        {story.money_in.card_refunds_display ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {story.money_in.card_refunds_count ?? 0} refunds
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-gray-800">Money out</h3>
                <ul className="space-y-2">
                  {[
                    ["Withdrawals", story.money_out.withdrawn_display],
                    ["Bill payments", story.money_out.bill_payments_display],
                    ["Loaded onto cards", story.money_out.card_funding_display],
                    ["Card creation fees", story.money_out.card_creation_fees_display],
                  ].map(([label, value]) => (
                    <li
                      key={label}
                      className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-2.5"
                    >
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className="text-sm font-semibold text-gray-900">{value}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-gray-800">Still held now</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[#E8F5E9] px-3 py-3">
                    <p className="text-xs text-gray-500">Naira wallet</p>
                    <p className="font-bold text-gray-900">{story.still_held.naira_balance_display}</p>
                  </div>
                  <div className="rounded-xl bg-[#E8F5E9] px-3 py-3">
                    <p className="text-xs text-gray-500">Card balances</p>
                    <p className="font-bold text-gray-900">{story.still_held.card_balance_usd_display}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Card spend in period: {story.cards.spent_usd_display} ({story.cards.spent_count}{" "}
                  payments)
                </p>
              </section>

              {story.where_money_went.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-gray-800">Where did money go?</h3>
                  <div className="space-y-2">
                    {story.where_money_went.map((bar) => (
                      <div key={bar.key}>
                        <div className="mb-1 flex justify-between text-xs text-gray-600">
                          <span>{bar.label}</span>
                          <span>
                            {bar.amount_display} ({bar.pct}%)
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(0, bar.pct))}%`,
                              backgroundColor: GREEN,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {story.bill_breakdown.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-gray-800">Bill categories</h3>
                  <ul className="space-y-1.5">
                    {story.bill_breakdown.map((b) => (
                      <li key={b.category} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {b.label} ({b.count})
                        </span>
                        <span className="font-medium text-gray-900">{b.amount_display}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <LedgerSection ledger={ledger} loading={ledgerLoading} />

              <section className="rounded-xl border border-dashed border-gray-200 px-4 py-3">
                <p className="text-xs font-medium text-gray-500">Crypto (secondary)</p>
                <p className="mt-1 text-sm text-gray-700">
                  In {story.crypto.deposits_display} · Out {story.crypto.withdrawals_display} ·{" "}
                  {story.crypto.tx_count} txs
                </p>
              </section>

              <div className="flex flex-wrap gap-2 pt-2">
                <Link
                  to={story.links.transactions}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: ACTION_GREEN }}
                >
                  View ledger
                </Link>
                <Link
                  to={story.links.profile}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800"
                >
                  Open profile
                </Link>
                <Link
                  to={story.links.virtual_cards}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800"
                >
                  Virtual cards
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Reconciliation: React.FC = () => {
  const hasToken = Boolean(getAdminToken());
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUserId = searchParams.get("user_id");

  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [customRange, setCustomRange] = useState(defaultCustomRangeLocal);
  const [search, setSearch] = useState("");
  const searchDebounced = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    initialUserId && /^\d+$/.test(initialUserId) ? Number(initialUserId) : null
  );

  const { from, to } = presetToFromTo(datePreset, customRange);

  useEffect(() => {
    setPage(1);
  }, [datePreset, searchDebounced, customRange.from, customRange.to]);

  const overviewQuery = useQuery({
    queryKey: ["admin", "recon-overview", from, to],
    queryFn: () => fetchReconciliationOverview({ from, to }),
    enabled: hasToken,
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "recon-users", from, to, searchDebounced, page],
    queryFn: () =>
      fetchReconciliationUsers({
        from,
        to,
        search: searchDebounced.trim() || undefined,
        page,
        per_page: 25,
      }),
    enabled: hasToken,
  });

  const storyQuery = useQuery({
    queryKey: ["admin", "recon-user", selectedUserId, from, to],
    queryFn: () => fetchReconciliationUserStory(selectedUserId!, { from, to }),
    enabled: hasToken && selectedUserId != null,
  });

  const ledgerQuery = useQuery({
    queryKey: ["admin", "recon-user-ledger", selectedUserId, from, to],
    queryFn: () => fetchReconciliationUserLedger(selectedUserId!, { from, to }),
    enabled: hasToken && selectedUserId != null,
  });

  const overview = overviewQuery.data;
  const tableRows = usersQuery.data?.data ?? [];
  const lastPage = usersQuery.data?.last_page ?? 1;

  const outflowChart = useMemo(() => {
    const bars = (overview?.where_money_went ?? []).filter((b) => b.amount > 0);
    if (bars.length === 0) return null;

    return {
      labels: bars.map((b) => b.label),
      datasets: [
        {
          data: bars.map((b) => b.amount),
          backgroundColor: bars.map((b) => OUTFLOW_COLORS[b.key] ?? "#9CA3AF"),
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    };
  }, [overview]);

  const openUser = (userId: number) => {
    setSelectedUserId(userId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("user_id", String(userId));
      return next;
    });
  };

  const closeUser = () => {
    setSelectedUserId(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("user_id");
      return next;
    });
  };

  const pillSelect =
    "relative cursor-pointer appearance-none rounded-full border border-gray-200 bg-[#E8E8E8] py-2.5 pl-4 pr-9 text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B800F]/25";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reconciliation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Simple money story: deposited, spent, withdrawn, and what&apos;s left — without reading
            the raw ledger.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/daily-activity"
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <CalendarDays className="h-4 w-4" style={{ color: GREEN }} />
            Today&apos;s activity
          </Link>
          <select
            className={pillSelect}
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          {datePreset === "custom" ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customRange.from}
                onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value }))}
                className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={customRange.to}
                onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value }))}
                className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm"
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => exportReconUsersCsv(tableRows)}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: GREEN }}
          >
            Export page CSV
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-3xl p-5 shadow-md md:p-6"
        style={{ background: `linear-gradient(135deg, ${GREEN} 0%, ${BRIGHT_GREEN} 100%)` }}
      >
        {overviewQuery.isLoading || !overview ? (
          <p className="py-10 text-center text-white/90">Loading the money story…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  {overview.period.label}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">Follow the money</h2>
                <p className="mt-1 max-w-md text-xs text-white/80">
                  Deposits and refunds come in, withdrawals, bills and cards take money out, and
                  whatever is left should still be sitting in the wallets.
                </p>
              </div>
              <div
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                  overview.check.status === "needs_review" ? "bg-amber-400/95" : "bg-white/20"
                }`}
              >
                {overview.check.status === "needs_review" ? (
                  <TriangleAlert className="h-7 w-7 text-amber-950" />
                ) : (
                  <BadgeCheck className="h-7 w-7 text-white" />
                )}
                <div>
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-wide ${
                      overview.check.status === "needs_review" ? "text-amber-950/70" : "text-white/75"
                    }`}
                  >
                    Does it add up?
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      overview.check.status === "needs_review" ? "text-amber-950" : "text-white"
                    }`}
                  >
                    {overview.check.status_label}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/15 px-4 py-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white/80">
                  <ArrowDownToLine className="h-4 w-4" />
                  <p className="text-xs font-semibold">Money in</p>
                </div>
                <p className="mt-1 text-3xl font-bold text-white">
                  {overview.money_in.deposited_display}
                </p>
                <p className="text-[11px] text-white/75">
                  {overview.money_in.deposited_count} deposits
                  {(overview.money_in.card_refunds ?? 0) > 0
                    ? ` · ${overview.money_in.card_refunds_display} refunded`
                    : ""}
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white/80">
                  <ArrowUpFromLine className="h-4 w-4" />
                  <p className="text-xs font-semibold">Money out</p>
                </div>
                <p className="mt-1 text-3xl font-bold text-white">
                  {overview.money_out.total_display}
                </p>
                <p className="text-[11px] text-white/75">Withdrawals, bills and cards</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3.5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white/80">
                  <Wallet className="h-4 w-4" />
                  <p className="text-xs font-semibold">Still held</p>
                </div>
                <p className="mt-1 text-3xl font-bold text-white">
                  {overview.still_held.naira_balance_display}
                </p>
                <p className="text-[11px] text-white/75">
                  Cards hold {overview.still_held.card_balance_usd_display}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Fees collected", overview.fees_collected.amount_display],
                ["Card spend (USD)", overview.cards.spent_usd_display],
                [overview.check.net_flow_label, overview.check.net_flow_display],
                ["Difference", overview.check.residual_display],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white/10 px-4 py-2.5">
                  <p className="text-[11px] font-medium text-white/70">{label}</p>
                  <p className="text-base font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {overview ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Where did money go?</h2>
                <p className="text-xs text-gray-500">
                  Every naira that left a wallet, {overview.money_out.total_display} in total
                </p>
              </div>
              <p className="text-xs text-gray-500">{overview.period.label}</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-5">
              <div className="space-y-3.5 sm:col-span-3">
                {overview.where_money_went.map((bar) => (
                  <div key={bar.key}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 text-gray-700">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: OUTFLOW_COLORS[bar.key] ?? "#9CA3AF" }}
                        />
                        {bar.label}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {bar.amount_display}
                        <span className="ml-1.5 text-xs font-normal text-gray-400">{bar.pct}%</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(0, bar.pct))}%`,
                          backgroundColor: OUTFLOW_COLORS[bar.key] ?? "#9CA3AF",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center sm:col-span-2">
                {outflowChart ? (
                  <div className="h-44 w-44">
                    <Doughnut
                      data={outflowChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: "62%",
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (ctx) =>
                                `${ctx.label}: ₦${Number(ctx.parsed).toLocaleString()}`,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-400">No outflows yet</p>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              {[
                ["Withdrawals", overview.money_out.withdrawn_display],
                ["Bills", overview.money_out.bill_payments_display],
                ["Card creation", overview.money_out.card_creation_fees_display],
                ["Card loads", overview.money_out.card_funding_display],
                ["Card spend (USD)", overview.cards.spent_usd_display],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div
              className={`rounded-2xl px-4 py-4 ${
                overview.check.status === "needs_review" ? "bg-amber-50" : "bg-emerald-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    overview.check.status === "needs_review" ? "bg-amber-200" : "bg-emerald-200"
                  }`}
                >
                  {overview.check.status === "needs_review" ? (
                    <TriangleAlert className="h-5 w-5 text-amber-900" />
                  ) : (
                    <BadgeCheck className="h-5 w-5 text-emerald-900" />
                  )}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Does this add up?
                  </p>
                  <p className="text-xl font-bold text-gray-900">{overview.check.status_label}</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-600">
                {overview.check.explanation}
              </p>
            </div>

            <dl className="mt-4 space-y-2.5 text-sm">
              {[
                ["Difference", overview.check.residual_display],
                [overview.check.net_flow_label, overview.check.net_flow_display],
                ["Fees collected", overview.fees_collected.amount_display],
                ["Naira held now", overview.still_held.naira_balance_display],
                ["Card balances", overview.still_held.card_balance_usd_display],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="text-right font-semibold text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
              {overview.crypto.helper}
            </p>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div
          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ backgroundColor: TABLE_HEADER_GREEN }}
        >
          <div className="flex items-center gap-2 text-white">
            <CreditCard className="h-5 w-5" />
            <span className="font-semibold">Users money story</span>
          </div>
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ backgroundColor: TABLE_SEARCH_BG }}
          >
            <Search className="h-4 w-4 text-white/90" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone"
              className="w-48 bg-transparent text-sm text-white placeholder:text-white/70 focus:outline-none sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead style={{ backgroundColor: TABLE_COL_HEADER_BG }}>
              <tr className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Deposited</th>
                <th className="px-4 py-3">Withdrawn</th>
                <th className="px-4 py-3">Bills</th>
                <th className="px-4 py-3">Card create</th>
                <th className="px-4 py-3">Card loads</th>
                <th className="px-4 py-3">Card spend</th>
                <th className="px-4 py-3">Naira bal.</th>
                <th className="px-4 py-3">Card bal.</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.isLoading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : tableRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    No users with activity in this range.
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => (
                  <tr
                    key={row.user_id}
                    className="border-t border-gray-100 transition hover:bg-[#F5FBF4]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: GREEN }}
                        >
                          {initials(row.display_name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{row.display_name}</p>
                          <p className="truncate text-xs text-gray-500">{row.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{row.deposited_display}</td>
                    <td className="px-4 py-3">{row.withdrawn_display}</td>
                    <td className="px-4 py-3">{row.bill_payments_display}</td>
                    <td className="px-4 py-3">{row.card_creation_fees_display}</td>
                    <td className="px-4 py-3">{row.card_funding_display}</td>
                    <td className="px-4 py-3">{row.card_spent_usd_display}</td>
                    <td className="px-4 py-3">{row.naira_balance_display}</td>
                    <td className="px-4 py-3">{row.card_balance_usd_display}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.review_status === "needs_review"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {row.review_status_label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openUser(row.user_id)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: ACTION_GREEN }}
                      >
                        View story
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {lastPage > 1 ? (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {lastPage}
            </span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      {selectedUserId != null ? (
        <MoneyStoryPanel
          story={storyQuery.data ?? null}
          ledger={ledgerQuery.data ?? null}
          ledgerLoading={ledgerQuery.isLoading}
          loading={storyQuery.isLoading}
          onClose={closeUser}
        />
      ) : null}
    </div>
  );
};

export default Reconciliation;
