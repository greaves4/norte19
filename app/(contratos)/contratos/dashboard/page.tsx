import type { Metadata } from "next";
import { EnConstruccion } from "@/components/contratos/EnConstruccion";

export const metadata: Metadata = { title: "Dashboard · Contratos" };

export default function Page() {
  return <EnConstruccion titulo="Dashboard" descripcion="Vencimientos, SLA y carga del equipo legal." />;
}
