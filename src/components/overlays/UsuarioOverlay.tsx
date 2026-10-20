"use client";

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { AlertCircle, Mail } from "lucide-react";
import { api, type Id } from "@/lib/convexApi";
import { Overlay } from "@/components/ui/Overlay";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { ConfirmarOverlay } from "@/components/overlays/ConfirmarOverlay";
import { mensajeError } from "@/lib/errores";
import { ROL_OPCIONES, type Rol } from "@/lib/roles";

interface Persona {
  _id: Id<"users">;
  name?: string;
  email?: string;
  rol: Rol;
}

interface Props {
  /** Sin persona = alta; con persona = edición. */
  persona?: Persona;
  /** `true` si la persona editada es quien está usando el panel. */
  soyYo?: boolean;
  onClose: () => void;
  onHecho: (mensaje: string) => void;
}

/**
 * Alta y edición de una persona del equipo (TAL-60, D12), en el mismo
 * componente porque los campos son idénticos y solo cambia a dónde se manda.
 *
 * En el alta NO se pide contraseña, y no es un olvido: la persona recibe una
 * invitación por correo y elige la suya con un código. Así la dueña nunca llega
 * a conocer la contraseña de nadie.
 *
 * Se monta solo al abrir, así el `useState` perezoso precarga los datos actuales
 * sin sincronizar estado en un efecto (evita `react-hooks/set-state-in-effect`).
 */
export function UsuarioOverlay({
  persona,
  soyYo = false,
  onClose,
  onHecho,
}: Props) {
  const invitar = useAction(api.usuarios.invitar);
  const actualizar = useMutation(api.usuarios.actualizar);

  const esAlta = persona === undefined;
  const [nombre, setNombre] = useState(() => persona?.name ?? "");
  const [email, setEmail] = useState(() => persona?.email ?? "");
  const [rol, setRol] = useState<Rol>(() => persona?.rol ?? "comercial");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmandoAscenso, setConfirmandoAscenso] = useState(false);

  /**
   * Convertir a alguien en dueña es la acción que más privilegio concede de todo
   * el CRM: gestiona al equipo entero y puede retirarle el acceso a quien la
   * ascendió. Retirar un acceso ya pedía confirmación; esto no, y se hacía
   * pulsando un chip (TAL-69, S11).
   *
   * Solo en edición: en el alta, el rol se elige a la vez que se crea a la
   * persona y el propio formulario ya es el acto deliberado.
   */
  const asciendeADuena =
    !esAlta && persona.rol !== "propietaria" && rol === "propietaria";

  async function guardar() {
    setError(null);
    if (!nombre.trim()) {
      setError("Indica el nombre de la persona.");
      return;
    }
    if (!email.trim()) {
      setError("Indica su correo.");
      return;
    }
    if (asciendeADuena && !confirmandoAscenso) {
      setConfirmandoAscenso(true);
      return;
    }
    setGuardando(true);
    try {
      if (esAlta) {
        await invitar({ nombre: nombre.trim(), email: email.trim(), rol });
        onHecho("Usuario añadido. Le enviaremos la invitación por correo.");
      } else {
        await actualizar({
          id: persona._id,
          nombre: nombre.trim(),
          email: email.trim(),
          rol,
        });
        onHecho("Usuario actualizado");
      }
      onClose();
    } catch (e) {
      // Las reglas del servidor (correo repetido, última dueña, correo que ya
      // identifica otra cuenta) llegan con su propio texto y hay que enseñarlo:
      // son justo lo que la persona necesita saber para corregir.
      setError(mensajeError(e, "No se pudo guardar. Revisa los datos."));
      setGuardando(false);
    }
  }

  if (confirmandoAscenso) {
    return (
      <ConfirmarOverlay
        titulo="Hacerla dueña"
        textoConfirmar="Sí, hacerla dueña"
        onConfirmar={guardar}
        onClose={() => setConfirmandoAscenso(false)}
      >
        <>
          <strong className="font-semibold text-text">
            {nombre.trim() || "Esta persona"}
          </strong>{" "}
          podrá gestionar el equipo entero: dar de alta, cambiar roles y retirar
          el acceso a cualquiera, incluida tú.
        </>
      </ConfirmarOverlay>
    );
  }

  return (
    <Overlay
      open
      onClose={onClose}
      title={esAlta ? "Añadir usuario" : "Editar usuario"}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="compact"
            onClick={onClose}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button size="compact" loading={guardando} onClick={guardar}>
            {esAlta ? "Añadir usuario" : "Guardar cambios"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-error bg-error-bg px-3 py-2.5 text-[13px] text-error-text"
          >
            <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre y apellidos"
          autoCapitalize="words"
          autoFocus
          required
        />

        {/* El correo PROPIO no se cambia desde aquí (TAL-61): en "Mi cuenta" se
            pide la contraseña actual, y sin este bloqueo la dueña tendría en
            /equipo un atajo que se salta esa comprobación. El servidor lo
            rechaza igualmente; esto solo evita escribir un cambio que no se va
            a poder guardar. */}
        <Input
          label="Correo"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@empresa.com"
          readOnly={soyYo}
          helper={
            soyYo
              ? "Tu propio correo se cambia desde Mi cuenta, escribiendo tu contraseña."
              : undefined
          }
          className={soyYo ? "bg-surface-2 text-text-muted" : undefined}
          required
        />

        <ChipGroup
          label="Rol"
          options={ROL_OPCIONES}
          value={rol}
          // El rol es obligatorio: pulsar el chip activo no lo deselecciona.
          onChange={(v) => setRol(v ?? rol)}
        />

        {esAlta && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-[13px] text-text-muted"
          >
            <Mail className="mt-px size-4 shrink-0" aria-hidden />
            <span>
              Le enviaremos un correo para que configure su contraseña. No hace
              falta que le des ninguna.
            </span>
          </div>
        )}
      </div>
    </Overlay>
  );
}
