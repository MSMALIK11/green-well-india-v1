import Link from "next/link";
import { Check, Star } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { HomeProductShowcase } from "@/components/marketing/home-product-showcase";
import { MarketingHeroSection } from "@/components/marketing/marketing-hero-section";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    quote: "Green Well nutrition helped change my lifestyle.",
    name: "Rajesh",
    place: "Saharanpur",
  },
  {
    quote: "I joined the partner program and doubled my earnings.",
    name: "Priya",
    place: "Delhi",
  },
];

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      <MarketingHeroSection>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm text-white backdrop-blur-md">
          <BrandLogo size={18} className="h-4 w-4 shrink-0" />
          Pure Natural Nutrition
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-md md:text-5xl lg:text-6xl">
          Green Well LLP
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/95 drop-shadow md:text-xl">
          Premium wellness products and a partner program built on trust,
          training, and community.
        </p>
      </MarketingHeroSection>

      <HomeProductShowcase />

      {/* Become a partner — two column on md */}
      <section className="border-y border-[#E8F5E9] bg-white px-4 py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <h2 className="font-display text-3xl font-bold text-[#1B5E20] md:text-4xl">
              Become a Green Well Partner
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Join our team and earn with premium nutrition.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Easy Onboarding",
                "Ongoing Support",
                "Training & Community",
              ].map((line) => (
                <li key={line} className="flex items-center gap-3 text-[#1B5E20]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F5E9]">
                    <Check className="h-4 w-4 text-[#2E7D32]" />
                  </span>
                  <span className="font-medium">{line}</span>
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              className="mt-10 bg-[#2E7D32] hover:bg-[#256628]"
              asChild
            >
              <Link href="/register">Partner</Link>
            </Button>
          </div>
          <div className="rounded-2xl border border-[#C8E6C9] bg-gradient-to-br from-[#E8F5E9] to-white p-8 md:p-10">
            <p className="font-display text-xl font-semibold text-[#1B5E20]">
              Your dashboard
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              After sign-up, use the partner portal for team view, income, and
              wallet — aligned with your MLM operations platform.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-gray-700">
              <li>· Referral genealogy & levels</li>
              <li>· Commission-friendly order flow</li>
              <li>· KYC and secure access</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <h2 className="text-center font-display text-3xl font-bold text-[#1B5E20] md:text-4xl">
          Customer Testimonials
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <blockquote
              key={t.name}
              className="rounded-2xl border border-[#E8F5E9] bg-white p-8 shadow-sm"
            >
              <div className="flex gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-lg text-gray-800">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4 text-sm font-medium text-[#2E7D32]">
                {t.name}, {t.place}.
              </footer>
            </blockquote>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link
            href="/contact"
            className="text-sm font-medium text-[#2E7D32] underline-offset-4 hover:underline"
          >
            Read More
          </Link>
        </p>
      </section>
    </div>
  );
}
