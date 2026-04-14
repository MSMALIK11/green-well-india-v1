"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Leaf,
  Lock,
  Mail,
  Smartphone,
  User,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function firstNameFrom(fullName: string) {
  const t = fullName.trim();
  if (!t) return "Member";
  return t.split(/\s+/)[0] ?? t;
}

type SuccessSnapshot = {
  firstName: string;
  referralId: string;
  password: string;
};

export type JoinRegisterFlowProps = {
  /** Modal: false when closed. Page: always true. */
  active: boolean;
  initialSponsor: string;
  defaultPosition: "left" | "right";
  /** After user taps OK on success (navigate / close modal). */
  onCompleted: () => void;
  /** Back to website, modal X, or abandon without registering. */
  onAbandon: () => void;
  /** Optional id prefix for inputs (avoid duplicate ids if nested). */
  idPrefix?: string;
  /** Notify parent when step changes (modal needs this for close handling). */
  onStepChange?: (step: "form" | "success") => void;
};

export function JoinRegisterFlow({
  active,
  initialSponsor,
  defaultPosition,
  onCompleted,
  onAbandon,
  idPrefix = "jr",
  onStepChange,
}: JoinRegisterFlowProps) {
  const setUser = useAuthStore((s) => s.setUser);
  const [sponsorReferralId, setSponsorReferralId] = useState(initialSponsor);
  const [sponsorName, setSponsorName] = useState("");
  const [position, setPosition] = useState<"left" | "right">(defaultPosition);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookupPending, setLookupPending] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [successSnapshot, setSuccessSnapshot] = useState<SuccessSnapshot | null>(
    null,
  );

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  useEffect(() => {
    if (!active) return;
    setSponsorReferralId(initialSponsor);
    setPosition(defaultPosition);
    setAgree(false);
    setPassword("");
    setConfirmPassword("");
    setStep("form");
    setSuccessSnapshot(null);
  }, [active, initialSponsor, defaultPosition]);

  useEffect(() => {
    if (!active || !sponsorReferralId.trim()) {
      setSponsorName("");
      setLookupPending(false);
      return;
    }
    const id = sponsorReferralId.trim().toUpperCase();
    let cancelled = false;
    const t = window.setTimeout(() => {
      setLookupPending(true);
      apiFetch<{ success: boolean; name: string }>(
        `/api/v1/auth/sponsor/${encodeURIComponent(id)}`,
      )
        .then((r) => {
          if (!cancelled) setSponsorName(r.name);
        })
        .catch(() => {
          if (!cancelled) setSponsorName("");
        })
        .finally(() => {
          if (!cancelled) setLookupPending(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [active, sponsorReferralId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (!agree) {
      toast.error("Please accept the terms and conditions.");
      return;
    }
    if (!sponsorName) {
      toast.error("Enter a valid sponsor ID.");
      return;
    }
    setLoading(true);
    try {
      const plainPassword = password;
      const sponsorPayload = sponsorReferralId.trim().toUpperCase();
      const res = await apiFetch<{
        success: boolean;
        user: {
          id: string;
          name: string;
          email: string;
          referralId: string;
          rank: string;
          role: "user" | "admin";
        };
      }>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password: plainPassword,
          sponsorReferralId: sponsorPayload,
          binaryPlacement: position,
        }),
      });
      setUser(res.user);
      setSuccessSnapshot({
        firstName: firstNameFrom(res.user.name),
        referralId: res.user.referralId,
        password: plainPassword,
      });
      setStep("success");
      setPassword("");
      setConfirmPassword("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleSuccessOk() {
    setStep("form");
    setSuccessSnapshot(null);
    onCompleted();
  }

  const inputIconClass =
    "pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#2E7D32]/85";

  const posName = `${idPrefix}-position`;

  if (step === "success" && successSnapshot) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/40 shadow-2xl">
        <div
          className="absolute inset-0 bg-[length:120%_120%] bg-center"
          style={{
            backgroundImage: `radial-gradient(ellipse 90% 70% at 50% 100%, rgba(255,248,220,0.55) 0%, transparent 55%), linear-gradient(165deg, rgba(27,94,32,0.5) 0%, rgba(56,142,60,0.35) 35%, rgba(129,199,132,0.3) 65%, rgba(200,230,201,0.45) 100%)`,
          }}
          aria-hidden
        />
        <div className="absolute inset-0 backdrop-blur-[2px]" aria-hidden />
        <div className="relative bg-white/80 px-6 py-8 sm:px-8 sm:py-10">
          <Leaf
            className="pointer-events-none absolute bottom-4 left-4 h-24 w-24 -rotate-12 text-[#2E7D32]/15"
            strokeWidth={1}
            aria-hidden
          />
          <h2 className="text-center font-serif text-lg font-bold leading-snug text-[#1B5E20] sm:text-xl">
            Green Well Pure Natural Nutrition
          </h2>
          <div className="mt-8 space-y-2 text-center text-[15px] font-bold leading-relaxed text-gray-900">
            <p>
              Dear {successSnapshot.firstName} Welcome to
              <br />
              Green Well Pure Natural Nutrition
            </p>
            <p className="pt-2">Your Registration Successful!</p>
          </div>
          <div className="mt-8 space-y-2 text-center text-sm font-semibold text-gray-800">
            <p>
              User ID :{" "}
              <span className="font-mono text-base text-[#1B5E20]">
                {successSnapshot.referralId}
              </span>
            </p>
            <p>
              Password:{" "}
              <span className="font-mono text-base tracking-wide">
                {successSnapshot.password}
              </span>
            </p>
          </div>
          <p className="mx-auto mt-5 max-w-xs text-center text-xs text-gray-600">
            Save your User ID — it is your referral code and what you use to log
            in.
          </p>
          <Button
            type="button"
            onClick={handleSuccessOk}
            className="mx-auto mt-8 flex h-12 w-full max-w-xs rounded-xl bg-[#2E7D32] text-base font-bold text-white shadow-md hover:bg-[#256628]"
          >
            OK
          </Button>
        </div>
      </div>
    );
  }

  const labelClass = "text-[13px] font-semibold text-gray-800";
  const fieldInputClass =
    "h-11 rounded-lg border border-gray-300 bg-white pl-9 text-sm shadow-sm placeholder:text-gray-400 focus-visible:border-[#2E7D32] focus-visible:ring-[#2E7D32]/25";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div
        className="relative rounded-b-[2.25rem] bg-[#2E7D32] px-5 pb-11 pt-7 text-center shadow-[inset_0_-1px_0_rgb(0,0,0,0.06)]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.12) 1px, transparent 0)",
          backgroundSize: "14px 14px",
        }}
      >
        <h2 className="font-display text-[1.05rem] font-normal leading-snug tracking-wide text-white sm:text-xl">
          Green Well Pure Natural Nutrition
        </h2>
      </div>
      <div className="relative -mt-9 flex justify-center px-5">
        <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[5px] border-white bg-white shadow-[0_4px_14px_rgb(0,0,0,0.12)]">
          <div className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full bg-white p-0.5">
            <BrandLogo size={44} className="h-full w-full" />
          </div>
        </div>
      </div>

      <div className="px-5 pb-7 pt-1 sm:px-6">
        <h3 className="text-center font-display text-[1.65rem] font-semibold leading-tight text-[#1B5E20]">
          Create Account
        </h3>
        <p className="mt-1.5 text-center text-[13px] text-gray-600">
          Join the Green Well Family today!
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3.5">
          <div className="grid grid-cols-2 gap-3 gap-y-3.5">
            <div className="min-w-0 space-y-1">
              <Label htmlFor={`${idPrefix}-sponsor`} className={labelClass}>
                Sponsor Code
              </Label>
              <div className="relative">
                <UserPlus className={inputIconClass} />
                <Input
                  id={`${idPrefix}-sponsor`}
                  className={fieldInputClass}
                  placeholder="Enter Sponsor ID"
                  value={sponsorReferralId}
                  onChange={(e) =>
                    setSponsorReferralId(e.target.value.toUpperCase())
                  }
                  required
                  aria-required
                />
              </div>
            </div>
            <div className="min-w-0 space-y-1">
              <Label htmlFor={`${idPrefix}-sponsor-name`} className={labelClass}>
                Sponsor Name
              </Label>
              <div className="relative">
                <UserCheck className={inputIconClass} />
                <Input
                  id={`${idPrefix}-sponsor-name`}
                  readOnly
                  className={cn(
                    fieldInputClass,
                    "cursor-default bg-gray-100 text-gray-700",
                  )}
                  placeholder={
                    lookupPending ? "Looking up…" : "Sponsor Name"
                  }
                  value={sponsorName}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 gap-y-3.5 sm:items-end">
            <div className="min-w-0 space-y-1.5">
              <Label className={labelClass}>Select Position</Label>
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                {(["left", "right"] as const).map((p) => (
                  <label
                    key={p}
                    className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-gray-800"
                  >
                    <input
                      type="radio"
                      name={posName}
                      checked={position === p}
                      onChange={() => setPosition(p)}
                      className="h-4 w-4 shrink-0 accent-blue-600"
                    />
                    <span className="capitalize">{p}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="min-w-0 space-y-1">
              <Label htmlFor={`${idPrefix}-name`} className={labelClass}>
                Full Name
              </Label>
              <div className="relative">
                <User className={inputIconClass} />
                <Input
                  id={`${idPrefix}-name`}
                  className={fieldInputClass}
                  placeholder="Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 gap-y-3.5">
            <div className="min-w-0 space-y-1">
              <Label htmlFor={`${idPrefix}-phone`} className={labelClass}>
                Mobile Number
              </Label>
              <div className="relative">
                <Smartphone className={inputIconClass} />
                <Input
                  id={`${idPrefix}-phone`}
                  className={fieldInputClass}
                  placeholder="10 Digit Mobile No"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div className="min-w-0 space-y-1">
              <Label htmlFor={`${idPrefix}-email`} className={labelClass}>
                Email ID
              </Label>
              <div className="relative">
                <Mail className={inputIconClass} />
                <Input
                  id={`${idPrefix}-email`}
                  type="email"
                  className={fieldInputClass}
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 gap-y-3.5">
            <div className="min-w-0 space-y-1">
              <Label htmlFor={`${idPrefix}-pass`} className={labelClass}>
                Password
              </Label>
              <div className="relative">
                <Lock className={inputIconClass} />
                <Input
                  id={`${idPrefix}-pass`}
                  type="password"
                  className={fieldInputClass}
                  placeholder="Create Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div className="min-w-0 space-y-1">
              <Label htmlFor={`${idPrefix}-pass2`} className={labelClass}>
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className={inputIconClass} />
                <Input
                  id={`${idPrefix}-pass2`}
                  type="password"
                  className={fieldInputClass}
                  placeholder="Repeat Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-[13px] leading-snug text-gray-600">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#2E7D32]"
            />
            <span>
              I Agree With{" "}
              <Link
                href="/contact"
                className="font-semibold text-[#2E7D32] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Terms and Conditions
              </Link>
            </span>
          </label>

          <Button
            type="submit"
            disabled={loading}
            className="mt-1 h-12 w-full rounded-xl bg-gradient-to-b from-[#5CB860] via-[#43A047] to-[#2E7D32] text-[15px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_4px_14px_rgb(46,125,50,0.35)] hover:from-[#4caf50] hover:via-[#3d9441] hover:to-[#256628]"
          >
            {loading ? "Please wait…" : "Register Now"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[13px] text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#2E7D32] hover:underline"
          >
            Log In
          </Link>
        </p>

        <div className="mt-5 flex justify-center gap-3">
          {[
            { bg: "bg-[#1877F2]", label: "Facebook" },
            {
              bg: "bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]",
              label: "Instagram",
            },
            { bg: "bg-[#25D366]", label: "WhatsApp" },
            { bg: "bg-[#FF0000]", label: "YouTube" },
          ].map((s) => (
            <a
              key={s.label}
              href="#"
              aria-label={s.label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md ring-1 ring-black/5",
                s.bg,
              )}
              onClick={(e) => e.preventDefault()}
            >
              {s.label.slice(0, 1)}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
