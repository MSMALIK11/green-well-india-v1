"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { DEFAULT_HERO_SLIDER_URLS } from "@/lib/marketing-hero-defaults";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function AdminMarketingPage() {
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const { data, isPending } = useQuery({
    queryKey: ["admin-marketing-hero"],
    queryFn: () =>
      apiFetch<{ success: boolean; urls: string[] }>(
        "/api/v1/admin/marketing/hero",
      ),
  });

  useEffect(() => {
    if (data?.urls?.length) setText(data.urls.join("\n"));
  }, [data?.urls]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const urls = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (!urls.length) throw new Error("Add at least one image URL (one per line)");
      return apiFetch<{ success: boolean; urls: string[] }>(
        "/api/v1/admin/marketing/hero",
        {
          method: "PATCH",
          body: JSON.stringify({ urls }),
        },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-marketing-hero"] });
      qc.invalidateQueries({ queryKey: ["marketing-hero"] });
    },
  });

  function resetDefaults() {
    setText(DEFAULT_HERO_SLIDER_URLS.join("\n"));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketing — Hero slider</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Public landing page hero loads these URLs and auto-rotates them. One
          HTTPS URL per line (max 20). Example: greenwellindia.in asset links.
        </p>
      </div>

      {isPending ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-3">
          <Label htmlFor="hero-urls">Image URLs</Label>
          <textarea
            id="hero-urls"
            className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="https://example.com/banner1.png&#10;https://example.com/banner2.png"
          />
          {saveMut.isError ? (
            <p className="text-sm text-destructive">
              {(saveMut.error as Error).message}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              {saveMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save hero images"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={resetDefaults}>
              Reset to Green Well defaults
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
