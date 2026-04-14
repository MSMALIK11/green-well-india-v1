"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Row = {
  _id: string;
  amount: number;
  incomeKind: string;
  wallet: string;
  description?: string;
  createdAt: string;
  meta?: { level?: number };
};

export default function IncomePage() {
  const { data } = useQuery({
    queryKey: ["income"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: Row[] }>("/api/v1/income?limit=100"),
  });

  const columns: ColumnDef<Row>[] = [
    { accessorKey: "createdAt", header: "Date" },
    {
      accessorKey: "incomeKind",
      header: "Type",
    },
    {
      id: "level",
      header: "Level",
      accessorFn: (r) => r.meta?.level ?? "—",
    },
    { accessorKey: "wallet", header: "Wallet" },
    { accessorKey: "amount", header: "₹" },
    { accessorKey: "description", header: "Note" },
  ];

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Income history</h1>
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
