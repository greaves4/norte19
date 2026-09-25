import type { Metadata } from "next";
import { EnConstruccion } from "@/components/desarrollo/EnConstruccion";

export const metadata: Metadata = { title: "Proyecto Ciudad Juárez · Desarrollo" };

export default function Page() {
  return <EnConstruccion titulo="Proyecto Ciudad Juárez" descripcion="Tablero del proyecto con fases, gates y avance." />;
}
