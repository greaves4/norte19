"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { MovimientosGrid } from "@/components/fund/MovimientosGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { USUARIOS_DEMO } from "@/lib/fixtures/fund";
import { useFund } from "@/lib/store/fund";
import { ESTATUS_MOVIMIENTO, type EstatusMovimiento } from "@/lib/types/fund";

const USUARIO = USUARIOS_DEMO.hotel;

// Movimientos registrados por la persona en sesión, con conteo por estatus.
export function MisMovimientos() {
  const todos = useFund((s) => s.movimientos);
  const mios = useMemo(() => todos.filter((m) => m.hotelId === USUARIO.hotelId && m.registradoPor === USUARIO.nombre), [todos]);
  const conteo = useMemo(() => {
    const c = Object.fromEntries(Object.keys(ESTATUS_MOVIMIENTO).map((e) => [e, 0])) as Record<EstatusMovimiento, number>;
    for (const m of mios) c[m.estatus] += 1;
    return c;
  }, [mios]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Mis movimientos"
        description={`Registrados por ${USUARIO.nombre}. Toca uno para ver su historial.`}
        actions={
          <Button nativeButton={false} render={<Link href="/fund/hotel/registro/nuevo" />}>
            <Plus data-icon="inline-start" />
            Nuevo movimiento
          </Button>
        }
      />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {(Object.keys(ESTATUS_MOVIMIENTO) as EstatusMovimiento[]).map((e) => (
          <li key={e}>
            <Card size="sm">
              <CardContent className="flex flex-col items-start gap-2">
                <StatusBadge status={e} map={ESTATUS_MOVIMIENTO} />
                <span className="text-2xl font-semibold tabular-nums">{conteo[e]}</span>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <MovimientosGrid
        movimientos={mios}
        exportFileName="mis-movimientos"
        emptyTitle="Aún no registras movimientos"
        emptyDescription="Los gastos que registres aparecerán aquí con su estatus."
      />
    </div>
  );
}
