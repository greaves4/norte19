import { HOTEL_DEMO_ID } from "@/lib/fixtures/fund/hoteles";
import { redondear, sumarHoras } from "@/lib/fixtures/fund/semilla";
import type { Fondeo, Movimiento, MovimientoBancario } from "@/lib/types/fund";

export const TARJETA_DEMO_ID = `tj-${HOTEL_DEMO_ID}`;
const ABONOS_EN_ESTADO = 8;
const DIFERENCIA_PROPINA = 30;

export type DiscrepanciasSembradas = {
  // Persistente: el banco cobró más que el total del CFDI (propina cargada a la tarjeta). Queda "no cuadrado".
  montoDistinto: { movimientoId: string; referencia: string };
  // Se resuelve al sincronizar: Pay Connect aún no vincula el cargo con el movimiento de Fund ("sin registro").
  sinVincular: { movimientoId: string; referencia: string };
};

// 40 movimientos bancarios de la tarjeta de Cancún: 32 cargos (uno por movimiento) y 8 abonos (fondeos recientes).
// Siembra 2 discrepancias; devuelve también los movimientos con la referencia de la discrepancia "sin vincular" en null.
export function crearEstadoCuenta(
  movimientos: Movimiento[],
  fondeos: Fondeo[],
): { estadoCuenta: MovimientoBancario[]; movimientos: Movimiento[]; discrepancias: DiscrepanciasSembradas } {
  const deCancun = movimientos.filter((m) => m.tarjetaId === TARJETA_DEMO_ID);
  const aprobados = deCancun.filter((m) => m.estatus === "aprobado");
  // Deterministas: el 5.º y el 12.º aprobados más antiguos.
  const conPropina = aprobados[4];
  const sinVincular = aprobados[11];

  const cargos: MovimientoBancario[] = deCancun.map((m) => ({
    id: "",
    tarjetaId: TARJETA_DEMO_ID,
    // El cargo ocurre al pagar, poco después de la emisión del CFDI.
    fecha: sumarHoras(new Date(m.fechaEmisionCfdi), 0.5).toISOString(),
    referencia: m.referenciaBancaria!,
    concepto: conceptoBancario(m.proveedor),
    tipo: "cargo",
    monto: m.id === conPropina.id ? redondear(m.total + DIFERENCIA_PROPINA) : m.total,
  }));

  const abonos: MovimientoBancario[] = fondeos
    .filter((f) => f.tarjetaId === TARJETA_DEMO_ID && f.estatus === "depositado")
    .slice(-ABONOS_EN_ESTADO)
    .map((f) => ({
      id: "",
      tarjetaId: TARJETA_DEMO_ID,
      fecha: f.fecha,
      referencia: f.referencia,
      concepto: "ABONO DISPERSION NORTE 19",
      tipo: "abono",
      monto: f.monto,
    }));

  const estadoCuenta = [...cargos, ...abonos]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((m, i) => ({ ...m, id: `ban-${String(i + 1).padStart(3, "0")}` }));

  return {
    estadoCuenta,
    movimientos: movimientos.map((m) => (m.id === sinVincular.id ? { ...m, referenciaBancaria: null } : m)),
    discrepancias: {
      montoDistinto: { movimientoId: conPropina.id, referencia: conPropina.referenciaBancaria! },
      sinVincular: { movimientoId: sinVincular.id, referencia: sinVincular.referenciaBancaria! },
    },
  };
}

// Como aparece en un estado de cuenta: mayúsculas, sin acentos ni régimen societario, máximo 30 caracteres.
function conceptoBancario(razonSocial: string) {
  return razonSocial
    .replace(/,?\s*S\.? ?(A|de R\.L)\.?.*$/i, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .slice(0, 30);
}
