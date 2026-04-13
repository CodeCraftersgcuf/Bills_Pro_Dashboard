import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, X } from "lucide-react";
import {
  adminFreezeVirtualCard,
  adminUnfreezeVirtualCard,
  fetchAdminVirtualCard,
} from "../api/adminVirtualCards";
import { virtualCardSurfaceStyle } from "../utils/virtualCardSurface";

const GREEN = "#1B800F";
const RED_FREEZE = "#DC2626";

function formatPan(pan: string): string {
  const d = pan.replace(/\D/g, "");
  return d.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export interface VirtualCardDetailsModalProps {
  open: boolean;
  cardId: number | null;
  holderName: string;
  onClose: () => void;
  userId: string;
}

type MainTab = "details" | "billing" | "limit";
type BillingSub = "ng" | "us";

const VirtualCardDetailsModal: React.FC<VirtualCardDetailsModalProps> = ({
  open,
  cardId,
  holderName,
  onClose,
  userId,
}) => {
  const qc = useQueryClient();
  const [mainTab, setMainTab] = useState<MainTab>("details");
  const [billingSub, setBillingSub] = useState<BillingSub>("ng");
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "virtual-card", cardId],
    queryFn: () => fetchAdminVirtualCard(cardId!),
    enabled: open && cardId != null,
  });

  useEffect(() => {
    if (!open) {
      setMainTab("details");
      setBillingSub("ng");
      setReveal(false);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const freezeMut = useMutation({
    mutationFn: async () => {
      if (!cardId) return;
      const frozen = Boolean(q.data?.is_frozen);
      if (frozen) await adminUnfreezeVirtualCard(cardId);
      else await adminFreezeVirtualCard(cardId);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "vcards", userId] });
      await qc.invalidateQueries({ queryKey: ["admin", "vctx"] });
      await qc.invalidateQueries({ queryKey: ["admin", "vc-summary"] });
      await qc.invalidateQueries({ queryKey: ["admin", "vc-users-overview"] });
      await qc.invalidateQueries({ queryKey: ["admin", "virtual-card", cardId] });
      await q.refetch();
    },
  });

  const copy = (key: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1500);
  };

  if (!open || cardId == null) return null;

  const card = q.data;
  const colorKey = String(card?.card_color ?? "green");
  const balance = card?.balance != null ? `$${Number(card.balance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
  const pan = typeof card?.card_number === "string" ? card.card_number : "";
  const masked = pan ? `**** **** **** ${pan.slice(-4)}` : "**** **** **** ****";
  const displayPan = reveal && pan ? formatPan(pan) : masked;
  const cvv = typeof card?.cvv === "string" ? card.cvv : "***";
  const exp =
    card?.expiry_month && card?.expiry_year
      ? `${String(card.expiry_month).padStart(2, "0")}/${String(card.expiry_year).slice(-2)}`
      : "—";
  const cardTitle = typeof card?.card_name === "string" ? card.card_name : holderName;
  const isFrozen = Boolean(card?.is_frozen);

  const streetNg = String(card?.billing_address_street ?? "");
  const cityNg = String(card?.billing_address_city ?? "");
  const stateNg = String(card?.billing_address_state ?? "");
  const countryNg = String(card?.billing_address_country ?? "");
  const postalNg = String(card?.billing_address_postal_code ?? "");

  const meta = card?.metadata as Record<string, unknown> | undefined;
  const usAddr = meta?.us_billing_address as Record<string, string> | undefined;

  return (
    <div className="fixed inset-0 z-[270] flex items-center justify-center p-4 sm:p-6" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[271] flex max-h-[min(92vh,800px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Virtual card details</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={freezeMut.isPending || q.isLoading}
              onClick={() => freezeMut.mutate()}
              className="rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: RED_FREEZE }}
            >
              {isFrozen ? "Unfreeze Card" : "Freeze Card"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4">
          {q.isLoading && <p className="text-sm text-gray-500">Loading card…</p>}
          {q.isError && (
            <p className="text-sm text-red-600">{(q.error as Error)?.message ?? "Could not load card."}</p>
          )}

          {!q.isLoading && card && (
            <>
              <div className="rounded-xl bg-gray-100 p-1">
                <div className="flex gap-1">
                  {(
                    [
                      ["details", "Card Details"],
                      ["billing", "Billing Address"],
                      ["limit", "Card Limit"],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setMainTab(k)}
                      className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors md:text-sm ${
                        mainTab === k ? "text-white shadow-sm" : "text-gray-600 hover:bg-white/80"
                      }`}
                      style={mainTab === k ? { backgroundColor: GREEN } : undefined}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {mainTab === "details" && (
                <div className="mt-5 space-y-5">
                  <div
                    className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
                    style={virtualCardSurfaceStyle(colorKey)}
                  >
                    <div className="relative flex justify-between gap-2 text-xs font-medium text-white/90">
                      <span>Online Payment Virtual Card</span>
                      <span className="font-bold text-white">Bills Pro</span>
                    </div>
                    <div className="relative mt-4 flex items-center gap-2">
                      <span className="text-2xl font-bold">{balance}</span>
                      <button
                        type="button"
                        onClick={() => setReveal(!reveal)}
                        className="rounded-full p-1.5 text-white/85 hover:bg-white/10"
                        aria-label="Toggle card number"
                      >
                        {reveal ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="relative mt-3 font-mono text-sm tracking-wider text-emerald-300">{displayPan}</p>
                    <div className="relative mt-2 flex items-end justify-between">
                      <span className="text-sm font-medium text-white/95">{holderName}</span>
                      <span className="text-[10px] font-bold text-white/80">Mastercard</span>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl bg-gray-100/90 p-3">
                    <DetailCopyRow label="Card Name" value={cardTitle} onCopy={() => copy("name", cardTitle)} />
                    <DetailCopyRow
                      label="Card Number"
                      value={pan ? formatPan(pan) : masked}
                      onCopy={() => copy("pan", pan.replace(/\D/g, ""))}
                    />
                    <DetailCopyRow label="CVV" value={reveal ? cvv : "***"} onCopy={() => copy("cvv", cvv)} />
                    <DetailCopyRow label="Expiry Date" value={exp} onCopy={() => copy("exp", exp)} />
                  </div>
                </div>
              )}

              {mainTab === "billing" && (
                <div className="mt-5">
                  <div className="mb-3 flex gap-6 border-b border-gray-200">
                    {(
                      [
                        ["ng", "Nigeria Address"],
                        ["us", "US Address"],
                      ] as const
                    ).map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setBillingSub(k)}
                        className={`relative pb-2 text-sm font-semibold ${
                          billingSub === k ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {label}
                        {billingSub === k && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: GREEN }} />
                        )}
                      </button>
                    ))}
                  </div>
                  {billingSub === "ng" && (
                    <div className="space-y-2 rounded-xl bg-gray-100/90 p-3">
                      <DetailCopyRow label="Street Name" value={streetNg || "—"} onCopy={() => copy("s1", streetNg)} />
                      <DetailCopyRow label="City Name" value={cityNg || "—"} onCopy={() => copy("c1", cityNg)} />
                      <DetailCopyRow label="State Name" value={stateNg || "—"} onCopy={() => copy("st1", stateNg)} />
                      <DetailCopyRow label="Country Name" value={countryNg || "—"} onCopy={() => copy("co1", countryNg)} />
                      <DetailCopyRow label="Postal Code" value={postalNg || "—"} onCopy={() => copy("p1", postalNg)} />
                    </div>
                  )}
                  {billingSub === "us" && (
                    <div className="space-y-2 rounded-xl bg-gray-100/90 p-3">
                      <DetailCopyRow
                        label="Street Name"
                        value={usAddr?.street ?? "—"}
                        onCopy={() => copy("us1", usAddr?.street ?? "")}
                      />
                      <DetailCopyRow
                        label="City Name"
                        value={usAddr?.city ?? "—"}
                        onCopy={() => copy("us2", usAddr?.city ?? "")}
                      />
                      <DetailCopyRow
                        label="State Name"
                        value={usAddr?.state ?? "—"}
                        onCopy={() => copy("us3", usAddr?.state ?? "")}
                      />
                      <DetailCopyRow
                        label="Country Name"
                        value={usAddr?.country ?? "—"}
                        onCopy={() => copy("us4", usAddr?.country ?? "")}
                      />
                      <DetailCopyRow
                        label="Postal Code"
                        value={usAddr?.postal_code ?? "—"}
                        onCopy={() => copy("us5", usAddr?.postal_code ?? "")}
                      />
                    </div>
                  )}
                </div>
              )}

              {mainTab === "limit" && (
                <div className="mt-5 space-y-4">
                  <section className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: GREEN }}>
                      Daily Limit
                    </div>
                    <div className="space-y-2 bg-gray-50 px-4 py-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Spending Limit</span>
                        <span className="font-semibold text-gray-900">
                          {card.daily_spending_limit != null ? `$${Number(card.daily_spending_limit).toLocaleString()}` : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Card Transactions</span>
                        <span className="font-semibold text-gray-900">
                          {card.daily_transaction_limit != null ? String(card.daily_transaction_limit) : "—"}
                        </span>
                      </div>
                    </div>
                  </section>
                  <section className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: GREEN }}>
                      Monthly Limit
                    </div>
                    <div className="space-y-2 bg-gray-50 px-4 py-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Spending Limit</span>
                        <span className="font-semibold text-gray-900">
                          {card.monthly_spending_limit != null ? `$${Number(card.monthly_spending_limit).toLocaleString()}` : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Card Transactions</span>
                        <span className="font-semibold text-gray-900">
                          {card.monthly_transaction_limit != null ? String(card.monthly_transaction_limit) : "—"}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {copied ? <p className="mt-3 text-center text-xs text-gray-500">Copied</p> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function DetailCopyRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 shadow-sm">
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500">{label}</p>
        <p className="truncate text-sm font-medium text-gray-900">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        aria-label={`Copy ${label}`}
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}

export default VirtualCardDetailsModal;
