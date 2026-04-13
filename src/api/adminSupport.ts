import { apiGet, apiPatch, apiPost } from "./httpClient";
import type { LaravelPaginator } from "./adminBillPayments";

export interface SupportSummary {
  total_chats: number;
  pending_chat: number;
  ongoing_chat: number;
  resolved_chat: number;
}

export interface SupportTicketListRow {
  id: number;
  ticket_number: string;
  subject: string;
  issue_type: string;
  status: string;
  status_label: string;
  priority: string;
  user: { id: number; display_name: string; email: string | null } | null;
  agent_display: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface SupportMessage {
  id: number;
  sender_role: string;
  body: string;
  created_at: string | null;
  author_display: string;
}

export interface SupportTicketDetail {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  issue_type: string;
  status: string;
  status_label: string;
  priority: string;
  resolved_at: string | null;
  user: { id: number; display_name: string; email: string | null } | null;
  agent_display: string | null;
  created_at: string | null;
}

export function fetchSupportSummary(): Promise<SupportSummary> {
  return apiGet<SupportSummary>("/admin/support/tickets/summary");
}

export function fetchSupportTickets(params: {
  per_page?: number;
  page?: number;
  status?: string;
  priority?: string;
  search?: string;
  from?: string;
  to?: string;
}): Promise<LaravelPaginator<SupportTicketListRow>> {
  return apiGet<LaravelPaginator<SupportTicketListRow>>("/admin/support/tickets", {
    per_page: params.per_page ?? 25,
    page: params.page,
    status: params.status && params.status !== "all" ? params.status : undefined,
    priority: params.priority && params.priority !== "all" ? params.priority : undefined,
    search: params.search?.trim() || undefined,
    from: params.from,
    to: params.to,
  });
}

export function fetchSupportTicketDetail(id: number): Promise<{ ticket: SupportTicketDetail; messages: SupportMessage[] }> {
  return apiGet<{ ticket: SupportTicketDetail; messages: SupportMessage[] }>(`/admin/support/tickets/${id}`);
}

export function postSupportMessage(ticketId: number, body: string): Promise<{ message: SupportMessage; ticket: SupportTicketDetail }> {
  return apiPost<{ message: SupportMessage; ticket: SupportTicketDetail }>(`/admin/support/tickets/${ticketId}/messages`, { body });
}

export function patchSupportTicket(
  ticketId: number,
  body: { status?: string; priority?: string; assigned_to?: number | null }
): Promise<unknown> {
  return apiPatch<unknown>(`/admin/support/tickets/${ticketId}`, body);
}
