import React, { useState } from "react";
import { Users, CreditCard, Banknote, ChevronDown, Search } from "lucide-react";
import StatCard from "../../components/StatCard";

const GREEN = "#1B800F";
const TABLE_HEADER_GREEN = "#21D721";
const TABLE_SEARCH_BG = "#189016";
const TABLE_ROW_A = "#F9F9F9";
const TABLE_ROW_B = "#E6E6E6";
const TABLE_COL_HEADER_BG = "#EBEBEB";
const ACTION_GREEN = "#34D334";

const virtualCardsRows = [
  {
    id: 1,
    name: "Gomer Jeon-Malla",
    cardCount: 2,
    totalBalance: "$3,000",
    lastTrx: "10/22/23 - 07:30 AM",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: 2,
    name: "Chioma Okafor",
    cardCount: 4,
    totalBalance: "$1,240",
    lastTrx: "10/21/23 - 02:15 PM",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: 3,
    name: "James Peterson",
    cardCount: 1,
    totalBalance: "$890",
    lastTrx: "10/20/23 - 11:00 AM",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
  },
];

type StatusFilter = "all" | "active" | "frozen";

const VirtualCards: React.FC = () => {
  const [status, setStatus] = useState<StatusFilter>("all");

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
      <section
        className="rounded-3xl p-6 md:p-8 text-white shadow-md"
        style={{ backgroundColor: GREEN }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Virtual Cards</h1>
          <div className="relative inline-flex w-full sm:w-auto">
            <select
              className="appearance-none w-full sm:w-[200px] rounded-xl bg-white/15 border border-white/25 text-white text-sm font-medium pl-4 pr-10 py-3 cursor-pointer hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
              defaultValue="7d"
              aria-label="Select date range"
            >
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
          <StatCard icon={CreditCard} label="Total Cards" value="500" hint="Issued virtual cards" />
          <StatCard icon={Banknote} label="Card Balance" value="$500" hint="Aggregate balance" />
        </div>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap gap-2 rounded-full bg-gray-200/80 p-1.5">
          {(
            [
              { key: "all" as const, label: "All" },
              { key: "active" as const, label: "Active" },
              { key: "frozen" as const, label: "Frozen" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                status === key
                  ? "bg-[#1B800F] text-white shadow-sm"
                  : "bg-transparent text-gray-800 hover:bg-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="w-full sm:w-auto rounded-xl bg-[#E8E8E8] px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:bg-[#DDDDDD]"
        >
          Bulk Action
        </button>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: TABLE_HEADER_GREEN }}
        >
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">
            Virtual cards details
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
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: TABLE_COL_HEADER_BG }}>
                <th className="w-12 px-5 py-4 align-middle font-semibold text-gray-600">
                  <span className="sr-only">Select</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Name</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">No of cards</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">
                  Cards total balance
                </th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Last trx date</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {virtualCardsRows.map((row, i) => (
                <tr
                  key={row.id}
                  className="align-middle"
                  style={{ backgroundColor: i % 2 === 0 ? TABLE_ROW_A : TABLE_ROW_B }}
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
                  <td className="px-5 py-5 align-middle text-gray-800">{row.cardCount}</td>
                  <td className="px-5 py-5 align-middle font-semibold text-gray-900">
                    {row.totalBalance}
                  </td>
                  <td className="px-5 py-5 align-middle text-gray-700">{row.lastTrx}</td>
                  <td className="px-5 py-5 align-middle">
                    <button
                      type="button"
                      className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: ACTION_GREEN }}
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
    </div>
  );
};

export default VirtualCards;
