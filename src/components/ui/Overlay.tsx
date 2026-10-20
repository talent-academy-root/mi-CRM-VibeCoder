"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * Elemento que recibe el foco al abrir. Por defecto, el primer focusable del
   * panel — que por orden del DOM es el botón "Cerrar", así que un `autoFocus`
   * en un campo NO basta: React lo aplica al montar y el foco inicial lo pisa.
   */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Formulario como overlay: hoja inferior en móvil, modal centrado en escritorio.
 * Cierra por botón, scrim o Esc; atrapa el foco (Tab/Shift+Tab cicla) y bloquea
 * el scroll de fondo. `role="dialog"` + `aria-modal`.
 */
export function Overlay({
  open,
  onClose,
  title,
  children,
  footer,
  initialFocusRef,
}: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panel) {
        const items = Array.from(
          panel.querySelectorAll<HTMLElement>(FOCUSABLE),
        ).filter((el) => el.offsetParent !== null);
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey);
    const focusTimer = setTimeout(() => {
      const destino =
        initialFocusRef?.current ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
      destino?.focus();
    }, 20);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, initialFocusRef]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-[rgba(16,24,32,0.45)] animate-[vibe-fade-in_150ms_ease]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        className="relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-surface shadow-lg animate-[vibe-slide-up_150ms_ease] sm:w-[440px] sm:rounded-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-base font-semibold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-9 items-center justify-center rounded-md text-text-subtle hover:bg-surface-2"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t border-border px-5 py-3.5">{footer}</div>
        )}
      </div>
    </div>
  );
}
