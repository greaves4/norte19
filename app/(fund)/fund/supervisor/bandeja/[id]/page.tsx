import type { Metadata } from "next";
import { RevisionMovimiento } from "@/components/fund/RevisionMovimiento";

export const metadata: Metadata = { title: "Revisión · Fund" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RevisionMovimiento id={id} />;
}
