import React, { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  ChevronDown,
  Search,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import StatCard from "../../components/StatCard";
import AddAdminModal from "../../components/AddAdminModal";
import { createAdminUser, deleteAdminUser, fetchAdminUsers } from "../../api/adminUsers";
import { getAdminToken } from "../../api/authToken";
import { ApiError } from "../../api/httpClient";
import { avatarUrlForName } from "../../utils/avatarUrl";
import { presetToFromTo, type DateRangePreset } from "../../utils/dateRange";

const GREEN = "#1B800F";
const TABLE_HEADER_GREEN = "#21D721";
const TABLE_SEARCH_BG = "#189016";
const ROW_A = "#F9F9F9";
const ROW_B = "#E6E6E6";
const COL_HEADER_BG = "#EBEBEB";

const pillGray =
  "rounded-full bg-[#E8E8E8] px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-[#DDDDDD]";

type UiStatus = "all" | "Active" | "Inactive";

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

const Setting: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasToken = Boolean(getAdminToken());
  const [statusFilter, setStatusFilter] = useState<UiStatus>("all");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchDebounced = useDeferredValue(search);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const { from, to } = presetToFromTo(datePreset);

  const adminsQ = useQuery({
    queryKey: ["admin", "users", "admins-only", searchDebounced, from, to],
    queryFn: () =>
      fetchAdminUsers({
        per_page: 100,
        is_admin: true,
        search: searchDebounced.trim() || undefined,
        from,
        to,
      }),
    enabled: hasToken,
  });

  const allRows = adminsQ.data?.data ?? [];

  const createMut = useMutation({
    mutationFn: createAdminUser,
    onSuccess: async (row) => {
      setActionNotice(`Admin created: ${row.email ?? row.name ?? "new admin"}`);
      setAddOpen(false);
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: async () => {
      setActionNotice("Admin deleted.");
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const filteredRows = useMemo(() => {
    let r = allRows;
    if (statusFilter === "Active") {
      r = r.filter((x) => x.account_status === "active");
    } else if (statusFilter === "Inactive") {
      r = r.filter((x) => x.account_status !== "active");
    }
    return r;
  }, [allRows, statusFilter]);

  const total = allRows.length;
  const activeCount = allRows.filter((x) => x.account_status === "active").length;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <section className="rounded-3xl p-6 text-white shadow-md md:p-8" style={{ backgroundColor: GREEN }}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">Admin Management</h1>
          <div className="relative inline-flex w-full sm:w-auto">
            <select
              className="w-full cursor-pointer appearance-none rounded-xl border border-white/25 bg-white/15 py-3 pl-4 pr-10 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 sm:w-[200px]"
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
              aria-label="Select date range"
            >
              <option value="all" className="text-gray-900">
                Select Date
              </option>
              <option value="7d" className="text-gray-900">
                Last 7 days
              </option>
              <option value="30d" className="text-gray-900">
                Last 30 days
              </option>
              <option value="90d" className="text-gray-900">
                Last 90 days
              </option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/90"
              strokeWidth={2}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          <StatCard icon={Users} label="Total Admins" value={String(total)} hint="Users with is_admin" />
          <StatCard icon={UserCheck} label="Active Admins" value={String(activeCount)} hint="account_status active" />
          <StatCard
            icon={UserX}
            label="Inactive Admins"
            value={String(Math.max(0, total - activeCount))}
            hint="Not active"
          />
        </div>
      </section>
      {actionNotice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {actionNotice}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[140px] flex-1 sm:flex-none">
            <select
              className="w-full cursor-pointer appearance-none rounded-full border-0 bg-[#E8E8E8] py-2.5 pl-4 pr-10 text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B800F]/30"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UiStatus)}
              aria-label="Filter by status"
            >
              <option value="all">Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          </div>
          <button type="button" className={`${pillGray} w-full sm:w-auto`}>
            Bulk Action
          </button>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 lg:w-auto"
          style={{ backgroundColor: GREEN }}
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          Add New
        </button>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: TABLE_HEADER_GREEN }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">Admin Management</h2>
          <div className="relative w-full md:max-w-[280px]">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
              strokeWidth={2}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full rounded-full border-0 py-3 pl-11 pr-5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ backgroundColor: TABLE_SEARCH_BG }}
            />
          </div>
        </div>

        {adminsQ.isError ? (
          <p className="px-5 py-4 text-sm text-red-600">{(adminsQ.error as Error)?.message ?? "Failed to load."}</p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: COL_HEADER_BG }}>
                <th className="w-12 px-5 py-4 align-middle font-semibold text-gray-600">
                  <span className="sr-only">Select</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Name</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Role</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Status</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Date</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {adminsQ.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    No admins found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, i) => {
                  const name =
                    row.name?.trim() ||
                    [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
                    row.email ||
                    "Admin";
                  const avatar = avatarUrlForName(name);
                  const uiActive = row.account_status === "active";
                  return (
                    <tr
                      key={row.id}
                      className="align-middle"
                      style={{ backgroundColor: i % 2 === 0 ? ROW_A : ROW_B }}
                    >
                      <td className="px-5 py-5 align-middle">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                          aria-label={`Select ${name}`}
                        />
                      </td>
                      <td className="px-5 py-5 align-middle">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatar}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white"
                            width={40}
                            height={40}
                          />
                          <span className="font-semibold text-gray-900">{name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-5 align-middle text-gray-800">Administrator</td>
                      <td className="px-5 py-5 align-middle">
                        <span
                          className={
                            uiActive
                              ? "inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#166534]"
                              : "inline-flex rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#6B7280]"
                          }
                        >
                          {uiActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-5 align-middle text-gray-700">{formatTableDate(row.created_at)}</td>
                      <td className="px-5 py-5 align-middle">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                            style={{ backgroundColor: GREEN }}
                            onClick={() => navigate(`/settings/admin/${row.id}`)}
                          >
                            View Details
                          </button>
                          <button
                            type="button"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D9D9D9] text-gray-700 transition-colors hover:bg-[#CCCCCC]"
                            aria-label={`Edit ${name}`}
                          >
                            <Pencil className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D9D9D9] text-red-600 transition-colors hover:bg-[#CCCCCC]"
                            aria-label={`Delete ${name}`}
                            disabled={deleteMut.isPending}
                            onClick={() => {
                              if (!window.confirm(`Delete admin "${name}"? This cannot be undone.`)) return;
                              deleteMut.mutate(row.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AddAdminModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        saving={createMut.isPending}
        onSave={async (payload) => {
          setActionNotice(null);
          try {
            await createMut.mutateAsync(payload);
          } catch (error) {
            setActionNotice((error as ApiError)?.message ?? "Failed to create admin.");
          }
        }}
      />
    </div>
  );
};

export default Setting;
