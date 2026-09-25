import type { Metadata } from "next";
import { AuditoriaProyecto } from "@/components/desarrollo/AuditoriaProyecto";

export const metadata: Metadata = { title: "Auditoría · Desarrollo" };

export default function Page() {
  return <AuditoriaProyecto />;
}
