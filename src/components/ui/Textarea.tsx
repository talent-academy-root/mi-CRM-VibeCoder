import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  helper?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
}

export function Textarea({
  label,
  error,
  helper,
  id,
  className,
  rows = 3,
  ref,
  ...props
}: TextareaProps) {
  const textareaId =
    id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        rows={rows}
        className={cn(
          "min-h-[84px] w-full resize-y rounded-md border bg-surface px-3.5 py-3 text-[15px] leading-normal text-text outline-none transition-colors placeholder:text-text-subtle disabled:bg-surface-2 disabled:text-text-subtle",
          error
            ? "border-error focus:border-error focus:ring-3 focus:ring-error-bg"
            : "border-border-strong focus:border-primary focus:ring-3 focus:ring-primary-subtle",
          className,
        )}
        aria-invalid={!!error}
        {...props}
      />
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
