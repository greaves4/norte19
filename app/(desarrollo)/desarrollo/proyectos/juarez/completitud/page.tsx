import type { Metadata } from "next";
import { CompletitudPaquete } from "@/components/desarrollo/CompletitudPaquete";

export const metadata: Metadata = { title: "Completitud · Desarrollo" };

export default function Page() {
  return <CompletitudPaquete />;
}
