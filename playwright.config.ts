import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas e2e del CRM (Playwright).
 *
 * - Levanta `npm run dev` automáticamente si no hay un servidor en el 3000
 *   (si ya tienes `next dev` corriendo, lo reutiliza y arranca más rápido).
 * - Las pruebas autenticadas usan los usuarios sembrados por
 *   `seed:sembrarUsuariosPrueba` (e2e.propietaria / e2e.comercial). Sus
 *   credenciales viven en `.env.e2e` (gitignorado), que se carga aquí abajo;
 *   sin ese archivo, las pruebas autenticadas se saltan (skip) y solo corren
 *   las públicas (login, redirecciones).
 */

// Carga .env.e2e sin depender de dotenv. Las variables ya presentes en el
// entorno tienen prioridad (permite sobreescribir puntualmente en CI).
const envE2e = path.join(__dirname, ".env.e2e");
if (fs.existsSync(envE2e)) {
  for (const linea of fs.readFileSync(envE2e, "utf8").split("\n")) {
    const m = linea.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // En CI un test inestable debe fallar, no reintentarse hasta pasar.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
