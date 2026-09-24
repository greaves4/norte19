"use client";

// Utilidades de demo: perfil activo, reloj acelerable y reinicio.
import { useEffect, useState, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ClockSpeed = 1 | 60 | 1440;
export const CLOCK_SPEEDS: readonly ClockSpeed[] = [1, 60, 1440];

const HORA_MS = 60 * 60 * 1000;

type DemoState = {
  profile: string | null;
  clockSpeed: ClockSpeed;
  // Reloj simulado = real + clockOffsetMs + (real − clockAnchorMs) × (clockSpeed − 1).
  clockOffsetMs: number;
  clockAnchorMs: number;
  barCollapsed: boolean;
  setProfile: (profile: string | null) => void;
  setClockSpeed: (speed: ClockSpeed) => void;
  advanceHours: (hours: number) => void;
  setBarCollapsed: (collapsed: boolean) => void;
  reset: () => void;
};

function simulatedMs(s: Pick<DemoState, "clockOffsetMs" | "clockAnchorMs" | "clockSpeed">, real = Date.now()) {
  return real + s.clockOffsetMs + (real - s.clockAnchorMs) * (s.clockSpeed - 1);
}

const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      profile: null,
      clockSpeed: 1,
      clockOffsetMs: 0,
      clockAnchorMs: Date.now(),
      barCollapsed: false,
      setProfile: (profile) => set({ profile }),
      setClockSpeed: (clockSpeed) => {
        // Consolida el tiempo simulado transcurrido antes de cambiar de velocidad.
        const real = Date.now();
        set({ clockSpeed, clockOffsetMs: simulatedMs(get(), real) - real, clockAnchorMs: real });
      },
      advanceHours: (hours) => set((s) => ({ clockOffsetMs: s.clockOffsetMs + hours * HORA_MS })),
      setBarCollapsed: (barCollapsed) => set({ barCollapsed }),
      // Regresa el reloj al tiempo real; conserva el perfil y el estado de la barra.
      reset: () => set({ clockSpeed: 1, clockOffsetMs: 0, clockAnchorMs: Date.now() }),
    }),
    {
      name: "demo",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ profile, clockSpeed, clockOffsetMs, clockAnchorMs, barCollapsed }) => ({
        profile,
        clockSpeed,
        clockOffsetMs,
        clockAnchorMs,
        barCollapsed,
      }),
    },
  ),
);

// Visible en demo salvo que el deploy lo desactive con NEXT_PUBLIC_DEMO=0.
export const isDemo = process.env.NEXT_PUBLIC_DEMO !== "0";

export function useDemo() {
  const state = useDemoStore();
  return {
    isDemo,
    profile: state.profile,
    setProfile: state.setProfile,
    clockSpeed: state.clockSpeed,
    setClockSpeed: state.setClockSpeed,
    now: () => new Date(simulatedMs(useDemoStore.getState())),
    advanceHours: state.advanceHours,
    barCollapsed: state.barCollapsed,
    setBarCollapsed: state.setBarCollapsed,
    reset: state.reset,
  };
}

// Hora simulada que se re-renderiza cada `intervalMs` (y al cambiar el reloj).
export function useNow(intervalMs = 1000): Date {
  const { clockSpeed, clockOffsetMs, clockAnchorMs } = useDemoStore();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return new Date(simulatedMs({ clockSpeed, clockOffsetMs, clockAnchorMs }));
}

// true cuando el store ya leyó localStorage; evita diferencias de hidratación con el HTML del servidor.
export function useDemoHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useDemoStore.persist.onFinishHydration(cb),
    () => useDemoStore.persist.hasHydrated(),
    () => false,
  );
}
