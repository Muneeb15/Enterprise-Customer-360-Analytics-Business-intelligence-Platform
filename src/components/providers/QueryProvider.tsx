"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache for 60 seconds — data reappears instantly on back-navigation
            staleTime: 60_000,
            // Keep in cache for 5 minutes after component unmounts
            gcTime: 5 * 60_000,
            // Don't retry on 404 — fail fast
            retry: (failureCount, error: unknown) => {
              if (error instanceof Error && error.message.includes("404")) return false;
              return failureCount < 1;
            },
            // Refetch when window regains focus (keeps data fresh)
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
