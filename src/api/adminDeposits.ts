import { apiGet } from "./httpClient";

/** Single deposit row from `GET /api/admin/deposits/{id}` */
export type AdminDepositDetail = Record<string, unknown>;

export function fetchAdminDeposit(id: number | string): Promise<AdminDepositDetail> {
  return apiGet<AdminDepositDetail>(`api/admin/deposits/${encodeURIComponent(String(id))}`);
}
