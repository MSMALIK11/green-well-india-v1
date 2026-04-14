"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { MemberIdCard } from "@/components/member-id-card";

type MeUser = {
  name: string;
  phone: string;
  referralId: string;
  email: string;
  rank?: string;
  createdAt?: string;
  kycStatus: string;
  activationStatus?: string;
};

export default function ProfilePage() {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () =>
      apiFetch<{ success: boolean; user: MeUser }>("/api/v1/auth/me"),
  });
  const u = data?.user;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold print:hidden">Member ID</h1>

      <section
        id="id-card"
        className="scroll-mt-24 rounded-2xl bg-[#EBE9E6] px-4 py-10 print:bg-transparent print:p-0"
      >
        {u ? (
          <MemberIdCard
            user={{
              name: u.name,
              phone: u.phone,
              referralId: u.referralId,
              rank: u.rank,
              createdAt: u.createdAt,
              kycStatus: u.kycStatus,
              activationStatus: u.activationStatus,
            }}
          />
        ) : (
          <p className="text-center text-muted-foreground print:hidden">
            Loading…
          </p>
        )}
      </section>
    </div>
  );
}
