import type { Metadata } from "next";
import { EnConstruccion } from "@/components/contratos/EnConstruccion";

export const metadata: Metadata = { title: "Firma electrónica · Contratos" };

export default function Page() {
  return <EnConstruccion titulo="Firma electrónica" descripcion="Solicitudes aprobadas en proceso de firma." />;
}
