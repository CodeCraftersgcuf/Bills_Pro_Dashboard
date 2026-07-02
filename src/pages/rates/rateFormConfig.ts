import type { PlatformRateCategory, PlatformRateRow } from "../../api/adminPlatformRates";

export type RateFormProfile =
  | "fiat_withdrawal"
  | "fiat_deposit"
  | "fiat_bill_payment"
  | "fiat_bill_commission"
  | "crypto_buy_sell"
  | "crypto_receive"
  | "crypto_send"
  | "vc_creation"
  | "vc_fund"
  | "vc_decline";

export type FieldKey =
  | "exchangeRate"
  | "feeUsd"
  | "fxMarkupNgn"
  | "fixedFeeNgn"
  | "percentageFee"
  | "minFeeNgn"
  | "providerCostNgn"
  | "providerCostUsd"
  | "providerPct"
  | "providerPctCap"
  | "displayLabel";

export interface FieldDef {
  key: FieldKey;
  label: string;
  hint?: string;
  placeholder?: string;
  suffix?: "%";
  colSpan?: 2;
}

export interface ProfileConfig {
  title: string;
  description: string;
  customer: FieldDef[];
  provider: FieldDef[];
  meta: FieldDef[];
}

const COMMISSION_BILL_CODES = new Set(["airtime", "data", "betting"]);

export function resolveRateFormProfile(
  tab: PlatformRateCategory,
  serviceKey: string,
  subServiceKey: string
): RateFormProfile | null {
  if (tab === "fiat") {
    if (serviceKey === "withdrawal") return "fiat_withdrawal";
    if (serviceKey === "deposit") return "fiat_deposit";
    if (serviceKey === "bill_payment") {
      if (subServiceKey && COMMISSION_BILL_CODES.has(subServiceKey.toLowerCase())) {
        return "fiat_bill_commission";
      }
      return "fiat_bill_payment";
    }
  }
  if (tab === "crypto") {
    if (serviceKey === "buy" || serviceKey === "sell") return "crypto_buy_sell";
    if (serviceKey === "deposit") return "crypto_receive";
    if (serviceKey === "withdrawal") return "crypto_send";
  }
  if (tab === "virtual_card") {
    if (serviceKey === "creation" || serviceKey === "visa_creation") return "vc_creation";
    if (serviceKey === "fund" || serviceKey === "visa_fund") return "vc_fund";
    if (serviceKey === "decline_fee" || serviceKey === "visa_decline_fee") return "vc_decline";
  }
  return null;
}

const PROFILE_CONFIG: Record<RateFormProfile, ProfileConfig> = {
  fiat_withdrawal: {
    title: "Bank transfer (withdrawal)",
    description: "Flat Naira fee charged to the user and PalmPay/bank COGS.",
    customer: [
      { key: "fixedFeeNgn", label: "User fee (NGN)", placeholder: "e.g. 50", hint: "PDF: ₦50 per withdrawal." },
    ],
    provider: [
      { key: "providerCostNgn", label: "Provider cost (NGN)", placeholder: "e.g. 25", hint: "PDF: ₦25 bank/PalmPay cost." },
    ],
    meta: [{ key: "displayLabel", label: "Catalog name", placeholder: "Bank Transfer" }],
  },
  fiat_deposit: {
    title: "Wallet deposit (PalmPay)",
    description: "Free deposits for users; PalmPay charges a percentage capped in Naira.",
    customer: [],
    provider: [
      {
        key: "providerPct",
        label: "Provider fee (%)",
        placeholder: "0.7",
        hint: "PDF: 0.7% PalmPay fee.",
      },
      {
        key: "providerPctCap",
        label: "Provider fee cap (NGN)",
        placeholder: "700",
        hint: "PDF: capped at ₦700 per deposit.",
      },
    ],
    meta: [{ key: "displayLabel", label: "Catalog name", placeholder: "Wallet Deposit (PalmPay)" }],
  },
  fiat_bill_payment: {
    title: "Bill payment (fee-based categories)",
    description: "For electricity, cable, etc. Airtime, data & betting use commission tables instead.",
    customer: [
      { key: "percentageFee", label: "User fee (%)", placeholder: "1", suffix: "%" },
      { key: "minFeeNgn", label: "Minimum fee (NGN)", placeholder: "20" },
    ],
    provider: [],
    meta: [{ key: "displayLabel", label: "Catalog name", placeholder: "Bill payment" }],
  },
  fiat_bill_commission: {
    title: "Bill payment — commission category",
    description: "This category uses vendor commission, not a user surcharge. Configure tiers under Commission tables.",
    customer: [],
    provider: [],
    meta: [],
  },
  crypto_buy_sell: {
    title: "Crypto buy / sell",
    description: "Market price plus FX spread on the Naira leg. Set the global row (no asset) to match the PDF.",
    customer: [
      {
        key: "fxMarkupNgn",
        label: "FX markup (NGN per $1 notional)",
        placeholder: "80",
        colSpan: 2,
        hint: "PDF: ₦80 markup on buy/sell. Applies per $1 USD notional on the NGN leg.",
      },
      {
        key: "exchangeRate",
        label: "Optional quote override (NGN per unit)",
        placeholder: "Leave empty for wallet default",
        colSpan: 2,
      },
    ],
    provider: [],
    meta: [{ key: "displayLabel", label: "Catalog name", placeholder: "Crypto Buy/Sell" }],
  },
  crypto_receive: {
    title: "Crypto receive (on-chain deposit)",
    description: "Processing fee when crypto lands in the user's wallet.",
    customer: [
      { key: "feeUsd", label: "User fee (USD)", placeholder: "1", hint: "PDF: $1 receive fee." },
    ],
    provider: [
      { key: "providerCostUsd", label: "Provider cost (USD)", placeholder: "0", hint: "PDF: $0 provider cost." },
    ],
    meta: [{ key: "displayLabel", label: "Catalog name", placeholder: "Crypto Receive" }],
  },
  crypto_send: {
    title: "Crypto send (on-chain withdrawal)",
    description: "Per-asset send fee. Leave asset + network empty for the global fallback row.",
    customer: [
      { key: "feeUsd", label: "User fee (USD)", placeholder: "e.g. 0.10" },
      {
        key: "percentageFee",
        label: "Extra fee (% of USD value)",
        placeholder: "0",
        suffix: "%",
        hint: "Usually 0; flat USD fee only for most assets.",
      },
    ],
    provider: [
      {
        key: "providerCostUsd",
        label: "Provider / gas cost (USD)",
        placeholder: "e.g. 0.01",
        hint: "Use 0 or leave empty for variable gas (TRX, USDT TRON).",
      },
    ],
    meta: [{ key: "displayLabel", label: "Catalog name", placeholder: "SOL Send (solana)" }],
  },
  vc_creation: {
    title: "Virtual card issuance",
    description: "One-time card creation fee in USD, converted to Naira at the exchange rate.",
    customer: [
      { key: "exchangeRate", label: "Exchange rate (NGN per $1)", placeholder: "1500", colSpan: 2 },
      {
        key: "feeUsd",
        label: "User creation fee (USD)",
        placeholder: "e.g. 3",
        hint: "PDF: $3 Mastercard / $6 Visa. Debited as fee × rate in Naira.",
      },
    ],
    provider: [
      { key: "providerCostUsd", label: "Provider cost (USD)", placeholder: "e.g. 1.5" },
    ],
    meta: [{ key: "displayLabel", label: "Catalog name", placeholder: "Mastercard Card Issuance" }],
  },
  vc_fund: {
    title: "Virtual card funding",
    description: "Load fee = flat USD + FX markup in Naira. Provider load % is COGS only (not charged to user).",
    customer: [
      { key: "exchangeRate", label: "Exchange rate (NGN per $1)", placeholder: "1500", colSpan: 2 },
      {
        key: "feeUsd",
        label: "Billspro flat fee (USD)",
        placeholder: "1",
        hint: "PDF: $1 flat. Naira wallet: this × exchange rate.",
      },
      {
        key: "fxMarkupNgn",
        label: "FX markup (NGN)",
        placeholder: "80",
        hint: "PDF: ₦80 spread profit on each load.",
      },
    ],
    provider: [
      { key: "providerCostUsd", label: "Provider flat cost (USD)", placeholder: "1" },
      {
        key: "providerPct",
        label: "Provider load fee (%)",
        placeholder: "1 for MC, 2 for Visa",
        hint: "Pagocards load % — tracked as COGS, not billed to user.",
      },
    ],
    meta: [{ key: "displayLabel", label: "Catalog name", placeholder: "Mastercard Card Funding" }],
  },
  vc_decline: {
    title: "Card decline fee (2nd+ decline)",
    description: "Charged to the user on the second and subsequent card declines.",
    customer: [
      {
        key: "feeUsd",
        label: "User decline fee (USD)",
        placeholder: "1",
        hint: "PDF: $1 charged from 2nd decline.",
      },
    ],
    provider: [
      {
        key: "providerCostUsd",
        label: "Provider cost (USD)",
        placeholder: "0.75 for Visa",
        hint: "PDF: $0 Visa / $0.75 Visa provider on 2nd decline.",
      },
    ],
    meta: [{ key: "displayLabel", label: "Catalog name", placeholder: "Mastercard Decline Fee (2nd decline)" }],
  },
};

export function getProfileConfig(profile: RateFormProfile): ProfileConfig {
  return PROFILE_CONFIG[profile];
}

/** Rows that match the client PDF catalog — hides scaffold duplicates by default. */
const PDF_PRIMARY_SLUGS = new Set([
  "fiat|withdrawal|||",
  "fiat|deposit|||",
  "virtual_card|visa_creation|||",
  "virtual_card|creation|||",
  "virtual_card|visa_fund|||",
  "virtual_card|fund|||",
  "virtual_card|visa_decline_fee|||",
  "virtual_card|decline_fee|||",
  "crypto|buy|||",
  "crypto|sell|||",
  "crypto|deposit|||",
  "crypto|withdrawal||SOL|solana",
  "crypto|withdrawal||BTC|bitcoin",
  "crypto|withdrawal||BSC|bsc",
  "crypto|withdrawal||DOGE|dogecoin",
  "crypto|withdrawal||ETH|ethereum",
  "crypto|withdrawal||TRX|tron",
  "crypto|withdrawal||USDT_TRON|tron",
  "crypto|withdrawal||USDT|ethereum",
]);

export function isPdfPrimaryRow(r: PlatformRateRow): boolean {
  const slug = `${r.category}|${r.service_key}|${r.sub_service_key ?? ""}|${r.crypto_asset ?? ""}|${r.network_key ?? ""}`;
  if (PDF_PRIMARY_SLUGS.has(slug)) return true;
  if (r.display_label && r.display_label.trim() !== "") return true;
  return false;
}

export function formatRateSummary(r: PlatformRateRow): string {
  const sk = r.service_key;
  if (r.category === "fiat" && sk === "deposit") {
    const pct = r.provider_pct ?? "—";
    const cap = r.provider_pct_cap_ngn ? `cap ₦${r.provider_pct_cap_ngn}` : "";
    return `User ₦0 · Provider ${pct}% ${cap}`.trim();
  }
  if (r.category === "virtual_card" && (sk === "fund" || sk === "visa_fund")) {
    const parts: string[] = [];
    if (r.fee_usd) parts.push(`$${r.fee_usd}`);
    if (Number(r.fixed_fee_ngn) > 0) parts.push(`₦${r.fixed_fee_ngn} FX`);
    if (r.provider_pct) parts.push(`provider ${r.provider_pct}%`);
    return parts.join(" + ") || "—";
  }
  if (r.category === "crypto" && (sk === "buy" || sk === "sell")) {
    return Number(r.fixed_fee_ngn) > 0 ? `₦${r.fixed_fee_ngn} FX markup` : "—";
  }
  if (r.category === "crypto" && sk === "withdrawal") {
    return r.fee_usd ? `$${r.fee_usd} send` : "—";
  }
  if (Number(r.fixed_fee_ngn) > 0) return `₦${r.fixed_fee_ngn}`;
  if (r.fee_usd) return `$${r.fee_usd}`;
  if (r.percentage_fee) return `${r.percentage_fee}%`;
  return "—";
}
