import { redirect } from "next/navigation";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";

/**
 * Guard server-side por página: sin sesión → /login. Es una segunda capa de
 * defensa además del proxy (`src/proxy.ts`), para que la protección de rutas no
 * dependa de una sola capa. La autz de DATOS vive además en las funciones Convex
 * (`requireUsuario`), que rechazan cualquier acceso sin sesión/rol válido.
 */
export async function guardAuth() {
  if (!(await isAuthenticatedNextjs())) {
    redirect("/login");
  }
}
