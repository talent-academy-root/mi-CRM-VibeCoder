import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: ReactNode;
  /** "0" quita el padding interno (listas que gestionan su propio espaciado). */
  padding?: "default" | "none";
}

export function Card({
  title,
  action,
  padding = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-xs",
        padding === "default" && "p-5",
        className,
      )}
      {...props}
    >
      {(title || action) && (
        <div className="mb-3.5 flex items-center justify-between gap-3">
          {title && (
            <h3 className="text-[15px] font-semibold text-text">{title}</h3>
          )}
          {action && (
            <span className="text-[13px] font-semibold text-primary">
              {action}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
