// Guion de validación de Contratos (sección 7 del documento) recorrido contra el store, con los cuatro perfiles.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { USUARIOS_CONTRATOS } from "@/lib/fixtures/contratos";
import { analisisVacio } from "@/lib/sim/contratos/analisis";
import { buscar } from "@/lib/sim/contratos/busqueda";
import { prestamosVencidos } from "@/lib/sim/contratos/custodia";
import { indicadoresContratos } from "@/lib/sim/contratos/dashboard";
import { definicionPara, documentosFaltantes, valoresDeEjemplo } from "@/lib/sim/contratos/formulario";
import { useContratos } from "@/lib/store/contratos";
import type { Documento } from "@/lib/types/contratos";

const JUEVES = new Date(2026, 8, 24, 10, 0);
const store = () => useContratos.getState();
const sol = (id: string) => store().solicitudes.find((s) => s.id === id)!;
const { solicitante, abogado, directivo, admin } = USUARIOS_CONTRATOS;

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(JUEVES);
  store().reset();
});
afterAll(() => vi.useRealTimers());

describe("guion de validación de Contratos", () => {
  let nuevaId = "";

  it("Solicitante: arrendamiento con persona moral, bloqueo sin poder notarial y asignación", () => {
    const def = definicionPara("moral", "arrendamiento");
    const expediente: Documento[] = def.documentos.map((d) => ({ clave: d.clave, etiqueta: d.etiqueta, nombre: `${d.clave}.pdf`, src: `/fixtures/contratos/expediente/${d.clave}.pdf`, tipo: "pdf" }));
    const sinPoder = expediente.filter((d) => d.clave !== "poderNotarial");
    expect(documentosFaltantes(def, sinPoder).map((d) => d.clave)).toEqual(["poderNotarial"]);
    // La persona física pide otros campos (CURP, aval) y no pide poder notarial.
    const fisica = definicionPara("fisica", "arrendamiento");
    expect(fisica.campos.some((c) => c.clave === "curp")).toBe(true);
    expect(fisica.documentos.some((d) => d.clave === "poderNotarial")).toBe(false);

    const { id, abogadoId } = store().crearSolicitud({ tipoPersona: "moral", tipoContrato: "arrendamiento", campos: valoresDeEjemplo(def, JUEVES), expediente, solicitanteId: solicitante.id }, solicitante.nombre);
    nuevaId = id;
    // Le llega a la abogada de la demo (menor carga inicial), con SLA de 5 días hábiles.
    expect(abogadoId).toBe(abogado.id);
    expect(sol(id).slaDiasHabiles).toBe(5);
  });

  it("Abogado: +24 h, análisis breve y envío a aprobación; reasignación", () => {
    vi.setSystemTime(new Date(JUEVES.getTime() + 24 * 3_600_000));
    const mias = store().solicitudes.filter((s) => s.abogadoId === abogado.id && ["nueva", "en_analisis"].includes(s.estatus));
    expect(mias.map((s) => s.id)).toContain(nuevaId);

    // En la vista, guardar el análisis de una solicitud nueva la inicia.
    expect(store().iniciarAnalisis(nuevaId, abogado.nombre)).toBe(true);
    const texto = "Objeto: Arrendamiento en León.\nRiesgos identificados: Ninguno relevante.\nCláusulas a negociar: Tope al INPC.\nRecomendación: Procede.";
    expect(analisisVacio(texto)).toBe(false);
    store().guardarAnalisis(nuevaId, texto, abogado.nombre);
    expect(store().enviarAAprobacion(nuevaId, abogado.nombre)).toBe(true);

    const otra = store().solicitudes.find((s) => s.abogadoId === abogado.id && s.estatus === "nueva")!;
    expect(store().reasignar(otra.id, "ab-robles", abogado.nombre)).toBe(true);
  });

  it("Directivo: rechaza a ajustes la recién llegada (vuelve al abogado) y aprueba otra", () => {
    expect(store().rechazarAAjustes(nuevaId, "Falta tope al incremento.", directivo.nombre)).toBe(true);
    expect(sol(nuevaId).estatus).toBe("en_analisis");
    expect(sol(nuevaId).abogadoId).toBe(abogado.id);
    expect(sol(nuevaId).motivoRechazo).toMatch(/tope/);
    const otra = store().solicitudes.find((s) => s.estatus === "en_aprobacion")!;
    expect(store().aprobar(otra.id, directivo.nombre)).toBe(true);
  });

  it("Admin: firma, Guaymas, búsqueda, préstamo y dashboard", () => {
    const aprobada = store().solicitudes.find((s) => s.estatus === "aprobada")!;
    expect(store().enviarAFirma(aprobada.id, admin.nombre)).toBe(true);
    for (const p of ["enviado", "firmante_1", "firmante_2", "constancia", "formalizado"] as const) store().avanzarFirma(aprobada.id, p);
    const contratoId = store().formalizar(aprobada.id)!;
    expect(store().contratos.find((c) => c.id === contratoId)?.sello).toBeTruthy();

    const gym = () => store().contratos.find((c) => c.id === "arr-gym")!;
    expect(gym().extraccion.find((x) => x.clave === "penalizacion")!.confirmado).toBe(false);
    store().confirmarCampo("arr-gym", "penalizacion", undefined, admin.nombre);
    expect(gym().extraccion.find((x) => x.clave === "penalizacion")!.confirmado).toBe(true);

    const ctx = { contratos: store().contratos, now: new Date() };
    for (const q of ["¿Qué contratos tienen penalización por terminación anticipada?", "Arrendamientos que vencen en los próximos 6 meses", "Contratos con incremento anual ligado al INPC", "¿Quién es el fiador en el contrato de Guaymas?"]) {
      const r = buscar(q, "inteligente", ctx);
      expect(r.origen, q).toBe("consulta");
      expect(r.resultados.length, q).toBeGreaterThan(0);
    }
    expect(buscar("¿Qué contratos tienen penalización por terminación anticipada?", "exacto", ctx).resultados).toHaveLength(0);

    expect(store().registrarPrestamo("arr-gym", 2, "Notaría 23 de Hermosillo", new Date(Date.now() + 7 * 86_400_000).toISOString(), admin.nombre)).toBe(true);
    expect(gym().custodia[1].estatus).toBe("prestado");
    expect(prestamosVencidos(store().contratos, new Date())).toHaveLength(1); // el de Puebla sigue vencido

    const k = indicadoresContratos(store().solicitudes, store().contratos, new Date());
    const cuello = [...k.etapas].sort((a, b) => b.valor - a.valor)[0];
    expect(cuello.valor).toBeGreaterThan(0);
  });

  it("Reiniciar demo deja 24 solicitudes, 8 contratos y las extracciones pendientes", () => {
    store().reset();
    expect(store().solicitudes).toHaveLength(24);
    expect(store().contratos).toHaveLength(8);
    expect(store().contratos.every((c) => c.extraccion.some((x) => !x.confirmado))).toBe(true);
    expect(store().contratos.find((c) => c.id === "arr-gym")!.custodia[1].estatus).toBe("en_resguardo");
  });
});
