import type { Metadata } from "next";
import { DetalleLegal } from "@/components/contratos/DetalleLegal";

export const metadata: Metadata = { title: "Solicitud · Contratos" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetalleLegal id={id} />;
}
