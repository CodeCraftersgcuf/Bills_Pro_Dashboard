/** JSON snapshot of the logged-in user (from login / profile). */
export const ADMIN_USER_KEY = "billspro_admin_user";

export type AdminUserSnapshot = {
  id: number;
  email: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  is_admin?: boolean;
};

export function getAdminUser(): AdminUserSnapshot | null {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminUserSnapshot;
  } catch {
    return null;
  }
}

export function setAdminUser(user: AdminUserSnapshot): void {
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

export function clearAdminUser(): void {
  localStorage.removeItem(ADMIN_USER_KEY);
}
