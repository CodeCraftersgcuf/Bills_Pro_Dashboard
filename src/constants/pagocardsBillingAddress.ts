/**
 * Pagocards program billing — Visa vs Mastercard issuer formats.
 * Keep in sync with `billsprobackend/config/virtual_card.php` and mobile `Bills_Pro/constants/pagocardsBillingAddress.ts`.
 */
export type PagocardsBillingScheme = "visa" | "mastercard";

export const PAGOCARDS_FIXED_BILLING_VISA = {
  billing_address_street: "3401 N. Miami Ave., Ste. 230",
  billing_address_city: "Miami",
  billing_address_state: "Florida",
  billing_address_country: "United States",
  billing_address_postal_code: "33127",
} as const;

export const PAGOCARDS_FIXED_BILLING_MASTERCARD = {
  billing_address_street: "128 City Road",
  billing_address_city: "London",
  billing_address_state: "London",
  billing_address_country: "United Kingdom (GB)",
  billing_address_postal_code: "EC1V 2NX",
} as const;

export function pagocardsFixedBillingAddress(scheme: PagocardsBillingScheme) {
  return scheme === "visa" ? PAGOCARDS_FIXED_BILLING_VISA : PAGOCARDS_FIXED_BILLING_MASTERCARD;
}

function mastercardFullAddressLine(a: typeof PAGOCARDS_FIXED_BILLING_MASTERCARD): string {
  return `${a.billing_address_street}, ${a.billing_address_city}, ${a.billing_address_postal_code}`;
}

export function pagocardsBillingSchemeFromCardType(cardType: unknown): PagocardsBillingScheme {
  return String(cardType ?? "").toLowerCase() === "visa" ? "visa" : "mastercard";
}
