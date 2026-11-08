"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./ThemeProvider";
import { BrandThemeProvider } from "./BrandThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: false,
          },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <AuthProvider>
          <BrandThemeProvider>
          {children}
          <Toaster
            richColors
            closeButton
            position="top-right"
            toastOptions={{
              className: "rounded-xl border shadow-soft",
            }}
          />
          </BrandThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
