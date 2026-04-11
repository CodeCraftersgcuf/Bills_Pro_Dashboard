import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical } from "lucide-react";
import { USERS } from "../data/users";

const GREEN = "#1B800F";
const LATEST_HEADER_GREEN = "#21D721";
const LATEST_SEARCH_BG = "#189016";
const LATEST_ROW_A = "#F9F9F9";
const LATEST_ROW_B = "#E6E6E6";
const LATEST_COL_HEADER_BG = "#EBEBEB";
const LATEST_ACTION_LIGHT = "#34D334";

const LatestUsersTable: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-md">
      <div
        className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
        style={{ backgroundColor: LATEST_HEADER_GREEN }}
      >
        <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">Latest Users</h2>
        <div className="relative w-full md:max-w-[280px]">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
            strokeWidth={2}
          />
          <input
            type="search"
            placeholder="Search"
            className="w-full rounded-full border-0 py-3 pl-11 pr-5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            style={{ backgroundColor: LATEST_SEARCH_BG }}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead>
            <tr style={{ backgroundColor: LATEST_COL_HEADER_BG }}>
              <th className="w-12 px-5 py-4 align-middle font-semibold text-gray-600">
                <span className="sr-only">Select</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                  aria-label="Select all"
                />
              </th>
              <th className="px-5 py-4 align-middle font-semibold text-gray-700">User Name</th>
              <th className="px-5 py-4 align-middle font-semibold text-gray-700">Email</th>
              <th className="px-5 py-4 align-middle font-semibold text-gray-700">Phone No</th>
              <th className="px-5 py-4 align-middle font-semibold text-gray-700">Wallet Balance</th>
              <th className="px-5 py-4 align-middle font-semibold text-gray-700">Kyc Status</th>
              <th className="px-5 py-4 align-middle font-semibold text-gray-700">Actions</th>
              <th className="w-16 px-5 py-4 align-middle font-semibold text-gray-700">Other</th>
            </tr>
          </thead>
          <tbody>
            {USERS.map((u, i) => (
              <tr
                key={u.id}
                className="align-middle"
                style={{ backgroundColor: i % 2 === 0 ? LATEST_ROW_A : LATEST_ROW_B }}
              >
                <td className="px-5 py-5 align-middle">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                    aria-label={`Select ${u.publicName}`}
                  />
                </td>
                <td className="px-5 py-5 align-middle">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatarUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white"
                      width={40}
                      height={40}
                    />
                    <span className="font-semibold text-gray-900">{u.publicName}</span>
                  </div>
                </td>
                <td className="px-5 py-5 align-middle text-gray-700">{u.email}</td>
                <td className="px-5 py-5 align-middle text-gray-700">{u.phone}</td>
                <td className="px-5 py-5 align-middle font-semibold text-gray-900">{u.walletBalanceDisplay}</td>
                <td className="px-5 py-5 align-middle">
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full ring-2 ring-white"
                    style={{
                      backgroundColor:
                        u.kycStatus === "verified"
                          ? LATEST_HEADER_GREEN
                          : u.kycStatus === "pending"
                            ? "#F59E0B"
                            : "#EF4444",
                    }}
                    title={u.kycStatus}
                  />
                </td>
                <td className="px-5 py-5 align-middle">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => navigate(`/user/management/profile/${u.id}`)}
                      className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: LATEST_ACTION_LIGHT }}
                    >
                      User Details
                    </button>
                    <button
                      type="button"
                      className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: GREEN }}
                    >
                      Transactions
                    </button>
                  </div>
                </td>
                <td className="px-5 py-5 align-middle">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D9D9D9] text-gray-600 transition-colors hover:bg-[#CCCCCC]"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-5 w-5" strokeWidth={2} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default LatestUsersTable;
