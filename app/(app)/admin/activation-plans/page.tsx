"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

type ActivationPlan = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  packageKey: string;
  sortOrder: number;
  active: boolean;
};

const PACKAGE_OPTIONS = [
  { value: "BASIC_4999", label: "BASIC_4999 — Basic (1 PV)" },
  { value: "STANDARD_9999", label: "STANDARD_9999 — Smart (2 PV)" },
  { value: "PREMIUM_24999", label: "PREMIUM_24999 — Prime (5 PV)" },
];

function emptyForm() {
  return {
    name: "",
    slug: "",
    description: "",
    packageKey: "BASIC_4999",
    sortOrder: "0",
    active: true,
  };
}

export default function AdminActivationPlansPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: plansRes, isPending } = useQuery({
    queryKey: ["admin-activation-plans"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: ActivationPlan[] }>(
        "/api/v1/admin/activation-plans",
      ),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.name.trim() || !form.slug.trim()) {
        throw new Error("Name and slug are required");
      }
      const sortOrder = Number(form.sortOrder);
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
        description: form.description.trim(),
        packageKey: form.packageKey as
          | "BASIC_4999"
          | "STANDARD_9999"
          | "PREMIUM_24999",
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        active: form.active,
      };
      if (editingId) {
        return apiFetch<{ success: boolean; plan: ActivationPlan }>(
          `/api/v1/admin/activation-plans/${editingId}`,
          { method: "PATCH", body: JSON.stringify(body) },
        );
      }
      return apiFetch<{ success: boolean; plan: ActivationPlan }>(
        "/api/v1/admin/activation-plans",
        { method: "POST", body: JSON.stringify(body) },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-activation-plans"] });
      qc.invalidateQueries({ queryKey: ["activation-plans-public"] });
      setForm(emptyForm());
      setEditingId(null);
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/admin/activation-plans/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-activation-plans"] });
      qc.invalidateQueries({ queryKey: ["activation-plans-public"] });
    },
  });

  const startEdit = useCallback((p: ActivationPlan) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      packageKey: p.packageKey,
      sortOrder: String(p.sortOrder ?? 0),
      active: p.active,
    });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Activation plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Marketing copy per MLM tier (Basic / Smart / Prime). Exposed on{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            GET /api/v1/marketing/activation-plans
          </code>
          . Purchases use <strong>Admin → Products</strong> and{" "}
          <strong>Dashboard → Products → Activate ID</strong> (catalog only — no
          link to these rows).
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">
          {editingId ? "Edit plan" : "Create plan"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ap-name">Display name</Label>
            <Input
              id="ap-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Smart Partner Pack"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ap-slug">Slug (URL-safe)</Label>
            <Input
              id="ap-slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="smart-partner"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ap-desc">Description</Label>
            <Input
              id="ap-desc"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Short text shown to members"
            />
          </div>
          <div className="space-y-2">
            <Label>Package tier (PV / commissions)</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.packageKey}
              onChange={(e) =>
                setForm((f) => ({ ...f, packageKey: e.target.value }))
              }
            >
              {PACKAGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ap-sort">Sort order</Label>
            <Input
              id="ap-sort"
              type="number"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((f) => ({ ...f, sortOrder: e.target.value }))
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
            />
            Active (included in public marketing list)
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={saveMut.isPending}
            onClick={() => saveMut.mutate()}
          >
            {saveMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingId ? (
              "Save changes"
            ) : (
              "Create plan"
            )}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
              }}
            >
              Cancel edit
            </Button>
          ) : null}
        </div>
        {saveMut.error ? (
          <p className="mt-2 text-sm text-red-600">
            {(saveMut.error as Error).message}
          </p>
        ) : null}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">All plans</h2>
        {isPending ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(plansRes?.data ?? []).map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>{p.sortOrder}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs">{p.packageKey}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {p.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.active ? "default" : "secondary"}>
                        {p.active ? "Active" : "Off"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={() => startEdit(p)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 text-red-600"
                        onClick={() => {
                          if (confirm("Delete this activation plan?")) {
                            delMut.mutate(p._id);
                          }
                        }}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
