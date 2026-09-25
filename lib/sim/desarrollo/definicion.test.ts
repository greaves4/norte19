import { describe, expect, it } from "vitest";
import { crearProyecto } from "@/lib/fixtures/desarrollo";
import { CAPEX_OBJETIVO_USD_POR_LLAVE } from "@/lib/fixtures/desarrollo/anteproyecto";
import { compararCuadro, semaforoDesviacion } from "@/lib/sim/desarrollo/benchmark";
import { calcularCapex } from "@/lib/sim/desarrollo/capex";
import { entregablesConSupuesto, evaluarInputs } from "@/lib/sim/desarrollo/gates";
import { calcularAvance, condicionEntrega } from "@/lib/sim/desarrollo/semaforo";

const p = crearProyecto(new Date(2026, 8, 24));

describe("gate de inputs", () => {
  it("nivel 1 por mecánica de suelos; nivel 2 por CAPEX objetivo; libre con todo", () => {
    const g = evaluarInputs(p.inputs);
    expect(g.nivel).toBe(1);
    expect(g.faltantes.map((f) => f.input.id)).toEqual(["mecanica_suelos"]);
    expect(g.faltantes[0].impacto).toMatch(/sistema estructural ni cimentación/);
    const conMecanica = p.inputs.map((i) => (i.id === "mecanica_suelos" ? { ...i, archivo: { nombre: "m.pdf", src: "/m.pdf", tipo: "pdf" as const, cargadoEn: "" } } : i));
    expect(evaluarInputs(conMecanica).nivel).toBe(2);
    expect([...entregablesConSupuesto(conMecanica)]).toEqual(["capex"]);
    const todo = conMecanica.map((i) => ({ ...i, archivo: i.archivo ?? { nombre: "x.pdf", src: "/x.pdf", tipo: "pdf" as const, cargadoEn: "" } }));
    expect(evaluarInputs(todo).nivel).toBe("libre");
  });
});

describe("benchmark del cuadro de áreas", () => {
  it("áreas públicas se desvía −20% (rojo); BOH y estacionamiento en ámbar", () => {
    const filas = compararCuadro(p.definicion.cuadroAreas, p.llaves);
    const f = Object.fromEntries(filas.map((x) => [x.zona, x]));
    expect(f.areas_publicas.desviacion).toBeCloseTo(-0.2, 1);
    expect(f.areas_publicas.semaforo).toBe("rojo");
    expect(f.boh.semaforo).toBe("ambar");
    expect(f.estacionamiento.semaforo).toBe("ambar");
    expect(f.habitaciones.semaforo).toBe("verde");
    expect(filas.filter((x) => x.porcentaje !== null).reduce((t, x) => t + x.porcentaje!, 0)).toBeCloseTo(1, 5);
  });

  it("umbrales ±8% y ±15%", () => {
    expect(semaforoDesviacion(0.08)).toBe("verde");
    expect(semaforoDesviacion(-0.12)).toBe("ambar");
    expect(semaforoDesviacion(0.151)).toBe("rojo");
  });

  it("ajustar una zona recalcula la desviación", () => {
    const cuadro = p.definicion.cuadroAreas.map((z) => (z.zona === "areas_publicas" ? { ...z, m2: Math.round(z.m2 * 1.2) } : z));
    const f = compararCuadro(cuadro, p.llaves).find((x) => x.zona === "areas_publicas")!;
    expect(f.semaforo).toBe("verde");
  });
});

describe("CAPEX", () => {
  const c = calcularCapex(p.definicion.cuadroAreas, p.llaves, p.factorActualizacion, false);

  it("rango ±10%, desglose que suma y en ámbar sin objetivo", () => {
    expect(c.rangoPorLlave[0]).toBeCloseTo(c.porLlaveUsd * 0.9, 5);
    expect(c.porZona.reduce((t, z) => t + z.usd, 0)).toBeCloseTo(c.directoUsd, 5);
    // El reparto por zona conserva el costo del edificio calculado por disciplina.
    const edificio = c.porZona.filter((z) => z.zona !== "estacionamiento").reduce((t, z) => t + z.usd, 0);
    expect(edificio).toBeCloseTo(c.porDisciplina.reduce((t, d) => t + d.usd, 0), 3);
    expect(c.semaforo).toBe("ambar");
    expect(c.porDisciplina.find((d) => d.catalogo === "obra_civil")!.hoteles).toBe(5);
    expect(c.porDisciplina.find((d) => d.catalogo === "electrico")!.hoteles).toBe(4);
    expect(c.preciosDesde).toBe("2018-05");
    expect(c.preciosHasta).toBe("2022-01");
  });

  it("por llave en un rango verosímil y comparable con el objetivo", () => {
    expect(c.porLlaveUsd).toBeGreaterThan(30_000);
    expect(c.porLlaveUsd).toBeLessThan(60_000);
    const conObjetivo = calcularCapex(p.definicion.cuadroAreas, p.llaves, p.factorActualizacion, true);
    expect(conObjetivo.objetivo!.usdPorLlave).toBe(CAPEX_OBJETIVO_USD_POR_LLAVE);
    expect(conObjetivo.semaforo).not.toBe("rojo");
  });

  it("el factor de actualización escala el costo", () => {
    const mas = calcularCapex(p.definicion.cuadroAreas, p.llaves, p.factorActualizacion * 1.1, false);
    expect(mas.totalUsd / c.totalUsd).toBeCloseTo(1.1, 5);
  });
});

describe("semáforo", () => {
  it("avance ponderado y condición de entrega", () => {
    expect(calcularAvance(p.semaforo)).toBeCloseTo((15 * 0.5 + 10 * 0.5) / 100, 5);
    const todos = p.semaforo.map((e) => ({ ...e, semaforo: "verde" as const }));
    expect(condicionEntrega(todos).cumple).toBe(true);
    const unoAmbar = todos.map((e) => (e.id === "capex" ? { ...e, semaforo: "ambar" as const } : e));
    expect(condicionEntrega(unoAmbar).cumple).toBe(false);
  });
});

describe("fases del tablero", () => {
  it("fase 1 detenida; al liberar el gate, Retrieval completo y Validation en curso", async () => {
    const { estadoFases, estadoModulos } = await import("@/lib/sim/desarrollo/fases");
    expect(estadoFases(p).map((x) => x.estado)).toEqual(["detenido", "pendiente", "pendiente", "pendiente", "pendiente"]);
    expect(estadoModulos(p).inputs.texto).toMatch(/mecánica de suelos/);
    expect(estadoModulos(p).definicion.estado).toBe("bloqueado");
    const liberado = { ...p, fase: 2 as const };
    expect(estadoFases(liberado).map((x) => x.estado)).toEqual(["completo", "completo", "en_curso", "pendiente", "pendiente"]);
    const aprobado = { ...p, fase: 4 as const };
    expect(estadoModulos(aprobado).criterios.estado).toBe("listo");
    expect(estadoModulos(aprobado).completitud.estado).toBe("atencion");
  });
});

describe("criterios y biblioteca", () => {
  it("5–8 criterios por disciplina, cada uno con fuente; 30 soluciones en la biblioteca", async () => {
    const { crearCriterios } = await import("@/lib/fixtures/desarrollo/criterios");
    const { BIBLIOTECA } = await import("@/lib/fixtures/desarrollo/biblioteca");
    const { DISCIPLINAS_CRITERIO } = await import("@/lib/types/desarrollo");
    const criterios = crearCriterios();
    for (const d of DISCIPLINAS_CRITERIO) {
      const n = criterios.filter((c) => c.disciplina === d).length;
      expect(n, d).toBeGreaterThanOrEqual(5);
      expect(n, d).toBeLessThanOrEqual(8);
    }
    expect(criterios.every((c) => c.fuentes.length > 0)).toBe(true);
    expect(new Set(criterios.map((c) => c.id)).size).toBe(criterios.length);
    expect(BIBLIOTECA).toHaveLength(30);
    expect(BIBLIOTECA.some((b) => /cancelería/i.test(b.titulo))).toBe(true);
    // El rango de carga eléctrica del criterio sale del corpus (Guaymas no aporta).
    expect(criterios.find((c) => c.id === "IE-01")!.rango).toMatch(/^3\.1–3\.7 kW/);
  });
});
