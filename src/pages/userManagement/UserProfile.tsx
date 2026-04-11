import React, { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Check, MoreVertical, Search } from "lucide-react";
import {
  getUserById,
  getActivitiesForUser,
  formatProfileDateTime,
  formatActivityDateTime,
} from "../../data/users";
import AddUserModal from "../../components/AddUserModal";

const GREEN = "#1B800F";
const BRIGHT_GREEN = "#21D721";
const LATEST_SEARCH_BG = "#189016";

/** Figma profile card */
const PANEL_LEFT = "#0B4305";
const PANEL_RIGHT = "#1B800F";
const ACCENT_BTN = "#42AC36";
const DIVIDER = "#174A13";
const VERIFIED_GREEN = "#008000";

const profileCardFont = { fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif" } as const;

type ProfileTab = "details" | "wallet" | "virtual-cards" | "transactions";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-[13px]">
      <p className="text-xs font-normal leading-4 text-white/50">{label}</p>
      <p className="break-words text-sm font-normal leading-[19px] text-white">{value}</p>
    </div>
  );
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProfileTab>("details");
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);

  const user = useMemo(() => (userId ? getUserById(userId) : undefined), [userId]);
  const activities = useMemo(() => (userId ? getActivitiesForUser(userId) : []), [userId]);

  if (!userId || !user) {
    return <Navigate to="/user/management" replace />;
  }

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "details", label: "User Details" },
    { id: "wallet", label: "Wallet" },
    { id: "virtual-cards", label: "Virtual Cards" },
    { id: "transactions", label: "Transactions" },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <button
        type="button"
        onClick={() => navigate("/user/management")}
        className="text-sm font-medium text-gray-600 underline-offset-2 hover:text-[#1B800F] hover:underline"
      >
        ← User Management
      </button>

      <div className="rounded-full bg-[#E5E7EB] p-1.5 shadow-inner md:inline-flex md:w-auto md:max-w-full">
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                tab === t.id ? "text-white shadow-md" : "text-gray-600 hover:bg-white/50"
              }`}
              style={tab === t.id ? { backgroundColor: GREEN } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "details" && (
        <>
          <div
            className="overflow-hidden rounded-[30px] shadow-xl md:flex md:min-h-[363px]"
            style={{
              fontFamily: profileCardFont.fontFamily,
              backgroundColor: PANEL_RIGHT,
              boxShadow: "inset 5px 5px 30px rgba(0, 128, 0, 0.25)",
            }}
          >
            {/* Left — #0B4305 + lens streaks */}
            <div
              className="relative flex w-full flex-col items-center overflow-hidden px-6 pb-10 pt-10 text-center md:w-[430px] md:max-w-[430px] md:shrink-0 md:px-8 md:pb-10 md:pt-10"
              style={{ backgroundColor: PANEL_LEFT }}
            >
              <div
                className="pointer-events-none absolute h-[325px] w-[23px] bg-white opacity-[0.12]"
                style={{
                  filter: "blur(50px)",
                  transform: "rotate(24.36deg)",
                  right: "15%",
                  top: "-18%",
                }}
              />
              <div
                className="pointer-events-none absolute h-[301px] w-[42px] bg-white opacity-[0.08]"
                style={{
                  filter: "blur(100px)",
                  transform: "rotate(24.36deg)",
                  left: "-5%",
                  bottom: "-8%",
                }}
              />
              <div className="relative flex w-full max-w-[320px] flex-col items-center">
                <div
                  className="flex h-[116px] w-[116px] items-center justify-center overflow-hidden rounded-full"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                >
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" width={116} height={116} />
                </div>
                <h1 className="mt-6 max-w-[260px] text-center text-[20px] font-bold leading-[27px] text-white">
                  {user.profileFullName}
                </h1>
                {user.kycStatus === "verified" && (
                  <div
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-black/30 bg-white px-[11px] py-[5px] shadow-sm"
                    style={{ color: VERIFIED_GREEN }}
                  >
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    <span className="text-[8px] font-normal leading-[11px]">Verified</span>
                  </div>
                )}
                {user.kycStatus === "pending" && (
                  <div className="mt-3 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900">
                    KYC Pending
                  </div>
                )}
                <div className="mt-8 flex w-full max-w-[360px] flex-row justify-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setEditDetailsOpen(true)}
                    className="h-[60px] min-w-0 flex-1 max-w-[176px] rounded-full text-sm font-normal leading-[19px] text-white transition-opacity hover:opacity-95"
                    style={{ backgroundColor: ACCENT_BTN }}
                  >
                    Edit Details
                  </button>
                  <button
                    type="button"
                    className="h-[60px] min-w-0 flex-1 max-w-[176px] rounded-full bg-white text-sm font-normal leading-[19px] text-black transition-colors hover:bg-gray-50"
                  >
                    KYC Details
                  </button>
                </div>
              </div>
            </div>

            {/* Right — #1B800F + dividers */}
            <div className="flex flex-1 flex-col px-6 pb-8 pt-8 md:px-10 md:pb-10 md:pt-9" style={{ backgroundColor: PANEL_RIGHT }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-[30px] font-bold leading-[41px] text-white">User Details</h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex h-[35px] min-w-[119px] items-center justify-center rounded-full px-4 text-[10px] font-normal leading-[14px] text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: ACCENT_BTN }}
                  >
                    View Accounts
                  </button>
                  <button
                    type="button"
                    className="flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-xl border border-[#989898] text-white transition-colors hover:bg-white/5"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </div>

              <div className="my-6 h-px w-full shrink-0 md:my-7" style={{ backgroundColor: DIVIDER }} />

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-0">
                <DetailField label="First Name" value={user.firstName} />
                <DetailField label="Last Name" value={user.lastName} />
                <DetailField label="Email" value={user.email} />
              </div>

              <div className="my-6 h-px w-full shrink-0 md:my-7" style={{ backgroundColor: DIVIDER }} />

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-0">
                <DetailField label="Phone Number" value={user.phone} />
                <DetailField label="Date Registered" value={formatProfileDateTime(user.dateRegistered)} />
                <DetailField label="Last Login" value={formatProfileDateTime(user.lastLogin)} />
              </div>
            </div>
          </div>

          <div>
            <button
              type="button"
              className="rounded-full bg-[#E8E8E8] px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-[#DDDDDD]"
            >
              Bulk Action
            </button>
          </div>

          {/* User Activity */}
          <section className="overflow-hidden rounded-3xl bg-white shadow-md">
            <div
              className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
              style={{ backgroundColor: BRIGHT_GREEN }}
            >
              <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">User Activity</h2>
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
              <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[#EBEBEB]">
                    <th className="w-14 px-5 py-4 align-middle font-semibold text-gray-600">
                      <span className="sr-only">Select</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721]"
                        aria-label="Select all activities"
                      />
                    </th>
                    <th className="px-5 py-4 font-semibold text-gray-700">Activity</th>
                    <th className="px-5 py-4 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((row, i) => (
                    <tr
                      key={row.id}
                      className="align-middle"
                      style={{ backgroundColor: i % 2 === 0 ? "#F9F9F9" : "#FFFFFF" }}
                    >
                      <td className="px-5 py-4 align-middle">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721]"
                          aria-label={`Select ${row.activity}`}
                        />
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900">{row.activity}</td>
                      <td className="px-5 py-4 text-gray-700">{formatActivityDateTime(row.occurredAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab !== "details" && (
        <div className="rounded-3xl border border-gray-200 bg-[#F3F4F6] p-12 text-center text-gray-600 shadow-sm">
          <p className="text-lg font-semibold text-gray-800">
            {tabs.find((t) => t.id === tab)?.label}
          </p>
          <p className="mt-2 text-sm">This section will load data from the API when connected.</p>
        </div>
      )}

      <AddUserModal
        open={editDetailsOpen}
        onClose={() => setEditDetailsOpen(false)}
        mode="edit"
        user={user}
      />
    </div>
  );
};

export default UserProfile;
