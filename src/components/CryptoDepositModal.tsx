import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Copy, X } from "lucide-react";
import { qrCodeUrl, truncateAddress } from "./cryptoWalletMock";

const GREEN_DARK = "#1B800F";
const GREEN_BTN = "#42AC36";
const INPUT_BG = "#E8E8EA";

export interface CryptoDepositModalProps {
  open: boolean;
  onClose: () => void;
  symbol: string;
  /** Optional override; otherwise derived from symbol */
  depositAddress?: string;
}

const CryptoDepositModal: React.FC<CryptoDepositModalProps> = ({
  open,
  onClose,
  symbol,
  depositAddress: addressProp,
}) => {
  const [network, setNetwork] = useState(symbol);
  const [copied, setCopied] = useState(false);

  const fullAddress = useMemo(() => addressProp?.trim() ?? "", [addressProp]);

  useEffect(() => {
    if (!open) {
      setNetwork(symbol);
      setCopied(false);
      return;
    }
    setNetwork(symbol);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, symbol]);

  const copy = () => {
    if (!fullAddress) return;
    void navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  if (!open) return null;

  const titleId = "crypto-deposit-modal-title";
  const qrSrc = fullAddress ? qrCodeUrl(fullAddress) : "";

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
        className="relative z-[1] flex max-h-[min(92vh,720px)] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 pb-4 pt-5 md:px-6">
          <h2 id={titleId} className="text-lg font-bold text-gray-900">
            Deposit
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
          <div className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-white" style={{ backgroundColor: GREEN_DARK }}>
            Deposit {symbol}
          </div>

          <div className="mt-5 flex justify-center">
            {qrSrc ? (
              <div className="relative rounded-2xl bg-white p-3 shadow-inner ring-2 ring-gray-100">
                <img
                  src={qrSrc}
                  alt="Deposit address QR code"
                  className="h-[200px] w-[200px] object-contain"
                  width={200}
                  height={200}
                />
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md"
                  style={{ backgroundColor: "#F7931A" }}
                >
                  {symbol.slice(0, 3)}
                </div>
              </div>
            ) : (
              <p className="rounded-xl bg-gray-100 px-4 py-6 text-center text-sm text-gray-600">
                No deposit address returned from the API for this wallet yet.
              </p>
            )}
          </div>

          <div className="mt-5">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-3"
              style={{ backgroundColor: INPUT_BG }}
            >
              <span className="min-w-0 flex-1 font-mono text-sm text-gray-900">
                {fullAddress ? truncateAddress(fullAddress) : "—"}
              </span>
              <button
                type="button"
                onClick={copy}
                disabled={!fullAddress}
                className="shrink-0 rounded-lg p-2 text-gray-600 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Copy address"
              >
                <Copy className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            {copied ? <p className="mt-1 text-center text-[11px] text-gray-500">Copied</p> : null}
          </div>

          <div className="mt-5">
            <label htmlFor="crypto-dep-network" className="mb-2 block text-sm font-bold text-gray-900">
              Network
            </label>
            <div className="relative">
              <select
                id="crypto-dep-network"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border-0 px-4 py-3.5 pr-11 text-[15px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B800F]/30"
                style={{ backgroundColor: INPUT_BG }}
              >
                <option value={symbol}>{symbol}</option>
                {symbol !== "BTC" ? <option value="BTC">BTC</option> : null}
                {symbol !== "ETH" ? <option value="ETH">ETH</option> : null}
                <option value="TRC20">TRC-20</option>
                <option value="ERC20">ERC-20</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-full py-3.5 text-base font-bold text-white shadow-md transition-opacity hover:opacity-95"
            style={{ backgroundColor: GREEN_BTN }}
            onClick={onClose}
          >
            Send to wallet address
          </button>
        </div>
      </div>
    </div>
  );
};

export default CryptoDepositModal;
