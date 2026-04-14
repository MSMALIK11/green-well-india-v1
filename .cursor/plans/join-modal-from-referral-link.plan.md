# Open JoinRegisterModal from referral link (prefilled sponsor)

## Goal

When a user opens the app via a referral URL (e.g. `/register?sponsor=ADM000001` or any key supported by [`src/lib/sponsor-from-url.ts`](greenwell-fullstack/src/lib/sponsor-from-url.ts): `sponsor`, `ref`, `referral`, `referralId`, `rid`), show [`JoinRegisterModal`](greenwell-fullstack/src/components/auth/join-register-modal.tsx) instead of only the plain card form, with **Sponsor Code** and **Sponsor Name** prefilled.

## Current behavior

- [`app/(auth)/register/page.tsx`](greenwell-fullstack/app/(auth)/register/page.tsx): reads sponsor from URL into **inline** `form.sponsorReferralId` only; no modal; no auto sponsor-name fetch in UI.
- [`JoinRegisterModal`](greenwell-fullstack/src/components/auth/join-register-modal.tsx): already accepts `sponsorReferralId` + `defaultPosition`, and when `open` + non-empty sponsor it calls **`GET /api/v1/auth/sponsor/:id`** to fill **Sponsor Name** (existing `useEffect`).

## Proposed behavior

1. Derive `sponsorFromUrl` with `sponsorReferralFromSearchParams(searchParams)` (same helper as today).
2. If `sponsorFromUrl` is non-empty:
   - Render `<JoinRegisterModal open={joinOpen} onOpenChange={setJoinOpen} sponsorReferralId={sponsorFromUrl} defaultPosition="left" onRegistered={...} />` with **`joinOpen` true** on first paint (after client has search params), so sponsor code + name load as today in the modal.
3. If the user **closes** the modal without registering, fall back to the **existing Card form** (sponsor field still prefilled via existing `useEffect` on `form`) so cold recovery is possible. Optional: show a small “Join with sponsor” button to reopen the modal.
4. If **no** sponsor in URL, keep current page only (card form), no modal.

## Files to change

| File | Change |
|------|--------|
| [`app/(auth)/register/page.tsx`](greenwell-fullstack/app/(auth)/register/page.tsx) | Import `JoinRegisterModal`; add `joinOpen` state (open when `sponsorFromUrl` present); render modal + keep card when `!joinOpen \|\| !sponsorFromUrl` (tune so first visit with sponsor shows modal only, dismiss shows card). Reuse `onRegistered` / `router` pattern consistent with team page. |

## Optional (out of scope unless you want)

- Extend URL with `?slot=left|right` and map to `defaultPosition` in modal.
- Marketing CTAs that already point at `/register?sponsor=...` need no change if they use supported query keys.

## Notes

- No backend change required: sponsor lookup endpoint already exists.
- Avoid SSR/hydration issues: set `joinOpen` to `true` in `useEffect` when `sponsorFromUrl` becomes available, or initialize from `searchParams` only in client component after mount if you see mismatches.

## Implementation todos

- `register-page-modal`: Wire `sponsorFromUrl` → `JoinRegisterModal` + `joinOpen` state and dismiss/fallback UX.
- `register-page-verify`: Manually test `/register?sponsor=VALID_ID` (name fills) and close modal → card still usable.
