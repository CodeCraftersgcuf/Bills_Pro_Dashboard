import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, MoreVertical, Search, X } from "lucide-react";
import type { User } from "../data/users";
import type { FiatDepositBankDetails } from "./FiatDepositModal";
import {
  fetchAdminUserDepositAddresses,
  fetchAdminUserFiatWallets,
  fetchAdminUserTimeline,
  fetchAdminUserVirtualAccounts,
  type AdminUserDepositAddress,
  type VirtualAccountDto,
} from "../api/adminUsers";
import { fetchAdminDeposit } from "../api/adminDeposits";
import { fetchAdminTransaction, type AdminTransactionRow } from "../api/adminTransactions";
import { adminAdjustCrypto, adminAdjustFiat } from "../api/adminAdjustments";
import CryptoWalletsModal from "./CryptoWalletsModal";
import CryptoDepositModal from "./CryptoDepositModal";
import CryptoWithdrawModal from "./CryptoWithdrawModal";
import CryptoPayModal from "./CryptoPayModal";
import FiatDepositModal from "./FiatDepositModal";
import FiatWithdrawalModal from "./FiatWithdrawalModal";
import type { CryptoWalletModalItem } from "./CryptoWalletsModal";

const GREEN = "#1B800F";
const FILTER_TRACK_BG = "#E8E8E8";
const FILTER_DROPDOWN_BG = "#E5E5E5";
const LATEST_HEADER_GREEN = "#21D721";
const LATEST_SEARCH_BG = "#189016";
const LATEST_ROW_A = "#F9F9F9";
const LATEST_ROW_B = "#E6E6E6";
const LATEST_COL_HEADER_BG = "#EBEBEB";
const LATEST_ACTION_LIGHT = "#34D334";
const STATUS_SUCCESS = "#16A34A";
const STATUS_PENDING = "#CA8A04";
const STATUS_FAILED = "#DC2626";

/** Files in `public/` — swap names to match your assets (e.g. .png). */
export const NAIRA_WALLET_BG = "/naira-wallet-bg.jpg";
export const CRYPTO_WALLET_BG = "/crypto-wallet-bg.jpg";

type TypePill = "all" | "deposits" | "withdrawals";

type CryptoWalletItem = CryptoWalletModalItem;

type WalletTxRow = {
  id: string;
  amount: string;
  status: "Successful" | "Pending" | "Failed";
  type: string;
  subType: string;
  date: string;
  detailRef: { kind: "transaction"; id: string } | { kind: "deposit"; id: string };
};

const TOKEN_ICON: Record<string, string> = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  USDT: "#26A17B",
  USDC: "#2775CA",
  TRX: "#EF0027",
  BNB: "#F3BA2F",
  SOL: "#9945FF",
};

function statusStyle(status: WalletTxRow["status"]) {
  switch (status) {
    case "Successful":
      return STATUS_SUCCESS;
    case "Pending":
      return STATUS_PENDING;
    case "Failed":
      return STATUS_FAILED;
    default:
      return STATUS_SUCCESS;
  }
}

function mapWalletStatus(raw: string): WalletTxRow["status"] {
  const s = raw.toLowerCase();
  if (["successful", "success", "completed", "complete", "paid"].includes(s)) return "Successful";
  if (["pending", "processing", "queued"].includes(s)) return "Pending";
  return "Failed";
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatAmountLine(currency: string | undefined, amount: unknown, totalAmount?: unknown): string {
  const cur = (currency || "").toUpperCase();
  const n = parseFloat(String(totalAmount ?? amount ?? "0"));
  if (Number.isNaN(n)) return String(amount ?? "—");
  if (cur === "NGN" || cur === "NAIRA") {
    return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  if (!cur) return String(amount ?? "—");
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 8 })} ${cur}`.trim();
}

/** Wallet tab: Naira ledger only — no bill payments, no crypto. */
function includeNairaWalletTransaction(t: Record<string, unknown>): boolean {
  const ty = String(t.type ?? "").toLowerCase();
  if (ty === "bill_payment") return false;
  if (ty.startsWith("crypto")) return false;
  const cur = String(t.currency ?? "").toUpperCase();
  if (cur && cur !== "NGN" && cur !== "NAIRA") return false;
  return true;
}

function includeNairaWalletDeposit(d: Record<string, unknown>): boolean {
  const cur = String(d.currency ?? "").toUpperCase();
  if (cur && cur !== "NGN" && cur !== "NAIRA") return false;
  return true;
}

function mapRawTransaction(t: Record<string, unknown>): WalletTxRow {
  const currency = String(t.currency ?? "");
  const amountStr = formatAmountLine(currency, t.amount, t.total_amount);
  const lookup = String(t.transaction_id ?? t.id ?? "");
  return {
    id: lookup,
    amount: amountStr,
    status: mapWalletStatus(String(t.status ?? "")),
    type: "Naira",
    subType: String(t.type ?? t.category ?? t.description ?? "—"),
    date: formatDisplayDate(String(t.created_at ?? "")),
    detailRef: { kind: "transaction", id: lookup },
  };
}

function mapRawDeposit(d: Record<string, unknown>): WalletTxRow {
  const currency = String(d.currency ?? "");
  const amountStr = formatAmountLine(currency, d.amount, d.total_amount);
  const depId = String(d.id ?? "");
  return {
    id: String(d.deposit_reference ?? d.transaction_id ?? depId ?? ""),
    amount: amountStr,
    status: mapWalletStatus(String(d.status ?? "")),
    type: "Naira",
    subType: "Deposit",
    date: formatDisplayDate(String(d.created_at ?? "")),
    detailRef: { kind: "deposit", id: depId },
  };
}

function mergeTimelineRows(data: {
  transactions: Record<string, unknown>[];
  deposits: Record<string, unknown>[];
}): WalletTxRow[] {
  const items: { sort: number; row: WalletTxRow }[] = [];
  for (const t of data.transactions ?? []) {
    if (!includeNairaWalletTransaction(t)) continue;
    const created = String(t.created_at ?? "");
    items.push({ sort: new Date(created).getTime() || 0, row: mapRawTransaction(t) });
  }
  for (const d of data.deposits ?? []) {
    if (!includeNairaWalletDeposit(d)) continue;
    const created = String(d.created_at ?? "");
    items.push({ sort: new Date(created).getTime() || 0, row: mapRawDeposit(d) });
  }
  items.sort((a, b) => b.sort - a.sort);
  return items.map((x) => x.row);
}

function mapDepositAddressesToWallets(rows: AdminUserDepositAddress[]): CryptoWalletItem[] {
  return rows.map((r) => {
    const sym = (r.currency || "?").toUpperCase();
    const va = r.virtual_account;
    const bal = va?.available_balance ?? va?.account_balance ?? "0";
    const ac = (va?.accounting_currency || "").toUpperCase();
    let usdValue = "—";
    if (ac === "USD" && bal) {
      const n = parseFloat(String(bal));
      usdValue = Number.isNaN(n)
        ? String(bal)
        : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (bal) {
      usdValue = String(bal);
    }
    return {
      id: String(r.id),
      symbol: sym,
      name: sym,
      amount: String(bal),
      usdValue,
      network: r.blockchain,
      networkLabel: r.blockchain,
      iconBg: TOKEN_ICON[sym] ?? "#6B7280",
      depositAddress: r.address,
    };
  });
}

function nairaFromFiatWallets(
  rows: { currency: string; balance: string | number }[] | undefined,
  fallbackDisplay: string
): string {
  if (!rows?.length) {
    return fallbackDisplay.startsWith("N") ? `₦${fallbackDisplay.slice(1).trim()}` : fallbackDisplay;
  }
  const ngn = rows.find((r) => (r.currency || "").toUpperCase() === "NGN");
  const n = ngn ? Number(ngn.balance) : rows.reduce((s, r) => s + (Number(r.balance) || 0), 0);
  if (Number.isNaN(n)) return fallbackDisplay;
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** USD per 1 token — mirrors backend `WalletCurrency::usdPerUnitForDisplay` */
function usdPerUnitFromWalletCurrency(
  wc: NonNullable<VirtualAccountDto["wallet_currency"]>
): number {
  const ex = wc.exchange_rate;
  const buy = ex != null ? parseFloat(String(ex.rate_buy ?? "")) : NaN;
  const sell = ex != null ? parseFloat(String(ex.rate_sell ?? "")) : NaN;
  const legacy = parseFloat(String(wc.rate ?? ""));
  if (!Number.isNaN(buy) && !Number.isNaN(sell) && buy > 0 && sell > 0) return (buy + sell) / 2;
  if (!Number.isNaN(buy) && buy > 0) return buy;
  if (!Number.isNaN(sell) && sell > 0) return sell;
  if (!Number.isNaN(legacy) && legacy > 0) return legacy;
  const price = parseFloat(String(wc.price ?? ""));
  return !Number.isNaN(price) && price > 0 ? price : 0;
}

/** Estimated USD value for one virtual account row */
function virtualAccountUsdEstimate(a: VirtualAccountDto): number {
  const bal = parseFloat(String(a.available_balance ?? a.account_balance ?? "0"));
  if (Number.isNaN(bal)) return 0;
  const ac = (a.accounting_currency || "").toUpperCase();
  if (ac === "USD") return bal;
  const wc = a.wallet_currency;
  if (!wc) return 0;
  const perUnit = usdPerUnitFromWalletCurrency(wc);
  if (perUnit <= 0) return 0;
  return bal * perUnit;
}

/** Sum of all user crypto virtual-account balances expressed in USD */
function cryptoTotalDisplay(accounts: VirtualAccountDto[]): string {
  if (!accounts.length) return "$0.00";
  const total = accounts.reduce((sum, a) => sum + virtualAccountUsdEstimate(a), 0);
  return `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function WalletNairaDetailModal({
  row,
  onClose,
}: {
  row: WalletTxRow | null;
  onClose: () => void;
}) {
  const open = Boolean(row);
  const txId = row?.detailRef.kind === "transaction" ? row.detailRef.id : "";
  const depId = row?.detailRef.kind === "deposit" ? row.detailRef.id : "";
  const txQ = useQuery({
    queryKey: ["admin", "wallet-panel-tx", txId],
    queryFn: () => fetchAdminTransaction(txId),
    enabled: open && Boolean(txId),
  });
  const depQ = useQuery({
    queryKey: ["admin", "wallet-panel-dep", depId],
    queryFn: () => fetchAdminDeposit(depId),
    enabled: open && Boolean(depId),
  });

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !row) return null;

  const loading = row.detailRef.kind === "transaction" ? txQ.isLoading : depQ.isLoading;
  const err = row.detailRef.kind === "transaction" ? txQ.error : depQ.error;
  const data = row.detailRef.kind === "transaction" ? txQ.data : depQ.data;

  const txFields = (t: AdminTransactionRow) => (
    <dl className="space-y-2 text-sm">
      <DetailLine label="Transaction ID" value={String(t.transaction_id ?? t.id ?? "—")} />
      <DetailLine label="Type" value={String(t.type ?? "—")} />
      <DetailLine label="Status" value={String(t.status ?? "—")} />
      <DetailLine label="Amount" value={String(t.amount ?? "—")} />
      <DetailLine label="Currency" value={String(t.currency ?? "—")} />
      <DetailLine label="Reference" value={String(t.reference ?? "—")} />
      <DetailLine label="Description" value={String(t.description ?? "—")} />
      <DetailLine label="Bank" value={String(t.bank_name ?? "—")} />
      <DetailLine label="Account" value={String(t.account_number ?? "—")} />
      <DetailLine label="Date" value={t.created_at ? new Date(t.created_at).toLocaleString() : "—"} />
    </dl>
  );

  return (
    <div className="fixed inset-0 z-[240] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[1] max-h-[min(90vh,640px)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">Transaction details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-3 text-xs text-gray-500">
          {row.detailRef.kind === "transaction" ? "Ledger transaction" : "Deposit record"} · {row.subType}
        </p>
        {loading ? (
          <p className="text-sm text-gray-600">Loading…</p>
        ) : err ? (
          <p className="text-sm text-red-600">{(err as Error)?.message ?? "Could not load details."}</p>
        ) : row.detailRef.kind === "transaction" && data ? (
          txFields(data as AdminTransactionRow)
        ) : row.detailRef.kind === "deposit" && data ? (
          <DepositDetailView data={data as Record<string, unknown>} />
        ) : (
          <p className="text-sm text-gray-600">No data.</p>
        )}
      </div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-gray-100 py-2 last:border-b-0">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="break-all text-gray-900">{value}</dd>
    </div>
  );
}

function DepositDetailView({ data }: { data: Record<string, unknown> }) {
  const keys = Object.keys(data).sort();
  return (
    <dl className="space-y-2 text-sm">
      {keys.map((k) => (
        <DetailLine key={k} label={k} value={formatDepositValue(data[k])} />
      ))}
    </dl>
  );
}

function formatDepositValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function virtualAccountToFiatBank(accounts: VirtualAccountDto[], accountName: string): FiatDepositBankDetails {
  const a = accounts[0];
  if (!a) {
    return {
      bankName: "No virtual account",
      accountNumber: "—",
      accountName,
      reference: "—",
    };
  }
  return {
    bankName: a.blockchain ? `${a.blockchain} · virtual account` : "Virtual account",
    accountNumber: a.account_code || a.account_id || "—",
    accountName,
    reference: a.account_id || a.account_code || "—",
  };
}

export function BalanceTextureCard({
  title,
  amount,
  bgUrl,
  fallbackTint,
  showActions,
  onFiatAction,
}: {
  title: string;
  amount: string;
  bgUrl: string;
  /** Base color if the image fails to load */
  fallbackTint: string;
  showActions?: boolean;
  onFiatAction?: (action: "deposit" | "withdraw") => void;
}) {
  const [actionValue, setActionValue] = useState("");
  return (
    <div
      className="relative min-h-[168px] overflow-hidden rounded-[28px] border-2 border-dashed border-white/35 shadow-lg md:min-h-[188px]"
      style={{
        backgroundColor: fallbackTint,
        backgroundImage: `linear-gradient(145deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%), url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative flex h-full flex-col justify-between p-6 md:p-7">
        <div className="flex items-start justify-between gap-3">
          <span className="text-sm font-semibold text-white/95">{title}</span>
          {showActions ? (
            <div className="relative">
              <select
                className="cursor-pointer appearance-none rounded-full border border-white/25 bg-white/15 py-2 pl-4 pr-9 text-xs font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Actions"
                value={actionValue}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "deposit" || v === "withdraw") onFiatAction?.(v);
                  setActionValue("");
                }}
              >
                <option value="" className="text-gray-900">
                  Actions
                </option>
                <option value="deposit" className="text-gray-900">
                  Deposit
                </option>
                <option value="withdraw" className="text-gray-900">
                  Withdraw
                </option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/90" />
            </div>
          ) : null}
        </div>
        <p className="text-3xl font-bold tracking-tight text-white drop-shadow md:text-[2rem]">{amount}</p>
      </div>
    </div>
  );
}

export interface WalletPanelProps {
  user: User;
}

const WALLET_CARD_MENU = ["Deposit", "Withdraw", "Buy", "Sell"] as const;

type CryptoFlowState =
  | null
  | { kind: "deposit"; wallet: CryptoWalletItem }
  | { kind: "withdraw"; wallet: CryptoWalletItem }
  | { kind: "pay"; wallet: CryptoWalletItem; title: string };

/** Full wallet workspace (Naira + crypto cards, crypto strip, tx table, modals) — shared by User Management and Wallet Management. */
const WalletPanel: React.FC<WalletPanelProps> = ({ user }) => {
  const qc = useQueryClient();
  const [typePill, setTypePill] = useState<TypePill>("all");
  const [cryptoWalletsModalOpen, setCryptoWalletsModalOpen] = useState(false);
  const [walletCardMenuId, setWalletCardMenuId] = useState<string | null>(null);
  const [fiatDepositOpen, setFiatDepositOpen] = useState(false);
  const [fiatWithdrawOpen, setFiatWithdrawOpen] = useState(false);
  const [cryptoFlow, setCryptoFlow] = useState<CryptoFlowState>(null);
  const [txSearch, setTxSearch] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("");
  const [detailRow, setDetailRow] = useState<WalletTxRow | null>(null);
  const [adminActionNotice, setAdminActionNotice] = useState<string | null>(null);

  const uid = user.id;

  const fiatQ = useQuery({
    queryKey: ["admin", "user-fiat-wallets", uid],
    queryFn: () => fetchAdminUserFiatWallets(uid),
    enabled: Boolean(uid),
  });

  const virtualQ = useQuery({
    queryKey: ["admin", "user-virtual-accounts", uid],
    queryFn: () => fetchAdminUserVirtualAccounts(uid),
    enabled: Boolean(uid),
  });

  const depositAddrQ = useQuery({
    queryKey: ["admin", "user-deposit-addresses", uid],
    queryFn: () => fetchAdminUserDepositAddresses(uid),
    enabled: Boolean(uid),
  });

  const timelineQ = useQuery({
    queryKey: ["admin", "user-timeline-wallet", uid],
    queryFn: () => fetchAdminUserTimeline(uid, 80),
    enabled: Boolean(uid),
  });

  const refreshWalletData = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin", "user-fiat-wallets", uid] }),
      qc.invalidateQueries({ queryKey: ["admin", "user-virtual-accounts", uid] }),
      qc.invalidateQueries({ queryKey: ["admin", "user-timeline-wallet", uid] }),
    ]);
  };

  const fiatAdjustMut = useMutation({
    mutationFn: () =>
      adminAdjustFiat({
        user_id: Number(uid),
        currency: "NGN",
        direction: "credit",
        amount: 1000,
        note: "Admin quick top-up",
      }),
    onSuccess: async () => {
      setAdminActionNotice("Naira wallet credited (NGN 1,000).");
      await refreshWalletData();
    },
  });
  const cryptoAdjustMut = useMutation({
    mutationFn: () =>
      adminAdjustCrypto({
        user_id: Number(uid),
        currency: "USDT",
        direction: "credit",
        amount: 1,
        note: "Admin quick crypto top-up",
      }),
    onSuccess: async () => {
      setAdminActionNotice("Crypto wallet credited (1 USDT equivalent).");
      await refreshWalletData();
    },
  });

  useEffect(() => {
    if (!walletCardMenuId) return undefined;
    const close = () => setWalletCardMenuId(null);
    const t = window.setTimeout(() => {
      document.addEventListener("click", close);
    }, 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [walletCardMenuId]);

  const nairaDisplay = useMemo(
    () => nairaFromFiatWallets(fiatQ.data, user.walletBalanceDisplay),
    [fiatQ.data, user.walletBalanceDisplay]
  );

  const balanceFormattedModal = useMemo(() => {
    const raw = nairaDisplay.replace(/^₦\s*/, "").replace(/,/g, "").trim();
    const n = parseFloat(raw);
    if (!Number.isNaN(n)) {
      return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return nairaDisplay.includes("₦") ? nairaDisplay : `₦${nairaDisplay}`;
  }, [nairaDisplay]);

  const cryptoBalanceDisplay = useMemo(
    () => cryptoTotalDisplay(virtualQ.data ?? []),
    [virtualQ.data]
  );

  const cryptoWalletsFromApi = useMemo(
    () => mapDepositAddressesToWallets(depositAddrQ.data ?? []),
    [depositAddrQ.data]
  );

  const fiatBank = useMemo(
    () => virtualAccountToFiatBank(virtualQ.data ?? [], user.publicName),
    [virtualQ.data, user.publicName]
  );

  const baseTxRows: WalletTxRow[] = useMemo(() => {
    if (!timelineQ.data) return [];
    return mergeTimelineRows(timelineQ.data);
  }, [timelineQ.data]);

  const filteredTxRows = useMemo(() => {
    let rows = baseTxRows;
    if (typePill === "deposits") {
      rows = rows.filter((r) => r.subType.toLowerCase().includes("deposit"));
    } else if (typePill === "withdrawals") {
      rows = rows.filter((r) => r.subType.toLowerCase().includes("withdraw"));
    }
    if (txStatusFilter && txStatusFilter !== "all-status") {
      const want =
        txStatusFilter === "ok"
          ? "Successful"
          : txStatusFilter === "pend"
            ? "Pending"
            : txStatusFilter === "fail"
              ? "Failed"
              : null;
      if (want) rows = rows.filter((r) => r.status === want);
    }
    const q = txSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.amount.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.subType.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [baseTxRows, typePill, txSearch, txStatusFilter]);

  const segmentedPill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition-colors md:px-5 md:py-2 ${
      active ? "text-white shadow-sm" : "text-gray-700 hover:text-gray-900 bg-transparent"
    }`;

  const selectClass =
    "min-w-[130px] max-w-[200px] cursor-pointer appearance-none rounded-full border-0 py-2 pl-4 pr-9 text-sm font-semibold text-gray-700 shadow-none focus:outline-none focus:ring-2 focus:ring-[#1B800F]/25 md:py-2.5 md:pl-5 md:pr-10";

  const loadingWallet = fiatQ.isLoading || virtualQ.isLoading || depositAddrQ.isLoading;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">User Wallets</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fiatAdjustMut.mutate()}
            disabled={fiatAdjustMut.isPending}
            className="rounded-full bg-[#E8E8E8] px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-[#DDDDDD] disabled:opacity-60"
          >
            Add NGN Fund
          </button>
          <button
            type="button"
            onClick={() => cryptoAdjustMut.mutate()}
            disabled={cryptoAdjustMut.isPending}
            className="rounded-full bg-[#E8E8E8] px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-[#DDDDDD] disabled:opacity-60"
          >
            Add Crypto Fund
          </button>
        </div>
      </div>
      {adminActionNotice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {adminActionNotice}
        </div>
      ) : null}

      {timelineQ.isError ? (
        <p className="text-sm text-red-600">{(timelineQ.error as Error)?.message ?? "Could not load transactions."}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <BalanceTextureCard
          title="Naira Balance"
          amount={nairaDisplay.includes("₦") ? nairaDisplay : `₦${nairaDisplay}`}
          bgUrl={NAIRA_WALLET_BG}
          fallbackTint="#0d4a0a"
          showActions
          onFiatAction={(action) => {
            if (action === "deposit") setFiatDepositOpen(true);
            else setFiatWithdrawOpen(true);
          }}
        />
        <BalanceTextureCard
          title="Crypto balance (USD total)"
          amount={loadingWallet ? "…" : cryptoBalanceDisplay}
          bgUrl={CRYPTO_WALLET_BG}
          fallbackTint="#3d2817"
        />
      </div>

      <section className="rounded-3xl bg-[#F3F4F6] p-5 shadow-sm md:p-6">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-lg font-bold text-gray-900">Crypto Wallets</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                className={selectClass}
                style={{ backgroundColor: FILTER_DROPDOWN_BG }}
                defaultValue=""
                aria-label="Crypto filter"
              >
                <option value="">Crypto</option>
                <option value="all-crypto">All Crypto</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
            </div>
            <div className="relative">
              <select
                className={selectClass}
                style={{ backgroundColor: FILTER_DROPDOWN_BG }}
                defaultValue=""
                aria-label="Network filter"
              >
                <option value="">Network</option>
                <option value="all-net">All Network</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
            </div>
            <button
              type="button"
              onClick={() => setCryptoWalletsModalOpen(true)}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: GREEN }}
            >
              View All
            </button>
          </div>
        </div>

        {depositAddrQ.isError ? (
          <p className="text-sm text-red-600">{(depositAddrQ.error as Error)?.message ?? "Could not load addresses."}</p>
        ) : null}

        <div className="-mx-1 flex gap-4 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]">
          {cryptoWalletsFromApi.length === 0 && !depositAddrQ.isLoading ? (
            <p className="text-sm text-gray-600">No on-chain deposit addresses for this user yet.</p>
          ) : null}
          {cryptoWalletsFromApi.map((w) => {
            const net = w.networkLabel ?? w.network;
            return (
              <div
                key={w.id}
                data-wallet-card-menu=""
                className="relative min-w-[200px] max-w-[220px] shrink-0 rounded-2xl bg-[#E8E8EA] p-4 pr-10 shadow-sm"
              >
                <button
                  type="button"
                  className="absolute right-2 top-3 rounded-lg p-1.5 text-gray-600 hover:bg-black/5"
                  aria-expanded={walletCardMenuId === w.id}
                  aria-label="Wallet actions"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWalletCardMenuId((prev) => (prev === w.id ? null : w.id));
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {walletCardMenuId === w.id ? (
                  <div
                    className="absolute right-2 top-11 z-20 min-w-[140px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                    role="menu"
                  >
                    {WALLET_CARD_MENU.map((label) => (
                      <button
                        key={label}
                        type="button"
                        role="menuitem"
                        className="block w-full px-4 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                        onClick={() => {
                          setWalletCardMenuId(null);
                          if (label === "Deposit") setCryptoFlow({ kind: "deposit", wallet: w });
                          else if (label === "Withdraw") setCryptoFlow({ kind: "withdraw", wallet: w });
                          else if (label === "Buy") setCryptoFlow({ kind: "pay", wallet: w, title: "Pay" });
                          else if (label === "Sell") setCryptoFlow({ kind: "pay", wallet: w, title: "Sell" });
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: w.iconBg }}
                  >
                    {w.symbol.slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">{w.symbol}</p>
                    <p className="text-xs font-medium text-gray-500">{w.name}</p>
                  </div>
                </div>
                <p className="mt-3 text-lg font-bold text-gray-900">{w.amount}</p>
                <p className="text-sm font-semibold text-gray-700">{w.usdValue}</p>
                <p className="mt-2 text-[11px] font-medium text-gray-500">Net: {net}</p>
              </div>
            );
          })}
        </div>
      </section>

      <CryptoWalletsModal
        open={cryptoWalletsModalOpen}
        onClose={() => setCryptoWalletsModalOpen(false)}
        items={cryptoWalletsFromApi}
        onWalletAction={(action, item) => {
          setCryptoWalletsModalOpen(false);
          if (action === "deposit") setCryptoFlow({ kind: "deposit", wallet: item });
          else if (action === "withdraw") setCryptoFlow({ kind: "withdraw", wallet: item });
          else if (action === "transfer") setCryptoFlow({ kind: "pay", wallet: item, title: "Pay" });
        }}
      />

      <CryptoDepositModal
        open={cryptoFlow?.kind === "deposit"}
        onClose={() => setCryptoFlow(null)}
        symbol={cryptoFlow?.kind === "deposit" ? cryptoFlow.wallet.symbol : "BTC"}
        depositAddress={cryptoFlow?.kind === "deposit" ? cryptoFlow.wallet.depositAddress : undefined}
      />

      <CryptoWithdrawModal
        open={cryptoFlow?.kind === "withdraw"}
        onClose={() => setCryptoFlow(null)}
        symbol={cryptoFlow?.kind === "withdraw" ? cryptoFlow.wallet.symbol : "BTC"}
        balanceAmount={cryptoFlow?.kind === "withdraw" ? cryptoFlow.wallet.amount : "0"}
      />

      <CryptoPayModal
        open={cryptoFlow?.kind === "pay"}
        onClose={() => setCryptoFlow(null)}
        title={cryptoFlow?.kind === "pay" ? cryptoFlow.title : "Pay"}
        symbol={cryptoFlow?.kind === "pay" ? cryptoFlow.wallet.symbol : "BTC"}
        balanceAmount={cryptoFlow?.kind === "pay" ? cryptoFlow.wallet.amount : "0"}
      />

      <FiatDepositModal
        open={fiatDepositOpen}
        onClose={() => setFiatDepositOpen(false)}
        balanceFormatted={balanceFormattedModal}
        bank={fiatBank}
      />

      <FiatWithdrawalModal
        open={fiatWithdrawOpen}
        onClose={() => setFiatWithdrawOpen(false)}
        balanceFormatted={balanceFormattedModal}
        withdrawalAccounts={[]}
      />

      <p className="text-sm text-gray-600">
        Naira activity only — bill payments and crypto are excluded. Use the main Transactions page for full history.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div
          className="flex w-fit max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto rounded-full p-1 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-1 md:p-1.5 [&::-webkit-scrollbar]:hidden"
          style={{ backgroundColor: FILTER_TRACK_BG }}
          role="group"
          aria-label="Transaction type"
        >
          <button
            type="button"
            onClick={() => setTypePill("all")}
            className={segmentedPill(typePill === "all")}
            style={typePill === "all" ? { backgroundColor: GREEN } : undefined}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setTypePill("deposits")}
            className={segmentedPill(typePill === "deposits")}
            style={typePill === "deposits" ? { backgroundColor: GREEN } : undefined}
          >
            Deposits
          </button>
          <button
            type="button"
            onClick={() => setTypePill("withdrawals")}
            className={segmentedPill(typePill === "withdrawals")}
            style={typePill === "withdrawals" ? { backgroundColor: GREEN } : undefined}
          >
            Withdrawal
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="relative">
            <select
              className={selectClass}
              style={{ backgroundColor: FILTER_DROPDOWN_BG }}
              value={txStatusFilter}
              onChange={(e) => setTxStatusFilter(e.target.value)}
              aria-label="Tx status"
            >
              <option value="">Tx Status</option>
              <option value="all-status">All Status</option>
              <option value="ok">Successful</option>
              <option value="pend">Pending</option>
              <option value="fail">Failed</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          </div>
          <div className="relative">
            <select className={selectClass} style={{ backgroundColor: FILTER_DROPDOWN_BG }} defaultValue="">
              <option value="">Bulk Action</option>
              <option value="export">Export</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: LATEST_HEADER_GREEN }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">Transactions</h2>
          <div className="relative w-full md:max-w-[280px]">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
              strokeWidth={2}
            />
            <input
              type="search"
              placeholder="Search"
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              className="w-full rounded-full border-0 py-3 pl-11 pr-5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ backgroundColor: LATEST_SEARCH_BG }}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: LATEST_COL_HEADER_BG }}>
                <th className="w-12 px-5 py-4 align-middle font-semibold text-gray-600">
                  <span className="sr-only">Select</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-2 border-gray-400 bg-white accent-[#21D721]"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-5 py-4 font-semibold text-gray-700">Transaction id</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Amount</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Status</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Type</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Sub-type</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Date</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {timelineQ.isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-500">
                    Loading transactions…
                  </td>
                </tr>
              ) : filteredTxRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-500">
                    No transactions match your filters.
                  </td>
                </tr>
              ) : (
                filteredTxRows.map((row, i) => (
                  <tr
                    key={`${row.id}-${i}`}
                    className="align-middle"
                    style={{ backgroundColor: i % 2 === 0 ? LATEST_ROW_A : LATEST_ROW_B }}
                  >
                    <td className="px-5 py-4 align-middle">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-2 border-gray-400 bg-white accent-[#21D721]"
                        aria-label={`Select ${row.id}`}
                      />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-800 md:text-sm">{row.id}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{row.amount}</td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: statusStyle(row.status) }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{row.type}</td>
                    <td className="px-5 py-4 text-gray-700">{row.subType}</td>
                    <td className="px-5 py-4 text-gray-700">{row.date}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setDetailRow(row)}
                        className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                        style={{ backgroundColor: LATEST_ACTION_LIGHT }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <WalletNairaDetailModal row={detailRow} onClose={() => setDetailRow(null)} />
    </div>
  );
};

export default WalletPanel;
