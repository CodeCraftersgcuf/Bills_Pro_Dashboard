import React, { useEffect, useState } from "react";
import { AlertTriangle, Copy, X } from "lucide-react";

const ORANGE = "#EA580C";
const ORANGE_BG = "#FFF7ED";
const GREEN = "#42AC36";
const GRAY_ROW = "#F4F4F5";
const CANCEL_BG = "#E8E8EA";

export interface TransactionSummaryModalProps {
  open: boolean;
  onClose: () => void;
  /** Called when user taps Proceed */
  onProceed: () => void;
  /** e.g. N200,000 — shown in message and Amount row */
  amountDisplay: string;
  feeDisplay: string;
  totalDisplay: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
}

function DetailLine({
  label,
  value,
  copyable,
  onCopy,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-200/90 py-3 last:border-b-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-right text-sm font-semibold text-gray-900">{value}</span>
        {copyable && onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-800"
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

const TransactionSummaryModal: React.FC<TransactionSummaryModalProps> = ({
  open,
  onClose,
  onProceed,
  amountDisplay,
  feeDisplay,
  totalDisplay,
  bankName,
  accountNumber,
  accountName,
  reference,
}) => {
  const [copied, setCopied] = useState<string | null>(null);

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

  if (!open) return null;

  const titleId = "transaction-summary-modal-title";

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4">
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
        className="relative z-[1] flex max-h-[min(92vh,680px)] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 pb-4 pt-5 md:px-6">
          <h2 id={titleId} className="text-lg font-bold text-gray-900">
            Summary
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-6">
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: ORANGE_BG }}
            >
              <AlertTriangle className="h-9 w-9" style={{ color: ORANGE }} strokeWidth={2} aria-hidden />
            </div>
            <p className="mt-4 text-2xl font-bold" style={{ color: ORANGE }}>
              Pending
            </p>
            <p className="mt-2 max-w-[320px] text-sm leading-relaxed text-gray-600">
              You are about to make a deposit of{" "}
              <span className="font-bold text-gray-900">{amountDisplay}</span>
            </p>
          </div>

          <div className="mt-6 rounded-2xl px-4 py-1" style={{ backgroundColor: GRAY_ROW }}>
            <DetailLine label="Amount" value={amountDisplay} />
            <DetailLine label="Fee" value={feeDisplay} />
            <DetailLine label="Total Amount" value={totalDisplay} />
            <DetailLine label="Bank Name" value={bankName} />
            <DetailLine
              label="Account Number"
              value={accountNumber}
              copyable
              onCopy={() => copy("acct", accountNumber)}
            />
            <DetailLine
              label="Account Name"
              value={accountName}
              copyable
              onCopy={() => copy("name", accountName)}
            />
            <DetailLine
              label="Reference"
              value={reference}
              copyable
              onCopy={() => copy("ref", reference)}
            />
          </div>

          {copied ? <p className="mt-2 text-center text-[11px] text-gray-500">Copied to clipboard</p> : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-full py-3.5 text-base font-bold text-gray-800 transition-colors hover:bg-gray-300/80"
              style={{ backgroundColor: CANCEL_BG }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-full py-3.5 text-base font-bold text-white shadow-md transition-opacity hover:opacity-95"
              style={{ backgroundColor: GREEN }}
              onClick={() => {
                onProceed();
              }}
            >
              Proceed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionSummaryModal;
