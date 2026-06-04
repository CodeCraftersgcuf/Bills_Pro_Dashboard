import React from "react";
import {
  type AdminVirtualCardTxRaw,
  formatVcTxDate,
  getVirtualCardTxAmountDisplay,
  mapVcTxSubType,
  mapVcTxUiStatus,
  vcTxPublicId,
  vcTxTitle,
} from "../utils/virtualCardTxDisplay";

const GREEN = "#1B800F";

function moneyUsd(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function moneyNgn(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2.5 last:border-0">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className="max-w-[65%] break-words text-right font-medium text-gray-900">{value}</dd>
    </div>
  );
}

export interface VirtualCardTransactionReceiptProps {
  tx: AdminVirtualCardTxRaw;
  onClose: () => void;
}

const VirtualCardTransactionReceipt: React.FC<VirtualCardTransactionReceiptProps> = ({ tx, onClose }) => {
  const meta = (tx.metadata ?? {}) as Record<string, unknown>;
  const wc = (meta.wallet_charge ?? {}) as Record<string, unknown>;
  const typ = String(tx.type ?? "").toLowerCase();
  const status = mapVcTxUiStatus(String(tx.status ?? ""));
  const isFund = typ === "fund";
  const isWithdraw = typ === "withdraw";
  const isPayment = typ === "payment" || typ === "refund";

  const principalUsd = meta.principal_usd ?? wc.principal_usd;
  const exchangeRate = meta.exchange_rate_ngn_per_usd ?? wc.exchange_rate_ngn_per_usd ?? meta.exchange_rate;
  const paymentWallet =
    meta.payment_wallet_type === "crypto_wallet"
      ? "Crypto (USD)"
      : meta.payment_wallet_type === "naira_wallet"
        ? "Naira Wallet"
        : null;

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-gray-900">{vcTxTitle(tx)}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{mapVcTxSubType(typ)} · {status}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-xs font-semibold text-gray-500 hover:text-gray-800"
        >
          Back
        </button>
      </div>

      <p className="mt-3 text-2xl font-bold text-gray-900">{getVirtualCardTxAmountDisplay(tx)}</p>
      <p className="text-xs text-gray-500">{formatVcTxDate(tx.created_at)}</p>

      <dl className="mt-4 text-sm">
        <ReceiptRow label="Transaction ID" value={vcTxPublicId(tx)} />
        <ReceiptRow label="Status" value={status} />
        <ReceiptRow label="Type" value={mapVcTxSubType(typ)} />

        {isFund ? (
          <>
            <ReceiptRow label="Amount to fund" value={moneyUsd(principalUsd ?? tx.amount)} />
            {paymentWallet ? <ReceiptRow label="Payment wallet" value={paymentWallet} /> : null}
            {exchangeRate != null ? (
              <ReceiptRow
                label="Exchange rate"
                value={`$1 = ₦${Number(exchangeRate).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
            ) : null}
            <ReceiptRow
              label="Card funding fee"
              value={moneyUsd(meta.card_funding_fee_usd ?? wc.card_funding_fee_usd ?? wc.load_fee_usd)}
            />
            <ReceiptRow
              label="Total charged (NGN)"
              value={moneyNgn(meta.charge_ngn ?? wc.charge_ngn ?? meta.total_ngn)}
            />
          </>
        ) : null}

        {isWithdraw ? (
          <>
            <ReceiptRow label="Amount to withdraw" value={moneyUsd(tx.amount)} />
            {exchangeRate != null ? (
              <ReceiptRow
                label="Exchange rate"
                value={`$1 = ₦${Number(exchangeRate).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
            ) : null}
            <ReceiptRow label="Fee" value={moneyUsd(tx.fee)} />
            <ReceiptRow label="Total" value={moneyUsd(tx.total_amount)} />
          </>
        ) : null}

        {isPayment ? (
          <>
            <ReceiptRow label="Amount" value={getVirtualCardTxAmountDisplay(tx)} />
            <ReceiptRow label="Fee" value={moneyUsd(tx.fee)} />
            <ReceiptRow label="Total" value={moneyUsd(tx.total_amount)} />
            <ReceiptRow label="Merchant" value={String(meta.merchant_name ?? "").trim() || "—"} />
            <ReceiptRow
              label="Location"
              value={[meta.merchant_city, meta.merchant_country].filter(Boolean).join(", ") || "—"}
            />
            <ReceiptRow label="MCC" value={String(meta.merchant_mcc ?? meta.mcc ?? "").trim() || "—"} />
            <ReceiptRow label="Decline reason" value={String(meta.decline_reason ?? meta.reason ?? "").trim() || "—"} />
          </>
        ) : null}

        {String(tx.description ?? "").trim() ? (
          <ReceiptRow label="Description" value={String(tx.description)} />
        ) : null}
      </dl>

      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-full py-2.5 text-sm font-semibold text-white"
        style={{ backgroundColor: GREEN }}
      >
        Close
      </button>
    </div>
  );
};

export default VirtualCardTransactionReceipt;
