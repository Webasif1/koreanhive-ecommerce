"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ProductTab = { value: string; label: string; content: ReactNode };

/**
 * Description / FAQ / Reviews on the product page.
 *
 * Every panel is force-mounted and only hidden when inactive. Radix unmounts
 * inactive panels by default, which would leave the FAQ and reviews out of
 * the prerendered HTML — the copy search engines read. The panel content is
 * built on the server and passed in, so this adds only the tab switching.
 */
export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  if (tabs.length === 0) return null;

  return (
    <Tabs defaultValue={tabs[0].value}>
      <TabsList
        className="grid gap-2 overflow-visible border-b-0"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="mb-0 h-12 border-b-0 bg-blush px-2 text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground hover:bg-chip-border/60 hover:text-primary sm:text-[12.5px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-primary/25 data-[state=active]:hover:bg-primary data-[state=active]:hover:text-white"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          forceMount
          className="pt-8 text-[14px] data-[state=inactive]:hidden"
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
