import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import {
  adminFundVirtualCard,
  fetchAdminVirtualCardFundingEstimate,
  type VirtualCardScheme,
} from "../api/adminVirtualCards";

const GREEN = "#1B800F";

export interface AdminFundVirtualCardModalProps {
  open: boolean;
  cardId: number | null;
  cardLabel: string;
  scheme: VirtualCardScheme;
  onClose: () => void;
  onFunded: (message: string) => void;
}

const AdminFundVirtualCardModal: React.FC<AdminFundVirtualCardModalProps> = ({
  open,
  cardId,
  cardLabel,
  scheme,
  onClose,
  onFunded,
}) => {
  const [amount, setAmount] = useState("5");
  const [wallet, setWallet] = useState<"naira_wallet" | "crypto_wallet">("naira_wallet");

  useEffect(() => {
    if (open) setAmount("5");
  }, [open, cardId]);

  const amountNum = Number(amount);
  const schemeLabel = scheme === "visa" ? "Visa" : "Mastercard";

  const estimateQ = useQuery({
    queryKey: ["admin", "vc-fund-estimate", cardId, amountNum, wallet, scheme],
    queryFn: () =>
      fetchAdminVirtualCardFundingEstimate(cardId!, {
        amount: amountNum,
        payment_wallet_type: wallet,
        payment_wallet_currency: wallet === "naira_wallet" ? "NGN" : "USD",
      }),
    enabled: open && cardId != null && amountNum >= 0.01,
    staleTime: 0,
  });

  const fundMut = useMutation({
    mutationFn: () =>
      adminFundVirtualCard(cardId!, {
        amount: amountNum,
        payment_wallet_type: wallet,
        payment_wallet_currency: wallet === "naira_wallet" ? "NGN" : "USD",
      }),
    onSuccess: () => {
      onFunded(
        `${schemeLabel} card funded: USD ${amountNum.toFixed(2)} via ${
          wallet === "naira_wallet" ? "Naira wallet" : "Crypto wallet"
        } (${cardLabel}).`
      );
      onClose();
    },
  });

  if (!open || cardId == null) return null;

  const est = estimateQ.data;
  const chargeNgn = est?.charge_ngn;
  const chargeUsd = est?.charge_usd;

  return (
    <div className="fixed inset-0 z-[275] flex items-center justify-center p-4" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[276] w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Fund virtual card</h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              {schemeLabel} · {cardLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Uses the same provider load and platform rates as the mobile app (
          {scheme === "visa" ? "visa_fund" : "fund"}).
        </p>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Amount (USD on card)
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Payment wallet
          <select
            value={wallet}
            onChange={(e) => setWallet(e.target.value as "naira_wallet" | "crypto_wallet")}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
          >
            <option value="naira_wallet">Naira wallet</option>
            <option value="crypto_wallet">Crypto wallet (USD)</option>
          </select>
        </label>

        {estimateQ.isFetching ? (
          <p className="mt-3 text-xs text-gray-500">Calculating charge…</p>
        ) : estimateQ.isError ? (
          <p className="mt-3 text-xs text-red-600">{(estimateQ.error as Error)?.message ?? "Estimate failed."}</p>
        ) : est && amountNum >= 0.01 ? (
          <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-700">
            <p>
              Principal: <strong>${Number(est.principal_usd ?? amountNum).toFixed(2)}</strong>
            </p>
            {chargeNgn != null ? (
              <p>
                Total debit (NGN): <strong>₦{Number(chargeNgn).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</strong>
              </p>
            ) : null}
            {chargeUsd != null ? (
              <p>
                Total debit (USD): <strong>${Number(chargeUsd).toFixed(2)}</strong>
              </p>
            ) : null}
            {est.card_funding_fee_usd != null ? (
              <p>Card funding fee: ${Number(est.card_funding_fee_usd).toFixed(2)}</p>
            ) : null}
          </div>
        ) : null}

        {fundMut.isError ? (
          <p className="mt-3 text-sm text-red-600">{(fundMut.error as Error)?.message ?? "Funding failed."}</p>
        ) : null}

        <button
          type="button"
          disabled={fundMut.isPending || amountNum < 0.01 || estimateQ.isFetching}
          onClick={() => fundMut.mutate()}
          className="mt-5 w-full rounded-full py-3 text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: GREEN }}
        >
          {fundMut.isPending ? "Funding…" : `Fund ${schemeLabel} card`}
        </button>
      </div>
    </div>
  );
};

export default AdminFundVirtualCardModal;
