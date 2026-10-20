"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { AlertCircle, Mail } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormularioCodigo } from "./FormularioCodigo";

/**
 * Recuperación de contraseña en dos pasos (TAL-65), dentro de la pantalla de
 * login. Vive en su propio componente para no anidar formularios: el enlace
 * "He olvidado mi contraseña" está dentro del <form> de acceso, así que al
 * entrar aquí ese formulario se desmonta entero.
 *
 * El segundo paso (canjear el código) es `FormularioCodigo`, compartido con la
 * primera configuración de contraseña tras una invitación (TAL-60): el
 * mecanismo es el mismo y solo cambian las palabras.
 */

// El aviso es el MISMO tanto si el correo tiene cuenta como si no, y también si
// falla el envío. Es deliberado: cualquier mensaje que dependa de la existencia
// de la cuenta convierte esta pantalla en un detector de qué correos están
// dados de alta.
const AVISO_ENVIADO =
  "Si ese correo tiene cuenta con contraseña, te llegará un código en un par de minutos. Mira también el spam.";

export function RecuperarContrasena({
  emailInicial,
  onCancelar,
}: {
  emailInicial: string;
  onCancelar: () => void;
}) {
  const solicitarCodigo = useAction(api.recuperacion.solicitarCodigo);

  const [paso, setPaso] = useState<"pedir-codigo" | "verificar-codigo">(
    "pedir-codigo",
  );
  const [email, setEmail] = useState(emailInicial);
  // El correo con el que se pidió el código, ya normalizado. Se reutiliza tal
  // cual al verificar para que los dos pasos no puedan divergir.
  const [emailEnviado, setEmailEnviado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pedirCodigo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const canonico = email.trim().toLowerCase();
    if (canonico === "") {
      setError("Escribe tu correo.");
      return;
    }
    setEnviando(true);
    try {
      await solicitarCodigo({ email: canonico });
      setEmailEnviado(canonico);
      setPaso("verificar-codigo");
    } catch {
      // `solicitarCodigo` está diseñada para no lanzar nunca; si algo llega
      // aquí es un fallo de red o del propio Convex, no del correo consultado.
      setError("No se pudo conectar. Inténtalo de nuevo.");
    }
    setEnviando(false);
  }

  if (paso === "verificar-codigo") {
    return (
      <FormularioCodigo
        correo={emailEnviado}
        titulo="Escribe el código"
        intro={
          <div
            role="status"
            className="flex items-start gap-2 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-[13px] text-text-muted"
          >
            <Mail className="mt-px size-4 shrink-0" aria-hidden />
            <span>
              {AVISO_ENVIADO}
              <br />
              ¿Entras con Google? Entonces no usas contraseña: vuelve atrás y
              entra con el botón de Google.
            </span>
          </div>
        }
        textoBoton="Cambiar contraseña"
        onReenviar={() => solicitarCodigo({ email: emailEnviado })}
        onCambiarCorreo={() => {
          setPaso("pedir-codigo");
          setError(null);
        }}
        onVolver={onCancelar}
        textoVolver="Volver a iniciar sesión"
      />
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-text">
        ¿Has olvidado tu contraseña?
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        Escribe tu correo y te mandamos un código para cambiarla.
      </p>

      <form onSubmit={pedirCodigo} className="mt-5 flex flex-col gap-4">
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
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" loading={enviando} className="w-full">
          Enviar código
        </Button>

        <button
          type="button"
          onClick={onCancelar}
          className="text-center text-[13px] text-text-muted hover:text-text"
        >
          Volver a iniciar sesión
        </button>
      </form>
    </>
  );
}
