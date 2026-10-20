import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Tareas periódicas del CRM. Hoy solo una: barrer las solicitudes de código
 * caducadas (TAL-69, S2).
 */
const crons = cronJobs();

// El identificador va sin acentos a propósito: Convex solo admite ASCII no de
// control (`validatedCronIdentifier`, node_modules/convex/src/server/cron.ts).
crons.interval(
  "limpiar solicitudes de recuperacion caducadas",
  { hours: 1 },
  internal.recuperacion.limpiarIntentosViejos,
  {},
);

export default crons;
