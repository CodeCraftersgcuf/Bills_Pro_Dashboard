import React, { useState } from "react";
import { Users, UserPlus, UserCheck, ChevronDown, Plus } from "lucide-react";
import StatCard from "../../components/StatCard";
import LatestUsersTable from "../../components/LatestUsersTable";
import AddUserModal from "../../components/AddUserModal";

const GREEN = "#1B800F";

type StatusFilter = "all" | "active" | "banned";

const UserManagement: React.FC = () => {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [addUserOpen, setAddUserOpen] = useState(false);

  const pillBase =
    "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B800F]/40";
  const selectPill =
    "relative appearance-none cursor-pointer rounded-full border border-gray-200 bg-[#ECECEC] py-2.5 pl-4 pr-9 text-sm font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B800F]/25";

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <section
        className="rounded-3xl p-6 text-white shadow-md md:p-8"
        style={{ backgroundColor: GREEN }}
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">User Management</h1>
          <div className="relative inline-flex w-full sm:w-auto">
            <select
              className="w-full cursor-pointer appearance-none rounded-xl border border-white/25 bg-white/15 py-3 pl-4 pr-10 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 sm:w-[200px]"
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
              className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/90"
              strokeWidth={2}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          <StatCard icon={Users} label="Total Users" value="20,000" hint="View total users" />
          <StatCard icon={UserPlus} label="New Users" value="500" hint="View new users" />
          <StatCard icon={UserCheck} label="Active Users" value="500" hint="View active users" />
        </div>
      </section>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "all" as const, label: "All" },
                { key: "active" as const, label: "Active" },
                { key: "banned" as const, label: "Banned" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key)}
                className={`${pillBase} ${
                  status === key
                    ? "text-white shadow-md"
                    : "bg-[#E8E8E8] text-gray-700 hover:bg-[#DDDDDD]"
                }`}
                style={status === key ? { backgroundColor: GREEN } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-1">
            <div className="relative">
              <select className={selectPill} defaultValue="bulk" aria-label="Bulk action">
                <option value="bulk" className="text-gray-900">
                  Bulk Action
                </option>
                <option value="export" className="text-gray-900">
                  Export
                </option>
                <option value="delete" className="text-gray-900">
                  Delete
                </option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            </div>
            <div className="relative">
              <select className={selectPill} defaultValue="kyc" aria-label="KYC status filter">
                <option value="kyc" className="text-gray-900">
                  KYC Status
                </option>
                <option value="verified" className="text-gray-900">
                  Verified
                </option>
                <option value="pending" className="text-gray-900">
                  Pending
                </option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAddUserOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B800F]"
          style={{ backgroundColor: GREEN }}
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          Add New User
        </button>
      </div>

      <AddUserModal open={addUserOpen} onClose={() => setAddUserOpen(false)} />

      <LatestUsersTable />
    </div>
  );
};

export default UserManagement;
