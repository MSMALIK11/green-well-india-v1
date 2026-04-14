"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Leaf, Lock, User } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

/**
 * Leaf rain: animation duration in seconds (one full fall).
 * Higher = slower. Each leaf adds a small step so they don’t move in sync.
 */
const LEAF_RAIN_SECONDS_MIN = 20;
const LEAF_RAIN_SECONDS_STEP = 2;

const leaves = [
  {
    top: "8%",
    left: "5%",
    size: 28,
    rotate: -15,
    opacity: 0.35,
    color: "#1B5E20",
  },
  {
    top: "22%",
    left: "88%",
    size: 36,
    rotate: 25,
    opacity: 0.28,
    color: "#2E7D32",
  },
  {
    top: "55%",
    left: "3%",
    size: 22,
    rotate: 40,
    opacity: 0.3,
    color: "#388E3C",
  },
  {
    top: "70%",
    left: "92%",
    size: 32,
    rotate: -30,
    opacity: 0.25,
    color: "#43A047",
  },
  {
    top: "40%",
    left: "12%",
    size: 18,
    rotate: 12,
    opacity: 0.22,
    color: "#33691E",
  },
  {
    top: "85%",
    left: "18%",
    size: 26,
    rotate: -20,
    opacity: 0.28,
    color: "#558B2F",
  },
  {
    top: "12%",
    left: "72%",
    size: 20,
    rotate: 55,
    opacity: 0.2,
    color: "#66BB6A",
  },
  {
    top: "18%",
    left: "28%",
    size: 24,
    rotate: -8,
    opacity: 0.26,
    color: "#4CAF50",
  },
  {
    top: "33%",
    left: "48%",
    size: 20,
    rotate: 18,
    opacity: 0.24,
    color: "#689F38",
  },
  {
    top: "48%",
    left: "62%",
    size: 30,
    rotate: -22,
    opacity: 0.27,
    color: "#7CB342",
  },
  {
    top: "62%",
    left: "38%",
    size: 22,
    rotate: 33,
    opacity: 0.23,
    color: "#8BC34A",
  },
  {
    top: "28%",
    left: "55%",
    size: 19,
    rotate: -40,
    opacity: 0.21,
    color: "#0D2818",
  },
  {
    top: "76%",
    left: "48%",
    size: 27,
    rotate: 15,
    opacity: 0.29,
    color: "#14532D",
  },
  {
    top: "15%",
    left: "42%",
    size: 21,
    rotate: -52,
    opacity: 0.22,
    color: "#1E6F3E",
  },
  {
    top: "50%",
    left: "78%",
    size: 25,
    rotate: 8,
    opacity: 0.25,
    color: "#40916C",
  },
  {
    top: "35%",
    left: "8%",
    size: 23,
    rotate: -28,
    opacity: 0.26,
    color: "#2D6A4F",
  },
  {
    top: "68%",
    left: "58%",
    size: 17,
    rotate: 42,
    opacity: 0.2,
    color: "#52B788",
  },
  {
    top: "44%",
    left: "25%",
    size: 26,
    rotate: -35,
    opacity: 0.24,
    color: "#186A3B",
  },
  {
    top: "58%",
    left: "82%",
    size: 21,
    rotate: 28,
    opacity: 0.23,
    color: "#239B56",
  },
];

function FloatingLeaves() {
  return (
    <div
      className="login-leaf-rain-layer pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {leaves.map((l, i) => {
        const driftPx = -42 + (i % 6) * 16;
        const duration =
          LEAF_RAIN_SECONDS_MIN + (i % 5) * LEAF_RAIN_SECONDS_STEP;
        const delay = -((i * 1.55) % 18);
        return (
          <span
            key={i}
            className="login-leaf-rain-item absolute top-0 flex will-change-transform items-center justify-center"
            style={
              {
                left: l.left,
                color: l.color,
                ["--static-top"]: l.top,
                ["--static-left"]: l.left,
                ["--leaf-base-rot"]: `${l.rotate}deg`,
                ["--leaf-dx"]: `${driftPx}px`,
                ["--leaf-op"]: l.opacity,
                animation: `login-leaf-rain ${duration}s linear ${delay}s infinite`,
              } as React.CSSProperties
            }
          >
            <Leaf size={l.size} fill="currentColor" stroke="none" />
          </span>
        );
      })}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
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
          activationStatus: string;
          kycStatus: string;
        };
      }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(res.user);
      router.push(search?.get("next") || "/dashboard");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] font-sans">
      <FloatingLeaves />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 md:px-8">
        <div
          className={cn(
            "flex w-full max-w-[920px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)]",
            "md:flex-row md:min-h-[520px]",
          )}
        >
          {/* Brand panel */}
          <div
            className="relative flex flex-col items-center justify-center px-10 py-14 text-center md:w-1/2 md:py-12"
            style={{
              backgroundColor: "#1B5E20",
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 11px,
                rgba(255,255,255,0.06) 11px,
                rgba(255,255,255,0.06) 22px
              )`,
            }}
          >
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/30">
              <Leaf className="h-10 w-10 text-white" fill="currentColor" stroke="none" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-wide text-white md:text-3xl">
              GREEN WELL LLP
            </h1>
            <p className="mt-3 max-w-xs font-sans text-sm font-medium text-white/90">
              Pure Natural Nutrition
            </p>
          </div>

          {/* Form panel */}
          <div className="flex flex-1 flex-col justify-center bg-white px-8 py-12 md:w-1/2 md:px-12 md:py-14">
            <div className="mb-6 flex justify-center">
              <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full border border-[#E8F5E9] bg-white p-2 shadow-sm ring-1 ring-[#2E7D32]/10">
                <BrandLogo size={56} className="h-full w-full" priority />
              </div>
            </div>
            <h2 className="text-center font-display text-3xl font-bold text-[#1B5E20] md:text-[2rem]">
              Welcome Back!
            </h2>
            <p className="mt-2 text-center text-sm text-[#6B7280]">
              Please sign in to your account
            </p>
            <p className="mt-1 text-center text-xs text-[#9CA3AF]">
              Use your registered email as User ID (e.g. seed: user@mlm-saas.local)
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              {err ? (
                <p
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {err}
                </p>
              ) : null}

              <div>
                <label className="sr-only" htmlFor="userId">
                  User ID
                </label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]"
                    aria-hidden
                  />
                  <input
                    id="userId"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="User ID"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-white pl-11 pr-4 text-sm text-gray-800 placeholder:text-[#9CA3AF] focus:border-[#2E7D32] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/25"
                  />
                </div>
              </div>

              <div>
                <label className="sr-only" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2E7D32]"
                    aria-hidden
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-white pl-11 pr-12 text-sm text-gray-800 placeholder:text-[#9CA3AF] focus:border-[#2E7D32] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#9CA3AF] hover:bg-gray-100 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2E7D32] to-[#66BB6A] text-sm font-bold uppercase tracking-wider text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
              >
                {loading ? "PLEASE WAIT…" : "LOG IN"}
              </button>
            </form>

            <div className="mt-8 flex items-center justify-between text-sm font-medium">
              <Link
                href="/forgot-password"
                className="text-[#2E7D32] transition hover:text-[#1B5E20] hover:underline"
              >
                Forgot Password?
              </Link>
              <Link
                href="/register"
                className="text-[#2E7D32] transition hover:text-[#1B5E20] hover:underline"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
