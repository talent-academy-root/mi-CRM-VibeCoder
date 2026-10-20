"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { AlertCircle } from "lucide-react";
import { api, type Id } from "@/lib/convexApi";
import { Overlay } from "@/components/ui/Overlay";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";

type Canal = "web" | "redes" | "email" | "whatsapp";

const CANALES: { value: Canal; label: string }[] = [
  { value: "web", label: "Web" },
  { value: "redes", label: "Redes" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  /**
   * Uso embebido (p. ej. desde "Nueva tarea"): recibe el id del cliente recién
   * creado para preseleccionarlo. Si se omite, el overlay abre su ficha.
   */
  onCreated?: (id: Id<"clientes">) => void;
}

/**
 * Alta rápida de cliente (F1). Al guardar: con `onCreated` (uso embebido) devuelve
 * el id sin navegar; sin él (standalone) abre la ficha del cliente `/clientes/{id}`.
 */
export function NuevoClienteOverlay({ open, onClose, onCreated }: Props) {
  const router = useRouter();
  const crear = useMutation(api.clientes.crear);
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [canal, setCanal] = useState<Canal | null>(null);
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function reset() {
    setNombre("");
    setEmpresa("");
    setTelefono("");
    setEmail("");
    setCanal(null);
    setNota("");
    setError(null);
    setGuardando(false);
  }

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
      const id = await crear({
        nombre: nombre.trim(),
        empresa: empresa.trim() || undefined,
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
        canalOrigen: canal ?? undefined,
        nota: nota.trim() || undefined,
      });
      reset();
      onClose();
      if (onCreated) {
        onCreated(id);
      } else {
        // ?nuevo=1 dispara el toast "Cliente añadido" al aterrizar en la ficha.
        router.push(`/clientes/${id}?nuevo=1`);
      }
    } catch {
      setError("No se pudo guardar. Revisa los datos.");
      setGuardando(false);
    }
  }

  return (
    <Overlay
      open={open}
      onClose={onClose}
      title="Nuevo cliente"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="compact" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="compact" loading={guardando} onClick={guardar}>
            Guardar cliente
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
        <ChipGroup<Canal>
          label="Canal de origen"
          options={CANALES}
          value={canal}
          onChange={setCanal}
        />
        <Input
          label="Nota"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
      </div>
    </Overlay>
  );
}
