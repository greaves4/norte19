"use client";

import { House } from "lucide-react";
import { AppShell, type NavItem } from "@/components/shared/AppShell";
import type { DemoProfile } from "@/components/shared/DemoBar";

// TODO C1: navegación por perfil, contexto y reset del store del prototipo.
const profiles: DemoProfile[] = [
  { value: "solicitante", label: "Solicitante" },
  { value: "abogado", label: "Abogado" },
  { value: "directivo", label: "Directivo" },
  { value: "admin-legal", label: "Admin legal" },
];

const items: NavItem[] = [{ label: "Inicio", href: "/contratos", icon: House }];

export function ContratosShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="Contratos"
      subtitle="Gestión de contratos"
      context="Dirección Jurídica"
      items={items}
      profiles={profiles}
    >
      {children}
    </AppShell>
  );
}
