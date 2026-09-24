import type { Metadata } from "next";
import { BandejaSupervisor } from "@/components/fund/BandejaSupervisor";

export const metadata: Metadata = { title: "Bandeja · Fund" };

export default function Page() {
  return <BandejaSupervisor />;
}
