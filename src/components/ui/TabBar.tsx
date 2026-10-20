"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface TabBarProps {
  items: readonly TabItem[];
  className?: string;
}

export function TabBar({ items, className }: TabBarProps) {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        "flex shrink-0 border-t border-border bg-surface",
        className,
      )}
      aria-label="Navegación principal"
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1.5",
              active ? "font-semibold text-primary" : "font-medium text-text-subtle",
            )}
          >
            <Icon className="size-[22px]" />
            <span className="text-[11px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
