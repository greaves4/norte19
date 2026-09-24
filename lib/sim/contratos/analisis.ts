// Análisis jurídico: plantilla por secciones y lectura de lo capturado.
export const SECCIONES_ANALISIS = ["Objeto", "Riesgos identificados", "Cláusulas a negociar", "Recomendación"] as const;
export type SeccionAnalisis = (typeof SECCIONES_ANALISIS)[number];

export const PLANTILLA_ANALISIS = SECCIONES_ANALISIS.map((s) => `${s}:\n`).join("\n");

const ENCABEZADO = new RegExp(`^(${SECCIONES_ANALISIS.join("|")}):\\s*(.*)$`);

// Texto de cada sección (lo que va en la línea del encabezado más las líneas siguientes).
export function seccionesAnalisis(texto: string | undefined): Record<SeccionAnalisis, string> & { libre: string } {
  const out = { ...Object.fromEntries(SECCIONES_ANALISIS.map((s) => [s, ""])), libre: "" } as Record<SeccionAnalisis, string> & { libre: string };
  let actual: SeccionAnalisis | "libre" = "libre";
  for (const linea of (texto ?? "").split("\n")) {
    const m = linea.trim().match(ENCABEZADO);
    if (m) {
      actual = m[1] as SeccionAnalisis;
      out[actual] = m[2].trim();
    } else if (linea.trim()) {
      out[actual] = out[actual] ? `${out[actual]}\n${linea.trim()}` : linea.trim();
    }
  }
  return out;
}

// Vacío = sin texto o solo la plantilla sin llenar.
export function analisisVacio(texto: string | undefined): boolean {
  const s = seccionesAnalisis(texto);
  return !s.libre && SECCIONES_ANALISIS.every((k) => !s[k]);
}

// Resumen para listas: la recomendación, o el inicio del texto.
export function resumenAnalisis(texto: string | undefined, max = 160): string {
  const s = seccionesAnalisis(texto);
  const base = s["Recomendación"] || s.Objeto || s.libre || "";
  return base.length > max ? `${base.slice(0, max - 1).trimEnd()}…` : base;
}
