import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
}

export function Skeleton({ width = "100%", height = 16, radius = 6, className }: SkeletonProps) {
  const style: CSSProperties = {
    width,
    height,
    borderRadius: radius,
    animation: "vibe-pulse 1.4s ease-in-out infinite",
  };
  return <div className={cn("bg-surface-2", className)} style={style} aria-hidden />;
}
