"use client";

import { House } from "lucide-react";
import { AppShell, type NavItem } from "@/components/shared/AppShell";
import type { DemoProfile } from "@/components/shared/DemoBar";

// TODO D1: navegación por perfil, contexto y reset del store del prototipo.
const profiles: DemoProfile[] = [
  { value: "direccion", label: "Dirección" },
  { value: "revisor", label: "Revisor" },
  { value: "proyectista", label: "Proyectista" },
];

const items: NavItem[] = [{ label: "Inicio", href: "/desarrollo", icon: House }];

export function DesarrolloShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      title="Desarrollo hotelero"
      subtitle="Proyecto ejecutivo y auditoría"
      context="Dirección de Desarrollo"
      items={items}
      profiles={profiles}
    >
      {children}
    </AppShell>
  );
}
