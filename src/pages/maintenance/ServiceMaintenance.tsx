import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Construction, Search } from "lucide-react";
import {
  fetchServiceMaintenanceSettings,
  updateServiceMaintenanceSetting,
  type ServiceMaintenanceItem,
} from "../../api/adminServiceMaintenance";

const GREEN = "#1B800F";

function groupItems(items: ServiceMaintenanceItem[]): Record<string, ServiceMaintenanceItem[]> {
  return items.reduce<Record<string, ServiceMaintenanceItem[]>>((acc, item) => {
    const key = item.group || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

type RowEditorProps = {
  item: ServiceMaintenanceItem;
  onSaved: () => void;
};

const RowEditor: React.FC<RowEditorProps> = ({ item, onSaved }) => {
  const [enabled, setEnabled] = useState(item.is_under_maintenance);
  const [noticeTitle, setNoticeTitle] = useState(item.notice_title ?? "");
  const [noticeMessage, setNoticeMessage] = useState(item.notice_message ?? "");
  const [alternateHint, setAlternateHint] = useState(item.alternate_hint ?? "");
  const [dirty, setDirty] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateServiceMaintenanceSetting(item.id, {
        is_under_maintenance: enabled,
        notice_title: noticeTitle.trim() || null,
        notice_message: noticeMessage.trim() || null,
        alternate_hint: alternateHint.trim() || null,
      }),
    onSuccess: () => {
      setDirty(false);
      onSaved();
    },
  });

  const markDirty = () => setDirty(true);

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${
        enabled ? "border-amber-300 bg-amber-50/40" : "border-gray-200"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-gray-900">{item.label}</p>
            {enabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                <Construction className="h-3 w-3" />
                Maintenance ON
              </span>
            )}
          </div>
          <p className="mt-0.5 font-mono text-xs text-gray-500">{item.slug}</p>
        </div>

        <label className="flex shrink-0 cursor-pointer items-center gap-2">
          <span className="text-sm text-gray-600">Under maintenance</span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => {
              setEnabled((v) => !v);
              markDirty();
            }}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              enabled ? "bg-amber-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Notice title (app alert)</label>
          <input
            type="text"
            value={noticeTitle}
            onChange={(e) => {
              setNoticeTitle(e.target.value);
              markDirty();
            }}
            placeholder="e.g. Mastercard temporarily unavailable"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1B800F] focus:outline-none focus:ring-1 focus:ring-[#1B800F]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Alternate hint (optional)</label>
          <input
            type="text"
            value={alternateHint}
            onChange={(e) => {
              setAlternateHint(e.target.value);
              markDirty();
            }}
            placeholder="e.g. Use Visa card instead"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1B800F] focus:outline-none focus:ring-1 focus:ring-[#1B800F]"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-gray-600">Notice message (shown to users)</label>
        <textarea
          value={noticeMessage}
          onChange={(e) => {
            setNoticeMessage(e.target.value);
            markDirty();
          }}
          rows={3}
          placeholder="Explain what is down and what users should do instead."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1B800F] focus:outline-none focus:ring-1 focus:ring-[#1B800F]"
        />
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        {saveMutation.isError && (
          <span className="text-sm text-red-600">Save failed — try again.</span>
        )}
        <button
          type="button"
          disabled={!dirty || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: GREEN }}
        >
          {saveMutation.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
};

const ServiceMaintenance: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-service-maintenance"],
    queryFn: async () => {
      const res = await fetchServiceMaintenanceSettings();
      return res.items ?? [];
    },
  });

  const filtered = useMemo(() => {
    const items = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [data, search]);

  const grouped = useMemo(() => groupItems(filtered), [filtered]);
  const activeCount = (data ?? []).filter((i) => i.is_under_maintenance).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Service maintenance</h1>
        <p className="mt-1 text-sm text-gray-600">
          Turn individual services off during provider outages. Users see your notice in the app and blocked
          actions return immediately — e.g. put Mastercard funding in maintenance and tell users to use Visa.
        </p>
      </div>

      {activeCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">
            <strong>{activeCount}</strong> service{activeCount === 1 ? "" : "s"} currently in maintenance.
            Changes apply within about a minute on mobile (cached).
          </p>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Mastercard, MTN, airtime…"
          className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm focus:border-[#1B800F] focus:outline-none focus:ring-1 focus:ring-[#1B800F]"
        />
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading services…</p>}
      {isError && <p className="text-sm text-red-600">Could not load maintenance settings.</p>}

      {Object.entries(grouped).map(([group, items]) => (
        <section key={group}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{group}</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <RowEditor
                key={item.id}
                item={item}
                onSaved={() => qc.invalidateQueries({ queryKey: ["admin-service-maintenance"] })}
              />
            ))}
          </div>
        </section>
      ))}

      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-gray-500">No services match your search.</p>
      )}
    </div>
  );
};

export default ServiceMaintenance;
