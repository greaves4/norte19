import type { Metadata } from "next";
import { EnConstruccion } from "@/components/contratos/EnConstruccion";

export const metadata: Metadata = { title: "Seguimiento de firma · Contratos" };

export default function Page() {
  return <EnConstruccion titulo="Seguimiento de firma" descripcion="Pasos de la firma electrónica y sello del documento." />;
}
