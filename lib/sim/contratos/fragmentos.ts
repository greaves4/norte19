// Divide el texto de un contrato (por página) en fragmentos por cláusula, con la página donde empieza cada una.
export type Fragmento = {
  id: string;
  contratoId: string;
  clausula: string; // "DÉCIMA SEGUNDA", "DECLARACIONES"
  titulo: string; // "TERMINACIÓN ANTICIPADA"
  pagina: number;
  texto: string;
};

const ORDINAL = "(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA|VIGÉSIMA|TRIGÉSIMA)";
const ENCABEZADO = new RegExp(`^(${ORDINAL}(?: ${ORDINAL})?)\\.-\\s*([^.]+)\\.\\s*(.*)$`);

export function fragmentar(contratoId: string, paginas: string[]): Fragmento[] {
  const out: Fragmento[] = [];
  let actual: Fragmento | null = { id: `${contratoId}-declaraciones`, contratoId, clausula: "DECLARACIONES", titulo: "PARTES Y DECLARACIONES", pagina: 1, texto: "" };
  paginas.forEach((pagina, i) => {
    for (const linea of pagina.split("\n")) {
      const m = linea.trim().match(ENCABEZADO);
      if (m) {
        if (actual?.texto.trim()) out.push(actual);
        actual = { id: `${contratoId}-${out.length}`, contratoId, clausula: m[1], titulo: m[2].trim(), pagina: i + 1, texto: m[3] };
      } else if (actual && linea.trim() && !/^CLÁUSULAS:?$/.test(linea.trim())) {
        actual.texto += `${actual.texto ? " " : ""}${linea.trim()}`;
      }
    }
  });
  if (actual && (actual as Fragmento).texto.trim()) out.push(actual);
  return out.map((f, n) => ({ ...f, id: `${contratoId}-${n}` }));
}

export { normalizar } from "@/lib/texto";
