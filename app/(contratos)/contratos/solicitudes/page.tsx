import type { Metadata } from "next";
import { MisSolicitudes } from "@/components/contratos/MisSolicitudes";

export const metadata: Metadata = { title: "Mis solicitudes · Contratos" };

export default function Page() {
  return <MisSolicitudes />;
}
