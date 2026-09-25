import type { Metadata } from "next";
import { EnConstruccion } from "@/components/desarrollo/EnConstruccion";

export const metadata: Metadata = { title: "Fase de Definición · Desarrollo" };

export default function Page() {
  return <EnConstruccion titulo="Fase de Definición" descripcion="Cuadro de áreas, marca, decisiones, riesgos y CAPEX." />;
}
