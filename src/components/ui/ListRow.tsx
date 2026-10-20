import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

interface ListRowProps {
  name: string;
  subtitle?: string;
  badge?: ReactNode;
  /** Contenido a la derecha (importe mono, fecha…). */
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ListRow({ name, subtitle, badge, trailing, onClick, className }: ListRowProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 border-b border-border px-4.5 py-3.5 text-left last:border-b-0",
        onClick && "cursor-pointer transition-colors hover:bg-surface-2",
        className,
      )}
    >
      <Avatar name={name} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[15px] font-medium text-text">{name}</span>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
        {subtitle && (
          <span className="truncate text-[13px] text-text-muted">{subtitle}</span>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </Tag>
  );
}
