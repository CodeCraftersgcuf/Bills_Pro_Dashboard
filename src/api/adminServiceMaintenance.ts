import { apiGet, apiPut } from "./httpClient";

export type ServiceMaintenanceItem = {
  id: number;
  slug: string;
  group: string;
  label: string;
  is_under_maintenance: boolean;
  notice_title: string | null;
  notice_message: string | null;
  alternate_hint: string | null;
  updated_at: string | null;
};

export function fetchServiceMaintenanceSettings() {
  return apiGet<{ items: ServiceMaintenanceItem[] }>("/admin/service-maintenance");
}

export function updateServiceMaintenanceSetting(
  id: number,
  body: {
    is_under_maintenance: boolean;
    notice_title?: string | null;
    notice_message?: string | null;
    alternate_hint?: string | null;
  }
) {
  return apiPut<ServiceMaintenanceItem>(`/admin/service-maintenance/${id}`, body);
}
