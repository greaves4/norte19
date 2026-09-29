import type { Metadata } from "next";
import { AyudaContratos } from "@/components/contratos/AyudaContratos";

export const metadata: Metadata = { title: "Ayuda · Contratos" };

export default function Page() {
  return <AyudaContratos />;
}
