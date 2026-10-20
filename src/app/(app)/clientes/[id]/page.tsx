import { guardAuth } from "@/lib/authGuard";
import { FichaClienteClient } from "./FichaClienteClient";

// Next.js 16: `params` y `searchParams` son asíncronos. `?nuevo=1` lo pone el alta
// al navegar aquí; se pasa como booleano para el toast "Cliente añadido".
export default async function FichaClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  await guardAuth();
  const { id } = await params;
  const sp = await searchParams;
  return <FichaClienteClient id={id} justCreated={sp.nuevo === "1"} />;
}
