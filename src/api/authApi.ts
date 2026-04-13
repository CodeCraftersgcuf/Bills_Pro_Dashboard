import { apiGet } from "./httpClient";
import type { AdminUserSnapshot } from "./authSession";

export function fetchUserProfile(): Promise<{ user: AdminUserSnapshot & Record<string, unknown> }> {
  return apiGet<{ user: AdminUserSnapshot & Record<string, unknown> }>("api/user/profile");
}
