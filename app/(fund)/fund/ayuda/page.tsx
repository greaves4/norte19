import type { Metadata } from "next";
import { AyudaFund } from "@/components/fund/AyudaFund";

export const metadata: Metadata = { title: "Ayuda · Fund" };

export default function Page() {
  return <AyudaFund />;
}
