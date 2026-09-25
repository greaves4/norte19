import type { Metadata } from "next";
import { BusquedaContratos } from "@/components/contratos/BusquedaContratos";

export const metadata: Metadata = { title: "Búsqueda · Contratos" };

export default function Page() {
  return <BusquedaContratos />;
}
