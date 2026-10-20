"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
import { RotateCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { mensajeError } from "@/lib/errores";
import { SESION_INVALIDA } from "../../../convex/mensajes";

/**
 * Red de seguridad del armazón de la aplicación (TAL-60).
 *
 * Se monta DENTRO de `(app)/layout.tsx`, envolviendo a la barra lateral, la
 * cabecera móvil, la barra inferior y el contenido. Esa ubicación es
 * deliberada: `Sidebar`, `MobileHeader` y `TabBarNav` consultan
 * `usuarios.actual` y se renderizan desde el layout, y un `error.tsx` de
 * Next.js NO envuelve el layout de su propio segmento — así que allí estos tres
 * fallos se escaparían.
 *
 * El caso que de verdad importa: a alguien le retiran el acceso mientras tiene
 * la aplicación abierta. Sus sesiones se cierran, pero el token que ya tiene en
 * el navegador sigue siendo válido hasta una hora, así que durante esa ventana
 * la aplicación carga y todas sus consultas fallan. Sin esto vería una pantalla
 * rota sin ninguna explicación.
 */

/**
 * El aviso, exportado porque lo usan DOS sitios (TAL-69, S8): este límite de
 * error y la página `/equipo`, que hace su consulta en el servidor y no puede
 * apoyarse en un límite de cliente.
 *
 * Lo importante de este componente no es lo que enseña, es lo que hace el botón:
 * espera a que `signOut()` termine y solo entonces navega. Redirigir sin cerrar
 * la sesión no sirve de nada —el token seguiría en el navegador, `src/proxy.ts`
 * lo daría por autenticado y rebotaría a `/hoy`—, así que el orden es la mitad
 * del arreglo.
 */
export function AvisoDeAcceso({
  mensaje,
  tono,
  onReintentar,
}: {
  mensaje: string;
  /**
   * `"acceso"` cuando el servidor ha dicho que esta persona no puede seguir;
   * `"fallo"` cuando no sabemos qué ha pasado y probablemente sea pasajero.
   */
  tono: "acceso" | "fallo";
  /**
   * Si se pasa, se ofrece volver a intentarlo. Solo tiene sentido donde haya
   * algo que reintentar: en `/equipo` la consulta ocurrió en el servidor y no
   * hay estado que reiniciar, así que allí no se pasa.
   */
  onReintentar?: () => void;
}) {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  // Props planas y no el `Error` capturado, a propósito: este componente se
  // renderiza también desde un Server Component (`/equipo`), y un Error no
  // cruza esa frontera. De paso, el motivo interno no viaja al navegador.
  const esDeAcceso = tono === "acceso";
  const titulo = esDeAcceso ? "No puedes seguir" : "No hemos podido cargar esto";

  async function salir() {
    setSaliendo(true);
    await signOut();
    router.replace("/login");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[400px] rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
        <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-surface-2 text-text-subtle">
          {esDeAcceso ? (
            <ShieldAlert className="size-6" aria-hidden />
          ) : (
            <RotateCw className="size-6" aria-hidden />
          )}
        </span>
        <h1 className="text-base font-semibold text-text">{titulo}</h1>
        <p className="mt-1.5 text-sm text-text-muted">{mensaje}</p>

        {onReintentar !== undefined ? (
          <div className="mt-5 flex flex-col gap-2">
            <Button className="w-full" onClick={onReintentar}>
              Reintentar
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              loading={saliendo}
              onClick={salir}
            >
              Cerrar sesión
            </Button>
          </div>
        ) : (
          <Button className="mt-5 w-full" loading={saliendo} onClick={salir}>
            Cerrar sesión
          </Button>
        )}
      </div>
    </main>
  );
}

/**
 * Sesión que ya no existe: se va al login sin preguntar nada (TAL-61).
 *
 * Cubre dos situaciones que son la misma para quien está delante:
 *
 *   - CERRAR SESIÓN. Entre que `signOut()` borra la sesión en el servidor y el
 *     cliente se da por no autenticado, las consultas en vuelo se responden con
 *     este error. Sin esto, cerrar sesión enseñaba durante un instante un
 *     "No puedes seguir" que parecía una expulsión.
 *   - QUE TE EXPULSEN. Cambiar la contraseña cierra las sesiones de los demás
 *     dispositivos; en esos, lo útil es aparecer en la pantalla de acceso, no
 *     leer un aviso con un botón que lleva justo ahí.
 *
 * Se cierra la sesión igualmente antes de navegar: el token sigue en el
 * navegador y `src/proxy.ts` lo daría por bueno, rebotando de vuelta a /hoy.
 */
function VolverAlLogin() {
  const { signOut } = useAuthActions();
  // El límite de error puede volver a renderizar; el envío va una sola vez.
  const yaVa = useRef(false);
  const [noSePudoSalir, setNoSePudoSalir] = useState(false);

  useEffect(() => {
    if (yaVa.current) return;
    yaVa.current = true;
    void (async () => {
      try {
        await signOut();
      } catch {
        // Si el cierre falla, NO se navega igualmente, y esto lo señaló
        // CodeRabbit en el PR #10: sin la salida manual, la pantalla se
        // quedaba clavada en "Volviendo a la pantalla de acceso…" para
        // siempre. Y navegar a ciegas tampoco vale: si `signOut` no llegó a
        // limpiar el token, `src/proxy.ts` rebota a /hoy, allí vuelve a
        // fallar la consulta y se entra en un bucle entre las dos pantallas.
        //
        // La salida es devolver el aviso con su botón, que es exactamente lo
        // que había antes de este componente.
        setNoSePudoSalir(true);
        return;
      }
      // Navegación DURA, y no `router.replace`, que es lo que se usa en el
      // resto de la aplicación. Comprobado al probar TAL-61: desde dentro de un
      // límite de error que ya ha sustituido el árbol, la navegación de cliente
      // del App Router no llega a ocurrir y la pantalla se queda con el
      // mensaje puesto para siempre. Recargar entero es además lo más limpio
      // aquí: el estado de la aplicación ya no sirve de nada.
      //
      // Va DESPUÉS del `await`: si se recargara antes de que `signOut` termine,
      // el token seguiría en el navegador y `src/proxy.ts` rebotaría a /hoy.
      window.location.replace("/login");
    })();
  }, [signOut]);

  if (noSePudoSalir) {
    return (
      <AvisoDeAcceso
        tono="acceso"
        mensaje="Tu sesión ha terminado, pero no hemos podido cerrarla del todo. Vuelve a intentarlo."
      />
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <p className="text-sm text-text-muted">
        Volviendo a la pantalla de acceso…
      </p>
    </main>
  );
}

interface Props {
  children: ReactNode;
}

interface State {
  error: unknown;
}

export class LimiteDeError extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  render() {
    if (this.state.error !== null) {
      const error = this.state.error;
      // Sesión que ya no existe: no es una expulsión que explicar, es volver a
      // entrar. Se comprueba antes que nada porque también llega como
      // ConvexError con texto y si no caería en la rama de acceso de abajo.
      if (error instanceof ConvexError && error.data === SESION_INVALIDA) {
        return <VolverAlLogin />;
      }
      // Distinguir "te han retirado el acceso" de "algo ha fallado" (TAL-69,
      // S9). Nuestros mensajes de autorización llegan como ConvexError con
      // texto; un corte de red, no. Antes todo salía como «No puedes seguir»
      // con un único botón de cerrar sesión, así que un fallo pasajero parecía
      // una expulsión y la única salida ofrecida era irse.
      const esDeAcceso =
        error instanceof ConvexError && typeof error.data === "string";
      return (
        <AvisoDeAcceso
          tono={esDeAcceso ? "acceso" : "fallo"}
          mensaje={mensajeError(
            error,
            "Puede ser un problema de conexión. Vuelve a intentarlo en un momento.",
          )}
          // Reiniciar el estado vuelve a montar el árbol y repite las consultas.
          // Sin esto el límite no se recupera nunca y hay que recargar a mano.
          // No se ofrece cuando el acceso está retirado: ahí no hay nada que
          // reintentar, y volver a intentarlo sería solo insistir.
          onReintentar={
            esDeAcceso ? undefined : () => this.setState({ error: null })
          }
        />
      );
    }
    return this.props.children;
  }
}
