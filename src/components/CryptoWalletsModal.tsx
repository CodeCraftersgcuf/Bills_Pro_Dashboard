import React, { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Eye, Search, X } from "lucide-react";

export type CryptoWalletModalItem = {
  id: string;
  symbol: string;
  name: string;
  amount: string;
  usdValue: string;
  network: string;
  /** Background for token circle (e.g. Bitcoin orange) */
  iconBg: string;
  /** Optional: shown on profile strip as `Net: …` */
  networkLabel?: string;
  /** On-chain deposit address when loaded from API */
  depositAddress?: string;
};

export type CryptoWalletQuickAction = "deposit" | "withdraw" | "transfer" | "view";

export interface CryptoWalletsModalProps {
  open: boolean;
  onClose: () => void;
  items: CryptoWalletModalItem[];
  /** Quick actions on each token card */
  onWalletAction?: (action: CryptoWalletQuickAction, item: CryptoWalletModalItem) => void;
}

const CryptoWalletsModal: React.FC<CryptoWalletsModalProps> = ({ open, onClose, items, onWalletAction }) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((w) => {
      const net = (w.networkLabel ?? w.network).toLowerCase();
      return (
        w.symbol.toLowerCase().includes(q) ||
        w.name.toLowerCase().includes(q) ||
        w.network.toLowerCase().includes(q) ||
        net.includes(q)
      );
    });
  }, [items, query]);

  if (!open) return null;

  const titleId = "crypto-wallets-modal-title";

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
        className="relative z-[1] flex max-h-[min(90vh,720px)] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-gray-200 px-6 pb-4 pt-6 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="text-xl font-bold text-gray-900">
              Crypto Wallets
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

        <div className="shrink-0 border-b border-gray-100 px-6 py-4 md:px-8">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Token"
              className="w-full rounded-xl border-0 bg-[#F3F3F3] py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B800F]/25"
              aria-label="Search tokens"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 md:px-8 md:py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((w) => (
              <div
                key={w.id}
                className="flex flex-col rounded-2xl border border-gray-100 bg-[#F9F9F9] p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: w.iconBg }}
                  >
                    {w.symbol.slice(0, 3)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-gray-900">{w.symbol}</p>
                    <p className="text-xs font-medium text-gray-500">{w.name}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between gap-2">
                  <span className="text-lg font-bold text-gray-900">{w.amount}</span>
                  <span className="text-sm font-semibold text-gray-700">{w.usdValue}</span>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    className="flex aspect-square max-h-11 items-center justify-center rounded-xl bg-[#F0F0F0] text-gray-800 transition-colors hover:bg-[#E5E5E5]"
                    aria-label="Deposit"
                    onClick={() => onWalletAction?.("deposit", w)}
                  >
                    <ArrowDownToLine className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="flex aspect-square max-h-11 items-center justify-center rounded-xl bg-[#F0F0F0] text-gray-800 transition-colors hover:bg-[#E5E5E5]"
                    aria-label="Withdraw"
                    onClick={() => onWalletAction?.("withdraw", w)}
                  >
                    <ArrowUpFromLine className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="flex aspect-square max-h-11 items-center justify-center rounded-xl bg-[#F0F0F0] text-gray-800 transition-colors hover:bg-[#E5E5E5]"
                    aria-label="Transfer"
                    onClick={() => onWalletAction?.("transfer", w)}
                  >
                    <ArrowLeftRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="flex aspect-square max-h-11 items-center justify-center rounded-xl bg-[#F0F0F0] text-gray-800 transition-colors hover:bg-[#E5E5E5]"
                    aria-label="View details"
                    onClick={() => onWalletAction?.("view", w)}
                  >
                    <Eye className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No tokens match your search.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CryptoWalletsModal;
