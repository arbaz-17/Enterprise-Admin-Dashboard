import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from "@/features/auth/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import axios from "axios";

import App from "./App";

import "./index.css";

import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,

      refetchOnWindowFocus: true,
      refetchOnReconnect: true,

      retry: (failureCount, error) => {
        if (axios.isCancel(error)) return false;

        const status = axios.isAxiosError(error)
          ? error.response?.status
          : undefined;

        if (status !== undefined && status < 500 && status !== 429) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>

        <Toaster position="top-center" closeButton />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
