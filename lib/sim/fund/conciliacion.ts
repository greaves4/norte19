// Conciliación Pay Connect: cruza el estado de cuenta de una tarjeta contra los registros de Fund.
// Cargos ↔ movimientos (por referencia bancaria); abonos ↔ fondeos (por referencia). Luego compara montos.
import type { EstatusConciliacion, Fondeo, Movimiento, MovimientoBancario } from "@/lib/types/fund";

export type RegistroSistema = { tipo: "movimiento"; movimiento: Movimiento } | { tipo: "fondeo"; fondeo: Fondeo };

export type FilaConciliacion = {
  id: string;
  movimientoBanco: MovimientoBancario;
  movimientoSistema: RegistroSistema | null;
  montoSistema: number | null;
  diferencia: number | null; // banco − sistema
  estatus: EstatusConciliacion;
};

export function conciliar(
  tarjetaId: string,
  estadoCuenta: MovimientoBancario[],
  movimientos: Movimiento[],
  fondeos: Fondeo[],
): FilaConciliacion[] {
  const porReferencia = new Map(
    movimientos.filter((m) => m.tarjetaId === tarjetaId && m.referenciaBancaria).map((m) => [m.referenciaBancaria!, m]),
  );
  const fondeosPorReferencia = new Map(fondeos.filter((f) => f.tarjetaId === tarjetaId).map((f) => [f.referencia, f]));

  return estadoCuenta
    .filter((b) => b.tarjetaId === tarjetaId)
    .map((b) => {
      const movimiento = b.tipo === "cargo" ? porReferencia.get(b.referencia) : undefined;
      const fondeo = b.tipo === "abono" ? fondeosPorReferencia.get(b.referencia) : undefined;
      const sistema: RegistroSistema | null = movimiento
        ? { tipo: "movimiento", movimiento }
        : fondeo
          ? { tipo: "fondeo", fondeo }
          : null;
      const montoSistema = movimiento?.total ?? fondeo?.monto ?? null;
      const diferencia = montoSistema === null ? null : Math.round((b.monto - montoSistema) * 100) / 100;
      const estatus: EstatusConciliacion = sistema === null ? "sin_registro" : diferencia === 0 ? "cuadrado" : "no_cuadrado";
      return { id: b.id, movimientoBanco: b, movimientoSistema: sistema, montoSistema, diferencia, estatus };
    });
}

export function contarPorEstatus(filas: FilaConciliacion[]): Record<EstatusConciliacion, number> {
  const conteo: Record<EstatusConciliacion, number> = { cuadrado: 0, no_cuadrado: 0, sin_registro: 0 };
  for (const f of filas) conteo[f.estatus] += 1;
  return conteo;
}
