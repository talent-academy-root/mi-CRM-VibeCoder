"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { Plus, TrendingUp } from "lucide-react";
import { api, type Id } from "@/lib/convexApi";
import { cn, formatMoneda, shortDate } from "@/lib/utils";
import {
  ESTADO_VENTA_BADGE,
  ESTADO_VENTA_ICONO,
  ESTADO_VENTA_IMPORTE,
  ESTADO_VENTA_LABEL,
  FILTROS_VENTA,
  FILTRO_VENTA_LABEL,
  FILTRO_VENTA_VACIO,
  type EstadoVenta,
  type FiltroVenta,
} from "@/lib/estadoVenta";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { Metric } from "@/components/ui/Metric";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { RegistrarVentaOverlay } from "@/components/overlays/RegistrarVentaOverlay";

type Venta = {
  _id: Id<"ventas">;
  clienteId: Id<"clientes">;
  clienteNombre: string;
  concepto: string;
  importe: number;
  estado: EstadoVenta;
  fecha: string;
};

/**
 * Suma importes en centavos y vuelve a unidades al final. Sumar los flotantes
 * directamente daría "$22,200.500000000004" en el titular de una métrica.
 */
function sumar(ventas: Venta[]): number {
  return ventas.reduce((total, v) => total + Math.round(v.importe * 100), 0) / 100;
}

function VentaFila({ venta, onAbrir }: { venta: Venta; onAbrir: () => void }) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      className="flex w-full items-center gap-3 border-b border-border px-4.5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-surface-2"
    >
      <span
        className={cn(
          "flex size-[34px] shrink-0 items-center justify-center rounded-full",
          ESTADO_VENTA_ICONO[venta.estado],
        )}
      >
        <TrendingUp className="size-[18px]" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[15px] font-medium text-text">
          {venta.concepto}
        </span>
        <div className="flex min-w-0 items-center gap-2">
          <Badge status={ESTADO_VENTA_BADGE[venta.estado]} className="shrink-0">
            {ESTADO_VENTA_LABEL[venta.estado]}
          </Badge>
          <span className="truncate text-[13px] text-text-muted">
            {venta.clienteNombre}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span
          className={cn(
            "font-mono text-[15px] font-semibold tabular-nums",
            ESTADO_VENTA_IMPORTE[venta.estado],
          )}
        >
          {formatMoneda(venta.importe)}
        </span>
        <span className="whitespace-nowrap text-[12px] text-text-subtle">
          {shortDate(venta.fecha)}
        </span>
      </div>
    </button>
  );
}

function ListaSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border px-4.5 py-3.5 last:border-b-0"
        >
          <Skeleton width={34} height={34} radius={9999} />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton width="46%" height={13} />
            <Skeleton width="30%" height={11} />
          </div>
          <Skeleton width={64} height={13} />
        </div>
      ))}
    </Card>
  );
}

/**
 * "Ventas y oportunidades" (TAL-62): las dos métricas del negocio, los filtros con
 * contador y el listado completo. Las métricas y los contadores se calculan aquí,
 * sobre la misma lista que se pinta, así que no pueden discrepar de ella.
 */
export function VentasClient() {
  const router = useRouter();
  // `guardAuth()` protege el render en servidor, pero en cliente Convex Auth tarda
  // un instante: sin el "skip", la query saldría durante la hidratación y
  // `requireUsuario` respondería "No autenticado" en una ruta que sí pasó el guard.
  const { isAuthenticated } = useConvexAuth();
  const ventas = useQuery(
    api.ventas.listarTodas,
    isAuthenticated ? {} : "skip",
  ) as Venta[] | undefined;

  const [filtro, setFiltro] = useState<FiltroVenta>("todas");
  const [nuevaVenta, setNuevaVenta] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  const todas = ventas ?? [];
  const abiertas = todas.filter((v) => v.estado === "abierta");
  const ganadas = todas.filter((v) => v.estado === "ganada");
  const filtradas = filtro === "todas" ? todas : todas.filter((v) => v.estado === filtro);

  const cuenta: Record<FiltroVenta, number> = {
    todas: todas.length,
    abierta: abiertas.length,
    ganada: ganadas.length,
    perdida: todas.filter((v) => v.estado === "perdida").length,
  };

  const opcionesFiltro = FILTROS_VENTA.map((f) => ({
    value: f,
    label: `${FILTRO_VENTA_LABEL[f]} · ${cuenta[f]}`,
  }));

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-0">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-text-subtle">
            Registro de ventas
          </p>
          <h1 className="text-2xl font-semibold text-text">
            Ventas y oportunidades
          </h1>
        </div>
        <Button
          size="compact"
          iconLeft={<Plus className="size-4" aria-hidden />}
          className="shrink-0"
          onClick={() => setNuevaVenta(true)}
        >
          Añadir venta
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <Metric
            label="En marcha"
            value={formatMoneda(sumar(abiertas))}
            valueClassName="text-info-text"
            sub={`${abiertas.length} ${abiertas.length === 1 ? "oportunidad" : "oportunidades"}`}
          />
        </Card>
        <Card>
          <Metric
            label="Ganado"
            value={formatMoneda(sumar(ganadas))}
            valueClassName="text-success-text"
            sub={`${ganadas.length} ${ganadas.length === 1 ? "venta" : "ventas"}`}
          />
        </Card>
      </div>

      <ChipGroup
        options={opcionesFiltro}
        value={filtro}
        // Siempre hay un filtro activo: pulsar el chip activo no lo deselecciona.
        onChange={(v) => v && setFiltro(v)}
      />

      {ventas === undefined ? (
        <ListaSkeleton />
      ) : filtradas.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={<TrendingUp className="size-6" aria-hidden />}
            title={FILTRO_VENTA_VACIO[filtro]}
            help="Las ventas y oportunidades se registran desde aquí o desde la ficha de cada cliente."
            action={
              filtro === "todas" ? (
                <Button size="compact" onClick={() => setNuevaVenta(true)}>
                  Añadir venta
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          {filtradas.map((venta) => (
            <VentaFila
              key={venta._id}
              venta={venta}
              onAbrir={() => router.push(`/clientes/${venta.clienteId}`)}
            />
          ))}
        </Card>
      )}

      {/* Montado solo al abrirlo: el overlay se inicializa una vez (ver su doc). */}
      {nuevaVenta && (
        <RegistrarVentaOverlay
          open
          onClose={() => setNuevaVenta(false)}
          onSaved={() => setToast("Venta registrada")}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
