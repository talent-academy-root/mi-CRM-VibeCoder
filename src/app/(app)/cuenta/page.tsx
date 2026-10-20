import { guardAuth } from "@/lib/authGuard";
import { CuentaClient } from "./CuentaClient";

/**
 * Perfil / Mi cuenta (TAL-61, diseño D13).
 *
 * Aquí basta con `guardAuth()`: no hay gate por rol que decidir en el servidor
 * —esta pantalla es para cualquiera que tenga sesión—, así que no se repite el
 * `fetchQuery` de `equipo/page.tsx`, que existe justo para eso. Los datos los
 * pide el cliente con `useUsuarioActual()`, y cada función de Convex vuelve a
 * comprobar la sesión por su cuenta.
 */
export default async function CuentaPage() {
  await guardAuth();
  return <CuentaClient />;
}
