"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { RegisterSolidLeafRain } from "@/components/auth/register-solid-leaf-rain";
import { JoinRegisterFlow } from "@/components/auth/join-register-flow";
import {
  REGISTER_PAGE_BG,
  registerPageBackgroundImage,
} from "@/constants/colors";
import { sponsorReferralFromSearchParams } from "@/lib/sponsor-from-url";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sponsorFromUrl = sponsorReferralFromSearchParams(searchParams);
  const slotParam = searchParams?.get("slot")?.toLowerCase();
  const defaultPosition = slotParam === "right" ? "right" : "left";

  return (
    <div
      className="relative z-0 min-h-screen overflow-x-hidden px-3 py-8 sm:px-4 sm:py-10"
      style={{
        backgroundColor: REGISTER_PAGE_BG,
        backgroundImage: registerPageBackgroundImage(),
        backgroundSize: "30px 30px",
      }}
    >
      <RegisterSolidLeafRain />

      <div className="relative z-10 mx-auto w-full max-w-[min(100%,420px)]">
        <JoinRegisterFlow
          active
          initialSponsor={sponsorFromUrl}
          defaultPosition={defaultPosition}
          idPrefix="reg"
          onCompleted={() => {
            router.push("/dashboard");
            router.refresh();
          }}
          onAbandon={() => router.push("/")}
        />
      </div>
    </div>
  );
}
