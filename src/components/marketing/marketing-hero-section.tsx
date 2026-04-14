"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { DEFAULT_HERO_SLIDER_URLS } from "@/lib/marketing-hero-defaults";
import { cn } from "@/lib/utils";

const AUTO_MS = 5500;

export function MarketingHeroSection({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = useQuery({
    queryKey: ["marketing-hero"],
    queryFn: () =>
      apiFetch<{ success: boolean; urls: string[] }>("/api/v1/marketing/hero"),
    staleTime: 60_000,
    retry: 1,
  });

  const urls =
    data?.urls?.length && data.urls.length > 0
      ? data.urls
      : DEFAULT_HERO_SLIDER_URLS;

  const safe = urls.length > 0 ? urls : DEFAULT_HERO_SLIDER_URLS;
  const [index, setIndex] = useState(0);
  const urlsKey = safe.join("|");

  useEffect(() => {
    setIndex(0);
  }, [urlsKey]);

  useEffect(() => {
    if (safe.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % safe.length);
    }, AUTO_MS);
    return () => window.clearInterval(t);
  }, [safe.length, urlsKey]);

  const go = useCallback(
    (i: number) => {
      setIndex(((i % safe.length) + safe.length) % safe.length);
    },
    [safe.length],
  );

  return (
    <section
      className="relative w-full min-h-[min(78vh,760px)] overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Hero banner"
    >
      {/* Full-bleed background slides */}
      <div className="absolute inset-0 z-0 w-full">
        {safe.map((src, i) => (
          <div
            key={src}
            className={cn(
              "absolute inset-0 h-full w-full transition-opacity duration-700 ease-in-out",
              i === index ? "z-[1] opacity-100" : "z-0 opacity-0",
            )}
            aria-hidden={i !== index}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- admin may set any HTTPS URL */}
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover object-center"
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        ))}
      </div>

      {/* Readability overlay */}
      <div
        className="absolute inset-0 z-[2] bg-gradient-to-b from-black/45 via-black/35 to-black/55"
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-[3] flex min-h-[min(78vh,760px)] w-full items-center justify-center px-4 py-16 text-white md:py-20">
        <div className="mx-auto w-full max-w-4xl text-center">{children}</div>
      </div>

      {/* Slide indicators */}
      {safe.length > 1 ? (
        <div className="absolute bottom-5 left-0 right-0 z-[4] flex justify-center gap-2 md:bottom-8">
          {safe.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "h-2.5 rounded-full transition-all",
                i === index
                  ? "w-8 bg-white"
                  : "w-2.5 bg-white/45 hover:bg-white/80",
              )}
              onClick={() => go(i)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
