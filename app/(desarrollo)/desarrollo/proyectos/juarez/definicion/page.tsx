import type { Metadata } from "next";
import { FaseDefinicion } from "@/components/desarrollo/definicion/FaseDefinicion";

export const metadata: Metadata = { title: "Fase de Definición · Desarrollo" };

export default function Page() {
  return <FaseDefinicion />;
}
