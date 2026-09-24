import { describe, expect, it } from "vitest";
import { crearDatosContratos } from "@/lib/fixtures/contratos";
import { FORMULARIOS } from "@/lib/fixtures/contratos/formularios";
import textos from "@/lib/fixtures/contratos/textos/textos.json";
import { cargaPorAbogado } from "@/lib/sim/contratos/asignacion";
import { diasHabilesRestantes, semaforo } from "@/lib/sim/contratos/sla";
import { estatusVigencia } from "@/lib/sim/contratos/vencimientos";

// Martes 22 de septiembre de 2026, 11:00: +24 h cae en día hábil.
const HOY = new Date(2026, 8, 22, 11, 0);
const datos = crearDatosContratos(HOY);
const activas = datos.solicitudes.filter((s) => ["nueva", "en_analisis", "en_ajustes"].includes(s.estatus));
const colores = (now: Date) => activas.map((s) => semaforo(diasHabilesRestantes(s.creadaEn, s.slaDiasHabiles, now), s.slaDiasHabiles));

describe("formularios", () => {
  it("cubren las 8 combinaciones con campos y documentos", () => {
    expect(FORMULARIOS).toHaveLength(8);
    for (const f of FORMULARIOS) {
      expect(f.campos.length).toBeGreaterThan(3);
      expect(new Set(f.campos.map((c) => c.clave)).size).toBe(f.campos.length);
    }
    const moralArr = FORMULARIOS.find((f) => f.tipoPersona === "moral" && f.tipoContrato === "arrendamiento")!;
    expect(moralArr.campos.map((c) => c.clave)).toEqual(
      expect.arrayContaining(["razonSocial", "rfc", "representanteLegal", "poderNotarial", "inmueble", "superficie", "rentaMensual", "vigenciaMeses", "deposito", "incrementoAnual"]),
    );
    expect(moralArr.documentos.find((d) => d.clave === "poderNotarial")?.obligatorio).toBe(true);
    const fisicaArr = FORMULARIOS.find((f) => f.tipoPersona === "fisica" && f.tipoContrato === "arrendamiento")!;
    expect(fisicaArr.campos.map((c) => c.clave)).toEqual(expect.arrayContaining(["nombre", "rfc", "curp", "identificacion", "inmueble", "rentaMensual", "vigenciaMeses", "aval"]));
  });
});

describe("solicitudes", () => {
  it("son 24, deterministas, con la carga inicial del documento", () => {
    expect(datos.solicitudes).toHaveLength(24);
    expect(crearDatosContratos(HOY)).toEqual(datos);
    expect(cargaPorAbogado(datos.solicitudes)).toEqual({ "ab-robles": 4, "ab-salgado": 6, "ab-nieto": 3 });
    expect(datos.solicitudes.filter((s) => s.solicitanteId === "desarrollo")).toHaveLength(3);
  });

  it("reparten el Kanban en todos los estatus", () => {
    const conteo = datos.solicitudes.reduce<Record<string, number>>((a, s) => ((a[s.estatus] = (a[s.estatus] ?? 0) + 1), a), {});
    expect(conteo).toEqual({ nueva: 5, en_analisis: 7, en_ajustes: 1, en_aprobacion: 4, aprobada: 2, en_firma: 2, formalizada: 3 });
  });

  it("tienen SLA en verde, ámbar y exactamente uno en rojo; con +24 h otro pasa a rojo", () => {
    const hoy = colores(HOY);
    expect(hoy.filter((c) => c === "rojo")).toHaveLength(1);
    expect(hoy.filter((c) => c === "ambar").length).toBeGreaterThanOrEqual(2);
    expect(hoy.filter((c) => c === "verde").length).toBeGreaterThanOrEqual(5);
    const manana = colores(new Date(HOY.getTime() + 24 * 3_600_000));
    expect(manana.filter((c) => c === "rojo").length).toBeGreaterThan(1);
  });

  it("tienen timelines ordenadas y etapas coherentes", () => {
    for (const s of datos.solicitudes) {
      const fechas = s.timeline.map((e) => e.fecha);
      expect(fechas).toEqual([...fechas].sort());
      expect(s.timeline[0].tipo).toBe("creada");
      expect(s.etapas[s.estatus]).toBeDefined();
      if (["en_aprobacion", "aprobada", "en_firma", "formalizada"].includes(s.estatus)) expect(s.analisis).toBeTruthy();
    }
    const ajustes = datos.solicitudes.find((s) => s.estatus === "en_ajustes")!;
    expect(ajustes.motivoRechazo).toMatch(/poder notarial/);
    expect(ajustes.expediente.some((d) => d.clave === "poderNotarial")).toBe(false);
  });
});

describe("contratos", () => {
  it("son 8, con 2 por vencer, 1 vencido y 2 digitalizados", () => {
    expect(datos.contratos).toHaveLength(8);
    const estatus = datos.contratos.map((c) => estatusVigencia(c.vigenciaFin, HOY));
    expect(estatus.filter((e) => e === "por_vencer")).toHaveLength(2);
    expect(estatus.filter((e) => e === "vencido")).toHaveLength(1);
    expect(datos.contratos.filter((c) => c.ocr)).toHaveLength(2);
  });

  it("tienen extracción con 1 o 2 campos por confirmar y páginas válidas", () => {
    for (const c of datos.contratos) {
      const pendientes = c.extraccion.filter((x) => !x.confirmado);
      expect(pendientes.length, c.id).toBeGreaterThanOrEqual(1);
      expect(pendientes.length, c.id).toBeLessThanOrEqual(2);
      expect(pendientes.every((x) => x.confianza !== "alta")).toBe(true);
      for (const x of c.extraccion) {
        if (x.pagina === null) continue;
        expect(x.pagina).toBeGreaterThanOrEqual(1);
        expect(x.pagina).toBeLessThanOrEqual(c.paginas);
      }
      expect(c.paginas).toBeGreaterThanOrEqual(6);
      expect((textos as Record<string, string[]>)[c.id]).toHaveLength(c.paginas);
    }
  });

  it("Guaymas tiene fiador y la penalización pendiente de confirmar, y el texto la respalda", () => {
    const gym = datos.contratos.find((c) => c.id === "arr-gym")!;
    const pena = gym.extraccion.find((x) => x.clave === "penalizacion")!;
    expect(pena.confirmado).toBe(false);
    expect(gym.extraccion.find((x) => x.clave === "garantia")!.valor).toMatch(/Ramón Félix Salazar/);
    expect((textos as Record<string, string[]>)["arr-gym"][pena.pagina! - 1]).toMatch(/pena convencional/);
  });

  it("3 arrendamientos tienen penalización por terminación anticipada redactada de forma distinta", () => {
    const t = Object.fromEntries(Object.entries(textos as Record<string, string[]>).map(([id, p]) => [id, p.join(" ").replace(/\s+/g, " ")]));
    expect(t["arr-gym"]).toContain("por concepto de pena convencional");
    expect(t["arr-alt"]).toContain("penalización por terminación anticipada");
    expect(t["arr-pue"]).toContain("una indemnización equivalente a");
    for (const id of ["arr-ens", "arr-mid"]) expect(t[id]).toContain("sin responsabilidad ni pena alguna");
    // La búsqueda literal solo encuentra una de las tres redacciones.
    expect(Object.values(t).filter((x) => x.includes("penalización por terminación anticipada"))).toHaveLength(1);
  });

  it("tienen custodia de 3 tantos con un préstamo vencido", () => {
    const prestamos = datos.contratos.flatMap((c) => c.custodia.filter((t) => t.prestamo));
    expect(datos.contratos.every((c) => c.custodia.length === 3)).toBe(true);
    expect(prestamos.filter((t) => new Date(t.prestamo!.hasta) < HOY)).toHaveLength(1);
    expect(datos.contratos.find((c) => c.id === "arr-gym")!.custodia[1].estatus).toBe("en_resguardo");
  });
});
