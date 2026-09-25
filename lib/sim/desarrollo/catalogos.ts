// Catálogos de obra de Juárez generados por ratio del corpus: cantidad = ratio promedio × base del proyecto (m²
// construidos del cuadro aprobado, llaves, niveles o por hotel), rango observado entre hoteles, precio de referencia
// = promedio de los precios históricos llevados a 2022 × factor de actualización, e importe. Confianza por la
// dispersión relativa del ratio ((máx − mín) / promedio): alta < 10%, media < 25%, baja en otro caso o si solo un
// hotel tiene el concepto. Los conceptos propios del sitio no tienen referencia en el corpus y quedan por cotizar.
import { CORPUS } from "@/lib/fixtures/desarrollo";
import { valorBase } from "@/lib/fixtures/desarrollo/corpus/construir";
import { m2Construidos } from "@/lib/sim/desarrollo/benchmark";
import { a2022 } from "@/lib/sim/desarrollo/capex";
import { CATALOGOS, NOMBRE_CATALOGO, type BaseRatio, type CatalogoId, type Fuente, type HotelCorpus, type ZonaProyecto } from "@/lib/types/desarrollo";

export type Confianza = "alta" | "media" | "baja";

export type ConceptoGenerado = {
  clave: string;
  concepto: string;
  unidad: string;
  base: BaseRatio;
  cantidad: number;
  rango: [number, number] | null;
  precioUnitario: number | null; // null: sin referencia, por cotizar
  importe: number;
  confianza: Confianza;
  dispersion: number | null;
  hoteles: number;
  motivoRevision?: string;
  fuentes: Fuente[];
};

export type CatalogoGenerado = { id: CatalogoId; nombre: string; conceptos: ConceptoGenerado[]; total: number };

export const UMBRAL_CONFIANZA = { alta: 0.1, media: 0.25 };

export function confianzaDe(dispersion: number, hoteles: number): Confianza {
  if (hoteles < 2) return "baja";
  return dispersion < UMBRAL_CONFIANZA.alta ? "alta" : dispersion < UMBRAL_CONFIANZA.media ? "media" : "baja";
}

// Conceptos que pide el sitio de Juárez y que ningún hotel del corpus tiene (sin ratio ni precio de referencia).
const PROPIOS_DEL_SITIO: Record<CatalogoId, Omit<ConceptoGenerado, "importe" | "confianza" | "dispersion" | "hoteles" | "rango" | "precioUnitario">[]> = {
  obra_civil: [
    { clave: "OC-J01", concepto: "Abatimiento del nivel freático con bombeo durante la excavación de cisterna", unidad: "lote", base: "global", cantidad: 1, motivoRevision: "Sin referencia en el corpus: nivel freático a 6 m (riesgo R-01).", fuentes: [{ tipo: "input", inputId: "mecanica_suelos", documento: "Mecánica de suelos Juárez", pagina: 1 }] },
    { clave: "OC-J02", concepto: "Retiro y sustitución de relleno no controlado en esquina noreste", unidad: "m3", base: "global", cantidad: 525, motivoRevision: "Sin referencia en el corpus: 1.5 m de relleno en 350 m² (riesgo R-08).", fuentes: [{ tipo: "input", inputId: "topografia", documento: "Levantamiento topográfico Juárez", pagina: 2 }] },
  ],
  electrico: [],
  hidrosanitario: [
    { clave: "IH-J01", concepto: "Cinta calefactora autorregulable en tuberías expuestas", unidad: "m", base: "global", cantidad: 160, motivoRevision: "Sin referencia en el corpus: protección contra congelamiento a −5 °C.", fuentes: [{ tipo: "input", inputId: "reglamento", documento: "Reglamento de construcción Juárez", pagina: 18 }] },
  ],
  pci: [],
  hvac: [
    { clave: "HV-J01", concepto: "Diferencial por bomba de calor en minisplits de habitación", unidad: "pza", base: "llave", cantidad: 1, motivoRevision: "Sin referencia en el corpus: ningún hotel requirió calefacción.", fuentes: [{ tipo: "input", inputId: "reglamento", documento: "Reglamento de construcción Juárez", pagina: 18 }] },
  ],
};

export function generarCatalogos(cuadro: Pick<ZonaProyecto, "zona" | "m2">[], llaves: number, niveles: number, factor: number, corpus: HotelCorpus[] = CORPUS): CatalogoGenerado[] {
  const proyecto = { m2Total: m2Construidos(cuadro), llaves, niveles };
  return CATALOGOS.map((id) => {
    const conCatalogo = corpus.filter((h) => h.catalogos.some((c) => c.id === id));
    const claves = new Map<string, { concepto: string; unidad: string; base: BaseRatio; muestras: { ratio: number; precio2022: number; fuente: Fuente }[] }>();
    for (const h of conCatalogo) {
      const cat = h.catalogos.find((c) => c.id === id)!;
      for (const k of cat.conceptos) {
        const entrada = claves.get(k.clave) ?? { concepto: k.concepto, unidad: k.unidad, base: k.base, muestras: [] };
        entrada.muestras.push({ ratio: k.ratio, precio2022: a2022(k.precioUnitario, cat.fechaOrigen), fuente: cat.fuente });
        claves.set(k.clave, entrada);
      }
    }
    const conceptos: ConceptoGenerado[] = [...claves.entries()].map(([clave, e]) => {
      const ratios = e.muestras.map((m) => m.ratio);
      const promedio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      const dispersion = promedio ? (Math.max(...ratios) - Math.min(...ratios)) / promedio : 0;
      const base = valorBase(e.base, proyecto);
      const cantidad = promedio * base;
      const precioUnitario = (e.muestras.reduce((t, m) => t + m.precio2022, 0) / e.muestras.length) * factor;
      const confianza = confianzaDe(dispersion, e.muestras.length);
      return {
        clave,
        concepto: e.concepto,
        unidad: e.unidad,
        base: e.base,
        cantidad,
        rango: [Math.min(...ratios) * base, Math.max(...ratios) * base],
        precioUnitario,
        importe: cantidad * precioUnitario,
        confianza,
        dispersion,
        hoteles: e.muestras.length,
        motivoRevision:
          e.muestras.length < 2 ? "Solo un hotel del corpus tiene este concepto." : confianza === "baja" ? `El ratio varía ${Math.round(dispersion * 100)}% entre hoteles.` : undefined,
        fuentes: e.muestras.map((m) => m.fuente),
      };
    });
    const propios: ConceptoGenerado[] = PROPIOS_DEL_SITIO[id].map((c) => ({
      ...c,
      cantidad: c.cantidad * valorBase(c.base, proyecto),
      rango: null,
      precioUnitario: null,
      importe: 0,
      confianza: "baja",
      dispersion: null,
      hoteles: 0,
    }));
    const todos = [...conceptos, ...propios];
    return { id, nombre: NOMBRE_CATALOGO[id], conceptos: todos, total: todos.reduce((t, c) => t + c.importe, 0) };
  });
}

// Conceptos que el revisor debe ver: confianza baja o sin referencia en el corpus.
export function requierenRevision(catalogos: CatalogoGenerado[]) {
  return catalogos.flatMap((c) => c.conceptos.filter((k) => k.confianza === "baja").map((k) => ({ catalogo: c.id, concepto: k })));
}

// Filas del Excel de un catálogo: clave, concepto, unidad, cantidad, P.U., importe.
export function filasExcel(c: CatalogoGenerado): (string | number)[][] {
  return [
    ["Clave", "Concepto", "Unidad", "Cantidad", "P.U. (MXN)", "Importe (MXN)"],
    ...c.conceptos.map((k) => [k.clave, k.concepto, k.unidad, Number(k.cantidad.toFixed(3)), k.precioUnitario === null ? "Por cotizar" : Number(k.precioUnitario.toFixed(2)), Number(k.importe.toFixed(2))]),
    ["", `Total ${c.nombre}`, "", "", "", Number(c.total.toFixed(2))],
  ];
}
