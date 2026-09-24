import type { Metadata } from "next";
import { ReportesTesoreria } from "@/components/fund/ReportesTesoreria";

export const metadata: Metadata = { title: "Reportes · Fund" };

export default function Page() {
  return <ReportesTesoreria />;
}
