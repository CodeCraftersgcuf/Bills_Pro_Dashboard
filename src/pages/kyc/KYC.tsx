import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, UserCheck, UserX, ChevronDown, Search } from "lucide-react";
import StatCard from "../../components/StatCard";
import KycDetailsModal, { type KycDetailsInitial } from "../../components/KycDetailsModal";
import { fetchAdminStats } from "../../api/adminStats";
import { approveKyc, fetchAdminKycList, rejectKyc, type KycRecord } from "../../api/adminKyc";
import { getAdminToken } from "../../api/authToken";
import { avatarUrlForName } from "../../utils/avatarUrl";
import { presetToFromTo, type DateRangePreset } from "../../utils/dateRange";
import { downloadCsv } from "../../utils/csvDownload";

const GREEN = "#1B800F";
const TABLE_HEADER_GREEN = "#21D721";
const TABLE_SEARCH_BG = "#189016";
const ROW_A = "#F9F9F9";
const ROW_B = "#E6E6E6";
const COL_HEADER_BG = "#EBEBEB";

type KycFilter = "all" | "unverified" | "pending" | "verified" | "rejected";

type KycStatus = "Verified" | "Unverified" | "Pending" | "Rejected";

const filterTabs: { id: KycFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unverified", label: "Unverified" },
  { id: "pending", label: "Pending" },
  { id: "verified", label: "Verified" },
  { id: "rejected", label: "Rejected" },
];

function statusPillClass(status: KycStatus): string {
  switch (status) {
    case "Verified":
      return "bg-[#DCFCE7] text-[#166534]";
    case "Unverified":
      return "bg-[#F3F4F6] text-[#6B7280]";
    case "Pending":
      return "bg-[#FFEDD5] text-[#C2410C]";
    case "Rejected":
      return "bg-[#FEE2E2] text-[#B91C1C]";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function mapApiStatus(
  row: KycRecord | Record<string, unknown>,
  isUnverifiedUser: boolean
): KycStatus {
  if (isUnverifiedUser) return "Unverified";
  const st = String((row as KycRecord).status ?? "").toLowerCase();
  if (st === "approved") return "Verified";
  if (st === "pending") return "Pending";
  if (st === "rejected") return "Rejected";
  return "Unverified";
}

function formatTableDate(iso: string | null | undefined): string {
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

function nameToFirstLast(fullName: string): Pick<KycDetailsInitial, "firstName" | "lastName"> {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/** Normalise API date (Carbon date or ISO string) for `<input>` type text/date. */
function formatKycDobForModal(v: unknown): string {
  if (v == null || v === "") return "";
  const s = typeof v === "string" ? v : String(v);
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : s.slice(0, 10);
}

function nonEmptyStr(v: unknown): string {
  if (v == null || v === "") return "";
  const t = String(v).trim();
  return t;
}

function fmtInt(n: number): string {
  return n.toLocaleString("en-NG");
}

type KycExportRow = {
  key: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: string;
  date: string;
};

const KYC: React.FC = () => {
  const hasToken = Boolean(getAdminToken());
  const qc = useQueryClient();
  const [filter, setFilter] = useState<KycFilter>("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailInitial, setDetailInitial] = useState<KycDetailsInitial | null>(null);
  const [detailUserId, setDetailUserId] = useState<number | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const searchDebounced = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [selectedKyc, setSelectedKyc] = useState<Map<string, KycExportRow>>(() => new Map());
  const [bulkKyc, setBulkKyc] = useState<"bulk" | "export">("bulk");
  const selectAllKycRef = useRef<HTMLInputElement>(null);
  const { from, to } = presetToFromTo(datePreset);

  const statsQ = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
    enabled: hasToken,
  });
  const s = statsQ.data;

  const listParams = useMemo(() => {
    const base = { search: searchDebounced.trim() || undefined, page, per_page: 25, from, to };
    if (filter === "unverified") {
      return { ...base, scope: "unverified" as const };
    }
    const statusMap: Partial<Record<KycFilter, string>> = {
      pending: "pending",
      verified: "approved",
      rejected: "rejected",
    };
    if (filter === "all") {
      return base;
    }
    return { ...base, status: statusMap[filter] };
  }, [filter, searchDebounced, page, from, to]);

  const kycQ = useQuery({
    queryKey: ["admin", "kyc-list", listParams],
    queryFn: () => fetchAdminKycList(listParams),
    enabled: hasToken,
  });

  const rows = kycQ.data?.data ?? [];

  const kycExportRows: KycExportRow[] = useMemo(() => {
    return rows.map((raw) => {
      const isUnverified = filter === "unverified";
      const u = isUnverified
        ? (raw as Record<string, unknown>)
        : (((raw as KycRecord).user as Record<string, unknown>) || {});
      const name =
        String(u.name ?? "") ||
        [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
        "—";
      const email = String(u.email ?? "—");
      const phone = String(u.phone_number ?? "—");
      const st = mapApiStatus(raw as KycRecord, isUnverified);
      const dateRaw = isUnverified ? String(u.created_at ?? "") : String((raw as KycRecord).created_at ?? "");
      const key = isUnverified ? `u-${String(u.id)}` : `k-${(raw as KycRecord).id}`;
      return {
        key,
        name,
        email,
        phone,
        kycStatus: st,
        date: formatTableDate(dateRaw),
      };
    });
  }, [rows, filter]);

  useEffect(() => {
    setSelectedKyc(new Map());
  }, [filter, page, searchDebounced, from, to]);

  const allKycSelected =
    kycExportRows.length > 0 && kycExportRows.every((r) => selectedKyc.has(r.key));
  const someKycSelected = kycExportRows.some((r) => selectedKyc.has(r.key));

  useEffect(() => {
    const el = selectAllKycRef.current;
    if (!el) return;
    el.indeterminate = someKycSelected && !allKycSelected;
  }, [allKycSelected, someKycSelected, kycExportRows]);

  const toggleKycRow = (row: KycExportRow) => {
    setSelectedKyc((prev) => {
      const next = new Map(prev);
      if (next.has(row.key)) next.delete(row.key);
      else next.set(row.key, row);
      return next;
    });
  };

  const toggleAllKycOnPage = () => {
    const all = kycExportRows.length > 0 && kycExportRows.every((r) => selectedKyc.has(r.key));
    setSelectedKyc((prev) => {
      const next = new Map(prev);
      if (all) {
        kycExportRows.forEach((r) => next.delete(r.key));
      } else {
        kycExportRows.forEach((r) => next.set(r.key, r));
      }
      return next;
    });
  };

  const onBulkKycChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as "bulk" | "export";
    setBulkKyc("bulk");
    if (v !== "export") return;
    const list = Array.from(selectedKyc.values());
    if (list.length === 0) {
      window.alert("Select at least one row to export.");
      return;
    }
    downloadCsv(
      "kyc-records",
      ["key", "name", "email", "phone", "kyc_status", "date"],
      list.map((r) => [r.key, r.name, r.email, r.phone, r.kycStatus, r.date])
    );
  };

  const refreshKyc = async () => {
    await qc.invalidateQueries({ queryKey: ["admin", "kyc-list"] });
    await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
  };
  const approveMut = useMutation({
    mutationFn: (uid: number) => approveKyc(uid),
    onSuccess: async () => {
      setActionNotice("KYC approved.");
      await refreshKyc();
      closeKycDetails();
    },
  });
  const rejectMut = useMutation({
    mutationFn: ({ uid, reason }: { uid: number; reason: string }) => rejectKyc(uid, reason),
    onSuccess: async () => {
      setActionNotice("KYC rejected.");
      await refreshKyc();
      closeKycDetails();
    },
  });

  const openKycDetails = (row: KycRecord | Record<string, unknown>, isUnverified: boolean) => {
    if (isUnverified) {
      const u = row as Record<string, unknown>;
      const name =
        String(u.name ?? "") ||
        [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
        "User";
      const email = String(u.email ?? "");
      const { firstName, lastName } = nameToFirstLast(name);
      setDetailInitial({
        firstName,
        lastName,
        email,
        status: "Unverified",
        dateOfBirth: "",
        nin: "",
        bvn: "",
      });
      setDetailUserId(Number(u.id ?? 0) || null);
      setDetailOpen(true);
      return;
    }

    const kyc = row as KycRecord;
    const u = (kyc.user ?? {}) as Record<string, unknown>;
    const userName =
      String(u.name ?? "")
        .trim() ||
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
      "User";
    const fromParts = nameToFirstLast(userName);
    const firstName = nonEmptyStr(kyc.first_name) || nonEmptyStr(u.first_name) || fromParts.firstName;
    const lastName = nonEmptyStr(kyc.last_name) || nonEmptyStr(u.last_name) || fromParts.lastName;
    const email = nonEmptyStr(kyc.email) || nonEmptyStr(u.email) || "";

    setDetailInitial({
      firstName,
      lastName,
      email,
      status: mapApiStatus(kyc, false),
      dateOfBirth: formatKycDobForModal(kyc.date_of_birth),
      nin: nonEmptyStr(kyc.nin_number),
      bvn: nonEmptyStr(kyc.bvn_number),
    });
    setDetailUserId(Number(kyc.user_id) || Number(u.id) || null);
    setDetailOpen(true);
  };

  const closeKycDetails = () => {
    setDetailOpen(false);
    setDetailInitial(null);
    setDetailUserId(null);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <section className="rounded-3xl p-6 text-white shadow-md md:p-8" style={{ backgroundColor: GREEN }}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">KYC</h1>
          <div className="relative inline-flex w-full sm:w-auto">
            <select
              className="w-full cursor-pointer appearance-none rounded-xl border border-white/25 bg-white/15 py-3 pl-4 pr-10 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 sm:w-[200px]"
              value={datePreset}
              onChange={(e) => {
                setDatePreset(e.target.value as DateRangePreset);
                setPage(1);
              }}
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
          <StatCard icon={Users} label="Total Users" value={s ? fmtInt(s.users_total) : "—"} hint="All users" />
          <StatCard
            icon={UserCheck}
            label="KYC approved"
            value={s ? fmtInt(s.kyc_approved) : "—"}
            hint="Approved submissions"
          />
          <StatCard
            icon={UserX}
            label="Without KYC"
            value={s ? fmtInt(s.users_without_kyc) : "—"}
            hint="No KYC record yet"
          />
        </div>
      </section>
      {actionNotice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {actionNotice}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div
          className="inline-flex flex-wrap gap-2 rounded-full bg-[#E8E8E8] p-1.5"
          role="tablist"
          aria-label="KYC status filter"
        >
          {filterTabs.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setFilter(tab.id);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active ? "text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
                }`}
                style={active ? { backgroundColor: GREEN } : { backgroundColor: "transparent" }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="relative w-full shrink-0 sm:w-auto">
          <select
            value={bulkKyc}
            onChange={onBulkKycChange}
            className="w-full cursor-pointer appearance-none rounded-full border-0 bg-[#E8E8E8] py-2.5 pl-5 pr-10 text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B800F]/25"
            aria-label="Bulk action"
          >
            <option value="bulk">Bulk Action</option>
            <option value="export">Export</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: TABLE_HEADER_GREEN }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">KYC records</h2>
          <div className="relative w-full md:max-w-[280px]">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
              strokeWidth={2}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search"
              className="w-full rounded-full border-0 py-3 pl-11 pr-5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ backgroundColor: TABLE_SEARCH_BG }}
            />
          </div>
        </div>

        {kycQ.isError ? (
          <p className="px-5 py-4 text-sm text-red-600">{(kycQ.error as Error)?.message ?? "Failed to load."}</p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: COL_HEADER_BG }}>
                <th className="w-12 px-5 py-4 align-middle font-semibold text-gray-600">
                  <span className="sr-only">Select</span>
                  <input
                    ref={selectAllKycRef}
                    type="checkbox"
                    checked={allKycSelected}
                    onChange={toggleAllKycOnPage}
                    className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                    aria-label="Select all on this page"
                  />
                </th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Name</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Email</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Phone</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">KYC Status</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Date</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {kycQ.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-500">
                    No records.
                  </td>
                </tr>
              ) : (
                rows.map((raw, i) => {
                  const isUnverified = filter === "unverified";
                  const u = isUnverified
                    ? (raw as Record<string, unknown>)
                    : ((raw as KycRecord).user as Record<string, unknown>) || {};
                  const name =
                    String(u.name ?? "") ||
                    [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
                    "—";
                  const email = String(u.email ?? "—");
                  const phone = String(u.phone_number ?? "—");
                  const st = mapApiStatus(raw as KycRecord, isUnverified);
                  const dateRaw = isUnverified
                    ? String(u.created_at ?? "")
                    : String((raw as KycRecord).created_at ?? "");
                  const avatar = avatarUrlForName(name);
                  const key = isUnverified ? `u-${String(u.id)}` : `k-${(raw as KycRecord).id}`;
                  const exportRow = kycExportRows[i];
                  return (
                    <tr
                      key={key}
                      className="align-middle"
                      style={{ backgroundColor: i % 2 === 0 ? ROW_A : ROW_B }}
                    >
                      <td className="px-5 py-5 align-middle">
                        <input
                          type="checkbox"
                          checked={exportRow ? selectedKyc.has(exportRow.key) : false}
                          onChange={() => exportRow && toggleKycRow(exportRow)}
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
                      <td className="px-5 py-5 align-middle text-gray-700">{email}</td>
                      <td className="px-5 py-5 align-middle text-gray-700">{phone}</td>
                      <td className="px-5 py-5 align-middle">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(st)}`}>
                          {st}
                        </span>
                      </td>
                      <td className="px-5 py-5 align-middle text-gray-700">{formatTableDate(dateRaw)}</td>
                      <td className="px-5 py-5 align-middle">
                        <button
                          type="button"
                          className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                          style={{ backgroundColor: GREEN }}
                          onClick={() => openKycDetails(raw as KycRecord, isUnverified)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {kycQ.data && kycQ.data.last_page > 1 ? (
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
              Page {page} of {kycQ.data.last_page}
            </span>
            <button
              type="button"
              disabled={page >= kycQ.data.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>

      <KycDetailsModal
        open={detailOpen}
        onClose={closeKycDetails}
        initial={detailInitial}
        busy={approveMut.isPending || rejectMut.isPending}
        onApprove={detailUserId ? () => approveMut.mutate(detailUserId) : undefined}
        onReject={detailUserId ? (reason) => rejectMut.mutate({ uid: detailUserId, reason }) : undefined}
      />
    </div>
  );
};

export default KYC;
