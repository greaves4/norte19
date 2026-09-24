import { describe, expect, it } from "vitest";
import { duracionTotal, pasosPendientes, pasosRunner } from "@/lib/sim/contratos/firma";

describe("firma electrónica simulada", () => {
  it("cinco pasos con latencias entre 1.5 y 3 s", () => {
    const pasos = pasosRunner({ folio: "SOL-2026-0120" });
    expect(pasos.map((p) => p.id)).toEqual(["enviado", "firmante_1", "firmante_2", "constancia", "formalizado"]);
    expect(pasos.every((p) => p.durationMs >= 1500 && p.durationMs <= 3000)).toBe(true);
    expect(duracionTotal(pasosPendientes({}))).toBe(11_100);
  });

  it("retoma desde el primer paso sin fecha", () => {
    const s = { folio: "SOL-2026-0120", firma: { pasos: { enviado: "2026-09-20T10:00:00Z", firmante_1: "2026-09-20T15:00:00Z" } } };
    expect(pasosPendientes(s)).toEqual(["firmante_2", "constancia", "formalizado"]);
    expect(pasosRunner(s)[0].log?.[0]).toContain("firmante 2");
  });
});
