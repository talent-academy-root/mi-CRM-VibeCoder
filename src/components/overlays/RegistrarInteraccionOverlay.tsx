"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, User } from "lucide-react";
import { api, type Id } from "@/lib/convexApi";
import { Overlay } from "@/components/ui/Overlay";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Button } from "@/components/ui/Button";
import { hoyLocalISO } from "@/lib/utils";
import { mensajeError } from "@/lib/errores";
import {
  CANAL_INTERACCION_OPCIONES,
  type CanalInteraccion,
} from "@/lib/canalInteraccion";

const MAX_TEXTO = 2000;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Si viene (desde la ficha), no se pide cliente: ya se sabe cuál es. */
  clienteId?: Id<"clientes">;
  onSaved?: () => void;
}

/**
 * "Registrar interacción" (F7). Una sola pieza para las dos entradas: desde la
 * ficha de un cliente (con `clienteId`) y desde los accesos rápidos de Hoy (con
 * selector de cliente). El autor no es un campo: lo pone el backend.
 */
export function RegistrarInteraccionOverlay({
  open,
  onClose,
  clienteId,
  onSaved,
}: Props) {
  const pideCliente = clienteId === undefined;
  const clientes = useQuery(
    api.clientes.listar,
    open && pideCliente ? {} : "skip",
  );
  const usuario = useQuery(api.usuarios.actual, open ? {} : "skip");
  const crear = useMutation(api.interacciones.crear);

  const notaRef = useRef<HTMLTextAreaElement>(null);
  const [seleccionado, setSeleccionado] = useState("");
  const [canal, setCanal] = useState<CanalInteraccion>("llamada");
  const [fecha, setFecha] = useState(hoyLocalISO());
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function reset() {
    setSeleccionado("");
    setCanal("llamada");
    setFecha(hoyLocalISO());
    setTexto("");
    setError(null);
    setGuardando(false);
  }

  function cerrar() {
    reset();
    onClose();
  }

  async function guardar() {
    setError(null);
    const destino = clienteId ?? (seleccionado as Id<"clientes"> | "");
    if (!destino) {
      setError("Elige un cliente.");
      return;
    }
    if (!texto.trim()) {
      setError("Escribe qué se ha hablado.");
      return;
    }
    if (!fecha) {
      setError("Elige una fecha.");
      return;
    }
    setGuardando(true);
    try {
      await crear({ clienteId: destino, canal, fecha, texto: texto.trim() });
      reset();
      onClose();
      onSaved?.();
    } catch (e) {
      // El backend rechaza fecha futura, nota vacía o demasiado larga con un
      // mensaje ya redactado para la persona; se muestra tal cual.
      setError(mensajeError(e, "No se pudo guardar la interacción."));
      setGuardando(false);
    }
  }

  return (
    <Overlay
      open={open}
      onClose={cerrar}
      title="Registrar interacción"
      initialFocusRef={notaRef}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="compact" onClick={cerrar}>
            Cancelar
          </Button>
          <Button size="compact" loading={guardando} onClick={guardar}>
            Guardar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md border border-error bg-error-bg px-3 py-2.5 text-[13px] text-error-text"
          >
            <AlertCircle className="size-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        {pideCliente && (
          <Select
            label="Cliente"
            value={seleccionado}
            onChange={(e) => setSeleccionado(e.target.value)}
          >
            <option value="">Selecciona un cliente…</option>
            {clientes?.map((c) => (
              <option key={c._id} value={c._id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        )}

        <ChipGroup
          label="Canal"
          options={CANAL_INTERACCION_OPCIONES}
          value={canal}
          // El canal es obligatorio: pulsar el chip activo no lo deselecciona.
          onChange={(v) => v && setCanal(v)}
        />

        <Input
          label="Fecha"
          type="date"
          value={fecha}
          max={hoyLocalISO()}
          onChange={(e) => setFecha(e.target.value)}
        />

        <Textarea
          ref={notaRef}
          label="Nota"
          value={texto}
          maxLength={MAX_TEXTO}
          placeholder="Qué se ha hablado, próximos pasos…"
          onChange={(e) => setTexto(e.target.value)}
          required
        />

        {usuario?.name && (
          <div className="flex items-center gap-2 text-[13px] text-text-muted">
            <User className="size-4 shrink-0 text-text-subtle" aria-hidden />
            <span>Se registrará como {usuario.name}</span>
          </div>
        )}
      </div>
    </Overlay>
  );
}
