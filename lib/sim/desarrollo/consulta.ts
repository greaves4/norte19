// Consulta del corpus: primero intenta emparejar una de las 12 consultas precomputadas (similitud sobre términos
// clave sin acentos); si ninguna supera el umbral, busca en el índice de texto (minisearch) de memorias y catálogos,
// fragmentado por párrafo, e indica "Resultado por texto".
import MiniSearch from "minisearch";
import { CONSULTAS_CORPUS, CORPUS } from "@/lib/fixtures/desarrollo";
import textos from "@/lib/fixtures/desarrollo/corpus/textos/textos.json";
import { extracto, normalizar, similitud, terminos, VACIAS, type Segmento } from "@/lib/texto";
import type { ConsultaCorpus, DocumentoCorpus } from "@/lib/types/desarrollo";

export const UMBRAL_CONSULTA_CORPUS = 0.6;

const TEXTOS = textos as Record<string, string[]>;
const DOCUMENTOS = new Map<string, DocumentoCorpus>(CORPUS.flatMap((h) => h.documentos.map((d) => [d.id, d] as const)));

export type FragmentoCorpus = { id: string; documento: string; hotelId: string; pagina: number; texto: string };

// Párrafos de las memorias; en los catálogos, cada concepto es un fragmento.
function fragmentar(): FragmentoCorpus[] {
  const out: FragmentoCorpus[] = [];
  for (const [documento, paginas] of Object.entries(TEXTOS)) {
    const hotelId = DOCUMENTOS.get(documento)?.hotelId ?? "";
    const esCatalogo = documento.endsWith("-catalogo");
    paginas.forEach((pagina, i) => {
      const partes = esCatalogo ? pagina.split("\n").filter((l) => l.includes(" | ")) : pagina.split(/\n\s*\n/);
      for (const parte of partes) {
        const texto = parte.replace(/\s*\n\s*/g, " ").trim();
        if (texto.length < 40) continue;
        out.push({ id: `${documento}-${i + 1}-${out.length}`, documento, hotelId, pagina: i + 1, texto });
      }
    });
  }
  return out;
}

const FRAGMENTOS = fragmentar();
const POR_ID = new Map(FRAGMENTOS.map((f) => [f.id, f]));

let indice: MiniSearch<FragmentoCorpus> | null = null;
function obtenerIndice() {
  if (!indice) {
    indice = new MiniSearch<FragmentoCorpus>({
      fields: ["texto"],
      storeFields: ["id"],
      processTerm: (t) => {
        const n = normalizar(t);
        return n.length > 1 && !VACIAS.has(n) ? n : null;
      },
    });
    indice.addAll(FRAGMENTOS);
  }
  return indice;
}

export function totalFragmentosCorpus() {
  return FRAGMENTOS.length;
}

export function documentoCorpus(id: string) {
  const doc = DOCUMENTOS.get(id);
  const paginas = TEXTOS[id];
  return doc && paginas ? { ...doc, textoPaginas: paginas } : undefined;
}

export function mejorConsultaCorpus(pregunta: string): { consulta: ConsultaCorpus; puntaje: number } | null {
  let mejor: { consulta: ConsultaCorpus; puntaje: number } | null = null;
  for (const consulta of CONSULTAS_CORPUS) {
    const puntaje = similitud(pregunta, consulta);
    if (!mejor || puntaje > mejor.puntaje) mejor = { consulta, puntaje };
  }
  return mejor && mejor.puntaje >= UMBRAL_CONSULTA_CORPUS ? mejor : null;
}

export type ResultadoTexto = FragmentoCorpus & { segmentos: Segmento[]; puntaje: number };

export type RespuestaConsulta = { origen: "consulta"; consulta: ConsultaCorpus } | { origen: "texto"; resultados: ResultadoTexto[]; terminos: string[] };

export function consultar(pregunta: string): RespuestaConsulta {
  const m = mejorConsultaCorpus(pregunta);
  if (m) return { origen: "consulta", consulta: m.consulta };
  const qs = terminos(pregunta);
  if (!qs.length) return { origen: "texto", resultados: [], terminos: [] };
  const hallazgos = obtenerIndice().search(pregunta, { combineWith: "OR", prefix: (t) => t.length > 3, fuzzy: (t) => (t.length > 5 ? 0.2 : false) });
  const resultados = hallazgos.slice(0, 12).flatMap((h) => {
    const f = POR_ID.get(String(h.id));
    return f ? [{ ...f, ...extracto(f.texto, [...new Set([...qs, ...h.terms])], true), puntaje: h.score }] : [];
  });
  return { origen: "texto", resultados, terminos: qs };
}
