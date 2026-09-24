import type { Metadata } from "next";
import { DetalleContrato } from "@/components/contratos/DetalleContrato";

export const metadata: Metadata = { title: "Contrato · Contratos" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetalleContrato id={id} />;
}
