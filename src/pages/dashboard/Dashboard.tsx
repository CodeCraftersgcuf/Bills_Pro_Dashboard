import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Users, CreditCard, Banknote, ChevronDown, Eye } from "lucide-react";
import StatCard from "../../components/StatCard";
import LatestUsersTable from "../../components/LatestUsersTable";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const GREEN = "#1B800F";
const WITHDRAWAL_BAR = "#A67C52";
const DEPOSIT_BAR = "#1B800F";

/** Figma: Analytics + Virtual Cards outer panels */
const DASHBOARD_CARD_GRADIENT =
  "linear-gradient(98.12deg, #B2FFAC 6.94%, #21D721 103.03%)";
const DASHBOARD_CARD_RADIUS = "20px";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const withdrawalSample = [42, 38, 55, 48, 62, 58, 70, 65, 52, 60, 68, 55];
const depositSample = [22, 25, 28, 24, 30, 28, 32, 30, 26, 29, 31, 27];

const Dashboard: React.FC = () => {
  const chartData = useMemo(
    () => ({
      labels: months,
      datasets: [
        {
          label: "Withdrawals",
          data: withdrawalSample,
          backgroundColor: WITHDRAWAL_BAR,
          borderRadius: { topLeft: 12, topRight: 12, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: false as const,
          barPercentage: 0.68,
          categoryPercentage: 0.72,
        },
        {
          label: "Deposits",
          data: depositSample,
          backgroundColor: DEPOSIT_BAR,
          borderRadius: { topLeft: 12, topRight: 12, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: false as const,
          barPercentage: 0.68,
          categoryPercentage: 0.72,
        },
      ],
    }),
    []
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false as const,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#14532d",
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "rgba(0, 0, 0, 0.55)", font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          max: 2000,
          grid: { color: "rgba(0, 0, 0, 0.08)" },
          ticks: {
            color: "rgba(0, 0, 0, 0.45)",
            font: { size: 11 },
            stepSize: 500,
          },
        },
      },
    }),
    []
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
      {/* Summary strip */}
      <section
        className="rounded-3xl p-6 md:p-8 text-white shadow-md"
        style={{ backgroundColor: GREEN }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
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
          <StatCard icon={Users} label="Total Users" value="20,000" hint="View total users" />
          <StatCard icon={CreditCard} label="Transactions" value="500" hint="View total transactions" />
          <StatCard icon={Banknote} label="Revenue" value="N200,000" hint="View total revenue" />
        </div>
      </section>

      {/* Analytics + Virtual cards — shared Figma gradient */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div
          className="shadow-md p-6 md:p-8"
          style={{
            background: DASHBOARD_CARD_GRADIENT,
            borderRadius: DASHBOARD_CARD_RADIUS,
            minHeight: "335px",
          }}
        >
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900 md:text-lg">Analytics</h2>
                <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">N200,000</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <select
                    className="appearance-none cursor-pointer rounded-full border border-white/50 bg-white/95 py-2 pl-3.5 pr-9 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#1B800F]/35"
                    defaultValue="wd"
                    aria-label="Withdrawals filter"
                  >
                    <option value="wd">Withdrawals</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                </div>
                <div className="relative">
                  <select
                    className="appearance-none cursor-pointer rounded-full border border-white/50 bg-white/95 py-2 pl-3.5 pr-9 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#1B800F]/35"
                    defaultValue="dep"
                    aria-label="Deposit filter"
                  >
                    <option value="dep">Deposit</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-gray-800">
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: WITHDRAWAL_BAR }}
                />
                Withdrawals
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: DEPOSIT_BAR }}
                />
                Deposits
              </span>
            </div>
          </div>
          <div className="h-[240px] w-full md:h-[260px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div
          className="shadow-md p-6 md:p-8"
          style={{
            background: DASHBOARD_CARD_GRADIENT,
            borderRadius: DASHBOARD_CARD_RADIUS,
            minHeight: "335px",
          }}
        >
          <h2 className="text-base font-semibold text-gray-900 md:text-lg">Total Virtual Cards</h2>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">200</p>

          <div
            className="relative mt-5 min-h-[200px] overflow-hidden rounded-2xl p-5 text-white md:p-6"
            style={{
              background: `linear-gradient(145deg, #062b05 0%, ${GREEN} 42%, #0a4d08 100%)`,
            }}
          >
            {/* Isometric / block pattern */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.22]"
              style={{
                backgroundImage: `
                  linear-gradient(135deg, rgba(255,255,255,0.12) 25%, transparent 25%),
                  linear-gradient(225deg, rgba(255,255,255,0.08) 25%, transparent 25%),
                  linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%),
                  linear-gradient(315deg, rgba(255,255,255,0.1) 25%, transparent 25%)`,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
              }}
            />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  -28deg,
                  transparent,
                  transparent 14px,
                  rgba(255,255,255,0.05) 14px,
                  rgba(255,255,255,0.05) 28px
                )`,
              }}
            />

            <div className="relative flex min-h-[168px] flex-col">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-white/85">Total Virtual Card Balance</p>
                <p className="text-right text-sm font-semibold text-white">
                  Bills <span className="font-bold text-[#BEF264]">Pro</span>
                </p>
              </div>

              <p className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">$10,000.00</p>

              <div className="mt-auto flex flex-col gap-4 pt-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-sm tracking-[0.2em] text-[#B2FFAC] md:text-base">
                    **** **** **** <span className="font-bold text-white">1234</span>
                  </p>
                  <p className="mt-1.5 text-xs font-medium tracking-wide text-white/75">BillsPro</p>
                </div>
                <div className="flex items-center justify-end gap-4 sm:flex-col sm:items-end sm:gap-3">
                  <button
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 hover:bg-white/20"
                    aria-label="Toggle card visibility"
                  >
                    <Eye className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                  <div className="flex items-center gap-0">
                    <span className="z-[1] h-9 w-9 rounded-full bg-[#EB001B] shadow-sm" />
                    <span className="-ml-4 h-9 w-9 rounded-full bg-[#F79E1B] opacity-95 shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LatestUsersTable />
    </div>
  );
};

export default Dashboard;
