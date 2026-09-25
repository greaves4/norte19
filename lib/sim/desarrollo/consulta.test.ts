import { describe, expect, it } from "vitest";
import { CONSULTAS_CORPUS } from "@/lib/fixtures/desarrollo";
import { consultar, documentoCorpus, mejorConsultaCorpus, totalFragmentosCorpus } from "@/lib/sim/desarrollo/consulta";

describe("consulta del corpus", () => {
  it("indexa párrafos de memorias y conceptos de catálogo", () => {
    expect(totalFragmentosCorpus()).toBeGreaterThan(600);
    expect(documentoCorpus("altamira-instalaciones")?.textoPaginas).toHaveLength(3);
    expect(documentoCorpus("guaymas-instalaciones")).toBeUndefined();
  });

  it("cada consulta y sus variantes se reconocen", () => {
    for (const c of CONSULTAS_CORPUS) {
      expect(mejorConsultaCorpus(c.pregunta)?.consulta.id, c.pregunta).toBe(c.id);
      for (const v of c.variantes) expect(mejorConsultaCorpus(v)?.consulta.id, v).toBe(c.id);
    }
  });

  it("una pregunta sin consulta precomputada cae al texto con hotel, documento y página", () => {
    const r = consultar("impermeabilización de azotea");
    expect(r.origen).toBe("texto");
    if (r.origen !== "texto") return;
    expect(r.resultados.length).toBeGreaterThan(0);
    expect(r.resultados[0].documento).toMatch(/-catalogo$/);
    expect(r.resultados[0].segmentos.some((s) => s.resaltado)).toBe(true);
  });

  it("la pregunta del guion responde con tabla y fuentes", () => {
    const r = consultar("cual es el m2 por llave de BOH");
    expect(r.origen).toBe("consulta");
    if (r.origen === "consulta") {
      expect(r.consulta.tabla?.filas.length).toBe(6);
      expect(r.consulta.fuentes).toHaveLength(5);
    }
  });
});
