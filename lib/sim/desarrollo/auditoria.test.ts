import { describe, expect, it } from "vitest";
import { crearHallazgos } from "@/lib/fixtures/desarrollo/hallazgos";
import { archivoPaquete, PAQUETE_EJEMPLO } from "@/lib/fixtures/desarrollo/paquete";
import { calcularScore, pasosAuditoria, resumenEjecutivo, RUBROS } from "@/lib/sim/desarrollo/auditoria";

const hallazgos = crearHallazgos();

describe("hallazgos de la auditoría", () => {
  it("28 hallazgos con la distribución del documento", () => {
    expect(hallazgos).toHaveLength(28);
    expect(new Set(hallazgos.map((h) => h.id)).size).toBe(28);
    const sev = (s: string) => hallazgos.filter((h) => h.severidad === s);
    expect(sev("critico").map((h) => h.id).sort()).toEqual(["C-01", "C-02", "C-03", "C-04", "C-05", "C-06"]);
    expect(sev("medio")).toHaveLength(12);
    expect(sev("menor")).toHaveLength(10);
    for (const h of hallazgos) expect(h.id[0]).toBe({ critico: "C", medio: "M", menor: "N" }[h.severidad]);
    const rubro = (r: string) => hallazgos.filter((h) => h.rubro === r).length;
    expect([rubro("coordinacion"), rubro("marca"), rubro("funcional"), rubro("constructiva"), rubro("documental"), rubro("economica")]).toEqual([9, 5, 4, 5, 3, 2]);
  });

  it("los de coordinación tienen nivel y eje dentro de la retícula", () => {
    for (const h of hallazgos.filter((x) => x.rubro === "coordinacion")) {
      expect(h.nivel).toBeGreaterThanOrEqual(1);
      expect("ABCDEFGH").toContain(h.eje!.x);
      expect(h.eje!.y).toBeGreaterThanOrEqual(1);
      expect(h.eje!.y).toBeLessThanOrEqual(12);
    }
    const c03 = hallazgos.find((h) => h.id === "C-03")!;
    expect([c03.rubro, c03.severidad, c03.nivel]).toEqual(["coordinacion", "critico", 2]);
  });
});

describe("score", () => {
  it("pesos suman 100 y la fórmula por rubro", () => {
    expect(RUBROS.reduce((t, r) => t + r.peso, 0)).toBe(100);
    const s = calcularScore(hallazgos);
    const coord = s.porRubro.find((r) => r.rubro === "coordinacion")!;
    expect(coord.score).toBe(1); // 2×25 + 4×10 + 3×3 = 99
    expect(s.global).toBe(36.1);
    expect(s.semaforo).toBe("rojo");
    expect(s.recomendacion).toBe("Replantear");
  });

  it("descartar C-03 sube el score de forma visible", () => {
    const antes = calcularScore(hallazgos).global;
    const despues = calcularScore(hallazgos.map((h) => (h.id === "C-03" ? { ...h, estatus: "descartado" as const } : h))).global;
    expect(despues - antes).toBeCloseTo(7.5, 1);
  });

  it("sin hallazgos es 100 y libera; umbrales verde 85 y ámbar 65", () => {
    expect(calcularScore([])).toMatchObject({ global: 100, semaforo: "verde", recomendacion: "Liberar" });
    const soloMenores = hallazgos.filter((h) => h.severidad !== "critico");
    expect(calcularScore(soloMenores).semaforo).toBe("ambar");
  });

  it("resumen y pasos", () => {
    const texto = resumenEjecutivo(hallazgos, "City Express Juárez").join(" ");
    expect(texto).toContain("28 hallazgos vigentes");
    const pasos = pasosAuditoria(PAQUETE_EJEMPLO.map((n) => ({ nombre: archivoPaquete(n) })), hallazgos);
    const total = pasos.reduce((t, p) => t + p.durationMs, 0);
    expect(total).toBe(25000);
    expect(pasos.filter((p) => p.id.startsWith("motor-"))).toHaveLength(6);
  });
});
