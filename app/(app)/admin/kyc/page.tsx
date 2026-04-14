"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminKycPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-kyc-pending"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: Record<string, unknown>[] }>(
        "/api/v1/admin/kyc/pending",
      ),
  });

  async function setStatus(id: string, kycStatus: "approved" | "rejected") {
    await apiFetch(`/api/v1/admin/kyc/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ kycStatus }),
    });
    qc.invalidateQueries({ queryKey: ["admin-kyc-pending"] });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">KYC queue</h1>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.data ?? []).map((u) => (
              <TableRow key={String(u._id)}>
                <TableCell>{String(u.name)}</TableCell>
                <TableCell>{String(u.email)}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setStatus(String(u._id), "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus(String(u._id), "rejected")}
                  >
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
