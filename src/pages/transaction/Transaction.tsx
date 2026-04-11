import React, { useEffect, useState } from "react";
import {
  Users,
  Banknote,
  Coins,
  ChevronDown,
  Search,
  X,
  Check,
  Copy,
} from "lucide-react";
import StatCard from "../../components/StatCard";

const GREEN = "#1B800F";
/** Segmented filter track + dropdown fills (mock) */
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
  const isSuccess = row.status.toLowerCase() === "successful";

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
            style={{ backgroundColor: SUCCESS_BANNER }}
          >
            <div
              className="pointer-events-none absolute -bottom-6 left-1/2 h-16 w-[120%] -translate-x-1/2 rounded-[50%] bg-white/25"
              aria-hidden
            />
            {isSuccess ? (
              <>
                <div
                  className="relative mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full shadow-lg ring-4 ring-white/80"
                  style={{ backgroundColor: SUCCESS_GREEN }}
                >
                  <Check className="h-9 w-9 text-white" strokeWidth={3} />
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

const txSample: TxRow[] = [
  {
    id: "aqjj123452345224",
    name: "Qamardeen Malik",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    amount: "₦200,000",
    status: "Successful",
    type: "Naira",
    subType: "Deposit",
    date: "10/22/25 - 07:30 AM",
    detail: {
      amount: "₦200,000",
      fee: "₦200",
      totalAmount: "₦200,200",
      bankName: "Gratuity Bank",
      accountNumber: "113456789",
      accountName: "Yellow card Financial",
      reference: "123456789",
      transactionId: "2348hf8283hfc92eni",
      description: "Fiat Deposit",
      dateFormatted: "6th Nov. 2025 - 07:22 AM",
    },
  },
  {
    id: "bqkk234563456335",
    name: "Chioma Okafor",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
    amount: "₦15,500",
    status: "Successful",
    type: "Naira",
    subType: "Withdrawal",
    date: "10/21/25 - 02:15 PM",
    detail: {
      amount: "₦15,500",
      fee: "₦50",
      totalAmount: "₦15,450",
      bankName: "Access Bank",
      accountNumber: "0123456789",
      accountName: "Chioma Okafor",
      reference: "WD-882910",
      transactionId: "bqkk234563456335wd01",
      description: "Fiat Withdrawal",
      dateFormatted: "21st Oct. 2025 - 02:15 PM",
    },
  },
  {
    id: "crll345674567446",
    name: "James Peterson",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
    amount: "0.42 BTC",
    status: "Successful",
    type: "Crypto",
    subType: "Deposit",
    date: "10/20/25 - 11:00 AM",
    detail: {
      amount: "0.42 BTC",
      fee: "0.00042 BTC",
      totalAmount: "0.41958 BTC",
      bankName: "On-chain",
      accountNumber: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      accountName: "James Peterson — Wallet",
      reference: "CR-774120",
      transactionId: "crll345674567446ch01",
      description: "Crypto Deposit",
      dateFormatted: "20th Oct. 2025 - 11:00 AM",
    },
  },
  {
    id: "dsmm456785678557",
    name: "Amina Hassan",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    amount: "₦9,200",
    status: "Successful",
    type: "Naira",
    subType: "Bill Payments",
    date: "10/19/25 - 09:45 AM",
    detail: {
      amount: "₦9,200",
      fee: "₦100",
      totalAmount: "₦9,300",
      bankName: "BillsPro Pay",
      accountNumber: "9012345678",
      accountName: "Amina Hassan",
      reference: "BILL-00921",
      transactionId: "dsmm456785678557bp01",
      description: "Electricity bill",
      dateFormatted: "19th Oct. 2025 - 09:45 AM",
    },
  },
];

const Transaction: React.FC = () => {
  const [currencyTab, setCurrencyTab] = useState<CurrencyTab>("all");
  const [typePill, setTypePill] = useState<TypePill>("all");
  const [detailRow, setDetailRow] = useState<TxRow | null>(null);

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Transactions</h1>
          <div className="relative inline-flex w-full sm:w-auto">
            <select
              className="appearance-none w-full sm:w-[200px] rounded-xl bg-white/15 border border-white/25 text-white text-sm font-medium pl-4 pr-10 py-3 cursor-pointer hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/90 pointer-events-none"
              strokeWidth={2}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          <StatCard icon={Users} label="Total Txns" value="20,000" hint="View total transactions" />
          <StatCard icon={Banknote} label="Naira Txns" value="500" hint="View naira transactions" />
          <StatCard icon={Coins} label="Crypto Txns" value="500" hint="View crypto transactions" />
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
              onClick={() => setCurrencyTab(key)}
              className={tabBtn(currencyTab === key)}
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
          <div className="relative">
            <select
              className={selectClass}
              defaultValue=""
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
              defaultValue=""
              aria-label="Transaction status"
              style={{ backgroundColor: FILTER_DROPDOWN_BG }}
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
            <select
              className={selectClass}
              defaultValue=""
              aria-label="Bulk action"
              style={{ backgroundColor: FILTER_DROPDOWN_BG }}
            >
              <option value="">Bulk Action</option>
              <option value="export">Export</option>
              <option value="delete">Delete</option>
              <option value="archive">Archive</option>
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
                    type="checkbox"
                    className="h-4 w-4 rounded border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                    aria-label="Select all"
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
              {txSample.map((row, i) => (
                <tr
                  key={row.id}
                  className="align-middle"
                  style={{ backgroundColor: i % 2 === 0 ? LATEST_ROW_A : LATEST_ROW_B }}
                >
                  <td className="px-5 py-5 align-middle">
                    <input
                      type="checkbox"
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
                      className="inline-flex rounded-full px-3 py-1 text-xs font-bold text-white"
                      style={{ backgroundColor: STATUS_PILL }}
                    >
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
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Transaction;
