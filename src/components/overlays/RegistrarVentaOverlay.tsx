"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, User } from "lucide-react";
import { api, type Id } from "@/lib/convexApi";
import { Overlay } from "@/components/ui/Overlay";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Button } from "@/components/ui/Button";
import { hoyLocalISO } from "@/lib/utils";
import { parseImporte } from "@/lib/importe";
import { mensajeError } from "@/lib/errores";
import { ESTADO_VENTA_OPCIONES, type EstadoVenta } from "@/lib/estadoVenta";

/** La venta que se está editando, tal como la sirve `ventas.listarPorCliente`. */
export type VentaEditable = {
  _id: Id<"ventas">;
  concepto: string;
  importe: number;
  estado: EstadoVenta;
  fecha: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  /** Si viene (desde la ficha), no se pide cliente: ya se sabe cuál es. */
  clienteId?: Id<"clientes">;
  /** Si viene, se edita esa venta en lugar de crear una nueva. */
  venta?: VentaEditable;
  /** El modo lo dice el overlay: quien escucha ya ha cerrado y limpiado su estado. */
  onSaved?: (modo: "alta" | "edicion") => void;
}

/**
 * "Registrar venta u oportunidad" (F5). Una sola pieza para las tres entradas:
 * la ficha de un cliente (con `clienteId`), los accesos rápidos de Hoy y la
 * pantalla /ventas — en las dos últimas añade el selector de cliente.
 *
 * También edita (TAL-13 pide poder pasar una oportunidad a ganada o perdida).
 *
 * El formulario se inicializa desde `venta` una sola vez, con `useState`. Quien lo
 * usa DEBE montarlo solo cuando está abierto y darle un `key` distinto por venta;
 * si no, reabriría con lo tecleado la vez anterior. Se prefiere eso a sincronizar
 * con un `useEffect`, que dispararía `react-hooks/set-state-in-effect`.
 */
export function RegistrarVentaOverlay({
  open,
  onClose,
  clienteId,
  venta,
  onSaved,
}: Props) {
  const editando = venta !== undefined;
  const pideCliente = clienteId === undefined && !editando;
  const clientes = useQuery(
    api.clientes.listar,
    open && pideCliente ? {} : "skip",
  );
  const usuario = useQuery(api.usuarios.actual, open && !editando ? {} : "skip");
  const crear = useMutation(api.ventas.crear);
  const actualizar = useMutation(api.ventas.actualizar);

  const conceptoRef = useRef<HTMLInputElement>(null);
  const [seleccionado, setSeleccionado] = useState("");
  const [concepto, setConcepto] = useState(venta?.concepto ?? "");
  // Editable, no formateado: "1200" y "1200.50", nunca "$1,200.50".
  const [importe, setImporte] = useState(() =>
    venta === undefined
      ? ""
      : Number.isInteger(venta.importe)
        ? String(venta.importe)
        : venta.importe.toFixed(2),
  );
  const [estado, setEstado] = useState<EstadoVenta>(venta?.estado ?? "abierta");
  const [fecha, setFecha] = useState(venta?.fecha ?? hoyLocalISO());
  const [error, setError] = useState<string | null>(null);
  const [errorConcepto, setErrorConcepto] = useState<string | null>(null);
  const [errorImporte, setErrorImporte] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function cerrar() {
    // El consumidor desmonta el overlay al cerrarlo, así que el formulario muere
    // con él. Limpiar los errores igualmente cuesta nada y no depende de eso.
    setError(null);
    setErrorConcepto(null);
    setErrorImporte(null);
    setGuardando(false);
    onClose();
  }

  async function guardar() {
    setError(null);
    setErrorConcepto(null);
    setErrorImporte(null);

    if (!concepto.trim()) {
      setErrorConcepto("Indica qué se vende");
      return;
    }
    // `null` es "no se entiende"; 0 sí se entiende, pero no es una venta.
    const importeNum = parseImporte(importe);
    if (importeNum === null) {
      setErrorImporte("Indica un importe válido");
      return;
    }
    if (importeNum <= 0) {
      setErrorImporte("Indica un importe mayor que cero");
      return;
    }
    if (!fecha) {
      setError("Elige una fecha.");
      return;
    }

    setGuardando(true);
    try {
      if (venta) {
        await actualizar({
          id: venta._id,
          concepto: concepto.trim(),
          importe: importeNum,
          estado,
          fecha,
        });
      } else {
        const destino = clienteId ?? (seleccionado as Id<"clientes"> | "");
        if (!destino) {
          setError("Elige un cliente.");
          setGuardando(false);
          return;
        }
        await crear({
          clienteId: destino,
          concepto: concepto.trim(),
          importe: importeNum,
          estado,
          fecha,
        });
      }
      onClose();
      onSaved?.(editando ? "edicion" : "alta");
    } catch (e) {
      // El backend rechaza fecha futura, concepto vacío o importe fuera de rango
      // con un mensaje ya redactado para la persona; se muestra tal cual.
      setError(
        mensajeError(
          e,
          editando
            ? "No se pudo guardar la venta."
            : "No se pudo registrar la venta.",
        ),
      );
      setGuardando(false);
    }
  }

  return (
    <Overlay
      open={open}
      onClose={cerrar}
      title={editando ? "Editar venta" : "Registrar venta"}
      initialFocusRef={conceptoRef}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="compact" onClick={cerrar}>
            Cancelar
          </Button>
          <Button size="compact" loading={guardando} onClick={guardar}>
            {editando ? "Guardar cambios" : "Guardar"}
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
            onChange={(e) => {
              setSeleccionado(e.target.value);
              // Si el banner visible era "Elige un cliente.", ya no aplica.
              setError(null);
            }}
          >
            <option value="">Selecciona un cliente…</option>
            {clientes?.map((c) => (
              <option key={c._id} value={c._id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        )}

        <Input
          ref={conceptoRef}
          label="Qué se vende"
          value={concepto}
          error={errorConcepto}
          placeholder="Licencia anual, servicio…"
          autoCapitalize="sentences"
          onChange={(e) => setConcepto(e.target.value)}
          required
        />

        <Input
          label="Importe ($)"
          value={importe}
          error={errorImporte}
          placeholder="1200"
          type="text"
          inputMode="decimal"
          onChange={(e) => setImporte(e.target.value)}
          required
        />

        <ChipGroup
          label="Estado"
          options={ESTADO_VENTA_OPCIONES}
          value={estado}
          // El estado es obligatorio: pulsar el chip activo no lo deselecciona.
          onChange={(v) => v && setEstado(v)}
        />

        <Input
          label="Fecha"
          type="date"
          value={fecha}
          max={hoyLocalISO()}
          onChange={(e) => setFecha(e.target.value)}
        />

        {!editando && usuario?.name && (
          <div className="flex items-center gap-2 text-[13px] text-text-muted">
            <User className="size-4 shrink-0 text-text-subtle" aria-hidden />
            <span>Se registrará como {usuario.name}</span>
          </div>
        )}
      </div>
    </Overlay>
  );
}
