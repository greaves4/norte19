// Cálculos de Tesorería por tarjeta: corte en curso y re-fondeo automático.
import { addDays, startOfDay } from "date-fns";
import { redondear2 } from "@/lib/sim/fund/cfdiXml";
import { DIAS_CORTE, type Movimiento, type Tarjeta } from "@/lib/types/fund";

export const NOTA_FORMULA = "Fórmula provisional; se acuerda en taller con Tesorería.";

// Movimientos de la tarjeta registrados después del último fondeo (el corte en curso).
export function movimientosDelCorte(tarjeta: Tarjeta, movimientos: Movimiento[]) {
  return movimientos.filter((m) => m.tarjetaId === tarjeta.id && (!tarjeta.ultimoFondeo || m.fecha > tarjeta.ultimoFondeo));
}

export function aprobadosDelCorte(tarjeta: Tarjeta, movimientos: Movimiento[]) {
  return redondear2(
    movimientosDelCorte(tarjeta, movimientos)
      .filter((m) => m.estatus === "aprobado" || m.estatus === "autorizado")
      .reduce((s, m) => s + m.total, 0),
  );
}

// Siguiente fecha de corte según el calendario de la tarjeta (último fondeo + n periodos), nunca en el pasado.
export function proximoCorte(tarjeta: Tarjeta, now: Date): Date | null {
  if (!tarjeta.ultimoFondeo) return null;
  const periodo = DIAS_CORTE[tarjeta.corte];
  let fecha = addDays(new Date(tarjeta.ultimoFondeo), periodo);
  const hoy = startOfDay(now);
  while (fecha < hoy) fecha = addDays(fecha, periodo);
  return fecha;
}

export type CalculoRefondeo = {
  presupuesto: number;
  saldo: number;
  aprobados: number;
  propuesto: number;
};

// Fórmula del documento del prototipo: presupuesto − saldo actual + aprobados y autorizados desde el último fondeo.
export function calcularRefondeo(tarjeta: Tarjeta, movimientos: Movimiento[]): CalculoRefondeo {
  const aprobados = aprobadosDelCorte(tarjeta, movimientos);
  const propuesto = Math.max(redondear2(tarjeta.presupuesto - tarjeta.saldo + aprobados), 0);
  return { presupuesto: tarjeta.presupuesto, saldo: tarjeta.saldo, aprobados, propuesto };
}
