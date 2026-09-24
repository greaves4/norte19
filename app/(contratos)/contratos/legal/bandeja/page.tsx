import type { Metadata } from "next";
import { EnConstruccion } from "@/components/contratos/EnConstruccion";

export const metadata: Metadata = { title: "Bandeja de Legal · Contratos" };

export default function Page() {
  return <EnConstruccion titulo="Bandeja de Legal" descripcion="Kanban de solicitudes con SLA por abogado." />;
}
