import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCommissionRates,
  fetchCommissionTiers,
  updateCommissionRate,
  type BillCommissionRateRow,
} from "../../api/adminCommission";
import { getAdminToken } from "../../api/authToken";

const GREEN = "#1B800F";
const HEADER = "#21D721";

type SceneTab = "airtime" | "data" | "betting";

const CommissionRates: React.FC = () => {
  const qc = useQueryClient();
  const hasToken = Boolean(getAdminToken());
  const [scene, setScene] = useState<SceneTab>("airtime");
  const [editPct, setEditPct] = useState<Record<number, string>>({});

  const tiersQ = useQuery({
    queryKey: ["admin", "commission-tiers"],
    queryFn: fetchCommissionTiers,
    enabled: hasToken,
  });

  const ratesQ = useQuery({
    queryKey: ["admin", "commission-rates", scene],
    queryFn: () => fetchCommissionRates(scene),
    enabled: hasToken,
  });

  const saveMut = useMutation({
    mutationFn: ({ id, pct }: { id: number; pct: number }) =>
      updateCommissionRate(id, { commission_pct: pct }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "commission-rates"] }),
  });

  const rows = ratesQ.data ?? [];
  const tiers = tiersQ.data ?? [];

  const matrix = useMemo(() => {
    const entities = [...new Set(rows.map((r) => r.entity_key))].sort();
    return entities.map((entity) => ({
      entity,
      byTier: tiers.map((t) => rows.find((r) => r.entity_key === entity && r.tier_key === t.tier_key)),
    }));
  }, [rows, tiers]);

  const onPctChange = (row: BillCommissionRateRow, v: string) => {
    setEditPct((m) => ({ ...m, [row.id]: v }));
  };

  const commitPct = (row: BillCommissionRateRow) => {
    const v = editPct[row.id] ?? row.commission_pct;
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    saveMut.mutate({ id: row.id, pct: n });
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission tables</h1>
          <p className="mt-1 text-sm text-gray-600">
            Airtime, data, and betting commission % (after WHT). User pays standard rate; profit = commission.
          </p>
        </div>
        <Link to="/rates" className="text-sm font-semibold text-[#1B800F] hover:underline">
          ← Back to Rates
        </Link>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-800">Volume tiers (monthly bill volume)</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {tiers.map((t) => (
            <li key={t.tier_key} className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
              <p className="font-semibold">{t.label}</p>
              <p className="text-gray-600">
                ₦{Number(t.min_monthly_volume_ngn).toLocaleString()}
                {t.max_monthly_volume_ngn != null
                  ? ` – ₦${Number(t.max_monthly_volume_ngn).toLocaleString()}`
                  : "+"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-2">
        {(["airtime", "data", "betting"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScene(s)}
            className={`rounded-full px-5 py-2 text-sm font-semibold ${
              scene === s ? "text-white" : "bg-gray-100 text-gray-700"
            }`}
            style={scene === s ? { backgroundColor: GREEN } : undefined}
          >
            {s === "airtime" ? "Airtime" : s === "data" ? "Data" : "Betting"}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-md">
        <div className="px-5 py-4 text-white md:px-7" style={{ backgroundColor: HEADER }}>
          <h2 className="text-lg font-semibold capitalize">{scene} commission %</h2>
        </div>
        <div className="overflow-x-auto p-4">
          {ratesQ.isLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : matrix.length === 0 ? (
            <p className="text-sm text-gray-500">No rates. Run database seeders.</p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="py-2 pr-4 font-semibold">Network / platform</th>
                  {tiers.map((t) => (
                    <th key={t.tier_key} className="py-2 px-2 font-semibold">
                      {t.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map(({ entity, byTier }) => (
                  <tr key={entity} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium text-gray-900">{entity}</td>
                    {byTier.map((row) => (
                      <td key={row?.id ?? entity} className="py-2 px-2">
                        {row ? (
                          <div className="flex items-center gap-1">
                            <input
                              className="w-20 rounded-lg border border-gray-200 px-2 py-1"
                              value={editPct[row.id] ?? row.commission_pct}
                              onChange={(e) => onPctChange(row, e.target.value)}
                              onBlur={() => commitPct(row)}
                            />
                            <span className="text-gray-500">%</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default CommissionRates;
