import React from "react";
import {
  VIRTUAL_CARD_PRIVACY_BODY,
  VIRTUAL_CARD_PRIVACY_TITLE,
  VIRTUAL_CARD_TERMS_BODY,
  VIRTUAL_CARD_TERMS_TITLE,
} from "../../content/mobileVirtualCardLegal";

const GREEN = "#1B800F";

const VirtualCardLegal: React.FC = () => {
  return (
    <div className="mx-auto max-w-[900px] space-y-8 px-4 py-8 md:px-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Virtual card legal (mobile)</h1>
        <p className="mt-2 text-sm text-gray-600">
          The mobile app shows this same text in pop-ups on{" "}
          <strong>Create Card</strong> (terms, conditions, and privacy). Copy lives in the repo at{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">Bills_Pro/constants/cardLegalTexts.ts</code>{" "}
          and is mirrored here for operations and legal review. Update <strong>both</strong> files when you change
          wording, then ship an app OTA / release.
        </p>
      </div>

      <section
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        style={{ borderTopColor: GREEN, borderTopWidth: 4 }}
      >
        <h2 className="text-lg font-semibold text-gray-900">{VIRTUAL_CARD_TERMS_TITLE}</h2>
        <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
          {VIRTUAL_CARD_TERMS_BODY}
        </pre>
      </section>

      <section
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        style={{ borderTopColor: GREEN, borderTopWidth: 4 }}
      >
        <h2 className="text-lg font-semibold text-gray-900">{VIRTUAL_CARD_PRIVACY_TITLE}</h2>
        <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
          {VIRTUAL_CARD_PRIVACY_BODY}
        </pre>
      </section>
    </div>
  );
};

export default VirtualCardLegal;
