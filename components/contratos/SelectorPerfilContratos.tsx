"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { ICONOS_PERFIL, INICIO_CONTRATOS } from "@/components/contratos/ContratosShell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemo } from "@/lib/demo";
import { USUARIOS_CONTRATOS } from "@/lib/fixtures/contratos";
import type { PerfilContratos } from "@/lib/types/contratos";

const OPCIONES: { perfil: PerfilContratos; titulo: string; area: string; descripcion: string }[] = [
  { perfil: "solicitante", titulo: "Solicitante", area: "Desarrollo", descripcion: "Pide un contrato, sube el expediente y sigue su estatus." },
  { perfil: "abogado", titulo: "Abogado", area: "Dirección Jurídica", descripcion: "Analiza solicitudes, cuida los SLA y las envía a aprobación." },
  { perfil: "directivo", titulo: "Directivo", area: "Dirección Jurídica", descripcion: "Aprueba o regresa a ajustes con un motivo." },
  { perfil: "admin", titulo: "Admin legal", area: "Administración legal", descripcion: "Firma, repositorio, búsqueda inteligente y custodia." },
];

export function SelectorPerfilContratos() {
  const router = useRouter();
  const { setProfile } = useDemo();

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Contratos · Gestión de contratos con inteligencia documental</p>
        <h1 className="text-2xl font-semibold">Entrar como…</h1>
        <p className="text-muted-foreground">En producción el acceso es con tu usuario de red (Active Directory), sin correos.</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OPCIONES.map((o) => {
          const Icono = ICONOS_PERFIL[o.perfil];
          return (
            <li key={o.perfil}>
              <button
                type="button"
                onClick={() => {
                  setProfile(o.perfil);
                  router.push(INICIO_CONTRATOS[o.perfil]);
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
                    <p className="text-xs text-muted-foreground">{USUARIOS_CONTRATOS[o.perfil].nombre}</p>
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
