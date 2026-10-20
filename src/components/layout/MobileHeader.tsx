"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SECTION_TITLES } from "@/lib/nav";
import { Avatar } from "@/components/ui/Avatar";
import { useUsuarioActual } from "@/lib/useSesion";

/**
 * Cabecera compartida (60px, borde inferior). Botón atrás automático en
 * subrutas (p. ej. /clientes/123). El avatar abre "Mi cuenta".
 */
export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUsuarioActual();

  const base = "/" + pathname.split("/").slice(1, 2).join("");
  const isSubroute = pathname.split("/").filter(Boolean).length > 1;
  const title = SECTION_TITLES[pathname] ?? SECTION_TITLES[base] ?? "Vibe CRM";

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-2 border-b border-border bg-surface px-3">
      {isSubroute && (
        <button
          type="button"
          aria-label="Atrás"
          onClick={() => router.back()}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-text hover:bg-surface-2"
        >
          <ChevronLeft className="size-[22px]" aria-hidden />
        </button>
      )}
      {/*
        Título en rojo por decisión de producto. Se usa `error-text` —y no
        `error`— porque es el token pensado para TEXTO: se aclara en modo
        oscuro (#fca5a5) y gana contraste sobre blanco en el claro (#991b1b).
        Es el mismo que emplea el resto de la app para texto rojo.
      */}
      <h2 className="flex-1 truncate pl-1 text-[17px] font-semibold text-error-text">
        {title}
      </h2>
      <Link
        href="/cuenta"
        aria-label="Mi cuenta"
        className="flex size-11 shrink-0 items-center justify-center rounded-full md:hidden"
      >
        <Avatar name={user?.name ?? ""} variant="neutral" size={32} />
      </Link>
    </header>
  );
}
