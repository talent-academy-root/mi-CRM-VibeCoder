import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "default" | "compact";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium text-[15px] transition-colors duration-150 ease-[var(--ease-standard)] disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-text-subtle disabled:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-focus";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary font-semibold hover:bg-primary-hover active:bg-primary-active border border-transparent",
  secondary:
    "bg-surface text-text border border-border-strong hover:bg-surface-2",
  ghost: "bg-transparent text-text-muted hover:bg-surface-2 border border-transparent",
  destructive:
    "bg-error text-white font-semibold hover:brightness-90 border border-transparent",
};

const sizes: Record<Size, string> = {
  default: "h-12 px-5",
  compact: "h-11 px-4",
};

export function Button({
  variant = "primary",
  size = "default",
  loading = false,
  iconLeft,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        iconLeft
      )}
      {children}
    </button>
  );
}
