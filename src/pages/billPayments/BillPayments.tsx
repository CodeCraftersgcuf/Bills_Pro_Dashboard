import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Copy, Search, Users, X } from "lucide-react";
import {
  fetchBillPaymentDetail,
  fetchBillPayments,
  fetchBillPaymentSummary,
  type BillPaymentListRow,
  type BillPaymentReceipt,
} from "../../api/adminBillPayments";
import { getAdminToken } from "../../api/authToken";
import { ApiError } from "../../api/httpClient";
import { avatarUrlForName } from "../../utils/avatarUrl";
import {
  presetToFromTo,
  defaultCustomRangeLocal,
  type DateRangePreset,
} from "../../utils/dateRange";
import { humanizeApiLabel } from "../../utils/humanizeApiLabel";
import { downloadCsv } from "../../utils/csvDownload";

const HEADER_GREEN = "#21D721";
const HEADER_SEARCH = "#189016";
const ROW_A = "#F9F9F9";
const ROW_B = "#E6E6E6";
const COL_HEADER = "#EBEBEB";
const ACTION_GREEN = "#34D334";
const MODAL_BG = "#F4F4F5";
const DETAIL_CARD = "#E4E4E7";
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

const BillReceiptModal: React.FC<{
  row: BillPaymentListRow;
  onClose: () => void;
}> = ({ row, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["admin", "bill-payment", row.id],
    queryFn: () => fetchBillPaymentDetail(row.id),
  });

  const receipt: BillPaymentReceipt | undefined = q.data?.receipt;
  const isSuccess = row.status_label === "Successful";
  const isPending = row.status_label === "Pending";
  const heroBannerBg = isSuccess ? "#DCFCE7" : isPending ? "#FFFBEB" : "#F3F4F6";

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

  const copy = (key: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const CopyBtn = ({ k, text }: { k: string; text: string }) => (
    <button
      type="button"
      onClick={() => copy(k, text)}
      className="shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-black/5"
      aria-label="Copy"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );

  const Row = ({ label, value, copyKey }: { label: string; value: string; copyKey?: string }) => (
    <div className="flex items-center justify-between gap-3 border-b border-gray-300/50 py-2.5 last:border-b-0">
      <span className="text-xs text-gray-600">{label}</span>
      <div className="flex min-w-0 max-w-[62%] items-center justify-end gap-1">
        <span className="text-right text-xs font-medium text-gray-900 break-all">{value}</span>
        {copyKey ? <CopyBtn k={copyKey} text={value} /> : null}
      </div>
    </div>
  );

  const txTypeDisplay = receipt
    ? (() => {
        const h = humanizeApiLabel(receipt.transaction_type);
        return h ? h.toLowerCase() : receipt.transaction_type.replace(/_/g, " ").toLowerCase();
      })()
    : "";
  const subtitle =
    receipt &&
    `You have successfully completed ${txTypeDisplay} of ${receipt.subtitle_amount_display}`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[121] flex max-h-[min(90vh,720px)] w-full max-w-[400px] flex-col overflow-hidden rounded-3xl shadow-2xl"
        style={{ backgroundColor: MODAL_BG }}
      >
        <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold text-gray-900">Transaction</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 sm:px-5">
          {q.isLoading && <p className="py-8 text-center text-sm text-gray-500">Loading details…</p>}
          {q.isError && (
            <p className="py-6 text-center text-sm text-red-600">
              {(q.error as Error)?.message ?? "Could not load transaction."}
            </p>
          )}
          {receipt && (
            <>
              <div
                className="relative overflow-hidden rounded-b-[2.25rem] px-4 pb-10 pt-2 text-center"
                style={{ backgroundColor: heroBannerBg }}
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
                    <p className="relative mt-4 text-lg font-bold text-[#16A34A]">Success</p>
                    <p className="relative mx-auto mt-2 max-w-[280px] text-xs leading-relaxed text-gray-600">{subtitle}</p>
                    <p className="relative mt-1 text-xl font-bold tracking-tight text-gray-900">{receipt.total_amount_display}</p>
                  </>
                ) : isPending ? (
                  <>
                    <div className="relative mx-auto flex h-[4.75rem] w-[4.75rem] items-center justify-center">
                      <img src={PENDING_ICON} alt="" className="h-full w-full object-contain drop-shadow-md" width={76} height={76} />
                    </div>
                    <p className="relative mt-4 text-lg font-bold text-[#C2410C]">Pending</p>
                    <p className="relative mx-auto mt-2 max-w-[280px] text-xs leading-relaxed text-gray-600">
                      This bill payment is still processing.
                    </p>
                    <p className="relative mt-1 text-xl font-bold tracking-tight text-gray-900">{receipt.total_amount_display}</p>
                  </>
                ) : (
                  <>
                    <p className="relative mt-4 text-lg font-bold text-amber-800">{receipt.status_label}</p>
                    <p className="relative mx-auto mt-2 max-w-[280px] text-xs text-gray-600">Transaction details below.</p>
                    <p className="relative mt-1 text-xl font-bold text-gray-900">{receipt.total_amount_display}</p>
                  </>
                )}
              </div>

              <div className="relative z-[1] -mt-6 rounded-2xl px-4 py-1 shadow-sm" style={{ backgroundColor: DETAIL_CARD }}>
                <Row label="Amount" value={receipt.amount_display} />
                <Row label="Fee" value={receipt.fee_display} />
                <Row label="Total Amount" value={receipt.total_amount_display} />
                <Row label="Biller type" value={receipt.biller_type} />
                <Row label="Phone Number" value={receipt.phone_number} />
                <Row label="Transaction id" value={receipt.transaction_id} copyKey="txid" />
                <Row label="Transaction type" value={receipt.transaction_type} />
                <Row label="Date" value={receipt.date_display} />
              </div>

              {copied ? <p className="mt-2 text-center text-[11px] text-gray-500">Copied to clipboard</p> : null}

              <button
                type="button"
                className="mt-5 w-full rounded-full py-3.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-300/80"
                style={{ backgroundColor: "#E5E5E5" }}
                onClick={() => {
                  const text = `Bill payment\n${humanizeApiLabel(receipt.transaction_type)}\nAmount: ${receipt.amount_display}\nTotal: ${receipt.total_amount_display}\nTxn: ${receipt.transaction_id}`;
                  if (typeof navigator !== "undefined" && navigator.share) {
                    void navigator.share({ title: "Receipt", text }).catch(() => {});
                  } else {
                    void navigator.clipboard.writeText(text);
                    setCopied("share");
                    window.setTimeout(() => setCopied(null), 1600);
                  }
                }}
              >
                Share Receipt
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const BillPayments: React.FC = () => {
  const hasToken = Boolean(getAdminToken());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [billType, setBillType] = useState("all");
  const [page, setPage] = useState(1);
  const [detailRow, setDetailRow] = useState<BillPaymentListRow | null>(null);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedBills, setSelectedBills] = useState<Map<number, BillPaymentListRow>>(() => new Map());
  const [bulkBill, setBulkBill] = useState<"bulk" | "export">("bulk");
  const selectAllBillsRef = useRef<HTMLInputElement>(null);

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

  const summaryQ = useQuery({
    queryKey: ["admin", "bill-payments-summary"],
    queryFn: fetchBillPaymentSummary,
    enabled: hasToken,
  });

  const listQ = useQuery({
    queryKey: ["admin", "bill-payments", page, search, status, billType, from, to],
    queryFn: () =>
      fetchBillPayments({
        page,
        per_page: 25,
        search,
        status,
        bill_type: billType,
        from,
        to,
      }),
    enabled: hasToken,
  });

  const rows = listQ.data?.data ?? [];
  const totalPages = listQ.data?.last_page ?? 1;

  useEffect(() => {
    setSelectedBills(new Map());
  }, [page, search, status, billType, from, to]);

  const allBillsSelected = rows.length > 0 && rows.every((r) => selectedBills.has(r.id));
  const someBillsSelected = rows.some((r) => selectedBills.has(r.id));

  useEffect(() => {
    const el = selectAllBillsRef.current;
    if (!el) return;
    el.indeterminate = someBillsSelected && !allBillsSelected;
  }, [allBillsSelected, someBillsSelected, rows]);

  const toggleBillRow = (r: BillPaymentListRow) => {
    setSelectedBills((prev) => {
      const next = new Map(prev);
      if (next.has(r.id)) next.delete(r.id);
      else next.set(r.id, r);
      return next;
    });
  };

  const toggleAllBillsOnPage = () => {
    const all = rows.length > 0 && rows.every((r) => selectedBills.has(r.id));
    setSelectedBills((prev) => {
      const next = new Map(prev);
      if (all) {
        rows.forEach((r) => next.delete(r.id));
      } else {
        rows.forEach((r) => next.set(r.id, r));
      }
      return next;
    });
  };

  const onBulkBillChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as "bulk" | "export";
    setBulkBill("bulk");
    if (v !== "export") return;
    const list = Array.from(selectedBills.values());
    if (list.length === 0) {
      window.alert("Select at least one row to export.");
      return;
    }
    downloadCsv(
      "bill-payments",
      [
        "id",
        "transaction_id",
        "reference",
        "user_name",
        "user_email",
        "amount",
        "total_amount",
        "currency",
        "status_label",
        "service_label",
        "bill_category",
        "created_at",
      ],
      list.map((r) => [
        r.id,
        r.transaction_id,
        r.reference,
        r.user?.display_name ?? "",
        r.user?.email ?? "",
        r.amount,
        r.total_amount,
        r.currency,
        r.status_label,
        r.service_label,
        r.bill_category ?? "",
        r.created_at ?? "",
      ])
    );
  };

  const naira = (s: string) => {
    const n = Number(s);
    if (Number.isNaN(n)) return `₦${s}`;
    return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Bill Payments</h1>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[220px]">
          <div className="relative w-full">
            <select
              className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-gray-800 shadow-sm"
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
              <option value="custom">Custom range</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
          </div>
          {datePreset === "custom" ? (
            <div className="flex w-full flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-600">From</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  setPage(1);
                }}
                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B800F]/30"
              />
              <span className="text-xs font-medium text-gray-600">To</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  setPage(1);
                }}
                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B800F]/30"
              />
            </div>
          ) : null}
        </div>
      </div>

      {!hasToken ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Log in as <strong>admin</strong> to load bill payment data from the API.
        </div>
      ) : null}

      <section
        className="grid grid-cols-1 gap-4 rounded-3xl p-5 md:grid-cols-3 md:gap-5 md:p-7"
        style={{ background: "linear-gradient(135deg, #166534 0%, #15803d 45%, #14532d 100%)" }}
      >
        {[
          {
            label: "Total Users",
            sub: "View total users",
            value: summaryQ.data?.users_with_bill_payments ?? "—",
            icon: Users,
          },
          {
            label: "No of Txn",
            sub: "Bill payment transactions",
            value: summaryQ.data?.total_bill_transactions ?? "—",
            icon: Users,
          },
          {
            label: "Revenue",
            sub: "Bill payment revenue",
            value: summaryQ.data ? naira(summaryQ.data.total_revenue_ngn) : "—",
            icon: Users,
          },
        ].map((c) => (
          <div
            key={c.label}
            className="flex min-h-[120px] overflow-hidden rounded-2xl shadow-md"
            style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(34,197,94,0.35) 100%)" }}
          >
            <div className="flex flex-1 flex-col justify-center gap-1 px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <c.icon className="h-5 w-5 text-white" />
                </span>
                <span className="text-sm font-semibold">{c.label}</span>
              </div>
              <p className="text-[11px] text-white/80">{c.sub}</p>
              <p className="text-2xl font-bold tracking-tight md:text-3xl">{c.value}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-full px-4 py-2 text-sm font-semibold text-gray-800"
          style={{ backgroundColor: "#E8E8E8" }}
          aria-label="Transaction status"
        >
          <option value="all">All statuses</option>
          <option value="successful">Successful</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={billType}
          onChange={(e) => {
            setBillType(e.target.value);
            setPage(1);
          }}
          className="rounded-full px-4 py-2 text-sm font-semibold text-gray-800"
          style={{ backgroundColor: "#E8E8E8" }}
          aria-label="Bill type"
        >
          <option value="all">All bill types</option>
          <option value="airtime">Airtime</option>
          <option value="data">Data</option>
          <option value="cable_tv">Cable TV</option>
          <option value="electricity">Electricity</option>
          <option value="betting">Betting</option>
        </select>
        <div className="relative">
          <select
            value={bulkBill}
            onChange={onBulkBillChange}
            className="cursor-pointer appearance-none rounded-full border-0 py-2 pl-4 pr-9 text-sm font-semibold text-gray-800"
            style={{ backgroundColor: "#E8E8E8" }}
            aria-label="Bulk action"
          >
            <option value="bulk">Bulk Action</option>
            <option value="export">Export</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: HEADER_GREEN }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">Bill Payment Transactions</h2>
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
              style={{ backgroundColor: HEADER_SEARCH }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: COL_HEADER }}>
                <th className="w-10 px-3 py-3">
                  <input
                    ref={selectAllBillsRef}
                    type="checkbox"
                    checked={allBillsSelected}
                    onChange={toggleAllBillsOnPage}
                    className="accent-[#21D721]"
                    aria-label="Select all on this page"
                  />
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Transaction id</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Service</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {hasToken && listQ.isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    No bill payment transactions found.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => {
                  const name = r.user?.display_name ?? "—";
                  const avatar = avatarUrlForName(name);
                  return (
                    <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? ROW_A : ROW_B }} className="border-t border-gray-100">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedBills.has(r.id)}
                          onChange={() => toggleBillRow(r)}
                          className="accent-[#21D721]"
                          aria-label={`Select ${r.id}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white" width={36} height={36} />
                          <span className="font-semibold text-gray-900">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-800">{r.transaction_id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {r.currency === "NGN" ? naira(r.total_amount) : `${r.total_amount} ${r.currency}`}
                      </td>
                      <td className="px-4 py-3 w-[150px]">
                        <span
                          className="inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: r.status_label === "Successful" ? "#DCFCE7" : "#FEF3C7",
                            color: r.status_label === "Successful" ? "#166534" : "#92400E",
                          }}
                        >
                          {r.status_label === "Successful" ? (
                            <img src={SUCCESS_ICON} alt="" className="h-4 w-4 shrink-0 object-contain" width={16} height={16} />
                          ) : r.status_label === "Pending" ? (
                            <img src={PENDING_ICON} alt="" className="h-4 w-4 shrink-0 object-contain" width={16} height={16} />
                          ) : null}
                          <span className="truncate">{r.status_label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800">{r.service_label}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatTableDate(r.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setDetailRow(r)}
                          className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm"
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

        {hasToken && totalPages > 1 ? (
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

        {listQ.isError ? (
          <p className="px-5 py-3 text-sm text-red-600">
            {(listQ.error as ApiError)?.message ?? "Failed to load transactions."}
          </p>
        ) : null}
      </section>

      {detailRow ? <BillReceiptModal row={detailRow} onClose={() => setDetailRow(null)} /> : null}
    </div>
  );
};

export default BillPayments;
