import { clearAdminUser } from "./authSession";

/** Same storage key pattern as mobile app token usage; admin dashboard login stores Sanctum token here. */
export const ADMIN_AUTH_TOKEN_KEY = "billspro_admin_token";

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
  clearAdminUser();
}
