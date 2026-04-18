import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { fetchAdminStats } from "../../api/adminStats";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const GREEN = "#1B800F";
const WITHDRAWAL_BAR = "#A67C52";
const DEPOSIT_BAR = "#1B800F";

const DASHBOARD_CARD_GRADIENT =
  "linear-gradient(98.12deg, #B2FFAC 6.94%, #21D721 103.03%)";
const DASHBOARD_CARD_RADIUS = "20px";

function fmtInt(n: number): string {
  return n.toLocaleString("en-NG");
}

type StatsRange = "7d" | "30d" | "90d" | "12m";

function chartPeriodLabel(range: StatsRange): string {
  switch (range) {
    case "7d":
      return "Last 7 days · NGN withdrawals vs deposits (completed)";
    case "30d":
      return "Last 30 days · NGN withdrawals vs deposits (completed)";
    case "90d":
      return "Last 90 days (weekly buckets) · NGN withdrawals vs deposits (completed)";
    default:
      return "Last 12 months · NGN withdrawals vs deposits (completed)";
  }
}

const Dashboard: React.FC = () => {
  const [statsRange, setStatsRange] = useState<StatsRange>("12m");

  const statsQ = useQuery({
    queryKey: ["admin", "stats", statsRange],
    queryFn: () => fetchAdminStats(statsRange),
  });

  const s = statsQ.data;

  const chartData = useMemo(() => {
    const labels = s?.chart?.labels?.length ? s.chart.labels : Array(12).fill("—");
    const w = s?.chart?.withdrawals_ngn?.length ? s.chart.withdrawals_ngn : Array(12).fill(0);
    const d = s?.chart?.deposits_ngn?.length ? s.chart.deposits_ngn : Array(12).fill(0);
    return {
      labels,
      datasets: [
        {
          label: "Withdrawals",
          data: w,
          backgroundColor: WITHDRAWAL_BAR,
          borderRadius: { topLeft: 12, topRight: 12, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: false as const,
          barPercentage: 0.68,
          categoryPercentage: 0.72,
        },
        {
          label: "Deposits",
          data: d,
          backgroundColor: DEPOSIT_BAR,
          borderRadius: { topLeft: 12, topRight: 12, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: false as const,
          barPercentage: 0.68,
          categoryPercentage: 0.72,
        },
      ],
    };
  }, [s?.chart]);

  const yMax = useMemo(() => {
    const w = s?.chart?.withdrawals_ngn ?? [];
    const d = s?.chart?.deposits_ngn ?? [];
    const m = Math.max(0, ...w, ...d);
    return Math.max(m * 1.15, 1000);
  }, [s?.chart]);

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
          max: yMax,
          grid: { color: "rgba(0, 0, 0, 0.08)" },
          ticks: {
            color: "rgba(0, 0, 0, 0.45)",
            font: { size: 11 },
          },
        },
      },
    }),
    [yMax]
  );

  const totalUsers = s ? fmtInt(s.users_total) : "—";
  const txTotal = s ? fmtInt(s.transactions_total) : "—";
  const revenue = s?.revenue_ngn_display ?? "—";
  const vc = s?.virtual_cards;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <section className="rounded-3xl p-6 text-white shadow-md md:p-8" style={{ backgroundColor: GREEN }}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
          <div className="relative inline-flex w-full sm:w-auto">
            <select
              className="w-full cursor-pointer appearance-none rounded-xl border border-white/25 bg-white/15 py-3 pl-4 pr-10 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 sm:w-[200px]"
              value={statsRange}
              onChange={(e) => setStatsRange(e.target.value as StatsRange)}
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
              <option value="12m" className="text-gray-900">
                Last 12 months
              </option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/90"
              strokeWidth={2}
            />
          </div>
        </div>
        {statsQ.isError ? (
          <p className="text-sm text-red-100">{(statsQ.error as Error)?.message ?? "Could not load stats."}</p>
        ) : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          <StatCard icon={Users} label="Total Users" value={totalUsers} hint="All registered users" />
          <StatCard
            icon={CreditCard}
            label="Transactions"
            value={txTotal}
            hint="Ledger transactions in selected period"
          />
          <StatCard
            icon={Banknote}
            label="Revenue (NGN)"
            value={revenue}
            hint="Completed NGN volume in selected period"
          />
        </div>
      </section>

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
                <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                  {s?.revenue_ngn_display ?? "—"}
                </p>
                <p className="mt-1 text-xs text-gray-600">{chartPeriodLabel(statsRange)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-gray-800">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: WITHDRAWAL_BAR }} />
                Withdrawals
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: DEPOSIT_BAR }} />
                Deposits
              </span>
            </div>
          </div>
          <div className="h-[240px] w-full md:h-[260px]">
            {statsQ.isLoading ? (
              <p className="text-sm text-gray-600">Loading chart…</p>
            ) : (
              <Bar data={chartData} options={chartOptions} />
            )}
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
          <h2 className="text-base font-semibold text-gray-900 md:text-lg">Virtual cards</h2>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            {vc ? fmtInt(vc.total_cards) : "—"}
          </p>
          <p className="text-sm text-gray-700">
            Users with cards: {vc ? fmtInt(vc.users_with_cards) : "—"}
          </p>

          <div
            className="relative mt-5 min-h-[200px] overflow-hidden rounded-2xl p-5 text-white md:p-6"
            style={{
              background: `linear-gradient(145deg, #062b05 0%, ${GREEN} 42%, #0a4d08 100%)`,
            }}
          >
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
                <p className="text-sm text-white/85">Total virtual card balance</p>
                <p className="text-right text-sm font-semibold text-white">
                  Bills <span className="font-bold text-[#BEF264]">Pro</span>
                </p>
              </div>

              <p className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
                {vc?.total_balance_display ?? "—"}
              </p>

              <div className="mt-auto flex flex-col gap-4 pt-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-sm tracking-[0.2em] text-[#B2FFAC] md:text-base">
                    **** **** **** <span className="font-bold text-white">••••</span>
                  </p>
                  <p className="mt-1.5 text-xs font-medium tracking-wide text-white/75">Aggregate across all cards</p>
                </div>
                <div className="flex items-center justify-end gap-4 sm:flex-col sm:items-end sm:gap-3">
                  <button
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 hover:bg-white/20"
                    aria-label="Card summary"
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

      <LatestUsersTable datePreset={statsRange} />
    </div>
  );
};

export default Dashboard;
