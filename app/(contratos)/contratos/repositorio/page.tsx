import type { Metadata } from "next";
import { EnConstruccion } from "@/components/contratos/EnConstruccion";

export const metadata: Metadata = { title: "Repositorio · Contratos" };

export default function Page() {
  return <EnConstruccion titulo="Repositorio" descripcion="Contratos formalizados con extracción de IA." />;
}
