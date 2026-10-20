import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generado por `npx convex dev` / `npx convex deploy` — no es código propio.
    "convex/_generated/**",
    // Material de referencia del diseño (prototipo .dc.html y su runtime), no
    // forma parte de la app — ver design/design_handoff_crm_pwa/README.md.
    "design/**",
  ]),
]);

export default eslintConfig;
