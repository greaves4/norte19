import type { Metadata } from "next";
import { EnConstruccion } from "@/components/desarrollo/EnConstruccion";

export const metadata: Metadata = { title: "Biblioteca de soluciones · Desarrollo" };

export default function Page() {
  return <EnConstruccion titulo="Biblioteca de soluciones" descripcion="Detalles, fichas y especificaciones del corpus." />;
}
