// Reportes de Tesorería. Leen el estado actual del store: lo que se aprueba en la demo aparece aquí.
import { format, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { CENTROS_COSTOS, HOTELES } from "@/lib/fixtures/fund";
import { redondear2 } from "@/lib/sim/fund/cfdiXml";
import { horasDeAprobacion } from "@/lib/sim/fund/supervision";
import type { Fondeo, Movimiento } from "@/lib/types/fund";

export type FilaSla = {
  hotelId: string;
  hotel: string;
  supervisor: string;
  aprobados: number;
  promedioHoras: number | null;
  maximoHoras: number | null;
};

// Horas entre la llegada a la bandeja y la aprobación, por hotel (el supervisor es el gerente del hotel).
export function slaPorHotel(movimientos: Movimiento[]): FilaSla[] {
  return HOTELES.map((h) => {
    const horas = movimientos
      .filter((m) => m.hotelId === h.id)
      .map(horasDeAprobacion)
      .filter((x): x is number => x !== null);
    return {
      hotelId: h.id,
      hotel: h.nombre,
      supervisor: h.supervisor,
      aprobados: horas.length,
      promedioHoras: horas.length ? Math.round((horas.reduce((s, x) => s + x, 0) / horas.length) * 10) / 10 : null,
      maximoHoras: horas.length ? Math.round(Math.max(...horas) * 10) / 10 : null,
    };
  }).sort((a, b) => (b.promedioHoras ?? -1) - (a.promedioHoras ?? -1));
}

const CUENTA_COMO_GASTO = new Set(["aprobado", "autorizado"]);

// Gasto aprobado (aprobado + autorizado) por centro de costos; opcionalmente de un hotel.
export function gastoPorCentro(movimientos: Movimiento[], hotelId: string | null) {
  return CENTROS_COSTOS.map((c) => ({
    centroId: c.id,
    nombre: c.nombre,
    total: redondear2(
      movimientos
        .filter((m) => CUENTA_COMO_GASTO.has(m.estatus) && m.centroCostos === c.id && (!hotelId || m.hotelId === hotelId))
        .reduce((s, m) => s + m.total, 0),
    ),
  })).sort((a, b) => b.total - a.total);
}

export type FilaCentros = { hotelId: string; hotel: string; total: number } & Record<string, number | string>;

export function matrizCentros(movimientos: Movimiento[]): FilaCentros[] {
  return HOTELES.map((h) => {
    const fila: FilaCentros = { hotelId: h.id, hotel: h.nombre, total: 0 };
    for (const c of CENTROS_COSTOS) {
      const total = redondear2(
        movimientos.filter((m) => m.hotelId === h.id && m.centroCostos === c.id && CUENTA_COMO_GASTO.has(m.estatus)).reduce((s, m) => s + m.total, 0),
      );
      fila[c.id] = total;
      fila.total = redondear2(fila.total + total);
    }
    return fila;
  });
}

export type Mes = { clave: string; etiqueta: string };
export type FilaFondeos = { hotelId: string; hotel: string; cantidad: number; total: number; porMes: Record<string, number> };

// Fondeos depositados por hotel en los últimos `meses` meses calendario (incluye el actual).
export function fondeosPorMes(fondeos: Fondeo[], now: Date, meses = 3): { meses: Mes[]; filas: FilaFondeos[] } {
  const lista: Mes[] = Array.from({ length: meses }, (_, i) => {
    const d = startOfMonth(subMonths(now, meses - 1 - i));
    return { clave: format(d, "yyyy-MM"), etiqueta: format(d, "MMM yyyy", { locale: es }) };
  });
  const claves = new Set(lista.map((m) => m.clave));
  const filas = HOTELES.map((h) => {
    const porMes = Object.fromEntries(lista.map((m) => [m.clave, 0])) as Record<string, number>;
    let cantidad = 0;
    for (const f of fondeos) {
      if (f.tarjetaId !== `tj-${h.id}` || f.estatus !== "depositado") continue;
      const clave = format(new Date(f.fecha), "yyyy-MM");
      if (!claves.has(clave)) continue;
      porMes[clave] = redondear2(porMes[clave] + f.monto);
      cantidad += 1;
    }
    return { hotelId: h.id, hotel: h.nombre, cantidad, total: redondear2(Object.values(porMes).reduce((s, v) => s + v, 0)), porMes };
  });
  return { meses: lista, filas };
}
