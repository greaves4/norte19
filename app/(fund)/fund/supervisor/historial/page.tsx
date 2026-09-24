import type { Metadata } from "next";
import { HistorialSupervisor } from "@/components/fund/HistorialSupervisor";

export const metadata: Metadata = { title: "Historial · Fund" };

export default function Page() {
  return <HistorialSupervisor />;
}
