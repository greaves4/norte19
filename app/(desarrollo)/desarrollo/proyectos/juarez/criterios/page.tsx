import type { Metadata } from "next";
import { EnConstruccion } from "@/components/desarrollo/EnConstruccion";

export const metadata: Metadata = { title: "Criterios por disciplina · Desarrollo" };

export default function Page() {
  return <EnConstruccion titulo="Criterios por disciplina" descripcion="Criterios de diseño con su fuente en el corpus." />;
}
