import { test, expect } from "@playwright/test";
import { hayCredenciales, iniciarSesion } from "./utils";

// Recorridos autenticados con los usuarios de prueba de cada rol. Sin
// credenciales (.env.e2e) se salta el bloque correspondiente.

test.describe("como propietaria", () => {
  test.skip(
    !hayCredenciales("propietaria"),
    "Sin credenciales e2e de propietaria (.env.e2e).",
  );

  test.beforeEach(async ({ page }) => {
    await iniciarSesion(page, "propietaria");
  });

  test("tras entrar se aterriza en Hoy con la navegación visible", async ({
    page,
  }) => {
    await expect(page).toHaveURL(/\/hoy/);
    await expect(page.getByRole("link", { name: "Hoy" }).first()).toBeVisible();
  });

  test("se puede navegar a Clientes y a Ventas", async ({ page }) => {
    await page.getByRole("link", { name: "Clientes" }).first().click();
    await expect(page).toHaveURL(/\/clientes/);

    await page.getByRole("link", { name: "Ventas" }).first().click();
    await expect(page).toHaveURL(/\/ventas/);
  });

  test("ve la sección Equipo (solo propietaria)", async ({ page }) => {
    await page.getByRole("link", { name: "Equipo" }).first().click();
    await expect(page).toHaveURL(/\/equipo/);
  });

  test("con sesión iniciada, /login redirige a /hoy", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/hoy/);
  });
});

test.describe("como comercial", () => {
  test.skip(
    !hayCredenciales("comercial"),
    "Sin credenciales e2e de comercial (.env.e2e).",
  );

  test.beforeEach(async ({ page }) => {
    await iniciarSesion(page, "comercial");
  });

  test("entra a Hoy pero NO ve Equipo en la navegación", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Hoy" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Equipo" })).toHaveCount(0);
  });
});
