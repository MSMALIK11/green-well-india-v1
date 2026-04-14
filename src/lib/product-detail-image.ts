/** CDN shots when catalog has no imageUrl — match Green Well India assets. */
const ASSETS = {
  ghee: "https://greenwellindia.in/assets/image/DesiGhee1.png",
  trail: "https://greenwellindia.in/assets/image/Trail1.png",
  tea: "https://greenwellindia.in/assets/image/PremiumTea1.png",
  honey: "https://greenwellindia.in/assets/image/Honey1.png",
  greenTea: "https://greenwellindia.in/assets/image/GreenTea1.png",
} as const;

export function resolveProductDetailImage(p: {
  name: string;
  slug?: string;
  imageUrl?: string | null;
}): string | null {
  if (p.imageUrl?.trim()) return p.imageUrl.trim();
  const t = `${p.name} ${p.slug ?? ""}`.toLowerCase();
  if (t.includes("ghee")) return ASSETS.ghee;
  if (t.includes("trail")) return ASSETS.trail;
  if (t.includes("honey")) return ASSETS.honey;
  if (t.includes("green tea")) return ASSETS.greenTea;
  if (t.includes("tea")) return ASSETS.tea;
  return null;
}
