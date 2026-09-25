// CAPEX de la Fase de Definición: cuadro de áreas × costo por m² por zona derivado de los catálogos del corpus
// × factor de actualización, con rango ±10%. Los precios de cada hotel se llevan a 2022 con la inflación de
// construcción y de ahí a hoy con el factor configurable. Acabados, FF&E e indirectos no tienen catálogo en el
// corpus: entran como supuesto paramétrico documentado.
import { CORPUS } from "@/lib/fixtures/desarrollo";
import { CAPEX_OBJETIVO_USD_POR_LLAVE } from "@/lib/fixtures/desarrollo/anteproyecto";
import { valorBase } from "@/lib/fixtures/desarrollo/corpus/construir";
import { m2Construidos } from "@/lib/sim/desarrollo/benchmark";
import { NOMBRE_CATALOGO, type CatalogoId, type Fuente, type HotelCorpus, type Semaforo, type ZonaId, type ZonaProyecto } from "@/lib/types/desarrollo";

export const INFLACION_CONSTRUCCION = 0.055;
export const TIPO_CAMBIO = 18.5; // MXN por USD, supuesto de la estimación
export const RANGO = 0.1;

// Conceptos que dependen del estacionamiento exterior (se costean por m² de estacionamiento, no del edificio).
const CONCEPTOS_ESTACIONAMIENTO = new Set(["OC-027", "OC-028", "IE-026"]);

// Peso relativo del costo por m² de cada zona del edificio (lobby y áreas públicas más caras; circulaciones menos).
export const PESO_ZONA: Record<Exclude<ZonaId, "estacionamiento">, number> = { habitaciones: 1, areas_publicas: 1.3, boh: 1.05, circulaciones: 0.8 };

export const SUPUESTOS_PARAMETRICOS = [
  { id: "acabados", concepto: "Acabados e interiores", pct: 0.3 },
  { id: "ffe", concepto: "FF&E y equipamiento", pct: 0.2 },
  { id: "indirectos", concepto: "Indirectos, proyecto y licencias", pct: 0.12 },
] as const;

export const a2022 = (precio: number, fecha: string) => precio * (1 + INFLACION_CONSTRUCCION) ** (2022 - Number(fecha.slice(0, 4)));

type CostoHotel = { hotel: HotelCorpus; edificioPorM2: number; estacionamientoPorM2: number };

// Costo 2022 por m² construido de un catálogo en un hotel (sin los conceptos de estacionamiento).
function costoCatalogo(h: HotelCorpus, id: CatalogoId): CostoHotel | null {
  const c = h.catalogos.find((x) => x.id === id);
  if (!c) return null;
  let edificio = 0;
  let estacionamiento = 0;
  for (const k of c.conceptos) {
    const importe = k.ratio * valorBase(k.base, h) * a2022(k.precioUnitario, c.fechaOrigen);
    if (CONCEPTOS_ESTACIONAMIENTO.has(k.clave)) estacionamiento += importe;
    else edificio += importe;
  }
  const m2Est = h.cuadroAreas.find((z) => z.zona === "estacionamiento")!.m2;
  return { hotel: h, edificioPorM2: edificio / h.m2Total, estacionamientoPorM2: estacionamiento / m2Est };
}

export type LineaDisciplina = { catalogo: CatalogoId; nombre: string; mxnPorM2: number; usd: number; hoteles: number; fuentes: Fuente[] };
export type LineaZona = { zona: ZonaId; m2: number; mxnPorM2: number; usd: number };

export type Capex = {
  porDisciplina: LineaDisciplina[];
  porZona: LineaZona[];
  directoUsd: number;
  supuestos: { id: string; concepto: string; pct: number; usd: number }[];
  totalUsd: number;
  porLlaveUsd: number;
  rangoTotal: [number, number];
  rangoPorLlave: [number, number];
  preciosDesde: string;
  preciosHasta: string;
  factor: number;
  objetivo: { usdPorLlave: number; desviacion: number } | null;
  semaforo: Semaforo;
};

export function calcularCapex(cuadro: ZonaProyecto[], llaves: number, factor: number, conObjetivo: boolean, corpus: HotelCorpus[] = CORPUS): Capex {
  const construidos = m2Construidos(cuadro);
  const catalogos: CatalogoId[] = ["obra_civil", "electrico", "hidrosanitario", "pci", "hvac"];

  // Por disciplina: promedio de los hoteles que tienen el catálogo (Guaymas solo aporta obra civil).
  let estacionamientoPorM2 = 0;
  const porDisciplina: LineaDisciplina[] = catalogos.map((id) => {
    const costos = corpus.map((h) => costoCatalogo(h, id)).filter((x): x is CostoHotel => x !== null);
    const mxn2022 = costos.reduce((t, c) => t + c.edificioPorM2, 0) / costos.length;
    estacionamientoPorM2 += costos.reduce((t, c) => t + c.estacionamientoPorM2, 0) / costos.length;
    const mxnPorM2 = mxn2022 * factor;
    return {
      catalogo: id,
      nombre: NOMBRE_CATALOGO[id],
      mxnPorM2,
      usd: (mxnPorM2 * construidos) / TIPO_CAMBIO,
      hoteles: costos.length,
      fuentes: costos.map((c) => c.hotel.catalogos.find((x) => x.id === id)!.fuente),
    };
  });

  // Por zona: el costo del edificio por m² se reparte con el peso de cada zona, normalizado a la mezcla del proyecto.
  const edificioPorM2 = porDisciplina.reduce((t, d) => t + d.mxnPorM2, 0);
  const zonasEdificio = cuadro.filter((z) => z.zona !== "estacionamiento");
  const norm = construidos / zonasEdificio.reduce((t, z) => t + PESO_ZONA[z.zona as keyof typeof PESO_ZONA] * z.m2, 0);
  const porZona: LineaZona[] = cuadro.map((z) => {
    const mxnPorM2 = z.zona === "estacionamiento" ? estacionamientoPorM2 * factor : edificioPorM2 * PESO_ZONA[z.zona] * norm;
    return { zona: z.zona, m2: z.m2, mxnPorM2, usd: (mxnPorM2 * z.m2) / TIPO_CAMBIO };
  });

  const directoUsd = porZona.reduce((t, z) => t + z.usd, 0);
  const supuestos = SUPUESTOS_PARAMETRICOS.map((s) => ({ ...s, usd: directoUsd * s.pct }));
  const totalUsd = directoUsd + supuestos.reduce((t, s) => t + s.usd, 0);
  const porLlaveUsd = totalUsd / llaves;
  const fechas = corpus.flatMap((h) => h.catalogos.map((c) => c.fechaOrigen)).sort();

  const objetivo = conObjetivo ? { usdPorLlave: CAPEX_OBJETIVO_USD_POR_LLAVE, desviacion: porLlaveUsd / CAPEX_OBJETIVO_USD_POR_LLAVE - 1 } : null;
  // Sin objetivo aprobado queda en ámbar; con objetivo, verde si no lo rebasa, ámbar hasta +10%, rojo arriba.
  const semaforo: Semaforo = !objetivo ? "ambar" : objetivo.desviacion <= 0 ? "verde" : objetivo.desviacion <= 0.1 ? "ambar" : "rojo";

  return {
    porDisciplina,
    porZona,
    directoUsd,
    supuestos,
    totalUsd,
    porLlaveUsd,
    rangoTotal: [totalUsd * (1 - RANGO), totalUsd * (1 + RANGO)],
    rangoPorLlave: [porLlaveUsd * (1 - RANGO), porLlaveUsd * (1 + RANGO)],
    preciosDesde: fechas[0],
    preciosHasta: fechas[fechas.length - 1],
    factor,
    objetivo,
    semaforo,
  };
}
