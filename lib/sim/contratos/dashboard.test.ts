import { describe, expect, it } from "vitest";
import { crearDatosContratos } from "@/lib/fixtures/contratos";
import { cargaAbogados, cumplimientoSla, indicadoresContratos, tramos, volumenPorTipo } from "@/lib/sim/contratos/dashboard";

const HOY = new Date(2026, 8, 24, 10);
const { solicitudes, contratos } = crearDatosContratos(HOY);

describe("dashboard de contratos", () => {
  it("indicadores base de las fixtures", () => {
    const k = indicadoresContratos(solicitudes, contratos, HOY);
    expect(k.enProceso).toBe(21);
    expect(k.porVencer).toBe(2);
    expect(k.delMes).toBeGreaterThan(0);
    expect(k.sla.porcentaje).not.toBeNull();
    expect(k.sla.porcentaje!).toBeGreaterThan(0);
    expect(k.sla.porcentaje!).toBeLessThanOrEqual(100);
  });

  it("el SLA se incumple cuando una activa ya lo excedió", () => {
    const base = solicitudes.find((s) => s.estatus === "nueva")!;
    const vieja = { ...base, creadaEn: new Date(2026, 8, 1).toISOString(), etapas: { nueva: new Date(2026, 8, 1).toISOString() } };
    expect(cumplimientoSla([vieja], HOY)).toEqual({ cumplidas: 0, evaluadas: 1, porcentaje: 0 });
  });

  it("los tramos siguen la timeline, incluido el regreso a ajustes", () => {
    const s = solicitudes.find((x) => x.estatus === "en_ajustes")!;
    const cols = tramos(s, HOY).map((t) => t.columna);
    expect(cols[0]).toBe("nueva");
    expect(cols.at(-1)).toBe("en_analisis"); // en_ajustes se muestra en la columna de análisis
  });

  it("volumen y carga cuadran con el total", () => {
    expect(volumenPorTipo(solicitudes).reduce((t, x) => t + x.valor, 0)).toBe(solicitudes.length);
    expect(cargaAbogados(solicitudes).map((x) => x.valor)).toEqual([6, 4, 3]);
  });
});
