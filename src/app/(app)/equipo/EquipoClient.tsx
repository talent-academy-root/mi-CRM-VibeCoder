"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { Pencil, Plus, UserMinus, UserPlus } from "lucide-react";
import { api, type Id } from "@/lib/convexApi";
import { cn } from "@/lib/utils";
import { ROL_LABEL, type Rol } from "@/lib/roles";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { UsuarioOverlay } from "@/components/overlays/UsuarioOverlay";
import { ConfirmarOverlay } from "@/components/overlays/ConfirmarOverlay";

type Miembro = {
  _id: Id<"users">;
  name?: string;
  email?: string;
  rol: Rol;
  activo: boolean;
  pendiente: boolean;
  caducada: boolean;
};

/**
 * Panel de equipo (TAL-60, diseño D12). Solo llega aquí la dueña: el gate real
 * está en el servidor, en `equipo/page.tsx` y en cada función de Convex.
 *
 * "Desactivar" en vez de "eliminar", y no es un atajo: el nombre de cada
 * persona está pegado a las interacciones, ventas y seguimientos que registró.
 * Borrarla dejaría ese historial sin autor y tareas pendientes sin responsable.
 * Al desactivar pierde el acceso y conserva su rastro.
 *
 * Las reglas que protegen el CRM (no desactivarte a ti misma, no dejar el
 * negocio sin dueña) se comprueban en el servidor. Aquí solo se ocultan los
 * botones que no llevarían a ninguna parte.
 */
export function EquipoClient({ yoId }: { yoId: Id<"users"> }) {
  const equipo = useQuery(api.usuarios.listarEquipo);
  const desactivar = useAction(api.usuarios.desactivar);
  const reactivar = useAction(api.usuarios.reactivar);

  const [editando, setEditando] = useState<Miembro | null>(null);
  const [creando, setCreando] = useState(false);
  const [desactivando, setDesactivando] = useState<Miembro | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function avisar(mensaje: string) {
    setToast(mensaje);
    setTimeout(() => setToast(null), 3500);
  }

  const dueñasActivas =
    equipo?.filter((m) => m.rol === "propietaria" && m.activo).length ?? 0;

  /**
   * Se puede retirar el acceso salvo a una misma y salvo a la última dueña que
   * queda activa. Mismo criterio que aplica el servidor.
   */
  function sePuedeDesactivar(m: Miembro): boolean {
    if (m._id === yoId) return false;
    if (m.rol === "propietaria" && dueñasActivas <= 1) return false;
    return true;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-subtle">
            Gestión del equipo
          </span>
          <h1 className="text-2xl font-semibold tracking-[-0.011em] text-text">
            Quién usa el CRM
          </h1>
        </div>
        <Button
          size="compact"
          iconLeft={<Plus className="size-[18px]" aria-hidden />}
          onClick={() => setCreando(true)}
          className="shrink-0"
        >
          Añadir usuario
        </Button>
      </div>

      {equipo === undefined ? (
        <Card padding="none">
          <div className="flex flex-col gap-3 p-4.5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="flex flex-col">
            {equipo.map((m) => (
              <div
                key={m._id}
                className="flex items-center gap-3 border-b border-border px-4.5 py-3 last:border-b-0"
              >
                <Avatar
                  name={m.name ?? "?"}
                  variant={m.rol === "propietaria" ? "primary" : "neutral"}
                  size={40}
                  className={cn(!m.activo && "opacity-50")}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={cn(
                      "truncate text-[15px] font-medium text-text",
                      !m.activo && "text-text-muted",
                    )}
                  >
                    {m.name ?? "Sin nombre"}
                    {m._id === yoId && (
                      <span className="ml-1.5 text-[13px] font-normal text-text-subtle">
                        (tú)
                      </span>
                    )}
                  </span>
                  <span className="truncate text-[13px] text-text-muted">
                    {m.email ?? "Sin correo"}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {!m.activo ? (
                    <Badge status="neutral">Sin acceso</Badge>
                  ) : (
                    <>
                      {m.pendiente && (
                        <Badge status="warning">Pendiente de entrar</Badge>
                      )}
                      {/* Invitada hace más de dos semanas y todavía sin entrar.
                          No está bloqueada: puede acceder con «He olvidado mi
                          contraseña». Se distingue para que la dueña sepa que
                          aquí ya no basta con esperar. */}
                      {m.caducada && (
                        <Badge status="neutral">Invitación caducada</Badge>
                      )}
                      <Badge
                        status={m.rol === "propietaria" ? "primary" : "neutral"}
                      >
                        {ROL_LABEL[m.rol]}
                      </Badge>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  aria-label={`Editar a ${m.name ?? "esta persona"}`}
                  onClick={() => setEditando(m)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-2"
                >
                  <Pencil className="size-[18px]" aria-hidden />
                </button>

                {m.activo ? (
                  sePuedeDesactivar(m) && (
                    <button
                      type="button"
                      aria-label={`Retirar el acceso a ${m.name ?? "esta persona"}`}
                      onClick={() => setDesactivando(m)}
                      className="flex size-9 shrink-0 items-center justify-center rounded-md text-text-subtle hover:bg-error-bg hover:text-error-text"
                    >
                      <UserMinus className="size-[18px]" aria-hidden />
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    aria-label={`Devolver el acceso a ${m.name ?? "esta persona"}`}
                    onClick={async () => {
                      await reactivar({ id: m._id });
                      avisar("Acceso devuelto");
                    }}
                    className="flex size-9 shrink-0 items-center justify-center rounded-md text-text-subtle hover:bg-surface-2 hover:text-primary"
                  >
                    <UserPlus className="size-[18px]" aria-hidden />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {creando && (
        <UsuarioOverlay onClose={() => setCreando(false)} onHecho={avisar} />
      )}

      {editando !== null && (
        <UsuarioOverlay
          persona={editando}
          soyYo={editando._id === yoId}
          onClose={() => setEditando(null)}
          onHecho={avisar}
        />
      )}

      {desactivando !== null && (
        <ConfirmarOverlay
          titulo="Retirar el acceso"
          textoConfirmar="Retirar acceso"
          destructivo
          onConfirmar={async () => {
            await desactivar({ id: desactivando._id });
            avisar("Acceso retirado");
          }}
          onClose={() => setDesactivando(null)}
        >
          <>
            <strong className="font-semibold text-text">
              {desactivando.name ?? "Esta persona"}
            </strong>{" "}
            dejará de poder entrar en el CRM y se cerrará su sesión en todos sus
            dispositivos. Su nombre seguirá apareciendo en lo que ya registró, y
            puedes devolverle el acceso cuando quieras.
          </>
        </ConfirmarOverlay>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
