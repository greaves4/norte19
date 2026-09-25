// Impresión de un documento HTML en un iframe oculto (el iframe no hereda Tailwind: lleva su propia hoja).
// La usan la exportación a PDF del DataGrid y los expedientes de Desarrollo (criterios, trazabilidad, reporte).
const CSS_BASE = `
  @page { margin: 12mm; }
  body { font: 10pt system-ui, sans-serif; margin: 0; color: #000; }
  h1 { font-size: 14pt; margin: 0 0 8pt; }
  h2 { font-size: 11.5pt; margin: 14pt 0 6pt; break-after: avoid; }
  h3 { font-size: 10pt; margin: 10pt 0 4pt; break-after: avoid; }
  p { margin: 0 0 6pt; }
  .muted { color: #555; }
  .small { font-size: 8.5pt; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border-bottom: 0.5pt solid; padding: 4pt 6pt; text-align: left; vertical-align: top; }
  th { font-weight: 600; }
  thead { display: table-header-group; }
  tr, li, .bloque { break-inside: avoid; }
  .text-right { text-align: right; }
  .portada { break-after: page; padding-top: 30vh; }
  [data-print-hide], button svg, input, [role="checkbox"] { display: none !important; }
  button { all: unset; }
`;

// Escapa texto para interpolarlo en HTML.
export function esc(texto: unknown): string {
  return String(texto ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

export function imprimirHtml({ titulo, html, css = "", preparar }: { titulo: string; html: string; css?: string; preparar?: (doc: Document) => void }) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) return iframe.remove();
  doc.open();
  doc.write(`<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>${CSS_BASE}${css}</style></head><body><h1>${esc(titulo)}</h1>${html}</body></html>`);
  doc.close();
  preparar?.(doc);
  win.focus();
  win.print();
  setTimeout(() => iframe.remove(), 1000);
}
