"use client";

import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DemoBar, type DemoProfile } from "@/components/shared/DemoBar";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useDemo, useDemoHydrated } from "@/lib/demo";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  // Visible pero no navegable (p. ej. módulos "Próximamente").
  disabled?: boolean;
};

type Props = {
  title: string;
  subtitle?: string;
  items: NavItem[];
  // Hotel o área que se muestra en el header, p. ej. "City Express Plus Insurgentes Sur".
  context?: string;
  // Nombre del usuario simulado (SSO); si falta, solo se muestra el perfil.
  userName?: string;
  profiles: DemoProfile[];
  onReset?: () => void;
  children: React.ReactNode;
};

// Desde este ancho la barra lateral abre expandida; debajo (tablet) queda en iconos.
const DESKTOP_QUERY = "(min-width: 1024px)";

export function AppShell({
  title,
  subtitle,
  items,
  context,
  userName,
  profiles,
  onReset,
  children,
}: Props) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setOpen(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen} className="h-svh">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          {/* Logotipo verde sobre fondo blanco; con la barra en iconos, el monograma. Imágenes sin optimizar: PNG ya ligeros. */}
          <div className="flex min-w-0 flex-col gap-3 px-2 pt-2 pb-1.5 group-data-[collapsible=icon]:hidden">
            <Image src="/brand/norte19-logo-verde.png" alt="Norte 19 · Operadora hotelera" width={621} height={160} unoptimized priority className="h-8 w-auto self-start" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm tracking-[1.4px] uppercase">{title}</span>
              {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
            </div>
          </div>
          <Image src="/brand/n19-monograma.png" alt="Norte 19" width={512} height={512} unoptimized className="hidden size-8 group-data-[collapsible=icon]:block" />
        </SidebarHeader>
        <SidebarContent className="pb-(--demo-bar-h)">
          <SidebarGroup>
            <SidebarGroupContent>
              <NavMenu items={items} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <span className="min-w-0 truncate text-sm font-medium">{context ?? title}</span>
          <ActiveProfile profiles={profiles} userName={userName} />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto pb-(--demo-bar-h)">{children}</div>
      </SidebarInset>

      <DemoBar profiles={profiles} onReset={onReset} />
    </SidebarProvider>
  );
}

function NavMenu({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  // El item activo es el de href más largo que coincide con la ruta (así "/fund" no gana siempre).
  const active = items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          {item.disabled ? (
            <SidebarMenuButton aria-disabled tooltip={`${item.label} · Próximamente`} className="cursor-default opacity-50 hover:bg-transparent">
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          ) : (
          <SidebarMenuButton
            isActive={item.href === active}
            tooltip={item.label}
            render={
              <Link
                href={item.href}
                aria-current={item.href === active ? "page" : undefined}
                onClick={() => isMobile && setOpenMobile(false)}
              />
            }
          >
            <item.icon />
            <span>{item.label}</span>
          </SidebarMenuButton>
          )}
          {item.badge !== undefined && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function ActiveProfile({ profiles, userName }: { profiles: DemoProfile[]; userName?: string }) {
  const hydrated = useDemoHydrated();
  const { profile } = useDemo();
  if (!hydrated) return null;

  const label = profiles.find((p) => p.value === profile)?.label ?? "Sin perfil";
  return (
    <div className="ml-auto flex min-w-0 flex-col items-end text-right leading-tight">
      {userName && <span className="truncate text-sm font-medium">{userName}</span>}
      <span className="truncate text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
