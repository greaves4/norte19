import type { Metadata } from "next";
import { Repositorio } from "@/components/contratos/Repositorio";

export const metadata: Metadata = { title: "Repositorio · Contratos" };

export default function Page() {
  return <Repositorio />;
}
