"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { JoinRegisterFlow } from "@/components/auth/join-register-flow";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsorReferralId: string;
  defaultPosition: "left" | "right";
  onRegistered?: () => void;
};

export function JoinRegisterModal({
  open,
  onOpenChange,
  sponsorReferralId: initialSponsor,
  defaultPosition,
  onRegistered,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "success">("form");

  function completeAfterSuccess() {
    onRegistered?.();
    onOpenChange(false);
    router.push("/dashboard");
    router.refresh();
  }

  function handleDialogOpenChange(next: boolean) {
    if (!next && step === "success") {
      completeAfterSuccess();
      return;
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[95vh] overflow-y-auto p-4 sm:p-5",
          step === "success"
            ? "max-w-[min(100%,440px)] sm:max-w-[440px]"
            : "max-w-[min(100%,480px)] sm:max-w-[480px]",
        )}
      >
        <JoinRegisterFlow
          active={open}
          initialSponsor={initialSponsor}
          defaultPosition={defaultPosition}
          onStepChange={setStep}
          onCompleted={completeAfterSuccess}
          onAbandon={() => onOpenChange(false)}
          idPrefix="jr"
        />
      </DialogContent>
    </Dialog>
  );
}
