import type { Metadata } from "next";
import { BandejaFirma } from "@/components/contratos/BandejaFirma";

export const metadata: Metadata = { title: "Firma · Contratos" };

export default function Page() {
  return <BandejaFirma />;
}
