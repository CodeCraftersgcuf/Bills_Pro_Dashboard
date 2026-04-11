import React, { useMemo, useState } from "react";
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
import { ADMINS, type AdminStatus } from "../../data/admins";

const GREEN = "#1B800F";
const TABLE_HEADER_GREEN = "#21D721";
const TABLE_SEARCH_BG = "#189016";
const ROW_A = "#F9F9F9";
const ROW_B = "#E6E6E6";
const COL_HEADER_BG = "#EBEBEB";

const pillGray =
  "rounded-full bg-[#E8E8E8] px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-[#DDDDDD]";

const Setting: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | AdminStatus>("all");
  const [addOpen, setAddOpen] = useState(false);

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return ADMINS;
    return ADMINS.filter((r) => r.status === statusFilter);
  }, [statusFilter]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
      <section
        className="rounded-3xl p-6 md:p-8 text-white shadow-md"
        style={{ backgroundColor: GREEN }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Management</h1>
          <div className="relative inline-flex w-full sm:w-auto">
            <select
              className="appearance-none w-full sm:w-[200px] rounded-xl bg-white/15 border border-white/25 text-white text-sm font-medium pl-4 pr-10 py-3 cursor-pointer hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
              defaultValue="range"
              aria-label="Select date range"
            >
              <option value="range" className="text-gray-900">
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
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/90 pointer-events-none"
              strokeWidth={2}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          <StatCard icon={Users} label="Total Admins" value="20" hint="View total details" />
          <StatCard icon={UserCheck} label="Active Admins" value="10" hint="View active admins" />
          <StatCard icon={UserX} label="Inactive Admins" value="10" hint="View inactive admins" />
        </div>
      </section>

      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[140px] flex-1 sm:flex-none">
            <select
              className="appearance-none w-full cursor-pointer rounded-full border-0 bg-[#E8E8E8] py-2.5 pl-4 pr-10 text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B800F]/30"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | AdminStatus)
              }
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
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">
            Admin Management
          </h2>
          <div className="relative w-full md:max-w-[280px]">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
              strokeWidth={2}
            />
            <input
              type="search"
              placeholder="Search"
              className="w-full rounded-full border-0 py-3 pl-11 pr-5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ backgroundColor: TABLE_SEARCH_BG }}
            />
          </div>
        </div>

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
              {filteredRows.map((row, i) => (
                <tr
                  key={row.id}
                  className="align-middle"
                  style={{ backgroundColor: i % 2 === 0 ? ROW_A : ROW_B }}
                >
                  <td className="px-5 py-5 align-middle">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                      aria-label={`Select ${row.name}`}
                    />
                  </td>
                  <td className="px-5 py-5 align-middle">
                    <div className="flex items-center gap-3">
                      <img
                        src={row.avatar}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white"
                        width={40}
                        height={40}
                      />
                      <span className="font-semibold text-gray-900">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-5 align-middle text-gray-800">{row.role}</td>
                  <td className="px-5 py-5 align-middle">
                    <span
                      className={
                        row.status === "Active"
                          ? "inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#166534]"
                          : "inline-flex rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#6B7280]"
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-5 align-middle text-gray-700">{row.tableDate}</td>
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
                        aria-label={`Edit ${row.name}`}
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D9D9D9] text-red-600 transition-colors hover:bg-[#CCCCCC]"
                        aria-label={`Delete ${row.name}`}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AddAdminModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
};

export default Setting;
