import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

// Next.js 16: el antiguo `middleware.ts` se llama ahora `proxy.ts`. Con estructura
// `src/`, debe vivir en `src/` (al mismo nivel que `app`). Aquí solo hacemos
// redirección OPTIMISTA (no es la autz real: eso vive en las funciones Convex y
// en el check por página de /equipo).
const isLoginPage = createRouteMatcher(["/login"]);
const isProtected = createRouteMatcher([
  "/hoy(.*)",
  "/clientes(.*)",
  "/ventas(.*)",
  "/equipo(.*)",
  "/cuenta(.*)",
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authenticated = await convexAuth.isAuthenticated();
  if (isLoginPage(request) && authenticated) {
    return nextjsMiddlewareRedirect(request, "/hoy");
  }
  if (isProtected(request) && !authenticated) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
