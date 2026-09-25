import type { Metadata } from "next";
import { DashboardContratos } from "@/components/contratos/DashboardContratos";

export const metadata: Metadata = { title: "Dashboard · Contratos" };

export default function Page() {
  return <DashboardContratos />;
}
