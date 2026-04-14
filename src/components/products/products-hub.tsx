"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Download,
  Loader2,
  Package,
  Search,
  ShoppingBag,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  buildActivationPlanRows,
  bvFromPrice,
  PACKAGE_DISPLAY,
  pvForProduct,
} from "@/lib/package-meta";
import { cn } from "@/lib/utils";
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
  description: string;
  price: number;
  packageKey: string | null;
  stock: number;
  imageUrl?: string;
  active?: boolean;
};

type MeUser = {
  _id: string;
  name: string;
  referralId: string;
  phone?: string;
  email?: string;
  activationStatus?: string;
  packageKey?: string | null;
};

type Wallets = { package: number; activation: number; shopping: number };

type OrderRow = {
  _id: string;
  status: string;
  subtotal: number;
  totalPv: number;
  createdAt: string;
  items: { name: string; quantity: number; lineTotal: number }[];
};

const tabs = [
  { id: "store", label: "Product Store" },
  { id: "activate", label: "Activate ID" },
  { id: "order", label: "Order Request" },
  { id: "orders", label: "My Orders" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight text-[#2E7D32] sm:text-xl">
      <span className="h-7 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-[#43A047] to-[#2E7D32]" />
      {children}
    </h2>
  );
}

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDate(d: string) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function WalletVsOrderBanner({
  shopping,
  orderTotal,
}: {
  shopping: number;
  orderTotal: number;
}) {
  const ok = shopping >= orderTotal;
  const short = Math.max(0, orderTotal - shopping);
  return (
    <div
      className={cn(
        "mt-4 rounded-xl border px-4 py-3 text-sm",
        ok
          ? "border-[#2E7D32]/30 bg-[#E8F5E9]/50 text-[#1B5E20]"
          : "border-amber-200 bg-amber-50 text-amber-950",
      )}
    >
      <p className="font-semibold">
        Shopping wallet: {formatInr(shopping)} · Order total:{" "}
        {formatInr(orderTotal)}
      </p>
      {!ok ? (
        <p className="mt-1 text-xs">
          Short by {formatInr(short)}. Ask admin to allocate to{" "}
          <strong>Shopping</strong> (not Package) on Admin → Users, or reduce
          items / pick a smaller pack.
        </p>
      ) : null}
    </div>
  );
}

export function ProductsHub() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("store");
  const [cart, setCart] = useState<Record<string, number>>({});

  const productsQuery = useQuery({
    queryKey: ["products-public"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: Product[] }>("/api/v1/products/public"),
  });

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () =>
      apiFetch<{ success: boolean; user: MeUser }>("/api/v1/auth/me"),
  });

  const walletsQuery = useQuery({
    queryKey: ["wallet-balances"],
    queryFn: () =>
      apiFetch<{ success: boolean; wallets: Wallets }>(
        "/api/v1/wallet/balances",
      ),
  });

  const ordersQuery = useQuery({
    queryKey: ["my-orders", "all"],
    queryFn: () =>
      apiFetch<{
        success: boolean;
        data: OrderRow[];
        total: number;
      }>("/api/v1/orders?limit=100"),
    enabled: tab === "orders",
  });

  const ledgerQuery = useQuery({
    queryKey: ["wallet-ledger", "activation-history"],
    queryFn: () =>
      apiFetch<{
        success: boolean;
        data: {
          amount: number;
          direction: string;
          incomeKind: string;
          description?: string;
          wallet: string;
          createdAt: string;
        }[];
      }>("/api/v1/wallet/ledger?limit=30"),
    enabled: tab === "activate",
  });

  const activationPlans = useMemo(
    () => buildActivationPlanRows(productsQuery.data?.data ?? []),
    [productsQuery.data?.data],
  );

  const addToCart = useCallback((id: string, qty = 1) => {
    setCart((c) => ({
      ...c,
      [id]: (c[id] ?? 0) + qty,
    }));
  }, []);

  const setLineQty = useCallback((id: string, qty: number) => {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Products
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Store, activation packs, and orders in one place. Checkout always debits
          your <strong>shopping wallet</strong> — you do not need to be activated
          first; buying an activation pack activates your ID in the same payment.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 rounded-2xl border border-gray-100 bg-white/80 p-2 shadow-sm backdrop-blur-sm sm:justify-start">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
              tab === t.id
                ? "bg-[#2E7D32] text-white shadow-md shadow-[#2E7D32]/25"
                : "text-gray-600 hover:bg-gray-50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "store" ? (
        <StoreTab
          products={productsQuery.data?.data ?? []}
          loading={productsQuery.isPending}
          error={productsQuery.error as Error | null}
          cart={cart}
          onAdd={addToCart}
          onGoOrder={() => setTab("order")}
        />
      ) : null}

      {tab === "activate" ? (
        <ActivateTab
          user={meQuery.data?.user}
          wallets={walletsQuery.data?.wallets}
          activationPlans={activationPlans}
          ledger={ledgerQuery.data?.data ?? []}
          loadingUser={meQuery.isPending}
          loadingWallets={walletsQuery.isPending}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["me"] });
            qc.invalidateQueries({ queryKey: ["wallet-balances"] });
            qc.invalidateQueries({ queryKey: ["wallet-ledger"] });
            qc.invalidateQueries({ queryKey: ["my-orders"] });
          }}
        />
      ) : null}

      {tab === "order" ? (
        <OrderRequestTab
          products={productsQuery.data?.data ?? []}
          cart={cart}
          setLineQty={setLineQty}
          user={meQuery.data?.user}
          wallets={walletsQuery.data?.wallets}
          onOrdered={() => {
            setCart({});
            qc.invalidateQueries({ queryKey: ["my-orders"] });
            qc.invalidateQueries({ queryKey: ["wallet-balances"] });
            setTab("orders");
          }}
        />
      ) : null}

      {tab === "orders" ? (
        <MyOrdersTab
          orders={ordersQuery.data?.data ?? []}
          loading={ordersQuery.isPending}
          error={ordersQuery.error as Error | null}
        />
      ) : null}
    </div>
  );
}

function StoreTab({
  products,
  loading,
  error,
  cart,
  onAdd,
  onGoOrder,
}: {
  products: Product[];
  loading: boolean;
  error: Error | null;
  cart: Record<string, number>;
  onAdd: (id: string, qty?: number) => void;
  onGoOrder: () => void;
}) {
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[#2E7D32]" />
      </div>
    );
  }
  if (error) {
    return (
      <p className="text-center text-red-600">{error.message}</p>
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle>Store Products</SectionTitle>

      {cartCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2E7D32]/20 bg-[#E8F5E9]/60 px-4 py-3">
          <p className="text-sm font-medium text-[#1B5E20]">
            {cartCount} item(s) in cart
          </p>
          <Button
            type="button"
            className="bg-[#2E7D32] hover:bg-[#256628]"
            onClick={onGoOrder}
          >
            Continue to order
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => {
          const pv = pvForProduct(p.packageKey);
          const bv = bvFromPrice(p.price);
          return (
            <article
              key={p._id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/[0.03] transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-gray-200/80"
            >
              <div className="relative aspect-[4/3] bg-gradient-to-br from-[#E8F5E9] via-white to-[#F1F8E9]">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-full w-full object-contain p-4 transition group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package
                      className="h-20 w-20 text-[#2E7D32]/25"
                      strokeWidth={1}
                    />
                  </div>
                )}
                {p.packageKey ? (
                  <Badge className="absolute right-3 top-3 border-0 bg-white/90 text-[11px] font-semibold text-[#2E7D32] shadow-sm">
                    {PACKAGE_DISPLAY[p.packageKey]?.shortLabel ?? "Pack"}
                  </Badge>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 text-base font-semibold leading-snug text-gray-900">
                  {p.name}
                </h3>
                {p.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {p.description}
                  </p>
                ) : null}
                <div className="mt-3 flex items-end justify-between gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {formatInr(p.price)}
                  </span>
                  <span className="text-sm font-semibold text-[#2E7D32]">
                    {pv > 0 ? `${pv} PV` : `${bv} BV`}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Stock: {p.stock}
                </p>
                <Button
                  type="button"
                  className="mt-4 w-full rounded-xl bg-[#C8E6C9] font-semibold text-[#1B5E20] shadow-none hover:bg-[#A5D6A7]"
                  disabled={p.stock < 1}
                  onClick={() => onAdd(p._id, 1)}
                >
                  Add to Cart
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ActivateTab({
  user,
  wallets,
  activationPlans,
  ledger,
  loadingUser,
  loadingWallets,
  onSuccess,
}: {
  user?: MeUser;
  wallets?: Wallets;
  activationPlans: ReturnType<typeof buildActivationPlanRows>;
  ledger: {
    amount: number;
    direction: string;
    incomeKind: string;
    description?: string;
    wallet: string;
    createdAt: string;
  }[];
  loadingUser: boolean;
  loadingWallets: boolean;
  onSuccess: () => void;
}) {
  const [planId, setPlanId] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const selectedRow = activationPlans.find((r) => r.product?._id === planId);
  const planAmount = selectedRow?.product?.price ?? 0;

  const availableTiers = activationPlans.filter((r) => r.product).length;

  useEffect(() => {
    if (!planId) return;
    const stillValid = activationPlans.some((r) => r.product?._id === planId);
    if (!stillValid) setPlanId("");
  }, [activationPlans, planId]);

  const activateMut = useMutation({
    mutationFn: async () => {
      if (!planId || !selectedRow?.product) throw new Error("Select a plan");
      const order = await apiFetch<{ success: boolean; order: { _id: string } }>(
        "/api/v1/orders",
        {
          method: "POST",
          body: JSON.stringify({
            items: [{ productId: planId, quantity: 1 }],
            status: "pending",
          }),
        },
      );
      await apiFetch(`/api/v1/orders/${order.order._id}/pay`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      setErr(null);
      setPlanId("");
      onSuccess();
    },
    onError: (e: Error) => setErr(e.message),
  });

  const today = formatDate(new Date().toISOString());

  const isActive = user?.activationStatus === "active";
  const packLabel = user?.packageKey
    ? PACKAGE_DISPLAY[user.packageKey]?.shortLabel ?? user.packageKey
    : null;

  return (
    <div className="space-y-10">
      <section>
        <SectionTitle>User Information</SectionTitle>
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#2E7D32]/20 bg-[#E8F5E9]/40 px-4 py-3 text-sm">
          <span className="font-semibold text-gray-700">ID status:</span>
          <Badge
            className={
              isActive
                ? "border-0 bg-[#2E7D32] text-white"
                : "border-0 bg-amber-100 text-amber-900"
            }
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
          <span className="text-gray-500">|</span>
          <span className="font-semibold text-gray-700">Activation pack:</span>
          <span className="text-gray-900">{packLabel ?? "—"}</span>
          {!isActive ? (
            <span className="w-full text-xs text-gray-600 sm:w-auto">
              Buy an activation pack below and pay from shopping wallet — your ID
              becomes active and upline earns level income per backend rules.
            </span>
          ) : null}
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          {loadingUser || loadingWallets ? (
            <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Available Amount (Shopping)">
                <Input
                  readOnly
                  className="border-gray-200 bg-gray-50"
                  value={formatInr(wallets?.shopping ?? 0)}
                />
              </Field>
              <Field label="TopUp Date">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    readOnly
                    className="border-gray-200 bg-gray-50 pl-9"
                    value={today}
                  />
                </div>
              </Field>
              <Field label="User ID">
                <Input
                  readOnly
                  className="border-gray-200 bg-gray-50"
                  value={user?.referralId ?? "—"}
                />
              </Field>
              <Field label="User Name">
                <Input
                  readOnly
                  className="border-gray-200 bg-gray-50"
                  value={user?.name ?? "—"}
                />
              </Field>
              <Field label="Select Plan (activation tiers only)">
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]/40"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                >
                  <option value="">— Please Select Plan —</option>
                  {activationPlans.map((row) => {
                    const p = row.product;
                    const price = p?.price ?? row.canonicalPrice;
                    const label = `${row.planLabel} — ${formatInr(price)} · ${row.pv} PV`;
                    return (
                      <option
                        key={row.packageKey}
                        value={p?._id ?? ""}
                        disabled={!p}
                      >
                        {label}
                        {!p ? " — not stocked" : ""}
                      </option>
                    );
                  })}
                </select>
              </Field>
              <Field label="Plan Amount">
                <Input
                  readOnly
                  className="border-gray-200 bg-gray-50"
                  value={planAmount ? formatInr(planAmount) : ""}
                  placeholder="—"
                />
              </Field>
              {selectedRow?.product ? (
                <div className="sm:col-span-2 text-xs text-gray-500">
                  Charged product (catalog):{" "}
                  <span className="font-medium text-gray-700">
                    {selectedRow.product.name}
                  </span>
                </div>
              ) : null}
            </div>
          )}
          {availableTiers === 0 ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              No activation products are available. In{" "}
              <strong>Admin → Products</strong>, create or enable one product per
              tier: <strong>Basic</strong> (BASIC_4999), <strong>Smart</strong>{" "}
              (STANDARD_9999), <strong>Prime</strong> (PREMIUM_24999), with stock
              &gt; 0. Retail items without a package tier stay in the store only
              and do not appear here.
            </p>
          ) : null}
          {err ? (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {err}
            </p>
          ) : null}
          {planId && planAmount > 0 ? (
            <WalletVsOrderBanner
              shopping={wallets?.shopping ?? 0}
              orderTotal={planAmount}
            />
          ) : null}
          <Button
            type="button"
            className="mt-6 rounded-xl bg-[#2E7D32] px-8 hover:bg-[#256628]"
            disabled={
              activateMut.isPending ||
              !planId ||
              planAmount > (wallets?.shopping ?? 0)
            }
            onClick={() => activateMut.mutate()}
          >
            {activateMut.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              "Submit Activation"
            )}
          </Button>
          <p className="mt-3 text-xs text-gray-500">
            Paid from shopping wallet only. This list is always the three
            official tiers (Basic / Smart / Prime), not general store products.
            ₹10,000 covers Basic or Smart; Prime needs ₹24,999.
          </p>
        </div>
      </section>

      <section>
        <SectionTitle>Upgrade History</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E8F5E9] bg-[#E8F5E9] hover:bg-[#E8F5E9]">
                <TableHead className="font-bold text-[#2E7D32]">Date</TableHead>
                <TableHead className="font-bold text-[#2E7D32]">Wallet</TableHead>
                <TableHead className="font-bold text-[#2E7D32]">Amount</TableHead>
                <TableHead className="font-bold text-[#2E7D32]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.length ? (
                ledger.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {row.wallet} · {row.direction}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatInr(row.amount)}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm text-gray-600">
                      {row.description ?? row.incomeKind}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                    No wallet activity yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function OrderRequestTab({
  products,
  cart,
  setLineQty,
  user,
  wallets,
  onOrdered,
}: {
  products: Product[];
  cart: Record<string, number>;
  setLineQty: (id: string, qty: number) => void;
  user?: MeUser;
  wallets?: Wallets;
  onOrdered: () => void;
}) {
  const [address, setAddress] = useState("");
  const [shipSame, setShipSame] = useState(true);
  const [shipAddr, setShipAddr] = useState("");
  const [shipMobile, setShipMobile] = useState("");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [pin, setPin] = useState("");
  const [delivery, setDelivery] = useState("Standard");
  const [centre, setCentre] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const quantities = useMemo(() => {
    const m: Record<string, number> = { ...cart };
    for (const p of products) {
      if (m[p._id] === undefined) m[p._id] = 0;
    }
    return m;
  }, [cart, products]);

  const lines = useMemo(() => {
    return products
      .map((p) => ({
        product: p,
        qty: quantities[p._id] ?? 0,
      }))
      .filter((l) => l.qty > 0);
  }, [products, quantities]);

  const previewMut = useMutation({
    mutationFn: async () => {
      const items = lines.map((l) => ({
        productId: l.product._id,
        quantity: l.qty,
      }));
      if (!items.length) throw new Error("Add quantities for at least one product");
      return apiFetch<{
        success: boolean;
        subtotal: number;
        totalPv: number;
        lines: { lineTotal: number; quantity: number; packageKey: string | null }[];
      }>("/api/v1/orders/preview", {
        method: "POST",
        body: JSON.stringify({ items }),
      });
    },
  });

  const submitMut = useMutation({
    mutationFn: async () => {
      const items = lines.map((l) => ({
        productId: l.product._id,
        quantity: l.qty,
      }));
      if (!items.length) throw new Error("Add quantities for at least one product");
      const notes = JSON.stringify({
        address,
        shippingAddress: shipSame ? address : shipAddr,
        shippingMobile: shipMobile || user?.phone,
        state: stateName,
        city,
        pinCode: pin,
        deliveryOption: delivery,
        deliveryCentre: centre,
        paymentMode: "Wallet",
      });
      const order = await apiFetch<{ success: boolean; order: { _id: string } }>(
        "/api/v1/orders",
        {
          method: "POST",
          body: JSON.stringify({
            items,
            status: "pending",
            notes,
          }),
        },
      );
      await apiFetch(`/api/v1/orders/${order.order._id}/pay`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      setErr(null);
      onOrdered();
    },
    onError: (e: Error) => setErr(e.message),
  });

  const preview = previewMut.data;
  const localSubtotal = useMemo(
    () => lines.reduce((s, l) => s + l.product.price * l.qty, 0),
    [lines],
  );
  const net = preview?.subtotal ?? localSubtotal;
  const totalPv = preview?.totalPv ?? 0;
  const totalBv = lines.reduce(
    (s, l) => s + bvFromPrice(l.product.price) * l.qty,
    0,
  );
  const shoppingBal = wallets?.shopping ?? 0;
  const cannotPay = lines.length > 0 && net > shoppingBal;

  return (
    <div className="space-y-8">
      <SectionTitle>Create Order</SectionTitle>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="User Code">
            <Input readOnly className="bg-gray-50" value={user?.referralId ?? ""} />
          </Field>
          <Field label="User Name">
            <Input readOnly className="bg-gray-50" value={user?.name ?? ""} />
          </Field>
          <Field label="Mobile No">
            <Input readOnly className="bg-gray-50" value={user?.phone ?? ""} />
          </Field>
          <Field label="Address">
            <textarea
              className="min-h-[72px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]/40"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
            />
          </Field>
          <div className="sm:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={shipSame}
                onChange={(e) => setShipSame(e.target.checked)}
                className="accent-[#2E7D32]"
              />
              Same as Address
            </label>
            <Field label="Shipping Address">
              <textarea
                className="min-h-[72px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]/40"
                disabled={shipSame}
                value={shipSame ? address : shipAddr}
                onChange={(e) => setShipAddr(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Shipping Mobile">
            <Input
              value={shipMobile}
              onChange={(e) => setShipMobile(e.target.value)}
              placeholder="Optional"
            />
          </Field>
          <Field label="State">
            <Input value={stateName} onChange={(e) => setStateName(e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="Pin Code">
            <Input value={pin} onChange={(e) => setPin(e.target.value)} />
          </Field>
          <Field label="Delivery Option">
            <select
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
            >
              <option value="Standard">Standard</option>
              <option value="Express">Express</option>
            </select>
          </Field>
          <Field label="Select Delivery Centre">
            <Input
              value={centre}
              onChange={(e) => setCentre(e.target.value)}
              placeholder="Optional"
            />
          </Field>
          <Field label="Payment Mode">
            <Input readOnly className="bg-gray-50" value="Wallet" />
          </Field>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryBox label="Net Amount" value={formatInr(net)} />
          <SummaryBox label="Total BV" value={String(totalBv)} />
          <SummaryBox label="Total PV" value={String(totalPv)} />
          <SummaryBox label="Total APV" value={String(Math.ceil(totalPv * 0.9))} />
        </div>

        {lines.length > 0 ? (
          <WalletVsOrderBanner shopping={shoppingBal} orderTotal={net} />
        ) : null}

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#2E7D32] hover:bg-[#2E7D32]">
                <TableHead className="font-semibold text-white">Product</TableHead>
                <TableHead className="font-semibold text-white">BV</TableHead>
                <TableHead className="font-semibold text-white">PV</TableHead>
                <TableHead className="font-semibold text-white">Rate</TableHead>
                <TableHead className="w-24 font-semibold text-white">Qty</TableHead>
                <TableHead className="font-semibold text-white">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const q = quantities[p._id] ?? 0;
                const pv = pvForProduct(p.packageKey);
                const bv = bvFromPrice(p.price);
                return (
                  <TableRow key={p._id} className="border-gray-100">
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{bv}</TableCell>
                    <TableCell>{pv || "—"}</TableCell>
                    <TableCell>{formatInr(p.price)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="h-9 w-20"
                        value={q || ""}
                        placeholder="0"
                        onChange={(e) =>
                          setLineQty(p._id, Number(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {q > 0 ? formatInr(p.price * q) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {err ? (
          <p className="mt-4 text-sm text-red-600">{err}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            type="button"
            variant="secondary"
            className="min-w-[140px] rounded-xl"
            disabled={previewMut.isPending}
            onClick={() => previewMut.mutate()}
          >
            {previewMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Calculate / Preview"
            )}
          </Button>
          <Button
            type="button"
            className="min-w-[140px] rounded-xl bg-[#2E7D32] hover:bg-[#256628]"
            disabled={submitMut.isPending || !lines.length || cannotPay}
            onClick={() => submitMut.mutate()}
          >
            {submitMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Submit Order"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function MyOrdersTab({
  orders,
  loading,
  error,
}: {
  orders: OrderRow[];
  loading: boolean;
  error: Error | null;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (status && o.status !== status) return false;
      const t = new Date(o.createdAt).getTime();
      if (from && t < new Date(from).setHours(0, 0, 0, 0)) return false;
      if (to && t > new Date(to).setHours(23, 59, 59, 999)) return false;
      return true;
    });
  }, [orders, from, to, status]);

  async function exportXlsx() {
    const res = await fetch("/api/v1/orders/export/xlsx", {
      credentials: "include",
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-orders.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-[#2E7D32]" />
      </div>
    );
  }
  if (error) {
    return <p className="text-red-600">{error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <SectionTitle>My Order History</SectionTitle>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Date From">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full sm:w-40"
            />
          </Field>
          <Field label="Date To">
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full sm:w-40"
            />
          </Field>
          <Field label="Status">
            <select
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm sm:w-40"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
          <Button
            type="button"
            className="rounded-xl bg-[#2E7D32] hover:bg-[#256628]"
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            onClick={() => exportXlsx()}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#E8F5E9] hover:bg-[#E8F5E9]">
              <TableHead className="font-bold text-[#2E7D32]">Order</TableHead>
              <TableHead className="font-bold text-[#2E7D32]">Date</TableHead>
              <TableHead className="font-bold text-[#2E7D32]">Status</TableHead>
              <TableHead className="font-bold text-[#2E7D32]">Items</TableHead>
              <TableHead className="font-bold text-[#2E7D32]">Total</TableHead>
              <TableHead className="font-bold text-[#2E7D32]">PV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length ? (
              filtered.map((o) => (
                <TableRow key={o._id}>
                  <TableCell className="font-mono text-xs">
                    {String(o._id).slice(-8)}
                  </TableCell>
                  <TableCell>{formatDate(o.createdAt)}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "capitalize",
                        o.status === "paid"
                          ? "border-0 bg-[#E8F5E9] text-[#2E7D32]"
                          : "border-0 bg-amber-50 text-amber-800",
                      )}
                    >
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px] text-sm text-gray-600">
                    {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatInr(o.subtotal)}
                  </TableCell>
                  <TableCell>{o.totalPv}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-gray-500"
                >
                  <ShoppingBag className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                  No orders match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
