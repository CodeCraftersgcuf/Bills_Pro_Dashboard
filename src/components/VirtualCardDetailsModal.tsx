import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, X } from "lucide-react";
import {
  adminFreezeVirtualCard,
  adminUnfreezeVirtualCard,
  fetchAdminVirtualCard,
  fetchAdminVirtualCardTransactionsByCard,
} from "../api/adminVirtualCards";
import VirtualCardTransactionReceipt from "./VirtualCardTransactionReceipt";
import {
  pagocardsBillingSchemeFromCardType,
  pagocardsFixedBillingAddress,
} from "../constants/pagocardsBillingAddress";
import { virtualCardSurfaceStyle } from "../utils/virtualCardSurface";
import {
  type AdminVirtualCardTxRaw,
  formatVcTxDate,
  getVirtualCardTxAmountDisplay,
  normalizeAdminVirtualCardTxList,
  vcTxSubtitle,
  vcTxTitle,
} from "../utils/virtualCardTxDisplay";

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

type MainTab = "details" | "billing" | "limit" | "transactions";

const VirtualCardDetailsModal: React.FC<VirtualCardDetailsModalProps> = ({
  open,
  cardId,
  holderName,
  onClose,
  userId,
}) => {
  const qc = useQueryClient();
  const [mainTab, setMainTab] = useState<MainTab>("details");
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<AdminVirtualCardTxRaw | null>(null);

  const q = useQuery({
    queryKey: ["admin", "virtual-card", cardId],
    queryFn: () => fetchAdminVirtualCard(cardId!),
    enabled: open && cardId != null,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const txQ = useQuery({
    queryKey: ["admin", "virtual-card", cardId, "transactions"],
    queryFn: () => fetchAdminVirtualCardTransactionsByCard(cardId!, { limit: 50 }),
    enabled: open && cardId != null,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const txItems = useMemo(
    () => normalizeAdminVirtualCardTxList(txQ.data),
    [txQ.data]
  );

  useEffect(() => {
    if (!open) {
      setMainTab("details");
      setReveal(false);
      setSelectedTx(null);
    }
  }, [open]);

  const cardTypeLoaded = String(q.data?.card_type ?? "").toLowerCase();

  useEffect(() => {
    if (cardTypeLoaded === "visa" && mainTab === "limit") {
      setMainTab("details");
    }
  }, [cardTypeLoaded, mainTab]);

  useEffect(() => {
    if (!open || !q.isSuccess || cardId == null) return;
    void qc.invalidateQueries({ queryKey: ["admin", "vcards", userId] });
    void qc.invalidateQueries({ queryKey: ["admin", "vctx", userId] });
  }, [open, q.isSuccess, cardId, userId, qc]);

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
      await qc.invalidateQueries({ queryKey: ["admin", "virtual-card", cardId, "transactions"] });
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
  const schemeRaw = String(card?.card_type ?? "mastercard").toLowerCase();
  const schemeLabel = schemeRaw === "visa" ? "Visa" : "Mastercard";
  const isFrozen = Boolean(card?.is_frozen);

  const billingScheme = pagocardsBillingSchemeFromCardType(card?.card_type);
  const billing = pagocardsFixedBillingAddress(billingScheme);
  const streetNg = billing.billing_address_street;
  const cityNg = billing.billing_address_city;
  const stateNg = billing.billing_address_state;
  const countryNg = billing.billing_address_country;
  const postalNg = billing.billing_address_postal_code;

  const isVisa = schemeRaw === "visa";
  const mastercardAddressLine = `${streetNg}, ${cityNg}, ${postalNg}`;

  return (
    <div className="fixed inset-0 z-[270] flex items-center justify-center p-4 sm:p-6" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-[271] flex max-h-[min(92vh,800px)] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
          mainTab === "transactions" ? "max-w-2xl" : "max-w-lg"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Virtual card details</h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">{schemeLabel}</p>
          </div>
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
          {q.isLoading && (
            <p className="text-sm text-gray-500">Syncing card from issuer (balance, PAN, transactions)…</p>
          )}
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
                      ["transactions", "Transactions"],
                      ["billing", "Billing Address"],
                      ...(!isVisa ? ([["limit", "Spend controls"]] as const) : []),
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
                      <span className="text-[10px] font-bold text-white/80">{schemeLabel}</span>
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

              {mainTab === "transactions" && (
                <div className="mt-5">
                  {selectedTx ? (
                    <VirtualCardTransactionReceipt tx={selectedTx} onClose={() => setSelectedTx(null)} />
                  ) : (
                    <>
                      <p className="mb-3 text-xs text-gray-500">
                        Live feed from Pagocards (same sync as the mobile app). Balance on the Card Details tab
                        is refreshed when you open this dialog.
                      </p>
                      {txQ.isLoading ? (
                        <p className="text-sm text-gray-500">Loading transactions…</p>
                      ) : txQ.isError ? (
                        <p className="text-sm text-red-600">
                          {(txQ.error as Error)?.message ?? "Could not load transactions."}
                        </p>
                      ) : txItems.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                          No transactions yet for this card.
                        </p>
                      ) : (
                        <ul className="max-h-[min(50vh,420px)] space-y-2 overflow-y-auto pr-1">
                          {txItems.map((tx, i) => {
                            const key = String(tx.id ?? tx.reference ?? i);
                            return (
                              <li key={key}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedTx(tx)}
                                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:border-[#1B800F]/30 hover:bg-gray-50"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-gray-900">{vcTxTitle(tx)}</p>
                                    <p className="truncate text-xs text-gray-500">{vcTxSubtitle(tx)}</p>
                                    <p className="mt-0.5 text-[11px] text-gray-400">{formatVcTxDate(tx.created_at)}</p>
                                  </div>
                                  <span className="shrink-0 text-sm font-bold text-gray-900">
                                    {getVirtualCardTxAmountDisplay(tx)}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}

              {mainTab === "billing" && (
                <div className="mt-5">
                  <p className="mb-3 text-xs text-gray-500">
                    Program billing on file for this {schemeLabel} card (issuer format).
                  </p>
                  {isVisa ? (
                    <div className="space-y-2 rounded-xl bg-gray-100/90 p-3">
                      <DetailCopyRow label="Street" value={streetNg} onCopy={() => copy("s1", streetNg)} />
                      <DetailCopyRow label="City" value={cityNg} onCopy={() => copy("c1", cityNg)} />
                      <DetailCopyRow label="State" value={stateNg} onCopy={() => copy("st1", stateNg)} />
                      <DetailCopyRow label="ZIP / Postal code" value={postalNg} onCopy={() => copy("z1", postalNg)} />
                      <DetailCopyRow label="Country" value={countryNg} onCopy={() => copy("co1", countryNg)} />
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-xl bg-gray-100/90 p-3">
                      <DetailCopyRow label="Street" value={streetNg || "—"} onCopy={() => copy("s1", streetNg)} />
                      <DetailCopyRow label="City" value={cityNg || "—"} onCopy={() => copy("c1", cityNg)} />
                      <DetailCopyRow label="State / County" value={stateNg || "—"} onCopy={() => copy("st1", stateNg)} />
                      <DetailCopyRow
                        label="Address"
                        value={mastercardAddressLine || "—"}
                        onCopy={() => copy("addr1", mastercardAddressLine)}
                      />
                      <DetailCopyRow label="Postcode" value={postalNg || "—"} onCopy={() => copy("p1", postalNg)} />
                      <DetailCopyRow label="Country" value={countryNg || "—"} onCopy={() => copy("co1", countryNg)} />
                    </div>
                  )}
                </div>
              )}

              {mainTab === "limit" && (
                <div className="mt-5 space-y-4">
                  {isVisa ? (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      Spend controls are available for <strong>Mastercard</strong> virtual cards only. Visa cards use
                      Pagocards Visa APIs and do not expose spend-control management in the app or admin panel.
                    </p>
                  ) : (
                  <p className="text-sm text-gray-600">
                    Spending caps are issuer <strong>spend controls</strong> (Pagocards), not local database fields.
                    End users manage them from the mobile app; this panel shows any rows returned on the last card
                    details sync if the issuer includes them in the payload.
                  </p>
                  )}
                  {!isVisa && (() => {
                    const rows = spendControlsFromProviderPayload(card.provider_payload);
                    if (rows.length === 0) {
                      return (
                        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                          No spend control rows detected in cached provider payload.
                        </p>
                      );
                    }
                    return rows.map((row, i) => (
                      <section
                        key={String(row.control_id ?? row.description ?? i)}
                        className="overflow-hidden rounded-xl border border-gray-200"
                      >
                        <div className="px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: GREEN }}>
                          {row.description || "Spend control"}
                        </div>
                        <div className="space-y-2 bg-gray-50 px-4 py-3 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Period</span>
                            <span className="font-semibold text-gray-900">{row.period || "—"}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Type</span>
                            <span className="font-semibold text-gray-900">{row.type || "—"}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Limit</span>
                            <span className="font-semibold text-gray-900">{row.limitDisplay}</span>
                          </div>
                          {row.control_id ? (
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-500">Control ID</span>
                              <span className="max-w-[60%] break-all text-right font-mono text-xs font-semibold text-gray-900">
                                {row.control_id}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </section>
                    ));
                  })()}
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

type SpendControlRowUi = {
  control_id: string;
  description: string;
  period: string;
  type: string;
  limitDisplay: string;
};

function spendControlsFromProviderPayload(payload: unknown): SpendControlRowUi[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = (root.data as Record<string, unknown> | undefined) ?? root;
  const keys = [
    "spendControls",
    "spendcontrols",
    "spend_controls",
    "controls",
    "controlList",
    "controllist",
    "spendingControls",
    "spending_controls",
  ];
  let raw: unknown[] | null = null;
  for (const k of keys) {
    const v = data[k];
    if (Array.isArray(v)) {
      raw = v;
      break;
    }
    const card = data.card as Record<string, unknown> | undefined;
    if (card && Array.isArray(card[k])) {
      raw = card[k] as unknown[];
      break;
    }
  }
  if (!raw) return [];

  const out: SpendControlRowUi[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const cid = String(r.controlid ?? r.controlId ?? r.control_id ?? r.id ?? "");
    const lim = r.limit;
    let limitDisplay = "—";
    if (typeof lim === "number") limitDisplay = `$${lim.toLocaleString()}`;
    else if (lim != null && String(lim) !== "") limitDisplay = String(lim);
    out.push({
      control_id: cid,
      description: String(r.description ?? ""),
      period: String(r.period ?? ""),
      type: String(r.type ?? ""),
      limitDisplay,
    });
  }
  return out;
}

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
