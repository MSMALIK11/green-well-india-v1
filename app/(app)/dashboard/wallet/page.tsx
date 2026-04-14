"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

type Ledger = {
  _id: string;
  wallet: string;
  direction: string;
  amount: number;
  balanceAfter: number;
  incomeKind: string;
  createdAt: string;
};

export default function WalletPage() {
  const [from, setFrom] = useState("shopping");
  const [to, setTo] = useState("package");
  const [amount, setAmount] = useState("100");
  const { data: bal, refetch: refBal } = useQuery({
    queryKey: ["wallet-balances"],
    queryFn: () =>
      apiFetch<{ success: boolean; wallets: Record<string, number> }>(
        "/api/v1/wallet/balances",
      ),
  });
  const { data: ledger, refetch: refLedger } = useQuery({
    queryKey: ["wallet-ledger"],
    queryFn: () =>
      apiFetch<{
        success: boolean;
        data: Ledger[];
      }>("/api/v1/wallet/ledger?limit=50"),
  });

  const columns: ColumnDef<Ledger>[] = [
    { accessorKey: "createdAt", header: "Date" },
    { accessorKey: "wallet", header: "Wallet" },
    { accessorKey: "direction", header: "Dir" },
    { accessorKey: "amount", header: "Amount" },
    { accessorKey: "balanceAfter", header: "After" },
    { accessorKey: "incomeKind", header: "Kind" },
  ];

  const table = useReactTable({
    data: ledger?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  async function transfer() {
    await apiFetch("/api/v1/wallet/transfer", {
      method: "POST",
      body: JSON.stringify({
        from,
        to,
        amount: Number(amount),
      }),
    });
    refBal();
    refLedger();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wallet reports</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {["package", "activation", "shopping"].map((w) => (
          <Card key={w}>
            <CardHeader>
              <CardTitle className="text-sm capitalize">{w}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              ₹{bal?.wallets?.[w]?.toFixed(2) ?? "—"}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal transfer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div>
            <Label>From</Label>
            <Input value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <Label>Amount</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <Button onClick={transfer}>Transfer</Button>
        </CardContent>
      </Card>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
