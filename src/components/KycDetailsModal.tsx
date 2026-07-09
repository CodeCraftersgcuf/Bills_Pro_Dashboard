import React, { useEffect, useState } from "react";
import { X, ChevronDown } from "lucide-react";

const GREEN = "#1B800F";

const inputClass =
  "w-full rounded-2xl border-0 bg-[#DCDCDE] px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B800F]/35";

const SKIP_VERIFY_KEYS = new Set([
  "photo",
  "base64Image",
  "photo_present",
  "base64Image_present",
]);

export type KycDetailsInitial = {
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  dateOfBirth?: string;
  nin?: string;
  bvn?: string;
  location?: string;
  ninVerificationStatus?: string;
  bvnVerificationStatus?: string;
  ninVerificationReportId?: string;
  bvnVerificationReportId?: string;
  identityVerifiedAt?: string;
  ninVerificationData?: Record<string, unknown> | null;
  bvnVerificationData?: Record<string, unknown> | null;
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

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatVerifyValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function VerificationDataBlock({
  title,
  status,
  reportId,
  data,
}: {
  title: string;
  status?: string;
  reportId?: string;
  data?: Record<string, unknown> | null;
}) {
  const entries = Object.entries(data ?? {}).filter(
    ([key, value]) => !SKIP_VERIFY_KEYS.has(key) && value != null && value !== "" && typeof value !== "object"
  );

  if (!status && !reportId && entries.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-300/80 bg-white/70 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {status ? (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              status.toLowerCase() === "success"
                ? "bg-[#DCFCE7] text-[#166534]"
                : "bg-[#FEE2E2] text-[#B91C1C]"
            }`}
          >
            {status}
          </span>
        ) : null}
      </div>
      {reportId ? (
        <p className="mb-3 break-all text-xs text-gray-600">
          Report ID: <span className="font-medium text-gray-800">{reportId}</span>
        </p>
      ) : null}
      {entries.length > 0 ? (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <dt className="text-xs font-medium text-gray-500">{formatLabel(key)}</dt>
              <dd className="mt-0.5 break-words text-sm text-gray-900">{formatVerifyValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-gray-500">No provider fields stored.</p>
      )}
    </div>
  );
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
  const [location, setLocation] = useState("");
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
    setLocation(initial.location ?? "");
  }, [open, initial]);

  useEffect(() => {
    if (open) return;
    setFirstName("");
    setLastName("");
    setEmail("");
    setDob("");
    setNin("");
    setBvn("");
    setLocation("");
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
        className="relative z-[1] flex w-full min-h-0 max-h-[min(90dvh,calc(100vh-2rem))] max-w-[560px] flex-col overflow-hidden rounded-3xl bg-[#F3F4F6] shadow-2xl"
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
              <label className="mb-2 block text-sm font-medium text-gray-800">Location</label>
              <input
                className={inputClass}
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                readOnly
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

            {(initial?.ninVerificationData ||
              initial?.bvnVerificationData ||
              initial?.ninVerificationStatus ||
              initial?.bvnVerificationStatus) && (
              <div className="space-y-4 border-t border-gray-300/70 pt-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Identity verification</h3>
                  {initial?.identityVerifiedAt ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Verified at: {new Date(initial.identityVerifiedAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <VerificationDataBlock
                  title="NIN provider data"
                  status={initial?.ninVerificationStatus}
                  reportId={initial?.ninVerificationReportId}
                  data={initial?.ninVerificationData}
                />
                <VerificationDataBlock
                  title="BVN provider data"
                  status={initial?.bvnVerificationStatus}
                  reportId={initial?.bvnVerificationReportId}
                  data={initial?.bvnVerificationData}
                />
              </div>
            )}
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
