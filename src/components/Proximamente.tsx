import { Hammer } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

/** Placeholder de las pantallas que llegan en fases posteriores del MVP. */
export function Proximamente({ titulo }: { titulo: string }) {
  return (
    <div className="pt-8">
      <EmptyState
        icon={<Hammer className="size-6" aria-hidden />}
        title={titulo}
        help="Esta pantalla llega en la siguiente fase del MVP."
      />
    </div>
  );
}
