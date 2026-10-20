"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { ChevronRight, Lock, LogOut, Pencil } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { ConfirmarOverlay } from "@/components/overlays/ConfirmarOverlay";
import { MisDatosOverlay } from "@/components/overlays/MisDatosOverlay";
import { CambiarContrasenaOverlay } from "@/components/overlays/CambiarContrasenaOverlay";
import { useUsuarioActual } from "@/lib/useSesion";
import { ROL_LABEL } from "@/lib/roles";

/**
 * Perfil / Mi cuenta (TAL-61, diseño D13): quién eres y las tres cosas que
 * puedes hacer con tu cuenta sin pedírselo a nadie.
 *
 * Los dos overlays se montan solo al abrirse para que su `useState` perezoso
 * precargue los datos actuales sin sincronizar estado en un efecto, igual que
 * `UsuarioOverlay`.
 */
export function CuentaClient() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const user = useUsuarioActual();

  const [editandoDatos, setEditandoDatos] = useState(false);
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function avisar(mensaje: string) {
    setToast(mensaje);
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-subtle">
          Mi cuenta
        </span>
        <h1 className="text-2xl font-semibold tracking-[-0.011em] text-text">
          Perfil
        </h1>
      </div>

      {user === undefined ? (
        <Card>
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-4">
            <Avatar name={user.name ?? "?"} size={56} />
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="truncate text-[19px] font-semibold tracking-[-0.011em] text-text">
                {user.name ?? "Sin nombre"}
              </span>
              <span className="truncate text-[13px] text-text-muted">
                {user.email ?? "Sin correo"}
              </span>
              <span>
                <Badge
                  status={user.rol === "propietaria" ? "primary" : "neutral"}
                >
                  {ROL_LABEL[user.rol]}
                </Badge>
              </span>
            </div>
          </div>
        </Card>
      )}

      <Card padding="none">
        <div className="flex flex-col">
          <FilaOpcion
            icon={<Pencil className="size-[18px]" aria-hidden />}
            texto="Editar mis datos"
            disabled={user === undefined}
            onClick={() => setEditandoDatos(true)}
          />
          <FilaOpcion
            icon={<Lock className="size-[18px]" aria-hidden />}
            texto="Cambiar contraseña"
            disabled={user === undefined}
            onClick={() => setCambiandoPass(true)}
            ultima
          />
        </div>
      </Card>

      <button
        type="button"
        onClick={() => setCerrandoSesion(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface text-[15px] font-semibold text-error-text hover:bg-error-bg"
      >
        <LogOut className="size-[18px]" aria-hidden />
        Cerrar sesión
      </button>

      {editandoDatos && user !== undefined && (
        <MisDatosOverlay
          nombreActual={user.name ?? ""}
          emailActual={user.email ?? ""}
          onClose={() => setEditandoDatos(false)}
          onHecho={avisar}
        />
      )}

      {cambiandoPass && (
        <CambiarContrasenaOverlay
          onClose={() => setCambiandoPass(false)}
          onHecho={avisar}
        />
      )}

      {cerrandoSesion && (
        <ConfirmarOverlay
          titulo="Cerrar sesión"
          textoConfirmar="Cerrar sesión"
          destructivo
          onConfirmar={async () => {
            // Este orden importa: cerrar la sesión ANTES de navegar. Al revés,
            // el token seguiría vivo y `src/proxy.ts` rebotaría de vuelta a
            // /hoy. Mismo patrón que el Sidebar.
            await signOut();
            router.replace("/login");
          }}
          onClose={() => setCerrandoSesion(false)}
        >
          Se cerrará tu sesión en este dispositivo y volverás a la pantalla de
          acceso.
        </ConfirmarOverlay>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}

/** Fila-botón de la lista de opciones (icono · texto · chevron), como en D13. */
function FilaOpcion({
  icon,
  texto,
  onClick,
  disabled = false,
  ultima = false,
}: {
  icon: React.ReactNode;
  texto: string;
  onClick: () => void;
  disabled?: boolean;
  ultima?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "flex h-[52px] w-full items-center gap-3 px-4.5 text-left text-[15px] text-text hover:bg-surface-2 disabled:opacity-50 disabled:hover:bg-transparent" +
        (ultima ? "" : " border-b border-border")
      }
    >
      <span className="shrink-0 text-text-subtle">{icon}</span>
      <span className="min-w-0 flex-1">{texto}</span>
      <ChevronRight className="size-[18px] shrink-0 text-text-subtle" aria-hidden />
    </button>
  );
}
