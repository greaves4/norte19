import type { Metadata } from "next";
import { InputsProyecto } from "@/components/desarrollo/InputsProyecto";

export const metadata: Metadata = { title: "Inputs · Desarrollo" };

export default function Page() {
  return <InputsProyecto />;
}
