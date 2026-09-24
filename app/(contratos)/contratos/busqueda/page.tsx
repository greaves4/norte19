import type { Metadata } from "next";
import { EnConstruccion } from "@/components/contratos/EnConstruccion";

export const metadata: Metadata = { title: "Búsqueda inteligente · Contratos" };

export default function Page() {
  return <EnConstruccion titulo="Búsqueda inteligente" descripcion="Pregunta en lenguaje natural sobre los contratos." />;
}
