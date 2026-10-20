"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  CalendarPlus,
  Check,
  Mail,
  MessageSquare,
  MessageSquarePlus,
  Pencil,
  Phone,
  TrendingUp,
  Users,
} from "lucide-react";
import { api, type Id } from "@/lib/convexApi";
import { ESTADO_BADGE } from "@/lib/estadoCliente";
import {
  cn,
  formatMoneda,
  hoyLocalISO,
  relativeLabel,
  shortDate,
} from "@/lib/utils";
import { mensajeError } from "@/lib/errores";
import { etiquetaVencimiento } from "@/lib/seguimientos";
import {
  CANAL_INTERACCION_ICON,
  CANAL_INTERACCION_LABEL,
  type CanalInteraccion,
} from "@/lib/canalInteraccion";
import {
  ESTADO_VENTA_BADGE,
  ESTADO_VENTA_ICONO,
  ESTADO_VENTA_IMPORTE,
  ESTADO_VENTA_LABEL,
  type EstadoVenta,
} from "@/lib/estadoVenta";
import { Card } from "@/components/ui/Card";
import { Badge, STATUS_LABELS } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { EditarClienteOverlay } from "@/components/overlays/EditarClienteOverlay";
import { ProgramarSeguimientoOverlay } from "@/components/overlays/ProgramarSeguimientoOverlay";
import { RegistrarInteraccionOverlay } from "@/components/overlays/RegistrarInteraccionOverlay";
import { RegistrarVentaOverlay } from "@/components/overlays/RegistrarVentaOverlay";

const CANAL_LABEL: Record<string, string> = {
  web: "Web",
  redes: "Redes",
  email: "Email",
  whatsapp: "WhatsApp",
};

type Accion = "interaccion" | "seguimiento" | "venta";

const ACCIONES: { id: Accion; label: string; icon: typeof MessageSquarePlus }[] =
  [
    { id: "interaccion", label: "Registrar interacción", icon: MessageSquarePlus },
    { id: "seguimiento", label: "Programar seguimiento", icon: CalendarPlus },
    { id: "venta", label: "Registrar venta", icon: TrendingUp },
  ];

type Toast = { message: string; action?: { label: string; onClick: () => void } };

type Interaccion = {
  _id: Id<"interacciones">;
  _creationTime: number;
  fecha: string;
  canal: CanalInteraccion;
  texto: string;
  autorNombre?: string;
};

type SeguimientoHecho = {
  _id: Id<"seguimientos">;
  _creationTime: number;
  accion: string;
  fecha: string;
  responsableNombre?: string;
};

type Venta = {
  _id: Id<"ventas">;
  _creationTime: number;
  fecha: string;
  concepto: string;
  importe: number;
  estado: EstadoVenta;
  autorNombre?: string;
};

type Pendiente = {
  _id: Id<"seguimientos">;
  accion: string;
  vence: string;
  responsableNombre?: string;
};

/** Un item del historial, venga de donde venga. */
type ItemHistorial =
  | ({ tipo: "interaccion" } & Interaccion)
  | ({ tipo: "seguimiento" } & SeguimientoHecho)
  | ({ tipo: "venta" } & Venta);

/** Seguimientos pendientes del cliente (F8), con su chip Atrasado/Pendiente. */
function SeguimientosPendientes({
  pendientes,
  onHecho,
}: {
  pendientes: Pendiente[] | undefined;
  onHecho: (id: Id<"seguimientos">) => void;
}) {
  if (pendientes === undefined) {
    return (
      <Card title="Seguimientos pendientes">
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} width="100%" height={40} />
          ))}
        </div>
      </Card>
    );
  }

  if (pendientes.length === 0) {
    return (
      <Card title="Seguimientos pendientes">
        <p className="py-1.5 text-[14px] text-text-muted">
          Sin seguimientos pendientes.
        </p>
      </Card>
    );
  }

  const hoy = hoyLocalISO();
  return (
    <Card title="Seguimientos pendientes">
      <div className="flex flex-col">
        {pendientes.map((p) => {
          const { texto, atrasado } = etiquetaVencimiento(p.vence, hoy);
          return (
            <div key={p._id} className="flex items-center gap-3 py-[11px]">
              <button
                type="button"
                onClick={() => onHecho(p._id)}
                aria-label={`Marcar como hecho: ${p.accion}`}
                className="group flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border-strong transition-colors hover:border-primary"
              >
                <Check className="size-3 text-primary opacity-0 transition-opacity group-hover:opacity-50" />
              </button>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-medium text-text">
                  {p.accion}
                </span>
                <span
                  className={cn(
                    "text-[13px]",
                    atrasado ? "text-error-text" : "text-text-muted",
                  )}
                >
                  {texto}
                </span>
              </div>
              {p.responsableNombre && (
                // Avatar es aria-hidden: el nombre se expone aparte.
                <span title={p.responsableNombre} className="shrink-0">
                  <Avatar
                    name={p.responsableNombre}
                    variant="neutral"
                    size={22}
                  />
                  <span className="sr-only">
                    Responsable: {p.responsableNombre}
                  </span>
                </span>
              )}
              <Badge status={atrasado ? "error" : "warning"} className="shrink-0">
                {atrasado ? "Atrasado" : "Pendiente"}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * "Hoy · 8 jul", "Hace 4 semanas · 8 jun". Para una fecha futura `relativeLabel`
 * ya devuelve el día, así que se evita el redundante "9 jul · 9 jul".
 */
function fechaHistorial(iso: string): string {
  const relativa = relativeLabel(iso);
  const dia = shortDate(iso);
  return relativa === dia ? dia : `${relativa} · ${dia}`;
}

/** Cómo se pinta cada tipo de item. Un solo sitio donde mirar. */
function aspectoDe(item: ItemHistorial) {
  switch (item.tipo) {
    case "interaccion":
      return {
        Icon: CANAL_INTERACCION_ICON[item.canal],
        circulo: "bg-surface-2 text-text-muted",
        titulo: CANAL_INTERACCION_LABEL[item.canal],
        chip: null,
        detalle: item.texto,
        pie: item.autorNombre && `Registrado por ${item.autorNombre}`,
        importe: null,
      };
    case "seguimiento":
      return {
        Icon: Check,
        circulo: "bg-primary-subtle text-primary",
        titulo: item.accion,
        chip: null,
        detalle: "Seguimiento completado",
        pie: item.responsableNombre && `Responsable: ${item.responsableNombre}`,
        importe: null,
      };
    case "venta":
      return {
        Icon: TrendingUp,
        circulo: ESTADO_VENTA_ICONO[item.estado],
        titulo: item.concepto,
        chip: (
          <Badge status={ESTADO_VENTA_BADGE[item.estado]}>
            {ESTADO_VENTA_LABEL[item.estado]}
          </Badge>
        ),
        detalle: null,
        pie: item.autorNombre && `Registrado por ${item.autorNombre}`,
        importe: (
          <span
            className={cn(
              "font-mono text-[14px] font-semibold tabular-nums",
              ESTADO_VENTA_IMPORTE[item.estado],
            )}
          >
            {formatMoneda(item.importe)}
          </span>
        ),
      };
  }
}

/** Una fila del historial: interacción, venta o seguimiento completado. */
function ItemHistorialFila({
  item,
  onEditarVenta,
}: {
  item: ItemHistorial;
  onEditarVenta: (venta: Venta) => void;
}) {
  const { Icon, circulo, titulo, chip, detalle, pie, importe } = aspectoDe(item);

  const contenido = (
    <>
      <span
        className={cn(
          "flex size-[34px] shrink-0 items-center justify-center rounded-full",
          circulo,
        )}
      >
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <span className="text-[15px] font-medium text-text">{titulo}</span>
        {chip}
        {detalle && (
          <span className="text-[13px] text-text-muted">{detalle}</span>
        )}
        {pie && <span className="text-[12px] text-text-subtle">{pie}</span>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        {importe}
        <span className="whitespace-nowrap text-[12px] text-text-subtle">
          {fechaHistorial(item.fecha)}
        </span>
      </div>
    </>
  );

  const clase = "flex w-full items-start gap-3 border-t border-border py-3";

  // Solo las ventas se editan (TAL-13: pasar una oportunidad a ganada o perdida).
  if (item.tipo === "venta") {
    return (
      <button
        type="button"
        onClick={() => onEditarVenta(item)}
        aria-label={`Editar venta: ${item.concepto}`}
        className={cn(
          clase,
          "cursor-pointer text-left transition-colors hover:bg-surface-2",
        )}
      >
        {contenido}
      </button>
    );
  }

  return <div className={clase}>{contenido}</div>;
}

/**
 * Historial del cliente (F2, TAL-14), en orden cronológico descendente. Combina
 * interacciones, ventas y —si se pide con el check— seguimientos completados.
 *
 * `fecha` no lleva hora, así que dentro de un mismo día desempata `_creationTime`;
 * sin él, el orden lo decidiría el azar de en qué lista va cada item.
 */
function Historial({
  interacciones,
  ventas,
  completados,
  mostrarCompletados,
  onMostrarCompletados,
  onEditarVenta,
}: {
  interacciones: { items: Interaccion[]; truncado: boolean } | undefined;
  ventas: { items: Venta[]; truncado: boolean } | undefined;
  completados: { items: SeguimientoHecho[]; truncado: boolean } | undefined;
  mostrarCompletados: boolean;
  onMostrarCompletados: (v: boolean) => void;
  onEditarVenta: (venta: Venta) => void;
}) {
  const check = (
    <Checkbox
      label="Mostrar completados"
      checked={mostrarCompletados}
      onChange={(e) => onMostrarCompletados(e.target.checked)}
    />
  );

  // Con el check activo, `undefined` es "cargando", no "no hay ninguno": mezclar
  // ya haría parpadear la lista como si el cliente no tuviera seguimientos.
  const cargando =
    interacciones === undefined ||
    ventas === undefined ||
    (mostrarCompletados && completados === undefined);

  if (cargando) {
    return (
      <Card title="Historial" action={check}>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={44} />
          ))}
        </div>
      </Card>
    );
  }

  const items: ItemHistorial[] = [
    ...interacciones.items.map((i) => ({ tipo: "interaccion" as const, ...i })),
    ...ventas.items.map((v) => ({ tipo: "venta" as const, ...v })),
    ...(mostrarCompletados && completados
      ? completados.items.map((s) => ({ tipo: "seguimiento" as const, ...s }))
      : []),
  ].sort(
    (a, b) =>
      b.fecha.localeCompare(a.fecha) || b._creationTime - a._creationTime,
  );

  const truncado =
    interacciones.truncado ||
    ventas.truncado ||
    (mostrarCompletados && !!completados?.truncado);

  if (items.length === 0) {
    return (
      <Card title="Historial" action={check} padding="none">
        <EmptyState
          icon={<MessageSquare className="size-6" aria-hidden />}
          title="Sin actividad todavía"
          help="Anota una interacción, registra una venta o programa un seguimiento para empezar el historial."
        />
      </Card>
    );
  }

  return (
    <Card title="Historial" action={check}>
      <div className="flex flex-col">
        {items.map((item) => (
          <ItemHistorialFila
            key={`${item.tipo}-${item._id}`}
            item={item}
            onEditarVenta={onEditarVenta}
          />
        ))}
      </div>
      {truncado && (
        <p className="border-t border-border pt-3 text-[12px] text-text-subtle">
          Mostrando solo la actividad más reciente.
        </p>
      )}
    </Card>
  );
}

export function FichaClienteClient({
  id,
  justCreated,
}: {
  id: string;
  justCreated: boolean;
}) {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const cliente = useQuery(
    api.clientes.obtener,
    isAuthenticated ? { id } : "skip",
  );
  const historial = useQuery(
    api.interacciones.listarPorCliente,
    cliente ? { clienteId: cliente._id } : "skip",
  );
  const ventas = useQuery(
    api.ventas.listarPorCliente,
    cliente ? { clienteId: cliente._id } : "skip",
  );
  const pendientes = useQuery(
    api.seguimientos.pendientesDeCliente,
    cliente ? { clienteId: cliente._id } : "skip",
  );

  const [editando, setEditando] = useState(false);
  const [accion, setAccion] = useState<Accion | null>(null);
  // La venta que se está editando. `null` = el overlay de venta, si está abierto,
  // es un alta. Se limpia siempre al cerrar.
  const [ventaEditando, setVentaEditando] = useState<Venta | null>(null);
  const [mostrarCompletados, setMostrarCompletados] = useState(false);
  // Con el check apagado ni se pide: el historial no los va a mostrar.
  const completados = useQuery(
    api.seguimientos.completadosDeCliente,
    cliente && mostrarCompletados ? { clienteId: cliente._id } : "skip",
  );

  const marcarHecho = useMutation(api.seguimientos.marcarHecho);
  const deshacer = useMutation(api.seguimientos.deshacer);

  // Init perezosa: si venimos del alta mostramos el toast desde el estado inicial
  // (no con un setState en efecto, que rompería react-hooks/set-state-in-effect).
  const [toast, setToast] = useState<Toast | null>(() =>
    justCreated ? { message: "Cliente añadido" } : null,
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  // Limpia el ?nuevo=1 de la URL (efecto separado, sin setState).
  useEffect(() => {
    if (justCreated) router.replace(`/clientes/${id}`);
  }, [justCreated, id, router]);

  function abrirEdicionVenta(venta: Venta) {
    setVentaEditando(venta);
    setAccion("venta");
  }

  function cerrarVenta() {
    setAccion(null);
    setVentaEditando(null);
  }

  async function onHecho(idSeguimiento: Id<"seguimientos">) {
    try {
      await marcarHecho({ id: idSeguimiento, fechaHecho: hoyLocalISO() });
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
            await deshacer({ id: idSeguimiento });
          } catch (e) {
            setToast({ message: mensajeError(e, "No se pudo deshacer.") });
          }
        },
      },
    });
  }

  return (
    <>
      {cliente === undefined ? (
        <FichaSkeleton />
      ) : cliente === null ? (
        <Card padding="none">
          <EmptyState
            icon={<Users className="size-6" aria-hidden />}
            title="Cliente no encontrado"
            help="Puede que se haya eliminado o que el enlace no sea válido."
            action={
              <Button size="compact" onClick={() => router.push("/clientes")}>
                Volver a clientes
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="compact"
              iconLeft={<Pencil className="size-4" aria-hidden />}
              onClick={() => setEditando(true)}
            >
              Editar
            </Button>
          </div>

          <Card>
            <div className="flex flex-col gap-3.5">
              <div className="flex items-start gap-3.5">
                <Avatar name={cliente.nombre} size={52} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h1 className="text-[19px] font-semibold leading-tight text-text">
                    {cliente.nombre}
                  </h1>
                  {cliente.empresa && (
                    <p className="text-[14px] text-text-muted">
                      {cliente.empresa}
                    </p>
                  )}
                </div>
                <Badge
                  status={ESTADO_BADGE[cliente.estado]}
                  className="shrink-0"
                >
                  {STATUS_LABELS[ESTADO_BADGE[cliente.estado]]}
                </Badge>
              </div>

              {cliente.canalOrigen && (
                <div>
                  <Badge status="neutral" dot={false}>
                    Origen: {CANAL_LABEL[cliente.canalOrigen]}
                  </Badge>
                </div>
              )}

              {(cliente.telefono || cliente.email) && (
                <div className="flex flex-col border-t border-border">
                  {cliente.telefono && (
                    <a
                      href={`tel:${cliente.telefono.replace(/\s+/g, "")}`}
                      className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
                    >
                      <Phone
                        className="size-[18px] shrink-0 text-text-subtle"
                        aria-hidden
                      />
                      <span className="w-[68px] shrink-0 text-[13px] text-text-subtle">
                        Teléfono
                      </span>
                      <span className="min-w-0 flex-1 text-[14px] text-text">
                        {cliente.telefono}
                      </span>
                    </a>
                  )}
                  {cliente.email && (
                    <a
                      href={`mailto:${cliente.email}`}
                      className="flex items-center gap-3 py-3"
                    >
                      <Mail
                        className="size-[18px] shrink-0 text-text-subtle"
                        aria-hidden
                      />
                      <span className="w-[68px] shrink-0 text-[13px] text-text-subtle">
                        Email
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px] text-text">
                        {cliente.email}
                      </span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </Card>

          <div className="flex flex-col gap-3 md:flex-row">
            {ACCIONES.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAccion(a.id)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-[14px] font-medium text-text transition-colors hover:bg-surface-2"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary-subtle text-primary">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  {a.label}
                </button>
              );
            })}
          </div>

          <SeguimientosPendientes pendientes={pendientes} onHecho={onHecho} />

          <Historial
            interacciones={historial}
            ventas={ventas}
            completados={completados}
            mostrarCompletados={mostrarCompletados}
            onMostrarCompletados={setMostrarCompletados}
            onEditarVenta={abrirEdicionVenta}
          />

          <RegistrarInteraccionOverlay
            open={accion === "interaccion"}
            onClose={() => setAccion(null)}
            clienteId={cliente._id}
            onSaved={() => setToast({ message: "Interacción registrada" })}
          />

          <ProgramarSeguimientoOverlay
            open={accion === "seguimiento"}
            onClose={() => setAccion(null)}
            clienteId={cliente._id}
            onSaved={() => setToast({ message: "Seguimiento programado" })}
          />

          {/* Montado solo cuando está abierto, y con `key` por venta: el overlay
              se inicializa una vez, así que si no se remonta reabriría con los
              datos de la venta anterior. */}
          {accion === "venta" && (
            <RegistrarVentaOverlay
              key={ventaEditando?._id ?? "nueva"}
              open
              onClose={cerrarVenta}
              clienteId={cliente._id}
              venta={ventaEditando ?? undefined}
              onSaved={(modo) =>
                setToast({
                  message:
                    modo === "edicion" ? "Venta actualizada" : "Venta registrada",
                })
              }
            />
          )}

          {editando && (
            <EditarClienteOverlay
              cliente={{
                _id: cliente._id,
                nombre: cliente.nombre,
                empresa: cliente.empresa,
                telefono: cliente.telefono,
                email: cliente.email,
              }}
              onClose={() => setEditando(false)}
              onSaved={() => setToast({ message: "Cambios guardados" })}
            />
          )}
        </div>
      )}

      {toast && <Toast message={toast.message} action={toast.action} />}
    </>
  );
}

function FichaSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Skeleton width={92} height={44} radius={8} />
      </div>
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3.5">
            <Skeleton width={52} height={52} radius={9999} />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <Skeleton width="52%" height={18} />
              <Skeleton width="34%" height={13} />
            </div>
          </div>
          <Skeleton width="100%" height={44} />
          <Skeleton width="100%" height={44} />
        </div>
      </Card>
      <div className="flex flex-col gap-3 md:flex-row">
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            width="100%"
            height={50}
            radius={12}
            className="flex-1"
          />
        ))}
      </div>
      <Skeleton width="100%" height={110} radius={12} />
      <Skeleton width="100%" height={180} radius={12} />
    </div>
  );
}
