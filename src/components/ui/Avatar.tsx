import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  variant?: "primary" | "neutral";
  size?: number;
  className?: string;
}

export function Avatar({
  name,
  variant = "primary",
  size = 40,
  className,
}: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        variant === "primary"
          ? "bg-primary-subtle text-primary"
          : "bg-surface-2 text-text-muted",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.35)),
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
