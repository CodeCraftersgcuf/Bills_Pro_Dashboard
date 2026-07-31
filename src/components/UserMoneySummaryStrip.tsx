import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchReconciliationUserStory } from "../api/adminReconciliation";
import { getAdminToken } from "../api/authToken";
import { presetToFromTo } from "../utils/dateRange";

const GREEN = "#1B800F";

type Props = {
  userId: string | number;
};

/**
 * Compact 30-day money story on the user profile, linking to full Reconciliation.
 */
export default function UserMoneySummaryStrip({ userId }: Props) {
  const hasToken = Boolean(getAdminToken());
  const { from, to } = presetToFromTo("30d");
  const numericId = Number(userId);

  const q = useQuery({
    queryKey: ["admin", "recon-user-profile", numericId, from, to],
    queryFn: () => fetchReconciliationUserStory(numericId, { from, to }),
    enabled: hasToken && Number.isFinite(numericId) && numericId > 0,
  });

  const story = q.data;

  return (
    <div className="mb-4 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-sm font-semibold text-gray-900">Money summary (last 30 days)</p>
          <p className="text-xs text-gray-500">
            Deposited, withdrawn, bills, card loads — without opening the ledger
          </p>
        </div>
        <Link
          to={`/reconciliation?user_id=${numericId}`}
          className="inline-flex rounded-full px-4 py-2 text-xs font-semibold text-white"
          style={{ backgroundColor: GREEN }}
        >
          Full reconciliation
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Deposited", value: story?.money_in.deposited_display },
          { label: "Withdrawn", value: story?.money_out.withdrawn_display },
          { label: "Bills", value: story?.money_out.bill_payments_display },
          { label: "Card loads", value: story?.money_out.card_funding_display },
          { label: "Naira now", value: story?.still_held.naira_balance_display },
          { label: "Cards now", value: story?.still_held.card_balance_usd_display },
        ].map((cell) => (
          <div key={cell.label} className="bg-white px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{cell.label}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {q.isLoading ? "…" : cell.value ?? "—"}
            </p>
          </div>
        ))}
      </div>
      {story?.check.status === "needs_review" ? (
        <div className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          Needs review — difference {story.check.residual_display}. Open full reconciliation for
          details.
        </div>
      ) : null}
    </div>
  );
}
