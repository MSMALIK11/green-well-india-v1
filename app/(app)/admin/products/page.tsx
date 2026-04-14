"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PACKAGE_DISPLAY } from "@/lib/package-meta";
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

type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  packageKey: string | null;
  stock: number;
  active: boolean;
  imageUrl?: string;
};

const PACKAGE_OPTIONS = [
  { value: "", label: "None (retail — no activation / level PV)" },
  { value: "BASIC_4999", label: "BASIC_4999 — Basic (1 PV)" },
  { value: "STANDARD_9999", label: "STANDARD_9999 — Smart (2 PV)" },
  { value: "PREMIUM_24999", label: "PREMIUM_24999 — Prime (5 PV)" },
];

function emptyForm() {
  return {
    name: "",
    slug: "",
    description: "",
    price: "",
    packageKey: "",
    stock: "0",
    active: true,
    imageUrl: "",
  };
}

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: Product[] }>(
        "/api/v1/admin/products",
      ),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const price = Number(form.price);
      const stock = Number(form.stock);
      if (!form.name.trim() || !form.slug.trim()) {
        throw new Error("Name and slug are required");
      }
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("Valid price required");
      }
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
        description: form.description.trim(),
        price,
        stock: Number.isFinite(stock) && stock >= 0 ? stock : 0,
        active: form.active,
        packageKey:
          form.packageKey === ""
            ? null
            : (form.packageKey as "BASIC_4999" | "STANDARD_9999" | "PREMIUM_24999"),
        imageUrl: form.imageUrl.trim() || undefined,
      };
      if (editingId) {
        return apiFetch<{ success: boolean; product: Product }>(
          `/api/v1/admin/products/${editingId}`,
          { method: "PATCH", body: JSON.stringify(body) },
        );
      }
      return apiFetch<{ success: boolean; product: Product }>(
        "/api/v1/admin/products",
        { method: "POST", body: JSON.stringify(body) },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products-public"] });
      setForm(emptyForm());
      setEditingId(null);
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products-public"] });
    },
  });

  const startEdit = useCallback((p: Product) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      price: String(p.price),
      packageKey: p.packageKey ?? "",
      stock: String(p.stock),
      active: p.active,
      imageUrl: p.imageUrl ?? "",
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm());
  }, []);

  const products = data?.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Activation packs must use a package key so paid orders run level
          commissions and activate the buyer&apos;s ID. Retail items leave
          package key empty.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">
          {editingId ? "Edit product" : "Add product"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Slug (unique)</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              disabled={!!editingId}
              title="Slug cannot be changed after create"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Price (₹)</Label>
            <Input
              type="number"
              min={1}
              step={1}
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Stock</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={form.stock}
              onChange={(e) =>
                setForm((f) => ({ ...f, stock: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Package key</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.packageKey}
              onChange={(e) =>
                setForm((f) => ({ ...f, packageKey: e.target.value }))
              }
            >
              {PACKAGE_OPTIONS.map((o) => (
                <option key={o.value || "none"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Image URL (optional)</Label>
            <Input
              value={form.imageUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, imageUrl: e.target.value }))
              }
              placeholder="https://..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
              className="accent-primary"
            />
            Active (visible in public store)
          </label>
        </div>
        {saveMut.isError ? (
          <p className="mt-3 text-sm text-destructive">
            {(saveMut.error as Error).message}
          </p>
        ) : null}
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
              "Create product"
            )}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Catalog</h2>
        <div className="rounded-md border border-border">
          {isPending ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Pack</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>₹{p.price.toLocaleString("en-IN")}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>
                      {p.packageKey
                        ? PACKAGE_DISPLAY[p.packageKey]?.shortLabel ??
                          p.packageKey
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.active ? "default" : "secondary"}>
                        {p.active ? "active" : "hidden"}
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
                        className="h-9 w-9 p-0 text-destructive"
                        onClick={() => {
                          if (
                            typeof window !== "undefined" &&
                            window.confirm(`Delete “${p.name}”?`)
                          ) {
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
          )}
        </div>
      </div>
    </div>
  );
}
