import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Search, X } from "lucide-react";
import {
  createSweepOrder,
  executeSweepOnChain,
  fetchCryptoDeposits,
  fetchCryptoVendors,
  fetchReceivedAssets,
  type CryptoDepositRow,
} from "../../api/adminCryptoTreasury";
import { getAdminToken } from "../../api/authToken";

const HEADER = "#21D721";
const ROW_A = "#F9F9F9";
const ROW_B = "#E6E6E6";

function txHash(meta: Record<string, unknown> | null): string {
  const h = meta?.tx_hash;
  return typeof h === "string" ? h : "—";
}

const ReceivedCrypto: React.FC = () => {
  const hasToken = Boolean(getAdminToken());
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [currency, setCurrency] = useState("");
  const [searchHash, setSearchHash] = useState("");
  const [ledgerTab, setLedgerTab] = useState<"user_transactions" | "received_assets">("user_transactions");

  const depositsQ = useQuery({
    queryKey: ["admin", "crypto-deposits", page, currency, searchHash],
    queryFn: () =>
      fetchCryptoDeposits({
        page,
        per_page: 25,
        currency: currency.trim() || undefined,
        tx_hash: searchHash.trim() || undefined,
      }),
    enabled: hasToken && ledgerTab === "user_transactions",
  });

  const receivedAssetsQ = useQuery({
    queryKey: ["admin", "received-assets", page, currency, searchHash],
    queryFn: () =>
      fetchReceivedAssets({
        page,
        per_page: 25,
        currency: currency.trim() || undefined,
        tx_hash: searchHash.trim() || undefined,
      }),
    enabled: hasToken && ledgerTab === "received_assets",
  });

  const vendorsQ = useQuery({
    queryKey: ["admin", "crypto-vendors-sweep"],
    queryFn: () => fetchCryptoVendors(true),
    enabled: hasToken,
  });

  const [modal, setModal] = useState<CryptoDepositRow | null>(null);
  const [target, setTarget] = useState<"master" | "vendor">("master");
  const [vendorId, setVendorId] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [stepMsg, setStepMsg] = useState<string | null>(null);

  const sweepMut = useMutation({
    mutationFn: async () => {
      if (!modal?.virtual_account_hint) throw new Error("Missing virtual account on this deposit.");
      const vaId = modal.virtual_account_hint.id;
      const amt = amount.trim();
      if (!amt || Number(amt) <= 0) throw new Error("Enter a valid amount.");

      const order = await createSweepOrder({
        sweep_target: target,
        virtual_account_id: vaId,
        amount: amt,
        vendor_id: target === "vendor" ? Number(vendorId) : undefined,
      });
      setStepMsg(`Sweep #${order.id} created. Broadcasting on-chain…`);
      const done = await executeSweepOnChain(order.id);
      return done;
    },
    onSuccess: () => {
      setStepMsg("Sweep completed.");
      qc.invalidateQueries({ queryKey: ["admin", "crypto-deposits"] });
      qc.invalidateQueries({ queryKey: ["admin", "received-assets"] });
      qc.invalidateQueries({ queryKey: ["admin", "master-wallet-tx"] });
      setTimeout(() => {
        setModal(null);
        setStepMsg(null);
      }, 1200);
    },
    onError: (e: Error) => {
      setStepMsg(e.message ?? "Sweep failed.");
    },
  });

  const rows = depositsQ.data?.data ?? [];
  const totalPages = depositsQ.data?.last_page ?? 1;
  const assetRows = receivedAssetsQ.data?.data ?? [];
  const assetTotalPages = receivedAssetsQ.data?.last_page ?? 1;

  const vendorsForRow = useMemo(() => {
    if (!modal?.virtual_account_hint) return [];
    const c = modal.virtual_account_hint.currency;
    const b = modal.virtual_account_hint.blockchain;
    return (vendorsQ.data ?? []).filter((v) => v.currency === c && v.blockchain === b);
  }, [modal, vendorsQ.data]);

  const openSweep = (row: CryptoDepositRow) => {
    setModal(row);
    setTarget("master");
    setVendorId("");
    setStepMsg(null);
    const avail = row.virtual_account_hint?.available_balance ?? "";
    setAmount(avail ? String(Number(avail)) : "");
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Received crypto (on-chain)</h1>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["user_transactions", "User transactions (ledger)"],
              ["received_assets", "Received assets (custody)"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setLedgerTab(k);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                ledgerTab === k ? "bg-[#1B800F] text-white shadow-sm" : "bg-[#E8E8E8] text-gray-800 hover:bg-[#DDDDDD]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!hasToken ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Log in as admin to load data.
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs font-medium text-gray-700">
          Currency filter
          <input
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value.toUpperCase());
              setPage(1);
            }}
            placeholder="e.g. USDT"
            className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex min-w-[200px] flex-col text-xs font-medium text-gray-700">
          Tx hash contains
          <div className="relative mt-1">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchHash}
              onChange={(e) => {
                setSearchHash(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm"
              placeholder="0x…"
            />
          </div>
        </label>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div className="px-5 py-4 text-white md:px-7" style={{ backgroundColor: HEADER }}>
          <h2 className="text-lg font-semibold">
            {ledgerTab === "user_transactions" ? "User ledger (transactions)" : "Received assets (custody ledger)"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          {ledgerTab === "user_transactions" ? (
            <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
              <thead>
                <tr style={{ backgroundColor: "#EBEBEB" }}>
                  <th className="px-3 py-3 font-semibold text-gray-700">Date</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">User</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">Asset</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">Amount</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">Tx hash</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">VA available</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">Sweep</th>
                </tr>
              </thead>
              <tbody>
                {depositsQ.isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      No deposits found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? ROW_A : ROW_B }}>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-800">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-800">{r.user?.email ?? r.user_id}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{r.currency}</td>
                      <td className="px-3 py-2 text-gray-900">{r.amount}</td>
                      <td className="max-w-[200px] truncate px-3 py-2 font-mono text-xs text-gray-700">
                        {txHash(r.metadata)}
                      </td>
                      <td className="px-3 py-2 text-gray-800">
                        {r.virtual_account_hint?.available_balance ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          disabled={!r.virtual_account_hint}
                          onClick={() => openSweep(r)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#1B800F] px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                          Sweep
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead>
                <tr style={{ backgroundColor: "#EBEBEB" }}>
                  <th className="px-3 py-3 font-semibold text-gray-700">Date</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">User</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">Chain / asset</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">Amount</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">On-chain tx</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">Log</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">Ledger ref</th>
                  <th className="px-3 py-3 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {receivedAssetsQ.isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                ) : assetRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      No received asset rows yet (created when webhooks credit a virtual account).
                    </td>
                  </tr>
                ) : (
                  assetRows.map((r, i) => (
                    <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? ROW_A : ROW_B }}>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-800">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-800">{r.user?.email ?? r.user_id}</td>
                      <td className="px-3 py-2 text-gray-900">
                        {r.blockchain} / {r.currency}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900">{r.amount}</td>
                      <td className="max-w-[180px] truncate px-3 py-2 font-mono text-xs text-gray-700">{r.tx_hash}</td>
                      <td className="px-3 py-2 text-gray-700">{r.log_index}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-700">
                        {r.transaction?.transaction_id ?? `#${r.transaction_id}`}
                      </td>
                      <td className="px-3 py-2 text-gray-800">{r.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        {(ledgerTab === "user_transactions" ? totalPages : assetTotalPages) > 1 ? (
          <div className="flex items-center justify-center gap-2 border-t border-gray-100 px-4 py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {ledgerTab === "user_transactions" ? totalPages : assetTotalPages}
            </span>
            <button
              type="button"
              disabled={page >= (ledgerTab === "user_transactions" ? totalPages : assetTotalPages)}
              onClick={() =>
                setPage((p) =>
                  Math.min(ledgerTab === "user_transactions" ? totalPages : assetTotalPages, p + 1)
                )
              }
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Sweep custodial funds</h3>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Moves up to the amount from the user&apos;s deposit address on-chain. Virtual account balance must cover the
              amount (ledger debit runs after broadcast).
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Virtual account</span>
                <div className="font-mono text-gray-900">#{modal.virtual_account_hint?.id}</div>
              </div>
              <label className="block">
                <span className="text-gray-700">Amount</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  inputMode="decimal"
                />
              </label>
              <div>
                <span className="text-gray-700">Destination</span>
                <div className="mt-2 flex gap-3">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={target === "master"} onChange={() => setTarget("master")} />
                    Master wallet (treasury)
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={target === "vendor"} onChange={() => setTarget("vendor")} />
                    Vendor
                  </label>
                </div>
              </div>
              {target === "vendor" ? (
                <label className="block">
                  <span className="text-gray-700">Vendor</span>
                  <select
                    value={vendorId === "" ? "" : String(vendorId)}
                    onChange={(e) => setVendorId(e.target.value ? Number(e.target.value) : "")}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <option value="">Select vendor…</option>
                    {vendorsForRow.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.code}) → {v.payout_address.slice(0, 10)}…
                      </option>
                    ))}
                  </select>
                  {target === "vendor" && vendorsForRow.length === 0 ? (
                    <p className="mt-1 text-xs text-amber-700">
                      No vendor for this chain + currency. Add one under Crypto vendors (link in sidebar).
                    </p>
                  ) : null}
                </label>
              ) : null}
              {stepMsg ? <p className="text-sm text-gray-800">{stepMsg}</p> : null}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => sweepMut.mutate()}
                  disabled={
                    sweepMut.isPending ||
                    (target === "vendor" && (vendorId === "" || !vendorsForRow.length))
                  }
                  className="rounded-xl bg-[#1B800F] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {sweepMut.isPending ? "Working…" : "Create & broadcast"}
                </button>
                <button type="button" onClick={() => setModal(null)} className="rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReceivedCrypto;
