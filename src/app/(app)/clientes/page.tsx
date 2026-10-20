import { guardAuth } from "@/lib/authGuard";
import { ClientesClient } from "./ClientesClient";

export default async function ClientesPage() {
  await guardAuth();
  return <ClientesClient />;
}
