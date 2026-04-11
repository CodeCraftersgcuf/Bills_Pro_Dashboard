import React, { useMemo, useState } from "react";
import { Users, UserCheck, UserX, ChevronDown, Search } from "lucide-react";
import StatCard from "../../components/StatCard";
import KycDetailsModal, { type KycDetailsInitial } from "../../components/KycDetailsModal";

const GREEN = "#1B800F";
const TABLE_HEADER_GREEN = "#21D721";
const TABLE_SEARCH_BG = "#189016";
const ROW_A = "#F9F9F9";
const ROW_B = "#E6E6E6";
const COL_HEADER_BG = "#EBEBEB";

type KycFilter = "all" | "unverified" | "pending" | "verified" | "rejected";

type KycStatus = "Verified" | "Unverified" | "Pending" | "Rejected";

type KycRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: KycStatus;
  date: string;
  avatar: string;
};

const kycSampleRows: KycRow[] = [
  {
    id: 1,
    name: "Osmardeen Malik",
    email: "abcdefgh@gmail.com",
    phone: "070123456789",
    status: "Verified",
    date: "10/22/25 - 07:30 AM",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: 2,
    name: "Chioma Okafor",
    email: "chioma.okafor@gmail.com",
    phone: "08098765432",
    status: "Unverified",
    date: "10/21/25 - 04:15 PM",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: 3,
    name: "James Peterson",
    email: "j.peterson@gmail.com",
    phone: "07011223344",
    status: "Pending",
    date: "10/20/25 - 11:00 AM",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: 4,
    name: "Amina Hassan",
    email: "amina.hassan@gmail.com",
    phone: "08155667788",
    status: "Rejected",
    date: "10/19/25 - 09:45 AM",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: 5,
    name: "David Okonkwo",
    email: "david.ok@gmail.com",
    phone: "09033445566",
    status: "Verified",
    date: "10/18/25 - 02:20 PM",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
  },
];

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

function nameToFirstLast(fullName: string): Pick<KycDetailsInitial, "firstName" | "lastName"> {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

const KYC: React.FC = () => {
  const [filter, setFilter] = useState<KycFilter>("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailInitial, setDetailInitial] = useState<KycDetailsInitial | null>(null);

  const openKycDetails = (row: KycRow) => {
    const { firstName, lastName } = nameToFirstLast(row.name);
    setDetailInitial({
      firstName,
      lastName,
      email: row.email,
      status: row.status,
    });
    setDetailOpen(true);
  };

  const closeKycDetails = () => {
    setDetailOpen(false);
    setDetailInitial(null);
  };

  const filteredRows = useMemo(() => {
    if (filter === "all") return kycSampleRows;
    const map: Record<KycFilter, KycStatus | null> = {
      all: null,
      unverified: "Unverified",
      pending: "Pending",
      verified: "Verified",
      rejected: "Rejected",
    };
    const target = map[filter];
    return kycSampleRows.filter((r) => r.status === target);
  }, [filter]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
      <section
        className="rounded-3xl p-6 md:p-8 text-white shadow-md"
        style={{ backgroundColor: GREEN }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">KYC</h1>
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
          <StatCard icon={Users} label="Total Users" value="2,000" hint="View total users" />
          <StatCard
            icon={UserCheck}
            label="KYC'ed Users"
            value="500"
            hint="Users that have done KYC"
          />
          <StatCard icon={UserX} label="Unverified" value="500" hint="View unverified users" />
        </div>
      </section>

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
                onClick={() => setFilter(tab.id)}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active ? "text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
                }`}
                style={
                  active
                    ? { backgroundColor: GREEN }
                    : { backgroundColor: "transparent" }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="w-full shrink-0 rounded-full bg-[#E8E8E8] px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-[#DDDDDD] sm:w-auto"
        >
          Bulk Action
        </button>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: TABLE_HEADER_GREEN }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">Transactions</h2>
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
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
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
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Email</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Phone</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">KYC Status</th>
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
                  <td className="px-5 py-5 align-middle text-gray-700">{row.email}</td>
                  <td className="px-5 py-5 align-middle text-gray-700">{row.phone}</td>
                  <td className="px-5 py-5 align-middle">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-5 align-middle text-gray-700">{row.date}</td>
                  <td className="px-5 py-5 align-middle">
                    <button
                      type="button"
                      className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: GREEN }}
                      onClick={() => openKycDetails(row)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <KycDetailsModal open={detailOpen} onClose={closeKycDetails} initial={detailInitial} />
    </div>
  );
};

export default KYC;
