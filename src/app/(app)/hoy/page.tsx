import { guardAuth } from "@/lib/authGuard";
import { HoyClient } from "./HoyClient";

// Check server-side por página (además del proxy): sin sesión → /login.
export default async function HoyPage() {
  await guardAuth();
  return <HoyClient />;
}
