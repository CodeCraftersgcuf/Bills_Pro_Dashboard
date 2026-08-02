import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Minus,
  Receipt,
  Search,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import {
  fetchDaybook,
  fetchDaybookTransactions,
  type DaybookDelta,
  type DaybookLine,
  type DaybookReport,
  type DaybookTransaction,
} from "../../api/adminDaybook";
import { getAdminToken } from "../../api/authToken";
import { downloadCsv } from "../../utils/csvDownload";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const GREEN = "#1B800F";
const BRIGHT_GREEN = "#21D721";
const IN_COLOR = "#1B800F";
const OUT_COLOR = "#E08707";
const TABLE_HEADER_GREEN = "#21D721";
const TABLE_SEARCH_BG = "#189016";
const TABLE_COL_HEADER_BG = "#EBEBEB";

const TYPE_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "deposit", label: "Deposits" },
  { id: "withdrawal", label: "Withdrawals" },
  { id: "bill_payment", label: "Bill payments" },
  { id: "card_funding", label: "Card loads" },
  { id: "card_creation", label: "Card fees" },
];

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All statuses" },
  { id: "completed", label: "Completed" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
  { id: "cancelled", label: "Cancelled" },
];

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function statusPill(status: string): string {
  const s = status.toLowerCase();
  if (s === "completed") return "bg-emerald-100 text-emerald-800";
  if (s === "pending" || s === "processing") return "bg-amber-100 text-amber-800";
  if (s === "failed" || s === "cancelled") return "bg-rose-100 text-rose-800";
  return "bg-gray-100 text-gray-700";
}

function DeltaChip({ delta, invert = false }: { delta: DaybookDelta; invert?: boolean }) {
  const good = invert ? delta.direction === "down" : delta.direction === "up";
  const tone =
    delta.direction === "flat"
      ? "bg-white/20 text-white"
      : good
        ? "bg-white/25 text-white"
        : "bg-black/20 text-white";
  const Icon =
    delta.direction === "up" ? ArrowUpRight : delta.direction === "down" ? ArrowDownRight : Minus;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}
      title={`Previous day: ${delta.previous.toLocaleString()} · change ${delta.diff_display}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {delta.pct_display}
    </span>
  );
}

function FlowPanel({
  title,
  subtitle,
  total,
  count,
  lines,
  color,
  emptyText,
}: {
  title: string;
  subtitle: string;
  total: string;
  count: number;
  lines: DaybookLine[];
  color: string;
  emptyText: string;
}) {
  const active = lines.filter((l) => l.count > 0);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color }}>
            {total}
          </p>
          <p className="text-xs text-gray-500">{count} transactions</p>
        </div>
      </div>

      {active.length === 0 ? (
        <p className="rounded-2xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          {emptyText}
        </p>
      ) : (
        <div className="space-y-3.5">
          {active.map((line) => (
            <div key={line.type}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                <span className="text-gray-700">
                  {line.label}
                  <span className="ml-2 text-xs text-gray-400">{line.count}×</span>
                </span>
                <span className="font-semibold text-gray-900">{line.amount_display}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(2, line.pct))}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-white/80">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
      {hint ? <p className="text-[11px] text-white/70">{hint}</p> : null}
    </div>
  );
}

function StatusPanel({
  report,
  statusFilter,
  onSelect,
}: {
  report: DaybookReport;
  statusFilter: string;
  onSelect: (status: string) => void;
}) {
  const totalCount = report.statuses.reduce((sum, s) => sum + s.count, 0);
  const settled = report.statuses.find((s) => s.status === "completed")?.count ?? 0;
  const unsettled = totalCount - settled;

  return (
    <div className="flex flex-col rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">How did they land?</h2>
          <p className="text-xs text-gray-500">
            Tap a status to filter the list below. Pending and failed money is what needs chasing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect("all")}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            statusFilter === "all" ? "text-white" : "bg-gray-100 text-gray-600"
          }`}
          style={statusFilter === "all" ? { backgroundColor: GREEN } : undefined}
        >
          All
        </button>
      </div>

      {totalCount === 0 ? (
        <p className="mt-4 rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          No Naira transactions on this day.
        </p>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            {report.statuses.map((s) => {
              const empty = s.count === 0;
              const selected = statusFilter === s.status;

              return (
                <button
                  key={s.status}
                  type="button"
                  disabled={empty}
                  onClick={() => onSelect(s.status)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition ${
                    empty
                      ? "cursor-default bg-gray-50/60"
                      : selected
                        ? "bg-gray-50 ring-2 ring-[#1B800F]/40"
                        : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        empty ? "bg-gray-100 text-gray-400" : statusPill(s.status)
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className={`text-xs ${empty ? "text-gray-400" : "text-gray-500"}`}>
                      {s.count} txs
                    </span>
                  </span>
                  {empty ? (
                    <span className="text-xs text-gray-400">none</span>
                  ) : (
                    <span className="text-right text-xs leading-5">
                      <span className="font-semibold" style={{ color: IN_COLOR }}>
                        {s.in_display} in
                      </span>
                      <br />
                      <span className="font-semibold" style={{ color: OUT_COLOR }}>
                        {s.out_display} out
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p
            className={`mt-3 rounded-2xl px-4 py-2.5 text-xs ${
              unsettled === 0 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
            }`}
          >
            {unsettled === 0
              ? `All ${totalCount} transactions settled — nothing pending or failed.`
              : `${unsettled} of ${totalCount} transactions did not complete.`}
          </p>
        </>
      )}

    </div>
  );
}

function exportDayCsv(date: string, rows: DaybookTransaction[]): void {
  if (rows.length === 0) return;
  downloadCsv(
    `day-book-${date}`,
    [
      "time",
      "transaction_id",
      "user_id",
      "user_name",
      "user_email",
      "type",
      "direction",
      "category",
      "status",
      "currency",
      "amount",
      "fee",
      "description",
      "reference",
    ],
    rows.map((r) => [
      r.time,
      r.transaction_id,
      r.user_id,
      r.user_name,
      r.user_email,
      r.type_label,
      r.direction,
      r.category_label,
      r.status,
      r.currency,
      r.amount,
      r.fee,
      r.description,
      r.reference,
    ])
  );
}

function HourlyChart({ report }: { report: DaybookReport }) {
  const data = useMemo(
    () => ({
      labels: report.hourly.map((h) => h.label),
      datasets: [
        {
          label: "Money in",
          data: report.hourly.map((h) => h.money_in),
          backgroundColor: IN_COLOR,
          borderRadius: 4,
          barPercentage: 0.85,
          categoryPercentage: 0.8,
        },
        {
          label: "Money out",
          data: report.hourly.map((h) => h.money_out),
          backgroundColor: OUT_COLOR,
          borderRadius: 4,
          barPercentage: 0.85,
          categoryPercentage: 0.8,
        },
      ],
    }),
    [report]
  );

  const busiest = useMemo(
    () => report.hourly.reduce((a, b) => (b.count > a.count ? b : a), report.hourly[0]),
    [report]
  );
  const anyActivity = report.hourly.some((h) => h.count > 0);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Hour by hour</h2>
          <p className="text-xs text-gray-500">
            {anyActivity
              ? `Busiest at ${busiest.label} with ${busiest.count} transactions`
              : "No activity recorded yet on this day"}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: IN_COLOR }} />
            Money in
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: OUT_COLOR }} />
            Money out
          </span>
        </div>
      </div>
      <div className="h-56">
        <Bar
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.dataset.label}: ₦${Number(ctx.parsed.y).toLocaleString()}`,
                },
              },
            },
            scales: {
              x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 12 } },
              y: {
                grid: { color: "#F1F1F1" },
                border: { display: false },
                ticks: {
                  callback: (v) => `₦${Number(v).toLocaleString()}`,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}

const DailyActivity: React.FC = () => {
  const hasToken = Boolean(getAdminToken());
  const [date, setDate] = useState<string>(todayLocal());
  const [includeTest, setIncludeTest] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const searchDebounced = useDeferredValue(search);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [date, typeFilter, statusFilter, searchDebounced, includeTest]);

  const dayQuery = useQuery({
    queryKey: ["admin", "daybook", date, includeTest],
    queryFn: () => fetchDaybook({ date, include_test: includeTest ? 1 : undefined }),
    enabled: hasToken,
  });

  const txQuery = useQuery({
    queryKey: ["admin", "daybook-tx", date, typeFilter, statusFilter, searchDebounced, page, includeTest],
    queryFn: () =>
      fetchDaybookTransactions({
        date,
        type: typeFilter === "all" ? undefined : typeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchDebounced.trim() || undefined,
        include_test: includeTest ? 1 : undefined,
        page,
        per_page: 25,
      }),
    enabled: hasToken,
  });

  const report = dayQuery.data;
  const rows = txQuery.data?.data ?? [];
  const lastPage = txQuery.data?.last_page ?? 1;
  const total = txQuery.data?.total ?? 0;

  const pillSelect =
    "cursor-pointer appearance-none rounded-full border border-gray-200 bg-[#E8E8E8] py-2.5 pl-4 pr-9 text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B800F]/25";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily activity</h1>
          <p className="mt-1 text-sm text-gray-500">
            One day at a time: what was collected, what was paid out, and every transaction behind
            the numbers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => report && setDate(report.day.prev_date)}
              className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 px-2">
              <CalendarDays className="h-4 w-4" style={{ color: GREEN }} />
              <input
                type="date"
                value={date}
                max={todayLocal()}
                onChange={(e) => setDate(e.target.value || todayLocal())}
                className="bg-transparent text-sm font-semibold text-gray-800 focus:outline-none"
              />
            </div>
            <button
              type="button"
              aria-label="Next day"
              disabled={!report?.day.next_date}
              onClick={() => report?.day.next_date && setDate(report.day.next_date)}
              className="rounded-full p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setDate(todayLocal())}
            className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Today
          </button>

          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm">
            <input
              type="checkbox"
              checked={includeTest}
              onChange={(e) => setIncludeTest(e.target.checked)}
              className="h-4 w-4 accent-[#1B800F]"
            />
            Include test accounts
          </label>

          <button
            type="button"
            onClick={() => exportDayCsv(date, rows)}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: GREEN }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-3xl p-5 shadow-md md:p-6"
        style={{ background: `linear-gradient(135deg, ${GREEN} 0%, ${BRIGHT_GREEN} 100%)` }}
      >
        {dayQuery.isLoading || !report ? (
          <p className="py-10 text-center text-white/90">Loading the day…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  {report.day.long_label}
                </p>
                <h2 className="mt-1 text-3xl font-bold text-white">{report.day.label}</h2>
                <p className="mt-1 text-xs text-white/80">{report.scope.helper}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-white/75">Collected (money in)</p>
                  <p className="text-3xl font-bold text-white">{report.money_in.total_display}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <DeltaChip delta={report.versus_yesterday.money_in} />
                    <span className="text-[11px] text-white/70">
                      {report.money_in.count} in · {report.versus_yesterday.label}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-white/75">Paid out (money out)</p>
                  <p className="text-3xl font-bold text-white">{report.money_out.total_display}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <DeltaChip delta={report.versus_yesterday.money_out} invert />
                    <span className="text-[11px] text-white/70">
                      {report.money_out.count} out · {report.versus_yesterday.label}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-white/75">Net movement</p>
                  <p className="text-3xl font-bold text-white">{report.net.amount_display}</p>
                  <p className="mt-1 text-[11px] text-white/75">{report.net.helper}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStat
                icon={CreditCard}
                label="Card spend"
                value={report.cards.spend_usd_display}
                hint={`${report.cards.spend_count} card txs`}
              />
              <MiniStat
                icon={Sparkles}
                label="Card fees"
                value={report.cards.card_fees_usd_display}
                hint={`${report.cards.declines} declines`}
              />
              <MiniStat
                icon={Users}
                label="Active users"
                value={String(report.people.active_users)}
                hint="Moved money today"
              />
              <MiniStat
                icon={UserPlus}
                label="New signups"
                value={String(report.people.new_users)}
                hint="Registered today"
              />
            </div>
          </>
        )}
      </div>

      {report ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <HourlyChart report={report} />
            </div>

            <StatusPanel
              report={report}
              statusFilter={statusFilter}
              onSelect={setStatusFilter}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <FlowPanel
              title="What came in"
              subtitle="Money added to user wallets"
              total={report.money_in.total_display}
              count={report.money_in.count}
              lines={report.money_in.lines}
              color={IN_COLOR}
              emptyText="Nothing came in on this day."
            />
            <FlowPanel
              title="Where it went"
              subtitle="Money that left user wallets"
              total={report.money_out.total_display}
              count={report.money_out.count}
              lines={report.money_out.lines}
              color={OUT_COLOR}
              emptyText="Nothing left the wallets on this day."
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Receipt className="h-5 w-5" style={{ color: GREEN }} />
                <h2 className="text-base font-semibold text-gray-900">Bills paid today</h2>
              </div>
              {report.bill_breakdown.length === 0 ? (
                <p className="rounded-2xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                  No bills were paid on this day.
                </p>
              ) : (
                <div className="space-y-3.5">
                  {report.bill_breakdown.map((b) => (
                    <div key={b.category}>
                      <div className="mb-1.5 flex items-baseline justify-between text-sm">
                        <span className="text-gray-700">
                          {b.label}
                          <span className="ml-2 text-xs text-gray-400">{b.count}×</span>
                        </span>
                        <span className="font-semibold text-gray-900">{b.amount_display}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(2, b.pct))}%`,
                            backgroundColor: BRIGHT_GREEN,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-4 text-xs text-gray-500">
                Crypto today: in {report.crypto.deposits_display} · out{" "}
                {report.crypto.withdrawals_display} · {report.crypto.tx_count} txs
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Biggest movements</h2>
              <p className="text-xs text-gray-500">The five largest completed amounts of the day</p>
              <div className="mt-4 space-y-2">
                {report.top_movements.length === 0 ? (
                  <p className="rounded-2xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    Nothing completed on this day.
                  </p>
                ) : (
                  report.top_movements.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <Link
                          to={`/user/management/profile/${t.user_id}`}
                          className="truncate text-sm font-medium text-gray-900 hover:text-[#1B800F] hover:underline"
                        >
                          {t.user_name}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {t.time} · {t.type_label}
                        </p>
                      </div>
                      <p
                        className="shrink-0 text-sm font-bold"
                        style={{ color: t.direction === "in" ? IN_COLOR : OUT_COLOR }}
                      >
                        {t.direction === "in" ? "+" : "−"}
                        {t.amount_display}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div
          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ backgroundColor: TABLE_HEADER_GREEN }}
        >
          <div className="flex items-center gap-2 text-white">
            <Receipt className="h-5 w-5" />
            <span className="font-semibold">
              Every transaction {report ? `· ${report.day.date}` : ""}
            </span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
              {total}
            </span>
          </div>
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ backgroundColor: TABLE_SEARCH_BG }}
          >
            <Search className="h-4 w-4 text-white/90" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, reference"
              className="w-48 bg-transparent text-sm text-white placeholder:text-white/70 focus:outline-none sm:w-72"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTypeFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                typeFilter === f.id
                  ? "text-white shadow-sm"
                  : "bg-[#F1F1F1] text-gray-700 hover:bg-gray-200"
              }`}
              style={typeFilter === f.id ? { backgroundColor: GREEN } : undefined}
            >
              {f.label}
            </button>
          ))}
          <div className="relative ml-auto">
            <select
              className={pillSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead style={{ backgroundColor: TABLE_COL_HEADER_BG }}>
              <tr className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">What happened</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reference</th>
              </tr>
            </thead>
            <tbody>
              {txQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    Loading transactions…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    Nothing matches these filters on this day.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-[#F9FBF9]">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                      {r.time}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/user/management/profile/${r.user_id}`}
                        className="block font-medium text-gray-900 hover:text-[#1B800F] hover:underline"
                      >
                        {r.user_name}
                      </Link>
                      {r.user_email ? (
                        <Link
                          to={`/user/management/profile/${r.user_id}`}
                          className="block text-xs text-gray-500 hover:text-[#1B800F]"
                        >
                          {r.user_email}
                        </Link>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-medium text-gray-800">
                        {r.direction === "in" ? (
                          <ArrowDownRight className="h-4 w-4" style={{ color: IN_COLOR }} />
                        ) : r.direction === "out" ? (
                          <ArrowUpRight className="h-4 w-4" style={{ color: OUT_COLOR }} />
                        ) : (
                          <Minus className="h-4 w-4 text-gray-400" />
                        )}
                        {r.type_label}
                      </span>
                      {r.category_label || r.description ? (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">
                          {r.category_label ? `${r.category_label} · ` : ""}
                          {r.description}
                        </p>
                      ) : null}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-right font-semibold"
                      style={{
                        color:
                          r.direction === "in"
                            ? IN_COLOR
                            : r.direction === "out"
                              ? OUT_COLOR
                              : "#4B5563",
                      }}
                    >
                      {r.direction === "in" ? "+" : r.direction === "out" ? "−" : ""}
                      {r.amount_display}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-600">
                      {r.fee > 0 ? r.fee_display : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill(
                          r.status
                        )}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[10rem] truncate text-xs text-gray-500">
                        {r.reference ?? r.transaction_id}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {lastPage > 1 ? (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {lastPage} · {total} transactions
            </span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DailyActivity;
