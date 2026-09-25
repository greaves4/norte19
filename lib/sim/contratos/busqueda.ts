// Búsqueda en contratos: índice de texto completo (minisearch) por cláusula y capa de consultas "inteligentes"
// precomputadas. En modo inteligente se usa la consulta más parecida si supera el umbral; si no, el índice.
import MiniSearch from "minisearch";
import { CONSULTAS, type Consulta } from "@/lib/fixtures/contratos/consultas";
import textos from "@/lib/fixtures/contratos/textos/textos.json";
import { fragmentar, normalizar, type Fragmento } from "@/lib/sim/contratos/fragmentos";
import { diasParaVencer } from "@/lib/sim/contratos/vencimientos";
import type { Contrato } from "@/lib/types/contratos";

export type ModoBusqueda = "exacto" | "inteligente";

export type Segmento = { texto: string; resaltado: boolean };

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

const VACIAS = new Set(
  "a al ante bajo con contra de del desde donde durante el ella ellos en entre es esta este esto hacia hasta la las le lo los mas me mi o para pero por que quien se si sin sobre su sus te tiene tienen un una uno unos unas y ya cual cuales cuanto como hay cada qué cuál cuáles cuánto cómo".split(" ").map(normalizar),
);

// Palabras de la pregunta como se escribieron (con acentos), sin palabras vacías.
export function palabras(texto: string): string[] {
  return texto.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 1 && !VACIAS.has(normalizar(t)));
}

export function terminos(texto: string): string[] {
  return normalizar(texto)
    .split(/[^a-z0-9ñ]+/)
    .filter((t) => t.length > 1 && !VACIAS.has(t));
}

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

// --- Resaltado ----------------------------------------------------------------------------------------

// Rangos [inicio, fin) de `texto` que coinciden con alguna frase o término (sin distinguir acentos).
function rangos(texto: string, buscar: string[], porPalabra: boolean): [number, number][] {
  const base = normalizar(texto); // misma longitud que el original: NFD + quitar marcas no cambia letras base en español
  const out: [number, number][] = [];
  for (const b of buscar) {
    const q = normalizar(b);
    if (!q) continue;
    let desde = 0;
    while (desde < base.length) {
      const i = base.indexOf(q, desde);
      if (i < 0) break;
      const inicioPalabra = i === 0 || /[^a-z0-9ñ]/.test(base[i - 1]);
      if (!porPalabra || inicioPalabra) {
        let fin = i + q.length;
        // En modo término, resalta la palabra completa (prefijo "penaliz" → "penalización").
        if (porPalabra) while (fin < base.length && /[a-z0-9ñ]/.test(base[fin])) fin++;
        out.push([i, fin]);
      }
      desde = i + q.length;
    }
  }
  return out.sort((a, b) => a[0] - b[0]).reduce<[number, number][]>((acc, r) => {
    const ultimo = acc[acc.length - 1];
    if (ultimo && r[0] <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], r[1]);
    else acc.push([...r]);
    return acc;
  }, []);
}

const VENTANA = 320;

// Fragmento legible alrededor de la primera coincidencia, con sus segmentos resaltados.
export function extracto(texto: string, buscar: string[], porPalabra = false): { fragmento: string; segmentos: Segmento[] } {
  const rs = rangos(texto, buscar, porPalabra);
  let inicio = 0;
  if (rs.length && rs[0][0] > VENTANA / 3) {
    inicio = texto.lastIndexOf(" ", rs[0][0] - 60);
    inicio = inicio < 0 ? 0 : inicio + 1;
  }
  let fin = Math.min(texto.length, inicio + VENTANA);
  if (fin < texto.length) {
    const corte = texto.lastIndexOf(" ", fin);
    fin = corte > inicio ? corte : fin;
  }
  const prefijo = inicio > 0 ? "…" : "";
  const sufijo = fin < texto.length ? "…" : "";
  const segmentos: Segmento[] = [];
  if (prefijo) segmentos.push({ texto: prefijo, resaltado: false });
  let cursor = inicio;
  for (const [a, b] of rs) {
    if (b <= inicio || a >= fin) continue;
    const ia = Math.max(a, inicio);
    const ib = Math.min(b, fin);
    if (ia > cursor) segmentos.push({ texto: texto.slice(cursor, ia), resaltado: false });
    segmentos.push({ texto: texto.slice(ia, ib), resaltado: true });
    cursor = ib;
  }
  if (cursor < fin) segmentos.push({ texto: texto.slice(cursor, fin), resaltado: false });
  if (sufijo) segmentos.push({ texto: sufijo, resaltado: false });
  return { fragmento: `${prefijo}${texto.slice(inicio, fin)}${sufijo}`, segmentos };
}

// --- Consultas inteligentes ---------------------------------------------------------------------------

export const UMBRAL_CONSULTA = 0.6;

// Similitud entre la pregunta y una consulta: grupos de claves cubiertos (70%) + solapamiento de términos con la
// redacción más parecida (30%).
export function similitud(pregunta: string, c: Pick<Consulta, "pregunta" | "variantes" | "claves">): number {
  const q = terminos(pregunta);
  if (!q.length) return 0;
  const texto = ` ${q.join(" ")} `;
  const grupos = c.claves.filter((g) => g.some((raiz) => texto.includes(` ${normalizar(raiz)}`))).length / c.claves.length;
  const solape = Math.max(
    ...[c.pregunta, ...c.variantes].map((v) => {
      const t = new Set(terminos(v));
      return q.filter((x) => t.has(x)).length / Math.max(t.size, q.length);
    }),
  );
  return 0.7 * grupos + 0.3 * solape;
}

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
