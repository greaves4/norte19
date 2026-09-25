import type { Metadata } from "next";
import { EnConstruccion } from "@/components/desarrollo/EnConstruccion";

export const metadata: Metadata = { title: "Semáforo y trazabilidad · Desarrollo" };

export default function Page() {
  return <EnConstruccion titulo="Semáforo y trazabilidad" descripcion="Avance ponderado de los 13 entregables." />;
}
