import React, { useMemo, useState } from "react";
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
  type PlatformRatePayload,
  type PlatformRateRow,
} from "../../api/adminPlatformRates";
import { getAdminToken } from "../../api/authToken";
import { ApiError } from "../../api/httpClient";

const HEADER_GREEN = "#21D721";
const HEADER_SEARCH = "#189016";
const ROW_A = "#F9F9F9";
const ROW_B = "#E6E6E6";
const COL_HEADER = "#EBEBEB";
const BTN_GREEN = "#1B800F";

function formatDisplayDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  let h = d.getHours();
  const m = d.getMinutes();
  const am = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${mm}/${dd}/${yy} - ${h}:${String(m).padStart(2, "0")} ${am}`;
}

function numOrNull(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const Rates: React.FC = () => {
  const qc = useQueryClient();
  const hasToken = Boolean(getAdminToken());
  const [tab, setTab] = useState<PlatformRateCategory>("fiat");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const [svc, setSvc] = useState("");
  const [subSvc, setSubSvc] = useState("");
  const [cryptoAsset, setCryptoAsset] = useState("");
  const [networkKey, setNetworkKey] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [fixedFee, setFixedFee] = useState("");
  const [pctFee, setPctFee] = useState("");
  const [minFee, setMinFee] = useState("");
  const [feeUsd, setFeeUsd] = useState("");

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

  const rows = ratesQ.data?.rates ?? [];

  const resetForm = () => {
    setEditingId(null);
    setSvc("");
    setSubSvc("");
    setCryptoAsset("");
    setNetworkKey("");
    setExchangeRate("");
    setFixedFee("");
    setPctFee("");
    setMinFee("");
    setFeeUsd("");
  };

  const loadRow = (r: PlatformRateRow) => {
    setEditingId(r.id);
    setSvc(r.service_key);
    setSubSvc(r.sub_service_key ?? "");
    setCryptoAsset(r.crypto_asset ?? "");
    setNetworkKey(r.network_key ?? "");
    setExchangeRate(r.exchange_rate_ngn_per_usd ?? "");
    setFixedFee(r.fixed_fee_ngn ?? "");
    setPctFee(r.percentage_fee ?? "");
    setMinFee(r.min_fee_ngn ?? "");
    if (r.category === "virtual_card" && r.service_key === "fund") {
      const rate = Number(r.exchange_rate_ngn_per_usd);
      const legacyNgn = Number(r.fixed_fee_ngn);
      if (r.fee_usd != null && r.fee_usd !== "") {
        setFeeUsd(r.fee_usd);
      } else if (rate > 0 && legacyNgn > 0) {
        setFeeUsd(String(Math.round((legacyNgn / rate) * 10000) / 10000));
      } else {
        setFeeUsd("");
      }
    } else {
      setFeeUsd(r.fee_usd ?? "");
    }
  };

  const buildPayload = (): PlatformRatePayload | null => {
    if (!svc.trim()) return null;
    const isVcCreation = tab === "virtual_card" && svc === "creation";
    const isVcFund = tab === "virtual_card" && svc === "fund";
    const cryptoFeesUsd = tab === "crypto" && (svc === "deposit" || svc === "withdrawal");
    const cryptoBuySell = tab === "crypto" && (svc === "buy" || svc === "sell");
    const base: PlatformRatePayload = {
      category: tab,
      service_key: svc.trim(),
      sub_service_key: tab === "fiat" && subSvc.trim() ? subSvc.trim() : null,
      crypto_asset: tab === "crypto" && cryptoAsset.trim() ? cryptoAsset.trim() : null,
      network_key: tab === "crypto" && networkKey.trim() ? networkKey.trim() : null,
      exchange_rate_ngn_per_usd:
        tab === "virtual_card" ? numOrNull(exchangeRate) : cryptoBuySell ? numOrNull(exchangeRate) : null,
      fixed_fee_ngn: isVcCreation || isVcFund || cryptoFeesUsd || cryptoBuySell ? 0 : numOrNull(fixedFee) ?? 0,
      percentage_fee: isVcCreation || cryptoBuySell ? null : numOrNull(pctFee),
      min_fee_ngn: tab === "fiat" && svc === "bill_payment" ? numOrNull(minFee) : null,
      fee_usd: isVcCreation || cryptoFeesUsd || isVcFund ? numOrNull(feeUsd) : undefined,
    };
    return base;
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = buildPayload();
      if (!body) throw new Error("Select a service.");
      if (editingId) {
        return updatePlatformRate(editingId, body);
      }
      return createPlatformRate(body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "platform-rates"] });
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

  const serviceLabel = (key: string): string => {
    const m = metaQ.data;
    if (!m) return key;
    if (tab === "fiat") return m.fiat.services.find((s) => s.key === key)?.label ?? key;
    if (tab === "crypto") return m.crypto.services.find((s) => s.key === key)?.label ?? key;
    return m.virtual_card.services.find((s) => s.key === key)?.label ?? key;
  };

  const subLabel = (key: string | null): string => {
    if (!key) return "—";
    const m = metaQ.data;
    const hit = m?.fiat.sub_services.find((s) => s.key === key);
    return hit?.label ?? key;
  };

  const tableTitle = useMemo(() => {
    if (tab === "fiat") return "Fiat rate";
    if (tab === "crypto") return "Crypto rate";
    return "Virtual rate";
  }, [tab]);

  const toggleAll = (checked: boolean) => {
    const next: Record<number, boolean> = {};
    if (checked) rows.forEach((r) => (next[r.id] = true));
    setSelected(next);
  };

  const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Request failed");

  const isCryptoFeesUsd =
    tab === "crypto" && (svc === "deposit" || svc === "withdrawal");
  const isCryptoExchangeOnly = tab === "crypto" && (svc === "buy" || svc === "sell");
  const isVcFund = tab === "virtual_card" && svc === "fund";
  const showLegacyFixedNgn =
    !isCryptoFeesUsd &&
    !isCryptoExchangeOnly &&
    !(tab === "virtual_card" && (svc === "creation" || svc === "fund"));
  const showStandalonePctFee =
    !isCryptoExchangeOnly &&
    !(tab === "virtual_card" && svc === "creation") &&
    !isCryptoFeesUsd;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Rates</h1>
      </div>

      {!hasToken ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Log in as <strong>admin</strong> to load and edit platform rates from the API.
        </div>
      ) : null}

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

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-sm font-semibold text-gray-500">{editingId ? "Update rate" : "Add rate"}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Select service</span>
            <select
              value={svc}
              onChange={(e) => setSvc(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900"
            >
              <option value="">—</option>
              {tab === "fiat" &&
                metaQ.data?.fiat.services.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              {tab === "crypto" &&
                metaQ.data?.crypto.services.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              {tab === "virtual_card" &&
                metaQ.data?.virtual_card.services.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
            </select>
          </label>

          {tab === "fiat" && svc === "bill_payment" ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Sub-service (bill category)</span>
              <select
                value={subSvc}
                onChange={(e) => setSubSvc(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900"
              >
                <option value="">All / default</option>
                {metaQ.data?.fiat.sub_services.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {tab === "crypto" ? (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">Crypto asset</span>
                <select
                  value={cryptoAsset}
                  onChange={(e) => {
                    setCryptoAsset(e.target.value);
                    setNetworkKey("");
                  }}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900"
                >
                  <option value="">Any / default</option>
                  {[...new Set(metaQ.data?.crypto.assets.map((a) => a.asset) ?? [])].map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">Network</span>
                <select
                  value={networkKey}
                  onChange={(e) => setNetworkKey(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900"
                >
                  <option value="">Any / default</option>
                  {metaQ.data?.crypto.assets
                    .filter((a) => !cryptoAsset || a.asset === cryptoAsset)
                    .map((a) => (
                      <option key={`${a.asset}-${a.network_key}`} value={a.network_key}>
                        {a.network_label} ({a.network_key})
                      </option>
                    ))}
                </select>
              </label>
            </>
          ) : null}

          {tab === "virtual_card" || isCryptoExchangeOnly ? (
            <label className="flex flex-col gap-1 text-sm md:col-span-2">
              <span className="font-medium text-gray-700">
                {tab === "virtual_card"
                  ? "Exchange rate (NGN per $1)"
                  : "Exchange rate (₦ per 1 crypto unit — optional)"}
              </span>
              <input
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder={tab === "virtual_card" ? "e.g. 1500" : "Leave empty to use wallet default"}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900"
              />
              {isCryptoExchangeOnly ? (
                <span className="text-xs text-gray-500">
                  Buy and sell use this price only — no percentage or flat fees are applied in the app.
                </span>
              ) : null}
            </label>
          ) : null}

          {tab === "virtual_card" && svc === "creation" ? (
            <label className="flex flex-col gap-1 text-sm md:col-span-2">
              <span className="font-medium text-gray-700">Card creation fee (USD)</span>
              <input
                value={feeUsd}
                onChange={(e) => setFeeUsd(e.target.value)}
                placeholder="e.g. 3"
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900"
              />
              <span className="text-xs text-gray-500">
                Users pay this USD amount × the rate above in Naira. Leave empty to use server default from env.
              </span>
            </label>
          ) : null}

          {isVcFund ? (
            <label className="flex flex-col gap-1 text-sm md:col-span-2">
              <span className="font-medium text-gray-700">Fixed processing fee (USD)</span>
              <input
                value={feeUsd}
                onChange={(e) => setFeeUsd(e.target.value)}
                placeholder="e.g. 1"
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900"
              />
              <span className="text-xs text-gray-500">
                Flat fee in US dollars. When the user pays from their Naira wallet, we charge: this amount × the
                exchange rate above (e.g. $1 × 1,398 = ₦1,398). Leave empty only if you rely on legacy NGN-only
                rows.
              </span>
            </label>
          ) : null}

          {isCryptoFeesUsd ? (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">Fixed processing fee (USD)</span>
                <input
                  value={feeUsd}
                  onChange={(e) => setFeeUsd(e.target.value)}
                  placeholder="e.g. 1"
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900"
                />
                <span className="text-xs text-gray-500">Flat fee in USD before percentage.</span>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">Percentage fee (% of USD value)</span>
                <div className="relative">
                  <input
                    value={pctFee}
                    onChange={(e) => setPctFee(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-3 pr-9 text-gray-900"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
                <span className="text-xs text-gray-500">Applied to the crypto amount’s USD notional.</span>
              </label>
            </>
          ) : null}

          {showLegacyFixedNgn ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Fixed fee (NGN)</span>
              <input
                value={fixedFee}
                onChange={(e) => setFixedFee(e.target.value)}
                placeholder="Fixed fee (in Naira)"
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900"
              />
            </label>
          ) : null}

          {showStandalonePctFee ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Percentage fee</span>
              <div className="relative">
                <input
                  value={pctFee}
                  onChange={(e) => setPctFee(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-3 pr-9 text-gray-900"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </label>
          ) : null}

          {tab === "fiat" && svc === "bill_payment" ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Minimum fee (NGN)</span>
              <input
                value={minFee}
                onChange={(e) => setMinFee(e.target.value)}
                placeholder="e.g. 20"
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900"
              />
            </label>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saveMut.isPending || !hasToken}
            onClick={() => saveMut.mutate()}
            className="rounded-full px-8 py-3 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-50"
            style={{ backgroundColor: BTN_GREEN }}
          >
            {saveMut.isPending ? "Saving…" : editingId ? "Update" : "Save"}
          </button>
          {editingId ? (
            <button type="button" onClick={resetForm} className="text-sm font-semibold text-gray-600 hover:text-gray-900">
              Cancel edit
            </button>
          ) : null}
          {saveMut.isError ? <span className="text-sm text-red-600">{errMsg(saveMut.error)}</span> : null}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={bulkMut.isPending || !hasToken}
          onClick={() => bulkMut.mutate()}
          className="rounded-xl bg-[#E8E8E8] px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-[#DDDDDD] disabled:opacity-50"
        >
          Bulk delete
        </button>
        {bulkMut.isError ? <span className="text-sm text-red-600">{errMsg(bulkMut.error)}</span> : null}
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: HEADER_GREEN }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">{tableTitle}</h2>
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
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: COL_HEADER }}>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && rows.every((r) => selected[r.id])}
                    onChange={(e) => toggleAll(e.target.checked)}
                    aria-label="Select all"
                  />
                </th>
                {tab === "fiat" && (
                  <>
                    <th className="px-4 py-3 font-semibold text-gray-700">Service</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Sub-service</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Fixed fee</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Commission</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Min fee</th>
                  </>
                )}
                {tab === "crypto" && (
                  <>
                    <th className="px-4 py-3 font-semibold text-gray-700">Service</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Crypto</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Network</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Settings</th>
                  </>
                )}
                {tab === "virtual_card" && (
                  <>
                    <th className="px-4 py-3 font-semibold text-gray-700">Service</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Exchange rate</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Fee (USD)</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Fixed (USD)</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Commission</th>
                  </>
                )}
                <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {hasToken && ratesQ.isLoading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                    No rates yet. Add one above.
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
                        aria-label={`Select ${r.id}`}
                      />
                    </td>
                    {tab === "fiat" && (
                      <>
                        <td className="px-4 py-3 text-gray-800">{serviceLabel(r.service_key)}</td>
                        <td className="px-4 py-3 text-gray-800">{subLabel(r.sub_service_key)}</td>
                        <td className="px-4 py-3 text-gray-800">₦{Number(r.fixed_fee_ngn).toLocaleString("en-US")}</td>
                        <td className="px-4 py-3 text-gray-800">
                          {r.percentage_fee != null ? `${r.percentage_fee}%` : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          {r.min_fee_ngn != null ? `₦${Number(r.min_fee_ngn).toLocaleString("en-US")}` : "—"}
                        </td>
                      </>
                    )}
                    {tab === "crypto" && (
                      <>
                        <td className="px-4 py-3 text-gray-800">{serviceLabel(r.service_key)}</td>
                        <td className="px-4 py-3 text-gray-800">{r.crypto_asset ?? "Any"}</td>
                        <td className="px-4 py-3 text-gray-800">{r.network_key ?? "Any"}</td>
                        <td className="max-w-[320px] px-4 py-3 text-xs text-gray-800">
                          {r.service_key === "buy" || r.service_key === "sell" ? (
                            r.exchange_rate_ngn_per_usd != null && r.exchange_rate_ngn_per_usd !== "" ? (
                              <span>₦{Number(r.exchange_rate_ngn_per_usd).toLocaleString("en-US")} / unit</span>
                            ) : (
                              <span className="text-gray-500">Wallet default rate</span>
                            )
                          ) : (
                            <span>
                              {r.fee_usd != null && r.fee_usd !== ""
                                ? `$${Number(r.fee_usd).toLocaleString("en-US")} fixed`
                                : "—"}
                              {r.percentage_fee != null ? ` · ${r.percentage_fee}% of USD value` : ""}
                            </span>
                          )}
                        </td>
                      </>
                    )}
                    {tab === "virtual_card" && (
                      <>
                        <td className="px-4 py-3 text-gray-800">{serviceLabel(r.service_key)}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {r.exchange_rate_ngn_per_usd != null
                            ? `₦${Number(r.exchange_rate_ngn_per_usd).toLocaleString("en-US")} = $1`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          {r.service_key === "creation" && r.fee_usd != null && r.fee_usd !== ""
                            ? `$${Number(r.fee_usd).toLocaleString("en-US")}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          {r.fee_usd != null && r.fee_usd !== "" && r.service_key !== "creation" ? (
                            <span>
                              <span className="font-medium">
                                ${Number(r.fee_usd).toLocaleString("en-US")}
                              </span>
                              {r.service_key === "fund" &&
                              r.exchange_rate_ngn_per_usd != null &&
                              r.exchange_rate_ngn_per_usd !== "" ? (
                                <span className="mt-0.5 block text-xs text-gray-600">
                                  ≈ ₦
                                  {Number(
                                    Number(r.fee_usd) * Number(r.exchange_rate_ngn_per_usd),
                                  ).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                                </span>
                              ) : null}
                            </span>
                          ) : Number(r.fixed_fee_ngn) > 0 && (r.service_key === "fund" || r.service_key === "withdraw") ? (
                            `₦${Number(r.fixed_fee_ngn).toLocaleString("en-US")} (legacy NGN)`
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          {r.percentage_fee != null ? `${r.percentage_fee}%` : "—"}
                        </td>
                      </>
                    )}
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
