import React, { useEffect, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import type { ProfileTxRow } from "../data/userTransactions";

const MODAL_BG = "#F4F4F5";
const SUCCESS_BANNER = "#DCFCE7";
const SUCCESS_GREEN = "#16A34A";
const DETAIL_CARD_BG = "#E4E4E7";
const FILTER_DROPDOWN_BG = "#E5E5E5";
const PENDING_ICON = "/pending-transaction-icon.png";
const PENDING_BANNER = "#FFFBEB";

export type NairaReceiptVariant = "deposit" | "withdraw" | "bill";

export interface NairaTxReceiptModalProps {
  open: boolean;
  onClose: () => void;
  variant: NairaReceiptVariant;
  tx: ProfileTxRow;
  /** Withdrawal destination name */
  accountHolderName: string;
}

function parseNairaAmount(s: string): number {
  const n = parseFloat(s.replace(/[₦N,\s]/gi, ""));
  return Number.isNaN(n) ? 0 : n;
}

function formatNaira(n: number): string {
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function transactionTypeLabel(row: ProfileTxRow, variant: NairaReceiptVariant): string {
  if (variant === "withdraw") return "Fiat Withdrawal";
  if (variant === "bill") return row.billTransactionTypeLabel ?? "Bill Payment";
  const st = row.subType.toLowerCase();
  if (st.includes("bill")) return "Bill Payment";
  return "Fiat Deposit";
}

function successLine(row: ProfileTxRow, variant: NairaReceiptVariant): string {
  if (variant === "bill") {
    const label = (row.billTransactionTypeLabel ?? "").toLowerCase();
    if (label.includes("airtime")) {
      return `You have successfully completed an airtime recharge of ${row.amount}`;
    }
    return `You have successfully completed a bill payment of ${row.amount}`;
  }
  const st = row.subType.toLowerCase();
  if (variant === "withdraw" || st.includes("withdraw")) {
    return `You have successfully completed a withdrawal of ${row.amount}`;
  }
  return `You have successfully completed a deposit of ${row.amount}`;
}

const NairaTxReceiptModal: React.FC<NairaTxReceiptModalProps> = ({
  open,
  onClose,
  variant,
  tx,
  accountHolderName,
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  const amountNum = parseNairaAmount(tx.amount);
  const feeNum = 200;
  const totalNum = amountNum + feeNum;
  const amountStr = amountNum > 0 ? formatNaira(amountNum) : tx.amount;
  const feeStr = formatNaira(feeNum);
  const totalStr = formatNaira(totalNum);

  const includeReference = variant === "deposit";

  const bankName = includeReference ? "Gratuity Bank" : "Access Bank";
  const accountNumber = "113456789";
  const accountName = includeReference ? "Yellow card Financial" : accountHolderName;
  const reference = "123456789";
  const dateLong = "6th Nov, 2025 - 07:22 AM";

  const billerType = tx.billerType ?? "MTN";
  const billPhone = tx.billPhone ?? "070123456789";

  useEffect(() => {
    if (!open) {
      setCopied(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const copy = (key: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  };

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
        <span className="text-right text-xs font-medium break-all text-gray-900">{value}</span>
        {copyKey ? <CopyBtn k={copyKey} text={value} /> : null}
      </div>
    </div>
  );

  if (!open) return null;

  const isSuccess = tx.status === "Successful";
  const isPending = tx.status === "Pending";
  const heroBannerBg = isSuccess ? SUCCESS_BANNER : isPending ? PENDING_BANNER : "#F3F4F6";
  const txTypeLabel = transactionTypeLabel(tx, variant);
  const showHeroAmountDuplicate = variant !== "bill";

  const shareText = () => {
    if (variant === "bill") {
      return `Receipt\nAmount: ${amountStr}\nBiller: ${billerType}\nPhone: ${billPhone}\nTxn: ${tx.id}`;
    }
    if (includeReference) {
      return `Receipt\nAmount: ${amountStr}\nRef: ${reference}\nTxn: ${tx.id}`;
    }
    return `Receipt\nAmount: ${amountStr}\nTxn: ${tx.id}`;
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="naira-tx-receipt-title"
        className="relative z-[251] flex max-h-[min(90vh,720px)] w-full max-w-[400px] flex-col overflow-hidden rounded-3xl shadow-2xl"
        style={{ backgroundColor: MODAL_BG }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-5">
          <h2 id="naira-tx-receipt-title" className="text-base font-semibold text-gray-900">
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
            style={{ backgroundColor: heroBannerBg }}
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
                  {successLine(tx, variant)}
                </p>
                {showHeroAmountDuplicate ? (
                  <p className="relative mt-1 text-xl font-bold tracking-tight text-gray-900">{amountStr}</p>
                ) : null}
              </>
            ) : isPending ? (
              <>
                <div className="relative mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center">
                  <img src={PENDING_ICON} alt="" className="h-full w-full object-contain drop-shadow-md" width={72} height={72} />
                </div>
                <p className="relative mt-4 text-lg font-bold text-[#C2410C]">Pending</p>
                <p className="relative mx-auto mt-2 max-w-[280px] text-xs leading-relaxed text-gray-600">
                  This transaction is still processing.
                </p>
                <p className="relative mt-1 text-xl font-bold tracking-tight text-gray-900">{amountStr}</p>
              </>
            ) : (
              <>
                <p className="relative mt-4 text-lg font-bold text-amber-700">{tx.status}</p>
                <p className="relative mx-auto mt-2 max-w-[280px] text-xs text-gray-600">
                  Transaction details below.
                </p>
                <p className="relative mt-1 text-xl font-bold tracking-tight text-gray-900">{amountStr}</p>
              </>
            )}
          </div>

          <div
            className="relative z-[1] -mt-6 rounded-2xl px-4 py-1 shadow-sm"
            style={{ backgroundColor: DETAIL_CARD_BG }}
          >
            <Row label="Amount" value={amountStr} />
            <Row label="Fee" value={feeStr} />
            <Row label="Total Amount" value={totalStr} />

            {variant === "bill" ? (
              <>
                <Row label="Biller type" value={billerType} />
                <Row label="Phone Number" value={billPhone} />
                <Row label="Transaction id" value={tx.id} copyKey="txid" />
                <Row label="Transaction type" value={txTypeLabel} />
                <Row label="Date" value={dateLong} />
              </>
            ) : (
              <>
                <Row label="Bank Name" value={bankName} />
                <Row label="Account Number" value={accountNumber} copyKey="acct" />
                <Row label="Account Name" value={accountName} copyKey="name" />
                {includeReference ? <Row label="Reference" value={reference} copyKey="ref" /> : null}
                <Row label="Transaction id" value={tx.id} copyKey="txid" />
                <Row label="Transaction type" value={txTypeLabel} />
                <Row label="Date" value={dateLong} />
              </>
            )}
          </div>

          {copied ? (
            <p className="mt-2 text-center text-[11px] text-gray-500">Copied to clipboard</p>
          ) : null}

          <button
            type="button"
            className="mt-5 w-full rounded-full py-3.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-300/80"
            style={{ backgroundColor: FILTER_DROPDOWN_BG }}
            onClick={() => {
              const text = shareText();
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
};

export default NairaTxReceiptModal;
