import React, { useEffect, useState } from "react";
import { Landmark, Trash2, X } from "lucide-react";
import type { WithdrawalAccount } from "../data/users";
import AddWithdrawalAccountModal from "./AddWithdrawalAccountModal";

const GREEN = "#1B800F";
const GREEN_BTN = "#42AC36";
const CARD_BG = "#F3F4F6";
const DEFAULT_BADGE = "#DCFCE7";

export interface WithdrawalAccountsModalProps {
  open: boolean;
  onClose: () => void;
  accounts: WithdrawalAccount[];
  /** Shown when opening from profile header */
  userDisplayName: string;
  /** Optional — when user saves Add New Account (wire to API later). */
  onAddAccount?: (data: { bankName: string; accountNumber: string; accountName: string }) => void;
}

const WithdrawalAccountsModal: React.FC<WithdrawalAccountsModalProps> = ({
  open,
  onClose,
  accounts,
  userDisplayName,
  onAddAccount,
}) => {
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (!open) setAddOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !addOpen) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, addOpen]);

  if (!open) return null;

  const titleId = "withdrawal-accounts-modal-title";

  return (
    <>
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
        className="relative z-[1] flex max-h-[min(90vh,720px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 pb-4 pt-6 md:px-8">
          <h2 id={titleId} className="text-xl font-bold tracking-tight text-gray-900">
            Withdrawal Accounts
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="rounded-full px-5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: GREEN_BTN }}
              onClick={() => setAddOpen(true)}
            >
              Add New
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200/90 text-gray-700 transition-colors hover:bg-gray-300"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 md:px-8 md:py-6">
          {accounts.length === 0 ? (
            <p className="rounded-2xl bg-[#F9FAFB] px-4 py-8 text-center text-sm text-gray-600">
              No bank accounts linked for {userDisplayName}.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {accounts.map((acc) => (
                <li
                  key={acc.id}
                  className="relative rounded-[20px] p-4 shadow-sm"
                  style={{ backgroundColor: CARD_BG }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-2.5">
                      <Landmark
                        className="mt-0.5 h-5 w-5 shrink-0"
                        style={{ color: GREEN }}
                        strokeWidth={2}
                        aria-hidden
                      />
                      <span className="text-sm font-semibold" style={{ color: GREEN }}>
                        {acc.label}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-black/5 hover:text-red-600"
                        aria-label={`Delete ${acc.label}`}
                        onClick={() => {
                          /* API hook */
                        }}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: GREEN_BTN }}
                        onClick={() => {
                          /* API hook */
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 pl-0 text-sm font-bold text-gray-900 sm:pl-7">{acc.accountHolderName}</p>
                  <p className="mt-1 pl-0 text-sm text-gray-600 sm:pl-7">
                    {acc.bankName} - {acc.accountNumber}
                  </p>
                  {acc.isDefault && (
                    <div className="pointer-events-none absolute bottom-3 right-4 sm:bottom-4">
                      <span
                        className="inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide"
                        style={{ backgroundColor: DEFAULT_BADGE, color: GREEN }}
                      >
                        default
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>

    <AddWithdrawalAccountModal
      open={addOpen}
      onClose={() => setAddOpen(false)}
      onSave={(values) => onAddAccount?.(values)}
    />
    </>
  );
};

export default WithdrawalAccountsModal;
