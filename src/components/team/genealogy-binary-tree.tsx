"use client";

import type { ReactNode } from "react";
import { ChevronUp, Plus, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export type TreeNode = {
  id: string;
  referralId: string;
  name: string;
  rank: string;
  activationStatus: string;
  pv?: number;
  bv?: number;
  children: TreeNode[];
};

export type JoinOpenPayload = {
  sponsorReferralId: string;
  slot: "left" | "right";
};

const LINE = "bg-[#D1D5DB]";

function formatVol(n: number | undefined) {
  const x = Number(n ?? 0);
  return x.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function MemberCard({
  node,
  uplineNav,
}: {
  node: TreeNode;
  uplineNav?: ReactNode;
}) {
  const active = node.activationStatus === "active";
  const displayName = node.name?.trim() || "—";
  const pv = node.pv ?? 0;
  const bv = node.bv ?? 0;

  return (
    <div
      className={cn(
        "relative w-[200px] shrink-0 overflow-hidden rounded-xl border bg-white",
        "shadow-sm transition-all duration-200 ease-out",
        "hover:scale-[1.02] hover:shadow-md hover:shadow-gray-200/80",
        active ? "border-gray-200" : "border-gray-200",
      )}
    >
      {uplineNav ? (
        <div className="absolute right-2 top-2 z-10">{uplineNav}</div>
      ) : null}
      <div className="flex flex-col items-center px-3 pb-3 pt-4">
        <div
          className={cn(
            "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full",
            active ? "bg-[#2E7D32] text-white" : "bg-gray-300 text-white",
          )}
        >
          <UserRound className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <div className="mt-3 flex w-full min-w-0 items-center justify-center gap-1.5 px-0.5">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              active ? "bg-[#2E7D32]" : "bg-gray-300",
            )}
            title={active ? "Active" : "Inactive"}
          />
          <p
            className="truncate text-center text-sm font-bold leading-tight text-gray-900"
            title={displayName}
          >
            {displayName}
          </p>
        </div>
        <p className="mt-1 text-center font-mono text-xs font-medium text-gray-500">
          {node.referralId}
        </p>
        <div className="mt-3 flex w-full justify-center gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-center text-[11px] text-gray-600">
            PV{" "}
            <span className="font-semibold tabular-nums text-gray-800">
              {formatVol(pv)}
            </span>
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-center text-[11px] text-gray-600">
            BV{" "}
            <span className="font-semibold tabular-nums text-gray-800">
              {formatVol(bv)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptySlot({
  sponsorReferralId,
  slot,
  onJoinOpen,
}: {
  sponsorReferralId: string;
  slot: "left" | "right";
  onJoinOpen?: (p: JoinOpenPayload) => void;
}) {
  const open = () => onJoinOpen?.({ sponsorReferralId, slot });

  return (
    <div
      className={cn(
        "flex w-[200px] shrink-0 flex-col overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white",
        "shadow-sm transition-all duration-200 ease-out",
        "hover:scale-[1.02] hover:border-gray-400 hover:shadow-md hover:shadow-gray-200/60",
      )}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-3 py-7 text-center">
        <button
          type="button"
          onClick={open}
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-transparent text-gray-400 transition hover:border-[#2E7D32]/40 hover:text-[#2E7D32]"
          aria-label="Join in this slot"
        >
          <Plus className="h-7 w-7" strokeWidth={1.75} />
        </button>
        <p className="mt-3 text-xs font-semibold text-gray-500">Empty</p>
        <button
          type="button"
          onClick={open}
          className="mt-0.5 text-xs font-bold text-[#2E7D32] hover:underline"
        >
          Join Now
        </button>
      </div>
      <div className="border-t border-gray-200 bg-gray-50/80 px-2 py-2 text-center">
        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          Open Slot
        </p>
      </div>
    </div>
  );
}

function BranchPill({ side }: { side: "left" | "right" }) {
  return (
    <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
      {side === "left" ? "Left" : "Right"}
    </span>
  );
}

export function GenealogyBinaryTree({
  node,
  levelsBelow,
  vacancySponsorId,
  placementSlot,
  onJoinOpen,
  isRoot,
  uplineNav,
}: {
  node: TreeNode | null;
  levelsBelow: number;
  vacancySponsorId: string;
  placementSlot: "left" | "right";
  onJoinOpen?: (p: JoinOpenPayload) => void;
  isRoot?: boolean;
  uplineNav?: ReactNode;
}) {
  if (!node) {
    return (
      <EmptySlot
        sponsorReferralId={vacancySponsorId}
        slot={placementSlot}
        onJoinOpen={onJoinOpen}
      />
    );
  }

  const left = node.children[0] ?? null;
  const right = node.children[1] ?? null;

  return (
    <div className="flex flex-col items-center">
      <MemberCard
        node={node}
        uplineNav={isRoot ? uplineNav : undefined}
      />

      {levelsBelow > 0 ? (
        <div className="flex w-full flex-col items-center">
          <div className={cn("h-8 w-px shrink-0", LINE)} aria-hidden />

          <div className="relative w-full min-w-[280px] max-w-[580px] px-2 sm:px-4">
            <div
              className={cn(
                "pointer-events-none absolute left-[25%] right-[25%] top-0 h-px sm:left-[26%] sm:right-[26%]",
                LINE,
              )}
              aria-hidden
            />

            <div className="grid grid-cols-2 gap-4 sm:gap-10 lg:gap-16">
              <div className="flex flex-col items-center">
                <div
                  className={cn("h-6 w-px shrink-0 -translate-y-px", LINE)}
                  aria-hidden
                />
                <div className="mt-2">
                  <BranchPill side="left" />
                </div>
                <div className={cn("h-4 w-px shrink-0", LINE)} aria-hidden />
                <GenealogyBinaryTree
                  node={left}
                  levelsBelow={levelsBelow - 1}
                  vacancySponsorId={node.referralId}
                  placementSlot="left"
                  onJoinOpen={onJoinOpen}
                />
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={cn("h-6 w-px shrink-0 -translate-y-px", LINE)}
                  aria-hidden
                />
                <div className="mt-2">
                  <BranchPill side="right" />
                </div>
                <div className={cn("h-4 w-px shrink-0", LINE)} aria-hidden />
                <GenealogyBinaryTree
                  node={right}
                  levelsBelow={levelsBelow - 1}
                  vacancySponsorId={node.referralId}
                  placementSlot="right"
                  onJoinOpen={onJoinOpen}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ParentNavButton({
  parentReferralId,
  onNavigate,
  visible,
}: {
  parentReferralId: string | null;
  onNavigate: (referralId: string) => void;
  visible: boolean;
}) {
  if (!visible || !parentReferralId) return null;
  return (
    <button
      type="button"
      onClick={() => onNavigate(parentReferralId)}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2E7D32]/40 bg-white text-[#2E7D32] shadow-sm transition hover:bg-[#E8F5E9]"
      title="View upline"
    >
      <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
}
