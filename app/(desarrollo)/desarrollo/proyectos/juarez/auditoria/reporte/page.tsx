import type { Metadata } from "next";
import { EnConstruccion } from "@/components/desarrollo/EnConstruccion";

export const metadata: Metadata = { title: "Reporte de auditoría · Desarrollo" };

export default function Page() {
  return <EnConstruccion titulo="Reporte de auditoría" descripcion="Score, hallazgos, clash report y plan de acción." />;
}
