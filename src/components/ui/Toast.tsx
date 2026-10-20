"use client";

interface ToastProps {
  message: string;
  action?: { label: string; onClick: () => void };
}

/** Aviso breve abajo-centro, con acción opcional (p. ej. "Deshacer"). */
export function Toast({ message, action }: ToastProps) {
  return (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg bg-text px-4 py-3 text-[14px] text-surface shadow-lg animate-[vibe-slide-up_150ms_ease] md:bottom-6"
    >
      <span>{message}</span>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="font-semibold text-[#4ade80] hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
