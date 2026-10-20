"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/convexApi";
import { Overlay } from "@/components/ui/Overlay";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { mensajeError } from "@/lib/errores";

interface Props {
  onClose: () => void;
  onHecho: (mensaje: string) => void;
}

/** Mismo mínimo que aplica el servidor (`validarContrasena` en contrasenas.ts). */
const MINIMO = 8;

/**
 * Cambiar contraseña (TAL-61, D13).
 *
 * Las comprobaciones de aquí son de cortesía —evitan un viaje para algo que se
 * ve a simple vista—, pero la política de verdad vive en el servidor: longitud
 * mínima y lista de contraseñas adivinables (TAL-69). Por eso los errores del
 * servidor se muestran tal cual: son los que explican por qué `12345678` no
 * vale aunque tenga ocho caracteres.
 */
export function CambiarContrasenaOverlay({ onClose, onHecho }: Props) {
  const cambiar = useAction(api.cuenta.cambiarContrasena);

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function enviar() {
    setError(null);
    if (!actual) {
      setError("Escribe tu contraseña actual.");
      return;
    }
    if (nueva.length < MINIMO) {
      setError(`La contraseña nueva debe tener al menos ${MINIMO} caracteres.`);
      return;
    }
    if (nueva !== repetida) {
      setError("Las dos contraseñas nuevas no coinciden.");
      return;
    }
    setGuardando(true);
    try {
      await cambiar({ actual, nueva });
      onHecho("Contraseña cambiada. Cerramos sesión en tus otros dispositivos.");
      onClose();
    } catch (e) {
      setError(mensajeError(e, "No se pudo cambiar la contraseña."));
      setGuardando(false);
    }
  }

  return (
    <Overlay
      open
      onClose={onClose}
      title="Cambiar contraseña"
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
            Cambiar contraseña
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
          label="Contraseña actual"
          type="password"
          autoComplete="current-password"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          autoFocus
          required
        />

        <Input
          label="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          helper={`Al menos ${MINIMO} caracteres, y que no sea fácil de adivinar.`}
          required
        />

        <Input
          label="Repite la contraseña nueva"
          type="password"
          autoComplete="new-password"
          value={repetida}
          onChange={(e) => setRepetida(e.target.value)}
          required
        />
      </div>
    </Overlay>
  );
}
