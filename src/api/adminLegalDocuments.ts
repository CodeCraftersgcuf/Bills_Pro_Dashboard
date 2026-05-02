import { apiGet, apiPut } from "./httpClient";

export type LegalDocumentRow = {
  id: number;
  key: string;
  title: string;
  body: string;
  updated_at: string | null;
};

export function fetchAdminLegalDocuments(): Promise<{ documents: LegalDocumentRow[] }> {
  return apiGet<{ documents: LegalDocumentRow[] }>("/admin/legal-documents");
}

export function updateAdminLegalDocument(
  key: string,
  payload: { title: string; body: string }
): Promise<{ document: LegalDocumentRow }> {
  return apiPut<{ document: LegalDocumentRow }>(
    `/admin/legal-documents/${encodeURIComponent(key)}`,
    payload
  );
}

export const LEGAL_DOC_LABELS: Record<string, string> = {
  signup_terms: "Sign up — terms of use (Login / Register footer)",
  signup_privacy: "Sign up — privacy policy (Login / Register footer)",
  virtual_card_terms: "Virtual card — terms & conditions (Create card flow)",
  virtual_card_privacy: "Virtual card — privacy notice (Create card flow)",
};
