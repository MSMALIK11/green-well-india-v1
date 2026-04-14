"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ACTIVATION_TIERS, ACTIVATION_PACKAGE_KEYS } from "@/lib/package-meta";
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

type BandRow = { label: string; t0: number; t1: number; t2: number };

type CommissionConfigResponse = {
  success: boolean;
  bands: BandRow[];
  defaults: BandRow[];
};

type PayoutRow = {
  _id: string;
  level: number;
  amount: number;
  createdAt: string;
  orderId: string;
  beneficiaryId?: { name?: string; referralId?: string };
};

const tierColumns = ACTIVATION_PACKAGE_KEYS.map((key) => ({
  key: key === "BASIC_4999" ? "t0" : key === "STANDARD_9999" ? "t1" : "t2",
  ...ACTIVATION_TIERS[key],
}));

function CommissionMatrixEditor() {
  const qc = useQueryClient();
  const { data, isPending, error } = useQuery({
    queryKey: ["admin-commission-config"],
    queryFn: () =>
      apiFetch<CommissionConfigResponse>("/api/v1/admin/commission-config"),
  });

  const [draft, setDraft] = useState<
    { label: string; t0: number; t1: number; t2: number }[] | null
  >(null);

  useEffect(() => {
    if (data?.bands?.length === 5) {
      setDraft(
        data.bands.map((b) => ({
          label: b.label,
          t0: b.t0,
          t1: b.t1,
          t2: b.t2,
        })),
      );
    }
  }, [data?.bands]);

  const [savedFlash, setSavedFlash] = useState(false);

  const saveMut = useMutation({
    mutationFn: async (bands: { t0: number; t1: number; t2: number }[]) =>
      apiFetch<{ success: boolean; bands: BandRow[] }>(
        "/api/v1/admin/commission-config",
        {
          method: "PATCH",
          body: JSON.stringify({ bands }),
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-commission-config"] });
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 4000);
    },
  });

  const rows = draft ?? data?.bands ?? [];

  function patchCell(
    rowIndex: number,
    field: "t0" | "t1" | "t2",
    raw: string,
  ) {
    const n = Math.min(
      1_000_000_000,
      Math.max(0, Math.floor(Number(raw) || 0)),
    );
    setDraft((prev) => {
      const base = prev ?? data?.bands ?? [];
      const next = base.map((r, i) =>
        i === rowIndex ? { ...r, [field]: n } : r,
      );
      return next;
    });
  }

  function resetToDefaults() {
    if (!data?.defaults?.length) return;
    setDraft(
      data.defaults.map((b) => ({
        label: b.label,
        t0: b.t0,
        t1: b.t1,
        t2: b.t2,
      })),
    );
  }

  const canSave =
    draft &&
    draft.length === 5 &&
    !saveMut.isPending &&
    draft.every(
      (r) =>
        r.t0 >= 0 &&
        r.t1 >= 0 &&
        r.t2 >= 0 &&
        r.t0 <= 1_000_000_000 &&
        r.t1 <= 1_000_000_000 &&
        r.t2 <= 1_000_000_000,
    );

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">{(error as Error).message}</p>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card/30 p-4">
      <div>
        <h2 className="text-lg font-semibold">Level commission (₹ per upline)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Amount credited to each active upline per activation line item, by
          distance from buyer (levels 1–20 grouped as below) and by the
          buyer&apos;s package tier (Basic / Smart / Prime). New orders use the
          values saved here.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="min-w-[140px] font-semibold">
                Upline depth
              </TableHead>
              {tierColumns.map((col) => (
                <TableHead key={col.key} className="min-w-[120px] font-semibold">
                  <div>{col.planLabel}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    ₹{col.price.toLocaleString("en-IN")} · {col.pv} PV
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={row.label}>
                <TableCell className="align-middle text-sm font-medium">
                  {row.label}
                </TableCell>
                {(["t0", "t1", "t2"] as const).map((field) => (
                  <TableCell key={field}>
                    <Label className="sr-only">
                      {row.label} — {field}
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={1_000_000_000}
                        className="pl-7 font-mono tabular-nums"
                        value={row[field]}
                        onChange={(e) =>
                          patchCell(rowIndex, field, e.target.value)
                        }
                      />
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {saveMut.isError ? (
        <p className="text-sm text-destructive">
          {(saveMut.error as Error).message}
        </p>
      ) : null}
      {savedFlash ? (
        <p className="text-sm text-[#2E7D32]">Commission matrix saved.</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="bg-[#2E7D32] hover:bg-[#256628]"
          disabled={!canSave}
          onClick={() => {
            if (!draft) return;
            saveMut.mutate(
              draft.map(({ t0, t1, t2 }) => ({ t0, t1, t2 })),
            );
          }}
        >
          {saveMut.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save configuration"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!data?.defaults?.length || saveMut.isPending}
          onClick={resetToDefaults}
        >
          Reset to built-in defaults
        </Button>
      </div>
    </div>
  );
}

export default function AdminCommissionsPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ["admin-commissions"],
    queryFn: () =>
      apiFetch<{
        success: boolean;
        data: PayoutRow[];
        total: number;
      }>("/api/v1/admin/commissions?limit=100"),
  });

  const intro = useMemo(
    () =>
      "Level income credited to package wallet when a member pays for an order that includes an activation product. Only active uplines receive payouts.",
    [],
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Commissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">{intro}</p>
      </div>

      <CommissionMatrixEditor />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent payouts</h2>
        {isPending ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-destructive">{(error as Error).message}</p>
        ) : (
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.data ?? []).length ? (
                  (data?.data ?? []).map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(r.createdAt).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {r.beneficiaryId?.name ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.beneficiaryId?.referralId ?? ""}
                        </div>
                      </TableCell>
                      <TableCell>L{r.level}</TableCell>
                      <TableCell className="font-semibold">
                        ₹{r.amount.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {String(r.orderId).slice(-10)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No commission payouts yet. Pay a test order with an
                      activation product while the buyer has an upline chain.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
