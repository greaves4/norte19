import type { Metadata } from "next";
import { EnConstruccion } from "@/components/fund/EnConstruccion";

export const metadata: Metadata = { title: "Reportes · Fund" };

export default function Page() {
  return <EnConstruccion titulo="Reportes" descripcion="Reporte general, SLA de aprobación, gastos y fondeos." />;
}
