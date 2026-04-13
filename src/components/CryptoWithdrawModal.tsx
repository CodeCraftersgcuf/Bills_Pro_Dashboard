import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, Info } from "lucide-react";

const GREEN_DARK = "#1B800F";
const GREEN_LIGHT = "#42AC36";
const INPUT_BG = "#E8E8EA";
const FEE_BOX = "#FFF7ED";
const BTN_GREEN = "#42AC36";

export interface CryptoWithdrawModalProps {
  open: boolean;
  onClose: () => void;
  symbol: string;
  /** e.g. 0.00023 */
  balanceAmount: string;
  feeDisplay?: string;
}

const CryptoWithdrawModal: React.FC<CryptoWithdrawModalProps> = ({
  open,
  onClose,
  symbol,
  balanceAmount,
  feeDisplay = "$5.500",
}) => {
  const [amount, setAmount] = useState("200");
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("");

  useEffect(() => {
    if (!open) {
      setAmount("200");
      setAddress("");
      setNetwork("");
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const titleId = "crypto-withdraw-modal-title";
  const balanceLine = `${balanceAmount} ${symbol}`;

  return (
    <div className="fixed inset-0 z-[235] flex items-center justify-center p-4">
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
        className="relative z-[1] flex max-h-[min(92vh,680px)] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 px-3 pb-4 pt-4 md:px-5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <h2 id={titleId} className="flex-1 text-center text-lg font-bold text-gray-900">
            Withdraw
          </h2>
          <div className="h-10 w-10 shrink-0" aria-hidden />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
          <div className="overflow-hidden rounded-2xl shadow-md">
            <div className="px-5 py-4 text-white" style={{ background: `linear-gradient(135deg, ${GREEN_DARK} 0%, #156b0c 100%)` }}>
              <p className="text-xs font-medium text-white/85">{symbol} Balance</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{balanceLine}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-white/95" style={{ backgroundColor: GREEN_LIGHT }}>
              <span className="opacity-90">On-chain withdrawal</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{symbol}</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">USD</span>
            </div>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              className="w-full rounded-xl border-0 px-4 py-4 text-2xl font-bold tabular-nums text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B800F]/30"
              style={{ backgroundColor: INPUT_BG }}
              inputMode="decimal"
            />
          </div>

          <div className="mt-5">
            <label htmlFor="crypto-wd-addr" className="mb-2 block text-sm font-bold text-gray-900">
              Withdrawal Address
            </label>
            <input
              id="crypto-wd-addr"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Withdrawal Address"
              className="w-full rounded-xl border-0 px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B800F]/30"
              style={{ backgroundColor: INPUT_BG }}
              autoComplete="off"
            />
          </div>

          <div className="relative mt-5">
            <label htmlFor="crypto-wd-net" className="mb-2 block text-sm font-bold text-gray-900">
              Select Network
            </label>
            <select
              id="crypto-wd-net"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-xl border-0 px-4 py-3.5 pr-11 text-[15px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B800F]/30"
              style={{ backgroundColor: INPUT_BG }}
            >
              <option value="">Select Network</option>
              <option value="btc">Bitcoin</option>
              <option value="eth">Ethereum</option>
              <option value="trc">TRC-20</option>
              <option value="erc">ERC-20</option>
            </select>
            <ChevronDown className="pointer-events-none absolute bottom-3 right-4 h-5 w-5 text-gray-500" />
          </div>

          <div
            className="mt-5 flex items-center gap-2 rounded-xl border border-amber-200/80 px-3 py-2.5 text-sm text-amber-950"
            style={{ backgroundColor: FEE_BOX }}
          >
            <Info className="h-4 w-4 shrink-0 text-amber-700" strokeWidth={2} />
            <span>Fee($) = {feeDisplay}</span>
          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-full py-3.5 text-base font-bold text-white shadow-md transition-opacity hover:opacity-95"
            style={{ backgroundColor: BTN_GREEN }}
            onClick={onClose}
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default CryptoWithdrawModal;
