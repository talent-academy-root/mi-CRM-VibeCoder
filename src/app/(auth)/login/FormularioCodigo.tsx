"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { mensajeError } from "@/lib/errores";

/**
 * Canjear un código de 8 caracteres y dejar una contraseña nueva.
 *
 * Lo comparten los dos caminos que acaban aquí, porque el mecanismo es idéntico
 * y solo cambian las palabras:
 *   - recuperar una contraseña olvidada (TAL-65, `RecuperarContrasena`);
 *   - configurar la primera contraseña tras una invitación (TAL-60, el paso
 *     "configurar" de la pantalla de acceso).
 *
 * Tener una sola copia importa: aquí es donde se decide con qué nombre viaja el
 * correo, y ese detalle es de seguridad (ver el comentario del envío).
 */

const SEGUNDOS_REENVIO = 60;
const LARGO_CODIGO = 8;

/**
 * Deja el código como lo espera el backend: mayúsculas, sin guion ni espacios.
 * Se aceptan las letras que el alfabeto Crockford excluye por confundibles
 * (I y L valen 1; O vale 0), que es justo lo que alguien teclea al leerlas de
 * un correo.
 */
function normalizarCodigo(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0")
    .replace(/[^0-9A-HJKMNP-TV-Z]/g, "")
    .slice(0, LARGO_CODIGO);
}

interface Props {
  /** Correo ya normalizado con el que se pidió el código. */
  correo: string;
  titulo: string;
  /** Bloque informativo bajo el título (cambia según de dónde se venga). */
  intro: ReactNode;
  textoBoton: string;
  /** Vuelve a pedir un código para el mismo correo. */
  onReenviar: () => Promise<unknown>;
  onVolver: () => void;
  textoVolver: string;
  /** Vuelve al paso anterior para escribir otra dirección. */
  onCambiarCorreo: () => void;
  /** Segundos de espera iniciales; 0 si aún no se ha mandado nada. */
  esperaInicial?: number;
}

export function FormularioCodigo({
  correo,
  titulo,
  intro,
  textoBoton,
  onReenviar,
  onVolver,
  textoVolver,
  onCambiarCorreo,
  esperaInicial = SEGUNDOS_REENVIO,
}: Props) {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [codigo, setCodigo] = useState("");
  const [nueva, setNueva] = useState("");
  const [verNueva, setVerNueva] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [errorNueva, setErrorNueva] = useState<string | null>(null);
  const [espera, setEspera] = useState(esperaInicial);

  // Cuenta atrás del reenvío.
  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  async function reenviar() {
    if (espera > 0 || enviando) return;
    setError(null);
    setErrorCodigo(null);
    setEnviando(true);
    try {
      await onReenviar();
      setCodigo("");
      setEspera(SEGUNDOS_REENVIO);
    } catch {
      setError("No se pudo conectar. Inténtalo de nuevo.");
    }
    setEnviando(false);
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setErrorCodigo(null);
    setErrorNueva(null);

    if (codigo.length < LARGO_CODIGO) {
      setErrorCodigo("Escribe el código completo");
      return;
    }
    if (nueva.length < 8) {
      setErrorNueva("Usa al menos 8 caracteres");
      return;
    }

    setEnviando(true);
    try {
      await signIn("password", {
        // `correo` y no `email` a propósito (TAL-66). La librería usa el campo
        // `email` de esta llamada como clave de su límite de intentos, y ese
        // límite lo puede gastar cualquiera: bastaban diez llamadas anónimas con
        // la dirección de otra persona para dejarla sin poder canjear su código
        // durante una hora, indefinidamente. Con otro nombre, la librería no
        // encuentra clave y no aplica el límite a quien viene por aquí.
        //
        // El backend (`Password.profile()` y `CodigoRecuperacion.authorize`) lee
        // `email ?? correo`, así que sigue localizando la cuenta igual.
        correo,
        code: codigo,
        newPassword: nueva,
        flow: "reset-verification",
      });
      // `reset-verification` ya deja la sesión iniciada e invalida las demás.
      router.replace("/hoy");
    } catch (e) {
      // La librería lanza un Error plano e indistinguible para código
      // incorrecto, caducado o de otra cuenta, así que todos caen en el mismo
      // mensaje. El ConvexError de contraseña corta sí trae su propio texto.
      //
      // El de acceso retirado NO: comprobado al probar TAL-60, la librería lo
      // vuelve a envolver al cruzar de su mutation a la action y llega sin
      // `data`, así que quien esté desactivado verá aquí el texto genérico.
      // Falla del lado seguro.
      setError(
        mensajeError(
          e,
          "El código no es correcto o ha caducado. Pide uno nuevo si hace falta.",
        ),
      );
      setEnviando(false);
    }
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-text">{titulo}</h1>
      <p className="mt-1 text-sm text-text-muted">
        Lo hemos mandado a {correo}.{" "}
        <button
          type="button"
          onClick={onCambiarCorreo}
          className="text-text underline hover:no-underline"
        >
          Cambiar correo
        </button>
      </p>

      <form onSubmit={enviar} className="mt-5 flex flex-col gap-4">
        {intro}

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
          label="Código"
          name="codigo"
          inputMode="text"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          autoFocus
          required
          placeholder="XXXX-XXXX"
          maxLength={LARGO_CODIGO + 1}
          value={codigo}
          error={errorCodigo}
          onChange={(e) => setCodigo(normalizarCodigo(e.target.value))}
          className="text-center text-[20px] tracking-[0.3em]"
        />

        <div className="relative">
          <Input
            label="Contraseña nueva"
            name="newPassword"
            type={verNueva ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="••••••••"
            helper="Mínimo 8 caracteres"
            value={nueva}
            error={errorNueva}
            onChange={(e) => setNueva(e.target.value)}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setVerNueva((v) => !v)}
            aria-label={verNueva ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={verNueva}
            className="absolute right-2 top-[34px] flex size-9 items-center justify-center rounded-md text-text-subtle hover:bg-surface-2"
          >
            {verNueva ? (
              <EyeOff className="size-[18px]" aria-hidden />
            ) : (
              <Eye className="size-[18px]" aria-hidden />
            )}
          </button>
        </div>

        <Button type="submit" loading={enviando} className="w-full">
          {textoBoton}
        </Button>

        <button
          type="button"
          onClick={reenviar}
          disabled={espera > 0 || enviando}
          className="text-center text-[13px] text-text-muted hover:text-text disabled:cursor-default disabled:text-text-subtle disabled:hover:text-text-subtle"
        >
          {espera > 0 ? `Reenviar código en ${espera} s` : "Reenviar código"}
        </button>

        <button
          type="button"
          onClick={onVolver}
          className="text-center text-[13px] text-text-muted hover:text-text"
        >
          {textoVolver}
        </button>
      </form>
    </>
  );
}
