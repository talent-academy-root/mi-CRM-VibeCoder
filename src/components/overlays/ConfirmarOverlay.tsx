"use client";

import { useState, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Overlay } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { mensajeError } from "@/lib/errores";

interface Props {
  titulo: string;
  /** Qué va a pasar, en una frase. Admite <strong> para el nombre. */
  children: ReactNode;
  textoConfirmar: string;
  /** `true` pinta el botón en rojo; para acciones que quitan algo. */
  destructivo?: boolean;
  onConfirmar: () => Promise<void>;
  onClose: () => void;
}

/**
 * Diálogo de confirmación con dos botones (D12). El error se muestra DENTRO del
 * diálogo y no cerrándolo: las reglas del servidor —no puedes retirarte el
 * acceso a ti misma, no puedes dejar el negocio sin dueña— llegan por aquí, y
 * la persona tiene que poder leerlas sin perder el contexto de lo que estaba
 * haciendo.
 */
export function ConfirmarOverlay({
  titulo,
  children,
  textoConfirmar,
  destructivo = false,
  onConfirmar,
  onClose,
}: Props) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setError(null);
    setEnviando(true);
    try {
      await onConfirmar();
      onClose();
    } catch (e) {
      setError(mensajeError(e, "No se pudo completar. Inténtalo de nuevo."));
      setEnviando(false);
    }
  }

  return (
    <Overlay
      open
      onClose={onClose}
      title={titulo}
      footer={
        <div className="flex gap-2.5">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={enviando}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant={destructivo ? "destructive" : "primary"}
            loading={enviando}
            onClick={confirmar}
            className="flex-1"
          >
            {textoConfirmar}
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
        <p className="text-sm leading-relaxed text-text-muted">{children}</p>
      </div>
    </Overlay>
  );
}
