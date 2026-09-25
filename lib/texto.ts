// Utilidades de búsqueda en texto en español (Contratos y Desarrollo): normalización sin acentos, términos sin
// palabras vacías, similitud contra consultas precomputadas y extracto con resaltado.

// Minúsculas y sin acentos, para comparar.
export function normalizar(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export type Segmento = { texto: string; resaltado: boolean };

export const VACIAS = new Set(
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

// Similitud entre la pregunta y una consulta: grupos de claves cubiertos (70%) + solapamiento de términos con la
// redacción más parecida (30%).
export function similitud(pregunta: string, c: { pregunta: string; variantes: string[]; claves: string[][] }): number {
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

