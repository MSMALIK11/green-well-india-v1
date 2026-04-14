"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Product" },
  { href: "/blog", label: "Blog" },
  { href: "/documents", label: "Document" },
  { href: "/contact", label: "Contact Us" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#E8F5E9] bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-inner ring-2 ring-[#2E7D32]/15">
            <BrandLogo size={36} className="h-full w-full" />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="block truncate font-display text-lg font-bold text-[#2E7D32]">
              Green Well LLP
            </span>
            <span className="block truncate text-xs text-gray-600">
              Pure Natural Nutrition
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-[#E8F5E9] hover:text-[#1B5E20]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Button variant="ghost" className="text-[#2E7D32]" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button
            className="bg-[#2E7D32] hover:bg-[#256628]"
            asChild
          >
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-[#2E7D32] lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-[#E8F5E9] bg-white lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-[#E8F5E9]"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-[#E8F5E9] pt-3">
            <Button variant="outline" className="w-full border-[#2E7D32] text-[#2E7D32]" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button className="w-full bg-[#2E7D32] hover:bg-[#256628]" asChild>
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
