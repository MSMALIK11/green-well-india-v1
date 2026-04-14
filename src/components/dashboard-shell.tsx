"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Home,
  LogOut,
  MoreHorizontal,
  Network,
  Package,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const mainNav: {
  href: string;
  label: string;
  icon: typeof Home;
  match: (p: string) => boolean;
}[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/dashboard/team",
    label: "Network",
    icon: Network,
    match: (p) => p.startsWith("/dashboard/team"),
  },
  {
    href: "/dashboard/products",
    label: "Products",
    icon: Package,
    match: (p) => p.startsWith("/dashboard/products"),
  },
  {
    href: "/dashboard/income",
    label: "Income",
    icon: TrendingUp,
    match: (p) => p.startsWith("/dashboard/income"),
  },
];

/** Mobile bottom bar (6 cols): Home, Network, Store, Income, Profile, Log out */
const bottomNav: {
  key: string;
  href?: string;
  label: string;
  icon: typeof Home;
  match: (p: string) => boolean;
  action?: "logout";
}[] = [
  {
    key: "home",
    href: "/dashboard",
    label: "Home",
    icon: Home,
    match: (p) => p === "/dashboard",
  },
  {
    key: "network",
    href: "/dashboard/team",
    label: "Network",
    icon: Network,
    match: (p) => p.startsWith("/dashboard/team"),
  },
  {
    key: "store",
    href: "/dashboard/products",
    label: "Store",
    icon: Package,
    match: (p) => p.startsWith("/dashboard/products"),
  },
  {
    key: "income",
    href: "/dashboard/income",
    label: "Income",
    icon: Wallet,
    match: (p) => p.startsWith("/dashboard/income"),
  },
  {
    key: "profile",
    href: "/dashboard/profile",
    label: "Profile",
    icon: UserRound,
    match: (p) => p.startsWith("/dashboard/profile"),
  },
  {
    key: "logout",
    label: "Log Out",
    icon: LogOut,
    match: () => false,
    action: "logout",
  },
];

const moreLinks: { href: string; label: string }[] = [
  { href: "/dashboard/team?tab=directs", label: "My directs" },
  { href: "/dashboard/team?tab=levels", label: "Levels" },
  { href: "/dashboard/wallet", label: "Wallet reports" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/profile", label: "Member ID" },
  { href: "/admin", label: "Admin" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const emptySearch = useMemo(() => new URLSearchParams(), []);
  const searchParams = useSearchParams() ?? emptySearch;
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRefMobile = useRef<HTMLDivElement>(null);
  const moreRefDesktop = useRef<HTMLDivElement>(null);

  const { data, isError, isPending } = useQuery({
    queryKey: ["me"],
    queryFn: () =>
      apiFetch<{ success: boolean; user: Record<string, unknown> }>(
        "/api/v1/auth/me",
      ),
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (!data?.user) return;
    const u = data.user as {
      _id: string;
      name: string;
      email: string;
      referralId: string;
      rank?: string;
      role: "user" | "admin";
    };
    setUser({
      id: String(u._id),
      name: u.name,
      email: u.email,
      referralId: u.referralId,
      rank: u.rank,
      role: u.role,
    });
  }, [data, setUser]);

  useEffect(() => {
    function close(e: MouseEvent) {
      const t = e.target as Node;
      const inM = moreRefMobile.current?.contains(t);
      const inD = moreRefDesktop.current?.contains(t);
      if (!inM && !inD) setMoreOpen(false);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  async function logout() {
    await apiFetch("/api/v1/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  if (!isPending && isError) {
    router.replace("/login");
    return null;
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] text-gray-500">
        Loading session…
      </div>
    );
  }

  const path = pathname ?? "";
  const moreActive = moreLinks.some((l) => {
    if (!l.href.includes("?")) {
      return path === l.href || path.startsWith(`${l.href}/`);
    }
    const [pathPart, query] = l.href.split("?");
    if (path !== pathPart) return false;
    const want = new URLSearchParams(query);
    for (const [k, v] of want.entries()) {
      if (searchParams.get(k) !== v) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:flex-nowrap">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none md:gap-0">
            <Link
              href="/dashboard"
              className="flex min-w-0 shrink items-center gap-3"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-inner ring-2 ring-[#2E7D32]/15">
                <BrandLogo size={36} className="h-full w-full" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold leading-tight text-[#2E7D32]">
                  Green Well LLP
                </div>
                <div className="truncate text-xs text-gray-700">
                  Pure Natural Nutrition
                </div>
              </div>
            </Link>
            <div className="relative ml-auto shrink-0 md:hidden" ref={moreRefMobile}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMoreOpen((o) => !o);
                }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm",
                  moreOpen && "border-[#2E7D32]/40 bg-[#E8F5E9] text-[#2E7D32]",
                )}
                aria-label="More menu"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {moreOpen ? (
                <div className="absolute right-0 top-full z-[60] mt-1 max-h-[70vh] w-56 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  {moreLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMoreOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <nav className="order-3 hidden w-full flex-1 items-center justify-center gap-1 overflow-x-auto py-1 md:flex lg:order-none lg:w-auto lg:py-0">
            {mainNav.map(({ href, label, icon: Icon, match }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  match(path)
                    ? "bg-[#E8F5E9] text-[#2E7D32] shadow-sm"
                    : "text-gray-600 hover:bg-gray-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}

            <div className="relative shrink-0" ref={moreRefDesktop}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMoreOpen((o) => !o);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  moreActive || moreOpen
                    ? "bg-gray-100 text-[#2E7D32]"
                    : "text-gray-600 hover:bg-gray-100",
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
                More
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    moreOpen && "rotate-180",
                  )}
                />
              </button>
              {moreOpen ? (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  {moreLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMoreOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          <button
            type="button"
            onClick={() => logout()}
            className="hidden shrink-0 items-center gap-2 rounded-lg border-2 border-red-500 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 md:flex"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 print:max-w-none print:px-4 print:pb-4 md:pb-12">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/80 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.06)] print:hidden md:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-6 px-0.5 pt-1">
          {bottomNav.map((item) => {
            const active = item.action !== "logout" && item.match(path);
            const isLogout = item.action === "logout";
            const base =
              "flex min-h-[3.25rem] min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg py-2 transition-colors [-webkit-tap-highlight-color:transparent]";
            const inactive = isLogout
              ? "text-red-600"
              : "text-gray-500";
            const activeCls = !isLogout && active ? "text-[#2E7D32]" : inactive;

            if (isLogout) {
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => logout()}
                  className={cn(base, activeCls, "hover:bg-red-50/80")}
                >
                  <item.icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                  <span className="max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.key}
                href={item.href!}
                className={cn(
                  base,
                  activeCls,
                  !active && "hover:bg-gray-50",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active && "text-[#2E7D32]",
                  )}
                  strokeWidth={active ? 2.25 : 2}
                />
                <span className="max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
