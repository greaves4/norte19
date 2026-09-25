// Búsqueda en contratos: índice de texto completo (minisearch) por cláusula y capa de consultas "inteligentes"
// precomputadas. En modo inteligente se usa la consulta más parecida si supera el umbral; si no, el índice.
import MiniSearch from "minisearch";
import { CONSULTAS, type Consulta } from "@/lib/fixtures/contratos/consultas";
import textos from "@/lib/fixtures/contratos/textos/textos.json";
import { fragmentar, type Fragmento } from "@/lib/sim/contratos/fragmentos";
import { extracto, normalizar, palabras, similitud, terminos, VACIAS, type Segmento } from "@/lib/texto";

export { extracto, palabras, similitud, terminos, type Segmento };
import { diasParaVencer } from "@/lib/sim/contratos/vencimientos";
import type { Contrato } from "@/lib/types/contratos";

export type ModoBusqueda = "exacto" | "inteligente";


export type Resultado = {
  contratoId: string;
  clausula: string;
  titulo: string;
  pagina: number;
  fragmento: string;
  segmentos: Segmento[];
  puntaje: number;
};

export type RespuestaBusqueda = {
  origen: "consulta" | "texto";
  consultaId?: string;
  respuesta?: string;
  resultados: Resultado[];
  // Palabras que se buscaron tal como se escribieron (sin palabras vacías), para explicar el modo exacto.
  terminos: string[];
};

// --- Índice -------------------------------------------------------------------------------------------

const FRAGMENTOS: Fragmento[] = Object.entries(textos as Record<string, string[]>).flatMap(([id, paginas]) => fragmentar(id, paginas));
const POR_ID = new Map(FRAGMENTOS.map((f) => [f.id, f]));

let indice: MiniSearch<Fragmento> | null = null;
function obtenerIndice() {
  if (!indice) {
    indice = new MiniSearch<Fragmento>({
      fields: ["titulo", "texto"],
      storeFields: ["id"],
      processTerm: (t) => {
        const n = normalizar(t);
        return n.length > 1 && !VACIAS.has(n) ? n : null;
      },
      searchOptions: { boost: { titulo: 2 } },
    });
    indice.addAll(FRAGMENTOS);
  }
  return indice;
}

export function fragmentoDe(contratoId: string, clausula: string): Fragmento | undefined {
  return FRAGMENTOS.find((f) => f.contratoId === contratoId && f.clausula === clausula);
}

export function totalFragmentos() {
  return FRAGMENTOS.length;
}

// --- Consultas inteligentes ---------------------------------------------------------------------------

export const UMBRAL_CONSULTA = 0.6;

export function mejorConsulta(pregunta: string): { consulta: Consulta; puntaje: number } | null {
  let mejor: { consulta: Consulta; puntaje: number } | null = null;
  for (const consulta of CONSULTAS) {
    const puntaje = similitud(pregunta, consulta);
    if (!mejor || puntaje > mejor.puntaje) mejor = { consulta, puntaje };
  }
  return mejor && mejor.puntaje >= UMBRAL_CONSULTA ? mejor : null;
}

const fechaLarga = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

function resolverConsulta(c: Consulta, contratos: Contrato[], now: Date): Pick<RespuestaBusqueda, "respuesta" | "resultados"> {
  let respuesta = c.respuesta;
  let fuentes = c.fuentes;
  if (c.dinamica === "vencen_6_meses") {
    const arr = contratos.filter((x) => x.tipo === "arrendamiento" && POR_ID.has(`${x.id}-0`));
    const proximos = arr.filter((x) => {
      const d = diasParaVencer(x.vigenciaFin, now);
      return d >= 0 && d <= 183;
    });
    const vencidos = arr.filter((x) => diasParaVencer(x.vigenciaFin, now) < 0);
    const lista = proximos.map((x) => `${x.contraparte} (vence el ${fechaLarga(x.vigenciaFin)})`);
    respuesta = proximos.length
      ? `${proximos.length === 1 ? "1 arrendamiento vence" : `${proximos.length} arrendamientos vencen`} en los próximos 6 meses: ${lista.join("; ")}.`
      : "Ningún arrendamiento vence en los próximos 6 meses.";
    if (vencidos.length) respuesta += ` Además, ${vencidos.map((x) => `${x.contraparte} venció el ${fechaLarga(x.vigenciaFin)}`).join("; ")}.`;
    fuentes = [...proximos, ...vencidos].map((x) => {
      const clausula = FRAGMENTOS.find((f) => f.contratoId === x.id && f.titulo === "VIGENCIA")?.clausula ?? "TERCERA";
      return { contratoId: x.id, clausula, resaltar: [fechaLarga(x.vigenciaFin)] };
    });
  }
  const resultados = fuentes.flatMap((f, i) => {
    const frag = fragmentoDe(f.contratoId, f.clausula);
    if (!frag) return [];
    return [{ contratoId: f.contratoId, clausula: frag.clausula, titulo: frag.titulo, pagina: frag.pagina, ...extracto(frag.texto, f.resaltar), puntaje: fuentes.length - i }];
  });
  return { respuesta, resultados };
}

// --- Búsqueda -----------------------------------------------------------------------------------------

export function buscar(pregunta: string, modo: ModoBusqueda, contexto: { contratos: Contrato[]; now: Date }): RespuestaBusqueda {
  const qs = terminos(pregunta);
  const escritas = palabras(pregunta);
  if (!qs.length) return { origen: "texto", resultados: [], terminos: [] };

  if (modo === "inteligente") {
    const m = mejorConsulta(pregunta);
    if (m) return { origen: "consulta", consultaId: m.consulta.id, ...resolverConsulta(m.consulta, contexto.contratos, contexto.now), terminos: escritas };
  }

  // Exacto: todas las palabras, sin variaciones. Inteligente sin consulta: cualquier palabra, con prefijos y errores leves.
  const hallazgos =
    modo === "exacto"
      ? obtenerIndice().search(pregunta, { combineWith: "AND", prefix: false, fuzzy: false })
      : obtenerIndice().search(pregunta, { combineWith: "OR", prefix: (t) => t.length > 3, fuzzy: (t) => (t.length > 5 ? 0.2 : false) });

  const resultados = hallazgos.slice(0, 30).flatMap((h) => {
    const frag = POR_ID.get(String(h.id));
    if (!frag) return [];
    const resaltar = modo === "exacto" ? qs : [...new Set([...qs, ...h.terms])];
    return [{ contratoId: frag.contratoId, clausula: frag.clausula, titulo: frag.titulo, pagina: frag.pagina, ...extracto(frag.texto, resaltar, true), puntaje: h.score }];
  });
  return { origen: "texto", resultados, terminos: escritas };
}
