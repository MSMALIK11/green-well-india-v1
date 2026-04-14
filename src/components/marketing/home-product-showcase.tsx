"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Product = {
  _id: string;
  name: string;
  slug: string;
};

/** Always land on `/products/{id}` from landing cards. Override in `.env.local`: `NEXT_PUBLIC_DEFAULT_PRODUCT_DETAIL_ID=your_mongo_id` */
const DEFAULT_PRODUCT_DETAIL_ID =
  process.env.NEXT_PUBLIC_DEFAULT_PRODUCT_DETAIL_ID?.trim() ||
  "69dc64b0a849049ec6eb5cc7";

const showcase = [
  {
    key: "ghee",
    title: "Green Well Premium Desi Ghee",
    imageUrl: "https://greenwellindia.in/assets/image/DesiGhee1.png",
    blurb:
      "Made from high-quality cow’s milk using traditional methods — rich aroma, authentic taste, and natural goodness for cooking and daily nourishment.",
    accent: "from-amber-100 to-[#E8F5E9]",
  },
  {
    key: "trail",
    title: "Green Well Premium Trail Mix",
    imageUrl: "https://greenwellindia.in/assets/image/Trail1.png",
    blurb:
      "A wholesome blend of nuts, seeds, and dried fruits — natural energy, protein, and fiber for an active lifestyle.",
    accent: "from-orange-50 to-[#E8F5E9]",
  },
  {
    key: "premium_tea",
    title: "Green Well Premium Tea",
    imageUrl: "https://greenwellindia.in/assets/image/PremiumTea1.png",
    blurb:
      "Carefully selected tea leaves — rich aroma and a refreshing cup for your daily ritual.",
    accent: "from-emerald-50 to-[#C8E6C9]",
  },
  {
    key: "honey",
    title: "Green Well 100% Pure Honey",
    imageUrl: "https://greenwellindia.in/assets/image/Honey1.png",
    blurb:
      "Pure, natural honey — hygienically packed to retain original taste and natural energy.",
    accent: "from-yellow-50 to-[#E8F5E9]",
  },
  {
    key: "green_tea",
    title: "Green Well Premium Green Tea",
    imageUrl: "https://greenwellindia.in/assets/image/GreenTea1.png",
    blurb:
      "Light, crisp green tea — a natural source of antioxidants for refreshment and balance.",
    accent: "from-green-50 to-[#A5D6A7]/40",
  },
] as const;

function text(p: Product) {
  return `${p.name} ${p.slug}`.toLowerCase();
}

/**
 * Assign each showcase row to a distinct catalog product when names/slugs match.
 */
function resolveDetailIds(products: Product[]): Record<string, string | undefined> {
  const used = new Set<string>();
  const out: Record<string, string | undefined> = {};

  const idStr = (p: Product) => String(p._id);

  const take = (predicate: (p: Product) => boolean): string | undefined => {
    const hit = products.find((p) => !used.has(idStr(p)) && predicate(p));
    if (hit) used.add(idStr(hit));
    return hit ? idStr(hit) : undefined;
  };

  const takeSlug = (slugs: string[]): string | undefined => {
    const hit = products.find((p) => !used.has(idStr(p)) && slugs.includes(p.slug));
    if (hit) used.add(idStr(hit));
    return hit ? idStr(hit) : undefined;
  };

  /* Name/slug match first; seed slugs link demo catalog (starter/growth packs) to first two cards */
  out.green_tea = take(
    (p) =>
      /\bgreen\s*tea\b|greentea/i.test(text(p)) ||
      (text(p).includes("green") && text(p).includes("tea")),
  );
  out.ghee =
    take((p) => text(p).includes("ghee")) ?? takeSlug(["starter-4999", "desi-ghee"]);
  out.trail =
    take((p) => text(p).includes("trail")) ??
    takeSlug(["growth-9999", "trail-mix"]);
  out.honey = take((p) => text(p).includes("honey"));
  out.premium_tea = take(
    (p) =>
      /\btea\b/i.test(text(p)) &&
      !/\bgreen\b/i.test(text(p)) &&
      !/\bgreen\s*tea\b|greentea/i.test(text(p)),
  );

  return out;
}

export function HomeProductShowcase() {
  const { data } = useQuery({
    queryKey: ["products-public"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: Product[] }>("/api/v1/products/public"),
  });

  const idByKey = useMemo(() => {
    const products = data?.data ?? [];
    return products.length ? resolveDetailIds(products) : {};
  }, [data?.data]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-[#1B5E20] md:text-4xl">
          Our Products
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Natural food products crafted for daily nutrition and wholesome
          living — same spirit as{" "}
          <a
            href="https://greenwellindia.in/Default.aspx"
            className="font-medium text-[#2E7D32] underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Green Well India
          </a>
          . Tap a product to open its detail page.
        </p>
      </div>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {showcase.map((item) => {
          const matchedId = idByKey[item.key];
          const detailId =
            matchedId?.trim() || DEFAULT_PRODUCT_DETAIL_ID.trim() || undefined;
          const href = detailId ? `/products/${detailId}` : "/products";

          return (
            <article
              key={item.key}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#E8F5E9] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]">
                <div
                  className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${item.accent}`}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full bg-white object-contain object-center p-3 transition duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BrandLogo
                        size={80}
                        className="opacity-20 transition group-hover:opacity-30"
                      />
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-lg font-bold text-[#1B5E20]">
                  <Link
                    href={href}
                    className="hover:underline hover:underline-offset-2"
                  >
                    {item.title}
                  </Link>
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {item.blurb}{" "}
                  <span className="text-xs text-gray-400">
                    Natural food product; not intended to diagnose, treat, cure,
                    or prevent any disease.
                  </span>
                </p>
                <Button
                  variant="outline"
                  className="mt-5 w-full border-[#2E7D32] text-[#2E7D32] hover:bg-[#E8F5E9]"
                  asChild
                >
                  <Link href={href}>View details</Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
