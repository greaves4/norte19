import type { Metadata } from "next";
import { DetalleTarjeta } from "@/components/fund/DetalleTarjeta";

export const metadata: Metadata = { title: "Tarjeta · Fund" };

export default async function Page({ params }: { params: Promise<{ tarjetaId: string }> }) {
  const { tarjetaId } = await params;
  return <DetalleTarjeta tarjetaId={tarjetaId} />;
}
