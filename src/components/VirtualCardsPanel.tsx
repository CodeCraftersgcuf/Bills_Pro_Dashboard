import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, Search, X } from "lucide-react";
import type { User } from "../data/users";
import type { UserVirtualCard, VirtualCardTxKind, VirtualCardTxRow } from "../data/userVirtualCards";
import {
  type AdminVirtualCardSummary,
  type AdminVirtualCardTxRow,
  adminFundVirtualCard,
  adminUnfreezeVirtualCard,
  fetchAdminVirtualCardTransactions,
  fetchAdminVirtualCardsForUser,
} from "../api/adminVirtualCards";
import VirtualCardDetailsModal from "./VirtualCardDetailsModal";
import { virtualCardSurfaceStyle } from "../utils/virtualCardSurface";
import { humanizeApiLabelOrDash } from "../utils/humanizeApiLabel";
import { downloadCsv } from "../utils/csvDownload";

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

type CardStatusFilter = "all" | "active" | "frozen";
type TxPill = "all" | "deposits" | "withdrawals" | "payments";
type DatePreset = "all" | "7d" | "30d" | "90d";

function statusColor(s: VirtualCardTxRow["status"]): string {
  switch (s) {
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

function detailsBtnColor(v: UserVirtualCard["detailsButtonVariant"]): string {
  switch (v) {
    case "green":
      return LATEST_ACTION_LIGHT;
    case "orange":
      return "#EA580C";
    case "pink":
      return "#DB2777";
    default:
      return LATEST_ACTION_LIGHT;
  }
}

function matchesCardFilter(card: UserVirtualCard, f: CardStatusFilter): boolean {
  if (f === "all") return true;
  return f === "active" ? card.status === "active" : card.status === "frozen";
}

function mapApiCard(c: AdminVirtualCardSummary): UserVirtualCard {
  return {
    id: String(c.id),
    userId: String(c.user_id),
    shortName: c.short_name,
    title: c.title,
    balanceDisplay: c.balance_display,
    lastFour: c.last_four,
    status: c.status,
    detailsButtonVariant: c.details_button_variant,
    cardColor: c.card_color,
  };
}

function mapApiTxRow(r: AdminVirtualCardTxRow, userId: string): VirtualCardTxRow {
  return {
    id: r.id,
    userId,
    amount: r.amount,
    status: r.status,
    cardLabel: r.card_label,
    subType: humanizeApiLabelOrDash(r.sub_type),
    date: r.date,
    kind: r.kind as VirtualCardTxKind,
    databaseId: r.database_id,
  };
}

function txStableKey(r: VirtualCardTxRow): string {
  const db = r.databaseId != null ? String(r.databaseId) : "";
  return `${db || "nodb"}:${r.id}`;
}

function dateRangeFromPreset(p: DatePreset): { date_from?: string; date_to?: string } {
  if (p === "all") return {};
  const end = new Date();
  const start = new Date();
  const days = p === "7d" ? 7 : p === "30d" ? 30 : 90;
  start.setDate(end.getDate() - days);
  const toYmd = (d: Date) => d.toISOString().slice(0, 10);
  return { date_from: toYmd(start), date_to: toYmd(end) };
}

export interface VirtualCardsPanelProps {
  user: User;
}

/** Shared virtual cards workspace: carousel, transactions, tx + card detail modals (User Management & Virtual Cards page). */
const VirtualCardsPanel: React.FC<VirtualCardsPanelProps> = ({ user }) => {
  const qc = useQueryClient();

  const [cardStatusFilter, setCardStatusFilter] = useState<CardStatusFilter>("active");
  const [revealIds, setRevealIds] = useState<Record<string, boolean>>({});
  const [txPill, setTxPill] = useState<TxPill>("all");
  const [txStatus, setTxStatus] = useState("");
  const [cardTxFilter, setCardTxFilter] = useState("");
  const [search, setSearch] = useState("");
  const searchDeferred = useDeferredValue(search);
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [detailRow, setDetailRow] = useState<VirtualCardTxRow | null>(null);
  const [detailCardId, setDetailCardId] = useState<number | null>(null);
  const [fundingNotice, setFundingNotice] = useState<string | null>(null);
  const [selectedTxByKey, setSelectedTxByKey] = useState<Map<string, VirtualCardTxRow>>(() => new Map());
  const [bulkPanel, setBulkPanel] = useState<"bulk" | "export">("bulk");
  const selectAllTxRef = useRef<HTMLInputElement>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);

  const dr = useMemo(() => dateRangeFromPreset(datePreset), [datePreset]);

  const cardsQuery = useQuery({
    queryKey: ["admin", "vcards", user.id, cardStatusFilter],
    queryFn: () => fetchAdminVirtualCardsForUser(user.id, cardStatusFilter).then((r) => r.cards),
    enabled: Boolean(user.id),
  });

  const apiCardsMapped = useMemo(
    () => (cardsQuery.data ?? []).map(mapApiCard),
    [cardsQuery.data]
  );
  const allCards: UserVirtualCard[] = apiCardsMapped;

  const filteredCards = useMemo(
    () => allCards.filter((c) => matchesCardFilter(c, cardStatusFilter)),
    [allCards, cardStatusFilter]
  );

  const txCategory =
    txPill === "all" ? "all" : txPill === "deposits" ? "deposits" : txPill === "withdrawals" ? "withdrawals" : "payments";

  const txStatusApi =
    !txStatus || txStatus === "all-status"
      ? "all"
      : txStatus === "successful"
        ? "successful"
        : txStatus === "pending"
          ? "pending"
          : txStatus === "failed"
            ? "failed"
            : "all";

  const virtualCardIdParam = useMemo(() => {
    if (!cardTxFilter || cardTxFilter === "all" || cardTxFilter === "all-cards") return undefined;
    if (/^\d+$/.test(cardTxFilter)) return Number(cardTxFilter);
    return undefined;
  }, [cardTxFilter]);

  const txQuery = useQuery({
    queryKey: [
      "admin",
      "vctx",
      user.id,
      txCategory,
      txStatusApi,
      virtualCardIdParam,
      searchDeferred,
      dr.date_from ?? "",
      dr.date_to ?? "",
    ],
    queryFn: () =>
      fetchAdminVirtualCardTransactions(user.id, {
        category: txCategory as "all" | "deposits" | "withdrawals" | "payments",
        tx_status: txStatusApi as "all" | "successful" | "pending" | "failed",
        virtual_card_id: virtualCardIdParam,
        search: searchDeferred.trim() || undefined,
        date_from: dr.date_from,
        date_to: dr.date_to,
        per_page: 80,
      }),
    enabled: Boolean(user.id),
  });

  const filteredTx: VirtualCardTxRow[] = useMemo(() => {
    if (!txQuery.data?.data) return [];
    return txQuery.data.data.map((r) => mapApiTxRow(r, user.id));
  }, [txQuery.data, user.id]);

  useEffect(() => {
    setSelectedTxByKey(new Map());
  }, [user.id, txPill, txStatus, cardTxFilter, searchDeferred, datePreset]);

  const allTxOnPageSelected =
    filteredTx.length > 0 && filteredTx.every((r) => selectedTxByKey.has(txStableKey(r)));
  const someTxOnPageSelected = filteredTx.some((r) => selectedTxByKey.has(txStableKey(r)));

  useEffect(() => {
    const el = selectAllTxRef.current;
    if (!el) return;
    el.indeterminate = someTxOnPageSelected && !allTxOnPageSelected;
  }, [allTxOnPageSelected, someTxOnPageSelected, filteredTx]);

  const toggleTxRow = (row: VirtualCardTxRow) => {
    const k = txStableKey(row);
    setSelectedTxByKey((prev) => {
      const next = new Map(prev);
      if (next.has(k)) next.delete(k);
      else next.set(k, row);
      return next;
    });
  };

  const toggleAllTxOnPage = () => {
    const all = filteredTx.length > 0 && filteredTx.every((r) => selectedTxByKey.has(txStableKey(r)));
    setSelectedTxByKey((prev) => {
      const next = new Map(prev);
      if (all) {
        filteredTx.forEach((r) => next.delete(txStableKey(r)));
      } else {
        filteredTx.forEach((r) => next.set(txStableKey(r), r));
      }
      return next;
    });
  };

  const onBulkPanelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as "bulk" | "export";
    setBulkPanel("bulk");
    if (v !== "export") return;
    const list = Array.from(selectedTxByKey.values());
    if (list.length === 0) {
      window.alert("Select at least one transaction to export.");
      return;
    }
    downloadCsv(
      `virtual-card-transactions-user-${user.id}`,
      ["transaction_id", "amount", "status", "card", "sub_type", "date", "kind", "database_id"],
      list.map((r) => [
        r.id,
        r.amount,
        r.status,
        r.cardLabel,
        r.subType,
        r.date,
        r.kind,
        r.databaseId ?? "",
      ])
    );
  };

  const unfreezeMut = useMutation({
    mutationFn: (cardId: number) => adminUnfreezeVirtualCard(cardId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "vcards", user.id] });
      void qc.invalidateQueries({ queryKey: ["admin", "vc-summary"] });
      void qc.invalidateQueries({ queryKey: ["admin", "vc-users-overview"] });
    },
  });
  const fundMut = useMutation({
    mutationFn: (cardId: number) =>
      adminFundVirtualCard(cardId, {
        amount: 5,
        payment_wallet_type: "naira_wallet",
        payment_wallet_currency: "NGN",
      }),
    onSuccess: async () => {
      setFundingNotice("Card funding submitted (USD 5 via Naira wallet).");
      await qc.invalidateQueries({ queryKey: ["admin", "vcards", user.id] });
      await qc.invalidateQueries({ queryKey: ["admin", "vctx", user.id] });
    },
  });

  const cardOptions = useMemo(() => {
    return filteredCards.map((c) => ({ value: String(c.id), label: c.shortName }));
  }, [filteredCards]);

  const scrollCarousel = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-vcard-slide]");
    const w = card?.offsetWidth ?? 320;
    el.scrollBy({ left: dir * (w + 16), behavior: "smooth" });
  };

  const segmentedPill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition-colors md:px-5 md:py-2 ${
      active ? "text-white shadow-sm" : "text-gray-700 hover:text-gray-900 bg-transparent"
    }`;

  const tabUnderline = (active: boolean) =>
    `relative pb-2.5 text-sm font-semibold transition-colors ${
      active ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
    }`;

  const selectClass =
    "min-w-[120px] max-w-[180px] cursor-pointer appearance-none rounded-full border-0 py-2 pl-4 pr-9 text-sm font-semibold text-gray-700 shadow-none focus:outline-none focus:ring-2 focus:ring-[#1B800F]/25 md:py-2.5 md:pl-5 md:pr-10";

  const openCardDetails = (card: UserVirtualCard) => {
    if (/^\d+$/.test(card.id)) {
      setDetailCardId(Number(card.id));
    }
  };

  return (
    <div className="space-y-8 md:space-y-10">
      {cardsQuery.isError ? (
        <p className="text-sm text-red-600">
          {(cardsQuery.error as Error)?.message ?? "Could not load virtual cards."}
        </p>
      ) : null}

      {txQuery.isError ? (
        <p className="text-sm text-red-600">
          {(txQuery.error as Error)?.message ?? "Could not load virtual card transactions."}
        </p>
      ) : null}
      {fundingNotice ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {fundingNotice}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="relative inline-flex w-full sm:w-auto">
          <select
            className="w-full cursor-pointer appearance-none rounded-full border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-gray-800 shadow-sm sm:min-w-[180px]"
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DatePreset)}
            aria-label="Select date range"
          >
            <option value="all">Select Date</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            strokeWidth={2}
          />
        </div>
      </div>

      {/* User Cards — carousel */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-gray-900 md:text-xl">User Cards</h2>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <div
              className="flex flex-wrap items-center gap-6 border-b border-gray-200"
              role="tablist"
              aria-label="Card status"
            >
              {(
                [
                  ["all", "All"],
                  ["active", "Active"],
                  ["frozen", "Frozen"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={cardStatusFilter === key}
                  onClick={() => setCardStatusFilter(key)}
                  className={tabUnderline(cardStatusFilter === key)}
                >
                  {label}
                  {cardStatusFilter === key && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ backgroundColor: GREEN }}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollCarousel(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                aria-label="Previous cards"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                aria-label="Next cards"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {cardsQuery.isLoading ? (
            <p className="w-full py-8 text-center text-sm text-gray-500">Loading cards…</p>
          ) : filteredCards.length === 0 ? (
            <p className="w-full py-8 text-center text-sm text-gray-500">No cards for this filter.</p>
          ) : (
            filteredCards.map((card) => {
              const revealed = revealIds[card.id] ?? false;
              const pan = revealed ? `4532 8899 0144 ${card.lastFour}` : `**** **** **** ${card.lastFour}`;
              const frozen = card.status === "frozen";
              return (
                <article
                  key={card.id}
                  data-vcard-slide
                  className="relative w-[min(100%,340px)] shrink-0 snap-center overflow-hidden rounded-[22px] border border-white/10 shadow-xl"
                  style={virtualCardSurfaceStyle(card.cardColor)}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_60%,#21D721,transparent_35%)]" />
                  <div className="relative flex min-h-[200px] flex-col p-5 text-white md:min-h-[220px] md:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <p className="max-w-[70%] text-[11px] font-medium leading-snug text-white/85 md:text-xs">
                        {card.title}
                      </p>
                      <span className="shrink-0 text-sm font-bold tracking-tight text-white">Bills Pro</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <p className="text-2xl font-bold tracking-tight md:text-[1.65rem]">{card.balanceDisplay}</p>
                      <button
                        type="button"
                        onClick={() => setRevealIds((m) => ({ ...m, [card.id]: !revealed }))}
                        className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label={revealed ? "Hide card number" : "Show card number"}
                      >
                        {revealed ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="mt-3 font-mono text-sm tracking-[0.2em] text-white/90">{pan}</p>
                    <p className="mt-1 text-xs font-medium text-white/75">{user.profileFullName}</p>
                    <div className="mt-auto flex justify-end pt-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => /^\d+$/.test(card.id) && fundMut.mutate(Number(card.id))}
                          disabled={fundMut.isPending}
                          className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-60"
                        >
                          Fund
                        </button>
                        <button
                          type="button"
                          onClick={() => openCardDetails(card)}
                          className="rounded-full px-5 py-2 text-xs font-bold text-white shadow-md transition-opacity hover:opacity-95"
                          style={{ backgroundColor: detailsBtnColor(card.detailsButtonVariant) }}
                        >
                          Card Details
                        </button>
                      </div>
                    </div>
                  </div>

                  {frozen ? (
                    <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-3 bg-[#1B800F]/65 px-4 backdrop-blur-[1px]">
                      <p className="text-center text-base font-bold text-white drop-shadow">Card Frozen</p>
                      {/^\d+$/.test(card.id) ? (
                        <button
                          type="button"
                          disabled={unfreezeMut.isPending}
                          onClick={() => unfreezeMut.mutate(Number(card.id))}
                          className="rounded-full px-6 py-2.5 text-sm font-bold text-[#1B800F] shadow-md transition-opacity hover:opacity-95 disabled:opacity-60"
                          style={{ backgroundColor: LATEST_ACTION_LIGHT }}
                        >
                          {unfreezeMut.isPending ? "…" : "Unfreeze"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* Virtual card transactions */}
      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: LATEST_HEADER_GREEN }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">Virtual Card Transactions</h2>
          <div className="relative w-full md:max-w-[280px]">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full rounded-full border-0 py-3 pl-5 pr-11 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ backgroundColor: LATEST_SEARCH_BG }}
              aria-label="Search transactions"
            />
            <Search
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/80"
              strokeWidth={2}
            />
          </div>
        </div>

        <div className="border-b border-gray-100 px-5 py-4 md:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:flex-wrap xl:items-center xl:justify-between">
            <div
              className="flex w-fit max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto rounded-full p-1 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-1 md:p-1.5 [&::-webkit-scrollbar]:hidden"
              style={{ backgroundColor: FILTER_TRACK_BG }}
              role="group"
              aria-label="Transaction type"
            >
              {(
                [
                  ["all", "All"],
                  ["deposits", "Deposits"],
                  ["withdrawals", "Withdrawals"],
                  ["payments", "Payments"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTxPill(key)}
                  className={segmentedPill(txPill === key)}
                  style={txPill === key ? { backgroundColor: GREEN } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="relative inline-flex">
                <select
                  className={selectClass}
                  style={{ backgroundColor: FILTER_DROPDOWN_BG }}
                  value={txStatus}
                  onChange={(e) => setTxStatus(e.target.value)}
                  aria-label="Transaction status"
                >
                  <option value="">TX Status</option>
                  <option value="all-status">All status</option>
                  <option value="successful">Successful</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">▾</span>
              </div>
              <div className="relative inline-flex">
                <select
                  className={selectClass}
                  style={{ backgroundColor: FILTER_DROPDOWN_BG }}
                  value={cardTxFilter}
                  onChange={(e) => setCardTxFilter(e.target.value)}
                  aria-label="Filter by card"
                >
                  <option value="">Card</option>
                  <option value="all">All cards</option>
                  {cardOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">▾</span>
              </div>
              <div className="relative inline-flex">
                <select
                  className={selectClass}
                  style={{ backgroundColor: FILTER_DROPDOWN_BG }}
                  value={bulkPanel}
                  onChange={onBulkPanelChange}
                  aria-label="Bulk action"
                >
                  <option value="bulk">Bulk Action</option>
                  <option value="export">Export selected</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">▾</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: LATEST_COL_HEADER_BG }}>
                <th className="w-14 px-5 py-4 align-middle font-semibold text-gray-600">
                  <span className="sr-only">Select</span>
                  <input
                    ref={selectAllTxRef}
                    type="checkbox"
                    checked={allTxOnPageSelected}
                    onChange={toggleAllTxOnPage}
                    className="h-4 w-4 rounded border-2 border-gray-400 bg-white accent-[#21D721]"
                    aria-label="Select all on this page"
                  />
                </th>
                <th className="px-5 py-4 font-semibold text-gray-700">Transaction id</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Amount</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Status</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Card</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Sub-type</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Date</th>
                <th className="px-5 py-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {txQuery.isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-500">
                    Loading transactions…
                  </td>
                </tr>
              ) : filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-500">
                    No transactions match your filters.
                  </td>
                </tr>
              ) : (
                filteredTx.map((row, i) => (
                  <tr
                    key={row.databaseId != null ? `db-${row.databaseId}` : `${row.id}-${i}`}
                    className="align-middle"
                    style={{ backgroundColor: i % 2 === 0 ? LATEST_ROW_A : LATEST_ROW_B }}
                  >
                    <td className="px-5 py-4 align-middle">
                      <input
                        type="checkbox"
                        checked={selectedTxByKey.has(txStableKey(row))}
                        onChange={() => toggleTxRow(row)}
                        className="h-4 w-4 rounded border-2 border-gray-400 bg-white accent-[#21D721]"
                        aria-label={`Select ${row.id}`}
                      />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-800 md:text-sm">{row.id}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{row.amount}</td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: statusColor(row.status) }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{row.cardLabel}</td>
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

      {detailRow ? (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 sm:p-6" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={() => setDetailRow(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vc-tx-detail-title"
            className="relative z-[261] w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="vc-tx-detail-title" className="text-lg font-bold text-gray-900">
                Virtual card transaction
              </h2>
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Transaction id</dt>
                <dd className="font-mono text-right text-gray-900">{detailRow.id}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Amount</dt>
                <dd className="font-semibold text-gray-900">{detailRow.amount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Status</dt>
                <dd className="text-gray-900">{detailRow.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Card</dt>
                <dd className="text-gray-900">{detailRow.cardLabel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Sub-type</dt>
                <dd className="text-gray-900">{detailRow.subType}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Date</dt>
                <dd className="text-gray-900">{detailRow.date}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setDetailRow(null)}
              className="mt-6 w-full rounded-full py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: GREEN }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <VirtualCardDetailsModal
        open={detailCardId != null}
        cardId={detailCardId}
        holderName={user.profileFullName}
        userId={user.id}
        onClose={() => setDetailCardId(null)}
      />
    </div>
  );
};

export default VirtualCardsPanel;
