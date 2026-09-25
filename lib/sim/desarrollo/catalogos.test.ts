import { describe, expect, it } from "vitest";
import { crearProyecto } from "@/lib/fixtures/desarrollo";
import { m2Construidos } from "@/lib/sim/desarrollo/benchmark";
import { calcularCapex, TIPO_CAMBIO } from "@/lib/sim/desarrollo/capex";
import { confianzaDe, filasExcel, generarCatalogos, requierenRevision } from "@/lib/sim/desarrollo/catalogos";

const p = crearProyecto(new Date(2026, 8, 25));
const cats = generarCatalogos(p.definicion.cuadroAreas, p.llaves, p.niveles, p.factorActualizacion);

describe("catálogos de obra", () => {
  it("5 catálogos; cantidades por la base del proyecto", () => {
    expect(cats.map((c) => c.id)).toEqual(["obra_civil", "electrico", "hidrosanitario", "pci", "hvac"]);
    const trazo = cats[0].conceptos.find((k) => k.clave === "OC-001")!;
    expect(trazo.cantidad / m2Construidos(p.definicion.cuadroAreas)).toBeGreaterThan(0.5);
    const minisplit = cats[4].conceptos.find((k) => k.clave === "HV-001")!;
    expect(minisplit.cantidad).toBeCloseTo(128, 5);
    expect(minisplit.confianza).toBe("alta");
  });

  it("confianza por dispersión del ratio; un solo hotel o sin referencia es baja", () => {
    expect(confianzaDe(0.05, 5)).toBe("alta");
    expect(confianzaDe(0.2, 5)).toBe("media");
    expect(confianzaDe(0.4, 5)).toBe("baja");
    expect(confianzaDe(0, 1)).toBe("baja");
    const cola = requierenRevision(cats);
    const claves = cola.map((x) => x.concepto.clave);
    expect(claves).toEqual(expect.arrayContaining(["OC-033", "IE-034", "PCI-031", "OC-J01", "IH-J01", "HV-J01"]));
    expect(cola.find((x) => x.concepto.clave === "OC-J01")!.concepto.precioUnitario).toBeNull();
    const conteo = { alta: 0, media: 0, baja: 0 };
    for (const c of cats) for (const k of c.conceptos) conteo[k.confianza] += 1;
    expect(conteo.alta).toBeGreaterThan(conteo.baja);
    expect(conteo.media).toBeGreaterThan(0);
  });

  it("el total por catálogo es comparable con el CAPEX de la Fase de Definición", () => {
    const capex = calcularCapex(p.definicion.cuadroAreas, p.llaves, p.factorActualizacion, false);
    const totalCatalogosUsd = cats.reduce((t, c) => t + c.total, 0) / TIPO_CAMBIO;
    // Mismo origen (catálogos del corpus), distinto método: dentro de ±15%.
    expect(Math.abs(totalCatalogosUsd / capex.directoUsd - 1)).toBeLessThan(0.15);
  });

  it("el factor de actualización escala precios e importes", () => {
    const mas = generarCatalogos(p.definicion.cuadroAreas, p.llaves, p.niveles, p.factorActualizacion * 1.1);
    expect(mas[0].total / cats[0].total).toBeCloseTo(1.1, 5);
  });

  it("filas de Excel con encabezado, conceptos y total", () => {
    const filas = filasExcel(cats[1]);
    expect(filas[0]).toEqual(["Clave", "Concepto", "Unidad", "Cantidad", "P.U. (MXN)", "Importe (MXN)"]);
    expect(filas).toHaveLength(cats[1].conceptos.length + 2);
    expect(filas.at(-1)![1]).toBe("Total Eléctrico");
  });
});

describe("trazabilidad y sugerencias del semáforo", () => {
  it("cada entregable tiene datos con fuentes; las sugerencias reflejan el estado", async () => {
    const { trazabilidad, sugerencias } = await import("@/lib/sim/desarrollo/trazabilidad");
    const t = trazabilidad(p);
    expect(Object.keys(t)).toHaveLength(13);
    expect(t.cuadro_areas).toHaveLength(5);
    expect(t.cuadro_areas[0].fuentes.length).toBeGreaterThan(1);
    expect(t.capex.some((x) => /Supuesto paramétrico/.test(x.detalle ?? ""))).toBe(true);
    const s = sugerencias(p);
    expect(s.cuadro_areas.semaforo).toBe("rojo");
    expect(s.capex.semaforo).toBe("ambar");
    expect(s.estructura.semaforo).toBe("rojo");
    const aprobado = { ...p, fase: 4 as const, paquete: [{ nombre: "ES-101 Planta.pdf" }, { nombre: "ES-111 Losa.pdf" }, { nombre: "ES-201 Armado.pdf" }] };
    expect(sugerencias(aprobado).estructura).toEqual({ semaforo: "ambar", motivo: "3 de 4 entregables en el paquete." });
  });
});
