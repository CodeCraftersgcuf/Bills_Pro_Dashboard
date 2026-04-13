import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import {
  createCryptoVendor,
  fetchCryptoVendors,
  fetchWalletCurrencyOptions,
  updateCryptoVendor,
  type CryptoVendorRow,
  type WalletCurrencyOption,
} from "../../api/adminCryptoTreasury";
import { getAdminToken } from "../../api/authToken";

const HEADER = "#21D721";
const ROW_A = "#F9F9F9";
const ROW_B = "#E6E6E6";

const CryptoVendors: React.FC = () => {
  const hasToken = Boolean(getAdminToken());
  const qc = useQueryClient();

  const vendorsQ = useQuery({
    queryKey: ["admin", "crypto-vendors"],
    queryFn: () => fetchCryptoVendors(false),
    enabled: hasToken,
  });

  const wcQ = useQuery({
    queryKey: ["admin", "wallet-currency-options"],
    queryFn: () => fetchWalletCurrencyOptions(true),
    enabled: hasToken,
  });

  const [editing, setEditing] = useState<CryptoVendorRow | null>(null);
  const [creating, setCreating] = useState(false);

  const saveMut = useMutation({
    mutationFn: async (payload: {
      id?: number;
      name: string;
      code: string;
      payout_address: string;
      wallet_currency_id: number | "";
      contract_address: string;
      is_active: boolean;
    }) => {
      const wcId = payload.wallet_currency_id === "" ? undefined : Number(payload.wallet_currency_id);
      const body = {
        name: payload.name.trim(),
        code: payload.code.trim().toLowerCase(),
        payout_address: payload.payout_address.trim(),
        wallet_currency_id: wcId,
        contract_address: payload.contract_address.trim() || undefined,
        is_active: payload.is_active,
      };
      if (payload.id) {
        return updateCryptoVendor(payload.id, body);
      }
      return createCryptoVendor(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "crypto-vendors"] });
      setEditing(null);
      setCreating(false);
    },
  });

  const rows = vendorsQ.data ?? [];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Crypto vendors</h1>
          <p className="mt-1 text-sm text-gray-600">
            Payout addresses for sweeps (must match a <strong>wallet currency</strong> chain + asset). Link a row to a wallet
            currency so blockchain/currency stay aligned.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B800F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add vendor
        </button>
      </div>

      {!hasToken ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">Log in as admin.</div>
      ) : null}

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div className="px-5 py-4 text-white md:px-7" style={{ backgroundColor: HEADER }}>
          <h2 className="text-lg font-semibold">Vendors</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: "#EBEBEB" }}>
                <th className="px-3 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">Code</th>
                <th className="px-3 py-3 font-semibold">Chain / currency</th>
                <th className="px-3 py-3 font-semibold">Wallet currency</th>
                <th className="px-3 py-3 font-semibold">Payout address</th>
                <th className="px-3 py-3 font-semibold">Active</th>
                <th className="px-3 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {vendorsQ.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? ROW_A : ROW_B }}>
                    <td className="px-3 py-2 font-medium text-gray-900">{r.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.code}</td>
                    <td className="px-3 py-2 text-gray-800">
                      {r.blockchain} / {r.currency}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {r.wallet_currency
                        ? `${r.wallet_currency.name} (#${r.wallet_currency.id})`
                        : r.wallet_currency_id
                          ? `#${r.wallet_currency_id}`
                          : "—"}
                    </td>
                    <td className="max-w-[240px] truncate px-3 py-2 font-mono text-xs text-gray-800">{r.payout_address}</td>
                    <td className="px-3 py-2">{r.is_active ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {(creating || editing) && (
        <VendorFormModal
          title={editing ? "Edit vendor" : "New vendor"}
          initial={editing}
          walletCurrencies={wcQ.data ?? []}
          loading={saveMut.isPending}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSubmit={(payload) => saveMut.mutate(payload)}
        />
      )}
    </div>
  );
};

function VendorFormModal(props: {
  title: string;
  initial: CryptoVendorRow | null;
  walletCurrencies: WalletCurrencyOption[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (p: {
    id?: number;
    name: string;
    code: string;
    payout_address: string;
    wallet_currency_id: number | "";
    contract_address: string;
    is_active: boolean;
  }) => void;
}) {
  const { initial, walletCurrencies } = props;
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [payout_address, setPayout] = useState(initial?.payout_address ?? "");
  const [wallet_currency_id, setWc] = useState<number | "">(initial?.wallet_currency_id ?? "");
  const [contract_address, setContract] = useState(initial?.contract_address ?? "");
  const [is_active, setActive] = useState(initial?.is_active ?? true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{props.title}</h3>
        <div className="mt-4 space-y-3 text-sm">
          <label className="block">
            <span className="text-gray-700">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-gray-700">Code (unique)</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={!!initial}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 disabled:bg-gray-100"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Wallet currency (sets chain + asset)</span>
            <select
              value={wallet_currency_id === "" ? "" : String(wallet_currency_id)}
              onChange={(e) => setWc(e.target.value ? Number(e.target.value) : "")}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
            >
              <option value="">— Select —</option>
              {walletCurrencies.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {w.blockchain} / {w.currency}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-gray-700">Payout address</span>
            <input
              value={payout_address}
              onChange={(e) => setPayout(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Token contract override (optional)</span>
            <input
              value={contract_address}
              onChange={(e) => setContract(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={is_active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            disabled={props.loading || !name.trim() || !code.trim() || !payout_address.trim() || wallet_currency_id === ""}
            onClick={() =>
              props.onSubmit({
                id: initial?.id,
                name,
                code,
                payout_address,
                wallet_currency_id,
                contract_address,
                is_active,
              })
            }
            className="rounded-xl bg-[#1B800F] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {props.loading ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={props.onClose} className="rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default CryptoVendors;
