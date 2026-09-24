import type { Metadata } from "next";
import { EnConstruccion } from "@/components/contratos/EnConstruccion";

export const metadata: Metadata = { title: "Custodia de originales · Contratos" };

export default function Page() {
  return <EnConstruccion titulo="Custodia de originales" descripcion="Ubicación y préstamos de los tres tantos." />;
}
