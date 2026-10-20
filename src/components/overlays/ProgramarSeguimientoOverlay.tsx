"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle } from "lucide-react";
import { api, type Id } from "@/lib/convexApi";
import { Overlay } from "@/components/ui/Overlay";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Button } from "@/components/ui/Button";
import { hoyLocalISO } from "@/lib/utils";
import { mensajeError } from "@/lib/errores";
import { NuevoClienteOverlay } from "./NuevoClienteOverlay";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Si viene (desde la ficha), no se pide cliente: ya se sabe cuál es. */
  clienteId?: Id<"clientes">;
  onSaved?: () => void;
}

/**
 * "Programar seguimiento" (F8). Una sola pieza para las dos entradas: desde la
 * ficha de un cliente (con `clienteId`) y desde los accesos rápidos de Hoy, donde
 * se titula "Nueva tarea" y añade el selector de cliente con su atajo de alta.
 *
 * El responsable se elige siempre (a diferencia del autor de una interacción, que
 * es implícito): un seguimiento se le puede encargar a otra persona del equipo.
 */
export function ProgramarSeguimientoOverlay({
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
  const usuarios = useQuery(api.usuarios.listar, open ? {} : "skip");
  const usuario = useQuery(api.usuarios.actual, open ? {} : "skip");
  const crear = useMutation(api.seguimientos.crear);

  const accionRef = useRef<HTMLInputElement>(null);
  const [accion, setAccion] = useState("");
  const [seleccionado, setSeleccionado] = useState("");
  const [vence, setVence] = useState(hoyLocalISO());
  const [responsable, setResponsable] = useState<Id<"users"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState(false);

  // Responsable por defecto = quien lo crea, en cuanto se conoce la sesión.
  const responsableId = responsable ?? usuario?._id ?? null;

  const opcionesResponsable = (usuarios ?? []).map((u) => ({
    value: u._id,
    label: u.name ?? "(sin nombre)",
  }));

  function reset() {
    setAccion("");
    setSeleccionado("");
    setVence(hoyLocalISO());
    setResponsable(null);
    setError(null);
    setGuardando(false);
  }

  function cerrar() {
    reset();
    onClose();
  }

  async function guardar() {
    setError(null);
    if (!accion.trim()) {
      setError("Indica qué hay que hacer.");
      return;
    }
    const destino = clienteId ?? (seleccionado as Id<"clientes"> | "");
    if (!destino) {
      setError("Elige un cliente.");
      return;
    }
    if (!vence) {
      setError("Elige una fecha.");
      return;
    }
    setGuardando(true);
    try {
      await crear({
        clienteId: destino,
        accion: accion.trim(),
        vence,
        // Sin responsable resuelto, el backend asigna al usuario en sesión.
        ...(responsableId ? { responsableId } : {}),
      });
      reset();
      onClose();
      onSaved?.();
    } catch (e) {
      setError(mensajeError(e, "No se pudo programar el seguimiento."));
      setGuardando(false);
    }
  }

  return (
    <>
      <Overlay
        open={open && !nuevoCliente}
        onClose={cerrar}
        title={pideCliente ? "Nueva tarea" : "Programar seguimiento"}
        initialFocusRef={accionRef}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="compact" onClick={cerrar}>
              Cancelar
            </Button>
            <Button size="compact" loading={guardando} onClick={guardar}>
              {pideCliente ? "Crear tarea" : "Programar"}
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

          <Input
            ref={accionRef}
            label="Qué hay que hacer"
            value={accion}
            placeholder="Llamar para cerrar la propuesta"
            onChange={(e) => setAccion(e.target.value)}
            required
          />

          {pideCliente && (
            <div className="flex flex-col gap-2">
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
              <button
                type="button"
                onClick={() => setNuevoCliente(true)}
                className="self-start text-[13px] font-semibold text-primary hover:underline"
              >
                + Nuevo cliente
              </button>
            </div>
          )}

          <Input
            label="Fecha"
            type="date"
            value={vence}
            onChange={(e) => setVence(e.target.value)}
          />

          {opcionesResponsable.length > 0 && (
            <ChipGroup
              label="Responsable"
              options={opcionesResponsable}
              value={responsableId}
              // Obligatorio: pulsar el chip activo no lo deselecciona.
              onChange={(v) => v && setResponsable(v)}
            />
          )}
        </div>
      </Overlay>

      <NuevoClienteOverlay
        open={nuevoCliente}
        onClose={() => setNuevoCliente(false)}
        onCreated={(id) => {
          setSeleccionado(id);
          setNuevoCliente(false);
          // Si el error visible era "Elige un cliente.", ya no aplica.
          setError(null);
        }}
      />
    </>
  );
}
