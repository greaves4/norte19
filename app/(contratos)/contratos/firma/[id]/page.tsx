import type { Metadata } from "next";
import { SeguimientoFirma } from "@/components/contratos/SeguimientoFirma";

export const metadata: Metadata = { title: "Seguimiento de firma · Contratos" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SeguimientoFirma id={id} />;
}
