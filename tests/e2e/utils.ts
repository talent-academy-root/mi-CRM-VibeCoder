import { expect, type Page } from "@playwright/test";

/**
 * Usuarios de prueba sembrados con `seed:sembrarUsuariosPrueba` (uno por rol).
 * Las credenciales llegan de `.env.e2e` (lo carga playwright.config.ts).
 */
export type RolPrueba = "propietaria" | "comercial";

export const credenciales: Record<
  RolPrueba,
  { email?: string; password?: string }
> = {
  propietaria: {
    email: process.env.E2E_PROPIETARIA_EMAIL,
    password: process.env.E2E_PROPIETARIA_PASSWORD,
  },
  comercial: {
    email: process.env.E2E_COMERCIAL_EMAIL,
    password: process.env.E2E_COMERCIAL_PASSWORD,
  },
};

export function hayCredenciales(rol: RolPrueba): boolean {
  const c = credenciales[rol];
  return !!(c.email && c.password);
}

/**
 * Recorre el login en dos pasos (correo → contraseña) hasta aterrizar en /hoy.
 * Asume que el correo YA tiene contraseña configurada; si el servidor pide
 * código de primera vez, la prueba falla (y está bien: significa que el
 * usuario de pruebas no está bien sembrado).
 */
export async function iniciarSesion(page: Page, rol: RolPrueba) {
  const c = credenciales[rol];
  if (!c.email || !c.password) {
    throw new Error(`Faltan credenciales e2e del rol "${rol}" (.env.e2e).`);
  }
  await page.goto("/login");
  await page.getByLabel("Correo").fill(c.email);
  await page.getByRole("button", { name: "Continuar" }).click();
  // Con getByLabel a secas casaría también el botón "Mostrar contraseña".
  await page.getByRole("textbox", { name: "Contraseña" }).fill(c.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/hoy/, { timeout: 15_000 });
}
