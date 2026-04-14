"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminHomePage() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () =>
      apiFetch<{
        success: boolean;
        users: number;
        paidOrders: number;
        totalCredits: number;
      }>("/api/v1/admin/stats"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Users
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {data?.users ?? "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Paid orders
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {data?.paidOrders ?? "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Credits issued
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            ₹{data?.totalCredits?.toFixed(0) ?? "—"}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
