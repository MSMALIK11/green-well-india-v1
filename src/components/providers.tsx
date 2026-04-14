"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster richColors position="top-center" closeButton />
    </QueryClientProvider>
  );
}
