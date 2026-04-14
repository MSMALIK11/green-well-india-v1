"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/commissions", label: "Commissions" },
  { href: "/admin/marketing", label: "Marketing" },
  { href: "/admin/kyc", label: "KYC" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isPending, isError } = useQuery({
    queryKey: ["me"],
    queryFn: () =>
      apiFetch<{ success: boolean; user: { role: string } }>(
        "/api/v1/auth/me",
      ),
    retry: false,
  });

  useEffect(() => {
    if (!isPending && (isError || data?.user.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [isPending, isError, data, router]);

  if (isPending || isError || data?.user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Checking admin access…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-52 border-r border-border bg-card/40 p-4">
        <div className="mb-4 font-semibold text-primary">Admin</div>
        <nav className="flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm",
                pathname === l.href
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Button variant="outline" className="mt-6 w-full" asChild>
          <Link href="/dashboard">Exit</Link>
        </Button>
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
