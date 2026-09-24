"use client";

import {
  BookOpen,
  ChartColumn,
  ClipboardList,
  CreditCard,
  History,
  Inbox,
  Landmark,
  ListChecks,
  Scale,
  ShieldCheck,
  CircleX,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell, type NavItem } from "@/components/shared/AppShell";
import { DemoBar, type DemoProfile } from "@/components/shared/DemoBar";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemo, useDemoHydrated } from "@/lib/demo";
import { HOTEL_DEMO_ID, hotelPorId, USUARIOS_DEMO } from "@/lib/fixtures/fund";
import { useFund, useFundHydrated } from "@/lib/store/fund";
import type { PerfilFund } from "@/lib/types/fund";

export const PERFILES_FUND: (DemoProfile & { value: PerfilFund })[] = [
  { value: "hotel", label: "Recepción" },
  { value: "supervisor", label: "Supervisor" },
  { value: "tesoreria", label: "Tesorería" },
];

export const INICIO_PERFIL: Record<PerfilFund, string> = {
  hotel: "/fund/hotel/registro",
  supervisor: "/fund/supervisor/bandeja",
  tesoreria: "/fund/tesoreria/panel",
};

export function esPerfilFund(valor: unknown): valor is PerfilFund {
  return valor === "hotel" || valor === "supervisor" || valor === "tesoreria";
}

function navegacion(perfil: PerfilFund, pendientes: number): NavItem[] {
  switch (perfil) {
    case "hotel":
      return [
        { label: "Registro", href: "/fund/hotel/registro", icon: ClipboardList },
        { label: "Mis movimientos", href: "/fund/hotel/movimientos", icon: ListChecks },
      ];
    case "supervisor":
      return [
        { label: "Bandeja", href: "/fund/supervisor/bandeja", icon: Inbox, badge: pendientes || undefined },
        { label: "Rechazados", href: "/fund/supervisor/rechazados", icon: CircleX },
        { label: "Historial", href: "/fund/supervisor/historial", icon: History },
      ];
    case "tesoreria":
      return [
        { label: "Panel", href: "/fund/tesoreria/panel", icon: CreditCard },
        { label: "Monitor", href: "/fund/tesoreria/monitor", icon: Scale },
        { label: "Cuentas fondeadoras", href: "#cuentas-fondeadoras", icon: Landmark, disabled: true },
        { label: "Reportes", href: "/fund/tesoreria/reportes", icon: ChartColumn },
        { label: "Catálogos", href: "#catalogos", icon: BookOpen, disabled: true },
        { label: "Seguridad", href: "#seguridad", icon: ShieldCheck, disabled: true },
      ];
  }
}

const reset = () => useFund.getState().reset();

export function FundShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const demoHydrated = useDemoHydrated();
  const fundHydrated = useFundHydrated();
  const { profile } = useDemo();
  const perfil = esPerfilFund(profile) ? profile : null;
  const pendientes = useFund(
    (s) => s.movimientos.filter((m) => m.hotelId === HOTEL_DEMO_ID && m.estatus === "pendiente").length,
  );

  // /fund/<seccion>/…: sin perfil se va al selector; con otro perfil, a su inicio.
  const seccion = pathname.split("/")[2];
  const enSelector = !seccion;
  const destino = !demoHydrated || enSelector ? null : !perfil ? "/fund" : seccion !== perfil ? INICIO_PERFIL[perfil] : null;

  useEffect(() => {
    if (destino) router.replace(destino);
  }, [destino, router]);

  if (enSelector) {
    return (
      <>
        <div className="min-h-svh pb-(--demo-bar-h)">{children}</div>
        <DemoBar profiles={PERFILES_FUND} onReset={reset} />
      </>
    );
  }

  const usuario = perfil ? USUARIOS_DEMO[perfil] : null;
  const listo = demoHydrated && fundHydrated && !destino;

  return (
    <AppShell
      title="Fund"
      subtitle="Caja chica hotelera"
      context={usuario?.hotelId ? hotelPorId(usuario.hotelId)?.nombre : "Corporativo Norte 19 · Tesorería"}
      userName={usuario?.nombre}
      items={perfil ? navegacion(perfil, pendientes) : []}
      profiles={PERFILES_FUND}
      onReset={reset}
    >
      {listo ? children : <CargandoPagina />}
    </AppShell>
  );
}

function CargandoPagina() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
