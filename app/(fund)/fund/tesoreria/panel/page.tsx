import type { Metadata } from "next";
import { PanelTesoreria } from "@/components/fund/PanelTesoreria";

export const metadata: Metadata = { title: "Panel de tarjetas · Fund" };

export default function Page() {
  return <PanelTesoreria />;
}
