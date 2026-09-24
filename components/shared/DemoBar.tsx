"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, FlaskConical, RotateCcw } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CLOCK_SPEEDS, type ClockSpeed, useDemo, useDemoHydrated, useNow } from "@/lib/demo";

export type DemoProfile = { value: string; label: string };

type Props = {
  profiles: DemoProfile[];
  // Reinicio del store del prototipo activo (restaura fixtures).
  onReset?: () => void;
};

const SPEED_LABEL: Record<ClockSpeed, string> = { 1: "x1", 60: "x60", 1440: "x1440" };

export function DemoBar({ profiles, onReset }: Props) {
  const hydrated = useDemoHydrated();
  const demo = useDemo();
  const now = useNow(1000);
  const measureRef = useDemoBarHeight(demo.barCollapsed);

  if (!demo.isDemo || !hydrated) return null;

  if (demo.barCollapsed) {
    return (
      <Button
        variant="outline"
        size="sm"
        ref={measureRef}
        className="fixed right-4 bottom-4 z-50 shadow-sm"
        onClick={() => demo.setBarCollapsed(false)}
        aria-label="Mostrar controles de demo"
      >
        <FlaskConical data-icon="inline-start" />
        Demo
      </Button>
    );
  }

  function handleReset() {
    if (!window.confirm("¿Reiniciar la demo? Se pierden los cambios hechos en este prototipo.")) return;
    onReset?.();
    demo.reset();
  }

  return (
    <div
      ref={measureRef}
      role="region"
      aria-label="Controles de demo"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <FlaskConical className="size-4" aria-hidden />
          Prototipo · datos de ejemplo
        </span>

        <Separator orientation="vertical" className="hidden h-5 sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Perfil</span>
          <Select
            items={profiles}
            value={demo.profile}
            onValueChange={(value) => demo.setProfile(value as string | null)}
          >
            <SelectTrigger size="sm" className="min-w-40" aria-label="Perfil activo">
              <SelectValue placeholder="Elegir perfil" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground tabular-nums" title="Hora simulada">
            {format(now, "EEE d MMM, HH:mm", { locale: es })}
          </span>
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[String(demo.clockSpeed)]}
            onValueChange={(value) => {
              const speed = Number(value[0]) as ClockSpeed;
              if (CLOCK_SPEEDS.includes(speed)) demo.setClockSpeed(speed);
            }}
            aria-label="Velocidad del reloj"
          >
            {CLOCK_SPEEDS.map((s) => (
              <ToggleGroupItem key={s} value={String(s)}>
                {SPEED_LABEL[s]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button variant="outline" size="sm" onClick={() => demo.advanceHours(24)}>
            +24 h
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw data-icon="inline-start" />
            Reiniciar demo
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => demo.setBarCollapsed(true)}
            aria-label="Ocultar controles de demo"
          >
            <ChevronDown />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Publica la altura ocupada en --demo-bar-h para que el contenido deje espacio al final.
function useDemoBarHeight(collapsed: boolean) {
  return useCallback(
    (el: HTMLElement | null) => {
      const root = document.documentElement;
      if (!el) {
        root.style.removeProperty("--demo-bar-h");
        return;
      }
      // Colapsada, el botón flota a 1rem del borde: se reserva su alto más ese margen.
      const extra = collapsed ? 16 : 0;
      const observer = new ResizeObserver(() => {
        root.style.setProperty("--demo-bar-h", `${el.offsetHeight + extra}px`);
      });
      observer.observe(el);
      return () => {
        observer.disconnect();
        root.style.removeProperty("--demo-bar-h");
      };
    },
    [collapsed],
  );
}
