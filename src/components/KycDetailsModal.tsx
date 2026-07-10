import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchAdminKycFaceVideoBlobUrl } from "../api/adminKyc";

const GREEN = "#1B800F";

const inputClass =
  "w-full rounded-2xl border-0 bg-[#DCDCDE] px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B800F]/35";

const readOnlyClass =
  "w-full rounded-2xl border-0 bg-[#E8E8EA] px-4 py-3.5 text-[15px] text-gray-800";

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
  userId?: number | null;
  rejectionReason?: string;
  hasFaceVerificationVideo?: boolean;
  faceVerificationSubmittedAt?: string;
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
  loading?: boolean;
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-800">{label}</label>
      <input className={readOnlyClass} value={value || "—"} readOnly />
    </div>
  );
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
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

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
      setRejectReason("");
      setShowRejectForm(false);
      setVideoError(null);
      setVideoLoading(false);
      setVideoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    const userId = initial?.userId;
    const hasVideo = Boolean(initial?.hasFaceVerificationVideo);
    if (!userId || !hasVideo) {
      setVideoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setVideoError(null);
      return;
    }

    let cancelled = false;
    setVideoLoading(true);
    setVideoError(null);

    fetchAdminKycFaceVideoBlobUrl(userId)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        setVideoUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setVideoError(err instanceof Error ? err.message : "Failed to load video.");
      })
      .finally(() => {
        if (!cancelled) setVideoLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, initial?.userId, initial?.hasFaceVerificationVideo]);

  if (!open) return null;

  const handleReject = () => {
    const reason = rejectReason.trim();
    if (!reason) {
      setShowRejectForm(true);
      return;
    }
    onReject?.(reason);
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
        className="relative z-[1] flex w-full min-h-0 max-h-[min(90dvh,calc(100vh-2rem))] max-w-[640px] flex-col overflow-hidden rounded-3xl bg-[#F3F4F6] shadow-2xl"
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
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-base font-bold text-gray-900">User submitted fields</h3>
                <Field label="First name" value={initial?.firstName ?? ""} />
                <Field label="Last name" value={initial?.lastName ?? ""} />
                <Field label="Email" value={initial?.email ?? ""} />
                <Field label="Date of birth" value={initial?.dateOfBirth ?? ""} />
                <Field label="Location" value={initial?.location ?? ""} />
                <Field label="NIN" value={initial?.nin ?? ""} />
                <Field label="BVN" value={initial?.bvn ?? ""} />
                <Field label="Status" value={initial?.status ?? ""} />
                {initial?.rejectionReason ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800">
                      Previous rejection reason
                    </label>
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      {initial.rejectionReason}
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="space-y-3 border-t border-gray-300/70 pt-5">
                <h3 className="text-base font-bold text-gray-900">Face verification video</h3>
                {!initial?.hasFaceVerificationVideo ? (
                  <p className="text-sm text-gray-500">No face verification video submitted.</p>
                ) : (
                  <>
                    {initial.faceVerificationSubmittedAt ? (
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(initial.faceVerificationSubmittedAt).toLocaleString()}
                      </p>
                    ) : null}
                    {videoLoading ? (
                      <p className="text-sm text-gray-600">Loading video…</p>
                    ) : videoError ? (
                      <p className="text-sm text-red-600">{videoError}</p>
                    ) : videoUrl ? (
                      <video
                        src={videoUrl}
                        controls
                        playsInline
                        className="w-full max-h-[360px] rounded-2xl bg-black"
                      />
                    ) : null}
                  </>
                )}
              </section>

              {(initial?.ninVerificationData ||
                initial?.bvnVerificationData ||
                initial?.ninVerificationStatus ||
                initial?.bvnVerificationStatus) && (
                <section className="space-y-4 border-t border-gray-300/70 pt-5">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">NIN / BVN API result</h3>
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
                </section>
              )}

              {showRejectForm || rejectReason ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800">
                    Rejection reason
                  </label>
                  <textarea
                    className={`${inputClass} min-h-[96px] resize-y`}
                    placeholder="Explain why this KYC is rejected…"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3 pt-2">
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
                  onClick={() => {
                    if (!showRejectForm && !rejectReason.trim()) {
                      setShowRejectForm(true);
                      return;
                    }
                    handleReject();
                  }}
                  disabled={busy || !onReject}
                  className="rounded-full bg-[#FEE2E2] py-3 text-sm font-bold text-[#B91C1C] disabled:opacity-50"
                  style={showRejectForm || rejectReason ? { backgroundColor: GREEN, color: "#fff" } : undefined}
                >
                  {showRejectForm || rejectReason ? "Confirm reject" : "Reject"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KycDetailsModal;
