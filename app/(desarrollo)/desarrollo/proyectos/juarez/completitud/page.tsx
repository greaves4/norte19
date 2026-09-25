import type { Metadata } from "next";
import { EnConstruccion } from "@/components/desarrollo/EnConstruccion";

export const metadata: Metadata = { title: "Completitud · Desarrollo" };

export default function Page() {
  return <EnConstruccion titulo="Completitud" descripcion="Checklist de entregables y carga del paquete ejecutivo." />;
}
