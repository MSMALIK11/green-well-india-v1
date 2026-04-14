import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardStatTile({
  label,
  value,
  subValue,
  className,
}: {
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 shadow-sm",
        "transition-all duration-200 ease-out",
        "hover:scale-[1.02] hover:border-[#2E7D32]/30 hover:shadow-lg hover:shadow-[#2E7D32]/12",
        className,
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums text-gray-900">
        {value}
      </div>
      {subValue ? (
        <div className="mt-0.5 text-xs text-slate-500">{subValue}</div>
      ) : null}
    </div>
  );
}
