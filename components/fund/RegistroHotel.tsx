"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { MovimientosGrid } from "@/components/fund/MovimientosGrid";
import { ResumenTarjeta } from "@/components/fund/ResumenTarjeta";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { USUARIOS_DEMO } from "@/lib/fixtures/fund";
import { useFund } from "@/lib/store/fund";

const HOTEL_ID = USUARIOS_DEMO.hotel.hotelId!;

export function RegistroHotel() {
  const todos = useFund((s) => s.movimientos);
  const movimientos = useMemo(() => todos.filter((m) => m.hotelId === HOTEL_ID), [todos]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Registro de movimientos"
        description="Gastos de caja chica del hotel con su factura y comprobante."
        actions={
          <Button nativeButton={false} render={<Link href="/fund/hotel/registro/nuevo" />}>
            <Plus data-icon="inline-start" />
            Nuevo movimiento
          </Button>
        }
      />
      <ResumenTarjeta tarjetaId={`tj-${HOTEL_ID}`} />
      <MovimientosGrid movimientos={movimientos} exportFileName="movimientos-cancun-aeropuerto" />
    </div>
  );
}
