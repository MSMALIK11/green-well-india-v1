"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { resolveProductDetailImage } from "@/lib/product-detail-image";

type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  packageKey: string | null;
  stock: number;
  imageUrl?: string;
};

/** Matches reference UI: dark forest green for headings & primary CTA */
const ink = "#2D3E2E";
const tan = "#A6907E";
const tanMuted = "#9A8B7A";
const pageBg = "#F5F3EF";

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function ProductDetailPage() {
  const params = useParams();
  const id =
    params && typeof params.id === "string" ? params.id : "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["product-public", id],
    queryFn: () =>
      apiFetch<{ success: boolean; product: Product }>(
        `/api/v1/products/public/${id}`,
      ),
    enabled: Boolean(id),
  });

  const p = data?.product;
  const imageSrc = p
    ? resolveProductDetailImage({
        name: p.name,
        slug: p.slug,
        imageUrl: p.imageUrl,
      })
    : null;

  if (isLoading) {
    return (
      <div
        className="min-h-[60vh] px-5 py-12 md:px-8"
        style={{ backgroundColor: pageBg }}
      >
        <div className="mx-auto max-w-5xl text-sm" style={{ color: tanMuted }}>
          Loading…
        </div>
      </div>
    );
  }

  if (error || !p) {
    return (
      <div
        className="min-h-[60vh] px-5 py-12 md:px-8"
        style={{ backgroundColor: pageBg }}
      >
        <div className="mx-auto max-w-5xl space-y-6">
          <p className="text-destructive">
            {(error as Error)?.message ?? "Product not found."}
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-normal transition hover:opacity-80"
            style={{ color: tan }}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-5 py-10 md:px-10 md:py-14 lg:py-16"
      style={{ backgroundColor: pageBg }}
    >
      <div className="mx-auto max-w-5xl">
        {/* Back — top left, light brown, minimal */}
        <Link
          href="/products"
          className="mb-12 inline-flex items-center gap-2.5 text-sm font-normal tracking-wide transition hover:opacity-75 md:mb-14"
          style={{ color: tan }}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Back to Products
        </Link>

        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          {/* Left: product photo — white card, soft shadow, generous padding */}
          <div
            className="rounded-[1.25rem] bg-white p-8 shadow-[0_4px_24px_rgba(45,62,46,0.08)] md:p-10 lg:p-12"
            style={{ border: "1px solid rgba(45,62,46,0.06)" }}
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white">
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt={p.name}
                  className="h-full w-full object-contain object-center p-2 md:p-4"
                />
              ) : (
                <div
                  className="flex h-full items-center justify-center text-sm"
                  style={{ color: tanMuted, backgroundColor: "#F0EDE8" }}
                >
                  No image
                </div>
              )}
            </div>
          </div>

          {/* Right: copy block — airy spacing, serif title, sans body */}
          <div className="flex flex-col space-y-7 pt-0 lg:max-w-xl lg:pt-4 lg:pl-2">
            <p
              className="text-[11px] font-medium uppercase tracking-[0.28em]"
              style={{ color: tan, fontFamily: "var(--font-inter), system-ui, sans-serif" }}
            >
              Premium natural nutrition
            </p>

            <h1
              className="font-display text-[1.75rem] font-bold leading-[1.2] tracking-tight md:text-[2.125rem] lg:text-[2.35rem]"
              style={{ color: ink }}
            >
              {p.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex gap-0.5 text-[#E4B04A]" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-[1.15rem] w-[1.15rem] fill-current" />
                ))}
              </div>
              <span className="text-sm text-gray-400">(100+ Reviews)</span>
            </div>

            <p className="text-sm text-gray-500">
              {formatInr(p.price)}
              <span className="text-gray-400"> · </span>
              <span className="text-gray-400">In stock: {p.stock}</span>
            </p>

            <div
              className="space-y-5 text-[0.95rem] leading-[1.75] text-gray-600"
              style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
            >
              {p.description ? (
                <p>{p.description}</p>
              ) : (
                <p className="text-gray-500">
                  Premium wellness product from Green Well LLP. Pure Natural
                  Nutrition — crafted for daily use and wholesome living.
                </p>
              )}
              <p className="text-[0.8125rem] leading-relaxed text-gray-400">
                This is a natural food product and is not intended to diagnose,
                treat, cure, or prevent any disease.
              </p>
            </div>

            {/* CTAs — solid green + outline, side by side */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-stretch sm:gap-4">
              <Link
                href="/login"
                className="inline-flex h-12 min-w-[140px] flex-1 items-center justify-center rounded-lg px-8 text-sm font-semibold text-white transition hover:opacity-92 sm:flex-initial"
                style={{ backgroundColor: ink }}
              >
                Order Now
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 min-w-[140px] flex-1 items-center justify-center rounded-lg border bg-white px-8 text-sm font-semibold transition hover:bg-[#FAFAF8] sm:flex-initial"
                style={{ borderColor: ink, color: ink }}
              >
                Inquiry
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
