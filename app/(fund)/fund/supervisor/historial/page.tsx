import type { Metadata } from "next";
import { EnConstruccion } from "@/components/fund/EnConstruccion";

export const metadata: Metadata = { title: "Historial · Fund" };

export default function Page() {
  return <EnConstruccion titulo="Historial" descripcion="Todos los movimientos del hotel con su historial." />;
}
