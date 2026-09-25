import type { Metadata } from "next";
import { SemaforoTrazabilidad } from "@/components/desarrollo/SemaforoTrazabilidad";

export const metadata: Metadata = { title: "Semáforo y trazabilidad · Desarrollo" };

export default function Page() {
  return <SemaforoTrazabilidad />;
}
