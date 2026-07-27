'use client';

import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,background-color,border-color,color] duration-200 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-accent-foreground hover:brightness-110 shadow-[0_1px_0_oklch(1_0_0/0.25)_inset]',
        outline: 'border border-line-strong bg-transparent text-foreground hover:bg-surface-muted',
        ghost: 'text-muted hover:bg-surface-muted hover:text-foreground',
        subtle: 'bg-surface-muted text-foreground hover:bg-line',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        link: 'text-foreground underline decoration-accent underline-offset-4 hover:decoration-2',
      },
      size: {
        sm: 'h-9 rounded-lg px-3 text-[0.8125rem]',
        md: 'h-11 rounded-xl px-5 text-sm',
        lg: 'h-13 rounded-xl px-7 text-[0.9375rem]',
        icon: 'size-10 rounded-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={asChild ? undefined : (disabled ?? loading)}
      {...props}
    >
      {/* Slot needs exactly one child, so the spinner is only for real buttons. */}
      {asChild ? (
        children
      ) : (
        <>
          {loading ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              <span className="sr-only">Working…</span>
            </>
          ) : null}
          {children}
        </>
      )}
    </Component>
  );
});

export { buttonVariants };
