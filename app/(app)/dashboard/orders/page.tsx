"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Order = {
  _id: string;
  status: string;
  subtotal: number;
  totalPv: number;
  items: { name: string; quantity: number; lineTotal: number }[];
};

export default function OrdersPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["orders"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: Order[] }>("/api/v1/orders"),
  });

  const { data: products } = useQuery({
    queryKey: ["products-public"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: { _id: string; name: string }[] }>(
        "/api/v1/products/public",
      ),
  });

  async function quickOrder() {
    const first = products?.data?.[0];
    if (!first) return;
    await apiFetch("/api/v1/orders", {
      method: "POST",
      body: JSON.stringify({
        items: [{ productId: first._id, quantity: 1 }],
        status: "pending",
      }),
    });
    qc.invalidateQueries({ queryKey: ["orders"] });
  }

  async function pay(id: string) {
    await apiFetch(`/api/v1/orders/${id}/pay`, { method: "POST" });
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Button onClick={quickOrder}>New order (first product)</Button>
      </div>
      <div className="grid gap-4">
        {data?.data?.map((o) => (
          <Card key={o._id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                Order {o._id.slice(-6)}
              </CardTitle>
              <Badge>{o.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Subtotal: ₹{o.subtotal} · PV: {o.totalPv}</p>
              <ul className="list-inside list-disc text-muted-foreground">
                {o.items.map((it, i) => (
                  <li key={i}>
                    {it.name} × {it.quantity} = ₹{it.lineTotal}
                  </li>
                ))}
              </ul>
              {o.status === "pending" || o.status === "draft" ? (
                <Button size="sm" onClick={() => pay(o._id)}>
                  Pay from shopping wallet
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
