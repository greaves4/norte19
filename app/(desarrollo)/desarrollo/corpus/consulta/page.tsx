import type { Metadata } from "next";
import { ConsultaCorpus } from "@/components/desarrollo/ConsultaCorpus";

export const metadata: Metadata = { title: "Consulta del corpus · Desarrollo" };

export default function Page() {
  return <ConsultaCorpus />;
}
