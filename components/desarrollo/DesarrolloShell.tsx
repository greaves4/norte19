"use client";

import { BookMarked, Building2, ClipboardCheck, ClipboardList, Compass, Database, FileBarChart, HardHat, Library, ListChecks, Table2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell, type NavItem } from "@/components/shared/AppShell";
import { DemoBar, type DemoProfile } from "@/components/shared/DemoBar";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemo, useDemoHydrated } from "@/lib/demo";
import { USUARIOS_DESARROLLO } from "@/lib/fixtures/desarrollo";
import { useDesarrollo, useDesarrolloHydrated } from "@/lib/store/desarrollo";
import type { PerfilDesarrollo } from "@/lib/types/desarrollo";

export const PERFILES_DESARROLLO: (DemoProfile & { value: PerfilDesarrollo })[] = [
  { value: "direccion", label: "Dirección" },
  { value: "revisor", label: "Revisor" },
  { value: "proyectista", label: "Proyectista" },
];

export const INICIO_DESARROLLO: Record<PerfilDesarrollo, string> = {
  direccion: "/desarrollo/corpus",
  revisor: "/desarrollo/proyectos/juarez",
  proyectista: "/desarrollo/proyectos/juarez",
};

export const ICONOS_PERFIL_DESARROLLO = { direccion: Compass, revisor: ClipboardCheck, proyectista: HardHat } as const;

const P = "/desarrollo/proyectos/juarez";
const TODOS: PerfilDesarrollo[] = ["direccion", "revisor", "proyectista"];

// Acceso por ruta según el documento; gana la regla con el prefijo más largo (p. ej. /auditoria/reporte es para todos).
const ACCESO: [string, PerfilDesarrollo[]][] = [
  ["/desarrollo/corpus", ["direccion", "revisor"]],
  ["/desarrollo/corpus/consulta", TODOS],
  [P, TODOS],
  [`${P}/inputs`, ["direccion", "proyectista"]],
  [`${P}/definicion`, ["direccion", "revisor"]],
  [`${P}/criterios`, ["proyectista", "revisor"]],
  [`${P}/biblioteca`, ["proyectista", "revisor"]],
  [`${P}/completitud`, ["proyectista"]],
  [`${P}/catalogos`, ["direccion", "proyectista"]],
  [`${P}/semaforo`, ["direccion", "revisor"]],
  [`${P}/auditoria`, ["revisor", "direccion"]],
  [`${P}/auditoria/reporte`, TODOS],
];

export function esPerfilDesarrollo(valor: unknown): valor is PerfilDesarrollo {
  return valor === "direccion" || valor === "revisor" || valor === "proyectista";
}

export function puedeVerDesarrollo(perfil: PerfilDesarrollo, ruta: string) {
  const reglas = ACCESO.filter(([prefijo]) => ruta === prefijo || ruta.startsWith(`${prefijo}/`)).sort((a, b) => b[0].length - a[0].length);
  return reglas.length ? reglas[0][1].includes(perfil) : false;
}

function navegacion(perfil: PerfilDesarrollo): NavItem[] {
  switch (perfil) {
    case "direccion":
      return [
        { label: "Corpus", href: "/desarrollo/corpus", icon: Database },
        { label: "Proyecto Juárez", href: P, icon: Building2 },
        { label: "Reportes", href: "#reportes", icon: FileBarChart, disabled: true },
      ];
    case "revisor":
      return [
        { label: "Corpus", href: "/desarrollo/corpus", icon: Database },
        { label: "Proyecto Juárez", href: P, icon: Building2 },
        { label: "Colas de revisión", href: "#colas", icon: ClipboardList, disabled: true },
      ];
    case "proyectista":
      return [
        { label: "Proyecto Juárez", href: P, icon: Building2 },
        { label: "Criterios", href: `${P}/criterios`, icon: BookMarked },
        { label: "Biblioteca", href: `${P}/biblioteca`, icon: Library },
        { label: "Completitud", href: `${P}/completitud`, icon: ListChecks },
        { label: "Catálogos", href: `${P}/catalogos`, icon: Table2 },
      ];
  }
}

const reset = () => useDesarrollo.getState().reset();

export function DesarrolloShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const demoHydrated = useDemoHydrated();
  const desarrolloHydrated = useDesarrolloHydrated();
  const { profile } = useDemo();
  const perfil = esPerfilDesarrollo(profile) ? profile : null;
  const usuario = perfil ? USUARIOS_DESARROLLO[perfil] : null;

  const enSelector = pathname === "/desarrollo";
  const destino = !demoHydrated || enSelector ? null : !perfil ? "/desarrollo" : puedeVerDesarrollo(perfil, pathname) ? null : INICIO_DESARROLLO[perfil];

  useEffect(() => {
    if (destino) router.replace(destino);
  }, [destino, router]);

  if (enSelector) {
    return (
      <>
        <div className="min-h-svh pb-(--demo-bar-h)">{children}</div>
        <DemoBar profiles={PERFILES_DESARROLLO} onReset={reset} />
      </>
    );
  }

  const listo = demoHydrated && desarrolloHydrated && !destino;
  return (
    <AppShell
      title="Desarrollo hotelero"
      subtitle="Proyecto ejecutivo y auditoría"
      context={perfil === "proyectista" ? "Despacho externo · Norte 19" : "Dirección de Desarrollo · Norte 19"}
      userName={usuario?.nombre}
      items={perfil ? navegacion(perfil) : []}
      profiles={PERFILES_DESARROLLO}
      onReset={reset}
    >
      {listo ? children : <Cargando />}
    </AppShell>
  );
}

function Cargando() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
