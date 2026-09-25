import type { Metadata } from "next";
import { EnConstruccion } from "@/components/desarrollo/EnConstruccion";

export const metadata: Metadata = { title: "Catálogos de obra · Desarrollo" };

export default function Page() {
  return <EnConstruccion titulo="Catálogos de obra" descripcion="Conceptos por ratio del corpus con confianza y fuente." />;
}
