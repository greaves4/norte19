import type { Metadata } from "next";
import { EnConstruccion } from "@/components/fund/EnConstruccion";

export const metadata: Metadata = { title: "Panel de tarjetas · Fund" };

export default function Page() {
  return <EnConstruccion titulo="Panel de tarjetas" descripcion="Tarjetas, saldos, re-fondeos y excepciones." />;
}
