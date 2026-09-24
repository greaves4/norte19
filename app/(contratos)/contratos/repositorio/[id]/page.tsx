import type { Metadata } from "next";
import { EnConstruccion } from "@/components/contratos/EnConstruccion";

export const metadata: Metadata = { title: "Contrato · Contratos" };

export default function Page() {
  return <EnConstruccion titulo="Contrato" descripcion="Documento con los datos extraídos por la IA." />;
}
