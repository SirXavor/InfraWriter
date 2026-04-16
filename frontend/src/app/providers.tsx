import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { EditorStateProvider } from "./EditorStateContext";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <EditorStateProvider>{children}</EditorStateProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}