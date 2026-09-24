import type { Metadata } from "next";
import { Suspense } from "react";
import { NuevaSolicitud } from "@/components/contratos/NuevaSolicitud";

export const metadata: Metadata = { title: "Nueva solicitud · Contratos" };

export default function Page() {
  return (
    <Suspense>
      <NuevaSolicitud />
    </Suspense>
  );
}
