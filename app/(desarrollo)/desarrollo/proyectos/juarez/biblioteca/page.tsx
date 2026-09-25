import type { Metadata } from "next";
import { BibliotecaSoluciones } from "@/components/desarrollo/BibliotecaSoluciones";

export const metadata: Metadata = { title: "Biblioteca de soluciones · Desarrollo" };

export default function Page() {
  return <BibliotecaSoluciones />;
}
