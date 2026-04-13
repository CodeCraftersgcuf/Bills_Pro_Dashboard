import { apiDelete, apiGet, apiPost } from "./httpClient";

export type LaravelPaginator<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type AdminPushNotification = {
  id: number;
  subject: string;
  message: string;
  audience: string;
  attachment: string | null;
  sent_count: number;
  created_at: string | null;
};

export type AdminBanner = {
  id: number;
  image: string;
  is_active: boolean;
  created_at: string | null;
};

export function fetchAdminNotifications(params?: { page?: number; per_page?: number }) {
  return apiGet<LaravelPaginator<AdminPushNotification>>("/admin/notifications", {
    page: params?.page,
    per_page: params?.per_page ?? 20,
  });
}

export function createAdminNotification(body: {
  subject: string;
  message: string;
  audience: "all" | "active" | "banned" | "kyc_pending" | "kyc_verified" | "new_users_30d";
  attachment?: string | null;
}) {
  return apiPost<AdminPushNotification>("/admin/notifications", body);
}

export function deleteAdminNotification(id: number) {
  return apiDelete(`/admin/notifications/${id}`);
}

export function fetchAdminBanners(params?: { page?: number; per_page?: number }) {
  return apiGet<LaravelPaginator<AdminBanner>>("/admin/notifications/banners", {
    page: params?.page,
    per_page: params?.per_page ?? 20,
  });
}

export function createAdminBanner(body: { image: string; is_active?: boolean }) {
  return apiPost<AdminBanner>("/admin/notifications/banners", body);
}

export function deleteAdminBanner(id: number) {
  return apiDelete(`/admin/notifications/banners/${id}`);
}
