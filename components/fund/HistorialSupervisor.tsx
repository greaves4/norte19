"use client";

import { useMemo } from "react";
import { MovimientosGrid } from "@/components/fund/MovimientosGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { hotelPorId, USUARIOS_DEMO } from "@/lib/fixtures/fund";
import { useFund } from "@/lib/store/fund";

const HOTEL_ID = USUARIOS_DEMO.supervisor.hotelId!;

export function HistorialSupervisor() {
  const todos = useFund((s) => s.movimientos);
  const movimientos = useMemo(() => todos.filter((m) => m.hotelId === HOTEL_ID), [todos]);
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title="Historial" description={`Todos los movimientos de ${hotelPorId(HOTEL_ID)?.nombre}. Selecciona uno para ver su historial.`} />
      <MovimientosGrid movimientos={movimientos} exportFileName="historial-cancun-aeropuerto" />
    </div>
  );
}
