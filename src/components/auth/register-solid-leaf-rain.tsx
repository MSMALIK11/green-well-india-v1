"use client";

import { Leaf } from "lucide-react";
import { BRAND_LEAF_COLORS } from "@/constants/colors";
import { cn } from "@/lib/utils";

/**
 * Falling leaves — reference motion; Lucide `Leaf` + brand greens
 * (`BRAND_LEAF_COLORS`, pseudo-random per index for stable SSR).
 */

const REF_LEAVES = [
  { left: "5%", duration: 15, delay: 0, size: 25, flip: false },
  { left: "15%", duration: 12, delay: 2, size: 18, flip: true },
  { left: "25%", duration: 18, delay: 4, size: 30, flip: false },
  { left: "40%", duration: 14, delay: 1, size: 22, flip: true },
  { left: "55%", duration: 16, delay: 3, size: 28, flip: false },
  { left: "70%", duration: 13, delay: 5, size: 20, flip: true },
  { left: "85%", duration: 19, delay: 2, size: 35, flip: false },
  { left: "95%", duration: 11, delay: 0, size: 24, flip: true },
] as const;

/** Deterministic mix of the two brand greens (no hydration mismatch). */
function leafColorIndex(i: number, size: number, delay: number) {
  return (i * 17 + size * 3 + Math.round(delay * 10)) % BRAND_LEAF_COLORS.length;
}

export function RegisterSolidLeafRain() {
  return (
    <div className="register-ref-leaf-layer" aria-hidden>
      {REF_LEAVES.map((leaf, i) => {
        const color = BRAND_LEAF_COLORS[leafColorIndex(i, leaf.size, leaf.delay)];
        const staticTop = `${12 + (i * 11) % 70}%`;
        const staticRot = `${-25 + (i % 5) * 12}deg`;
        return (
          <div
            key={i}
            className={cn(
              "register-ref-leaf",
              leaf.flip && "register-ref-leaf--flip",
            )}
            style={
              {
                left: leaf.left,
                color,
                width: leaf.size,
                height: leaf.size,
                animationDuration: `${leaf.duration}s`,
                animationDelay: `${leaf.delay}s`,
                ["--ref-static-top"]: staticTop,
                ["--ref-static-rot"]: staticRot,
              } as React.CSSProperties
            }
          >
            <Leaf
              size={leaf.size}
              fill="currentColor"
              stroke="none"
              className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
              aria-hidden
            />
          </div>
        );
      })}
    </div>
  );
}
