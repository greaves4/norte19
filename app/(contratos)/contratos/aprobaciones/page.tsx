import type { Metadata } from "next";
import { EnConstruccion } from "@/components/contratos/EnConstruccion";

export const metadata: Metadata = { title: "Aprobaciones · Contratos" };

export default function Page() {
  return <EnConstruccion titulo="Aprobaciones" descripcion="Solicitudes con análisis listas para aprobar." />;
}
