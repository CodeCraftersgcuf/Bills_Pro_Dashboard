import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, MessageCircle, Paperclip, Search, Send, Users, X } from "lucide-react";
import {
  fetchSupportSummary,
  fetchSupportTicketDetail,
  fetchSupportTickets,
  postSupportMessage,
  type SupportMessage,
  type SupportTicketListRow,
} from "../../api/adminSupport";
import { getAdminToken } from "../../api/authToken";
import { ApiError } from "../../api/httpClient";
import { avatarUrlForName } from "../../utils/avatarUrl";
import { presetToFromTo, type DateRangePreset } from "../../utils/dateRange";

const HEADER_GREEN = "#21D721";
const HEADER_SEARCH = "#189016";
const ROW_A = "#F9F9F9";
const ROW_B = "#E6E6E6";
const COL_HEADER = "#EBEBEB";
const ACTION_GREEN = "#34D334";
const ADMIN_BUBBLE = "#22C55E";

function formatTableDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  let h = d.getHours();
  const m = d.getMinutes();
  const am = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${mm}/${dd}/${yy} - ${h}:${String(m).padStart(2, "0")} ${am}`;
}

function formatChatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function issueHeading(issueType: string, subject: string): string {
  const map: Record<string, string> = {
    crypto_issue: "Crypto issue",
    fiat_issue: "Funding issue",
    virtual_card_issue: "Virtual card issue",
    general: "General support",
  };
  return map[issueType] ?? subject;
}

function statusBadgeStyle(label: string): { bg: string; color: string } {
  if (label === "Resolved") return { bg: "#DCFCE7", color: "#166534" };
  if (label === "Pending") return { bg: "#FEF3C7", color: "#92400E" };
  if (label === "Ongoing") return { bg: "#EDE9FE", color: "#5B21B6" };
  return { bg: "#F3F4F6", color: "#374151" };
}

const SupportChatModal: React.FC<{
  ticketId: number;
  onClose: () => void;
}> = ({ ticketId, onClose }) => {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const q = useQuery({
    queryKey: ["admin", "support-ticket", ticketId],
    queryFn: () => fetchSupportTicketDetail(ticketId),
  });

  const sendMut = useMutation({
    mutationFn: (body: string) => postSupportMessage(ticketId, body),
    onSuccess: async () => {
      setDraft("");
      await qc.invalidateQueries({ queryKey: ["admin", "support-ticket", ticketId] });
      await qc.invalidateQueries({ queryKey: ["admin", "support-tickets"] });
    },
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [q.data?.messages]);

  const ticket = q.data?.ticket;
  const messages = q.data?.messages ?? [];

  return (
    <div className="fixed inset-0 z-[200] flex items-stretch justify-center sm:p-4 md:items-center" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[201] flex h-full w-full max-h-[100dvh] max-w-lg flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:max-h-[min(92dvh,720px)] sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-600 hover:bg-gray-100" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          {ticket?.user ? (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <img
                src={avatarUrlForName(ticket.user.display_name)}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-gray-100"
                width={40}
                height={40}
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{ticket.user.display_name}</p>
                <p className="text-xs text-emerald-600">Online</p>
              </div>
            </div>
          ) : (
            <span className="font-semibold text-gray-900">Chat</span>
          )}
          {ticket ? (
            <span
              className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
              style={statusBadgeStyle(ticket.status_label)}
            >
              {ticket.status_label}
            </span>
          ) : null}
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-600 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {q.isLoading && <p className="text-center text-sm text-gray-500">Loading chat…</p>}
          {q.isError && (
            <p className="text-center text-sm text-red-600">{(q.error as Error)?.message ?? "Could not load chat."}</p>
          )}
          {ticket && (
            <>
              <div className="rounded-xl bg-gray-100 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Issue</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{issueHeading(ticket.issue_type, ticket.subject)}</p>
                {ticket.subject && ticket.issue_type !== "general" ? (
                  <p className="mt-1 text-xs text-gray-600">{ticket.subject}</p>
                ) : null}
              </div>

              <div className="mt-6 space-y-4">
                <p className="text-center text-xs text-gray-400">Today</p>
                {messages.map((m: SupportMessage) => {
                  const isAdmin = m.sender_role === "admin";
                  return (
                    <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                          isAdmin ? "rounded-br-md text-white" : "rounded-bl-md bg-gray-100 text-gray-900"
                        }`}
                        style={isAdmin ? { backgroundColor: ADMIN_BUBBLE } : undefined}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`mt-1 text-[10px] ${isAdmin ? "text-white/80" : "text-gray-500"}`}>
                          {formatChatTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            </>
          )}
        </div>

        <footer className="shrink-0 border-t border-gray-100 bg-white px-3 py-3">
          <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-2 py-2">
            <button type="button" className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-200/80" aria-label="Attach">
              <Paperclip className="h-5 w-5" />
            </button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type message"
              rows={1}
              className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (draft.trim() && !sendMut.isPending) sendMut.mutate(draft.trim());
                }
              }}
            />
            <button
              type="button"
              disabled={!draft.trim() || sendMut.isPending || ticket?.status === "closed"}
              onClick={() => sendMut.mutate(draft.trim())}
              className="shrink-0 rounded-xl p-2.5 text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: ACTION_GREEN }}
              aria-label="Send"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          {sendMut.isError ? (
            <p className="mt-2 text-center text-xs text-red-600">{(sendMut.error as ApiError)?.message ?? "Send failed"}</p>
          ) : null}
        </footer>
      </div>
    </div>
  );
};

const Support: React.FC = () => {
  const hasToken = Boolean(getAdminToken());
  const [tab, setTab] = useState<"all" | "pending" | "resolved" | "ongoing">("all");
  const [priority, setPriority] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [chatId, setChatId] = useState<number | null>(null);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const { from, to } = presetToFromTo(datePreset);

  const summaryQ = useQuery({
    queryKey: ["admin", "support-summary"],
    queryFn: fetchSupportSummary,
    enabled: hasToken,
    refetchInterval: hasToken ? 30_000 : false,
    refetchOnWindowFocus: true,
  });

  const listQ = useQuery({
    queryKey: ["admin", "support-tickets", page, tab, priority, search, from, to],
    queryFn: () =>
      fetchSupportTickets({
        page,
        per_page: 25,
        status: tab,
        priority,
        search,
        from,
        to,
      }),
    enabled: hasToken,
    refetchInterval: hasToken ? 30_000 : false,
    refetchOnWindowFocus: true,
  });

  const rows = listQ.data?.data ?? [];
  const totalPages = listQ.data?.last_page ?? 1;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Support</h1>

      {!hasToken ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Log in as <strong>admin</strong> to load support tickets and chat.
        </div>
      ) : null}

      <section
        className="grid grid-cols-1 gap-4 rounded-3xl p-5 md:grid-cols-3 md:gap-5 md:p-7"
        style={{ background: "linear-gradient(135deg, #166534 0%, #15803d 45%, #14532d 100%)" }}
      >
        {[
          { label: "Total Chats", sub: "All support tickets", value: summaryQ.data?.total_chats ?? "—", icon: MessageCircle },
          { label: "Pending Chat", sub: "Awaiting first response", value: summaryQ.data?.pending_chat ?? "—", icon: Users },
          { label: "Resolved Chat", sub: "Closed or resolved", value: summaryQ.data?.resolved_chat ?? "—", icon: Users },
        ].map((c) => (
          <div
            key={c.label}
            className="flex min-h-[110px] overflow-hidden rounded-2xl shadow-md"
            style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(34,197,94,0.35) 100%)" }}
          >
            <div className="flex flex-1 flex-col justify-center gap-1 px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <c.icon className="h-5 w-5 text-white" />
                </span>
                <span className="text-sm font-semibold">{c.label}</span>
              </div>
              <p className="text-[11px] text-white/80">{c.sub}</p>
              <p className="text-2xl font-bold tracking-tight md:text-3xl">{c.value}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "All"],
            ["pending", "Pending"],
            ["resolved", "Resolved"],
            ["ongoing", "Ongoing"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setTab(k);
              setPage(1);
            }}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              tab === k ? "bg-[#1B800F] text-white shadow-sm" : "bg-[#E8E8E8] text-gray-800 hover:bg-[#DDDDDD]"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="relative">
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="cursor-pointer appearance-none rounded-full bg-[#E8E8E8] py-2 pl-4 pr-10 text-sm font-semibold text-gray-800"
            aria-label="Priority filter"
          >
            <option value="all">All priorities</option>
            <option value="urgent">Urgent only</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
        </div>
        <div className="relative">
          <select
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value as DateRangePreset);
              setPage(1);
            }}
            className="cursor-pointer appearance-none rounded-full bg-[#E8E8E8] py-2 pl-4 pr-10 text-sm font-semibold text-gray-800"
            aria-label="Date filter"
          >
            <option value="all">All dates</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: HEADER_GREEN }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">Support tickets</h2>
          <div className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/90" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search…"
              className="w-full rounded-full border-0 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/40"
              style={{ backgroundColor: HEADER_SEARCH }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: COL_HEADER }}>
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" className="accent-[#21D721]" aria-label="Select all" />
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Agent Name</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Issue</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {hasToken && listQ.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                rows.map((r: SupportTicketListRow, i: number) => {
                  const name = r.user?.display_name ?? "—";
                  const badge = statusBadgeStyle(r.status_label);
                  return (
                    <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? ROW_A : ROW_B }} className="border-t border-gray-100">
                      <td className="px-3 py-3">
                        <input type="checkbox" className="accent-[#21D721]" aria-label={`Select ${r.id}`} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatarUrlForName(name)}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white"
                            width={36}
                            height={36}
                          />
                          <span className="font-semibold text-gray-900">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-800">{r.agent_display}</td>
                      <td className="max-w-[220px] px-4 py-3 text-gray-800">
                        <span className="line-clamp-2">{issueHeading(r.issue_type, r.subject)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                          {r.status_label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatTableDate(r.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setChatId(r.id)}
                          className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: ACTION_GREEN }}
                        >
                          View Chat
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {hasToken && totalPages > 1 ? (
          <div className="flex items-center justify-center gap-2 border-t border-gray-100 px-4 py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}

        {listQ.isError ? (
          <p className="px-5 py-3 text-sm text-red-600">{(listQ.error as Error)?.message ?? "Failed to load tickets."}</p>
        ) : null}
      </section>

      {chatId != null ? <SupportChatModal ticketId={chatId} onClose={() => setChatId(null)} /> : null}
    </div>
  );
};

export default Support;
