import type { Metadata } from "next";
import { EnConstruccion } from "@/components/desarrollo/EnConstruccion";

export const metadata: Metadata = { title: "Inputs · Desarrollo" };

export default function Page() {
  return <EnConstruccion titulo="Inputs" descripcion="Inputs obligatorios y complementarios con gate de insuficiencia." />;
}
