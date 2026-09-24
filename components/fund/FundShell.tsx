"use client";

import { House } from "lucide-react";
import { AppShell, type NavItem } from "@/components/shared/AppShell";
import type { DemoProfile } from "@/components/shared/DemoBar";

// TODO F1: navegación por perfil, contexto y reset del store del prototipo.
const profiles: DemoProfile[] = [
  { value: "recepcion", label: "Recepción" },
  { value: "supervisor", label: "Supervisor" },
  { value: "tesoreria", label: "Tesorería" },
];

const items: NavItem[] = [{ label: "Inicio", href: "/fund", icon: House }];

export function FundShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="Fund"
      subtitle="Caja chica hotelera"
      context="City Express Plus Insurgentes Sur"
      items={items}
      profiles={profiles}
    >
      {children}
    </AppShell>
  );
}
