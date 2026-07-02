import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Search, Trash2 } from "lucide-react";
import {
  bulkDeletePlatformRates,
  createPlatformRate,
  deletePlatformRate,
  fetchPlatformRates,
  fetchPlatformRatesMeta,
  updatePlatformRate,
  type PlatformRateCategory,
  type PlatformRateRow,
} from "../../api/adminPlatformRates";
import { getAdminToken } from "../../api/authToken";
import { ApiError } from "../../api/httpClient";
import {
  EMPTY_FORM,
  RatesFormPanel,
  buildPayloadFromProfile,
  valuesFromPlatformRow,
  type RateFormValues,
} from "./RatesFormPanel";
import { formatRateSummary, isPdfPrimaryRow } from "./rateFormConfig";

const HEADER_GREEN = "#21D721";
const HEADER_SEARCH = "#189016";
const ROW_A = "#F9F9F9";
const ROW_B = "#E6E6E6";
const COL_HEADER = "#EBEBEB";

function formatDisplayDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function numOrNull(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export type RatesProps = { visaOnly?: boolean };

const Rates: React.FC<RatesProps> = ({ visaOnly = false }) => {
  const qc = useQueryClient();
  const hasToken = Boolean(getAdminToken());
  const [tab, setTab] = useState<PlatformRateCategory>(visaOnly ? "virtual_card" : "fiat");
  const [search, setSearch] = useState("");
  const [pdfOnly, setPdfOnly] = useState(true);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const [svc, setSvc] = useState("");
  const [subSvc, setSubSvc] = useState("");
  const [cryptoAsset, setCryptoAsset] = useState("");
  const [networkKey, setNetworkKey] = useState("");
  const [form, setForm] = useState<RateFormValues>({ ...EMPTY_FORM });

  const metaQ = useQuery({
    queryKey: ["admin", "platform-rates-meta"],
    queryFn: fetchPlatformRatesMeta,
    enabled: hasToken,
  });

  const ratesQ = useQuery({
    queryKey: ["admin", "platform-rates", tab, search],
    queryFn: () => fetchPlatformRates(tab, search),
    enabled: hasToken,
  });

  const allRows = useMemo(() => {
    const raw = ratesQ.data?.rates ?? [];
    if (!visaOnly) return raw;
    return raw.filter((r) => r.service_key === "visa_creation" || r.service_key === "visa_fund");
  }, [ratesQ.data?.rates, visaOnly]);

  const rows = useMemo(() => {
    if (!pdfOnly) return allRows;
    return allRows.filter(isPdfPrimaryRow);
  }, [allRows, pdfOnly]);

  const resetForm = () => {
    setEditingId(null);
    setSvc("");
    setSubSvc("");
    setCryptoAsset("");
    setNetworkKey("");
    setForm({ ...EMPTY_FORM });
  };

  const loadRow = (r: PlatformRateRow) => {
    setEditingId(r.id);
    setSvc(r.service_key);
    setSubSvc(r.sub_service_key ?? "");
    setCryptoAsset(r.crypto_asset ?? "");
    setNetworkKey(r.network_key ?? "");
    setForm(valuesFromPlatformRow(r));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setField = (key: keyof RateFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = buildPayloadFromProfile(tab, svc, subSvc, cryptoAsset, networkKey, form, numOrNull);
      if (!body) throw new Error("Select a configurable service.");
      if (editingId) return updatePlatformRate(editingId, body);
      return createPlatformRate(body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "platform-rates"] });
      await qc.invalidateQueries({ queryKey: ["admin", "profit-catalog"] });
      resetForm();
    },
  });

  const delMut = useMutation({
    mutationFn: (id: number) => deletePlatformRate(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "platform-rates"] });
    },
  });

  const bulkMut = useMutation({
    mutationFn: () => {
      const ids = Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => Number(k));
      if (!ids.length) throw new Error("Select rows.");
      return bulkDeletePlatformRates(ids);
    },
    onSuccess: async () => {
      setSelected({});
      await qc.invalidateQueries({ queryKey: ["admin", "platform-rates"] });
    },
  });

  const serviceOptions = useMemo(() => {
    const m = metaQ.data;
    if (!m) return [];
    if (tab === "fiat") return m.fiat.services;
    if (tab === "crypto") return m.crypto.services;
    const list = m.virtual_card.services;
    return visaOnly ? list.filter((s) => s.key === "visa_creation" || s.key === "visa_fund") : list;
  }, [metaQ.data, tab, visaOnly]);

  const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Request failed");

  const tableTitle = tab === "fiat" ? "Fiat rates" : tab === "crypto" ? "Crypto rates" : "Virtual card rates";

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          {visaOnly ? "Visa virtual card rates" : "Rates"}
        </h1>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/profit" className="font-semibold text-[#1B800F] hover:underline">
            Profit catalog (PDF view) →
          </Link>
          {!visaOnly ? (
            <Link to="/rates/commissions" className="font-semibold text-[#1B800F] hover:underline">
              Commission tables →
            </Link>
          ) : null}
        </div>
      </div>

      {!hasToken ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Log in as <strong>admin</strong> to configure rates.
        </div>
      ) : null}

      {!visaOnly ? (
        <div className="flex flex-wrap gap-2 rounded-2xl bg-[#E8E8E8] p-1.5">
          {(
            [
              ["fiat", "Naira"],
              ["crypto", "Crypto"],
              ["virtual_card", "Virtual card"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setTab(k);
                resetForm();
              }}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
                tab === k ? "bg-[#1B800F] text-white shadow-sm" : "text-gray-700 hover:bg-white/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <RatesFormPanel
        tab={tab}
        svc={svc}
        subSvc={subSvc}
        cryptoAsset={cryptoAsset}
        networkKey={networkKey}
        values={form}
        onChange={setField}
        editingId={editingId}
        saving={saveMut.isPending}
        hasToken={hasToken}
        saveError={saveMut.isError ? errMsg(saveMut.error) : null}
        onSave={() => saveMut.mutate()}
        onCancel={resetForm}
        billSubOptions={metaQ.data?.fiat.sub_services ?? []}
        cryptoAssets={metaQ.data?.crypto.assets ?? []}
        serviceOptions={serviceOptions}
        onServiceChange={setSvc}
        onSubSvcChange={setSubSvc}
        onCryptoAssetChange={setCryptoAsset}
        onNetworkChange={setNetworkKey}
      />

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={pdfOnly}
            onChange={(e) => setPdfOnly(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show PDF catalog services only
        </label>
        <button
          type="button"
          disabled={bulkMut.isPending || !hasToken}
          onClick={() => bulkMut.mutate()}
          className="rounded-xl bg-[#E8E8E8] px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-[#DDDDDD] disabled:opacity-50"
        >
          Bulk delete selected
        </button>
        {bulkMut.isError ? <span className="text-sm text-red-600">{errMsg(bulkMut.error)}</span> : null}
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: HEADER_GREEN }}
        >
          <div>
            <h2 className="text-lg font-semibold text-white md:text-xl">{tableTitle}</h2>
            <p className="text-xs text-white/85">
              {pdfOnly ? "Showing PDF-aligned rows" : `All rows (${allRows.length})`} · click edit to load form
            </p>
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/90" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-full border-0 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/40"
              style={{ backgroundColor: HEADER_SEARCH }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: COL_HEADER }}>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && rows.every((r) => selected[r.id])}
                    onChange={(e) => {
                      const next: Record<number, boolean> = {};
                      if (e.target.checked) rows.forEach((r) => (next[r.id] = true));
                      setSelected(next);
                    }}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700">Service</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Summary</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Catalog name</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Updated</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {hasToken && ratesQ.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No rates found. {pdfOnly ? "Try turning off PDF-only filter." : "Add one above."}
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{ backgroundColor: i % 2 === 0 ? ROW_A : ROW_B }}
                    className="border-t border-gray-100"
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[r.id])}
                        onChange={(e) => setSelected((m) => ({ ...m, [r.id]: e.target.checked }))}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      <div className="font-medium">{r.display_label || r.service_key}</div>
                      <div className="text-xs text-gray-500">
                        {[r.sub_service_key, r.crypto_asset, r.network_key].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-800">{formatRateSummary(r)}</td>
                    <td className="px-4 py-3 text-gray-600">{r.display_label || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatDisplayDate(r.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-gray-700 hover:bg-white/80"
                          aria-label="Edit"
                          onClick={() => loadRow(r)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-red-600 hover:bg-white/80 disabled:opacity-50"
                          aria-label="Delete"
                          disabled={delMut.isPending}
                          onClick={() => {
                            if (window.confirm("Delete this rate?")) delMut.mutate(r.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {ratesQ.isError ? (
          <p className="px-5 py-3 text-sm text-red-600">{(ratesQ.error as Error)?.message ?? "Failed to load rates."}</p>
        ) : null}
      </section>
    </div>
  );
};

export default Rates;
