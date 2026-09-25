import type { Metadata } from "next";
import { CatalogosObra } from "@/components/desarrollo/CatalogosObra";

export const metadata: Metadata = { title: "Catálogos de obra · Desarrollo" };

export default function Page() {
  return <CatalogosObra />;
}
