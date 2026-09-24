import type { Metadata } from "next";
import { AprobacionesDirectivo } from "@/components/contratos/AprobacionesDirectivo";

export const metadata: Metadata = { title: "Aprobaciones · Contratos" };

export default function Page() {
  return <AprobacionesDirectivo />;
}
