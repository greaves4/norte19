import { beforeEach, describe, expect, it } from "vitest";
import { HOTEL_DEMO_ID, TARJETA_DEMO_ID } from "@/lib/fixtures/fund";
import { archivoEjemplo, leerExcel, revisarFilas } from "@/lib/sim/fund/cargaMasiva";
import { dispersarLote } from "@/lib/sim/fund/payconnect";
import { aprobadosDelCorte, calcularRefondeo, movimientosDelCorte } from "@/lib/sim/fund/refondeo";
import { useFund } from "@/lib/store/fund";

const store = () => useFund.getState();
const tarjeta = (id = TARJETA_DEMO_ID) => store().tarjetas.find((t) => t.id === id)!;

beforeEach(() => store().reset());

describe("re-fondeo", () => {
  it("aplica la fórmula del documento y reacciona a las aprobaciones", () => {
    const antes = calcularRefondeo(tarjeta(), store().movimientos);
    expect(antes.aprobados).toBe(0); // los 6 del corte en curso están pendientes
    expect(antes.propuesto).toBeCloseTo(antes.presupuesto - antes.saldo, 2);

    const pendiente = movimientosDelCorte(tarjeta(), store().movimientos).find((m) => m.estatus === "pendiente")!;
    store().aprobar(pendiente.id, "Ricardo Salas Uc");
    const despues = calcularRefondeo(tarjeta(), store().movimientos);
    expect(despues.aprobados).toBeCloseTo(pendiente.total, 2);
    expect(despues.propuesto).toBeCloseTo(antes.propuesto + pendiente.total, 2);
    expect(aprobadosDelCorte(tarjeta(), store().movimientos)).toBe(despues.aprobados);
  });
});

describe("dispersión Pay Connect", () => {
  it("registra fondeos y actualiza estatus y saldo paso a paso", () => {
    const saldo = tarjeta().saldo;
    const d = dispersarLote([{ tarjetaId: TARJETA_DEMO_ID, monto: 4000 }], "automatico");
    const fondeo = () => store().fondeos.find((f) => f.id === d.dispersiones[0].fondeoId)!;
    expect(d.pasos.map((p) => p.id)).toEqual(["enviado", "aceptado", "depositado"]);
    expect(d.pasos.every((p) => p.durationMs >= 800 && p.durationMs <= 1500)).toBe(true);
    expect(d.pasos[0].log?.join(" ")).toMatch(/POST .*\/dispersions/);
    expect(d.pasos[0].log?.join(" ")).not.toContain(tarjeta().token); // el token viaja recortado en el log
    expect(fondeo().estatus).toBe("enviado");

    d.alTerminarPaso("aceptado");
    expect(fondeo().estatus).toBe("aceptado");
    expect(tarjeta().saldo).toBe(saldo);
    d.alTerminarPaso("depositado");
    expect(fondeo().estatus).toBe("depositado");
    expect(tarjeta().saldo).toBeCloseTo(saldo + 4000, 2);
  });

  it("finalizar completa lo pendiente una sola vez", () => {
    const saldo = tarjeta().saldo;
    const d = dispersarLote([{ tarjetaId: TARJETA_DEMO_ID, monto: 1000 }], "manual");
    d.finalizar();
    d.finalizar();
    expect(tarjeta().saldo).toBeCloseTo(saldo + 1000, 2);
  });
});

describe("carga masiva", () => {
  it("lee el Excel de ejemplo y marca las filas inválidas", async () => {
    const archivo = await archivoEjemplo(store().tarjetas);
    const filas = await leerExcel(archivo);
    expect(filas).toHaveLength(7);
    const revisadas = revisarFilas(filas, store().tarjetas);
    expect(revisadas.filter((f) => !f.error)).toHaveLength(5);
    expect(revisadas.map((f) => f.error).filter(Boolean)).toEqual([
      "No existe una tarjeta con esos últimos cuatro dígitos.",
      "La tarjeta está bloqueada.",
    ]);

    const r = store().aplicarCargaMasiva(revisadas.filter((f) => !f.error));
    expect(r.aplicadas).toHaveLength(5);
    expect(r.errores).toHaveLength(0);
  });

  it("identifica la tarjeta por hotel cuando se repiten los últimos cuatro", () => {
    const cancun = tarjeta();
    const [f] = revisarFilas([{ hotel: "City Express Cancún Aeropuerto", ultimosCuatro: cancun.ultimosCuatro, monto: 10, referencia: "X" }], store().tarjetas);
    expect(f.tarjetaId).toBe(TARJETA_DEMO_ID);
    expect(cancun.hotelId).toBe(HOTEL_DEMO_ID);
  });
});
