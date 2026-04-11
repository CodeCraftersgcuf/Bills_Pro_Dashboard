import React, { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Search } from "lucide-react";
import { getAdminById } from "../../data/admins";
import AddAdminModal from "../../components/AddAdminModal";

const GREEN = "#1B800F";
const PANEL_LEFT = "#0B4305";
const BRIGHT_GREEN = "#21D721";
const TABLE_HEADER_GREEN = "#21D721";
const TABLE_SEARCH_BG = "#189016";
const ROW_A = "#F9F9F9";
const ROW_B = "#E6E6E6";
const COL_HEADER_BG = "#EBEBEB";

const pillGray =
  "rounded-full bg-[#E8E8E8] px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-[#DDDDDD]";

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-xs font-medium text-white/60">{label}</p>
      <p className="break-words text-base font-bold text-white">{value}</p>
    </div>
  );
}

const AdminDetail: React.FC = () => {
  const { adminId } = useParams<{ adminId: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const admin = useMemo(() => (adminId ? getAdminById(adminId) : undefined), [adminId]);

  if (!adminId || !admin) {
    return <Navigate to="/settings" replace />;
  }

  const isActive = admin.status === "Active";

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <button
        type="button"
        onClick={() => navigate("/settings")}
        className="text-sm font-medium text-gray-600 underline-offset-2 hover:text-[#1B800F] hover:underline"
      >
        ← Admin Management
      </button>

      <div
        className="overflow-hidden rounded-3xl shadow-xl md:flex md:min-h-[400px]"
        style={{ backgroundColor: GREEN }}
      >
        <div
          className="relative flex w-full flex-col items-center justify-center px-6 py-10 text-center md:w-[min(100%,380px)] md:max-w-[380px] md:shrink-0 md:px-8"
          style={{ backgroundColor: PANEL_LEFT }}
        >
          <div
            className="pointer-events-none absolute h-[280px] w-[20px] bg-white opacity-[0.12]"
            style={{
              filter: "blur(50px)",
              transform: "rotate(24deg)",
              right: "12%",
              top: "-15%",
            }}
          />
          <div
            className="pointer-events-none absolute h-[260px] w-[36px] bg-white opacity-[0.08]"
            style={{
              filter: "blur(80px)",
              transform: "rotate(24deg)",
              left: "-8%",
              bottom: "-5%",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: `
                linear-gradient(135deg, rgba(255,255,255,0.1) 25%, transparent 25%),
                linear-gradient(225deg, rgba(255,255,255,0.06) 25%, transparent 25%)`,
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative flex w-full max-w-[300px] flex-col items-center">
            <div
              className="flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-full ring-4 ring-white/20"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
            >
              <img
                src={admin.avatar}
                alt=""
                className="h-full w-full object-cover"
                width={120}
                height={120}
              />
            </div>
            <h1 className="mt-6 text-xl font-bold leading-tight text-white md:text-2xl">
              {admin.profileFullName}
            </h1>
            <span
              className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm ${
                isActive ? "bg-white text-[#166534]" : "bg-white/90 text-gray-600"
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${isActive ? "bg-[#21D721]" : "bg-gray-400"}`}
              />
              {admin.status}
            </span>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="mt-8 w-full max-w-[220px] rounded-full py-3 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
              style={{ backgroundColor: BRIGHT_GREEN }}
            >
              Edit Details
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-6 py-8 md:px-10 md:py-10">
          <h2 className="text-2xl font-bold text-white md:text-3xl">Admin Details</h2>

          <div className="mt-8 space-y-8">
            <div className="grid grid-cols-1 gap-8 border-b border-white/20 pb-8 sm:grid-cols-3 sm:gap-6">
              <DetailCell label="First Name" value={admin.firstName} />
              <DetailCell label="Last Name" value={admin.lastName} />
              <DetailCell label="Email" value={admin.email} />
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
              <DetailCell label="Days Active" value={admin.daysActive} />
              <DetailCell label="Date Registered" value={admin.dateRegistered} />
              <DetailCell label="Last Login" value={admin.lastLogin} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <button type="button" className={pillGray}>
          Bulk Action
        </button>
      </div>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-md">
        <div
          className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 md:py-5"
          style={{ backgroundColor: TABLE_HEADER_GREEN }}
        >
          <h3 className="text-lg font-semibold tracking-tight text-white md:text-xl">Admin Activity</h3>
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
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: COL_HEADER_BG }}>
                <th className="w-12 px-5 py-4 align-middle font-semibold text-gray-600">
                  <span className="sr-only">Select</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                    aria-label="Select all activities"
                  />
                </th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Activity</th>
                <th className="px-5 py-4 align-middle font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {admin.activities.map((row, i) => (
                <tr
                  key={row.id}
                  className="align-middle"
                  style={{ backgroundColor: i % 2 === 0 ? ROW_A : ROW_B }}
                >
                  <td className="px-5 py-5 align-middle">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded-none border-2 border-gray-400 bg-white accent-[#21D721] focus:ring-2 focus:ring-[#21D721]/40"
                      aria-label={`Select ${row.activity}`}
                    />
                  </td>
                  <td className="px-5 py-5 align-middle font-medium text-gray-900">{row.activity}</td>
                  <td className="px-5 py-5 align-middle text-gray-700">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AddAdminModal open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
};

export default AdminDetail;
