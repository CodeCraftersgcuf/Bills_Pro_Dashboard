import React, { useEffect, useState } from "react";
import { X, ChevronDown } from "lucide-react";

const GREEN = "#1B800F";

const inputClass =
  "w-full rounded-2xl border-0 bg-[#DCDCDE] px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B800F]/35";

export type KycDetailsInitial = {
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  dateOfBirth?: string;
  nin?: string;
  bvn?: string;
};

interface KycDetailsModalProps {
  open: boolean;
  onClose: () => void;
  initial: KycDetailsInitial | null;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  busy?: boolean;
  /** When true, `GET /admin/kyc/{user}` is in flight — form is hidden until `initial` is set. */
  loading?: boolean;
  /** Shown when the KYC detail request failed (e.g. network or 403). */
  errorMessage?: string | null;
}

const KycDetailsModal: React.FC<KycDetailsModalProps> = ({
  open,
  onClose,
  initial,
  onApprove,
  onReject,
  busy = false,
  loading = false,
  errorMessage = null,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [nin, setNin] = useState("");
  const [bvn, setBvn] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !initial) return;
    setFirstName(initial.firstName);
    setLastName(initial.lastName);
    setEmail(initial.email);
    setStatus(initial.status);
    setDob(initial.dateOfBirth ?? "");
    setNin(initial.nin ?? "");
    setBvn(initial.bvn ?? "");
  }, [open, initial]);

  useEffect(() => {
    if (open) return;
    setFirstName("");
    setLastName("");
    setEmail("");
    setDob("");
    setNin("");
    setBvn("");
    setStatus("");
  }, [open]);

  if (!open) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex min-h-0 items-center justify-center overflow-y-auto p-4 py-8">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kyc-details-modal-title"
        className="relative z-[1] flex w-full min-h-0 max-h-[min(90dvh,calc(100vh-2rem))] max-w-[480px] flex-col overflow-hidden rounded-3xl bg-[#F3F4F6] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-gray-300/70 px-6 pb-4 pt-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id="kyc-details-modal-title" className="text-xl font-bold text-gray-900">
              KYC Details
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-300/90 text-gray-700 transition-colors hover:bg-gray-400"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-6 [-webkit-overflow-scrolling:touch]">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-600">Loading KYC…</div>
        ) : errorMessage ? (
          <div className="py-2">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        ) : (
        <form onSubmit={handleSave} className="space-y-0">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">First name</label>
              <input
                className={inputClass}
                placeholder="Enter first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">Last name</label>
              <input
                className={inputClass}
                placeholder="Enter last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">Email</label>
              <input
                type="email"
                className={inputClass}
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">Date of birth</label>
              <input
                className={inputClass}
                placeholder="Enter date of birth"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                autoComplete="bday"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">NIN</label>
              <input
                className={inputClass}
                placeholder="Enter NIN number"
                value={nin}
                onChange={(e) => setNin(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">BVN</label>
              <input
                className={inputClass}
                placeholder="Enter BVN number"
                value={bvn}
                onChange={(e) => setBvn(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">Status</label>
              <div className="relative">
                <select
                  className={`${inputClass} appearance-none cursor-pointer pr-11`}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  aria-label="Change status"
                >
                  <option value="">Change status</option>
                  <option value="Verified">Verified</option>
                  <option value="Unverified">Unverified</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600"
                  strokeWidth={2}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-8 w-full rounded-full py-3.5 text-center text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: GREEN }}
          >
            Save
          </button>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onApprove}
              disabled={busy || !onApprove}
              className="rounded-full bg-[#DCFCE7] py-3 text-sm font-bold text-[#166534] disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => onReject?.("Rejected by admin")}
              disabled={busy || !onReject}
              className="rounded-full bg-[#FEE2E2] py-3 text-sm font-bold text-[#B91C1C] disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </form>
        )}
        </div>
      </div>
    </div>
  );
};

export default KycDetailsModal;
