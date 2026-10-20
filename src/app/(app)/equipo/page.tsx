import { ShieldAlert } from "lucide-react";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/lib/convexApi";
import { guardAuth } from "@/lib/authGuard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AvisoDeAcceso } from "@/components/layout/LimiteDeError";
import { EquipoClient } from "./EquipoClient";

/**
 * Gate REAL de autorización (no solo ocultar el tab): primero exige sesión
 * (guardAuth → /login si no hay), luego comprueba el ROL server-side. Un usuario
 * "comercial" que teclee /equipo ve "Acceso restringido".
 *
 * Es la primera de tres capas, no la única: las funciones de Convex del panel
 * exigen `requirePropietaria` por su cuenta, y las reglas de negocio se
 * comprueban dentro de cada mutation.
 */
export default async function EquipoPage() {
  await guardAuth();

  const token = await convexAuthNextjsToken();

  // Esta consulta corre en el SERVIDOR, así que el `LimiteDeError` del cliente
  // no la cubre: si lanza, sale la pantalla de error de Next (TAL-69, S8). Y
  // lanza en un caso perfectamente normal — a alguien le retiran el acceso
  // mientras tiene la aplicación abierta: `guardAuth()` pasa, porque su JWT
  // sigue siendo válido hasta una hora, y `requireUsuario` la rechaza.
  //
  // Un `redirect("/login")` aquí NO valdría, y conviene dejarlo escrito: redirigir
  // desde el servidor no toca el token del navegador, así que `src/proxy.ts`
  // seguiría viendo una sesión autenticada y rebotaría de vuelta a `/hoy`. Sería
  // un bucle, no una salida.
  //
  // La salida solo puede ocurrir en el cliente, cerrando la sesión de verdad
  // antes de navegar. Eso es exactamente lo que hace `AvisoDeAcceso`.
  let user;
  try {
    user = await fetchQuery(api.usuarios.actual, {}, { token });
  } catch {
    // Sin reintento: la consulta ya ocurrió en el servidor y no hay estado de
    // cliente que reiniciar. El motivo interno no viaja; el mensaje es fijo.
    return (
      <AvisoDeAcceso
        tono="acceso"
        mensaje="Tu acceso ha cambiado. Vuelve a iniciar sesión."
      />
    );
  }

  if (user.rol !== "propietaria") {
    return (
      <div className="pt-8">
        <EmptyState
          icon={<ShieldAlert className="size-6" aria-hidden />}
          title="Acceso restringido"
          help="Solo la dueña puede gestionar el equipo."
        />
      </div>
    );
  }

  // Se le pasa quién es para poder ocultar el botón de retirarse el acceso a
  // una misma. Es solo presentación: quien lo impide de verdad es el servidor.
  return <EquipoClient yoId={user._id} />;
}
