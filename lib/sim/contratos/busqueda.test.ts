import { describe, expect, it } from "vitest";
import { crearDatosContratos } from "@/lib/fixtures/contratos";
import { CONSULTAS } from "@/lib/fixtures/contratos/consultas";
import { buscar, extracto, fragmentoDe, mejorConsulta, totalFragmentos } from "@/lib/sim/contratos/busqueda";
import { normalizar } from "@/lib/sim/contratos/fragmentos";

const HOY = new Date(2026, 8, 24, 10);
const ctx = { contratos: crearDatosContratos(HOY).contratos, now: HOY };

describe("índice por cláusula", () => {
  it("fragmenta los 8 contratos con página real", () => {
    expect(totalFragmentos()).toBeGreaterThan(150);
    const f = fragmentoDe("arr-gym", "DÉCIMA SEGUNDA")!;
    expect(f.titulo).toBe("TERMINACIÓN ANTICIPADA");
    expect(f.pagina).toBe(4);
  });

  it("cada fuente de las consultas existe y contiene el texto a resaltar", () => {
    for (const c of CONSULTAS) {
      for (const f of c.fuentes) {
        const frag = fragmentoDe(f.contratoId, f.clausula);
        expect(frag, `${c.id}: ${f.contratoId} ${f.clausula}`).toBeTruthy();
        for (const r of f.resaltar) expect(normalizar(frag!.texto), `${c.id}: ${r}`).toContain(normalizar(r));
      }
    }
  });
});

describe("consultas inteligentes", () => {
  it("reconoce la pregunta y sus variantes", () => {
    for (const c of CONSULTAS) {
      expect(mejorConsulta(c.pregunta)?.consulta.id, c.pregunta).toBe(c.id);
      for (const v of c.variantes) expect(mejorConsulta(v)?.consulta.id, v).toBe(c.id);
    }
  });

  it("una pregunta ajena cae al índice de texto", () => {
    expect(mejorConsulta("seguro de responsabilidad civil")).toBeNull();
    const r = buscar("seguro de responsabilidad civil", "inteligente", ctx);
    expect(r.origen).toBe("texto");
    expect(r.resultados.length).toBeGreaterThan(0);
  });

  it("penalización: inteligente encuentra las 3 redacciones; exacto solo la literal", () => {
    const intel = buscar("¿Qué contratos tienen penalización por terminación anticipada?", "inteligente", ctx);
    expect(intel.origen).toBe("consulta");
    expect(intel.resultados.slice(0, 3).map((r) => r.contratoId)).toEqual(["arr-gym", "arr-alt", "arr-pue"]);
    expect(intel.resultados[0].segmentos.some((s) => s.resaltado)).toBe(true);
    const exacto = buscar("penalización terminación anticipada", "exacto", ctx);
    expect(new Set(exacto.resultados.map((r) => r.contratoId))).toEqual(new Set(["arr-alt"]));
  });

  it("vencimientos se calculan con el reloj de demo", () => {
    const r = buscar("Arrendamientos que vencen en los próximos 6 meses", "inteligente", ctx);
    expect(r.resultados.map((x) => x.contratoId)).toEqual(["arr-ens", "arr-mid", "arr-alt"]);
    expect(r.respuesta).toMatch(/^2 arrendamientos vencen/);
    expect(r.respuesta).toMatch(/venció el 31 de agosto de 2026/);
    expect(r.resultados[0].segmentos.some((s) => s.resaltado && s.texto.includes("30 de noviembre de 2026"))).toBe(true);
  });
});

describe("extracto", () => {
  it("centra la ventana en la coincidencia y resalta sin distinguir acentos", () => {
    const texto = `${"relleno ".repeat(80)}la PENALIZACIÓN aplica${" más".repeat(80)}`;
    const e = extracto(texto, ["penalizacion"], true);
    expect(e.fragmento.startsWith("…")).toBe(true);
    expect(e.segmentos.find((s) => s.resaltado)?.texto).toBe("PENALIZACIÓN");
  });
});
