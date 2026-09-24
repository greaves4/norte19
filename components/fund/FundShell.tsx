"use client";

import { House } from "lucide-react";
import { AppShell, type NavItem } from "@/components/shared/AppShell";
import type { DemoProfile } from "@/components/shared/DemoBar";
import { useFund } from "@/lib/store/fund";
import type { PerfilFund } from "@/lib/types/fund";

// TODO F3: navegación por perfil, contexto según perfil y redirección al selector si no hay perfil.
const profiles: (DemoProfile & { value: PerfilFund })[] = [
  { value: "hotel", label: "Recepción" },
  { value: "supervisor", label: "Supervisor" },
  { value: "tesoreria", label: "Tesorería" },
];

const items: NavItem[] = [{ label: "Inicio", href: "/fund", icon: House }];

export function FundShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="Fund"
      subtitle="Caja chica hotelera"
      context="City Express Cancún Aeropuerto"
      items={items}
      profiles={profiles}
      onReset={() => useFund.getState().reset()}
    >
      {children}
    </AppShell>
  );
}
