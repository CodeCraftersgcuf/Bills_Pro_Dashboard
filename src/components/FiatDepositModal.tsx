import React, { useEffect, useMemo, useState } from "react";
import { Copy, Info, X } from "lucide-react";
import TransactionSummaryModal from "./TransactionSummaryModal";

const GREEN_DARK = "#1B800F";
const GREEN_LIGHT = "#42AC36";
const INPUT_BG = "#E4E4E7";
const WARN_BG = "#F5E6D3";
const FEE_BOX = "#FFF7ED";
const BTN_GREEN = "#42AC36";

export type FiatDepositBankDetails = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
};

export interface FiatDepositModalProps {
  open: boolean;
  onClose: () => void;
  /** e.g. "₦10,000.00" */
  balanceFormatted: string;
  /** Shown in "Amount to deposit" banner */
  defaultDepositDisplay?: string;
  bank: FiatDepositBankDetails;
  feeFormatted?: string;
  /** After user confirms on Transaction Summary */
  onDepositConfirm?: () => void;
}

function formatNairaN(n: number): string {
  return `N${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function CopyRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-200/80 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-0.5 break-all text-sm font-semibold text-gray-900">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-800"
        aria-label={`Copy ${label}`}
      >
        <Copy className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}

const FiatDepositModal: React.FC<FiatDepositModalProps> = ({
  open,
  onClose,
  balanceFormatted,
  defaultDepositDisplay = "250,000",
  bank,
  feeFormatted = "₦200",
  onDepositConfirm,
}) => {
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [amountError, setAmountError] = useState(false);

  const feeAmountNum = useMemo(() => {
    const m = feeFormatted.replace(/[^\d.]/g, "");
    const n = parseFloat(m);
    return Number.isNaN(n) ? 200 : n;
  }, [feeFormatted]);

  const depositBannerAmount = useMemo(() => {
    if (!amount.trim()) return defaultDepositDisplay;
    const n = parseFloat(amount.replace(/,/g, ""));
    if (Number.isNaN(n)) return defaultDepositDisplay;
    return n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
  }, [amount, defaultDepositDisplay]);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setCopied(null);
      setSummaryOpen(false);
      setAmountError(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (summaryOpen) setSummaryOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, summaryOpen]);

  const depositAmountNum = useMemo(() => {
    const n = parseFloat(amount.replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n;
  }, [amount]);

  const summaryLines = useMemo(() => {
    const total = depositAmountNum + feeAmountNum;
    return {
      amount: formatNairaN(depositAmountNum),
      fee: formatNairaN(feeAmountNum),
      total: formatNairaN(total),
    };
  }, [depositAmountNum, feeAmountNum]);

  const copy = (key: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  };

  if (!open) return null;

  const titleId = "fiat-deposit-modal-title";

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] flex max-h-[min(92vh,760px)] w-full max-w-[440px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 pb-4 pt-5 md:px-6">
          <h2 id={titleId} className="text-lg font-bold text-gray-900">
            Fiat Deposit
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200/90 text-gray-700 transition-colors hover:bg-gray-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {/* Balance card */}
          <div className="overflow-hidden rounded-2xl shadow-md">
            <div className="px-5 py-5 text-white" style={{ background: `linear-gradient(135deg, ${GREEN_DARK} 0%, #156b0c 100%)` }}>
              <p className="text-xs font-medium text-white/85">My Balance</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{balanceFormatted}</p>
            </div>
            <div
              className="flex items-center gap-3 px-4 py-3.5 text-white"
              style={{ backgroundColor: GREEN_LIGHT }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/25 text-lg"
                aria-hidden
              >
                🇳🇬
              </span>
              <div>
                <p className="text-sm font-semibold">Instant Transfer</p>
                <p className="text-xs text-white/90">Fee: {feeFormatted}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="fiat-deposit-amount" className="mb-2 block text-sm font-bold text-gray-900">
              Amount
            </label>
            <input
              id="fiat-deposit-amount"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value.replace(/[^\d.]/g, ""));
                setAmountError(false);
              }}
              placeholder="Enter Amount"
              className="w-full rounded-xl border-0 px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B800F]/30"
              style={{ backgroundColor: INPUT_BG }}
              inputMode="decimal"
            />
          </div>

          {/* Deposit instructions */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-[#FAFAFA] shadow-sm">
            <div className="flex items-baseline justify-between gap-3 px-4 py-3.5 text-white" style={{ backgroundColor: GREEN_DARK }}>
              <span className="text-sm font-semibold">Amount to deposit</span>
              <span className="text-xl font-bold tabular-nums">{depositBannerAmount}</span>
            </div>
            <div className="px-3 py-2 text-center text-[11px] font-medium leading-snug text-amber-900" style={{ backgroundColor: WARN_BG }}>
              Ensure you deposit to this exact bank account to avoid loss of funds
            </div>
            <div className="px-4 pb-2 pt-1">
              <CopyRow label="Bank Name" value={bank.bankName} onCopy={() => copy("bank", bank.bankName)} />
              <CopyRow label="Account Number" value={bank.accountNumber} onCopy={() => copy("acct", bank.accountNumber)} />
              <CopyRow label="Account Name" value={bank.accountName} onCopy={() => copy("name", bank.accountName)} />
              <CopyRow label="Reference" value={bank.reference} onCopy={() => copy("ref", bank.reference)} />
            </div>
          </div>

          {copied ? <p className="mt-2 text-center text-[11px] text-gray-500">Copied to clipboard</p> : null}

          <div
            className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200/80 px-3 py-2.5 text-sm text-amber-950"
            style={{ backgroundColor: FEE_BOX }}
          >
            <Info className="h-4 w-4 shrink-0 text-amber-700" strokeWidth={2} />
            <span>
              Fee : {feeFormatted}
            </span>
          </div>

          {amountError ? (
            <p className="mt-3 text-center text-sm font-medium text-red-600">Enter a valid amount to continue.</p>
          ) : null}

          <button
            type="button"
            className="mt-6 w-full rounded-full py-3.5 text-base font-bold text-white shadow-md transition-opacity hover:opacity-95"
            style={{ backgroundColor: BTN_GREEN }}
            onClick={() => {
              if (depositAmountNum <= 0) {
                setAmountError(true);
                return;
              }
              setAmountError(false);
              setSummaryOpen(true);
            }}
          >
            Proceed
          </button>
        </div>
      </div>

      <TransactionSummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        onProceed={() => {
          setSummaryOpen(false);
          onDepositConfirm?.();
          onClose();
        }}
        amountDisplay={summaryLines.amount}
        feeDisplay={summaryLines.fee}
        totalDisplay={summaryLines.total}
        bankName={bank.bankName}
        accountNumber={bank.accountNumber}
        accountName={bank.accountName}
        reference={bank.reference}
      />
    </div>
  );
};

export default FiatDepositModal;
