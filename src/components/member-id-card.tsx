"use client";

import { Globe, Phone, Printer, User } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";

const forest = "#0A2918";
const forestMid = "#0F3D2C";
const gold = "#C5A059";

export type MemberIdCardUser = {
  name: string;
  phone?: string;
  referralId: string;
  rank?: string;
  createdAt?: string;
  kycStatus?: string;
  activationStatus?: string;
};

function formatCardDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function validUntilDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MemberIdCard({ user }: { user: MemberIdCardUser }) {
  const qrValue = useMemo(() => {
    if (typeof window === "undefined") return user.referralId;
    return `${window.location.origin}/register?sponsor=${encodeURIComponent(user.referralId)}`;
  }, [user.referralId]);

  const verified =
    user.kycStatus === "approved" || user.activationStatus === "active";

  return (
    <div className="member-id-card-root mx-auto w-full max-w-[540px]">
      <h2 className="mb-6 text-center text-lg font-bold tracking-tight text-gray-800 print:mb-4 print:text-base">
        Member Identification Card
      </h2>

      <div
        className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(10,41,24,0.12)] print:shadow-none"
        style={{ border: `2px solid ${gold}` }}
      >
        {/* Top — white */}
        <div className="flex items-start justify-between gap-4 bg-white px-5 py-4 md:px-6 md:py-5">
          <div>
            <p
              className="font-display text-xl font-bold tracking-tight md:text-2xl"
              style={{ color: forestMid }}
            >
              Green Well LLP
            </p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
              Pure Natural Nutrition
            </p>
          </div>
          <div
            className="shrink-0 rounded-md px-2.5 py-1.5 md:px-3"
            style={{ backgroundColor: forest }}
          >
            <span
              className="text-[9px] font-bold uppercase tracking-[0.15em] md:text-[10px]"
              style={{ color: gold }}
            >
              {verified ? "Verified" : "Pending"}
            </span>
          </div>
        </div>

        {/* Middle — dark green */}
        <div className="px-5 py-5 md:px-6 md:py-6" style={{ backgroundColor: forest }}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch sm:gap-5">
            {/* Photo placeholder */}
            <div
              className="mx-auto flex h-[104px] w-[88px] shrink-0 flex-col items-center justify-center rounded-xl sm:mx-0"
              style={{
                border: `2px solid ${gold}`,
                backgroundColor: forestMid,
              }}
            >
              <User className="h-9 w-9" style={{ color: `${gold}99` }} strokeWidth={1.5} />
              <span className="mt-1 text-[8px] font-medium uppercase tracking-wider text-white/40">
                Photo
              </span>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h3 className="truncate font-display text-xl font-bold text-white md:text-2xl">
                {user.name}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 text-left text-sm">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/55">
                    Member ID
                  </p>
                  <p className="mt-0.5 font-bold tabular-nums text-white">
                    {user.referralId}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/55">
                    Rank
                  </p>
                  <p className="mt-0.5">
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
                      style={{
                        backgroundColor: gold,
                        color: forest,
                      }}
                    >
                      {user.rank?.trim() || "Member"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/55">
                    Join Date
                  </p>
                  <p className="mt-0.5 font-bold text-white">
                    {formatCardDate(user.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/55">
                    Valid Till
                  </p>
                  <p className="mt-0.5 font-bold text-white">
                    {validUntilDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* QR */}
            <div className="flex justify-center sm:shrink-0 sm:justify-end">
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <QRCodeSVG value={qrValue} size={88} level="M" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer strip */}
        <div
          className="flex flex-col gap-2 px-5 py-2.5 text-[11px] text-white sm:flex-row sm:items-center sm:justify-between md:px-6"
          style={{ backgroundColor: "#061910" }}
        >
          <span className="flex items-center justify-center gap-1.5 sm:justify-start">
            <Phone className="h-3.5 w-3.5 shrink-0 opacity-90" />
            {user.phone?.trim() || "—"}
          </span>
          <span className="flex items-center justify-center gap-1.5 sm:justify-end">
            <Globe className="h-3.5 w-3.5 shrink-0 opacity-90" />
            www.greenwellindia.in
          </span>
        </div>
      </div>

      <div className="mt-6 flex justify-center print:hidden">
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 rounded-md border border-gray-800 bg-[#ECEAE6] px-8 font-semibold text-gray-900 shadow-sm hover:bg-[#E0DDD8]"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
          PRINT ID CARD
        </Button>
      </div>
    </div>
  );
}
