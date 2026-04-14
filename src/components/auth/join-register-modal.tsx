"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Smartphone,
  User,
  UserPlus,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSponsorReferralId(initialSponsor);
    setPosition(defaultPosition);
    setErr(null);
    setAgree(false);
    setPassword("");
    setConfirmPassword("");
  }, [open, initialSponsor, defaultPosition]);

  useEffect(() => {
    if (!open || !sponsorReferralId.trim()) {
      setSponsorName("");
      return;
    }
    const id = sponsorReferralId.trim().toUpperCase();
    let cancelled = false;
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
    return () => {
      cancelled = true;
    };
  }, [open, sponsorReferralId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (!agree) {
      setErr("Please accept the terms and conditions.");
      return;
    }
    if (!sponsorName) {
      setErr("Enter a valid sponsor ID.");
      return;
    }
    setLoading(true);
    try {
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
          password,
          sponsorReferralId: sponsorReferralId.trim().toUpperCase(),
          binaryPlacement: position,
        }),
      });
      setUser(res.user);
      onOpenChange(false);
      onRegistered?.();
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const inputIconClass =
    "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-[min(100%,480px)] overflow-y-auto sm:max-w-[480px]">
        <div
          className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.06) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        >
          <div className="relative rounded-b-[2rem] bg-[#2E7D32] px-6 pb-10 pt-6 text-center shadow-md">
            <h2 className="font-display text-lg font-semibold leading-snug text-white sm:text-xl">
              Green Well Pure Natural Nutrition
            </h2>
          </div>
          <div className="relative -mt-8 flex justify-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white p-1">
                <BrandLogo size={40} className="h-full w-full" />
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2">
            <h3 className="text-center font-display text-2xl font-semibold text-[#2E7D32]">
              Create Account
            </h3>
            <p className="mt-1 text-center text-sm text-gray-600">
              Join the Green Well family today!
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {err ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {err}
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="jr-sponsor" className="text-gray-700">
                    Sponsor Code
                  </Label>
                  <div className="relative">
                    <UserPlus className={inputIconClass} />
                    <Input
                      id="jr-sponsor"
                      className="border-gray-300 pl-9"
                      placeholder="Enter Sponsor ID"
                      value={sponsorReferralId}
                      onChange={(e) =>
                        setSponsorReferralId(e.target.value.toUpperCase())
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jr-sponsor-name" className="text-gray-700">
                    Sponsor Name
                  </Label>
                  <div className="relative">
                    <User className={inputIconClass} />
                    <Input
                      id="jr-sponsor-name"
                      readOnly
                      className="border-gray-200 bg-gray-50 pl-9 text-gray-700"
                      placeholder={
                        lookupPending ? "Looking up…" : "Sponsor Name"
                      }
                      value={sponsorName}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
                <div className="space-y-2">
                  <Label className="text-gray-700">Select Position</Label>
                  <div className="flex gap-4 pt-1">
                    {(["left", "right"] as const).map((p) => (
                      <label
                        key={p}
                        className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <input
                          type="radio"
                          name="jr-position"
                          checked={position === p}
                          onChange={() => setPosition(p)}
                          className="h-4 w-4 accent-[#2E7D32]"
                        />
                        <span className="capitalize">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jr-name" className="text-gray-700">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className={inputIconClass} />
                    <Input
                      id="jr-name"
                      className="border-gray-300 pl-9"
                      placeholder="Your Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="jr-phone" className="text-gray-700">
                    Mobile Number
                  </Label>
                  <div className="relative">
                    <Smartphone className={inputIconClass} />
                    <Input
                      id="jr-phone"
                      className="border-gray-300 pl-9"
                      placeholder="10 Digit Mobile No"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jr-email" className="text-gray-700">
                    Email ID
                  </Label>
                  <div className="relative">
                    <Mail className={inputIconClass} />
                    <Input
                      id="jr-email"
                      type="email"
                      className="border-gray-300 pl-9"
                      placeholder="example@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="jr-pass" className="text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className={inputIconClass} />
                    <Input
                      id="jr-pass"
                      type="password"
                      className="border-gray-300 pl-9"
                      placeholder="Create Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jr-pass2" className="text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className={inputIconClass} />
                    <Input
                      id="jr-pass2"
                      type="password"
                      className="border-gray-300 pl-9"
                      placeholder="Repeat Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#2E7D32]"
                />
                <span>
                  I Agree With{" "}
                  <Link
                    href="/contact"
                    className="font-medium text-[#2E7D32] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms and Conditions
                  </Link>
                </span>
              </label>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-gradient-to-b from-[#43A047] to-[#2E7D32] text-base font-bold uppercase tracking-wide text-white shadow-md hover:from-[#3d9441] hover:to-[#256628]"
              >
                {loading ? "Please wait…" : "Register Now"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#2E7D32] hover:underline"
                onClick={() => onOpenChange(false)}
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
                    "flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm",
                    s.bg,
                  )}
                  onClick={(e) => e.preventDefault()}
                >
                  {s.label.slice(0, 1)}
                </a>
              ))}
            </div>

            <div className="mt-5 flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg border-gray-300 text-gray-700"
                onClick={() => onOpenChange(false)}
              >
                Back To Website
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
