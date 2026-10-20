import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helper?: string;
  icon?: ReactNode;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({
  label,
  error,
  helper,
  icon,
  id,
  className,
  ref,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "h-12 w-full rounded-md border bg-surface text-[15px] text-text outline-none transition-colors placeholder:text-text-subtle disabled:bg-surface-2 disabled:text-text-subtle",
            icon ? "pl-10 pr-3.5" : "px-3.5",
            error
              ? "border-error focus:border-error focus:ring-3 focus:ring-error-bg"
              : "border-border-strong focus:border-primary focus:ring-3 focus:ring-primary-subtle",
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />
      </div>
      {error ? (
        <span className="flex items-center gap-1.5 text-[13px] text-error-text">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </span>
      ) : helper ? (
        <span className="text-[13px] text-text-muted">{helper}</span>
      ) : null}
    </div>
  );
}
