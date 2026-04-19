import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  ChevronDown,
  Coins,
  Eye,
  LineChart,
  Percent,
  PiggyBank,
  Search,
  Settings2,
  X,
} from "lucide-react";
import {
  fetchProfitSettings,
  fetchProfitTransactions,
  updateProfitSetting,
  type PercentageBasis,
  type PlatformRateSnapshot,
  type ProfitTransactionRow,
  type RevenueKind,
  type ServiceProfitSettingRow,
} from "../../api/adminProfit";
import { getAdminToken } from "../../api/authToken";
import {
  presetToFromTo,
  defaultCustomRangeLocal,
  type DateRangePreset,
} from "../../utils/dateRange";
import { humanizeApiLabel, humanizeApiLabelOrDash, humanizeTransactionSubtype } from "../../utils/humanizeApiLabel";
import { downloadCsv } from "../../utils/csvDownload";
import {
  fetchPlatformRates,
  type PlatformRateCategory,
  type PlatformRateRow,
} from "../../api/adminPlatformRates";

const HEADER_GREEN = "#21D721";
const ROW_A = "#F9F9F9";
const ROW_B = "#E6E6E6";
const COL_HEADER = "#EBEBEB";
const ACTION_GREEN = "#34D334";

const TAB_ACTIVE = "bg-[#1B800F] text-white shadow-sm";
const TAB_IDLE = "bg-[#E8E8E8] text-gray-800 hover:bg-[#DDDDDD]";

type MainTab = "margin" | "activity";
type MarginBucket = "fiat" | "crypto" | "vc" | "other";

const MARGIN_BUCKET_KEYS: Record<MarginBucket, string[]> = {
  fiat: ["deposit", "withdrawal", "bill_payment"],
  crypto: ["crypto_deposit", "crypto_withdrawal", "crypto_buy", "crypto_sell", "external_send"],
  vc: ["card_creation", "card_funding"],
  other: ["flush", "_default"],
};

const MARGIN_BUCKET_META: { id: MarginBucket; label: string; short: string }[] = [
  { id: "fiat", label: "Fiat & bills", short: "Includes Fiat deposit (deposit)" },
  { id: "crypto", label: "Crypto", short: "On-chain & trading" },
  { id: "vc", label: "Virtual cards", short: "Creation & funding" },
  { id: "other", label: "Other", short: "Treasury & fallback" },
];

function bucketToRatesCategory(bucket: MarginBucket): PlatformRateCategory | null {
  if (bucket === "fiat") return "fiat";
  if (bucket === "crypto") return "crypto";
  if (bucket === "vc") return "virtual_card";
  return null;
}

function orderProfitRows(rows: ServiceProfitSettingRow[], bucket: MarginBucket): ServiceProfitSettingRow[] {
  const keys = MARGIN_BUCKET_KEYS[bucket];
  const out: ServiceProfitSettingRow[] = [];
  for (const k of keys) {
    const r = rows.find((x) => x.service_key === k);
    if (r) out.push(r);
  }
  return out;
}

function fmtNum(s: string | undefined, currency?: string | null): string {
  if (s === undefined || s === null || s === "") return "—";
  const n = parseFloat(s);
  if (Number.isNaN(n)) return "—";
  const cur = (currency ?? "").toUpperCase();
  if (cur === "NGN" || cur === "NAIRA") {
    return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  const t = n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 8 });
  return currency ? `${currency} ${t}` : t;
}

function fmtNgnRate(s: string | null | undefined): string {
  if (s === undefined || s === null || s === "") return "—";
  const n = parseFloat(s);
  if (Number.isNaN(n)) return "—";
  const t = n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `₦${t}`;
}

function fmtPctRate(s: string | null | undefined): string {
  if (s === undefined || s === null || s === "") return "—";
  const n = parseFloat(s);
  if (Number.isNaN(n)) return "—";
  const t = n % 1 === 0 ? String(n) : n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  return `${t}%`;
}

function fmtUsdRate(s: string | null | undefined): string {
  if (s === undefined || s === null || s === "") return "—";
  const n = parseFloat(s);
  if (Number.isNaN(n)) return "—";
  const t = n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  return `$${t}`;
}

function rateSnapshotContext(r: PlatformRateSnapshot): string {
  const parts = [r.service_key, r.sub_service_key, r.crypto_asset, r.network_key].filter(
    (x): x is string => Boolean(x && String(x).trim())
  );
  const human = parts.map((p) => humanizeApiLabel(p));
  return human.length ? human.join(" · ") : humanizeApiLabelOrDash(r.category);
}

function profitBasisShortLabel(basis: string): string {
  switch (basis) {
    case "amount":
      return "principal amount";
    case "fee":
      return "ledger service fee";
    case "total_amount":
      return "total charged";
    case "ngn_notional":
      return "NGN paid or received (crypto)";
    default:
      return humanizeApiLabel(basis) || basis;
  }
}

function formatPercentRule(s: string | null | undefined): string {
  if (s === undefined || s === null || s === "") return "0";
  const n = parseFloat(s);
  if (Number.isNaN(n)) return s;
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: false }).format(n);
}

function profitDisplayCurrency(row: ProfitTransactionRow): string | null | undefined {
  return row.profit.profit_currency ?? row.currency;
}

function customerTotalCell(row: ProfitTransactionRow): { primary: string; secondary: string | null } {
  const rev = row.revenue;
  if (rev?.revenue_kind === "exchange_trade" && rev.ngn_notional) {
    return {
      primary: formatNgn(rev.ngn_notional),
      secondary: rev.crypto_units ? `${rev.crypto_units} ${row.currency ?? ""}`.trim() : null,
    };
  }
  return {
    primary: fmtNum(row.total_amount, row.currency),
    secondary: null,
  };
}

function revenueKindLabel(k: RevenueKind | undefined): string {
  switch (k) {
    case "fiat_fee":
      return "Fiat fee";
    case "bill_fee":
      return "Bill fee";
    case "crypto_usd_notional_fee":
      return "Crypto (USD-based fee)";
    case "exchange_trade":
      return "Exchange (buy/sell)";
    case "virtual_card_fee":
      return "Virtual card fee";
    default:
      return "Other";
  }
}

const SELECT_FILTER =
  "cursor-pointer rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25";

function SimpleSummaryCard({
  title,
  subtitle,
  value,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-1.5 max-w-full break-words break-all text-lg font-semibold leading-snug text-gray-900 tabular-nums sm:text-xl">
            {value}
          </p>
          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function formatNgn(v: string | null | undefined): string {
  if (v === null || v === undefined || String(v).trim() === "") return "—";
  const n = parseFloat(String(v));
  if (Number.isNaN(n)) return "—";
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Profit margin form inputs: cap visible decimals (Naira-style; API may send 8+ places). */
function toProfitInputString(value: string | number | undefined, maxFractionDigits: number): string {
  if (value === undefined || value === "") return "";
  const n = typeof value === "number" ? value : parseFloat(String(value));
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
    useGrouping: false,
  }).format(n);
}

function RatesReferencePanel({ category }: { category: PlatformRateCategory }) {
  const q = useQuery({
    queryKey: ["admin", "platform-rates", category, "profit-sidebar"],
    queryFn: () => fetchPlatformRates(category),
  });

  const list: PlatformRateRow[] = q.data?.rates ?? [];

  return (
    <div className="mx-4 mb-5 rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Customer pricing (from Rates)</h3>
          <p className="mt-0.5 text-xs text-gray-600">
            Read-only snapshot of{" "}
            <Link to="/rates" className="font-medium text-[#1B800F] underline underline-offset-2">
              Rates
            </Link>{" "}
            for this category. Zeros in <strong>Profit margin</strong> below mean you have not set a <em>profit</em> rule yet—that is
            separate from these customer fees (e.g. ₦100 deposit fee still shows here while profit stays 0 until you configure it).
          </p>
        </div>
      </div>
      {q.isLoading ? <p className="mt-3 text-sm text-gray-500">Loading rates…</p> : null}
      {q.isError ? <p className="mt-3 text-sm text-red-600">Could not load platform rates.</p> : null}
      {!q.isLoading && !q.isError && list.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No rate rows for this category.</p>
      ) : null}
      {list.length > 0 ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-700">
                <th className="px-2 py-2 font-semibold">Service</th>
                <th className="px-2 py-2 font-semibold">Sub</th>
                <th className="px-2 py-2 font-semibold">Fixed (NGN)</th>
                <th className="px-2 py-2 font-semibold">%</th>
                <th className="px-2 py-2 font-semibold">Min (NGN)</th>
                <th className="px-2 py-2 font-semibold">Fee USD</th>
                <th className="px-2 py-2 font-semibold">Active</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="px-2 py-2 font-medium text-gray-900">{humanizeApiLabel(r.service_key)}</td>
                  <td className="px-2 py-2 text-gray-700">{r.sub_service_key ? humanizeApiLabel(r.sub_service_key) : "—"}</td>
                  <td className="px-2 py-2">{formatNgn(r.fixed_fee_ngn)}</td>
                  <td className="px-2 py-2">{r.percentage_fee != null && r.percentage_fee !== "" ? `${r.percentage_fee}%` : "—"}</td>
                  <td className="px-2 py-2">{formatNgn(r.min_fee_ngn)}</td>
                  <td className="px-2 py-2">{r.fee_usd != null && r.fee_usd !== "" ? `$${r.fee_usd}` : "—"}</td>
                  <td className="px-2 py-2">{r.is_active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function ProfitSettingsPanel({ disabled }: { disabled: boolean }) {
  const qc = useQueryClient();
  const [marginBucket, setMarginBucket] = useState<MarginBucket>("fiat");
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
        fixed_fee: toProfitInputString(r.fixed_fee, 2),
        percentage: toProfitInputString(r.percentage, 2),
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
  const visibleRows = useMemo(() => orderProfitRows(rows, marginBucket), [rows, marginBucket]);
  const ratesCategory = bucketToRatesCategory(marginBucket);

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
            <h2 className="text-lg font-semibold md:text-xl">Profit margin (your share)</h2>
            <p className="text-xs text-white/85">
              Customer-facing fees are set under{" "}
              <Link to="/rates" className="font-semibold text-white underline underline-offset-2 hover:text-white/95">
                Rates
              </Link>
              .               Here you only define <strong>profit</strong>: fixed profit + profit % on principal, fee, total charged, or (for crypto
              buy/sell) NGN paid/received—per transaction type. This is not a second copy of Rates.
            </p>
          </div>
        </div>
      </div>

      {!q.isLoading && !q.isError ? (
        <div className="flex flex-col gap-1 border-b border-gray-200 bg-gray-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs font-medium text-gray-600">Category</p>
          <div className="flex flex-wrap gap-2">
            {MARGIN_BUCKET_META.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setMarginBucket(b.id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors md:text-sm ${
                  marginBucket === b.id ? TAB_ACTIVE : TAB_IDLE
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 md:max-w-[280px] md:text-right">{MARGIN_BUCKET_META.find((x) => x.id === marginBucket)?.short}</p>
        </div>
      ) : null}

      {q.isLoading ? (
        <p className="px-5 py-8 text-center text-sm text-gray-500">Loading settings…</p>
      ) : q.isError ? (
        <p className="px-5 py-8 text-center text-sm text-red-600">Could not load profit settings.</p>
      ) : (
        <>
          {ratesCategory ? <RatesReferencePanel category={ratesCategory} /> : (
            <div className="mx-4 mb-5 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
              For treasury / fallback types, configure customer pricing under{" "}
              <Link to="/rates" className="font-medium text-[#1B800F] underline">
                Rates
              </Link>{" "}
              in each category. Profit rules below still apply to matching transactions.
            </div>
          )}
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: COL_HEADER }}>
                <th className="px-4 py-3 font-semibold text-gray-700">Service</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Fixed profit</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Profit %</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Profit % applies to</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Active</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r, i) => {
                const d = drafts[r.service_key] ?? {};
                return (
                  <tr
                    key={r.service_key}
                    style={{ backgroundColor: i % 2 === 0 ? ROW_A : ROW_B }}
                    className="border-t border-gray-100"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.label}</p>
                      <p className="text-xs text-gray-500">{humanizeApiLabel(r.service_key)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        className="w-28 rounded-lg border border-gray-200 px-2 py-1.5 text-sm tabular-nums"
                        value={d.fixed_fee ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [r.service_key]: { ...prev[r.service_key], fixed_fee: e.target.value },
                          }))
                        }
                        onBlur={(e) => {
                          const raw = e.currentTarget.value;
                          if (raw === "") return;
                          const next = toProfitInputString(raw, 2);
                          setDrafts((prev) => ({
                            ...prev,
                            [r.service_key]: { ...prev[r.service_key], fixed_fee: next },
                          }));
                        }}
                        disabled={mut.isPending}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={100}
                        className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm tabular-nums"
                        value={d.percentage ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [r.service_key]: { ...prev[r.service_key], percentage: e.target.value },
                          }))
                        }
                        onBlur={(e) => {
                          const raw = e.currentTarget.value;
                          if (raw === "") return;
                          const next = toProfitInputString(raw, 2);
                          setDrafts((prev) => ({
                            ...prev,
                            [r.service_key]: { ...prev[r.service_key], percentage: next },
                          }));
                        }}
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
                        <option value="fee">Fee only (from tx / Rates)</option>
                        <option value="ngn_notional">NGN paid/received (crypto buy &amp; sell)</option>
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
        </>
      )}
      {mut.isError ? (
        <p className="border-t border-gray-100 px-5 py-2 text-xs text-red-600">Could not save setting.</p>
      ) : null}
    </section>
  );
}

function BreakdownRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 border-b border-gray-100 py-2.5 text-sm last:border-b-0 ${emphasize ? "-mx-2 rounded-lg border-0 bg-emerald-50/60 px-2" : ""}`}
    >
      <span className="text-gray-600">{label}</span>
      <span
        className={`max-w-[65%] break-words text-right ${emphasize ? "font-semibold text-emerald-900" : "font-medium text-gray-900"}`}
      >
        {value}
      </span>
    </div>
  );
}

function PaymentBreakdownModal({ row, onClose }: { row: ProfitTransactionRow; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const p = row.profit;
  const rev = row.revenue;
  const pc = profitDisplayCurrency(row);
  const isExchange = rev?.revenue_kind === "exchange_trade";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[151] max-h-[min(92vh,720px)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Eye className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Payment details</h2>
              <p className="text-xs text-gray-500">Everything for this one payment</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{row.description || "—"}</p>

        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-gray-500">Customer and reference</p>
          <div className="rounded-xl border border-gray-100 bg-white px-3 py-1">
            <BreakdownRow label="Customer" value={row.user?.display_name ?? "—"} />
            <BreakdownRow label="Kind of payment" value={humanizeTransactionSubtype(row)} />
            {rev ? <BreakdownRow label="Pricing model" value={revenueKindLabel(rev.revenue_kind)} /> : null}
            <BreakdownRow label="Status" value={humanizeApiLabelOrDash(row.status)} />
            <BreakdownRow label="Reference / ID" value={row.transaction_id} />
            <BreakdownRow label="Date" value={row.created_at ? new Date(row.created_at).toLocaleString() : "—"} />
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-gray-500">Customer charge</p>
          <p className="mb-2 text-xs text-gray-500">
            {isExchange ? (
              <>
                Crypto buy/sell do not use a separate ledger service fee—pricing is in the{" "}
                <Link to="/rates" className="font-medium text-[#1B800F] underline">
                  Rates
                </Link>{" "}
                exchange row (NGN per coin). Compare reference vs applied below when present.
              </>
            ) : (
              <>
                From the payment record. Customer-facing fees are configured under{" "}
                <Link to="/rates" className="font-medium text-[#1B800F] underline">
                  Rates
                </Link>
                .
              </>
            )}
          </p>
          <div className="rounded-xl border border-gray-100 bg-white px-3 py-1">
            {isExchange && rev ? (
              <>
                <BreakdownRow
                  label={row.type === "crypto_buy" ? "NGN paid" : "NGN received"}
                  value={rev.ngn_notional ? formatNgn(rev.ngn_notional) : "—"}
                />
                <BreakdownRow label="Crypto amount" value={fmtNum(row.amount, row.currency)} />
                <BreakdownRow label="Ledger service fee" value={fmtNum(row.fee, row.currency)} />
                {rev.reference_ngn_per_crypto ? (
                  <BreakdownRow label="Reference ₦ / 1 crypto (table rate)" value={formatNgn(rev.reference_ngn_per_crypto)} />
                ) : null}
                {rev.applied_ngn_per_crypto ? (
                  <BreakdownRow label="Applied ₦ / 1 crypto (this trade)" value={formatNgn(rev.applied_ngn_per_crypto)} />
                ) : null}
                {rev.implied_spread_ngn ? (
                  <BreakdownRow label="Implied spread vs reference (NGN)" value={formatNgn(rev.implied_spread_ngn)} />
                ) : null}
              </>
            ) : (
              <>
                <BreakdownRow label={rev?.label_customer_flow ?? "Main amount"} value={fmtNum(row.amount, row.currency)} />
                <BreakdownRow label={rev?.label_fee_line ?? "Service fee"} value={fmtNum(row.fee, row.currency)} />
                <BreakdownRow label="Total charged" value={fmtNum(row.total_amount, row.currency)} />
              </>
            )}
          </div>
        </div>

        {(() => {
          const snap = row.rate_from_admin ?? null;
          if (!snap) {
            return (
              <div className="mb-4 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2 text-xs text-gray-600">
                No matching{" "}
                <Link to="/rates" className="font-medium text-[#1B800F] underline">
                  Rates
                </Link>{" "}
                row was found for this transaction type (or it does not use platform Rates).
              </div>
            );
          }
          const hasNgnBits =
            (snap.fixed_fee_ngn != null && snap.fixed_fee_ngn !== "") ||
            (snap.percentage_fee != null && snap.percentage_fee !== "") ||
            (snap.min_fee_ngn != null && snap.min_fee_ngn !== "");
          const hasUsdBits =
            (snap.fee_usd != null && snap.fee_usd !== "") ||
            (snap.exchange_rate_ngn_per_usd != null && snap.exchange_rate_ngn_per_usd !== "");
          return (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold text-gray-500">
                {isExchange ? "Rates (exchange price)" : "Rates (fixed, percentage, minimum)"}
              </p>
              <p className="mb-2 text-xs text-gray-500">
                {isExchange
                  ? "For buy/sell, the important field is often NGN per crypto unit (admin override). On-chain crypto fees use USD flat + percent instead."
                  : "From your admin Rates for this payment. Several parts can apply together (for example a flat amount plus a percent, with a floor). The amounts above reflect what was charged."}
              </p>
              <p className="mb-2 text-xs font-medium text-gray-800">{rateSnapshotContext(snap)}</p>
              <div className="rounded-xl border border-gray-100 bg-white px-3 py-1">
                {hasNgnBits ? (
                  <>
                    {snap.fixed_fee_ngn != null && snap.fixed_fee_ngn !== "" ? (
                      <BreakdownRow label="Fixed fee (NGN)" value={fmtNgnRate(snap.fixed_fee_ngn)} />
                    ) : null}
                    {snap.percentage_fee != null && snap.percentage_fee !== "" ? (
                      <BreakdownRow label="Percentage fee" value={fmtPctRate(snap.percentage_fee)} />
                    ) : null}
                    {snap.min_fee_ngn != null && snap.min_fee_ngn !== "" ? (
                      <BreakdownRow label="Minimum fee (NGN)" value={fmtNgnRate(snap.min_fee_ngn)} />
                    ) : null}
                  </>
                ) : null}
                {hasUsdBits ? (
                  <>
                    {snap.fee_usd != null && snap.fee_usd !== "" ? (
                      <BreakdownRow label="Fee (USD)" value={fmtUsdRate(snap.fee_usd)} />
                    ) : null}
                    {snap.exchange_rate_ngn_per_usd != null && snap.exchange_rate_ngn_per_usd !== "" ? (
                      <BreakdownRow
                        label={isExchange ? "Admin NGN per 1 crypto (if set)" : "Exchange rate (NGN per USD)"}
                        value={fmtNum(snap.exchange_rate_ngn_per_usd)}
                      />
                    ) : null}
                  </>
                ) : null}
                {!hasNgnBits && !hasUsdBits ? (
                  <p className="py-2 text-xs text-gray-500">This Rates row has no fee fields stored.</p>
                ) : null}
              </div>
            </div>
          );
        })()}

        <div>
          <p className="mb-2 text-xs font-semibold text-gray-500">Your profit (this payment)</p>
          <p className="mb-2 text-xs text-gray-600">
            The <strong>percentage fee</strong> under Rates is the <strong>customer</strong> fee (what users pay the platform).{" "}
            <strong>Percent part</strong> below is <strong>your profit %</strong> from the Profit settings tab—it applies to the basis
            amount (principal, fee, total, etc.), and is not the same number as the Rates row.
          </p>
          {p.admin_profit_percent != null &&
          !Number.isNaN(parseFloat(p.admin_profit_percent)) &&
          parseFloat(p.admin_profit_percent) === 0 ? (
            <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Your profit rule uses <strong>0%</strong> on {profitBasisShortLabel(p.basis)}, so <strong>Percent part</strong> is ₦0 even
              when Rates show a % fee for this service.
            </p>
          ) : null}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-1">
            {p.admin_profit_percent != null ? (
              <BreakdownRow
                label="Your profit rule (tab 1)"
                value={`${formatPercentRule(p.admin_profit_percent)}% of ${profitBasisShortLabel(p.basis)}`}
              />
            ) : null}
            <BreakdownRow label="Basis amount (this payment)" value={fmtNum(p.basis_amount, pc)} />
            <BreakdownRow label="Flat part" value={fmtNum(p.fixed_profit, pc)} />
            <BreakdownRow label="Percent part" value={fmtNum(p.percentage_profit, pc)} />
            <BreakdownRow
              label="Total your profit"
              value={fmtNum(p.total_profit, pc)}
              emphasize
            />
            {p.basis === "ngn_notional" ? (
              <p className="py-2 text-xs text-gray-600">
                Percent applies to NGN flow (paid or received), not crypto units—see customer charge above.
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#1B800F] py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95"
        >
          Close
        </button>
      </div>
    </div>
  );
}

const ProfitCenter: React.FC = () => {
  const hasToken = Boolean(getAdminToken());
  const [mainTab, setMainTab] = useState<MainTab>("margin");
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
  const [detailRow, setDetailRow] = useState<ProfitTransactionRow | null>(null);

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
    return (t / summary.transaction_count).toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
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
        "revenue_kind",
        "currency",
        "principal_amount",
        "fee",
        "total_amount",
        "ngn_notional",
        "fixed_profit",
        "percentage_profit",
        "total_profit",
        "profit_basis",
        "created_at",
      ],
      rows.map((r) => [
        r.transaction_id,
        (r.description ?? "").replace(/\r?\n/g, " "),
        r.type ?? "",
        r.revenue?.revenue_kind ?? "",
        r.currency ?? "",
        r.amount,
        r.fee,
        r.total_amount,
        r.revenue?.ngn_notional ?? "",
        r.profit.fixed_profit,
        r.profit.percentage_profit,
        r.profit.total_profit,
        r.profit.basis,
        r.created_at ?? "",
      ])
    );
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Profit center</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-600">
          <Link to="/rates" className="font-semibold text-[#1B800F] underline underline-offset-2 hover:opacity-90">
            Rates
          </Link>{" "}
          = what customers pay. <strong>This page</strong> = how much of that is <strong>your profit</strong>. Zeros only mean you have
          not set profit rules yet.
        </p>
      </div>

      {!hasToken ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Log in as <strong>admin</strong> to manage profit rules and reports.
        </div>
      ) : null}

      {hasToken ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMainTab("margin")}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${mainTab === "margin" ? TAB_ACTIVE : TAB_IDLE}`}
          >
            1 · Profit settings
          </button>
          <button
            type="button"
            onClick={() => setMainTab("activity")}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${mainTab === "activity" ? TAB_ACTIVE : TAB_IDLE}`}
          >
            2 · Payments &amp; totals
          </button>
        </div>
      ) : null}

      {mainTab === "margin" || !hasToken ? <ProfitSettingsPanel disabled={!hasToken} /> : null}

      {mainTab === "activity" && hasToken ? (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <SimpleSummaryCard
              icon={PiggyBank}
              title="Your profit (total)"
              subtitle="From your profit rules, for this list"
              value={summary ? fmtNum(summary.sum_total_profit) : "—"}
            />
            <SimpleSummaryCard
              icon={Banknote}
              title="Fees customers paid"
              subtitle='Sum of the ledger “fee” field (crypto buy/sell are usually 0—priced via exchange rate instead)'
              value={summary ? fmtNum(summary.sum_fee_collected) : "—"}
            />
            <SimpleSummaryCard
              icon={Coins}
              title="Total money processed"
              subtitle="What customers were charged in total"
              value={summary ? fmtNum(summary.sum_transaction_amount) : "—"}
            />
            <SimpleSummaryCard
              icon={LineChart}
              title="Number of payments"
              subtitle="Rows that match your filters"
              value={summary ? String(summary.transaction_count) : "—"}
            />
            <SimpleSummaryCard
              icon={Percent}
              title="Average profit each"
              subtitle="Total profit ÷ number of payments"
              value={avgProfit}
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gradient-to-r from-emerald-50/80 to-white px-4 py-4 md:px-6">
              <h2 className="text-lg font-semibold text-gray-900">Payment list</h2>
              <p className="mt-1 text-sm text-gray-600">
                Pick filters to narrow the list. Press <strong>See details</strong> to open a popup with every amount explained in plain
                language.
              </p>
            </div>

            <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/50 p-4 md:flex-row md:flex-wrap md:items-end">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className={SELECT_FILTER}
                aria-label="Payment type"
              >
                {typeOptions.map((k) => (
                  <option key={k} value={k}>
                    {k === "all" ? "All payment types" : humanizeApiLabelOrDash(k)}
                  </option>
                ))}
              </select>
              <select
                value={currencyFilter}
                onChange={(e) => {
                  setCurrencyFilter(e.target.value);
                  setPage(1);
                }}
                className={SELECT_FILTER}
                aria-label="Currency"
              >
                {["all", "NGN", "USD", "USDT"].map((c) => (
                  <option key={c} value={c}>
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
                className={SELECT_FILTER}
                aria-label="Status"
              >
                <option value="completed">Completed only</option>
                <option value="all">Every status</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <div className="relative">
                <select
                  value={datePreset}
                  onChange={(e) => {
                    setDatePreset(e.target.value as DateRangePreset);
                    setPage(1);
                  }}
                  className={`${SELECT_FILTER} pr-9`}
                  aria-label="Date range"
                >
                  <option value="all">Any date</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="12m">Last 12 months</option>
                  <option value="custom">Custom range</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>
              {datePreset === "custom" ? (
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                  <span className="text-gray-500">From</span>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => {
                      setCustomFrom(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-xl border border-gray-300 bg-white px-2 py-2 text-gray-900"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => {
                      setCustomTo(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-xl border border-gray-300 bg-white px-2 py-2 text-gray-900"
                  />
                </div>
              ) : null}
              <button
                type="button"
                onClick={exportCsv}
                disabled={!rows.length}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-40"
              >
                Download spreadsheet
              </button>
              <div className="relative w-full min-w-[200px] flex-1 md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by name, ID, or reference…"
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 font-semibold text-gray-700">What happened</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Customer</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Customer total / flow</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Your profit</th>
                    <th className="px-4 py-3 font-semibold text-gray-700"> </th>
                  </tr>
                </thead>
                <tbody>
                  {hasToken && listQ.isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        Loading payments…
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        <p className="font-medium text-gray-800">No payments match these filters.</p>
                        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                          Try <strong>Any date</strong> and <strong>Every status</strong> to see more. Full fee and profit breakdown is in{" "}
                          <strong>See details</strong>.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    rows.map((r: ProfitTransactionRow, i: number) => (
                      <tr
                        key={`${r.transaction_id}-${r.id}`}
                        className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <td className="max-w-[min(100vw,320px)] px-4 py-3">
                          <p className="line-clamp-2 font-medium text-gray-900">{r.description || "—"}</p>
                          <p className="text-xs text-gray-500">{humanizeTransactionSubtype(r)}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-800">{r.user?.display_name ?? "—"}</td>
                        <td className="px-4 py-3 font-medium tabular-nums text-gray-900">
                          {(() => {
                            const cell = customerTotalCell(r);
                            return (
                              <div>
                                <span className="break-all">{cell.primary}</span>
                                {cell.secondary ? (
                                  <p className="mt-0.5 text-xs text-gray-500">{cell.secondary}</p>
                                ) : null}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums text-emerald-800">
                          <span className="break-all">{fmtNum(r.profit.total_profit, profitDisplayCurrency(r))}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setDetailRow(r)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                          >
                            <Eye className="h-3.5 w-3.5" strokeWidth={2.5} />
                            See details
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
              <p className="border-t border-gray-100 px-5 py-3 text-sm text-red-600">Could not load this list. Try again in a moment.</p>
            ) : null}
          </section>
        </>
      ) : null}

      {detailRow ? <PaymentBreakdownModal row={detailRow} onClose={() => setDetailRow(null)} /> : null}
    </div>
  );
};

export default ProfitCenter;
