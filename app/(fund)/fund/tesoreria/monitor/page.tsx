import type { Metadata } from "next";
import { MonitorConciliacion } from "@/components/fund/MonitorConciliacion";

export const metadata: Metadata = { title: "Monitor de conciliación · Fund" };

export default function Page() {
  return <MonitorConciliacion />;
}
