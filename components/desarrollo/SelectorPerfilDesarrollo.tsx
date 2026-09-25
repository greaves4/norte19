"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { ICONOS_PERFIL_DESARROLLO, INICIO_DESARROLLO } from "@/components/desarrollo/DesarrolloShell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemo } from "@/lib/demo";
import { USUARIOS_DESARROLLO } from "@/lib/fixtures/desarrollo";
import type { PerfilDesarrollo } from "@/lib/types/desarrollo";

const OPCIONES: { perfil: PerfilDesarrollo; titulo: string; area: string; descripcion: string }[] = [
  { perfil: "direccion", titulo: "Dirección de Desarrollo", area: "Emite los estándares", descripcion: "Corpus, Fase de Definición, semáforo y reporte de auditoría." },
  { perfil: "revisor", titulo: "Revisor experto", area: "Arquitectura e ingenierías", descripcion: "Revisa riesgos, aprueba el gate de definición y confirma hallazgos." },
  { perfil: "proyectista", titulo: "Proyectista", area: "Despacho del ejecutivo", descripcion: "Criterios por disciplina, biblioteca, completitud y carga del paquete." },
];

export function SelectorPerfilDesarrollo() {
  const router = useRouter();
  const { setProfile } = useDemo();

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Desarrollo hotelero · Asistente de proyecto ejecutivo y auditoría</p>
        <h1 className="text-2xl font-semibold">Entrar como…</h1>
        <p className="text-muted-foreground">En producción el acceso es con tu usuario de red.</p>
      </header>
      <ul className="grid gap-4 md:grid-cols-3">
        {OPCIONES.map((o) => {
          const Icono = ICONOS_PERFIL_DESARROLLO[o.perfil];
          return (
            <li key={o.perfil}>
              <button
                type="button"
                onClick={() => {
                  setProfile(o.perfil);
                  router.push(INICIO_DESARROLLO[o.perfil]);
                }}
                className="group h-full w-full text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Card className="h-full transition-colors group-hover:bg-muted/50">
                  <CardHeader className="gap-3">
                    <Icono className="size-5 text-muted-foreground" aria-hidden />
                    <div className="flex flex-col gap-1">
                      <CardTitle className="flex items-center justify-between gap-2">
                        {o.titulo}
                        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </CardTitle>
                      <CardDescription>{o.area}</CardDescription>
                    </div>
                    <p className="text-sm text-muted-foreground">{o.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{USUARIOS_DESARROLLO[o.perfil].nombre}</p>
                  </CardHeader>
                </Card>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
