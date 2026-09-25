"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { GateBanner } from "@/components/shared/GateBanner";
import { Button } from "@/components/ui/button";

// Vista de un módulo que se habilita al aprobar la Fase de Definición (Fase 04).
export function RequiereFase({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <PageHeader title={titulo} description={descripcion} />
      <GateBanner
        variant="bloqueado"
        title="Se habilita en la Fase 04"
        description="Este módulo trabaja sobre la Fase de Definición aprobada por el revisor experto."
        action={
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/desarrollo/proyectos/juarez" />}>
            Ver el tablero
          </Button>
        }
      />
    </div>
  );
}
