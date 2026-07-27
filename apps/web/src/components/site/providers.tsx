'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import * as React from 'react';
import { TooltipProvider } from '@/components/ui/overlays';
import { ToastProvider } from '@/components/ui/toast';

export function AppProviders({
  children,
  defaultTheme = 'dark',
}: {
  children: React.ReactNode;
  defaultTheme?: string;
}) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme={defaultTheme} enableSystem disableTransitionOnChange>
        <TooltipProvider delayDuration={200}>
          <ToastProvider>{children}</ToastProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
