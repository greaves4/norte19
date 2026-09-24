import type { Metadata } from "next";
import { BandejaLegal } from "@/components/contratos/BandejaLegal";

export const metadata: Metadata = { title: "Bandeja · Contratos" };

export default function Page() {
  return <BandejaLegal />;
}
