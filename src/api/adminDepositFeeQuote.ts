import { apiGet } from "./httpClient";

export type DepositFeeQuote = {
  fee_ngn: number;
  display_fee_ngn: number;
  currency: string;
  uses_palmpay: boolean;
};

export function fetchAdminDepositFeeQuote(): Promise<DepositFeeQuote> {
  return apiGet<DepositFeeQuote>("api/admin/deposit-fee-quote");
}
