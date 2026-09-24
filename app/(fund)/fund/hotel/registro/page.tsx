import type { Metadata } from "next";
import { RegistroHotel } from "@/components/fund/RegistroHotel";

export const metadata: Metadata = { title: "Registro · Fund" };

export default function Page() {
  return <RegistroHotel />;
}
