import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { ChevronDown, Eye } from "lucide-react";
import { fetchAdminStats } from "../../api/adminStats";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const GREEN = "#1B800F";

const Analytics: React.FC = () => {
  const statsQ = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
  });
  const s = statsQ.data;

  const barData = useMemo(
    () => ({
      labels: s?.chart.labels ?? [],
      datasets: [
        {
          label: "Withdrawals",
          data: s?.chart.withdrawals_ngn ?? [],
          backgroundColor: "#A67C52",
          borderRadius: 10,
        },
        {
          label: "Deposits",
          data: s?.chart.deposits_ngn ?? [],
          backgroundColor: "#1B800F",
          borderRadius: 10,
        },
      ],
    }),
    [s]
  );

  const revenueBreakdown = useMemo(() => {
    const ngnRev = s?.revenue_ngn ?? 0;
    const totalWallets = s?.total_naira_in_wallets ?? 0;
    const vcUsers = s?.virtual_cards.users_with_cards ?? 0;
    const pendingKyc = s?.pending_kyc ?? 0;
    return [ngnRev, totalWallets, vcUsers * 1000, pendingKyc * 500];
  }, [s]);

  const revenueDoughnut = useMemo(
    () => ({
      labels: ["Revenue", "Naira Wallets", "Virtual Cards", "Pending KYC"],
      datasets: [
        {
          data: revenueBreakdown,
          backgroundColor: ["#A21CAF", "#16A34A", "#2563EB", "#F59E0B"],
          borderWidth: 0,
        },
      ],
    }),
    [revenueBreakdown]
  );

  const userDoughnut = useMemo(
    () => ({
      labels: ["Active", "New (30d)", "KYC Pending"],
      datasets: [
        {
          data: [s?.active_users ?? 0, s?.new_users_30d ?? 0, s?.pending_kyc ?? 0],
          backgroundColor: ["#FFFFFF", "#16A34A", "#DC2626"],
          borderWidth: 0,
        },
      ],
    }),
    [s]
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 md:space-y-8">
      <section className="rounded-3xl p-6 text-white shadow-md md:p-8" style={{ backgroundColor: GREEN }}>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <div className="relative">
            <select className="appearance-none rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm">
              <option>Select Date</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-white/80">Total Users</p>
            <p className="mt-2 text-4xl font-bold">{(s?.users_total ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-white/80">Transactions</p>
            <p className="mt-2 text-4xl font-bold">{(s?.transactions_total ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-white/80">Revenue</p>
            <p className="mt-2 text-4xl font-bold">{s?.revenue_ngn_display ?? "₦0"}</p>
          </div>
        </div>
      </section>

      {statsQ.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {(statsQ.error as Error)?.message ?? "Failed to load analytics."}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-[linear-gradient(98deg,#B2FFAC_6%,#21D721_103%)] p-5 shadow-md md:p-6">
          <div className="mb-2 text-sm text-gray-700">Analytics</div>
          <div className="mb-4 text-4xl font-bold text-gray-900">{s?.revenue_ngn_display ?? "₦0"}</div>
          <div className="h-72">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: "top" } },
              }}
            />
          </div>
        </section>

        <section className="rounded-3xl bg-[linear-gradient(98deg,#B2FFAC_6%,#21D721_103%)] p-5 shadow-md md:p-6">
          <div className="mb-2 text-sm text-gray-700">Totals Virtual Cards</div>
          <div className="mb-4 text-4xl font-bold text-gray-900">{s?.virtual_cards.total_cards ?? 0}</div>
          <div
            className="relative overflow-hidden rounded-[28px] border border-white/20 p-5 text-white shadow-xl"
            style={{
              backgroundImage:
                'linear-gradient(0deg, rgba(8, 59, 6, 0.78), rgba(8, 59, 6, 0.78)), url("/card-bg-geometric.png")',
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_45%,rgba(86,227,85,0.22),transparent_45%)]" />
            <div className="relative z-[1] min-h-[190px]">
              <div className="flex items-start justify-between">
                <p className="text-sm text-white/75">Total Virtual Card Balance</p>
                <p className="text-[40px] font-bold leading-none text-white/90">
                  Bills <span className="text-[#39D834]">Pro</span>
                </p>
              </div>
              <div className="mt-7 flex items-center justify-between gap-4">
                <p className="text-5xl font-bold tracking-tight">{s?.virtual_cards.total_balance_display ?? "$0.00"}</p>
                <button
                  type="button"
                  className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-white/90 backdrop-blur-sm"
                  aria-label="Toggle balance visibility"
                >
                  <Eye className="h-7 w-7" />
                </button>
              </div>
              <p className="mt-6 font-mono text-3xl tracking-[0.18em] text-white/78">**** **** **** 1234</p>
              <div className="mt-8 flex items-end justify-between">
                <p className="text-4xl font-medium text-white/90">BillsPro</p>
                <div className="relative h-8 w-14">
                  <span className="absolute right-6 top-0 h-8 w-8 rounded-full bg-[#EB001B]" />
                  <span className="absolute right-0 top-0 h-8 w-8 rounded-full bg-[#F79E1B]" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-[linear-gradient(98deg,#B2FFAC_6%,#E9C432_103%)] p-5 shadow-md md:p-6">
          <div className="mb-2 text-sm text-gray-700">Total Revenue</div>
          <div className="mb-4 text-4xl font-bold text-gray-900">{s?.revenue_ngn_display ?? "₦0"}</div>
          <div className="grid grid-cols-[180px,1fr] items-center gap-4">
            <div className="h-44">
              <Doughnut data={revenueDoughnut} options={{ plugins: { legend: { display: false } }, cutout: "65%" }} />
            </div>
            <div className="space-y-2 text-sm text-gray-900">
              {revenueDoughnut.labels.map((label, i) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span>{label}</span>
                  <span className="font-semibold">{Math.round(revenueBreakdown[i]).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-[linear-gradient(98deg,#B2FFAC_6%,#E9C432_103%)] p-5 shadow-md md:p-6">
          <div className="mb-2 text-sm text-gray-700">Total Users</div>
          <div className="mb-4 text-4xl font-bold text-gray-900">{(s?.users_total ?? 0).toLocaleString()}</div>
          <div className="grid grid-cols-[180px,1fr] items-center gap-4">
            <div className="h-44">
              <Doughnut data={userDoughnut} options={{ plugins: { legend: { display: false } }, cutout: "65%" }} />
            </div>
            <div className="space-y-2 text-sm text-gray-900">
              <div className="flex items-center justify-between">
                <span>Active</span>
                <span className="font-semibold">{(s?.active_users ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>New</span>
                <span className="font-semibold">{(s?.new_users_30d ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>KYC Pending</span>
                <span className="font-semibold">{(s?.pending_kyc ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analytics;
