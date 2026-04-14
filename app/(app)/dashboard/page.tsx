"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Copy,
  CreditCard,
  Crown,
  Facebook,
  IdCard,
  Linkedin,
  Twitter,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { DashboardStatTile } from "@/components/dashboard/dashboard-stat-tile";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type Summary = {
  success: boolean;
  user: Record<string, unknown>;
  team: { totalCount: number };
  business: { totalPv: number };
  income: {
    total: number;
    level: number;
    lbd: number;
    reward: number;
  };
  wallets: {
    package: number;
    activation: number;
    shopping: number;
  };
};

function formatPackageLabel(key: string | null | undefined): string {
  if (!key) return "—";
  const map: Record<string, string> = {
    BASIC_4999: "Basic - 4999",
    STANDARD_9999: "Smart - 9999",
    PREMIUM_24999: "Prime - 24999",
  };
  return map[key] ?? String(key).replace(/_/g, " ");
}

function formatDate(iso: unknown): string {
  if (!iso || typeof iso !== "string") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiFetch<Summary>("/api/v1/dashboard/summary"),
    staleTime: 45_000,
  });

  const [progressMode, setProgressMode] = useState<"pt5" | "all">("pt5");
  const [copied, setCopied] = useState(false);

  const u = data?.user as
    | {
        name?: string;
        referralId?: string;
        rank?: string;
        packageKey?: string | null;
        activationStatus?: string;
        createdAt?: string;
      }
    | undefined;

  const referralUrl = useMemo(() => {
    if (typeof window === "undefined" || !u?.referralId) return "";
    const base = window.location.origin;
    return `${base}/register?sponsor=${encodeURIComponent(u.referralId)}`;
  }, [u?.referralId]);

  async function copyReferral() {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shareText = encodeURIComponent(
    `Join Green Well LLP — Pure Natural Nutrition`,
  );
  const shareUrl = encodeURIComponent(referralUrl || "");

  const active = u?.activationStatus === "active";
  const totalPv = data?.business.totalPv ?? 0;
  /** Placeholder progress % — wire to real PT5 metrics when API exists */
  const progressPct = 0;

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2E7D32]/10 p-0.5">
              <BrandLogo size={32} className="h-full w-full" />
            </div>
            <span className="text-sm font-semibold text-[#2E7D32]">
              Green Well LLP
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                active ? "bg-[#2E7D32]" : "bg-amber-500",
              )}
            />
            <span className="text-sm font-medium text-gray-700">
              {active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <dl className="grid max-w-xl gap-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-gray-900">{u?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
              <dt className="text-slate-500">Activation Date</dt>
              <dd className="font-medium text-gray-900">
                {formatDate(u?.createdAt)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
              <dt className="text-slate-500">Rank</dt>
              <dd className="font-semibold text-[#C78D2B]">
                {u?.rank ?? "Member"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
              <dt className="text-slate-500">Open Levels</dt>
              <dd className="font-medium text-gray-900">0</dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-slate-500">Package</dt>
              <dd className="font-semibold text-[#C78D2B]">
                {formatPackageLabel(u?.packageKey as string | undefined)}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            <a
              href="https://greenwellindia.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#2E7D32] underline-offset-2 hover:underline"
            >
              greenwellindia.in
            </a>
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-[#2E7D32] bg-white px-4 py-2.5 text-sm font-semibold text-[#2E7D32] transition hover:bg-[#2E7D32]/5"
            >
              <IdCard className="h-4 w-4" />
              View I-Card
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatTile
          label="Total income"
          value={`₹${(data?.income.total ?? 0).toFixed(2)}`}
        />
        <DashboardStatTile
          label="Level income"
          value={`₹${(data?.income.level ?? 0).toFixed(2)}`}
        />
        <DashboardStatTile
          label="LBD income"
          value={`₹${(data?.income.lbd ?? 0).toFixed(2)}`}
        />
        <DashboardStatTile
          label="Reward income"
          value={`₹${(data?.income.reward ?? 0).toFixed(2)}`}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatTile
          label="Total team"
          value={data?.team.totalCount ?? 0}
        />
        <DashboardStatTile
          label="Total team business"
          value={`${data?.business.totalPv ?? 0} PV`}
        />
        <DashboardStatTile
          label="Today team business"
          value="0 PV"
        />
        <DashboardStatTile
          label="Today PV business"
          value="0 PV"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <DashboardStatTile
          label="Package wallet"
          value={Math.round(data?.wallets.package ?? 0)}
        />
        <DashboardStatTile
          label="Activation wallet"
          value={Math.round(data?.wallets.activation ?? 0)}
        />
        <DashboardStatTile
          label="Shopping wallet"
          value={Math.round(data?.wallets.shopping ?? 0)}
        />
      </section>

      {/* Referral */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366] transition hover:bg-[#25D366]/25"
              aria-label="Share on WhatsApp"
            >
              <span className="text-lg font-bold">W</span>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2]/15 text-[#1877F2] transition hover:bg-[#1877F2]/25"
              aria-label="Share on Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900/10 text-gray-800 transition hover:bg-gray-900/15"
              aria-label="Share on X"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A66C2]/15 text-[#0A66C2] transition hover:bg-[#0A66C2]/25"
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
          <div className="min-w-0 flex-1 px-2">
            <div className="truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600 sm:text-sm">
              {referralUrl || "Loading link…"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => copyReferral()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#2E7D32] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1B5E20]"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </section>

      {/* Business progress */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Business Progress
          </h2>
          <select
            value={progressMode}
            onChange={(e) =>
              setProgressMode(e.target.value as "pt5" | "all")
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
          >
            <option value="pt5">PT5 Business</option>
            <option value="all">All Team Business</option>
          </select>
        </div>
        <div className="space-y-5">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-sky-700">All Team Business</span>
              <span className="tabular-nums text-gray-600">{totalPv}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-sky-400 transition-all"
                style={{
                  width: `${Math.min(100, totalPv > 0 ? 8 + progressPct : 0)}%`,
                }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-violet-700">PT5 Business</span>
              <span className="tabular-nums text-gray-600">0</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-violet-500 transition-all"
                style={{ width: `${progressMode === "pt5" ? 0 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            {
              href: "/dashboard/team",
              label: "Team Network",
              icon: Users,
            },
            {
              href: "/dashboard/profile#id-card",
              label: "My Rank",
              icon: Crown,
            },
            {
              href: "/dashboard/wallet",
              label: "Transactions",
              icon: CreditCard,
            },
            {
              href: "/dashboard/profile",
              label: "ID card",
              icon: IdCard,
            },
          ] as const
        ).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:border-[#2E7D32]/40 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2E7D32]/10 text-[#2E7D32]">
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-sm font-semibold text-gray-800">{label}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
