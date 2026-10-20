"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  Calendar,
  CalendarPlus,
  Check,
  MessageSquarePlus,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { api, type Id } from "@/lib/convexApi";
import { cn, hoyLocalISO, relativeLabel, shortDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge, STATUS_LABELS } from "@/components/ui/Badge";
import { ESTADO_BADGE, type EstadoCliente } from "@/lib/estadoCliente";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { NuevoClienteOverlay } from "@/components/overlays/NuevoClienteOverlay";
import { ProgramarSeguimientoOverlay } from "@/components/overlays/ProgramarSeguimientoOverlay";
import { RegistrarInteraccionOverlay } from "@/components/overlays/RegistrarInteraccionOverlay";
import { RegistrarVentaOverlay } from "@/components/overlays/RegistrarVentaOverlay";
import { mensajeError } from "@/lib/errores";

type Seguimiento = {
  _id: Id<"seguimientos">;
  accion: string;
  vence: string;
  clienteId: Id<"clientes">;
  clienteNombre: string;
  clienteEstado: EstadoCliente;
  responsableId: Id<"users">;
  responsableNombre?: string;
};

function fechaItem(vence: string, hoy: string) {
  if (vence < hoy) return { texto: relativeLabel(vence), atrasado: true };
  if (vence === hoy) return { texto: "Hoy", atrasado: false };
  return { texto: shortDate(vence), atrasado: false };
}

function SeguimientoItem({
  s,
  hoy,
  onHecho,
  onAbrir,
}: {
  s: Seguimiento;
  hoy: string;
  onHecho: (id: Id<"seguimientos">) => void;
  onAbrir: (clienteId: Id<"clientes">) => void;
}) {
  const f = fechaItem(s.vence, hoy);
  return (
    <div className="flex items-center gap-3 border-b border-border px-4.5 py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => onHecho(s._id)}
        aria-label="Marcar como hecho"
        className="group flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 border-border-strong transition-colors hover:border-primary"
      >
        <Check className="size-3 text-primary opacity-0 transition-opacity group-hover:opacity-50" />
      </button>
      <button
        type="button"
        onClick={() => onAbrir(s.clienteId)}
        className="flex min-w-0 flex-1 flex-col gap-0.5 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[15px] font-medium text-text">
            {s.clienteNombre}
          </span>
          <Badge status={ESTADO_BADGE[s.clienteEstado]} className="shrink-0">
            {STATUS_LABELS[ESTADO_BADGE[s.clienteEstado]]}
          </Badge>
        </div>
        <span className="truncate text-[13px] text-text-muted">{s.accion}</span>
      </button>
      {s.responsableNombre && <Avatar name={s.responsableNombre} size={26} />}
      <span
        className={cn(
          "shrink-0 text-[13px] tabular-nums",
          f.atrasado ? "font-medium text-error-text" : "text-text-subtle",
        )}
      >
        {f.texto}
      </span>
    </div>
  );
}

function SeccionSeguimientos({
  titulo,
  dot,
  items,
  resaltar,
  hoy,
  onHecho,
  onAbrir,
}: {
  titulo: string;
  dot: string;
  items: Seguimiento[];
  resaltar?: boolean;
  hoy: string;
  onHecho: (id: Id<"seguimientos">) => void;
  onAbrir: (clienteId: Id<"clientes">) => void;
}) {
  if (items.length === 0) return null;
  return (
    <Card
      padding="none"
      className={cn("overflow-hidden", resaltar && "border-error/50")}
    >
      <div className="flex items-center gap-2 border-b border-border px-4.5 py-3">
        <span className={cn("size-2 rounded-full", dot)} />
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          {titulo}
        </h3>
        <span className="text-[13px] text-text-subtle">{items.length}</span>
      </div>
      {items.map((s) => (
        <SeguimientoItem
          key={s._id}
          s={s}
          hoy={hoy}
          onHecho={onHecho}
          onAbrir={onAbrir}
        />
      ))}
    </Card>
  );
}

export function HoyClient() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const seguimientos = useQuery(
    api.seguimientos.pendientesConCliente,
    isAuthenticated ? {} : "skip",
  ) as Seguimiento[] | undefined;
  const marcarHecho = useMutation(api.seguimientos.marcarHecho);
  const deshacer = useMutation(api.seguimientos.deshacer);

  const [overlay, setOverlay] = useState<
    "tarea" | "cliente" | "interaccion" | "venta" | null
  >(null);
  const [toast, setToast] = useState<{
    message: string;
    action?: { label: string; onClick: () => void };
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  async function onHecho(id: Id<"seguimientos">) {
    try {
      await marcarHecho({ id, fechaHecho: hoyLocalISO() });
    } catch (e) {
      setToast({ message: mensajeError(e, "No se pudo completar.") });
      return;
    }
    setToast({
      message: "Seguimiento completado",
      action: {
        label: "Deshacer",
        onClick: async () => {
          setToast(null);
          try {
            await deshacer({ id });
          } catch (e) {
            setToast({ message: mensajeError(e, "No se pudo deshacer.") });
          }
        },
      },
    });
  }

  function onAbrir(clienteId: Id<"clientes">) {
    router.push(`/clientes/${clienteId}`);
  }

  const hoy = hoyLocalISO();
  const fechaLarga = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const total = seguimientos?.length ?? 0;
  const atrasados = seguimientos?.filter((s) => s.vence < hoy) ?? [];
  const paraHoy = seguimientos?.filter((s) => s.vence === hoy) ?? [];
  const proximas = seguimientos?.filter((s) => s.vence > hoy) ?? [];

  const acciones = [
    {
      label: "Nueva tarea",
      icon: CalendarPlus,
      destacado: true,
      onClick: () => setOverlay("tarea"),
    },
    {
      label: "Anotar interacción",
      icon: MessageSquarePlus,
      destacado: false,
      onClick: () => setOverlay("interaccion"),
    },
    {
      label: "Registrar venta",
      icon: TrendingUp,
      destacado: false,
      onClick: () => setOverlay("venta"),
    },
    {
      label: "Nuevo cliente",
      icon: UserPlus,
      destacado: false,
      onClick: () => setOverlay("cliente"),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wide text-text-subtle">
          {fechaLarga}
        </p>
        <h1 className="text-2xl font-semibold text-text">
          {total}{" "}
          {total === 1 ? "seguimiento pendiente" : "seguimientos pendientes"}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {acciones.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full",
                  a.destacado
                    ? "bg-primary text-on-primary"
                    : "bg-primary-subtle text-primary",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="text-center text-[13px] font-medium text-text">
                {a.label}
              </span>
            </button>
          );
        })}
      </div>

      {seguimientos === undefined ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[68px] animate-[vibe-pulse_1.4s_ease-in-out_infinite] rounded-xl bg-surface-2"
            />
          ))}
        </div>
      ) : total === 0 ? (
        <Card>
          <EmptyState
            icon={<Calendar className="size-6" aria-hidden />}
            title="No hay seguimientos para hoy"
            help="Cuando programes tareas aparecerán aquí, con los atrasados arriba."
            action={
              <Button size="compact" onClick={() => setOverlay("tarea")}>
                Nueva tarea
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <SeccionSeguimientos
            titulo="Atrasados"
            dot="bg-error"
            items={atrasados}
            resaltar
            hoy={hoy}
            onHecho={onHecho}
            onAbrir={onAbrir}
          />
          <SeccionSeguimientos
            titulo="Para hoy"
            dot="bg-primary"
            items={paraHoy}
            hoy={hoy}
            onHecho={onHecho}
            onAbrir={onAbrir}
          />
          <SeccionSeguimientos
            titulo="Próximas"
            dot="bg-text-subtle"
            items={proximas}
            hoy={hoy}
            onHecho={onHecho}
            onAbrir={onAbrir}
          />
        </div>
      )}

      <ProgramarSeguimientoOverlay
        open={overlay === "tarea"}
        onClose={() => setOverlay(null)}
        onSaved={() => setToast({ message: "Tarea creada" })}
      />
      <NuevoClienteOverlay
        open={overlay === "cliente"}
        onClose={() => setOverlay(null)}
      />
      <RegistrarInteraccionOverlay
        open={overlay === "interaccion"}
        onClose={() => setOverlay(null)}
        onSaved={() => setToast({ message: "Interacción registrada" })}
      />
      {/* Montado solo al abrirlo: el overlay se inicializa una vez (ver su doc). */}
      {overlay === "venta" && (
        <RegistrarVentaOverlay
          open
          onClose={() => setOverlay(null)}
          onSaved={() => setToast({ message: "Venta registrada" })}
        />
      )}

      {toast && <Toast message={toast.message} action={toast.action} />}
    </div>
  );
}
