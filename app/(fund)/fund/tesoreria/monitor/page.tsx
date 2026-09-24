import type { Metadata } from "next";
import { EnConstruccion } from "@/components/fund/EnConstruccion";

export const metadata: Metadata = { title: "Monitor de conciliación · Fund" };

export default function Page() {
  return <EnConstruccion titulo="Monitor de conciliación" descripcion="Estado de cuenta Pay Connect contra los registros de Fund." />;
}
