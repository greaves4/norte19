// Construye un HotelCorpus completo a partir de sus parámetros. Determinista: la variación de cantidades y precios
// sale de un generador con semilla por hotel y concepto. Sin alias: lo importa el script de Node.
import type {
  Acabado,
  AreaAcabado,
  BaseRatio,
  Catalogo,
  CatalogoId,
  Cobertura,
  Disciplina,
  DocumentoCorpus,
  Fuente,
  HotelCorpus,
  MepPorLlave,
  TipoDoc,
  Zona,
  ZonaId,
} from "../../../types/desarrollo.ts";
import { CONCEPTOS, type Dispersion } from "./conceptos.ts";

export const ZONAS_CORPUS: ZonaId[] = ["habitaciones", "areas_publicas", "boh", "circulaciones", "estacionamiento"];
export const CATALOGOS_CORPUS: CatalogoId[] = ["obra_civil", "electrico", "hidrosanitario", "pci", "hvac"];

const NOMBRES_CATALOGO: Record<CatalogoId, string> = {
  obra_civil: "Obra civil",
  electrico: "Eléctrico",
  hidrosanitario: "Hidrosanitario y gas",
  pci: "Protección contra incendio",
  hvac: "HVAC",
};

// Páginas de cada sección en las memorias del corpus (las usan la redacción y las fuentes de las consultas).
export const PAGINA = {
  arquitectonico: { descripcion: 1, programa: 1, cuadroAreas: 2, fachada: 3, elevadores: 3, estacionamiento: 3 },
  estructural: { sistema: 1, claros: 1, cimentacion: 2 },
  instalaciones: { electrico: 1, hidrosanitario: 2, gas: 2, hvac: 3, pci: 3 },
  interiores: { habitacion: 1, bano: 1, publicas: 2, boh: 2 },
} as const;

export const PAGINAS_DOC = { arquitectonico: 3, estructural: 2, instalaciones: 3, interiores: 2 } as const;

// Documento → id estable "<hotel>-<disciplina>".
export const docId = (hotelId: string, disciplina: Disciplina | "catalogo") => `${hotelId}-${disciplina}`;

export function fuenteCorpus(hotelId: string, disciplina: Disciplina | "catalogo", pagina: number, clavePlano?: string): Fuente {
  return { tipo: "corpus", hotelId, documento: docId(hotelId, disciplina), pagina, ...(clavePlano ? { clavePlano } : {}) };
}

export type ParametrosHotel = {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  llaves: number;
  niveles: number;
  elevadores: number;
  anio: number;
  fechaPrecios: string; // AAAA-MM
  // m² por llave de cada zona (el estacionamiento es exterior y no suma a los m² construidos).
  porLlave: Record<ZonaId, number>;
  sistemaEstructural: HotelCorpus["sistemaEstructural"];
  fachada: string;
  mep: MepPorLlave | null;
  acabados: [AreaAcabado, Acabado["elemento"], string][];
  cobertura?: Partial<Record<Disciplina, Partial<Record<TipoDoc, Cobertura>>>>;
};

// Hash FNV-1a → semilla; mulberry32 → número en [0, 1).
function semilla(texto: string) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function aleatorio(texto: string) {
  let t = (semilla(texto) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Variación simétrica en [-1, 1].
const ruido = (texto: string) => aleatorio(texto) * 2 - 1;

const AMPLITUD: Record<Dispersion, number> = { b: 0.05, m: 0.15, a: 0.35 };
const INFLACION_ANUAL = 0.055;

const redondear = (n: number, decimales: number) => Math.round(n * 10 ** decimales) / 10 ** decimales;

function catalogos(p: ParametrosHotel, sinInstalaciones: boolean): Catalogo[] {
  const anioPrecios = Number(p.fechaPrecios.slice(0, 4));
  const deflactor = (1 + INFLACION_ANUAL) ** (2022 - anioPrecios);
  return CATALOGOS_CORPUS.filter((id) => !sinInstalaciones || id === "obra_civil").map((id, i) => ({
    id,
    nombre: NOMBRES_CATALOGO[id],
    fechaOrigen: p.fechaPrecios,
    fuente: fuenteCorpus(p.id, "catalogo", i + 1),
    conceptos: CONCEPTOS[id]
      .filter(([, , , , , , , soloEn]) => !soloEn || soloEn.includes(p.id))
      .map(([clave, concepto, unidad, base, ratio, precio2022, dispersion]) => ({
        clave,
        concepto,
        unidad,
        base,
        // Las cantidades globales enteras (equipos) no varían; el resto sí, según la dispersión del concepto.
        ratio: base === "global" && Number.isInteger(ratio) ? ratio : redondear(ratio * (1 + ruido(`${p.id}:${clave}:q`) * AMPLITUD[dispersion]), 4),
        precioUnitario: redondear((precio2022 / deflactor) * (1 + ruido(`${p.id}:${clave}:p`) * 0.08), 2),
      })),
  }));
}

const COBERTURA_COMPLETA = (): Record<Disciplina, Record<TipoDoc, Cobertura>> => {
  const fila = (): Record<TipoDoc, Cobertura> => ({ planos: "completo", xref: "completo", memoria: "completo", catalogo: "completo" });
  return { arquitectonico: fila(), estructural: fila(), instalaciones: fila(), interiores: fila(), equipamiento: fila() };
};

export function construirHotel(p: ParametrosHotel): HotelCorpus {
  const cobertura = COBERTURA_COMPLETA();
  for (const [d, tipos] of Object.entries(p.cobertura ?? {}) as [Disciplina, Partial<Record<TipoDoc, Cobertura>>][]) Object.assign(cobertura[d], tipos);
  const sinInstalaciones = Object.values(cobertura.instalaciones).every((c) => c === "ausente");

  const cuadroAreas: Zona[] = ZONAS_CORPUS.map((zona) => ({
    zona,
    m2: Math.round(p.porLlave[zona] * p.llaves),
    m2PorLlave: p.porLlave[zona],
    fuentes: [fuenteCorpus(p.id, "arquitectonico", PAGINA.arquitectonico.cuadroAreas, "AQ-100 Cuadro de áreas")],
  }));
  const m2Total = cuadroAreas.filter((z) => z.zona !== "estacionamiento").reduce((t, z) => t + z.m2, 0);

  const paginaAcabado: Record<AreaAcabado, number> = { habitacion: 1, bano_habitacion: 1, lobby: 2, desayunador: 2, pasillos: 2, boh: 2 };
  const acabados: Acabado[] = p.acabados.map(([area, elemento, material]) => ({
    area,
    elemento,
    material,
    fuentes: [fuenteCorpus(p.id, "interiores", paginaAcabado[area])],
  }));

  const cats = catalogos(p, sinInstalaciones);
  const documentos: DocumentoCorpus[] = [
    { id: docId(p.id, "arquitectonico"), hotelId: p.id, disciplina: "arquitectonico", titulo: `Memoria descriptiva arquitectónica · ${p.nombre}`, paginas: PAGINAS_DOC.arquitectonico },
    { id: docId(p.id, "estructural"), hotelId: p.id, disciplina: "estructural", titulo: `Memoria de cálculo estructural · ${p.nombre}`, paginas: PAGINAS_DOC.estructural },
    ...(sinInstalaciones
      ? []
      : [{ id: docId(p.id, "instalaciones"), hotelId: p.id, disciplina: "instalaciones" as const, titulo: `Memoria de instalaciones · ${p.nombre}`, paginas: PAGINAS_DOC.instalaciones }]),
    { id: docId(p.id, "interiores"), hotelId: p.id, disciplina: "interiores", titulo: `Especificación de acabados e interiores · ${p.nombre}`, paginas: PAGINAS_DOC.interiores },
    { id: docId(p.id, "catalogo"), hotelId: p.id, disciplina: "catalogo", titulo: `Catálogo de conceptos de obra · ${p.nombre}`, paginas: cats.length },
  ];

  return {
    id: p.id,
    nombre: p.nombre,
    ciudad: p.ciudad,
    estado: p.estado,
    llaves: p.llaves,
    niveles: p.niveles,
    elevadores: p.elevadores,
    m2Total,
    anio: p.anio,
    cuadroAreas,
    sistemaEstructural: p.sistemaEstructural,
    fachada: p.fachada,
    mep: sinInstalaciones ? null : p.mep,
    acabados,
    catalogos: cats,
    cobertura,
    documentos,
  };
}

// Cantidad de la base de un concepto en un hotel (o proyecto): m² construidos, llaves, niveles o 1 por hotel.
export function valorBase(base: BaseRatio, h: { m2Total: number; llaves: number; niveles: number }) {
  return base === "m2" ? h.m2Total : base === "llave" ? h.llaves : base === "nivel" ? h.niveles : 1;
}

// Importe total de un catálogo a precios de su fecha de origen.
export function importeCatalogo(c: Catalogo, h: { m2Total: number; llaves: number; niveles: number }) {
  return c.conceptos.reduce((t, k) => t + k.ratio * valorBase(k.base, h) * k.precioUnitario, 0);
}
