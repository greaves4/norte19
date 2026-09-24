// Estado inicial de Fund: todas las fixtures generadas de forma determinista relativo a `hoy`.
import { crearEstadoCuenta, type DiscrepanciasSembradas } from "@/lib/fixtures/fund/estadoCuenta";
import { crearFondeos } from "@/lib/fixtures/fund/fondeos";
import { crearMovimientos } from "@/lib/fixtures/fund/movimientos";
import { crearRng } from "@/lib/fixtures/fund/semilla";
import { calcularSaldos, crearTarjetas } from "@/lib/fixtures/fund/tarjetas";
import type { EstadoConciliacion, Fondeo, Movimiento, MovimientoBancario, Tarjeta } from "@/lib/types/fund";

export const SEMILLA_FUND = 19_2026;

export type DatosFund = {
  tarjetas: Tarjeta[];
  movimientos: Movimiento[];
  fondeos: Fondeo[];
  estadoCuenta: MovimientoBancario[];
  conciliacion: EstadoConciliacion;
  discrepancias: DiscrepanciasSembradas;
};

export function crearDatosFund(hoy: Date): DatosFund {
  // Un generador por conjunto: cambiar uno no altera los demás.
  const tarjetasBase = crearTarjetas(crearRng(SEMILLA_FUND));
  const movimientosBase = crearMovimientos(crearRng(SEMILLA_FUND + 1), hoy);
  const fondeos = crearFondeos(crearRng(SEMILLA_FUND + 2), tarjetasBase, movimientosBase, hoy);
  const { estadoCuenta, movimientos, discrepancias } = crearEstadoCuenta(movimientosBase, fondeos);
  const tarjetas = calcularSaldos(tarjetasBase, movimientos, fondeos);

  return {
    tarjetas,
    movimientos,
    fondeos,
    estadoCuenta,
    conciliacion: { ultimaSincronizacion: null, sincronizaciones: 0 },
    discrepancias,
  };
}

export { CATEGORIAS, CATEGORIAS_BLOQUEADAS_POR_DEFECTO, categoriaPorClave, categoriaPorId } from "@/lib/fixtures/fund/categorias";
export { CENTROS_COSTOS, nombreCentroCostos } from "@/lib/fixtures/fund/centrosCostos";
export { CUENTAS_FONDEADORAS, HOTEL_DEMO_ID, HOTELES, USUARIOS_DEMO, hotelPorId } from "@/lib/fixtures/fund/hoteles";
export { PROVEEDORES, PROVEEDORES_BLOQUEADOS, proveedorPorSlug } from "@/lib/fixtures/fund/proveedores";
export { TARJETA_DEMO_ID, type DiscrepanciasSembradas } from "@/lib/fixtures/fund/estadoCuenta";
