"use client";

import { addDays, differenceInCalendarDays } from "date-fns";
import { CreditCard } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { useNow } from "@/lib/demo";
import { hotelPorId } from "@/lib/fixtures/fund";
import { fecha, mxn } from "@/lib/format";
import { useFund } from "@/lib/store/fund";
import { DIAS_CORTE, ESTATUS_TARJETA, NOMBRE_CORTE } from "@/lib/types/fund";

// Cabecera de la tarjeta del hotel: nunca muestra más que los últimos cuatro dígitos.
export function ResumenTarjeta({ tarjetaId }: { tarjetaId: string }) {
  const tarjeta = useFund((s) => s.tarjetas.find((t) => t.id === tarjetaId));
  const movimientos = useFund((s) => s.movimientos);
  const now = useNow(60_000);
  if (!tarjeta) return null;

  const hotel = hotelPorId(tarjeta.hotelId);
  const gastoCorte = movimientos
    .filter((m) => m.tarjetaId === tarjeta.id && (!tarjeta.ultimoFondeo || m.fecha > tarjeta.ultimoFondeo))
    .reduce((s, m) => s + m.total, 0);
  const proximoCorte = tarjeta.ultimoFondeo ? addDays(new Date(tarjeta.ultimoFondeo), DIAS_CORTE[tarjeta.corte]) : null;
  const diasAlCorte = proximoCorte ? differenceInCalendarDays(proximoCorte, now) : null;

  const datos = [
    { etiqueta: "Saldo disponible", valor: mxn(tarjeta.saldo), destacado: true },
    { etiqueta: "Presupuesto del corte", valor: mxn(tarjeta.presupuesto) },
    { etiqueta: "Gasto del corte", valor: mxn(gastoCorte) },
    {
      etiqueta: `Próximo corte · ${NOMBRE_CORTE[tarjeta.corte].toLowerCase()}`,
      valor: proximoCorte ? fecha(proximoCorte, "EEE d MMM") : "Sin fondeos",
      nota: diasAlCorte === null ? undefined : diasAlCorte <= 0 ? "Hoy" : `En ${diasAlCorte} ${diasAlCorte === 1 ? "día" : "días"}`,
    },
  ];

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <CreditCard className="size-5 text-muted-foreground" aria-hidden />
          <span className="font-medium">{hotel?.nombre}</span>
          <span className="text-sm text-muted-foreground tabular-nums" aria-label={`Tarjeta terminación ${tarjeta.ultimosCuatro}`}>
            Tarjeta •••• {tarjeta.ultimosCuatro}
          </span>
          <StatusBadge status={tarjeta.estatus} map={ESTATUS_TARJETA} />
        </div>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {datos.map((d) => (
            <div key={d.etiqueta} className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">{d.etiqueta}</dt>
              <dd className={d.destacado ? "text-xl font-semibold tabular-nums" : "text-base font-medium tabular-nums"}>{d.valor}</dd>
              {d.nota && <dd className="text-xs text-muted-foreground">{d.nota}</dd>}
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
