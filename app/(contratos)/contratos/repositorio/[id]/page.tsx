import type { Metadata } from "next";
import { DetalleContrato } from "@/components/contratos/DetalleContrato";

export const metadata: Metadata = { title: "Contrato · Contratos" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pagina?: string }> }) {
  const { id } = await params;
  const { pagina } = await searchParams;
  const n = Number(pagina);
  return <DetalleContrato id={id} paginaInicial={Number.isInteger(n) && n > 0 ? n : undefined} />;
}
