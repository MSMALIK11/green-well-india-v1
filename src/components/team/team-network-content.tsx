"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Home, Network, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JoinRegisterModal } from "@/components/auth/join-register-modal";
import {
  GenealogyBinaryTree,
  ParentNavButton,
  type JoinOpenPayload,
  type TreeNode,
} from "@/components/team/genealogy-binary-tree";

type TreeApi = {
  success: boolean;
  data: TreeNode;
  meta: {
    rootReferralId: string;
    parentReferralId: string | null;
    viewerReferralId: string;
  };
};

type LevelSummary = { level: number; count: number; business: number };

type MemberRow = {
  _id: string;
  name: string;
  referralId: string;
  rank?: string;
  activationStatus: string;
  createdAt?: string;
  wallets?: { package?: number; activation?: number; shopping?: number };
};

const tabs = [
  { id: "genealogy", label: "Genealogy" },
  { id: "levels", label: "Levels List" },
  { id: "directs", label: "My Directs" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function formatInr(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatJoined(d: string | undefined) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  const dd = String(x.getDate()).padStart(2, "0");
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const yyyy = x.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function TeamNetworkInner() {
  const router = useRouter();
  const emptySearch = useMemo(() => new URLSearchParams(), []);
  const searchParams = useSearchParams() ?? emptySearch;
  const rawTab = searchParams.get("tab");
  const tab: TabId = tabs.some((t) => t.id === rawTab)
    ? (rawTab as TabId)
    : "genealogy";

  const setTab = useCallback(
    (id: TabId) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("tab", id);
      router.replace(`/dashboard/team?${p.toString()}`);
    },
    [router, searchParams],
  );

  const [anchor, setAnchor] = useState<string | undefined>(undefined);
  const [memberInput, setMemberInput] = useState("");
  const [joinModal, setJoinModal] = useState<JoinOpenPayload | null>(null);

  const treeQuery = useQuery({
    queryKey: ["team-tree", anchor ?? "__root__"],
    queryFn: async () => {
      const q = new URLSearchParams({ depth: "4" });
      if (anchor) q.set("anchor", anchor);
      return apiFetch<TreeApi>(`/api/v1/team/tree?${q.toString()}`);
    },
    enabled: tab === "genealogy",
  });

  const levelsSummaryQuery = useQuery({
    queryKey: ["team-levels-summary"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: LevelSummary[] }>(
        "/api/v1/team/levels-summary",
      ),
    enabled: tab === "levels",
  });

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [tierFilter, setTierFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );

  const levelMembersQuery = useQuery({
    queryKey: ["team-level", selectedLevel],
    queryFn: () =>
      apiFetch<{ success: boolean; data: MemberRow[] }>(
        `/api/v1/team/level/${selectedLevel}`,
      ),
    enabled: tab === "levels",
  });

  const directsQuery = useQuery({
    queryKey: ["directs"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: MemberRow[] }>(
        "/api/v1/team/directs",
      ),
    enabled: tab === "directs",
  });

  const filteredTierRows = useMemo(() => {
    const rows = levelMembersQuery.data?.data ?? [];
    if (tierFilter === "all") return rows;
    return rows.filter((r) => r.activationStatus === tierFilter);
  }, [levelMembersQuery.data?.data, tierFilter]);

  const directsColumns = useMemo<ColumnDef<MemberRow>[]>(
    () => [
      {
        id: "idx",
        header: "#",
        cell: ({ row }) => row.index + 1,
      },
      { accessorKey: "name", header: "NAME" },
      { accessorKey: "referralId", header: "ID" },
      {
        accessorKey: "createdAt",
        header: "JOINED",
        cell: ({ getValue }) => formatJoined(getValue() as string | undefined),
      },
      {
        accessorKey: "activationStatus",
        header: "STATUS",
        cell: ({ getValue }) => {
          const s = String(getValue());
          const active = s === "active";
          return (
            <Badge
              className={cn(
                "font-medium capitalize",
                active
                  ? "border-0 bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#E8F5E9]"
                  : "border-0 bg-red-50 text-red-700 hover:bg-red-50",
              )}
            >
              {active ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        id: "amount",
        header: "AMOUNT",
        cell: ({ row }) => {
          const w = row.original.wallets;
          const n = (w?.package ?? 0) + (w?.activation ?? 0);
          return <span className="text-gray-700">{formatInr(n)}</span>;
        },
      },
    ],
    [],
  );

  const directsTable = useReactTable({
    data: directsQuery.data?.data ?? [],
    columns: directsColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tierColumns = useMemo<ColumnDef<MemberRow>[]>(
    () => [
      {
        id: "idx",
        header: "#",
        cell: ({ row }) => row.index + 1,
      },
      { accessorKey: "referralId", header: "MEMBER ID" },
      { accessorKey: "name", header: "NAME" },
      {
        id: "tier",
        header: "LEVEL",
        cell: () => `Tier ${selectedLevel}`,
      },
      {
        accessorKey: "activationStatus",
        header: "STATUS",
        cell: ({ getValue }) => {
          const s = String(getValue());
          const active = s === "active";
          return (
            <Badge
              className={cn(
                "font-semibold uppercase",
                active
                  ? "border-0 bg-[#E8F5E9] text-[#2E7D32]"
                  : "border-0 bg-red-100 text-red-700",
              )}
            >
              {active ? "Active" : "INACTIVE"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "DATE",
        cell: ({ getValue }) => formatJoined(getValue() as string | undefined),
      },
      {
        id: "volume",
        header: "VOLUME",
        cell: ({ row }) => {
          const w = row.original.wallets;
          const n = w?.shopping ?? 0;
          return formatInr(n);
        },
      },
    ],
    [selectedLevel],
  );

  const tierTable = useReactTable({
    data: filteredTierRows,
    columns: tierColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const meta = treeQuery.data?.meta;
  const tree = treeQuery.data?.data;
  const showParentUp = !!meta?.parentReferralId;

  return (
    <div className="space-y-6">
      <JoinRegisterModal
        open={joinModal !== null}
        onOpenChange={(open) => {
          if (!open) setJoinModal(null);
        }}
        sponsorReferralId={joinModal?.sponsorReferralId ?? ""}
        defaultPosition={joinModal?.slot ?? "left"}
        onRegistered={() => {
          treeQuery.refetch();
        }}
      />

      <div className="border-b border-[#2E7D32]/25 pb-4">
        <h1 className="flex items-center gap-2 text-xl font-bold text-[#2E7D32] sm:text-2xl">
          <Network className="h-7 w-7 shrink-0" />
          Team Network
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors",
              tab === t.id
                ? "bg-[#2E7D32] text-white shadow-sm"
                : "bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "genealogy" ? (
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="text-sm font-medium text-gray-700">Member:</span>
            <Input
              placeholder="Enter ID.."
              value={memberInput}
              onChange={(e) => setMemberInput(e.target.value)}
              className="max-w-xs border-gray-300"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="bg-[#2E7D32] hover:bg-[#256628]"
                onClick={() => {
                  const id = memberInput.trim();
                  if (id) setAnchor(id.toUpperCase());
                }}
              >
                Go
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-gray-300"
                onClick={() => {
                  setAnchor(undefined);
                  setMemberInput("");
                }}
              >
                <Home className="mr-2 h-4 w-4" />
                Root
              </Button>
            </div>
          </div>

          {treeQuery.isError ? (
            <p className="text-sm text-red-600">
              {(treeQuery.error as Error)?.message ?? "Could not load tree."}
            </p>
          ) : treeQuery.isPending ? (
            <p className="text-center text-gray-500">Loading genealogy…</p>
          ) : tree ? (
            <div className="overflow-x-auto pb-4 pt-2">
              <div className="mx-auto flex min-w-[min(100%,320px)] max-w-4xl flex-col items-center bg-white">
                <GenealogyBinaryTree
                  node={tree}
                  levelsBelow={3}
                  vacancySponsorId={
                    meta?.rootReferralId ?? tree.referralId
                  }
                  placementSlot="left"
                  onJoinOpen={setJoinModal}
                  isRoot
                  uplineNav={
                    <ParentNavButton
                      parentReferralId={meta?.parentReferralId ?? null}
                      visible={showParentUp}
                      onNavigate={(id) => {
                        setAnchor(id);
                        setMemberInput(id);
                      }}
                    />
                  }
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "levels" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(levelsSummaryQuery.data?.data ?? []).map((L) => (
              <button
                key={L.level}
                type="button"
                onClick={() => setSelectedLevel(L.level)}
                className={cn(
                  "rounded-xl border p-3 text-left shadow-sm transition",
                  selectedLevel === L.level
                    ? "border-[#2E7D32] bg-[#E8F5E9] ring-2 ring-[#2E7D32]/20"
                    : "border-gray-200 bg-white hover:border-gray-300",
                )}
              >
                <p className="text-xs font-bold text-[#2E7D32]">
                  LEVEL-{L.level}{" "}
                  <span className="font-normal text-gray-500">
                    ( INR {L.business.toLocaleString("en-IN")} )
                  </span>
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                  <Users className="h-4 w-4 text-[#2E7D32]" />
                  <span className="font-semibold">{L.count}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Business: {formatInr(L.business)}
                </p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-bold text-[#2E7D32]">
                Tier Records: Level {selectedLevel}
              </h2>
              <div className="flex flex-wrap gap-3 text-sm">
                {(
                  [
                    ["all", "All"],
                    ["active", "Active"],
                    ["inactive", "Inactive"],
                  ] as const
                ).map(([id, label]) => (
                  <label
                    key={id}
                    className="flex cursor-pointer items-center gap-1.5"
                  >
                    <input
                      type="radio"
                      name="tier-filter"
                      checked={tierFilter === id}
                      onChange={() => setTierFilter(id)}
                      className="accent-[#2E7D32]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto p-2">
              <Table>
                <TableHeader>
                  {tierTable.getHeaderGroups().map((hg) => (
                    <TableRow
                      key={hg.id}
                      className="border-[#E8F5E9] bg-[#E8F5E9] hover:bg-[#E8F5E9]"
                    >
                      {hg.headers.map((h) => (
                        <TableHead
                          key={h.id}
                          className="font-bold uppercase text-[#2E7D32]"
                        >
                          {flexRender(
                            h.column.columnDef.header,
                            h.getContext(),
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {tierTable.getRowModel().rows.length ? (
                    tierTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={tierColumns.length}
                        className="h-24 text-center text-gray-500"
                      >
                        No members at this level.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "directs" ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              {directsTable.getHeaderGroups().map((hg) => (
                <TableRow
                  key={hg.id}
                  className="border-[#E8F5E9] bg-[#E8F5E9] hover:bg-[#E8F5E9]"
                >
                  {hg.headers.map((h) => (
                    <TableHead
                      key={h.id}
                      className="font-bold uppercase text-[#2E7D32]"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {directsTable.getRowModel().rows.length ? (
                directsTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={directsColumns.length}
                    className="h-24 text-center text-gray-500"
                  >
                    No directs yet. Share your referral link from the{" "}
                    <Link
                      href="/dashboard"
                      className="font-medium text-[#2E7D32] underline"
                    >
                      home
                    </Link>{" "}
                    dashboard.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}

export function TeamNetworkContent() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-gray-500">Loading…</div>
      }
    >
      <TeamNetworkInner />
    </Suspense>
  );
}
