'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  value,
  question,
  children,
}: {
  value: string;
  question: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionPrimitive.Item value={value} className="border-b border-line">
      <AccordionPrimitive.Header>
        <AccordionPrimitive.Trigger
          className={cn(
            'group flex w-full items-start justify-between gap-6 py-5 text-left transition-colors hover:text-accent',
            'font-display text-lg sm:text-xl',
          )}
        >
          {question}
          <Plus
            className="mt-1 size-5 shrink-0 text-muted transition-transform duration-300 group-data-[state=open]:rotate-45"
            aria-hidden
          />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-[accordion-up_0.25s_ease] data-[state=open]:animate-[accordion-down_0.25s_ease]">
        <div className="max-w-3xl pb-6 text-sm leading-relaxed text-muted">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}
