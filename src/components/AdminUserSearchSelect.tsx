import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { fetchAdminUsers, type AdminUserRow } from "../api/adminUsers";

function displayName(u: AdminUserRow): string {
  const n = u.name?.trim();
  if (n) return n;
  const fl = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return fl || u.email || `User #${u.id}`;
}

type Props = {
  selected: AdminUserRow | null;
  onSelect: (user: AdminUserRow | null) => void;
  label?: string;
};

const AdminUserSearchSelect: React.FC<Props> = ({ selected, onSelect, label = "Select user" }) => {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const usersQ = useQuery({
    queryKey: ["admin", "users-picker", debounced],
    queryFn: () => fetchAdminUsers({ search: debounced || undefined, per_page: 20, page: 1 }),
    enabled: open,
  });

  const options = useMemo(() => usersQ.data?.data ?? [], [usersQ.data]);

  return (
    <div className="relative space-y-1">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{displayName(selected)}</p>
            <p className="truncate text-xs text-gray-500">
              #{selected.id} · {selected.email}
              {selected.referral_code ? ` · code ${selected.referral_code}` : ""}
            </p>
          </div>
          <button
            type="button"
            className="rounded p-1 text-gray-500 hover:bg-white"
            onClick={() => {
              onSelect(null);
              setQuery("");
              setOpen(true);
            }}
            aria-label="Clear selected user"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
            placeholder="Search name, email, or referral code…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
        </div>
      )}

      {open && !selected && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {usersQ.isLoading && <p className="px-3 py-2 text-xs text-gray-500">Searching…</p>}
          {usersQ.isError && (
            <p className="px-3 py-2 text-xs text-red-600">{(usersQ.error as Error).message}</p>
          )}
          {!usersQ.isLoading && options.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-500">No users found.</p>
          )}
          {options.map((u) => (
            <button
              key={u.id}
              type="button"
              className="flex w-full flex-col items-start gap-0.5 border-b border-gray-50 px-3 py-2 text-left last:border-0 hover:bg-gray-50"
              onClick={() => {
                onSelect(u);
                setOpen(false);
                setQuery("");
              }}
            >
              <span className="text-sm font-medium text-gray-900">{displayName(u)}</span>
              <span className="text-xs text-gray-500">
                #{u.id} · {u.email}
                {u.referral_code ? ` · ${u.referral_code}` : ""}
              </span>
            </button>
          ))}
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-xs text-gray-500 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUserSearchSelect;
