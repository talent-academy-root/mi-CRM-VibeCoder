import { useId } from "react";
import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  ref?: React.Ref<HTMLInputElement>;
}

/** Casilla con etiqueta clicable. Para filtros y opciones de formulario. */
export function Checkbox({
  label,
  id,
  className,
  ref,
  ...props
}: CheckboxProps) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <span className="inline-flex items-center gap-2">
      <input
        id={inputId}
        ref={ref}
        type="checkbox"
        className={cn(
          "size-4 shrink-0 cursor-pointer rounded border-border-strong accent-primary",
          className,
        )}
        {...props}
      />
      <label
        htmlFor={inputId}
        className="cursor-pointer text-[13px] font-normal text-text-muted"
      >
        {label}
      </label>
    </span>
  );
}
