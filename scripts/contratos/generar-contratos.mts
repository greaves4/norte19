// Genera los 8 contratos de ejemplo de Contratos. Se corre a mano y el resultado se versiona:
//   pnpm gen:contratos
// Salidas:
// - public/fixtures/contratos/<id>.pdf              PDF con texto seleccionable
// - public/fixtures/contratos/<id>-digitalizado.pdf versión escaneada (solo contratos con ocr: true)
// - lib/fixtures/contratos/textos/<id>.txt          texto plano, páginas separadas por \f (índice de búsqueda)
// - lib/fixtures/contratos/textos/textos.json       mismo texto, por página, para importarlo en la app
// - lib/fixtures/contratos/extracciones/<id>.json   "extracción por IA" con la página real de cada cláusula
// - public/fixtures/contratos/modelos/<tipo>.pdf     modelo institucional que se muestra al formalizar en la demo
// - public/fixtures/contratos/expediente/<clave>.pdf documento de ejemplo de una página por tipo de documento
// Las imágenes del escaneo se obtienen con `sips` (macOS).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { CONTRATOS_CATALOGO, type ContratoCatalogo } from "../../lib/fixtures/contratos/catalogo.ts";
import { DOCUMENTOS_EJEMPLO } from "../../lib/fixtures/contratos/formularios.ts";
import { redactar, type Bloque, type CampoRedactado } from "./redaccion.mts";

const RAIZ = join(import.meta.dirname, "..", "..");
const DIR_PDF = join(RAIZ, "public", "fixtures", "contratos");
const DIR_TEXTOS = join(RAIZ, "lib", "fixtures", "contratos", "textos");
const DIR_EXTRACCIONES = join(RAIZ, "lib", "fixtures", "contratos", "extracciones");

// Página carta con márgenes generosos, como un contrato impreso.
const ANCHO = 612;
const ALTO = 792;
const MARGEN_X = 78;
const MARGEN_SUP = 84;
const MARGEN_INF = 84;
const TAM = 11.5;
const INTERLINEA = 17.5;
const ANCHO_TEXTO = ANCHO - MARGEN_X * 2;

type Fuentes = { normal: PDFFont; negrita: PDFFont };
type Palabra = { texto: string; negrita: boolean };
type Linea =
  | { tipo: "texto"; palabras: Palabra[]; justificar: boolean; centrar?: boolean; y: number }
  | { tipo: "firma"; izquierda: string[]; derecha: string[]; y: number };
type Pagina = { lineas: Linea[] };

function palabras(texto: string, negrita = false): Palabra[] {
  return texto.split(/\s+/).filter(Boolean).map((t) => ({ texto: t, negrita }));
}

function ancho(p: Palabra[], f: Fuentes) {
  return p.reduce((s, w, i) => s + (w.negrita ? f.negrita : f.normal).widthOfTextAtSize(w.texto, TAM) + (i ? f.normal.widthOfTextAtSize(" ", TAM) : 0), 0);
}

// Parte un párrafo en líneas que caben en el ancho de texto.
function partir(ps: Palabra[], f: Fuentes): Palabra[][] {
  const lineas: Palabra[][] = [];
  let actual: Palabra[] = [];
  for (const w of ps) {
    if (actual.length && ancho([...actual, w], f) > ANCHO_TEXTO) {
      lineas.push(actual);
      actual = [];
    }
    actual.push(w);
  }
  if (actual.length) lineas.push(actual);
  return lineas;
}

// Maqueta los bloques en páginas y registra en qué página empieza cada ancla.
function maquetar(bloques: Bloque[], f: Fuentes) {
  const paginas: Pagina[] = [{ lineas: [] }];
  const anclas: Record<string, number> = {};
  let y = ALTO - MARGEN_SUP;
  const nuevaPagina = () => {
    paginas.push({ lineas: [] });
    y = ALTO - MARGEN_SUP;
  };
  const cabe = (alto: number) => y - alto >= MARGEN_INF;
  const parrafo = (ps: Palabra[], opciones: { centrar?: boolean; antes?: number; ancla?: string } = {}) => {
    const lineas = partir(ps, f);
    y -= opciones.antes ?? 6;
    // Evita dejar una sola línea al final de la página.
    if (!cabe(INTERLINEA * Math.min(lineas.length, 2))) nuevaPagina();
    if (opciones.ancla && anclas[opciones.ancla] === undefined) anclas[opciones.ancla] = paginas.length;
    lineas.forEach((l, i) => {
      if (!cabe(INTERLINEA)) nuevaPagina();
      paginas.at(-1)!.lineas.push({ tipo: "texto", palabras: l, justificar: !opciones.centrar && i < lineas.length - 1, centrar: opciones.centrar, y });
      y -= INTERLINEA;
    });
  };

  for (const b of bloques) {
    if (b.tipo === "titulo") parrafo(palabras(b.texto, true), { antes: 0 });
    else if (b.tipo === "subtitulo") {
      if (!cabe(INTERLINEA * 4)) nuevaPagina();
      parrafo(palabras(b.texto, true), { centrar: true, antes: 14 });
    } else if (b.tipo === "parrafo") parrafo(palabras(b.texto), { ancla: b.ancla });
    else if (b.tipo === "clausula") {
      b.parrafos.forEach((texto, i) =>
        parrafo(i === 0 ? [...palabras(`${b.numero}.- ${b.encabezado}.`, true), ...palabras(texto)] : palabras(texto), {
          antes: i === 0 ? 10 : 6,
          ancla: i === 0 ? b.ancla : undefined,
        }),
      );
    } else if (b.tipo === "firmas") {
      const alto = 150;
      if (!cabe(alto)) nuevaPagina();
      y -= 60;
      paginas.at(-1)!.lineas.push({ tipo: "firma", izquierda: b.izquierda, derecha: b.derecha, y });
      y -= alto - 60;
      if (b.testigos) {
        if (!cabe(alto)) nuevaPagina();
        y -= 50;
        paginas.at(-1)!.lineas.push({ tipo: "firma", izquierda: ["TESTIGO", "Lic. Adriana Solís Medina", "", ""], derecha: ["TESTIGO", "C.P. Marco Antonio Ruiz Leal", "", ""], y });
        y -= alto - 50;
      }
    }
  }
  return { paginas, anclas };
}

function textoLinea(l: Linea) {
  return l.tipo === "texto" ? l.palabras.map((w) => w.texto).join(" ") : [...l.izquierda, ...l.derecha].filter(Boolean).join("\n");
}

// Dibuja una página maquetada; `escala` 2 se usa para rasterizar el escaneo con buena resolución.
function dibujar(page: PDFPage, pagina: Pagina, f: Fuentes, numero: number, total: number, folio: string, escala = 1) {
  const s = (v: number) => v * escala;
  const espacio = f.normal.widthOfTextAtSize(" ", TAM);
  for (const l of pagina.lineas) {
    if (l.tipo === "texto") {
      const base = ancho(l.palabras, f);
      const huecos = l.palabras.length - 1;
      const extra = l.justificar && huecos > 0 ? (ANCHO_TEXTO - base) / huecos : 0;
      let x = l.centrar ? (ANCHO - base) / 2 : MARGEN_X;
      for (const w of l.palabras) {
        const fuente = w.negrita ? f.negrita : f.normal;
        page.drawText(w.texto, { x: s(x), y: s(l.y), size: s(TAM), font: fuente, color: rgb(0.08, 0.08, 0.08) });
        x += fuente.widthOfTextAtSize(w.texto, TAM) + espacio + extra;
      }
    } else {
      const columnas = [
        { centro: MARGEN_X + ANCHO_TEXTO * 0.25, lineas: l.izquierda },
        { centro: MARGEN_X + ANCHO_TEXTO * 0.75, lineas: l.derecha },
      ];
      for (const col of columnas) {
        page.drawLine({ start: { x: s(col.centro - 95), y: s(l.y) }, end: { x: s(col.centro + 95), y: s(l.y) }, thickness: s(0.6), color: rgb(0.2, 0.2, 0.2) });
        col.lineas.filter(Boolean).forEach((t, i) => {
          const fuente = i === 0 ? f.negrita : f.normal;
          const tam = i === 1 ? 9.5 : 10;
          const w = fuente.widthOfTextAtSize(t, tam);
          const texto = w > 230 ? t.slice(0, 44) + "…" : t;
          page.drawText(texto, { x: s(col.centro - Math.min(w, 230) / 2), y: s(l.y - 14 - i * 13), size: s(tam), font: fuente, color: rgb(0.1, 0.1, 0.1) });
        });
      }
    }
  }
  const pie = `${folio} · Página ${numero} de ${total}`;
  page.drawText(pie, { x: s((ANCHO - f.normal.widthOfTextAtSize(pie, 8.5)) / 2), y: s(MARGEN_INF - 36), size: s(8.5), font: f.normal, color: rgb(0.4, 0.4, 0.4) });
}

async function generarPdf(c: ContratoCatalogo, bloques: Bloque[]) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${c.folio} · ${c.titulo}`);
  pdf.setAuthor("Norte 19 · Dirección Jurídica");
  pdf.setProducer("Prototipo Contratos · documento de demostración");
  const f: Fuentes = { normal: await pdf.embedFont(StandardFonts.TimesRoman), negrita: await pdf.embedFont(StandardFonts.TimesRomanBold) };
  const { paginas, anclas } = maquetar(bloques, f);
  return { pdf, f, paginas, anclas };
}

// Escaneo: cada página se dibuja a doble resolución, se rasteriza con sips y se monta en un PDF de imágenes.
async function digitalizar(c: ContratoCatalogo, bloques: Bloque[]) {
  const tmp = join(DIR_PDF, `.tmp-${c.id}`);
  mkdirSync(tmp, { recursive: true });
  const { paginas } = await generarPdf(c, bloques);
  const escaneo = await PDFDocument.create();
  escaneo.setTitle(`${c.folio} · ${c.titulo} (digitalizado)`);
  for (let i = 0; i < paginas.length; i++) {
    const unaPagina = await PDFDocument.create();
    const f: Fuentes = { normal: await unaPagina.embedFont(StandardFonts.TimesRoman), negrita: await unaPagina.embedFont(StandardFonts.TimesRomanBold) };
    const page = unaPagina.addPage([ANCHO * 2, ALTO * 2]);
    page.drawRectangle({ x: 0, y: 0, width: ANCHO * 2, height: ALTO * 2, color: rgb(0.975, 0.97, 0.955) });
    dibujar(page, paginas[i], f, i + 1, paginas.length, c.folio, 2);
    const rutaPdf = join(tmp, `p${i + 1}.pdf`);
    const rutaJpg = join(tmp, `p${i + 1}.jpg`);
    writeFileSync(rutaPdf, await unaPagina.save());
    execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "70", rutaPdf, "--out", rutaJpg], { stdio: "ignore" });
    const imagen = await escaneo.embedJpg(readFileSync(rutaJpg));
    const hoja = escaneo.addPage([ANCHO, ALTO]);
    hoja.drawRectangle({ x: 0, y: 0, width: ANCHO, height: ALTO, color: rgb(0.93, 0.93, 0.92) });
    // Ligera inclinación y desplazamiento, como una hoja pasada por escáner.
    const giro = (i % 2 ? -1 : 1) * (0.25 + (i % 3) * 0.12);
    hoja.drawImage(imagen, { x: 6 + (i % 2) * 3, y: 4, width: ANCHO - 12, height: ALTO - 10, rotate: degrees(giro) });
  }
  writeFileSync(join(DIR_PDF, `${c.id}-digitalizado.pdf`), await escaneo.save());
  rmSync(tmp, { recursive: true, force: true });
}

async function main() {
  mkdirSync(DIR_PDF, { recursive: true });
  mkdirSync(DIR_TEXTOS, { recursive: true });
  mkdirSync(DIR_EXTRACCIONES, { recursive: true });
  const textos: Record<string, string[]> = {};

  for (const c of CONTRATOS_CATALOGO) {
    const { bloques, campos } = redactar(c);
    const { pdf, f, paginas, anclas } = await generarPdf(c, bloques);
    paginas.forEach((p, i) => dibujar(pdf.addPage([ANCHO, ALTO]), p, f, i + 1, paginas.length, c.folio));
    writeFileSync(join(DIR_PDF, `${c.id}.pdf`), await pdf.save());

    const porPagina = paginas.map((p) => p.lineas.map(textoLinea).join("\n"));
    textos[c.id] = porPagina;
    writeFileSync(join(DIR_TEXTOS, `${c.id}.txt`), porPagina.join("\n\f\n"));

    const extraccion = {
      contratoId: c.id,
      pipeline: "Extracción documental v0.3 · revisada por el equipo legal",
      paginas: paginas.length,
      campos: campos.map((campo: CampoRedactado) => ({
        clave: campo.clave,
        etiqueta: campo.etiqueta,
        valor: campo.valor,
        confianza: campo.confianza,
        confirmado: campo.confirmado,
        pagina: campo.ancla ? (anclas[campo.ancla] ?? null) : null,
        clausula: campo.clausula,
      })),
    };
    const sinPagina = extraccion.campos.filter((x) => x.clausula && x.pagina === null).map((x) => x.clave);
    if (sinPagina.length) throw new Error(`${c.id}: anclas sin página: ${sinPagina.join(", ")}`);
    writeFileSync(join(DIR_EXTRACCIONES, `${c.id}.json`), JSON.stringify(extraccion, null, 2) + "\n");

    if (c.ocr) await digitalizar(c, bloques);
    const palabrasTotales = porPagina.join(" ").split(/\s+/).length;
    console.log(`${c.id}: ${paginas.length} páginas, ${palabrasTotales} palabras${c.ocr ? " + digitalizado" : ""}`);
  }
  writeFileSync(join(DIR_TEXTOS, "textos.json"), JSON.stringify(textos) + "\n");
  await modelos();
  await expediente();
}

// Modelo institucional por tipo: misma redacción con la contraparte como marcador.
async function modelos() {
  const dir = join(DIR_PDF, "modelos");
  mkdirSync(dir, { recursive: true });
  const tipos = [...new Set(CONTRATOS_CATALOGO.map((c) => c.tipo))];
  for (const tipo of tipos) {
    const base = CONTRATOS_CATALOGO.find((c) => c.tipo === tipo)!;
    const modelo: ContratoCatalogo = {
      ...base,
      folio: "MODELO INSTITUCIONAL",
      contraparte: "La contraparte señalada en la solicitud",
      contraparteRfc: "[RFC de la contraparte]",
      contraparteRepresentante: "[Representante legal]",
      contraparteDomicilio: "[Domicilio fiscal de la contraparte]",
      inmueble: base.inmueble ? "[Inmueble descrito en la solicitud]" : undefined,
      fiador: undefined,
    };
    const { bloques } = redactar(modelo);
    const { pdf, f, paginas } = await generarPdf(modelo, bloques);
    pdf.setTitle(`Modelo institucional · ${tipo}`);
    paginas.forEach((p, i) => dibujar(pdf.addPage([ANCHO, ALTO]), p, f, i + 1, paginas.length, modelo.folio));
    writeFileSync(join(dir, `${tipo}.pdf`), await pdf.save());
    console.log(`modelos/${tipo}: ${paginas.length} páginas`);
  }
}

// Expediente de ejemplo: una página por tipo de documento, claramente marcada como muestra.
async function expediente() {
  const dir = join(DIR_PDF, "expediente");
  mkdirSync(dir, { recursive: true });
  for (const [clave, etiqueta] of Object.entries(DOCUMENTOS_EJEMPLO)) {
    const pdf = await PDFDocument.create();
    pdf.setTitle(`${etiqueta} (ejemplo)`);
    const page = pdf.addPage([ANCHO, ALTO]);
    const normal = await pdf.embedFont(StandardFonts.Helvetica);
    const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
    const gris = rgb(0.4, 0.4, 0.4);
    page.drawRectangle({ x: 50, y: 50, width: ANCHO - 100, height: ALTO - 100, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    page.drawText(etiqueta.toUpperCase(), { x: 80, y: ALTO - 120, size: 18, font: negrita });
    page.drawText("Documento de ejemplo para el prototipo de Contratos · Norte 19", { x: 80, y: ALTO - 145, size: 10, font: normal, color: gris });
    const lineas = [
      ["Titular", "Inmobiliaria de ejemplo, S.A. de C.V."],
      ["RFC", "IEJ010101AB1"],
      ["Folio", `${clave.toUpperCase().slice(0, 6)}-2026-0042`],
      ["Fecha de expedición", "15 de agosto de 2026"],
      ["Estatus", "Vigente"],
    ];
    lineas.forEach(([k, v], i) => {
      page.drawText(k, { x: 80, y: ALTO - 210 - i * 26, size: 11, font: negrita });
      page.drawText(v, { x: 240, y: ALTO - 210 - i * 26, size: 11, font: normal });
    });
    page.drawText("Este documento no tiene validez oficial. Se usa solo para demostrar la carga del expediente.", { x: 80, y: 90, size: 9, font: normal, color: gris });
    writeFileSync(join(dir, `${clave}.pdf`), await pdf.save());
  }
  console.log(`expediente: ${Object.keys(DOCUMENTOS_EJEMPLO).length} documentos`);
}

await main();
