import { beforeEach, describe, expect, it } from "vitest";
import { HOTEL_DEMO_ID, TARJETA_DEMO_ID } from "@/lib/fixtures/fund";
import {
  aprobadosEnDia,
  enBandeja,
  horasDeAprobacion,
  llegadaABandeja,
  promedioHorasAprobacion,
  validacionesMovimiento,
} from "@/lib/sim/fund/supervision";
import { useFund } from "@/lib/store/fund";

const store = () => useFund.getState();
const cancun = () => store().movimientos.filter((m) => m.hotelId === HOTEL_DEMO_ID);
const tarjeta = () => store().tarjetas.find((t) => t.id === TARJETA_DEMO_ID)!;

beforeEach(() => store().reset());

describe("supervisión", () => {
  it("la bandeja inicial de Cancún tiene los 6 pendientes", () => {
    expect(cancun().filter(enBandeja)).toHaveLength(6);
  });

  it("mide la espera desde el envío a supervisión", () => {
    const m = cancun().find((x) => x.estatus === "pendiente")!;
    const enviado = m.timeline.find((e) => e.tipo === "enviado")!;
    expect(llegadaABandeja(m).toISOString()).toBe(enviado.fecha);
  });

  it("calcula horas y promedio de aprobación desde las timelines", () => {
    const aprobados = cancun().filter((m) => m.estatus === "aprobado");
    const horas = aprobados.map(horasDeAprobacion);
    expect(horas.every((h) => h !== null && h > 0 && h <= 11)).toBe(true);
    const promedio = promedioHorasAprobacion(cancun())!;
    expect(promedio).toBeGreaterThan(1);
    expect(promedio).toBeLessThan(11);
  });

  it("cuenta aprobados del día", () => {
    const m = cancun().find((x) => x.estatus === "pendiente")!;
    const antes = aprobadosEnDia(cancun(), new Date());
    store().aprobar(m.id, "Ricardo Salas Uc");
    expect(aprobadosEnDia(cancun(), new Date())).toBe(antes + 1);
  });

  it("valida contra la fecha de registro y reconoce excepciones aprobadas", () => {
    const pendiente = cancun().find((x) => x.estatus === "pendiente")!;
    expect(validacionesMovimiento(pendiente, tarjeta()).map((v) => v.nivel)).toEqual(["ok", "ok", "ok", "ok"]);

    const conExcepcion = store().movimientos.find((m) => m.excepcionSolicitada?.estatus === "pendiente")!;
    const tarjetaExcepcion = store().tarjetas.find((t) => t.id === conExcepcion.tarjetaId)!;
    expect(validacionesMovimiento(conExcepcion, tarjetaExcepcion).find((v) => v.id === "categoria")?.nivel).toBe("bloqueo");
    store().resolverExcepcion(conExcepcion.id, true);
    const aprobada = store().movimientos.find((m) => m.id === conExcepcion.id)!;
    expect(validacionesMovimiento(aprobada, tarjetaExcepcion).find((v) => v.id === "categoria")?.titulo).toBe("Excepción aprobada por Tesorería");
    expect(enBandeja(aprobada)).toBe(true);
  });
});
