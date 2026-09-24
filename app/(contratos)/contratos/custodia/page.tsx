import type { Metadata } from "next";
import { CustodiaOriginales } from "@/components/contratos/CustodiaOriginales";

export const metadata: Metadata = { title: "Custodia · Contratos" };

export default function Page() {
  return <CustodiaOriginales />;
}
