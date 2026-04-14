"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { resolveProductDetailImage } from "@/lib/product-detail-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function ProductsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["products-public"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: Product[] }>("/api/v1/products/public"),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <p className="text-muted-foreground">Loading products…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <p className="text-destructive">
          {(error as Error).message}. Is the API running?
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 md:py-14">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#1B3D2F] md:text-4xl">
          Products
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse our catalog — open any item for full details.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data?.data.map((p) => {
          const img = resolveProductDetailImage({
            name: p.name,
            slug: p.slug,
            imageUrl: p.imageUrl,
          });
          return (
            <Card
              key={p._id}
              className="overflow-hidden border-[#E8F5E9] shadow-sm transition hover:shadow-md"
            >
              <Link href={`/products/${p._id}`} className="block">
                <div className="relative aspect-[4/3] bg-[#FAF9F6]">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-contain p-4"
                    />
                  ) : null}
                </div>
              </Link>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg text-[#1B3D2F]">
                  <Link
                    href={`/products/${p._id}`}
                    className="hover:underline hover:underline-offset-2"
                  >
                    {p.name}
                  </Link>
                </CardTitle>
                {p.packageKey ? (
                  <Badge variant="secondary" className="w-fit text-xs">
                    {p.packageKey}
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p className="line-clamp-2">{p.description}</p>
                <p className="font-semibold text-[#1B3D2F]">{formatInr(p.price)}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-[#1B3D2F] text-[#1B3D2F] hover:bg-[#E8F5E9]"
                  asChild
                >
                  <Link href={`/products/${p._id}`}>View details</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
