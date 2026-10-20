"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useConvexAuth } from "convex/react";
import { AlertCircle, Eye, EyeOff, Mail } from "lucide-react";
import { api } from "@/lib/convexApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { mensajeError } from "@/lib/errores";
import { RecuperarContrasena } from "./RecuperarContrasena";
import { FormularioCodigo } from "./FormularioCodigo";

// Mensaje deliberadamente genérico: Convex Auth no propaga a través del
// redirect el motivo exacto del fallo (evita filtrar si un email existe o
// no), así que no distinguimos "cuenta no autorizada" de "cancelaste en
// Google" ni de un error del proveedor.
const ERROR_GOOGLE = "No se pudo iniciar sesión con Google.";

/**
 * Acceso en DOS PASOS (TAL-60): primero el correo, después lo que corresponda.
 *
 * El motivo no es estético. Quien entra por primera vez tras una invitación no
 * ha olvidado su contraseña: nunca la ha tenido. Con un único formulario, la
 * única salida que teníamos era mandarla a "¿Olvidaste tu contraseña?", que es
 * decirle algo que no es verdad y además no se entiende.
 *
 * Quien decide el segundo paso es el servidor (`acceso.comprobarCorreo`), y allí
 * está explicado con detalle qué revela y qué no: un correo desconocido se
 * comporta exactamente igual que uno que ya tiene contraseña, así que esta
 * pantalla NO dice quién tiene cuenta.
 *
 * Y no saluda por el nombre a propósito: enseñar "Hola, Ana" convertiría el
 * primer paso en un extractor de identidades reales, bastante peor que saber
 * que una cuenta existe.
 */
export default function LoginPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const comprobarCorreo = useAction(api.acceso.comprobarCorreo);
  const solicitarCodigo = useAction(api.recuperacion.solicitarCodigo);
  const router = useRouter();

  // "correo" → "contrasena" | "configurar". "recuperar" se renderiza en LUGAR
  // del formulario, no junto a él: el enlace que lo activa vive dentro de ese
  // <form> y mostrar los dos a la vez anidaría formularios.
  const [paso, setPaso] = useState<
    "correo" | "contrasena" | "configurar" | "recuperar"
  >("correo");
  const [email, setEmail] = useState("");
  // El correo ya normalizado con el que respondió el servidor. A partir del
  // paso 2 se usa este y no el del input, para que no puedan divergir.
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingGoogle, setSubmittingGoogle] = useState(false);
  // `signIn("google")` solo abre el redirect a Google; el resultado (éxito o
  // rechazo de createOrUpdateUser) llega en la carga de página siguiente, no
  // como una excepción capturable en onGoogleClick. Se detecta leyendo el
  // marcador propio de la URL en el primer render: si vino `code`, es un
  // regreso exitoso (el `code` se consume aparte y dispara el redirect de
  // abajo); si no, fue un rechazo.
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("intento") === "google" && !params.has("code")
      ? ERROR_GOOGLE
      : null;
  });

  // Sesión iniciada (login por contraseña o regreso exitoso de Google) → a /hoy.
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/hoy");
    }
  }, [isAuthenticated, router]);

  // Limpieza de la URL: quitar el marcador `intento` una vez leído, para que
  // recargar /login no vuelva a mostrar un intento anterior como error actual.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("intento")) {
      url.searchParams.delete("intento");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

  function volverAlCorreo() {
    setError(null);
    setPassword("");
    setPaso("correo");
  }

  async function onContinuar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const canonico = email.trim().toLowerCase();
    if (canonico === "") {
      setError("Escribe tu correo.");
      return;
    }
    setSubmitting(true);
    try {
      const siguiente = await comprobarCorreo({ email: canonico });
      setCorreo(canonico);
      setPaso(siguiente === "codigo" ? "configurar" : "contrasena");
    } catch {
      // `comprobarCorreo` está diseñada para no lanzar nunca; si algo llega
      // aquí es un fallo de red o del propio Convex.
      setError("No se pudo conectar. Inténtalo de nuevo.");
    }
    setSubmitting(false);
  }

  async function onEntrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Solo iniciamos sesión: nunca exponemos el flujo de registro en la UI.
      await signIn("password", { email: correo, password, flow: "signIn" });
      router.replace("/hoy");
    } catch (e) {
      // El texto genérico protege la existencia de la cuenta.
      //
      // Comprobado en las pruebas de TAL-60: quien tiene el acceso retirado ve
      // también este mensaje, aunque su contraseña sea correcta. El ConvexError
      // de `beforeSessionCreation` sí se lanza, pero la librería lo vuelve a
      // envolver al cruzar de su mutation a la action y llega sin `data`, así
      // que `mensajeError` no puede sacar el texto. Se acepta: falla del lado
      // seguro y quien retiró el acceso sabe que lo hizo. Quien sí ve el motivo
      // es la persona que estaba dentro cuando se lo retiraron (`LimiteDeError`).
      setError(mensajeError(e, "Correo o contraseña incorrectos."));
      setSubmitting(false);
    }
  }

  async function onGoogleClick() {
    setError(null);
    setSubmittingGoogle(true);
    try {
      await signIn("google", { redirectTo: "/login?intento=google" });
    } catch {
      setError(ERROR_GOOGLE);
      setSubmittingGoogle(false);
    }
  }

  const avisoError = error && (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-md border border-error bg-error-bg px-3 py-2.5 text-[13px] text-error-text"
    >
      <AlertCircle className="size-4 shrink-0" aria-hidden />
      {error}
    </div>
  );

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex size-[34px] items-center justify-center rounded-[9px] bg-primary text-[17px] font-semibold text-on-primary">
            V
          </span>
          <span className="text-lg font-semibold text-text">Vibe CRM</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {paso === "recuperar" && (
            <RecuperarContrasena
              emailInicial={correo}
              onCancelar={volverAlCorreo}
            />
          )}

          {paso === "configurar" && (
            <FormularioCodigo
              correo={correo}
              titulo="Configura tu contraseña"
              intro={
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-[13px] text-text-muted"
                >
                  <Mail className="mt-px size-4 shrink-0" aria-hidden />
                  <span>
                    Es tu primera vez aquí, así que todavía no tienes
                    contraseña. Te hemos mandado un código para que elijas una.
                    Mira también el spam.
                  </span>
                </div>
              }
              textoBoton="Guardar y entrar"
              onReenviar={() => solicitarCodigo({ email: correo })}
              onCambiarCorreo={volverAlCorreo}
              onVolver={volverAlCorreo}
              textoVolver="Usar otro correo"
            />
          )}

          {paso === "correo" && (
            <>
              <h1 className="text-xl font-semibold text-text">Inicia sesión</h1>
              <p className="mt-1 text-sm text-text-muted">
                Entra para ver tus tareas del día.
              </p>

              <form onSubmit={onContinuar} className="mt-5 flex flex-col gap-4">
                {avisoError}

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

                <Button type="submit" loading={submitting} className="w-full">
                  Continuar
                </Button>
              </form>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[12px] text-text-subtle">o</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={onGoogleClick}
                loading={submittingGoogle}
                className="w-full"
              >
                Entrar con Google
              </Button>
            </>
          )}

          {paso === "contrasena" && (
            <>
              <h1 className="text-xl font-semibold text-text">
                Escribe tu contraseña
              </h1>
              <p className="mt-1 text-sm text-text-muted">
                {correo}{" "}
                <button
                  type="button"
                  onClick={volverAlCorreo}
                  className="text-text underline hover:no-underline"
                >
                  Cambiar
                </button>
              </p>

              <form onSubmit={onEntrar} className="mt-5 flex flex-col gap-4">
                {avisoError}

                <div className="relative">
                  <Input
                    label="Contraseña"
                    name="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    autoFocus
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={
                      showPass ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    aria-pressed={showPass}
                    className="absolute right-2 top-[34px] flex size-9 items-center justify-center rounded-md text-text-subtle hover:bg-surface-2"
                  >
                    {showPass ? (
                      <EyeOff className="size-[18px]" aria-hidden />
                    ) : (
                      <Eye className="size-[18px]" aria-hidden />
                    )}
                  </button>
                </div>

                <Button type="submit" loading={submitting} className="w-full">
                  Entrar
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setPaso("recuperar");
                  }}
                  className="text-center text-[13px] text-text-muted hover:text-text"
                >
                  He olvidado mi contraseña
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
