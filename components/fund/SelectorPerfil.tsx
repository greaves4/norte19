"use client";

import { Building2, ChevronRight, ClipboardList, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import { INICIO_PERFIL } from "@/components/fund/FundShell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemo } from "@/lib/demo";
import { hotelPorId, USUARIOS_DEMO } from "@/lib/fixtures/fund";
import type { PerfilFund } from "@/lib/types/fund";

const OPCIONES: { perfil: PerfilFund; titulo: string; lugar: string; icono: typeof Inbox; descripcion: string }[] = [
  {
    perfil: "hotel",
    titulo: "Recepción",
    lugar: hotelPorId(USUARIOS_DEMO.hotel.hotelId!)!.nombre,
    icono: ClipboardList,
    descripcion: "Registra gastos de caja chica con su factura y comprobante.",
  },
  {
    perfil: "supervisor",
    titulo: "Supervisor",
    lugar: hotelPorId(USUARIOS_DEMO.supervisor.hotelId!)!.nombre,
    icono: Inbox,
    descripcion: "Revisa y aprueba los movimientos del hotel.",
  },
  {
    perfil: "tesoreria",
    titulo: "Tesorería",
    lugar: "Corporativo",
    icono: Building2,
    descripcion: "Administra tarjetas, re-fondeos, conciliación y reportes.",
  },
];

export function SelectorPerfil() {
  const router = useRouter();
  const { setProfile } = useDemo();

  function entrar(perfil: PerfilFund) {
    setProfile(perfil);
    router.push(INICIO_PERFIL[perfil]);
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Fund · Caja chica hotelera</p>
        <h1 className="text-2xl font-semibold">Entrar como…</h1>
        <p className="text-muted-foreground">En producción el acceso es con tu usuario de red (Active Directory).</p>
      </header>

      <ul className="grid gap-4 md:grid-cols-3">
        {OPCIONES.map((o) => (
          <li key={o.perfil}>
            <button
              type="button"
              onClick={() => entrar(o.perfil)}
              className="group h-full w-full text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full transition-colors group-hover:bg-muted/50">
                <CardHeader className="gap-3">
                  <o.icono className="size-5 text-muted-foreground" aria-hidden />
                  <div className="flex flex-col gap-1">
                    <CardTitle className="flex items-center justify-between gap-2">
                      Entrar como {o.titulo}
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </CardTitle>
                    <CardDescription>{o.lugar}</CardDescription>
                  </div>
                  <p className="text-sm text-muted-foreground">{o.descripcion}</p>
                  <p className="text-xs text-muted-foreground">Usuario: {USUARIOS_DEMO[o.perfil].nombre}</p>
                </CardHeader>
              </Card>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
