import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  Banknote,
  Coins,
  ChevronDown,
  Search,
  X,
  Copy,
} from "lucide-react";
import StatCard from "../../components/StatCard";
import { fetchAdminStats } from "../../api/adminStats";
import { fetchAdminTransactions, type AdminTransactionRow } from "../../api/adminTransactions";
import { avatarUrlForName } from "../../utils/avatarUrl";
import {
  presetToFromTo,
  defaultCustomRangeLocal,
  type DateRangePreset,
} from "../../utils/dateRange";
import { humanizeTransactionSubtype } from "../../utils/humanizeApiLabel";
import { downloadCsv } from "../../utils/csvDownload";

const GREEN = "#1B800F";
/** Segmented filter track + dropdown fills */
const FILTER_TRACK_BG = "#E8E8E8";
const FILTER_DROPDOWN_BG = "#E5E5E5";
const LATEST_HEADER_GREEN = "#21D721";
const LATEST_SEARCH_BG = "#189016";
const LATEST_ROW_A = "#F9F9F9";
const LATEST_ROW_B = "#E6E6E6";
const LATEST_COL_HEADER_BG = "#EBEBEB";
const LATEST_ACTION_LIGHT = "#34D334";
const STATUS_PILL = "#1B800F";
const MODAL_BG = "#F4F4F5";
const SUCCESS_BANNER = "#DCFCE7";
const SUCCESS_GREEN = "#16A34A";
const DETAIL_CARD_BG = "#E4E4E7";
const SUCCESS_ICON = "/transaction-success-icon.png";
const PENDING_ICON = "/pending-transaction-icon.png";
const PENDING_BANNER = "#FFFBEB";
const PENDING_TITLE = "#C2410C";

type CurrencyTab = "all" | "naira" | "crypto";
type TypePill = "all" | "deposits" | "withdrawals" | "bill";

type TxDetail = {
  amount: string;
  fee: string;
  totalAmount: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
  transactionId: string;
  description: string;
  dateFormatted: string;
};

type TxRow = {
  id: string;
  name: string;
  avatar: string;
  amount: string;
  status: string;
  type: string;
  subType: string;
  date: string;
  detail: TxDetail;
};

function successSubtitle(subType: string): string {
  const s = subType.toLowerCase();
  if (s.includes("withdraw")) return "You have successfully completed a withdrawal of";
  if (s.includes("bill")) return "You have successfully completed a bill payment of";
  if (s.includes("deposit")) return "You have successfully completed a deposit of";
  return "You have successfully completed a transaction of";
}

function TxReceiptModal({
  row,
  onClose,
}: {
  row: TxRow;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const d = row.detail;
  const statusLc = row.status.toLowerCase();
  const isSuccess = statusLc === "successful" || statusLc === "completed";
  const isPending = statusLc === "pending";
  const bannerBg = isSuccess ? SUCCESS_BANNER : isPending ? PENDING_BANNER : "#F3F4F6";

  const copy = (key: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const CopyBtn = ({ k, text }: { k: string; text: string }) => (
    <button
      type="button"
      onClick={() => copy(k, text)}
      className="shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-800"
      aria-label={`Copy ${k}`}
    >
      <Copy className="h-3.5 w-3.5" strokeWidth={2} />
    </button>
  );

  const Row = ({
    label,
    value,
    copyKey,
  }: {
    label: string;
    value: string;
    copyKey?: string;
  }) => (
    <div className="flex items-center justify-between gap-3 border-b border-gray-300/50 py-2.5 last:border-b-0">
      <span className="text-xs text-gray-600">{label}</span>
      <div className="flex min-w-0 max-w-[62%] items-center justify-end gap-1">
        <span className="text-right text-xs font-medium text-gray-900 break-all">{value}</span>
        {copyKey ? <CopyBtn k={copyKey} text={value} /> : null}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-receipt-title"
        className="relative z-[101] flex max-h-[min(90vh,720px)] w-full max-w-[400px] flex-col overflow-hidden rounded-3xl shadow-2xl"
        style={{ backgroundColor: MODAL_BG }}
      >
        <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-3">
          <h2 id="tx-receipt-title" className="text-base font-semibold text-gray-900">
            Transaction
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 sm:px-5">
          <div
            className="relative overflow-hidden rounded-b-[2.25rem] px-4 pb-10 pt-2 text-center"
            style={{ backgroundColor: bannerBg }}
          >
            <div
              className="pointer-events-none absolute -bottom-6 left-1/2 h-16 w-[120%] -translate-x-1/2 rounded-[50%] bg-white/25"
              aria-hidden
            />
            {isSuccess ? (
              <>
                <div className="relative mx-auto flex h-[4.75rem] w-[4.75rem] items-center justify-center">
                  <img src={SUCCESS_ICON} alt="" className="h-full w-full object-contain drop-shadow-md" width={76} height={76} />
                </div>
                <p className="relative mt-4 text-lg font-bold" style={{ color: SUCCESS_GREEN }}>
                  Success
                </p>
                <p className="relative mx-auto mt-2 max-w-[280px] text-xs leading-relaxed text-gray-600">
                  {successSubtitle(row.subType)}
                </p>
                <p className="relative mt-1 text-xl font-bold tracking-tight text-gray-900">
                  {d.amount}
                </p>
              </>
            ) : isPending ? (
              <>
                <div className="relative mx-auto flex h-[4.75rem] w-[4.75rem] items-center justify-center">
                  <img src={PENDING_ICON} alt="" className="h-full w-full object-contain drop-shadow-md" width={76} height={76} />
                </div>
                <p className="relative mt-4 text-lg font-bold" style={{ color: PENDING_TITLE }}>
                  Pending
                </p>
                <p className="relative mx-auto mt-2 max-w-[280px] text-xs leading-relaxed text-gray-600">
                  This transaction is still processing.
                </p>
                <p className="relative mt-1 text-xl font-bold tracking-tight text-gray-900">{d.amount}</p>
              </>
            ) : (
              <>
                <p className="relative mt-4 text-lg font-bold text-amber-700">{row.status}</p>
                <p className="relative mx-auto mt-2 max-w-[280px] text-xs text-gray-600">
                  Transaction details below.
                </p>
                <p className="relative mt-1 text-xl font-bold text-gray-900">{d.amount}</p>
              </>
            )}
          </div>

          <div
            className="relative z-[1] -mt-6 rounded-2xl px-4 py-1 shadow-sm"
            style={{ backgroundColor: DETAIL_CARD_BG }}
          >
            <Row label="Amount" value={d.amount} />
            <Row label="Fee" value={d.fee} />
            <Row label="Total Amount" value={d.totalAmount} />
            <Row label="Bank Name" value={d.bankName} />
            <Row label="Account Number" value={d.accountNumber} copyKey="acct" />
            <Row label="Account Name" value={d.accountName} copyKey="name" />
            <Row label="Reference" value={d.reference} copyKey="ref" />
            <Row label="Transaction id" value={d.transactionId} copyKey="txid" />
            <Row label="Description" value={d.description} />
            <Row label="Date" value={d.dateFormatted} />
          </div>

          {copied ? (
            <p className="mt-2 text-center text-[11px] text-gray-500">Copied to clipboard</p>
          ) : null}

          <button
            type="button"
            className="mt-5 w-full rounded-full py-3.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-300/80"
            style={{ backgroundColor: FILTER_DROPDOWN_BG }}
            onClick={() => {
              const text = `Receipt\nAmount: ${d.amount}\nRef: ${d.reference}\nTxn: ${d.transactionId}`;
              if (typeof navigator !== "undefined" && navigator.share) {
                void navigator.share({ title: "Transaction receipt", text }).catch(() => {});
              } else {
                void navigator.clipboard.writeText(text);
                setCopied("share");
                window.setTimeout(() => setCopied(null), 1600);
              }
            }}
          >
            Share Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTableDate(iso: string | null | undefined): string {
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

function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function mapDisplayStatus(st: string | null | undefined): string {
  const s = (st || "").toLowerCase();
  if (s === "completed") return "Successful";
  if (s === "failed" || s === "cancelled") return "Failed";
  return st || "—";
}

function formatMoneyAmount(v: string | number | null | undefined, currency: string | null | undefined): string {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  if (Number.isNaN(n)) return "—";
  const c = (currency || "").toUpperCase();
  if (c === "NGN") return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
  return `${n.toLocaleString()} ${currency || ""}`.trim();
}

function toTxRow(t: AdminTransactionRow): TxRow {
  const u = t.user;
  const name = u?.name?.trim() || u?.email || "—";
  const cur = (t.currency || "").toUpperCase();
  const isNaira = cur === "NGN";
  const statusLabel = mapDisplayStatus(t.status);
  const amount = formatMoneyAmount(t.amount, t.currency);
  const fee = formatMoneyAmount(t.fee, t.currency);
  const total = formatMoneyAmount(t.total_amount, t.currency);
  return {
    id: String(t.transaction_id ?? t.id),
    name,
    avatar: avatarUrlForName(name),
    amount,
    status: statusLabel,
    type: isNaira ? "Naira" : "Crypto",
    subType: humanizeTransactionSubtype(t),
    date: formatTableDate(t.created_at ?? null),
    detail: {
      amount,
      fee,
      totalAmount: total,
      bankName: t.bank_name || "—",
      accountNumber: t.account_number || "—",
      accountName: t.account_name || "—",
      reference: t.reference || "—",
      transactionId: String(t.transaction_id ?? t.id),
      description: t.description || "—",
      dateFormatted: formatLongDate(t.created_at ?? null),
    },
  };
}

function fmtInt(n: number): string {
  return n.toLocaleString("en-NG");
}

const Transaction: React.FC = () => {
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get("user_id");
  const userIdNum = userIdParam ? parseInt(userIdParam, 10) : NaN;

  const [currencyTab, setCurrencyTab] = useState<CurrencyTab>("all");
  const [typePill, setTypePill] = useState<TypePill>("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [cryptoSubtype, setCryptoSubtype] = useState("");
  const [search, setSearch] = useState("");
  const searchDebounced = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [detailRow, setDetailRow] = useState<TxRow | null>(null);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedByTxId, setSelectedByTxId] = useState<Map<string, TxRow>>(() => new Map());
  const [bulkTx, setBulkTx] = useState<"bulk" | "export">("bulk");
  const selectAllTxRef = useRef<HTMLInputElement>(null);

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

  const statsQ = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
  });
  const s = statsQ.data;

  const typeApi = useMemo(() => {
    if (typePill === "deposits") return "deposit";
    if (typePill === "withdrawals") return "withdrawal";
    if (typePill === "bill") return "bill_payment";
    return undefined;
  }, [typePill]);

  const currencyApi = useMemo(() => {
    if (currencyTab === "naira") return "NGN";
    return undefined;
  }, [currencyTab]);

  const cryptoTypeApi = useMemo(() => {
    if (currencyTab !== "crypto" || !cryptoSubtype || cryptoSubtype === "all-types") return undefined;
    const map: Record<string, string> = {
      deposit: "crypto_deposit",
      withdrawal: "crypto_withdrawal",
      buy: "crypto_buy",
      sell: "crypto_sell",
    };
    return map[cryptoSubtype];
  }, [currencyTab, cryptoSubtype]);

  const typeForApi = useMemo(() => {
    if (currencyTab === "crypto" && cryptoTypeApi) return cryptoTypeApi;
    return typeApi;
  }, [currencyTab, cryptoTypeApi, typeApi]);

  const statusApi = useMemo(() => {
    const m: Record<string, string> = {
      successful: "completed",
      pending: "pending",
      failed: "failed",
    };
    return statusFilter && m[statusFilter] ? m[statusFilter] : undefined;
  }, [statusFilter]);

  const txQ = useQuery({
    queryKey: [
      "admin",
      "transactions",
      page,
      currencyApi,
      typeForApi,
      statusApi,
      userIdNum,
      searchDebounced,
      from,
      to,
    ],
    queryFn: () =>
      fetchAdminTransactions({
        page,
        per_page: 25,
        user_id: Number.isFinite(userIdNum) ? userIdNum : undefined,
        type: typeForApi,
        currency: currencyApi,
        status: statusApi,
        search: searchDebounced.trim() || undefined,
        from,
        to,
      }),
  });

  const rows = useMemo(() => {
    const raw = txQ.data?.data ?? [];
    let mapped = raw.map(toTxRow);
    if (currencyTab === "crypto") {
      mapped = mapped.filter((r) => r.type === "Crypto");
    }
    return mapped;
  }, [txQ.data?.data, currencyTab]);

  useEffect(() => {
    setSelectedByTxId(new Map());
  }, [
    page,
    currencyTab,
    typePill,
    statusFilter,
    cryptoSubtype,
    searchDebounced,
    datePreset,
    customFrom,
    customTo,
    userIdNum,
  ]);

  const allRowsSelected = rows.length > 0 && rows.every((r) => selectedByTxId.has(r.id));
  const someRowsSelected = rows.some((r) => selectedByTxId.has(r.id));

  useEffect(() => {
    const el = selectAllTxRef.current;
    if (!el) return;
    el.indeterminate = someRowsSelected && !allRowsSelected;
  }, [allRowsSelected, someRowsSelected, rows]);

  const toggleTxRow = (row: TxRow) => {
    setSelectedByTxId((prev) => {
      const next = new Map(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.set(row.id, row);
      return next;
    });
  };

  const toggleAllTxOnPage = () => {
    const all = rows.length > 0 && rows.every((r) => selectedByTxId.has(r.id));
    setSelectedByTxId((prev) => {
      const next = new Map(prev);
      if (all) {
        rows.forEach((r) => next.delete(r.id));
      } else {
        rows.forEach((r) => next.set(r.id, r));
      }
      return next;
    });
  };

  const onBulkTxChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as "bulk" | "export";
    setBulkTx("bulk");
    if (v !== "export") return;
    const list = Array.from(selectedByTxId.values());
    if (list.length === 0) {
      window.alert("Select at least one transaction to export.");
      return;
    }
    downloadCsv(
      "admin-transactions",
      ["name", "transaction_id", "amount", "status", "type", "sub_type", "date", "reference", "description"],
      list.map((r) => [
        r.name,
        r.id,
        r.amount,
        r.status,
        r.type,
        r.subType,
        r.date,
        r.detail.reference,
        r.detail.description,
      ])
    );
  };

  const tabBtn = (active: boolean) =>
    `relative pb-3 text-sm font-semibold transition-colors ${
      active ? "" : "text-gray-500 hover:text-gray-700"
    }`;

  const segmentedPill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition-colors md:px-5 md:py-2 ${
      active ? "text-white shadow-sm" : "text-gray-700 hover:text-gray-900 bg-transparent"
    }`;

  const selectClass =
    "min-w-[150px] max-w-[220px] cursor-pointer appearance-none rounded-full border-0 py-2 pl-4 pr-9 text-sm font-semibold text-gray-700 shadow-none focus:outline-none focus:ring-2 focus:ring-[#1B800F]/25 md:py-2.5 md:pl-5 md:pr-10";

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
      {detailRow ? <TxReceiptModal row={detailRow} onClose={() => setDetailRow(null)} /> : null}
      {/* Summary hero — matches Dashboard */}
      <section
        className="rounded-3xl p-6 md:p-8 text-white shadow-md"
        style={{ backgroundColor: GREEN }}
      >
        <div className="mb-6 flex flex-col gap-4 md:mb-8 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-bold md:text-3xl">Transactions</h1>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[220px]">
            <div className="relative w-full sm:inline-flex sm:w-auto">
              <select
                className="w-full cursor-pointer appearance-none rounded-xl border border-white/25 bg-white/15 py-3 pl-4 pr-10 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 sm:w-[200px]"
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value as DateRangePreset);
                  setPage(1);
                }}
                aria-label="Select date range"
              >
                <option value="all" className="text-gray-900">
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
                <option value="custom" className="text-gray-900">
                  Custom range
                </option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/90"
                strokeWidth={2}
              />
            </div>
            {datePreset === "custom" ? (
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs font-medium text-white/85">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => {
                    setCustomFrom(e.target.value);
                    setPage(1);
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-white/35 bg-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                />
                <label className="text-xs font-medium text-white/85">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => {
                    setCustomTo(e.target.value);
                    setPage(1);
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-white/35 bg-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          <StatCard
            icon={Users}
            label="Total Txns"
            value={s ? fmtInt(s.transactions_total) : "—"}
            hint="All ledger transactions"
          />
          <StatCard
            icon={Banknote}
            label="Revenue (NGN)"
            value={s?.revenue_ngn_display ?? "—"}
            hint="Completed NGN volume (all-time)"
          />
          <StatCard
            icon={Coins}
            label="Pending deposits"
            value={s ? fmtInt(s.deposits_pending) : "—"}
            hint="Deposit records awaiting completion"
          />
        </div>
      </section>

      {/* Tabs */}
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
                if (key !== "crypto") setCryptoSubtype("");
                setPage(1);
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

      {/* Segmented pills (grey track) + pill dropdowns */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div
          className="flex w-fit max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto rounded-full p-1 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-1 md:p-1.5 [&::-webkit-scrollbar]:hidden"
          style={{ backgroundColor: FILTER_TRACK_BG }}
          role="group"
          aria-label="Transaction type"
        >
          <button
            type="button"
            onClick={() => {
              setTypePill("all");
              setPage(1);
            }}
            className={segmentedPill(typePill === "all")}
            style={typePill === "all" ? { backgroundColor: GREEN } : undefined}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => {
              setTypePill("deposits");
              setPage(1);
            }}
            className={segmentedPill(typePill === "deposits")}
            style={typePill === "deposits" ? { backgroundColor: GREEN } : undefined}
          >
            Deposits
          </button>
          <button
            type="button"
            onClick={() => {
              setTypePill("withdrawals");
              setPage(1);
            }}
            className={segmentedPill(typePill === "withdrawals")}
            style={typePill === "withdrawals" ? { backgroundColor: GREEN } : undefined}
          >
            Withdrawal
          </button>
          <button
            type="button"
            onClick={() => {
              setTypePill("bill");
              setPage(1);
            }}
            className={segmentedPill(typePill === "bill")}
            style={typePill === "bill" ? { backgroundColor: GREEN } : undefined}
          >
            Bill Payments
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="relative">
            <select
              className={selectClass}
              value={cryptoSubtype}
              onChange={(e) => {
                setCryptoSubtype(e.target.value);
                setPage(1);
              }}
              disabled={currencyTab !== "crypto"}
              aria-label="Crypto transaction type"
              style={{ backgroundColor: FILTER_DROPDOWN_BG }}
            >
              <option value="">Crypto Tx Type</option>
              <option value="all-types">All types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 md:right-3.5" />
          </div>
          <div className="relative">
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Transaction status"
              style={{ backgroundColor: FILTER_DROPDOWN_BG }}
            >
              <option value="">All status</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 md:right-3.5" />
          </div>
          <div className="relative">
            <select
              className={selectClass}
              value={bulkTx}
              onChange={onBulkTxChange}
              aria-label="Bulk action"
              style={{ backgroundColor: FILTER_DROPDOWN_BG }}
            >
              <option value="bulk">Bulk Action</option>
              <option value="export">Export</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 md:right-3.5" />
          </div>
        </div>
      </div>

      {/* Transactions table — aligned with LatestUsersTable */}
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: LATEST_COL_HEADER_BG }}>
                <th className="w-12 px-5 py-4 align-middle font-semibold text-gray-600">
                  <span className="sr-only">Select</span>
                  <input
                    ref={selectAllTxRef}
                    type="checkbox"
                    checked={allRowsSelected}
                    onChange={toggleAllTxOnPage}
                    className="h-4 w-4 rounded border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                    aria-label="Select all on this page"
                  />
                </th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Name</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Transaction id</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Amount</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Status</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Type</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Sub-type</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Date</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {txQ.isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-gray-500">
                    Loading transactions…
                  </td>
                </tr>
              ) : txQ.isError ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-red-600">
                    {(txQ.error as Error)?.message ?? "Failed to load."}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-gray-500">
                    No transactions match your filters.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => {
                  const st = row.status.toLowerCase();
                  const isPend = st === "pending";
                  return (
                    <tr
                      key={`${row.id}-${i}`}
                      className="align-middle"
                      style={{ backgroundColor: i % 2 === 0 ? LATEST_ROW_A : LATEST_ROW_B }}
                    >
                      <td className="px-5 py-5 align-middle">
                        <input
                          type="checkbox"
                          checked={selectedByTxId.has(row.id)}
                          onChange={() => toggleTxRow(row)}
                          className="h-4 w-4 rounded border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                          aria-label={`Select ${row.name}`}
                        />
                      </td>
                      <td className="px-5 py-5 align-middle">
                        <div className="flex items-center gap-3">
                          <img
                            src={row.avatar}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white"
                            width={40}
                            height={40}
                          />
                          <span className="font-semibold text-gray-900">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-5 align-middle font-mono text-xs text-gray-700 md:text-sm">
                        {row.id}
                      </td>
                      <td className="px-5 py-5 align-middle font-semibold text-gray-900">{row.amount}</td>
                      <td className="px-5 py-5 align-middle">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                          style={{
                            backgroundColor: isPend ? "#FEF3C7" : STATUS_PILL,
                            color: isPend ? "#92400E" : "#fff",
                          }}
                        >
                          {isPend ? (
                            <img src={PENDING_ICON} alt="" className="h-4 w-4 object-contain" width={16} height={16} />
                          ) : null}
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-5 align-middle text-gray-700">{row.type}</td>
                      <td className="px-5 py-5 align-middle text-gray-700">{row.subType}</td>
                      <td className="px-5 py-5 align-middle text-gray-700">{row.date}</td>
                      <td className="px-5 py-5 align-middle">
                        <button
                          type="button"
                          onClick={() => setDetailRow(row)}
                          className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                          style={{ backgroundColor: LATEST_ACTION_LIGHT }}
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
        {txQ.data && txQ.data.last_page > 1 ? (
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
              Page {page} of {txQ.data.last_page}
            </span>
            <button
              type="button"
              disabled={page >= txQ.data.last_page}
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

export default Transaction;
