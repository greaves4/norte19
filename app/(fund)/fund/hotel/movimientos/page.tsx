import type { Metadata } from "next";
import { MisMovimientos } from "@/components/fund/MisMovimientos";

export const metadata: Metadata = { title: "Mis movimientos · Fund" };

export default function Page() {
  return <MisMovimientos />;
}
