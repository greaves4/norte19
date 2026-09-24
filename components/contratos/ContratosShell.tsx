"use client";

import { ChartColumn, FilePlus2, FileSearch, Inbox, Library, ListChecks, Settings, ShieldCheck, Stamp, Vault } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { AppShell, type NavItem } from "@/components/shared/AppShell";
import { DemoBar, type DemoProfile } from "@/components/shared/DemoBar";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemo, useDemoHydrated } from "@/lib/demo";
import { USUARIOS_CONTRATOS } from "@/lib/fixtures/contratos";
import { useContratos, useContratosHydrated } from "@/lib/store/contratos";
import type { PerfilContratos } from "@/lib/types/contratos";

export const PERFILES_CONTRATOS: (DemoProfile & { value: PerfilContratos })[] = [
  { value: "solicitante", label: "Solicitante" },
  { value: "abogado", label: "Abogado" },
  { value: "directivo", label: "Directivo" },
  { value: "admin", label: "Admin legal" },
];

export const INICIO_CONTRATOS: Record<PerfilContratos, string> = {
  solicitante: "/contratos/solicitudes",
  abogado: "/contratos/legal/bandeja",
  directivo: "/contratos/aprobaciones",
  admin: "/contratos/repositorio",
};

// Acceso por prefijo de ruta: varias vistas se comparten entre perfiles.
const ACCESO: [string, PerfilContratos[]][] = [
  ["/contratos/solicitudes", ["solicitante"]],
  ["/contratos/legal/bandeja", ["abogado"]],
  ["/contratos/legal/solicitudes", ["abogado", "directivo", "admin"]],
  ["/contratos/aprobaciones", ["directivo"]],
  ["/contratos/firma", ["abogado", "admin"]],
  ["/contratos/repositorio", ["admin", "abogado"]],
  ["/contratos/busqueda", ["admin", "abogado"]],
  ["/contratos/custodia", ["admin"]],
  ["/contratos/dashboard", ["admin", "directivo"]],
];

export function esPerfilContratos(valor: unknown): valor is PerfilContratos {
  return valor === "solicitante" || valor === "abogado" || valor === "directivo" || valor === "admin";
}

export function puedeVer(perfil: PerfilContratos, ruta: string) {
  const regla = ACCESO.find(([prefijo]) => ruta === prefijo || ruta.startsWith(`${prefijo}/`));
  return regla ? regla[1].includes(perfil) : false;
}

function navegacion(perfil: PerfilContratos, pendientes: { bandeja: number; aprobaciones: number; ajustes: number }): NavItem[] {
  switch (perfil) {
    case "solicitante":
      return [
        { label: "Mis solicitudes", href: "/contratos/solicitudes", icon: ListChecks, badge: pendientes.ajustes || undefined },
        { label: "Nueva solicitud", href: "/contratos/solicitudes/nueva", icon: FilePlus2 },
      ];
    case "abogado":
      return [
        { label: "Bandeja", href: "/contratos/legal/bandeja", icon: Inbox, badge: pendientes.bandeja || undefined },
        { label: "Repositorio", href: "/contratos/repositorio", icon: Library },
        { label: "Búsqueda", href: "/contratos/busqueda", icon: FileSearch },
      ];
    case "directivo":
      return [
        { label: "Aprobaciones", href: "/contratos/aprobaciones", icon: Stamp, badge: pendientes.aprobaciones || undefined },
        { label: "Dashboard", href: "/contratos/dashboard", icon: ChartColumn },
      ];
    case "admin":
      return [
        { label: "Repositorio", href: "/contratos/repositorio", icon: Library },
        { label: "Búsqueda", href: "/contratos/busqueda", icon: FileSearch },
        { label: "Custodia", href: "/contratos/custodia", icon: Vault },
        { label: "Dashboard", href: "/contratos/dashboard", icon: ChartColumn },
        { label: "Configuración", href: "#configuracion", icon: Settings, disabled: true },
      ];
  }
}

const reset = () => useContratos.getState().reset();

export function ContratosShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const demoHydrated = useDemoHydrated();
  const contratosHydrated = useContratosHydrated();
  const { profile } = useDemo();
  const perfil = esPerfilContratos(profile) ? profile : null;
  const usuario = perfil ? USUARIOS_CONTRATOS[perfil] : null;

  const pendientes = useContratos(
    useShallow((s) => ({
    bandeja: s.solicitudes.filter((x) => x.abogadoId === USUARIOS_CONTRATOS.abogado.id && (x.estatus === "nueva" || x.estatus === "en_analisis")).length,
    aprobaciones: s.solicitudes.filter((x) => x.estatus === "en_aprobacion").length,
      ajustes: s.solicitudes.filter((x) => x.solicitanteId === USUARIOS_CONTRATOS.solicitante.id && x.estatus === "en_ajustes").length,
    })),
  );

  const enSelector = pathname === "/contratos";
  const destino = !demoHydrated || enSelector ? null : !perfil ? "/contratos" : puedeVer(perfil, pathname) ? null : INICIO_CONTRATOS[perfil];

  useEffect(() => {
    if (destino) router.replace(destino);
  }, [destino, router]);

  if (enSelector) {
    return (
      <>
        <div className="min-h-svh pb-(--demo-bar-h)">{children}</div>
        <DemoBar profiles={PERFILES_CONTRATOS} onReset={reset} />
      </>
    );
  }

  const listo = demoHydrated && contratosHydrated && !destino;
  return (
    <AppShell
      title="Contratos"
      subtitle="Gestión de contratos"
      context={perfil === "solicitante" ? "Desarrollo · Norte 19" : "Dirección Jurídica · Norte 19"}
      userName={usuario?.nombre}
      items={perfil ? navegacion(perfil, pendientes) : []}
      profiles={PERFILES_CONTRATOS}
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

// Íconos exportados para el selector.
export const ICONOS_PERFIL = { solicitante: FilePlus2, abogado: Inbox, directivo: Stamp, admin: ShieldCheck } as const;
