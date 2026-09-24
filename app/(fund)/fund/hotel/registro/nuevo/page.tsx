import type { Metadata } from "next";
import { NuevoMovimientoForm } from "@/components/fund/NuevoMovimientoForm";

export const metadata: Metadata = { title: "Nuevo movimiento · Fund" };

export default function Page() {
  return <NuevoMovimientoForm />;
}
