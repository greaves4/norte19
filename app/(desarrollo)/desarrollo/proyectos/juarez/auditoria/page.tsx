import type { Metadata } from "next";
import { EnConstruccion } from "@/components/desarrollo/EnConstruccion";

export const metadata: Metadata = { title: "Auditoría · Desarrollo" };

export default function Page() {
  return <EnConstruccion titulo="Auditoría" descripcion="Ejecución de la auditoría integral del paquete." />;
}
