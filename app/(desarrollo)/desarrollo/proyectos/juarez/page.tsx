import type { Metadata } from "next";
import { TableroProyecto } from "@/components/desarrollo/TableroProyecto";

export const metadata: Metadata = { title: "Proyecto Ciudad Juárez · Desarrollo" };

export default function Page() {
  return <TableroProyecto />;
}
