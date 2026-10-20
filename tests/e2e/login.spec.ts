import { test, expect } from "@playwright/test";

// Pruebas públicas: no necesitan credenciales. Cubren el proxy (redirección
// optimista de src/proxy.ts) y el primer paso del login de TAL-60.

test("la raíz sin sesión acaba en /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: "Inicia sesión" }),
  ).toBeVisible();
});

test("las rutas protegidas sin sesión redirigen a /login", async ({ page }) => {
  for (const ruta of ["/hoy", "/clientes", "/ventas", "/equipo", "/cuenta"]) {
    await page.goto(ruta);
    await expect(page, `${ruta} debería redirigir a /login`).toHaveURL(
      /\/login/,
    );
  }
});

test("el paso de correo exige escribir un correo", async ({ page }) => {
  await page.goto("/login");
  const correo = page.getByLabel("Correo");
  await expect(correo).toBeVisible();
  // El input es required: enviar vacío no debe avanzar de paso.
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(correo).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Contraseña" })).toHaveCount(
    0,
  );
});

test("un correo con contraseña avanza al paso de contraseña", async ({
  page,
}) => {
  await page.goto("/login");
  // El seed de dev garantiza este usuario; comprobarCorreo responde igual
  // exista o no, así que la prueba solo valida el flujo de dos pasos.
  await page.getByLabel("Correo").fill("marta@vibecrm.local");
  await page.getByRole("button", { name: "Continuar" }).click();
  // Rol de textbox: getByLabel a secas casaría también "Mostrar contraseña".
  await expect(page.getByRole("textbox", { name: "Contraseña" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("marta@vibecrm.local")).toBeVisible();
});
