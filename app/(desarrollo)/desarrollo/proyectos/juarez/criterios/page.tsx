import type { Metadata } from "next";
import { CriteriosDisciplina } from "@/components/desarrollo/CriteriosDisciplina";

export const metadata: Metadata = { title: "Criterios por disciplina · Desarrollo" };

export default function Page() {
  return <CriteriosDisciplina />;
}
