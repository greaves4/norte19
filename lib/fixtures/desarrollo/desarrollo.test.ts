import { describe, expect, it } from "vitest";
import { CONSULTAS_CORPUS, CORPUS, crearProyecto, promedioCorpus } from "@/lib/fixtures/desarrollo";
import { SECCIONES_ESPERADAS, redactarHotel } from "@/lib/fixtures/desarrollo/corpus/redaccion";
import textos from "@/lib/fixtures/desarrollo/corpus/textos/textos.json";
import { ZONAS } from "@/lib/types/desarrollo";

const TEXTOS = textos as Record<string, string[]>;
const HOY = new Date(2026, 8, 24, 10);

describe("corpus de 5 hoteles", () => {
  it("son select-service de 110–150 llaves con años de precios 2018–2022", () => {
    expect(CORPUS.map((h) => h.id)).toEqual(["tijuana-florido", "cancun-aeropuerto", "guaymas", "ensenada", "altamira"]);
    for (const h of CORPUS) {
      expect(h.llaves).toBeGreaterThanOrEqual(110);
      expect(h.llaves).toBeLessThanOrEqual(150);
      for (const c of h.catalogos) expect(Number(c.fechaOrigen.slice(0, 4))).toBeGreaterThanOrEqual(2018);
    }
  });

  it("el m² por llave de cada zona varía menos de ±15% contra el promedio", () => {
    for (const z of ZONAS) {
      const prom = promedioCorpus(z);
      for (const h of CORPUS) expect(Math.abs(h.cuadroAreas.find((x) => x.zona === z)!.m2PorLlave / prom - 1), `${h.id} ${z}`).toBeLessThanOrEqual(0.15);
    }
  });

  it("catálogos de 30–40 conceptos; Guaymas sin instalaciones y Cancún con interiores parcial", () => {
    for (const h of CORPUS)
      for (const c of h.catalogos) {
        expect(c.conceptos.length, `${h.id} ${c.id}`).toBeGreaterThanOrEqual(30);
        expect(c.conceptos.length, `${h.id} ${c.id}`).toBeLessThanOrEqual(40);
      }
    const gym = CORPUS.find((h) => h.id === "guaymas")!;
    expect(gym.mep).toBeNull();
    expect(gym.catalogos.map((c) => c.id)).toEqual(["obra_civil"]);
    expect(Object.values(gym.cobertura.instalaciones)).toEqual(["ausente", "ausente", "ausente", "ausente"]);
    const cun = CORPUS.find((h) => h.id === "cancun-aeropuerto")!;
    expect(Object.values(cun.cobertura.interiores)).toContain("parcial");
    expect(CORPUS.filter((h) => h.id !== "guaymas").every((h) => h.catalogos.length === 5)).toBe(true);
  });

  it("hay conceptos que solo tiene un hotel (el catálogo los marcará con confianza baja)", () => {
    const pci = CORPUS.filter((h) => h.catalogos.some((c) => c.conceptos.some((k) => k.clave === "PCI-031")));
    expect(pci.map((h) => h.id)).toEqual(["cancun-aeropuerto"]);
  });
});

describe("textos del corpus", () => {
  it("textos.json coincide con la redacción actual (correr pnpm gen:desarrollo si cambia)", () => {
    for (const h of CORPUS) for (const [id, paginas] of Object.entries(redactarHotel(h))) expect(TEXTOS[id], id).toEqual(paginas);
    expect(Object.keys(TEXTOS)).toHaveLength(24);
  });

  it("cada sección cae en la página que citan las fuentes", () => {
    for (const h of CORPUS) {
      for (const [doc, pagina, encabezado] of SECCIONES_ESPERADAS) {
        const paginas = TEXTOS[`${h.id}-${doc}`];
        if (!paginas) continue; // Guaymas no tiene instalaciones
        expect(paginas[pagina - 1], `${h.id}-${doc} p${pagina}`).toContain(encabezado);
      }
    }
  });
});

describe("consultas precomputadas", () => {
  it("son 12 con respuesta y fuentes que existen", () => {
    expect(CONSULTAS_CORPUS).toHaveLength(12);
    for (const c of CONSULTAS_CORPUS) {
      expect(c.respuesta.length, c.id).toBeGreaterThan(40);
      expect(c.fuentes.length, c.id).toBeGreaterThan(0);
      for (const f of c.fuentes) {
        if (f.pagina === undefined) continue;
        const paginas = TEXTOS[f.documento];
        expect(paginas, `${c.id}: ${f.documento}`).toBeTruthy();
        expect(f.pagina).toBeLessThanOrEqual(paginas.length);
      }
    }
  });

  it("BOH: la respuesta y la tabla usan los datos del corpus", () => {
    const boh = CONSULTAS_CORPUS.find((c) => c.id === "boh-m2-llave")!;
    const valores = CORPUS.map((h) => h.cuadroAreas.find((z) => z.zona === "boh")!.m2PorLlave);
    const max = CORPUS[valores.indexOf(Math.max(...valores))];
    const min = CORPUS[valores.indexOf(Math.min(...valores))];
    expect(max.id).toBe("cancun-aeropuerto");
    expect(min.id).toBe("ensenada");
    expect(boh.tabla!.filas).toHaveLength(6);
    // El dato de la tabla está en la página citada.
    for (const f of boh.fuentes) expect(TEXTOS[f.documento][f.pagina! - 1]).toContain("BOH");
  });
});

describe("proyecto Juárez", () => {
  const p = crearProyecto(HOY);

  it("inicia en fase 1 con mecánica de suelos y CAPEX objetivo ausentes", () => {
    expect(p.fase).toBe(1);
    expect(p.inputs.filter((i) => !i.archivo).map((i) => i.id)).toEqual(["mecanica_suelos", "capex_objetivo"]);
    expect(p.llaves).toBe(128);
  });

  it("áreas públicas es la zona que más se desvía del benchmark", () => {
    const desv = p.definicion.cuadroAreas.map((z) => ({ zona: z.zona, d: Math.abs(z.m2 / p.llaves / promedioCorpus(z.zona) - 1) }));
    expect(desv.sort((a, b) => b.d - a.d)[0].zona).toBe("areas_publicas");
    const est = p.definicion.cuadroAreas.find((z) => z.zona === "estacionamiento")!;
    expect(Math.round(est.m2 / 25)).toBe(71); // coincide con la evidencia del requisito de marca MK-12
  });

  it("20 requisitos de marca, 8 decisiones, 10 riesgos y 13 entregables que suman 100", () => {
    expect(p.definicion.marca).toHaveLength(20);
    expect(p.definicion.decisiones).toHaveLength(8);
    expect(p.definicion.riesgos.length).toBeGreaterThanOrEqual(8);
    expect(p.semaforo).toHaveLength(13);
    expect(p.semaforo.reduce((t, e) => t + e.peso, 0)).toBe(100);
  });
});
