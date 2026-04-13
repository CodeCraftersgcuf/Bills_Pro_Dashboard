import { apiPost } from "./httpClient";

export function adminAdjustFiat(body: {
  user_id: number;
  currency: string;
  direction: "credit" | "debit";
  amount: number;
  note?: string;
}): Promise<Record<string, unknown>> {
  return apiPost<Record<string, unknown>>("/admin/adjustments/fiat", body);
}

export function adminAdjustCrypto(body: {
  user_id: number;
  currency: string;
  blockchain?: string;
  direction: "credit" | "debit";
  amount: number;
  note?: string;
}): Promise<Record<string, unknown>> {
  return apiPost<Record<string, unknown>>("/admin/adjustments/crypto", body);
}
