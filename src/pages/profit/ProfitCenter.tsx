import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Coins,
  LineChart,
  Percent,
  PiggyBank,
  Search,
  Settings2,
  X,
} from "lucide-react";
import StatCard from "../../components/StatCard";
import {
  fetchProfitSettings,
  fetchProfitTransactions,
  updateProfitSetting,
  type PercentageBasis,
  type ProfitTransactionRow,
  type ServiceProfitSettingRow,
} from "../../api/adminProfit";
import { fetchAdminTransaction, type AdminTransactionRow } from "../../api/adminTransactions";
import { getAdminToken } from "../../api/authToken";
import {
  presetToFromTo,
  defaultCustomRangeLocal,
  type DateRangePreset,
} from "../../utils/dateRange";
import { humanizeApiLabelOrDash, humanizeTransactionSubtype } from "../../utils/humanizeApiLabel";
import { downloadCsv } from "../../utils/csvDownload";

const HEADER_GREEN = "#21D721";
const HEADER_SEARCH = "#189016";
const ROW_A = "#F9F9F9";
const ROW_B = "#E6E6E6";
const COL_HEADER = "#EBEBEB";
const ACTION_GREEN = "#34D334";

function fmtNum(s: string | undefined, currency?: string | null): string {
  if (s === undefined || s === null || s === "") return "—";
  const n = parseFloat(s);
  if (Number.isNaN(n)) return "—";
  const t = n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 8 });
  return currency ? `${currency} ${t}` : t;
}

function ProfitSettingsPanel({ disabled }: { disabled: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "profit-settings"],
    queryFn: fetchProfitSettings,
    enabled: !disabled,
  });

  const [drafts, setDrafts] = useState<Record<string, Partial<ServiceProfitSettingRow>>>({});

  useEffect(() => {
    if (!q.data) return;
    const next: Record<string, Partial<ServiceProfitSettingRow>> = {};
    for (const r of q.data) {
      next[r.service_key] = {
        fixed_fee: r.fixed_fee,
        percentage: r.percentage,
        percentage_basis: r.percentage_basis,
        is_active: r.is_active,
      };
    }
    setDrafts(next);
  }, [q.data]);

  const mut = useMutation({
    mutationFn: ({ key, body }: { key: string; body: Parameters<typeof updateProfitSetting>[1] }) =>
      updateProfitSetting(key, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "profit-settings"] });
      await qc.invalidateQueries({ queryKey: ["admin", "profit-transactions"] });
    },
  });

  const rows = q.data ?? [];

  const saveRow = (serviceKey: string) => {
    const d = drafts[serviceKey];
    if (!d) return;
    const fixed = parseFloat(String(d.fixed_fee ?? "0"));
    const pct = parseFloat(String(d.percentage ?? "0"));
    if (Number.isNaN(fixed) || fixed < 0) return;
    if (Number.isNaN(pct) || pct < 0 || pct > 100) return;
    mut.mutate({
      key: serviceKey,
      body: {
        fixed_fee: fixed,
        percentage: pct,
        percentage_basis: (d.percentage_basis ?? "total_amount") as PercentageBasis,
        is_active: Boolean(d.is_active),
      },
    });
  };

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-md">
      <div
        className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
        style={{ backgroundColor: HEADER_GREEN }}
      >
        <div className="flex items-center gap-2 text-white">
          <Settings2 className="h-6 w-6 shrink-0" />
          <div>
            <h2 className="text-lg font-semibold md:text-xl">Profit rules by service</h2>
            <p className="text-xs text-white/85">
              Fixed fee plus percentage of the chosen basis. Totals apply to matching completed transactions below.
            </p>
          </div>
        </div>
      </div>

      {q.isLoading ? (
        <p className="px-5 py-8 text-center text-sm text-gray-500">Loading settings…</p>
      ) : q.isError ? (
        <p className="px-5 py-8 text-center text-sm text-red-600">Could not load profit settings.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: COL_HEADER }}>
                <th className="px-4 py-3 font-semibold text-gray-700">Service</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Fixed fee</th>
                <th className="px-4 py-3 font-semibold text-gray-700">%</th>
                <th className="px-4 py-3 font-semibold text-gray-700">% applies to</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Active</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const d = drafts[r.service_key] ?? {};
                return (
                  <tr
                    key={r.service_key}
                    style={{ backgroundColor: i % 2 === 0 ? ROW_A : ROW_B }}
                    className="border-t border-gray-100"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.label}</p>
                      <p className="text-xs text-gray-500">{r.service_key}</p>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="any"
                        min={0}
                        className="w-28 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                        value={d.fixed_fee ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [r.service_key]: { ...prev[r.service_key], fixed_fee: e.target.value },
                          }))
                        }
                        disabled={mut.isPending}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="any"
                        min={0}
                        max={100}
                        className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                        value={d.percentage ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [r.service_key]: { ...prev[r.service_key], percentage: e.target.value },
                          }))
                        }
                        disabled={mut.isPending}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                        value={d.percentage_basis ?? "total_amount"}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [r.service_key]: {
                              ...prev[r.service_key],
                              percentage_basis: e.target.value as PercentageBasis,
                            },
                          }))
                        }
                        disabled={mut.isPending}
                      >
                        <option value="total_amount">Total charged</option>
                        <option value="amount">Principal amount</option>
                        <option value="fee">Fee only</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="accent-[#21D721]"
                        checked={Boolean(d.is_active)}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [r.service_key]: { ...prev[r.service_key], is_active: e.target.checked },
                          }))
                        }
                        disabled={mut.isPending}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => saveRow(r.service_key)}
                        disabled={mut.isPending}
                        className="rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
                        style={{ backgroundColor: ACTION_GREEN }}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {mut.isError ? (
        <p className="border-t border-gray-100 px-5 py-2 text-xs text-red-600">Could not save setting.</p>
      ) : null}
    </section>
  );
}

function TransactionDetailModal({
  transactionId,
  onClose,
}: {
  transactionId: string;
  onClose: () => void;
}) {
  const q = useQuery({
    queryKey: ["admin", "transaction", transactionId],
    queryFn: () => fetchAdminTransaction(transactionId),
    enabled: Boolean(transactionId),
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const tx = q.data as AdminTransactionRow | undefined;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[151] max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Transaction detail</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {q.isLoading ? <p className="text-sm text-gray-500">Loading…</p> : null}
        {q.isError ? <p className="text-sm text-red-600">Could not load transaction.</p> : null}
        {tx ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
              <dt className="text-gray-500">Transaction ID</dt>
              <dd className="max-w-[60%] break-all text-right font-medium text-gray-900">{tx.transaction_id}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
              <dt className="text-gray-500">Type</dt>
              <dd className="text-right font-medium text-gray-900">{humanizeApiLabelOrDash(tx.type)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
              <dt className="text-gray-500">Status</dt>
              <dd className="text-right font-medium text-gray-900">{humanizeApiLabelOrDash(tx.status)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
              <dt className="text-gray-500">Amount</dt>
              <dd className="text-right font-medium text-gray-900">{fmtNum(String(tx.amount ?? ""), tx.currency)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
              <dt className="text-gray-500">Fee</dt>
              <dd className="text-right font-medium text-gray-900">{fmtNum(String(tx.fee ?? ""), tx.currency)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
              <dt className="text-gray-500">Total</dt>
              <dd className="text-right font-medium text-gray-900">{fmtNum(String(tx.total_amount ?? ""), tx.currency)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
              <dt className="text-gray-500">Description</dt>
              <dd className="max-w-[60%] text-right text-gray-900">{tx.description || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-gray-500">Created</dt>
              <dd className="text-right text-gray-900">{tx.created_at ? new Date(tx.created_at).toLocaleString() : "—"}</dd>
            </div>
          </dl>
        ) : null}
      </div>
    </div>
  );
}

const ProfitCenter: React.FC = () => {
  const hasToken = Boolean(getAdminToken());
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const searchDebounced = useDeferredValue(search);
  const [typeFilter, setTypeFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("completed");
  /** Default “all dates” so existing/historical transactions appear; narrow with the date filter if needed. */
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    if (datePreset !== "custom") return;
    if (!customFrom || !customTo) {
      const d = defaultCustomRangeLocal();
      setCustomFrom(d.from);
      setCustomTo(d.to);
    }
  }, [datePreset, customFrom, customTo]);

  const { from, to } = presetToFromTo(
    datePreset,
    datePreset === "custom" ? { from: customFrom, to: customTo } : undefined
  );

  const settingsQ = useQuery({
    queryKey: ["admin", "profit-settings"],
    queryFn: fetchProfitSettings,
    enabled: hasToken,
  });

  const listQ = useQuery({
    queryKey: [
      "admin",
      "profit-transactions",
      page,
      typeFilter,
      currencyFilter,
      statusFilter,
      searchDebounced,
      from,
      to,
    ],
    queryFn: () =>
      fetchProfitTransactions({
        page,
        per_page: 25,
        type: typeFilter,
        currency: currencyFilter,
        status: statusFilter,
        search: searchDebounced,
        from,
        to,
      }),
    enabled: hasToken,
  });

  const summary = listQ.data?.summary;
  const pagination = listQ.data?.pagination;
  const rows = listQ.data?.data ?? [];

  const avgProfit = useMemo(() => {
    if (!summary || summary.transaction_count <= 0) return "—";
    const t = parseFloat(summary.sum_total_profit);
    if (Number.isNaN(t)) return "—";
    return (t / summary.transaction_count).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    });
  }, [summary]);

  const typeOptions = useMemo(() => {
    const keys = (settingsQ.data ?? []).filter((s) => s.service_key !== "_default").map((s) => s.service_key);
    return ["all", ...keys];
  }, [settingsQ.data]);

  const exportCsv = () => {
    if (!rows.length) return;
    downloadCsv(
      `profit-transactions-page-${page}.csv`,
      [
        "transaction_id",
        "description",
        "type",
        "currency",
        "total_amount",
        "fixed_profit",
        "percentage_profit",
        "total_profit",
        "created_at",
      ],
      rows.map((r) => [
        r.transaction_id,
        (r.description ?? "").replace(/\r?\n/g, " "),
        r.type ?? "",
        r.currency ?? "",
        r.total_amount,
        r.profit.fixed_profit,
        r.profit.percentage_profit,
        r.profit.total_profit,
        r.created_at ?? "",
      ])
    );
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Profit center</h1>
        <p className="mt-1 text-sm text-gray-600">
          <strong className="text-gray-800">Where to set profit:</strong> use the{" "}
          <strong>Profit rules by service</strong> table below (green header). Enter fixed fee and percentage per row, then{" "}
          <strong>Save</strong>. Only <strong>admin</strong> accounts can access this page (sidebar: <strong>Profit center</strong>, URL{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">/profit</code>). App users do not set profit here.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Rules apply <strong>immediately</strong> to all transactions that match the filters below—profit is calculated from each row’s
          amounts using your current settings (no separate “sync” step). Numeric totals may mix currencies when no currency filter is applied.
        </p>
      </div>

      {!hasToken ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Log in as <strong>admin</strong> to manage profit rules and reports.
        </div>
      ) : null}

      <ProfitSettingsPanel disabled={!hasToken} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={PiggyBank}
          label="Total profit"
          value={summary ? fmtNum(summary.sum_total_profit) : "—"}
          hint="Fixed + % components (filtered)"
        />
        <StatCard
          icon={Coins}
          label="Volume"
          value={summary ? fmtNum(summary.sum_transaction_amount) : "—"}
          hint="Sum of total charged"
        />
        <StatCard
          icon={LineChart}
          label="Transactions"
          value={summary ? String(summary.transaction_count) : "—"}
          hint="Matching rows (filters)"
        />
        <StatCard icon={Percent} label="Avg profit / tx" value={avgProfit} hint="Mean total profit" />
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: HEADER_GREEN }}
        >
          <h2 className="text-lg font-semibold text-white md:text-xl">Transactions &amp; profit</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="cursor-pointer rounded-full bg-white/15 py-2 pl-3 pr-8 text-sm font-semibold text-white"
              aria-label="Transaction type"
            >
              {typeOptions.map((k) => (
                <option key={k} value={k} className="text-gray-900">
                  {k === "all" ? "All types" : humanizeApiLabelOrDash(k)}
                </option>
              ))}
            </select>
            <select
              value={currencyFilter}
              onChange={(e) => {
                setCurrencyFilter(e.target.value);
                setPage(1);
              }}
              className="cursor-pointer rounded-full bg-white/15 py-2 pl-3 pr-8 text-sm font-semibold text-white"
              aria-label="Currency"
            >
              {["all", "NGN", "USD", "USDT"].map((c) => (
                <option key={c} value={c} className="text-gray-900">
                  {c === "all" ? "All currencies" : c}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="cursor-pointer rounded-full bg-white/15 py-2 pl-3 pr-8 text-sm font-semibold text-white"
              aria-label="Status"
            >
              <option value="completed" className="text-gray-900">
                Completed
              </option>
              <option value="all" className="text-gray-900">
                All statuses
              </option>
              <option value="pending" className="text-gray-900">
                Pending
              </option>
              <option value="failed" className="text-gray-900">
                Failed
              </option>
            </select>
            <div className="relative">
              <select
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value as DateRangePreset);
                  setPage(1);
                }}
                className="cursor-pointer appearance-none rounded-full bg-white/15 py-2 pl-3 pr-9 text-sm font-semibold text-white"
                aria-label="Date range"
              >
                <option value="all" className="text-gray-900">
                  All dates
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
                <option value="12m" className="text-gray-900">
                  Last 12 months
                </option>
                <option value="custom" className="text-gray-900">
                  Custom
                </option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/90" />
            </div>
            {datePreset === "custom" ? (
              <div className="flex flex-wrap items-center gap-1 text-xs text-white/95">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => {
                    setCustomFrom(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border-0 bg-white/90 px-2 py-1 text-gray-900"
                />
                <span>to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => {
                    setCustomTo(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border-0 bg-white/90 px-2 py-1 text-gray-900"
                />
              </div>
            ) : null}
            <button
              type="button"
              onClick={exportCsv}
              disabled={!rows.length}
              className="rounded-full bg-white/20 px-4 py-2 text-xs font-bold text-white hover:bg-white/30 disabled:opacity-40"
            >
              Export page CSV
            </button>
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/90" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search reference, ID, user…"
              className="w-full rounded-full border-0 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/40"
              style={{ backgroundColor: HEADER_SEARCH }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: COL_HEADER }}>
                <th className="px-4 py-3 font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Fixed profit</th>
                <th className="px-4 py-3 font-semibold text-gray-700">% profit</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Total profit</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {hasToken && listQ.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    <p className="font-medium text-gray-700">No transactions for these filters.</p>
                    <p className="mx-auto mt-2 max-w-lg text-sm">
                      Try <strong>All dates</strong> (date dropdown), <strong>All statuses</strong>, and <strong>All currencies</strong> to
                      include older or non-completed activity. Profit is computed for every row shown—same rules apply to past and new
                      transactions.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((r: ProfitTransactionRow, i: number) => (
                  <tr
                    key={`${r.transaction_id}-${r.id}`}
                    style={{ backgroundColor: i % 2 === 0 ? ROW_A : ROW_B }}
                    className="border-t border-gray-100"
                  >
                    <td className="max-w-[280px] px-4 py-3">
                      <p className="line-clamp-2 text-gray-900">{r.description || "—"}</p>
                      <p className="text-xs text-gray-500">{r.user?.display_name ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-800">{humanizeTransactionSubtype(r)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                      {fmtNum(r.total_amount, r.currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                      {fmtNum(r.profit.fixed_profit, r.currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                      {fmtNum(r.profit.percentage_profit, r.currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-800">
                      {fmtNum(r.profit.total_profit, r.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setDetailId(r.transaction_id)}
                        className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: ACTION_GREEN }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.last_page > 1 ? (
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
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <button
              type="button"
              disabled={page >= pagination.last_page}
              onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}

        {listQ.isError ? (
          <p className="border-t border-gray-100 px-5 py-3 text-sm text-red-600">Failed to load profit data.</p>
        ) : null}
      </section>

      {detailId ? <TransactionDetailModal transactionId={detailId} onClose={() => setDetailId(null)} /> : null}
    </div>
  );
};

export default ProfitCenter;
