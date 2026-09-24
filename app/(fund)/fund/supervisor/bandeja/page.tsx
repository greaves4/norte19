import type { Metadata } from "next";
import { EnConstruccion } from "@/components/fund/EnConstruccion";

export const metadata: Metadata = { title: "Bandeja · Fund" };

export default function Page() {
  return <EnConstruccion titulo="Bandeja" descripcion="Movimientos pendientes de aprobación del hotel." />;
}
