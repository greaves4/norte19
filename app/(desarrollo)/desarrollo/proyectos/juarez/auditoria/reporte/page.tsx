import type { Metadata } from "next";
import { ReporteAuditoria } from "@/components/desarrollo/ReporteAuditoria";

export const metadata: Metadata = { title: "Reporte de auditoría · Desarrollo" };

export default function Page() {
  return <ReporteAuditoria />;
}
