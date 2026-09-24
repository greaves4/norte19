import { describe, expect, it } from "vitest";
import { analisisVacio, PLANTILLA_ANALISIS, resumenAnalisis, seccionesAnalisis } from "@/lib/sim/contratos/analisis";
import { columnaDe, planMovimiento } from "@/lib/sim/contratos/kanban";

const ANALISIS = "Objeto: Renta de local.\nRiesgos identificados: Ninguno.\nCláusulas a negociar: Depósito.\nRecomendación: Procede.";

describe("análisis jurídico", () => {
  it("la plantilla sola cuenta como vacía", () => {
    expect(analisisVacio(PLANTILLA_ANALISIS)).toBe(true);
    expect(analisisVacio(undefined)).toBe(true);
    expect(analisisVacio(`${PLANTILLA_ANALISIS}\nRevisar poder.`)).toBe(false);
    expect(analisisVacio(PLANTILLA_ANALISIS.replace("Objeto:\n", "Objeto:\nArrendamiento en León.\n"))).toBe(false);
  });

  it("lee las secciones en la misma línea o en líneas siguientes", () => {
    const s = seccionesAnalisis("Objeto:\nObra en Querétaro\nsegunda etapa\n\nRecomendación: Procede.");
    expect(s.Objeto).toBe("Obra en Querétaro\nsegunda etapa");
    expect(s["Recomendación"]).toBe("Procede.");
    expect(resumenAnalisis(ANALISIS)).toBe("Procede.");
  });
});

describe("Kanban", () => {
  it("en ajustes vive en análisis y aprobada en aprobación", () => {
    expect(columnaDe("en_ajustes")).toBe("en_analisis");
    expect(columnaDe("aprobada")).toBe("en_aprobacion");
  });

  it("el siguiente estatus es directo; saltar pide confirmación", () => {
    expect(planMovimiento({ estatus: "nueva" }, "en_analisis")).toEqual({ tipo: "directo", pasos: ["iniciarAnalisis"] });
    expect(planMovimiento({ estatus: "nueva", analisis: ANALISIS }, "en_aprobacion")).toEqual({ tipo: "salto", pasos: ["iniciarAnalisis", "enviarAAprobacion"] });
    expect(planMovimiento({ estatus: "aprobada" }, "en_firma")).toEqual({ tipo: "directo", pasos: ["enviarAFirma"] });
    expect(planMovimiento({ estatus: "en_analisis" }, "en_analisis")).toEqual({ tipo: "nada" });
  });

  it("bloquea lo que no le toca al abogado", () => {
    expect(planMovimiento({ estatus: "en_analisis", analisis: PLANTILLA_ANALISIS }, "en_aprobacion")).toMatchObject({ tipo: "bloqueado", accion: "detalle" });
    expect(planMovimiento({ estatus: "en_aprobacion", analisis: ANALISIS }, "en_firma")).toMatchObject({ tipo: "bloqueado" });
    expect(planMovimiento({ estatus: "en_aprobacion", analisis: ANALISIS }, "en_analisis").tipo).toBe("bloqueado");
    expect(planMovimiento({ estatus: "en_firma" }, "formalizada")).toMatchObject({ tipo: "bloqueado", accion: "firma" });
    expect(planMovimiento({ estatus: "en_ajustes" }, "en_aprobacion").tipo).toBe("bloqueado");
    expect(planMovimiento({ estatus: "nueva" }, "en_firma").tipo).toBe("bloqueado");
  });
});
