import { redirect } from "next/navigation";

type JoinPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy referral URLs: same query keys as `/register` (e.g. `?sponsor=`). */
export default async function JoinPage({ searchParams }: JoinPageProps) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      for (const v of val) params.append(key, v);
    } else {
      params.set(key, val);
    }
  }
  const q = params.toString();
  redirect(q ? `/register?${q}` : "/register");
}
