'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative grid size-10 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-line-strong hover:text-foreground"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {/* Rendered only after mount so the icon cannot disagree with the DOM. */}
      {mounted ? isDark ? <Sun className="size-4" /> : <Moon className="size-4" /> : <span className="size-4" />}
    </button>
  );
}
