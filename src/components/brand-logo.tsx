"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export {
  BRAND_FOREST_DARK,
  BRAND_LEAF_COLORS,
  BRAND_LIGHT_GREEN,
  BRAND_PRIMARY_GREEN,
  BRAND_PRIMARY_HOVER,
} from "@/constants/colors";

export const BRAND_LOGO_SRC =
  "https://login.greenwellindia.in/assets/image/logoimage11113.png";

type BrandLogoProps = {
  className?: string;
  /** Square size in pixels (default 48). */
  size?: number;
  width?: number;
  height?: number;
  priority?: boolean;
  alt?: string;
};

export function BrandLogo({
  className,
  size = 48,
  width,
  height,
  priority,
  alt = "Green Well",
}: BrandLogoProps) {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <Image
      src={BRAND_LOGO_SRC}
      alt={alt}
      width={w}
      height={h}
      className={cn("object-contain", className)}
      priority={priority}
      style={{ borderRadius: "10px" }}
    />
  );
}
