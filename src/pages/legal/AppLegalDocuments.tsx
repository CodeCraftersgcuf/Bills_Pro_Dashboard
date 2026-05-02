import React, { useCallback, useEffect, useState } from "react";
import {
  LEGAL_DOC_LABELS,
  type LegalDocumentRow,
  fetchAdminLegalDocuments,
  updateAdminLegalDocument,
} from "../../api/adminLegalDocuments";
import { ApiError } from "../../api/httpClient";

const GREEN = "#1B800F";

const AppLegalDocuments: React.FC = () => {
  const [rows, setRows] = useState<LegalDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { title: string; body: string }>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { documents } = await fetchAdminLegalDocuments();
      setRows(documents);
      const next: Record<string, { title: string; body: string }> = {};
      for (const d of documents) {
        next[d.key] = { title: d.title, body: d.body };
      }
      setDrafts(next);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load legal documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (key: string) => {
    const d = drafts[key];
    if (!d) return;
    setSavingKey(key);
    setSaveMessage(null);
    try {
      await updateAdminLegalDocument(key, { title: d.title, body: d.body });
      setSaveMessage(`Saved “${key}”. Mobile app will pick this up on next fetch (typically within ~30 minutes cache, or immediately after refresh).`);
      await load();
    } catch (e) {
      setSaveMessage(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading legal documents…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
          onClick={() => void load()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px] space-y-8 px-4 py-8 md:px-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">App legal documents</h1>
        <p className="mt-2 text-sm text-gray-600">
          Edit the text shown in the mobile app (in-app pop-ups). Sign-up copies appear on Login and Register;
          virtual-card copies appear on Create Card. Public API: <code className="rounded bg-gray-100 px-1">GET /api/legal-documents</code>
        </p>
        {saveMessage && (
          <p className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
            {saveMessage}
          </p>
        )}
      </div>

      {rows.map((row) => {
        const draft = drafts[row.key] ?? { title: row.title, body: row.body };
        const label = LEGAL_DOC_LABELS[row.key] ?? row.key;
        return (
          <section
            key={row.key}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            style={{ borderTopColor: GREEN, borderTopWidth: 4 }}
          >
            <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
            <p className="mt-1 font-mono text-xs text-gray-500">key: {row.key}</p>
            <label className="mt-4 block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={draft.title}
              onChange={(e) =>
                setDrafts((prev) => ({ ...prev, [row.key]: { ...draft, title: e.target.value } }))
              }
            />
            <label className="mt-4 block text-sm font-medium text-gray-700">Body</label>
            <textarea
              className="mt-1 min-h-[220px] w-full rounded-lg border border-gray-300 px-3 py-2 font-sans text-sm leading-relaxed"
              value={draft.body}
              onChange={(e) =>
                setDrafts((prev) => ({ ...prev, [row.key]: { ...draft, body: e.target.value } }))
              }
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: GREEN }}
                disabled={savingKey === row.key}
                onClick={() => void save(row.key)}
              >
                {savingKey === row.key ? "Saving…" : "Save"}
              </button>
              {row.updated_at && (
                <span className="text-xs text-gray-500">Last updated: {row.updated_at}</span>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default AppLegalDocuments;
