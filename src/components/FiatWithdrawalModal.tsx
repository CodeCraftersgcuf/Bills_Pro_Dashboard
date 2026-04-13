import React, { useEffect, useState } from "react";
import { ChevronDown, Info, X } from "lucide-react";
import type { WithdrawalAccount } from "../data/users";

const GREEN_DARK = "#1B800F";
const GREEN_LIGHT = "#42AC36";
const INPUT_BG = "#E4E4E7";
const FEE_BOX = "#FFF7ED";
const BTN_GREEN = "#42AC36";

export interface FiatWithdrawalModalProps {
  open: boolean;
  onClose: () => void;
  balanceFormatted: string;
  withdrawalAccounts: WithdrawalAccount[];
  feeFormatted?: string;
}

const FiatWithdrawalModal: React.FC<FiatWithdrawalModalProps> = ({
  open,
  onClose,
  balanceFormatted,
  withdrawalAccounts,
  feeFormatted = "₦200",
}) => {
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    if (!open) {
      setAmount("");
      setAccountId("");
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || withdrawalAccounts.length === 0) return;
    const def = withdrawalAccounts.find((a) => a.isDefault)?.id ?? withdrawalAccounts[0]?.id;
    if (def) setAccountId(def);
  }, [open, withdrawalAccounts]);

  if (!open) return null;

  const titleId = "fiat-withdraw-modal-title";

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
        className="relative z-[1] flex max-h-[min(92vh,640px)] w-full max-w-[440px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 pb-4 pt-5 md:px-6">
          <h2 id={titleId} className="text-lg font-bold text-gray-900">
            Fiat Withdrawal
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
          <div className="overflow-hidden rounded-2xl shadow-md">
            <div className="px-5 py-5 text-white" style={{ background: `linear-gradient(135deg, ${GREEN_DARK} 0%, #156b0c 100%)` }}>
              <p className="text-xs font-medium text-white/85">My Balance</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{balanceFormatted}</p>
            </div>
            <div
              className="flex items-center gap-3 px-4 py-3.5 text-white"
              style={{ backgroundColor: GREEN_LIGHT }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/25 text-lg" aria-hidden>
                🇳🇬
              </span>
              <div>
                <p className="text-sm font-semibold">Instant Transfer</p>
                <p className="text-xs text-white/90">Fee: {feeFormatted}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="fiat-wd-amount" className="mb-2 block text-sm font-bold text-gray-900">
              Amount
            </label>
            <input
              id="fiat-wd-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="Enter Amount"
              className="w-full rounded-xl border-0 px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B800F]/30"
              style={{ backgroundColor: INPUT_BG }}
              inputMode="decimal"
            />
          </div>

          <div className="mt-5">
            <label htmlFor="fiat-wd-account" className="mb-2 block text-sm font-bold text-gray-900">
              Account
            </label>
            {withdrawalAccounts.length === 0 ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                No withdrawal accounts on file for this user.
              </p>
            ) : (
              <div className="relative">
                <select
                  id="fiat-wd-account"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border-0 px-4 py-3.5 pr-11 text-[15px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B800F]/30"
                  style={{ backgroundColor: INPUT_BG }}
                  aria-label="Select withdrawal account"
                >
                  <option value="" disabled>
                    Select withdrawal account
                  </option>
                  {withdrawalAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} — {a.bankName} · {a.accountNumber}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              </div>
            )}
          </div>

          <div
            className="mt-5 flex items-center gap-2 rounded-xl border border-amber-200/80 px-3 py-2.5 text-sm text-amber-950"
            style={{ backgroundColor: FEE_BOX }}
          >
            <Info className="h-4 w-4 shrink-0 text-amber-700" strokeWidth={2} />
            <span>Fee : {feeFormatted}</span>
          </div>

          <button
            type="button"
            disabled={withdrawalAccounts.length === 0}
            className="mt-6 w-full rounded-full py-3.5 text-base font-bold text-white shadow-md transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: BTN_GREEN }}
            onClick={onClose}
          >
            Confirm withdrawal
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiatWithdrawalModal;
