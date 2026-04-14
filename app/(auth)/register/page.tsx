"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { sponsorReferralFromSearchParams } from "@/lib/sponsor-from-url";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    sponsorReferralId: "",
  });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const id = sponsorReferralFromSearchParams(searchParams);
    if (!id) return;
    setForm((f) => ({ ...f, sponsorReferralId: id }));
  }, [searchParams]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
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
        body: JSON.stringify(form),
      });
      setUser(res.user);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Referral links (e.g.{" "}
            <code className="text-xs">/register?sponsor=ROOT000001</code>) fill
            sponsor ID automatically. First signup on an empty database is the
            founder (no sponsor). Otherwise enter your sponsor&apos;s ID or use
            their link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            {err ? (
              <p className="text-sm text-red-400" role="alert">
                {err}
              </p>
            ) : null}
            {(
              [
                ["name", "Full name"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["password", "Password"],
                [
                  "sponsorReferralId",
                  "Sponsor referral ID (from link or manual; optional only if DB empty)",
                ],
              ] as const
            ).map(([k, label]) => (
              <div key={k} className="space-y-1">
                <Label htmlFor={k}>{label}</Label>
                <Input
                  id={k}
                  type={k === "password" ? "password" : "text"}
                  value={form[k]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [k]: e.target.value }))
                  }
                  required={k !== "sponsorReferralId"}
                />
              </div>
            ))}
            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? "Creating…" : "Register"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
