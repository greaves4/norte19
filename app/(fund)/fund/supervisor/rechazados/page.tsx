import type { Metadata } from "next";
import { EnConstruccion } from "@/components/fund/EnConstruccion";

export const metadata: Metadata = { title: "Rechazados · Fund" };

export default function Page() {
  return <EnConstruccion titulo="Rechazados" descripcion="Movimientos rechazados y su autorización." />;
}
