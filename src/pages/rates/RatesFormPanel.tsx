import React from "react";
import { Link } from "react-router-dom";
import {
  type FieldDef,
  type FieldKey,
  type RateFormProfile,
  getProfileConfig,
  resolveRateFormProfile,
} from "./rateFormConfig";
import type { PlatformRateCategory } from "../../api/adminPlatformRates";

const BTN_GREEN = "#1B800F";

export type RateFormValues = Record<FieldKey, string>;

export const EMPTY_FORM: RateFormValues = {
  exchangeRate: "",
  feeUsd: "",
  fxMarkupNgn: "",
  fixedFeeNgn: "",
  percentageFee: "",
  minFeeNgn: "",
  providerCostNgn: "",
  providerCostUsd: "",
  providerPct: "",
  providerPctCap: "",
  displayLabel: "",
};

type RatesFormPanelProps = {
  tab: PlatformRateCategory;
  svc: string;
  subSvc: string;
  cryptoAsset: string;
  networkKey: string;
  values: RateFormValues;
  onChange: (key: FieldKey, value: string) => void;
  editingId: number | null;
  saving: boolean;
  hasToken: boolean;
  saveError: string | null;
  onSave: () => void;
  onCancel: () => void;
  billSubOptions: { key: string; label: string }[];
  cryptoAssets: { asset: string; network_key: string; network_label: string }[];
  serviceOptions: { key: string; label: string }[];
  onServiceChange: (svc: string) => void;
  onSubSvcChange: (sub: string) => void;
  onCryptoAssetChange: (asset: string) => void;
  onNetworkChange: (network: string) => void;
};

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const span = field.colSpan === 2 ? "md:col-span-2" : "";
  return (
    <label className={`flex flex-col gap-1 text-sm ${span}`}>
      <span className="font-medium text-gray-700">{field.label}</span>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={`w-full rounded-xl border border-gray-200 py-2.5 text-gray-900 ${
            field.suffix ? "pl-3 pr-9" : "px-3"
          }`}
        />
        {field.suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {field.suffix}
          </span>
        ) : null}
      </div>
      {field.hint ? <span className="text-xs text-gray-500">{field.hint}</span> : null}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="md:col-span-2 lg:col-span-3">
      <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-800">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

export const RatesFormPanel: React.FC<RatesFormPanelProps> = ({
  tab,
  svc,
  subSvc,
  cryptoAsset,
  networkKey,
  values,
  onChange,
  editingId,
  saving,
  hasToken,
  saveError,
  onSave,
  onCancel,
  billSubOptions,
  cryptoAssets,
  serviceOptions,
  onServiceChange,
  onSubSvcChange,
  onCryptoAssetChange,
  onNetworkChange,
}) => {
  const profile = svc ? resolveRateFormProfile(tab, svc, subSvc) : null;
  const config = profile ? getProfileConfig(profile) : null;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-gray-500">{editingId ? "Update rate" : "Configure rate"}</h2>
        <Link to="/profit" className="text-xs font-semibold text-[#1B800F] hover:underline">
          View in Profit catalog →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm md:col-span-2 lg:col-span-3">
          <span className="font-medium text-gray-700">Service</span>
          <select
            value={svc}
            onChange={(e) => onServiceChange(e.target.value)}
            className="max-w-xl rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900"
          >
            <option value="">Choose a service to configure…</option>
            {serviceOptions.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {tab === "fiat" && svc === "bill_payment" ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Bill category</span>
            <select
              value={subSvc}
              onChange={(e) => onSubSvcChange(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900"
            >
              <option value="">Default (non-commission bills)</option>
              {billSubOptions.map((s) => (
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
                  onCryptoAssetChange(e.target.value);
                  onNetworkChange("");
                }}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900"
              >
                <option value="">Global default (PDF row)</option>
                {[...new Set(cryptoAssets.map((a) => a.asset))].map((a) => (
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
                onChange={(e) => onNetworkChange(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900"
                disabled={!cryptoAsset}
              >
                <option value="">{cryptoAsset ? "Select network" : "Pick asset first"}</option>
                {cryptoAssets
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

        {config ? (
          <>
            <div className="rounded-xl bg-slate-50 px-4 py-3 md:col-span-2 lg:col-span-3">
              <p className="font-semibold text-gray-900">{config.title}</p>
              <p className="mt-1 text-sm text-gray-600">{config.description}</p>
            </div>

            {profile === "fiat_bill_commission" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:col-span-2 lg:col-span-3">
                Airtime, data and betting use <strong>vendor commission</strong> — users pay face value only.{" "}
                <Link to="/rates/commissions" className="font-semibold text-[#1B800F] underline">
                  Open commission tables
                </Link>
              </div>
            ) : null}

            {profile === "fiat_deposit" ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 md:col-span-2 lg:col-span-3">
                <strong>User charge:</strong> ₦0 (loss leader — full deposit amount credited).
              </div>
            ) : null}

            {config.customer.length > 0 ? (
              <Section title="What the customer pays">
                {config.customer.map((f) => (
                  <FieldInput key={f.key} field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
                ))}
              </Section>
            ) : null}

            {config.provider.length > 0 ? (
              <Section title="Provider cost (COGS)">
                {config.provider.map((f) => (
                  <FieldInput key={f.key} field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
                ))}
              </Section>
            ) : null}

            {config.meta.length > 0 ? (
              <Section title="Profit catalog">
                {config.meta.map((f) => (
                  <FieldInput key={f.key} field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
                ))}
              </Section>
            ) : null}
          </>
        ) : svc ? (
          <p className="text-sm text-gray-500 md:col-span-2 lg:col-span-3">This service cannot be configured here.</p>
        ) : null}
      </div>

      {profile && profile !== "fiat_bill_commission" ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving || !hasToken || !svc}
            onClick={onSave}
            className="rounded-full px-8 py-3 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-50"
            style={{ backgroundColor: BTN_GREEN }}
          >
            {saving ? "Saving…" : editingId ? "Update" : "Save"}
          </button>
          {editingId ? (
            <button type="button" onClick={onCancel} className="text-sm font-semibold text-gray-600 hover:text-gray-900">
              Cancel
            </button>
          ) : null}
          {saveError ? <span className="text-sm text-red-600">{saveError}</span> : null}
        </div>
      ) : null}
    </section>
  );
};

export function valuesFromPlatformRow(r: {
  exchange_rate_ngn_per_usd?: string | null;
  fixed_fee_ngn?: string;
  percentage_fee?: string | null;
  min_fee_ngn?: string | null;
  fee_usd?: string | null;
  provider_cost_ngn?: string | null;
  provider_cost_usd?: string | null;
  provider_pct?: string | null;
  provider_pct_cap_ngn?: string | null;
  display_label?: string | null;
  category?: string;
  service_key?: string;
}): RateFormValues {
  const isFxMarkup =
    (r.category === "virtual_card" && (r.service_key === "fund" || r.service_key === "visa_fund")) ||
    (r.category === "crypto" && (r.service_key === "buy" || r.service_key === "sell"));

  return {
    exchangeRate: r.exchange_rate_ngn_per_usd ?? "",
    feeUsd: r.fee_usd ?? "",
    fxMarkupNgn: isFxMarkup ? r.fixed_fee_ngn ?? "" : "",
    fixedFeeNgn: isFxMarkup ? "" : r.fixed_fee_ngn ?? "",
    percentageFee: r.percentage_fee ?? "",
    minFeeNgn: r.min_fee_ngn ?? "",
    providerCostNgn: r.provider_cost_ngn ?? "",
    providerCostUsd: r.provider_cost_usd ?? "",
    providerPct: r.provider_pct ?? "",
    providerPctCap: r.provider_pct_cap_ngn ?? "",
    displayLabel: r.display_label ?? "",
  };
}

export function buildPayloadFromProfile(
  tab: PlatformRateCategory,
  svc: string,
  subSvc: string,
  cryptoAsset: string,
  networkKey: string,
  values: RateFormValues,
  numOrNull: (s: string) => number | null
) {
  const profile = resolveRateFormProfile(tab, svc, subSvc);
  if (!profile || profile === "fiat_bill_commission") return null;

  const base = {
    category: tab,
    service_key: svc.trim(),
    sub_service_key: tab === "fiat" && subSvc.trim() ? subSvc.trim() : null,
    crypto_asset: tab === "crypto" && cryptoAsset.trim() ? cryptoAsset.trim() : null,
    network_key: tab === "crypto" && networkKey.trim() ? networkKey.trim() : null,
    display_label: values.displayLabel.trim() || null,
  };

  switch (profile) {
    case "fiat_withdrawal":
      return {
        ...base,
        fixed_fee_ngn: numOrNull(values.fixedFeeNgn) ?? 0,
        percentage_fee: null,
        min_fee_ngn: null,
        fee_usd: null,
        provider_cost_ngn: numOrNull(values.providerCostNgn),
        provider_cost_usd: null,
        provider_pct: null,
        provider_pct_cap_ngn: null,
        exchange_rate_ngn_per_usd: null,
      };
    case "fiat_deposit":
      return {
        ...base,
        fixed_fee_ngn: 0,
        percentage_fee: 0,
        min_fee_ngn: null,
        fee_usd: null,
        provider_cost_ngn: null,
        provider_cost_usd: null,
        provider_pct: numOrNull(values.providerPct),
        provider_pct_cap_ngn: numOrNull(values.providerPctCap),
        exchange_rate_ngn_per_usd: null,
      };
    case "fiat_bill_payment":
      return {
        ...base,
        fixed_fee_ngn: 0,
        percentage_fee: numOrNull(values.percentageFee),
        min_fee_ngn: numOrNull(values.minFeeNgn),
        fee_usd: null,
        provider_cost_ngn: null,
        provider_cost_usd: null,
        provider_pct: null,
        provider_pct_cap_ngn: null,
        exchange_rate_ngn_per_usd: null,
      };
    case "crypto_buy_sell":
      return {
        ...base,
        fixed_fee_ngn: numOrNull(values.fxMarkupNgn) ?? 0,
        percentage_fee: null,
        min_fee_ngn: null,
        fee_usd: null,
        exchange_rate_ngn_per_usd: numOrNull(values.exchangeRate),
        provider_cost_ngn: null,
        provider_cost_usd: null,
        provider_pct: null,
        provider_pct_cap_ngn: null,
      };
    case "crypto_receive":
      return {
        ...base,
        fixed_fee_ngn: 0,
        percentage_fee: null,
        min_fee_ngn: null,
        fee_usd: numOrNull(values.feeUsd),
        exchange_rate_ngn_per_usd: null,
        provider_cost_ngn: null,
        provider_cost_usd: numOrNull(values.providerCostUsd),
        provider_pct: null,
        provider_pct_cap_ngn: null,
      };
    case "crypto_send":
      return {
        ...base,
        fixed_fee_ngn: 0,
        percentage_fee: numOrNull(values.percentageFee),
        min_fee_ngn: null,
        fee_usd: numOrNull(values.feeUsd),
        exchange_rate_ngn_per_usd: null,
        provider_cost_ngn: null,
        provider_cost_usd: numOrNull(values.providerCostUsd),
        provider_pct: null,
        provider_pct_cap_ngn: null,
      };
    case "vc_creation":
      return {
        ...base,
        fixed_fee_ngn: 0,
        percentage_fee: null,
        min_fee_ngn: null,
        fee_usd: numOrNull(values.feeUsd),
        exchange_rate_ngn_per_usd: numOrNull(values.exchangeRate),
        provider_cost_ngn: null,
        provider_cost_usd: numOrNull(values.providerCostUsd),
        provider_pct: null,
        provider_pct_cap_ngn: null,
      };
    case "vc_fund":
      return {
        ...base,
        fixed_fee_ngn: numOrNull(values.fxMarkupNgn) ?? 0,
        percentage_fee: null,
        min_fee_ngn: null,
        fee_usd: numOrNull(values.feeUsd),
        exchange_rate_ngn_per_usd: numOrNull(values.exchangeRate),
        provider_cost_ngn: null,
        provider_cost_usd: numOrNull(values.providerCostUsd),
        provider_pct: numOrNull(values.providerPct),
        provider_pct_cap_ngn: null,
      };
    case "vc_decline":
      return {
        ...base,
        fixed_fee_ngn: 0,
        percentage_fee: null,
        min_fee_ngn: null,
        fee_usd: numOrNull(values.feeUsd),
        exchange_rate_ngn_per_usd: null,
        provider_cost_ngn: null,
        provider_cost_usd: numOrNull(values.providerCostUsd),
        provider_pct: null,
        provider_pct_cap_ngn: null,
      };
    default:
      return null;
  }
}

export type { RateFormProfile };
