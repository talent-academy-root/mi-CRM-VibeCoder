"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { AlertCircle } from "lucide-react";
import { api, type Id } from "@/lib/convexApi";
import { Overlay } from "@/components/ui/Overlay";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  cliente: {
    _id: Id<"clientes">;
    nombre: string;
    empresa?: string;
    telefono?: string;
    email?: string;
  };
  onClose: () => void;
  onSaved?: () => void;
}

/**
 * Edita los datos de contacto de un cliente (F2). Subconjunto del alta: solo
 * Nombre/Empresa/Teléfono/Email (sin Canal, Nota ni Estado — el estado es calculado).
 * Se monta solo al abrir desde la ficha, así el `useState` perezoso precarga los datos
 * actuales sin sincronizar estado en un efecto (evita `react-hooks/set-state-in-effect`).
 */
export function EditarClienteOverlay({ cliente, onClose, onSaved }: Props) {
  const actualizar = useMutation(api.clientes.actualizar);
  const [nombre, setNombre] = useState(() => cliente.nombre);
  const [empresa, setEmpresa] = useState(() => cliente.empresa ?? "");
  const [telefono, setTelefono] = useState(() => cliente.telefono ?? "");
  const [email, setEmail] = useState(() => cliente.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setError(null);
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!telefono.trim() && !email.trim()) {
      setError("Indica al menos un teléfono o un email.");
      return;
    }
    setGuardando(true);
    try {
      await actualizar({
        id: cliente._id,
        nombre: nombre.trim(),
        empresa: empresa.trim() || undefined,
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
      });
      onSaved?.();
      onClose();
    } catch {
      setError("No se pudo guardar. Revisa los datos.");
      setGuardando(false);
    }
  }

  return (
    <Overlay
      open
      onClose={onClose}
      title="Editar cliente"
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
            Guardar cambios
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
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoFocus
          required
        />
        <Input
          label="Empresa"
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
        />
        <Input
          label="Teléfono"
          type="tel"
          inputMode="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
    </Overlay>
  );
}
