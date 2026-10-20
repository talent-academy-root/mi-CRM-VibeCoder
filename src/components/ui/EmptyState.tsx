import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  help?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, help, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg bg-surface-2 text-text-subtle">
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <h4 className="text-[15px] font-semibold text-text">{title}</h4>
        {help && <p className="max-w-[280px] text-[13px] text-text-muted">{help}</p>}
      </div>
      {action}
    </div>
  );
}
