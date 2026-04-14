"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Wallet } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Wallets = { package: number; activation: number; shopping: number };

type AdminUser = {
  _id: string;
  referralId: string;
  name: string;
  email: string;
  role: string;
  kycStatus: string;
  wallets?: Wallets;
};

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [amount, setAmount] = useState("");
  const [walletKind, setWalletKind] = useState<"shopping" | "package" | "activation">(
    "shopping",
  );
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [reason, setReason] = useState("Test top-up for purchases");

  const { data, isPending } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () =>
      apiFetch<{
        success: boolean;
        data: AdminUser[];
      }>("/api/v1/admin/users?limit=100"),
  });

  const walletMut = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("No user");
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0) throw new Error("Enter a positive amount");
      return apiFetch<{ success: boolean; wallets: Wallets }>(
        `/api/v1/admin/users/${selected._id}/wallet`,
        {
          method: "POST",
          body: JSON.stringify({
            wallet: walletKind,
            amount: n,
            direction,
            reason: reason.trim() || undefined,
          }),
        },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setDialogOpen(false);
      setAmount("");
      setSelected(null);
    },
  });

  function openAllocate(u: AdminUser) {
    setSelected(u);
    setWalletKind("shopping");
    setDirection("credit");
    setReason("Test top-up for purchases");
    setAmount("");
    setDialogOpen(true);
  }

  const users = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Credit a user&apos;s wallet (usually <strong>shopping</strong>) so they
          can pay for orders and activation packs in the dashboard.
        </p>
      </div>
      <div className="rounded-md border border-border">
        {isPending ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referral</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead className="text-right">Shopping</TableHead>
                <TableHead className="text-right">Package</TableHead>
                <TableHead className="text-right">Activation</TableHead>
                <TableHead className="w-[140px]">Test funds</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const w = u.wallets;
                return (
                  <TableRow key={u._id}>
                    <TableCell className="font-mono text-sm">
                      {u.referralId}
                    </TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {u.email}
                    </TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{u.kycStatus}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatInr(w?.shopping ?? 0)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatInr(w?.package ?? 0)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatInr(w?.activation ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => openAllocate(u)}
                      >
                        <Wallet className="h-3.5 w-3.5" />
                        Allocate
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-lg border bg-card p-6 pr-10 shadow-lg">
          <h2 className="text-lg font-semibold leading-none">
            Allocate wallet balance
          </h2>
          {selected ? (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{selected.name}</span>{" "}
                <span className="font-mono">({selected.referralId})</span>
              </p>
              <div className="grid gap-2">
                <Label>Wallet</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={walletKind}
                  onChange={(e) =>
                    setWalletKind(e.target.value as typeof walletKind)
                  }
                >
                  <option value="shopping">Shopping — pay for products / orders</option>
                  <option value="package">Package — commission wallet</option>
                  <option value="activation">Activation</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Direction</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={direction}
                  onChange={(e) =>
                    setDirection(e.target.value as typeof direction)
                  }
                >
                  <option value="credit">Credit (add money — for testing buys)</option>
                  <option value="debit">Debit (remove money)</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Note (ledger)</Label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason shown in wallet history"
                />
              </div>
              {walletMut.isError ? (
                <p className="text-sm text-destructive">
                  {(walletMut.error as Error).message}
                </p>
              ) : null}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={walletMut.isPending}
                  onClick={() => walletMut.mutate()}
                >
                  {walletMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : direction === "credit" ? (
                    "Apply credit"
                  ) : (
                    "Apply debit"
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
