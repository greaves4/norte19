import type { Metadata } from "next";
import { RechazadosSupervisor } from "@/components/fund/RechazadosSupervisor";

export const metadata: Metadata = { title: "Rechazados · Fund" };

export default function Page() {
  return <RechazadosSupervisor />;
}
