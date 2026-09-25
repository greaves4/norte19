import type { Metadata } from "next";
import { CorpusDesarrollo } from "@/components/desarrollo/CorpusDesarrollo";

export const metadata: Metadata = { title: "Corpus · Desarrollo" };

export default function Page() {
  return <CorpusDesarrollo />;
}
