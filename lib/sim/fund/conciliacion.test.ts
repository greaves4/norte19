import { beforeEach, describe, expect, it } from "vitest";
import { HOTEL_DEMO_ID, TARJETA_DEMO_ID } from "@/lib/fixtures/fund";
import { conciliar, contarPorEstatus } from "@/lib/sim/fund/conciliacion";
import { dispersarLote } from "@/lib/sim/fund/payconnect";
import { fondeosPorMes, gastoPorCentro, matrizCentros, slaPorHotel } from "@/lib/sim/fund/reportes";
import { useFund } from "@/lib/store/fund";

const store = () => useFund.getState();
const filas = () => conciliar(TARJETA_DEMO_ID, store().estadoCuenta, store().movimientos, store().fondeos);

beforeEach(() => store().reset());

describe("conciliación", () => {
  it("arranca con 2 discrepancias y la sincronización resuelve una", () => {
    expect(contarPorEstatus(filas())).toEqual({ cuadrado: 38, no_cuadrado: 1, sin_registro: 1 });
    const noCuadrado = filas().find((f) => f.estatus === "no_cuadrado")!;
    expect(noCuadrado.diferencia).toBe(30);

    store().sincronizarConciliacion();
    expect(contarPorEstatus(filas())).toEqual({ cuadrado: 39, no_cuadrado: 1, sin_registro: 0 });
  });

  it("un fondeo dispersado en la demo aparece cuadrado", () => {
    const d = dispersarLote([{ tarjetaId: TARJETA_DEMO_ID, monto: 2500 }], "manual");
    d.finalizar();
    const f = filas().find((x) => x.movimientoSistema?.tipo === "fondeo" && x.movimientoSistema.fondeo.id === d.dispersiones[0].fondeoId)!;
    expect(f.estatus).toBe("cuadrado");
    expect(contarPorEstatus(filas()).cuadrado).toBe(39);
  });
});

describe("reportes", () => {
  it("el SLA incluye al supervisor de Cancún y refleja nuevas aprobaciones", () => {
    const cancun = () => slaPorHotel(store().movimientos).find((f) => f.hotelId === HOTEL_DEMO_ID)!;
    const antes = cancun();
    expect(antes.supervisor).toBe("Ricardo Salas Uc");
    expect(antes.aprobados).toBeGreaterThan(20);
    const pendiente = store().movimientos.find((m) => m.hotelId === HOTEL_DEMO_ID && m.estatus === "pendiente")!;
    store().aprobar(pendiente.id, "Ricardo Salas Uc");
    expect(cancun().aprobados).toBe(antes.aprobados + 1);
  });

  it("el gasto por centro cuadra con la matriz por hotel", () => {
    const total = gastoPorCentro(store().movimientos, null).reduce((s, c) => s + c.total, 0);
    const matriz = matrizCentros(store().movimientos).reduce((s, f) => s + f.total, 0);
    expect(total).toBeCloseTo(matriz, 2);
    const cancun = gastoPorCentro(store().movimientos, HOTEL_DEMO_ID);
    expect(cancun.map((c) => c.total)).toEqual([...cancun.map((c) => c.total)].sort((a, b) => b - a));
  });

  it("el historial de fondeos suma por mes los depositados", () => {
    const { meses, filas } = fondeosPorMes(store().fondeos, new Date());
    expect(meses).toHaveLength(3);
    const total = filas.reduce((s, f) => s + f.total, 0);
    const porMes = meses.reduce((s, m) => s + filas.reduce((x, f) => x + f.porMes[m.clave], 0), 0);
    expect(total).toBeCloseTo(porMes, 2);
    expect(total).toBeGreaterThan(0);
  });
});
