import type { AdminUserRow } from "../api/adminUsers";
import { downloadCsv } from "./csvDownload";

function displayName(u: AdminUserRow): string {
  const n = u.name?.trim();
  if (n) return n;
  const fl = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return fl || `User #${u.id}`;
}

/**
 * Downloads a CSV of the given user rows (browser download).
 */
export function exportUsersCsv(users: AdminUserRow[], filenameBase = "billspro-users"): void {
  if (users.length === 0) return;

  const headers = [
    "id",
    "name",
    "email",
    "phone_number",
    "account_status",
    "kyc_completed",
    "is_admin",
    "created_at",
  ];
  const rows = users.map((u) => [
    u.id,
    displayName(u),
    u.email,
    u.phone_number,
    u.account_status,
    u.kyc_completed ? "yes" : "no",
    u.is_admin ? "yes" : "no",
    u.created_at,
  ]);
  downloadCsv(filenameBase, headers, rows);
}
