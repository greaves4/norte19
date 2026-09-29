import type { Metadata } from "next";
import { AyudaDesarrollo } from "@/components/desarrollo/AyudaDesarrollo";

export const metadata: Metadata = { title: "Ayuda · Desarrollo" };

export default function Page() {
  return <AyudaDesarrollo />;
}
