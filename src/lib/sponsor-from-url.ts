import type { ReadonlyURLSearchParams } from "next/navigation";

const SPONSOR_QUERY_KEYS = [
  "sponsor",
  "ref",
  "referral",
  "referralId",
  "rid",
] as const;

export function sponsorReferralFromSearchParams(
  sp: ReadonlyURLSearchParams | null,
): string {
  if (!sp) return "";
  for (const key of SPONSOR_QUERY_KEYS) {
    const v = sp.get(key)?.trim();
    if (v) return v.toUpperCase();
  }
  return "";
}
