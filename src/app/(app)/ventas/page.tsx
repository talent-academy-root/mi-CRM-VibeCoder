import { guardAuth } from "@/lib/authGuard";
import { VentasClient } from "./VentasClient";

export default async function VentasPage() {
  await guardAuth();
  return <VentasClient />;
}
