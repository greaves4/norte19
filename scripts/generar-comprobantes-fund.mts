// Genera los comprobantes estáticos de Fund en public/fixtures/fund/. Se corre a mano y el resultado se versiona:
//   pnpm gen:fund
// - ejemplos/<id>.pdf y .jpg: comprobante de cada uno de los 5 CFDI de ejemplo (sin fecha, para no desfasarse).
// - comprobantes/<slug>.xml, .pdf y .jpg: comprobante representativo por proveedor (descarga desde el grid).
// Corre con Node directamente (type stripping), por eso importa con extensión .ts y los módulos no usan alias "@/".
// Las imágenes JPG se obtienen convirtiendo un PDF con `sips` (macOS).
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { CFDI_EJEMPLOS, RECEPTOR_CANCUN, type ConceptoEjemplo } from "../lib/fixtures/fund/cfdiEjemplos.ts";
import { PROVEEDORES, PROVEEDORES_BLOQUEADOS } from "../lib/fixtures/fund/proveedores.ts";
import { calcularTotales, construirCfdiXml, uuidDesdeTexto } from "../lib/sim/fund/cfdiXml.ts";

const RAIZ = join(import.meta.dirname, "..", "public", "fixtures", "fund");
const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const NEGRO = rgb(0, 0, 0);
const GRIS = rgb(0.4, 0.4, 0.4);

type Comprobante = {
  archivo: string; // ruta sin extensión
  emisor: { rfc: string; nombre: string };
  folio: string;
  uuid: string;
  conceptos: ConceptoEjemplo[];
};

async function facturaPdf(c: Comprobante) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Comprobante ${c.emisor.nombre}`);
  const page = pdf.addPage([612, 792]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { partidas, subtotal, iva, total } = calcularTotales(c.conceptos);

  let y = 730;
  const linea = (texto: string, x: number, size: number, font: PDFFont = regular, color = NEGRO) =>
    page.drawText(texto, { x, y, size, font, color });

  linea(c.emisor.nombre, 50, 18, negrita);
  y -= 20;
  linea(`RFC ${c.emisor.rfc} · Régimen 601 General de Ley Personas Morales`, 50, 10, regular, GRIS);
  y -= 14;
  linea("Representación impresa de un CFDI 4.0 · Documento de demostración", 50, 9, regular, GRIS);
  y -= 34;
  linea("Receptor", 50, 9, negrita, GRIS);
  linea("Folio fiscal (UUID)", 330, 9, negrita, GRIS);
  y -= 14;
  linea(`${RECEPTOR_CANCUN.nombre} · ${RECEPTOR_CANCUN.rfc}`, 50, 10);
  linea(c.uuid, 330, 9);
  y -= 14;
  linea(`Uso CFDI ${RECEPTOR_CANCUN.usoCfdi} · CP ${RECEPTOR_CANCUN.domicilioFiscal}`, 50, 10);
  linea(`Folio ${c.folio} · Pago con tarjeta (04) · PUE`, 330, 9);
  y -= 36;

  const columnas = [50, 330, 390, 440, 520];
  ["Descripción", "Clave SAT", "Cant.", "P. unitario", "Importe"].forEach((t, i) => linea(t, columnas[i], 9, negrita));
  y -= 6;
  page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 0.5, color: GRIS });
  y -= 16;
  for (const p of partidas) {
    linea(recortar(p.descripcion, regular, 9, 270), columnas[0], 9);
    linea(p.claveProdServ, columnas[1], 9);
    linea(String(p.cantidad), columnas[2], 9);
    linea(mxn.format(p.valorUnitario), columnas[3], 9);
    derecha(page, mxn.format(p.importe), 562, y, 9, regular);
    y -= 18;
  }
  page.drawLine({ start: { x: 50, y: y + 8 }, end: { x: 562, y: y + 8 }, thickness: 0.5, color: GRIS });
  y -= 10;
  for (const [etiqueta, valor, font] of [
    ["Subtotal", subtotal, regular],
    ["IVA 16%", iva, regular],
    ["Total", total, negrita],
  ] as const) {
    derecha(page, etiqueta, 470, y, 10, font);
    derecha(page, mxn.format(valor), 562, y, 10, font);
    y -= 16;
  }
  y -= 30;
  linea("Este documento es una representación impresa ficticia generada para el prototipo de Fund.", 50, 8, regular, GRIS);

  writeFileSync(`${c.archivo}.pdf`, await pdf.save());
}

// Ticket de terminal: se dibuja grande en PDF y se convierte a JPG con sips.
async function ticketJpg(c: Comprobante) {
  const { partidas, subtotal, iva, total } = calcularTotales(c.conceptos);
  const lineas: [string, "c" | "l" | "r" | "lr", string?][] = [
    [c.emisor.nombre, "c"],
    [`RFC ${c.emisor.rfc}`, "c"],
    ["", "c"],
    [`FOLIO ${c.folio}`, "l"],
    ["--------------------------------", "c"],
    ...partidas.flatMap((p): [string, "lr", string][] => [[recortarTexto(p.descripcion.toUpperCase(), 22), "lr", mxn.format(p.importe)]]),
    ["--------------------------------", "c"],
    ["SUBTOTAL", "lr", mxn.format(subtotal)],
    ["IVA 16%", "lr", mxn.format(iva)],
    ["TOTAL", "lr", mxn.format(total)],
    ["", "c"],
    ["PAGO CON TARJETA CORPORATIVA", "c"],
    ["APROBADO", "c"],
    ["", "c"],
    ["FACTURA ELECTRONICA 4.0", "c"],
    [c.uuid.slice(0, 18), "c"],
    [c.uuid.slice(18), "c"],
    ["GRACIAS POR SU COMPRA", "c"],
  ];

  const escala = 2.6;
  const ancho = 226 * escala;
  const alto = (lineas.length * 14 + 50) * escala;
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([ancho, alto]);
  const mono = await pdf.embedFont(StandardFonts.Courier);
  const size = 9 * escala;
  let y = alto - 30 * escala;
  for (const [texto, alineacion, valor] of lineas) {
    const x0 = 14 * escala;
    const x1 = ancho - 14 * escala;
    if (alineacion === "c") page.drawText(texto, { x: (ancho - mono.widthOfTextAtSize(texto, size)) / 2, y, size, font: mono });
    else page.drawText(texto, { x: x0, y, size, font: mono });
    if (alineacion === "lr" && valor) derecha(page, valor, x1, y, size, mono);
    y -= 14 * escala;
  }
  const temporal = `${c.archivo}.ticket.pdf`;
  writeFileSync(temporal, await pdf.save());
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "82", temporal, "--out", `${c.archivo}.jpg`], { stdio: "ignore" });
  rmSync(temporal);
}

function derecha(page: PDFPage, texto: string, x: number, y: number, size: number, font: PDFFont) {
  page.drawText(texto, { x: x - font.widthOfTextAtSize(texto, size), y, size, font });
}

function recortar(texto: string, font: PDFFont, size: number, ancho: number) {
  let t = texto;
  while (font.widthOfTextAtSize(t, size) > ancho && t.length > 4) t = t.slice(0, -2);
  return t === texto ? t : `${t.trimEnd()}…`;
}

function recortarTexto(texto: string, max: number) {
  return texto.length > max ? texto.slice(0, max) : texto;
}

function nombreFiscal(razonSocial: string) {
  return razonSocial
    .replace(/,?\s*S\.? ?(A|de R\.L)\.?.*$/i, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

async function main() {
  const dirEjemplos = join(RAIZ, "ejemplos");
  const dirComprobantes = join(RAIZ, "comprobantes");
  mkdirSync(dirEjemplos, { recursive: true });
  mkdirSync(dirComprobantes, { recursive: true });

  for (const e of CFDI_EJEMPLOS) {
    const c: Comprobante = {
      archivo: join(dirEjemplos, e.id),
      emisor: e.emisor,
      folio: `${e.serie}-${e.folio}`,
      uuid: uuidDesdeTexto(`ejemplo-${e.id}`),
      conceptos: e.conceptos,
    };
    await facturaPdf(c);
    await ticketJpg(c);
    console.log(`ejemplos/${e.id}: ${mxn.format(calcularTotales(e.conceptos).total)}`);
  }

  for (const p of [...PROVEEDORES, ...PROVEEDORES_BLOQUEADOS]) {
    const conceptos: ConceptoEjemplo[] = p.conceptos.map((t) => {
      const servicio = /^(servicio|mantenimiento|traslado|consumo|env[ií]o|lavado|comisi[oó]n|boleto|carga)/i.test(t.descripcion);
      return {
        claveProdServ: t.claveProdServ,
        cantidad: 1,
        claveUnidad: servicio ? "E48" : "H87",
        unidad: servicio ? "Servicio" : "Pieza",
        descripcion: t.descripcion,
        valorUnitario: Math.round((t.min + t.max) / 2),
      };
    });
    const uuid = uuidDesdeTexto(`proveedor-${p.slug}`);
    const emisor = { rfc: p.rfc, nombre: nombreFiscal(p.nombre), regimenFiscal: "601" };
    const c: Comprobante = { archivo: join(dirComprobantes, p.slug), emisor, folio: `A-${uuid.slice(0, 4)}`, uuid, conceptos };
    writeFileSync(
      `${c.archivo}.xml`,
      construirCfdiXml({
        serie: "A",
        folio: uuid.slice(0, 4),
        fecha: "2026-09-01T12:00:00",
        lugarExpedicion: "77500",
        formaPago: "04",
        emisor,
        receptor: RECEPTOR_CANCUN,
        conceptos,
        uuid,
        fechaTimbrado: "2026-09-01T12:02:00",
      }),
    );
    await facturaPdf(c);
    await ticketJpg(c);
    console.log(`comprobantes/${p.slug}`);
  }
}

await main();
