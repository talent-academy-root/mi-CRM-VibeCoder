"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { api } from "@/lib/convexApi";
import { Overlay } from "@/components/ui/Overlay";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { mensajeError } from "@/lib/errores";

interface Props {
  nombreActual: string;
  emailActual: string;
  onClose: () => void;
  onHecho: (mensaje: string) => void;
}

/** La misma forma canónica que aplica el servidor (`canonico` en identidad.ts). */
function canonico(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Editar mis datos (TAL-61, D13): nombre y correo.
 *
 * El campo de contraseña aparece SOLO si el correo cambia de verdad, y el
 * servidor exige lo mismo. Cambiar el correo es cambiar la identidad de acceso
 * —es la dirección a la que llega el código de recuperación—, así que se pide
 * una prueba de que quien lo hace es la persona y no alguien que se ha
 * encontrado la sesión abierta. Corregir el nombre no abre ninguna puerta y no
 * pide nada: pedir la contraseña para arreglar una tilde solo enseñaría a
 * escribirla sin pensar.
 *
 * La comparación es canónica para que un espacio de más o una mayúscula no
 * hagan aparecer el campo sin motivo.
 */
export function MisDatosOverlay({
  nombreActual,
  emailActual,
  onClose,
  onHecho,
}: Props) {
  const guardar = useAction(api.cuenta.guardarMisDatos);

  const [nombre, setNombre] = useState(() => nombreActual);
  const [email, setEmail] = useState(() => emailActual);
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiaElCorreo = canonico(email) !== canonico(emailActual);

  async function enviar() {
    setError(null);
    if (!nombre.trim()) {
      setError("Indica tu nombre.");
      return;
    }
    if (!email.trim()) {
      setError("Indica tu correo.");
      return;
    }
    if (cambiaElCorreo && !contrasena) {
      setError("Escribe tu contraseña actual para cambiar el correo.");
      return;
    }
    setGuardando(true);
    try {
      await guardar({
        nombre: nombre.trim(),
        email: email.trim(),
        // Solo viaja cuando hace falta: no tiene sentido mandar la contraseña
        // por la red para corregir un nombre.
        contrasenaActual: cambiaElCorreo ? contrasena : undefined,
      });
      onHecho(
        cambiaElCorreo
          ? "Datos guardados. A partir de ahora entras con tu correo nuevo."
          : "Datos guardados",
      );
      onClose();
    } catch (e) {
      // Los mensajes del servidor (contraseña incorrecta, correo de otra
      // persona, demasiados intentos) son justo lo que hace falta leer para
      // corregir, así que se enseñan tal cual y sin cerrar el overlay.
      setError(mensajeError(e, "No se pudo guardar. Revisa los datos."));
      setGuardando(false);
    }
  }

  return (
    <Overlay
      open
      onClose={onClose}
      title="Editar mis datos"
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
          <Button size="compact" loading={guardando} onClick={enviar}>
            Guardar cambios
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

        <Input
          label="Correo"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@empresa.com"
          required
        />

        {cambiaElCorreo && (
          <>
            <div
              role="status"
              className="flex items-start gap-2 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-[13px] text-text-muted"
            >
              <ShieldCheck className="mt-px size-4 shrink-0" aria-hidden />
              <span>
                Vas a cambiar el correo con el que entras. Escribe tu contraseña
                para confirmar que eres tú, y avisaremos a tu correo anterior.
              </span>
            </div>
            <Input
              label="Contraseña actual"
              type="password"
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </>
        )}
      </div>
    </Overlay>
  );
}
