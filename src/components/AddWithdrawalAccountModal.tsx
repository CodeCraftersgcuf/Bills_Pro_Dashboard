import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const GREEN_SAVE = "#42AC36";

const inputClass =
  "w-full rounded-[10px] border-0 bg-[#E8E8EA] px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B800F]/35";

export interface AddWithdrawalAccountFormValues {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface AddWithdrawalAccountModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after successful Save (replace with API). */
  onSave?: (values: AddWithdrawalAccountFormValues) => void;
}

const AddWithdrawalAccountModal: React.FC<AddWithdrawalAccountModalProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setBankName("");
      setAccountNumber("");
      setAccountName("");
    }
  }, [open]);

  if (!open) return null;

  const titleId = "add-withdrawal-account-modal-title";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.({ bankName: bankName.trim(), accountNumber: accountNumber.trim(), accountName: accountName.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
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
        className="relative z-[1] w-full max-w-[560px] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 px-6 pb-4 pt-6 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="text-xl font-bold text-gray-900">
              Add New Account
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
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-8 pt-6 md:px-8">
          <div className="space-y-5">
            <div>
              <label htmlFor="add-wd-bank-name" className="mb-2 block text-sm font-semibold text-gray-800">
                Bank name
              </label>
              <input
                id="add-wd-bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Enter bank name"
                className={inputClass}
                autoComplete="organization"
              />
            </div>
            <div>
              <label htmlFor="add-wd-account-number" className="mb-2 block text-sm font-semibold text-gray-800">
                Account Number
              </label>
              <input
                id="add-wd-account-number"
                inputMode="numeric"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter account number"
                className={inputClass}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="add-wd-account-name" className="mb-2 block text-sm font-semibold text-gray-800">
                Account Name
              </label>
              <input
                id="add-wd-account-name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter account name"
                className={inputClass}
                autoComplete="name"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-8 w-full rounded-full py-3.5 text-base font-bold text-white shadow-md transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B800F]/50"
            style={{ backgroundColor: GREEN_SAVE }}
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddWithdrawalAccountModal;
