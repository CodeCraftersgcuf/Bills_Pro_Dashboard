/** Raw row from GET /admin/virtual-cards/{id}/transactions (matches mobile card tx feed). */
export type AdminVirtualCardTxRaw = Record<string, unknown>;

export function normalizeAdminVirtualCardTxList(payload: unknown): AdminVirtualCardTxRaw[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as AdminVirtualCardTxRaw[];
  if (typeof payload !== "object") return [];
  const d = payload as Record<string, unknown>;
  if (Array.isArray(d.transactions)) return d.transactions as AdminVirtualCardTxRaw[];
  if (Array.isArray(d.data)) return d.data as AdminVirtualCardTxRaw[];
  return [];
}

export function mapVcTxUiStatus(status: string): string {
  switch (String(status).toLowerCase()) {
    case "completed":
      return "Successful";
    case "pending":
      return "Pending";
    case "failed":
    case "cancelled":
      return "Failed";
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
  }
}

export function mapVcTxSubType(type: string): string {
  switch (type) {
    case "fund":
      return "Deposit";
    case "withdraw":
      return "Withdrawal";
    case "payment":
      return "Payment";
    case "refund":
      return "Refund";
    default:
      return type ? type.charAt(0).toUpperCase() + type.slice(1) : "—";
  }
}

/** Mirrors mobile `getVirtualCardRecentTxDisplay`. */
export function getVirtualCardTxAmountDisplay(tx: AdminVirtualCardTxRaw): string {
  const meta = (tx.metadata ?? {}) as Record<string, unknown>;
  const typ = String(tx.type ?? "").toLowerCase();
  const principalUsd = meta.principal_usd != null ? Number(meta.principal_usd) : NaN;
  if (typ === "fund" && Number.isFinite(principalUsd) && principalUsd >= 0) {
    return `USD ${principalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  let currency = String(tx.currency ?? "USD").toUpperCase();
  let num = Number(tx.amount ?? tx.total_amount ?? 0);
  if (currency === "USD" && num >= 1_000_000) {
    num = num / 1_000_000;
  }
  const merchantRaw = meta.merchant_amount;
  if (merchantRaw != null && merchantRaw !== "") {
    const mc = Number(String(merchantRaw).replace(/[^\d.-]/g, ""));
    if (Number.isFinite(mc)) {
      num = mc;
      if (meta.merchant_currency) currency = String(meta.merchant_currency).toUpperCase();
    }
  }

  if (currency === "USD") {
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === "NGN") {
    return `₦${num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${currency} ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatVcTxDate(dateString?: unknown): string {
  if (!dateString) return "—";
  try {
    const date = new Date(String(dateString));
    if (Number.isNaN(date.getTime())) return String(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${day} ${month}, ${year} - ${displayHours}:${minutes} ${ampm}`;
  } catch {
    return String(dateString);
  }
}

export function vcTxTitle(tx: AdminVirtualCardTxRaw): string {
  const desc = String(tx.description ?? "").trim();
  if (desc) return desc;
  return mapVcTxSubType(String(tx.type ?? ""));
}

export function vcTxSubtitle(tx: AdminVirtualCardTxRaw): string {
  const meta = (tx.metadata ?? {}) as Record<string, unknown>;
  const merchant = String(meta.merchant_name ?? "").trim();
  const city = String(meta.merchant_city ?? "").trim();
  if (merchant && city) return `${merchant} · ${city}`;
  if (merchant) return merchant;
  return mapVcTxUiStatus(String(tx.status ?? ""));
}

export function vcTxPublicId(tx: AdminVirtualCardTxRaw): string {
  const ref = String(tx.reference ?? "").trim();
  if (ref) return ref;
  const id = tx.id;
  if (id != null) return `VCT-${id}`;
  return "—";
}
