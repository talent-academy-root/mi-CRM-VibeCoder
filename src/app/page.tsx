import { redirect } from "next/navigation";

// La app abre siempre en "Hoy" (Tareas del día) — ver PRD/TAL-16.
export default function RootPage() {
  redirect("/hoy");
}
