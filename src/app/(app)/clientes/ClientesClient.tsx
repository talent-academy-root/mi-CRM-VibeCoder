"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { Plus, Search, Users, X } from "lucide-react";
import { api } from "@/lib/convexApi";
import { normalizePhone, relativeLabel } from "@/lib/utils";
import { ESTADO_BADGE } from "@/lib/estadoCliente";
import { Card } from "@/components/ui/Card";
import { Badge, STATUS_LABELS } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { ListRow } from "@/components/ui/ListRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { NuevoClienteOverlay } from "@/components/overlays/NuevoClienteOverlay";

function subtituloContacto(ultimoContacto: string | null): string {
  return ultimoContacto
    ? `Último contacto: ${relativeLabel(ultimoContacto)}`
    : "Sin contacto aún";
}

function FilaSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4.5 py-3.5 last:border-b-0">
      <Skeleton width={40} height={40} radius={9999} />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton width="38%" height={13} />
        <Skeleton width="60%" height={11} />
      </div>
    </div>
  );
}

export function ClientesClient() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const clientes = useQuery(
    api.clientes.listarConEstado,
    isAuthenticated ? {} : "skip",
  );
  const [query, setQuery] = useState("");
  const [nuevoAbierto, setNuevoAbierto] = useState(false);

  // Búsqueda client-side. El guard `qPhone.length > 1` evita que una búsqueda de
  // texto sin dígitos (normalizePhone → "") case a todo cliente con teléfono
  // (`"600123".includes("") === true`).
  const qText = query.trim().toLowerCase();
  const qPhone = normalizePhone(query);
  const filtrados = (clientes ?? []).filter((c) => {
    if (!qText) return true;
    const enTexto =
      c.nombre.toLowerCase().includes(qText) ||
      (c.email?.toLowerCase().includes(qText) ?? false);
    const enTelefono =
      qPhone.length > 1 &&
      c.telefono != null &&
      normalizePhone(c.telefono).includes(qPhone);
    return enTexto || enTelefono;
  });

  const hayBusqueda = qText.length > 0;
  const total = filtrados.length;
  const eyebrow = hayBusqueda
    ? `${total} ${total === 1 ? "resultado" : "resultados"}`
    : `${total} ${total === 1 ? "cliente" : "clientes"}`;

  function abrirNuevo() {
    setNuevoAbierto(true);
  }

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-text-subtle">
          {clientes === undefined ? "Clientes" : eyebrow}
        </p>
        <Button
          size="compact"
          iconLeft={<Plus className="size-4" aria-hidden />}
          className="hidden md:inline-flex"
          onClick={abrirNuevo}
        >
          Nuevo cliente
        </Button>
      </div>

      <div className="relative">
        <Input
          icon={<Search className="size-[18px]" aria-hidden />}
          placeholder="Buscar por nombre, teléfono o email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={query ? "pr-11" : undefined}
          aria-label="Buscar clientes"
        />
        {query && (
          <IconButton
            aria-label="Limpiar búsqueda"
            variant="ghost"
            className="absolute right-1.5 top-1/2 size-9 -translate-y-1/2"
            onClick={() => setQuery("")}
          >
            <X className="size-4" aria-hidden />
          </IconButton>
        )}
      </div>

      {clientes === undefined ? (
        <Card padding="none" className="overflow-hidden">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <FilaSkeleton key={i} />
          ))}
        </Card>
      ) : clientes.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={<Users className="size-6" aria-hidden />}
            title="Sin clientes todavía"
            help="Da de alta a tu primer cliente para empezar a trabajar con él."
            action={
              <Button size="compact" onClick={abrirNuevo}>
                Añadir cliente
              </Button>
            }
          />
        </Card>
      ) : total === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={<Search className="size-6" aria-hidden />}
            title="Sin resultados"
            help="No hay clientes que coincidan con tu búsqueda."
            action={
              <Button
                variant="secondary"
                size="compact"
                onClick={() => setQuery("")}
              >
                Limpiar búsqueda
              </Button>
            }
          />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          {filtrados.map((c) => (
            <ListRow
              key={c._id}
              name={c.nombre}
              subtitle={subtituloContacto(c.ultimoContacto)}
              badge={
                <Badge status={ESTADO_BADGE[c.estado]}>
                  {STATUS_LABELS[ESTADO_BADGE[c.estado]]}
                </Badge>
              }
              onClick={() => router.push(`/clientes/${c._id}`)}
            />
          ))}
        </Card>
      )}

      <button
        type="button"
        aria-label="Nuevo cliente"
        onClick={abrirNuevo}
        className="fixed bottom-[76px] right-4 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-focus md:hidden"
      >
        <Plus className="size-6" aria-hidden />
      </button>

      <NuevoClienteOverlay
        open={nuevoAbierto}
        onClose={() => setNuevoAbierto(false)}
      />
    </div>
  );
}
