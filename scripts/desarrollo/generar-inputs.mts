// Genera los inputs de ejemplo del proyecto Juárez en public/fixtures/desarrollo/:
// - inputs/*.pdf: anteproyecto (3 láminas con plantas esquemáticas), uso de suelo, mecánica de suelos,
//   topografía, brand standards, programa, reglamento, estudio de mercado y CAPEX objetivo
// - terreno.kmz: poligonal del predio (KML comprimido) con las mismas coordenadas que usa el tablero
// - paquete/*.pdf: los 60 archivos del paquete ejecutivo de ejemplo (una lámina con cajetín cada uno)
// - biblioteca/<id>.pdf: una lámina por elemento de la biblioteca de soluciones
// Uso: pnpm gen:desarrollo-inputs (requiere `zip`, incluido en macOS)
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { CAPEX_OBJETIVO_USD_POR_LLAVE, cuadroAnteproyecto, LLAVES_JUAREZ, NIVELES_JUAREZ } from "../../lib/fixtures/desarrollo/anteproyecto.ts";
import { BIBLIOTECA } from "../../lib/fixtures/desarrollo/biblioteca.ts";
import { CORPUS } from "../../lib/fixtures/desarrollo/corpus/index.ts";
import { archivoPaquete, PAQUETE_EJEMPLO } from "../../lib/fixtures/desarrollo/paquete.ts";
import { aGeografica, ESTACIONAMIENTO_M, HUELLA_EDIFICIO_M, POLIGONAL_M, SUPERFICIE_TERRENO_M2 } from "../../lib/fixtures/desarrollo/terreno.ts";

const RAIZ = join(import.meta.dirname, "..", "..", "public", "fixtures", "desarrollo");
const DIR_INPUTS = join(RAIZ, "inputs");
const NEGRO = rgb(0, 0, 0);
const GRIS = rgb(0.45, 0.45, 0.45);
const CLARO = rgb(0.85, 0.85, 0.85);
const n = (v: number, dec = 0) => v.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const PROYECTO = "CITY EXPRESS CIUDAD JUÁREZ";

type Fuentes = { r: PDFFont; b: PDFFont };

async function nuevo(titulo: string) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(titulo);
  pdf.setAuthor("Norte 19 · Dirección de Desarrollo (ejemplo)");
  return { pdf, f: { r: await pdf.embedFont(StandardFonts.Helvetica), b: await pdf.embedFont(StandardFonts.HelveticaBold) } };
}

// Parte un texto en líneas que caben en `ancho`.
function lineas(texto: string, font: PDFFont, size: number, ancho: number) {
  const out: string[] = [];
  for (const parrafo of texto.split("\n")) {
    let linea = "";
    for (const palabra of parrafo.split(" ")) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (font.widthOfTextAtSize(prueba, size) > ancho && linea) {
        out.push(linea);
        linea = palabra;
      } else linea = prueba;
    }
    out.push(linea);
  }
  return out;
}

type Seccion = { titulo?: string; texto: string };

// Documento de texto carta; `paginas` fija el contenido de cada página (las fuentes citan páginas concretas).
async function documentoTexto(archivo: string, titulo: string, subtitulo: string, paginas: Seccion[][]) {
  const { pdf, f } = await nuevo(titulo);
  paginas.forEach((secciones, i) => {
    const page = pdf.addPage([612, 792]);
    let y = 740;
    page.drawText(titulo, { x: 56, y, size: i === 0 ? 16 : 10, font: f.b });
    y -= i === 0 ? 20 : 14;
    page.drawText(subtitulo, { x: 56, y, size: 9, font: f.r, color: GRIS });
    y -= 30;
    for (const s of secciones) {
      if (s.titulo) {
        page.drawText(s.titulo, { x: 56, y, size: 11, font: f.b });
        y -= 16;
      }
      for (const l of lineas(s.texto, f.r, 10, 500)) {
        page.drawText(l, { x: 56, y, size: 10, font: f.r });
        y -= 14;
      }
      y -= 10;
    }
    page.drawText(`Documento de ejemplo para el prototipo · Página ${i + 1} de ${paginas.length}`, { x: 56, y: 36, size: 8, font: f.r, color: GRIS });
  });
  writeFileSync(join(DIR_INPUTS, archivo), await pdf.save());
}

// --- Anteproyecto: 3 láminas tabloide horizontal ---------------------------------------------------------

function cajetin(page: PDFPage, f: Fuentes, clave: string, titulo: string, escala: string) {
  const { width } = page.getSize();
  const x = width - 330;
  page.drawRectangle({ x, y: 24, width: 306, height: 86, borderColor: NEGRO, borderWidth: 1 });
  page.drawText(PROYECTO, { x: x + 10, y: 92, size: 10, font: f.b });
  page.drawText("Anteproyecto arquitectónico · Ejemplo", { x: x + 10, y: 78, size: 8, font: f.r, color: GRIS });
  page.drawText(titulo, { x: x + 10, y: 60, size: 9, font: f.b });
  page.drawText(`Escala ${escala}`, { x: x + 10, y: 44, size: 8, font: f.r });
  page.drawText(clave, { x: x + 240, y: 40, size: 20, font: f.b });
  page.drawText("Norte 19 · Dirección de Desarrollo", { x: x + 10, y: 30, size: 7, font: f.r, color: GRIS });
}

function poligono(page: PDFPage, pts: [number, number][], o: { x: number; y: number; s: number }, grosor = 1, color = NEGRO) {
  pts.forEach(([x1, y1], i) => {
    const [x2, y2] = pts[(i + 1) % pts.length];
    page.drawLine({ start: { x: o.x + x1 * o.s, y: o.y + y1 * o.s }, end: { x: o.x + x2 * o.s, y: o.y + y2 * o.s }, thickness: grosor, color });
  });
}

function laminaPlantaBaja(pdf: PDFDocument, f: Fuentes) {
  const page = pdf.addPage([1224, 792]);
  const o = { x: 70, y: 180, s: 7 };
  poligono(page, POLIGONAL_M, o, 1.5);
  poligono(page, HUELLA_EDIFICIO_M, o, 2);
  poligono(page, ESTACIONAMIENTO_M, o, 0.8, GRIS);
  // Cajones de 2.5 m en dos filas.
  for (let x = 8; x <= 88; x += 2.5) {
    page.drawLine({ start: { x: o.x + x * o.s, y: o.y + 6 * o.s }, end: { x: o.x + x * o.s, y: o.y + 11 * o.s }, thickness: 0.4, color: GRIS });
    page.drawLine({ start: { x: o.x + x * o.s, y: o.y + 21 * o.s }, end: { x: o.x + x * o.s, y: o.y + 26 * o.s }, thickness: 0.4, color: GRIS });
  }
  // Zonas de planta baja dentro de la huella.
  const zonas: [string, number, number, number][] = [
    ["LOBBY / RECEPCIÓN", 10, 30, 16],
    ["BUSINESS C.", 26, 30, 8],
    ["DESAYUNADOR (32 pax)", 34, 30, 14],
    ["COCINA", 48, 30, 6],
    ["BOH / LAVANDERÍA", 54, 30, 10],
    ["C. TÉC.", 64, 30, 6],
  ];
  for (const [nombre, x, y, w] of zonas) {
    page.drawRectangle({ x: o.x + x * o.s, y: o.y + y * o.s, width: w * o.s, height: 20 * o.s, borderColor: NEGRO, borderWidth: 0.6 });
    page.drawText(nombre, { x: o.x + (x + 0.6) * o.s, y: o.y + (y + 10) * o.s, size: 6.5, font: f.r });
  }
  page.drawText("ESTACIONAMIENTO DESCUBIERTO · 71 CAJONES", { x: o.x + 30 * o.s, y: o.y + 15.5 * o.s, size: 8, font: f.b, color: GRIS });
  page.drawText("BLVD. TOMÁS FERNÁNDEZ", { x: o.x + 35 * o.s, y: o.y - 18, size: 9, font: f.b });
  page.drawText("N", { x: o.x + 100 * o.s, y: o.y + 58 * o.s, size: 14, font: f.b });
  page.drawLine({ start: { x: o.x + 100.4 * o.s, y: o.y + 50 * o.s }, end: { x: o.x + 100.4 * o.s, y: o.y + 56 * o.s }, thickness: 1.5 });
  page.drawText(`Terreno: ${n(SUPERFICIE_TERRENO_M2)} m²`, { x: 70, y: 140, size: 9, font: f.r });

  // Cuadro de áreas.
  const cuadro = cuadroAnteproyecto();
  const construidos = cuadro.filter((z) => z.zona !== "estacionamiento").reduce((t, z) => t + z.m2, 0);
  const nombres = { habitaciones: "Habitaciones", areas_publicas: "Áreas públicas", boh: "BOH", circulaciones: "Circulaciones", estacionamiento: "Estacionamiento (ext.)" } as const;
  let y = 690;
  const x = 860;
  page.drawText("CUADRO DE ÁREAS", { x, y, size: 11, font: f.b });
  y -= 20;
  page.drawText("Zona", { x, y, size: 8, font: f.b });
  page.drawText("m²", { x: x + 150, y, size: 8, font: f.b });
  page.drawText("m²/llave", { x: x + 210, y, size: 8, font: f.b });
  y -= 4;
  page.drawLine({ start: { x, y }, end: { x: x + 300, y }, thickness: 0.6 });
  for (const z of cuadro) {
    y -= 15;
    page.drawText(nombres[z.zona], { x, y, size: 8.5, font: f.r });
    page.drawText(n(z.m2), { x: x + 150, y, size: 8.5, font: f.r });
    page.drawText(n(z.m2 / LLAVES_JUAREZ, 1), { x: x + 210, y, size: 8.5, font: f.r });
  }
  y -= 8;
  page.drawLine({ start: { x, y }, end: { x: x + 300, y }, thickness: 0.6 });
  y -= 15;
  page.drawText("Total construido", { x, y, size: 8.5, font: f.b });
  page.drawText(n(construidos), { x: x + 150, y, size: 8.5, font: f.b });
  page.drawText(n(construidos / LLAVES_JUAREZ, 1), { x: x + 210, y, size: 8.5, font: f.b });
  y -= 30;
  for (const l of [`${LLAVES_JUAREZ} llaves en ${NIVELES_JUAREZ} niveles (PB + 4)`, "Iluminación LED y tarjetero en habitaciones.", "Control de acceso con tarjeta en elevadores y servicio.", "Mecánica de suelos: pendiente."]) {
    page.drawText(l, { x, y, size: 8, font: f.r });
    y -= 12;
  }
  cajetin(page, f, "A-01", "Planta baja y cuadro de áreas", "1:250");
}

function laminaPlantaTipo(pdf: PDFDocument, f: Fuentes) {
  const page = pdf.addPage([1224, 792]);
  const o = { x: 80, y: 300, s: 12 };
  poligono(page, [[0, 0], [60, 0], [60, 20], [0, 20]], o, 2);
  // Pasillo de doble carga de 1.60 m al centro.
  page.drawLine({ start: { x: o.x, y: o.y + 9.2 * o.s }, end: { x: o.x + 60 * o.s, y: o.y + 9.2 * o.s }, thickness: 0.8 });
  page.drawLine({ start: { x: o.x, y: o.y + 10.8 * o.s }, end: { x: o.x + 60 * o.s, y: o.y + 10.8 * o.s }, thickness: 0.8 });
  // 16 módulos de 3.6 m por lado, con núcleo central.
  for (let i = 0; i <= 16; i++) {
    const x = o.x + (1.2 + i * 3.6) * o.s;
    page.drawLine({ start: { x, y: o.y }, end: { x, y: o.y + 9.2 * o.s }, thickness: 0.5 });
    page.drawLine({ start: { x, y: o.y + 10.8 * o.s }, end: { x, y: o.y + 20 * o.s }, thickness: 0.5 });
  }
  page.drawRectangle({ x: o.x + 27 * o.s, y: o.y + 10.8 * o.s, width: 6 * o.s, height: 9.2 * o.s, color: CLARO, borderColor: NEGRO, borderWidth: 0.8 });
  page.drawText("NÚCLEO: 2 ELEV. + BLANCOS", { x: o.x + 27.2 * o.s, y: o.y + 15 * o.s, size: 6.5, font: f.b });
  page.drawText("PASILLO 1.60 m", { x: o.x + 40 * o.s, y: o.y + 9.6 * o.s, size: 7, font: f.b });
  page.drawText("HAB. TIPO 26.4 m²", { x: o.x + 5 * o.s, y: o.y + 4 * o.s, size: 7, font: f.r });
  page.drawText("HAB. ACCESIBLE", { x: o.x + 1.5 * o.s, y: o.y + 15 * o.s, size: 6.5, font: f.b });
  page.drawText("HAB. ACCESIBLE", { x: o.x + 55 * o.s, y: o.y + 15 * o.s, size: 6.5, font: f.b });
  page.drawText("ESCALERA", { x: o.x - 50, y: o.y + 10 * o.s, size: 7, font: f.r });
  page.drawText("ESCALERA", { x: o.x + 60 * o.s + 6, y: o.y + 10 * o.s, size: 7, font: f.r });
  const notas = [
    "PLANTA TIPO · NIVELES 2 A 5",
    `32 habitaciones por nivel · ${LLAVES_JUAREZ} llaves en total`,
    "Habitación tipo de 26.4 m² con baño, escritorio con contactos y USB,",
    "cortinas black-out y regadera con mezcladora termostática.",
    "2 habitaciones accesibles en el proyecto.",
    "Muro divisorio entre habitaciones: por definir.",
  ];
  let y = 220;
  for (const l of notas) {
    page.drawText(l, { x: 80, y, size: 9, font: l === notas[0] ? f.b : f.r });
    y -= 13;
  }
  cajetin(page, f, "A-02", "Planta tipo de habitaciones", "1:150");
}

function laminaFachada(pdf: PDFDocument, f: Fuentes) {
  const page = pdf.addPage([1224, 792]);
  const o = { x: 80, y: 220, s: 11 };
  const ancho = 60;
  const alto = 3.2 * NIVELES_JUAREZ + 1.2;
  poligono(page, [[0, 0], [ancho, 0], [ancho, alto], [0, alto]], o, 2);
  for (let nivel = 1; nivel < NIVELES_JUAREZ; nivel++) {
    const y = o.y + (3.6 + (nivel - 1) * 3.2) * o.s;
    for (let i = 0; i < 16; i++) page.drawRectangle({ x: o.x + (1.8 + i * 3.6) * o.s, y: y + 0.8 * o.s, width: 2.2 * o.s, height: 1.5 * o.s, borderColor: NEGRO, borderWidth: 0.5 });
  }
  page.drawRectangle({ x: o.x + 22 * o.s, y: o.y, width: 16 * o.s, height: 3.2 * o.s, borderColor: NEGRO, borderWidth: 1.2 });
  page.drawText("PÓRTICO DE ACCESO", { x: o.x + 25 * o.s, y: o.y + 1.4 * o.s, size: 7, font: f.b });
  page.drawText("ANUNCIO DE MARCA EN AZOTEA", { x: o.x + 20 * o.s, y: o.y + (alto + 0.6) * o.s, size: 8, font: f.b });
  page.drawText("FACHADA NORTE (PRINCIPAL)", { x: 80, y: 180, size: 10, font: f.b });
  page.drawText("Envolvente y ventanería: por definir en la Fase de Definición.", { x: 80, y: 164, size: 9, font: f.r });
  cajetin(page, f, "A-03", "Fachada principal", "1:200");
}

async function anteproyecto() {
  const { pdf, f } = await nuevo("Anteproyecto arquitectónico · City Express Ciudad Juárez");
  laminaPlantaBaja(pdf, f);
  laminaPlantaTipo(pdf, f);
  laminaFachada(pdf, f);
  writeFileSync(join(DIR_INPUTS, "anteproyecto-juarez.pdf"), await pdf.save());
}

// Documentos con muchas páginas donde solo algunas tienen el contenido que citan las fuentes.
function paginasCon(total: number, contenido: Record<number, Seccion[]>, relleno: (p: number) => Seccion[]) {
  return Array.from({ length: total }, (_, i) => contenido[i + 1] ?? relleno(i + 1));
}

async function main() {
  rmSync(RAIZ, { recursive: true, force: true });
  mkdirSync(DIR_INPUTS, { recursive: true });

  await anteproyecto();

  await documentoTexto("mecanica-suelos-juarez.pdf", "Estudio de mecánica de suelos", `${PROYECTO} · Blvd. Tomás Fernández 7815, Ciudad Juárez, Chih.`, [
    [
      { titulo: "1. Exploración", texto: "Tres sondeos de penetración estándar (SPT) a 12 m de profundidad y dos pozos a cielo abierto a 3 m. Pruebas de laboratorio: granulometría, límites de consistencia, contenido de humedad y compresión simple." },
      { titulo: "2. Estratigrafía", texto: "0.00 a 0.40 m: capa vegetal y relleno. 0.40 a 6.50 m: arena limosa café claro, medianamente compacta (N = 22 a 35 golpes). 6.50 a 12.00 m: arena bien graduada con gravas, compacta (N > 40). En la esquina noreste se detectó un relleno no controlado de hasta 1.5 m de espesor." },
      { titulo: "3. Nivel freático", texto: "Se detectó a 6.0 m de profundidad en los tres sondeos (medición de agosto de 2026)." },
      { titulo: "4. Capacidad de carga", texto: "Capacidad de carga admisible de 18 t/m² para cimentaciones superficiales desplantadas a 1.8 m, con un factor de seguridad de 3. Asentamientos estimados menores a 2.5 cm." },
      { titulo: "5. Recomendaciones", texto: "Cimentación a base de zapatas corridas de concreto armado desplantadas a 1.8 m sobre la arena limosa. Retirar el relleno no controlado bajo la huella del edificio y sustituirlo con material compactado al 95% Proctor. La excavación de cisterna y cuarto de bombas alcanzará el nivel freático: prever abatimiento con bombeo. Zona sísmica B según el Manual de CFE." },
    ],
  ]);

  await documentoTexto("uso-de-suelo-juarez.pdf", "Constancia de zonificación y uso de suelo", "Dirección General de Desarrollo Urbano · Municipio de Juárez (ejemplo)", [
    [
      { titulo: "Predio", texto: `Blvd. Tomás Fernández 7815, Ciudad Juárez, Chih. Superficie: ${n(SUPERFICIE_TERRENO_M2)} m².` },
      { titulo: "Uso permitido", texto: "Comercio y servicios de alta intensidad: hotel permitido." },
      { titulo: "Normas de ocupación", texto: "COS 0.60 · CUS 2.40 · Altura máxima 25 m · Restricción frontal de 5 m sobre el boulevard." },
      { titulo: "Estacionamiento", texto: "1 cajón por cada 2 habitaciones más 1 por cada 40 m² de áreas públicas." },
      { titulo: "Factibilidades", texto: "Agua potable con suministro intermitente en la zona: se recomienda cisterna para dos días de consumo. Energía eléctrica sujeta a factibilidad de CFE para cargas mayores a 300 kVA." },
    ],
  ]);

  const vertices = POLIGONAL_M.map((p, i) => {
    const g = aGeografica(p);
    return `V${i + 1}: x ${n(p[0], 2)} m, y ${n(p[1], 2)} m · ${g.lat.toFixed(6)}, ${g.lng.toFixed(6)}`;
  }).join("\n");
  await documentoTexto("topografia-juarez.pdf", "Levantamiento topográfico", `${PROYECTO} · Poligonal y curvas de nivel`, [
    [
      { titulo: "Cuadro de construcción", texto: vertices },
      { titulo: "Superficie", texto: `${n(SUPERFICIE_TERRENO_M2, 2)} m² según poligonal.` },
      { titulo: "Entorno", texto: "Predio sin construcciones, con frente al Blvd. Tomás Fernández. Zona expuesta a tolvaneras de primavera por los lotes baldíos al norte y al oriente." },
    ],
    [
      { titulo: "Curvas de nivel", texto: "Desnivel máximo de 1.20 m, con pendiente descendente del suroeste al noreste." },
      { titulo: "Observaciones", texto: "Relleno no controlado de aproximadamente 1.5 m en la esquina noreste (antiguo depósito de material). Servicios existentes: agua potable, drenaje sanitario y línea de media tensión sobre el boulevard." },
    ],
  ]);

  const REQUISITOS: Record<number, Seccion[]> = {
    12: [{ titulo: "Habitación tipo", texto: "Superficie de 24 a 28 m² incluido el baño. Cama king o dos matrimoniales." }],
    14: [{ titulo: "Mueble de trabajo", texto: "Escritorio con contactos y puertos USB al alcance." }],
    15: [{ titulo: "Acústica", texto: "Muros entre habitaciones con STC mínimo de 50." }],
    16: [{ titulo: "Oscurecimiento", texto: "Cortinas black-out en todas las habitaciones." }],
    18: [{ titulo: "Baño", texto: "Regadera con mezcladora termostática y cancel de cristal templado." }],
    22: [{ titulo: "Accesibilidad", texto: "3% de las habitaciones accesibles, con un mínimo de 2." }],
    26: [{ titulo: "Lobby", texto: "Recepción visible desde el acceso y área de estar." }],
    27: [{ titulo: "Business center", texto: "Integrado al lobby, con estaciones de trabajo e impresión." }],
    30: [{ titulo: "Desayunador", texto: "Capacidad para el 35% de la ocupación, considerando 1.4 huéspedes por llave." }],
    31: [{ titulo: "Cocina de desayunos", texto: "Con acceso de servicio independiente del lobby." }],
    34: [{ titulo: "Gimnasio", texto: "Superficie mínima de 30 m² con vista al exterior." }],
    38: [{ titulo: "Estacionamiento", texto: "0.45 cajones por llave o lo que exija la norma local, lo que sea mayor." }],
    42: [{ titulo: "Señalética", texto: "Anuncio de marca en fachada principal y pórtico de acceso." }],
    46: [{ titulo: "Circulaciones", texto: "Pasillos de habitaciones con 1.80 m libres." }],
    50: [{ titulo: "Sustentabilidad", texto: "Iluminación LED y tarjetero ahorrador en habitaciones." }],
    54: [{ titulo: "Seguridad", texto: "Control de acceso con tarjeta en elevadores y accesos de servicio." }],
  };
  await documentoTexto(
    "brand-standards-city-express.pdf",
    "Brand standards City Express 2024",
    "Manual de estándares de marca · extracto de ejemplo",
    paginasCon(56, REQUISITOS, (p) => [{ texto: `Sección ${Math.ceil(p / 4)} · Contenido del manual no relevante para la validación del proyecto.` }]),
  );

  await documentoTexto("programa-juarez.pdf", "Programa de necesidades", PROYECTO, [
    [
      { titulo: "Habitaciones", texto: `${LLAVES_JUAREZ} llaves: 60% king, 38% doble, 2% accesibles (mínimo del manual).` },
      { titulo: "Áreas públicas", texto: "Lobby, business center, desayunador, gimnasio y sanitarios públicos." },
      { titulo: "Servicio", texto: "Lavandería de blancos, almacén de blancos por nivel, cocina de desayunos, comedor y vestidores de personal." },
    ],
  ]);

  await documentoTexto(
    "reglamento-juarez.pdf",
    "Reglamento de Construcción del Municipio de Juárez",
    "Extracto de ejemplo",
    paginasCon(20, { 18: [{ titulo: "Artículo 212 · Condiciones climáticas", texto: "Las instalaciones expuestas deberán protegerse contra congelamiento; temperatura mínima de diseño de -5 °C y máxima de 42 °C." }] }, (p) => [{ texto: `Capítulo ${p} · Disposiciones generales.` }]),
  );

  await documentoTexto("estudio-mercado-juarez.pdf", "Estudio de mercado", PROYECTO, [
    [
      { titulo: "Demanda", texto: "Viajero de negocios vinculado a la industria maquiladora: 72% de la demanda entre semana." },
      { titulo: "Proyección", texto: "Ocupación estabilizada de 68% al tercer año, con tarifa promedio de MXN 1,450." },
    ],
  ]);

  await documentoTexto("capex-objetivo-juarez.pdf", "CAPEX objetivo aprobado", `${PROYECTO} · Comité de inversión`, [
    [
      { titulo: "Objetivo", texto: `USD ${n(CAPEX_OBJETIVO_USD_POR_LLAVE)} por llave (USD ${n(CAPEX_OBJETIVO_USD_POR_LLAVE * LLAVES_JUAREZ)} en total), sin terreno.` },
      { titulo: "Alcance", texto: "Incluye obra civil, instalaciones, acabados, FF&E, indirectos, proyecto y licencias. Tipo de cambio de referencia: 18.50 MXN por USD." },
    ],
  ]);

  // KMZ: KML con la poligonal y la huella, comprimido con zip.
  const coords = (pts: [number, number][]) => [...pts, pts[0]].map((p) => { const g = aGeografica(p); return `${g.lng.toFixed(7)},${g.lat.toFixed(7)},0`; }).join(" ");
  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${PROYECTO} · Terreno</name>
<Placemark><name>Poligonal del predio (${n(SUPERFICIE_TERRENO_M2)} m²)</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${coords(POLIGONAL_M)}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>
<Placemark><name>Huella del edificio (anteproyecto)</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${coords(HUELLA_EDIFICIO_M)}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>
</Document></kml>
`;
  const tmp = join(RAIZ, "doc.kml");
  writeFileSync(tmp, kml);
  execFileSync("zip", ["-X", "-q", "-j", join(RAIZ, "terreno.kmz"), tmp]);
  rmSync(tmp);

  await paquete();
  await biblioteca();

  console.log(`Inputs, paquete (${PAQUETE_EJEMPLO.length}) y biblioteca (${BIBLIOTECA.length}) generados en ${RAIZ}`);
}

// --- Paquete ejecutivo: una lámina por archivo; los no identificables parecen escaneos sin clave. -----------
async function paquete() {
  const dir = join(RAIZ, "paquete");
  mkdirSync(dir, { recursive: true });
  for (const nombre of PAQUETE_EJEMPLO) {
    const { pdf, f } = await nuevo(nombre);
    const clave = nombre.split(" ")[0];
    const titulo = nombre.slice(clave.length + 1);
    if (!/^([0-9]{3}-[A-Z]+-|[A-Z]+-)/.test(clave)) {
      const page = pdf.addPage([612, 792]);
      page.drawRectangle({ x: 60, y: 120, width: 492, height: 560, borderColor: GRIS, borderWidth: 0.5 });
      page.drawText("Documento escaneado sin clave de plano", { x: 90, y: 640, size: 12, font: f.b, color: GRIS });
      page.drawText(nombre, { x: 90, y: 620, size: 9, font: f.r, color: GRIS });
    } else {
      const page = pdf.addPage([1224, 792]);
      for (let x = 80; x <= 860; x += 60) page.drawLine({ start: { x, y: 150 }, end: { x, y: 720 }, thickness: 0.3, color: CLARO });
      for (let y = 150; y <= 720; y += 60) page.drawLine({ start: { x: 80, y }, end: { x: 860, y }, thickness: 0.3, color: CLARO });
      page.drawText(titulo.toUpperCase(), { x: 90, y: 690, size: 14, font: f.b });
      page.drawText("Lámina de ejemplo del paquete ejecutivo: el contenido del plano no forma parte del prototipo.", { x: 90, y: 670, size: 9, font: f.r, color: GRIS });
      cajetin(page, f, clave, titulo, "Indicada");
    }
    writeFileSync(join(dir, archivoPaquete(nombre)), await pdf.save());
  }
}

// --- Biblioteca de soluciones: lámina con esquema según el tipo y el contenido del elemento. ---------------
async function biblioteca() {
  const dir = join(RAIZ, "biblioteca");
  mkdirSync(dir, { recursive: true });
  const TIPO = { detalle: "DETALLE CONSTRUCTIVO", acabado: "FICHA DE ACABADO", ffe: "LISTA DE FF&E", especificacion: "ESPECIFICACIÓN" } as const;
  for (const b of BIBLIOTECA) {
    const hotel = CORPUS.find((h) => h.id === b.hotelId)!;
    const { pdf, f } = await nuevo(`${b.titulo} · ${hotel.nombre}`);
    const page = pdf.addPage([792, 612]);
    page.drawText(TIPO[b.tipo], { x: 48, y: 560, size: 9, font: f.b, color: GRIS });
    page.drawText(b.titulo, { x: 48, y: 540, size: 16, font: f.b });
    page.drawText(`${hotel.nombre} · ${b.clave} · ${b.area}`, { x: 48, y: 522, size: 9, font: f.r, color: GRIS });
    // Esquema: capas de un corte (detalle), muestra con trama (acabado) o tabla (FF&E y especificación).
    const x0 = 48;
    const y0 = 150;
    if (b.tipo === "detalle") {
      const capas = [40, 16, 70, 12, 24];
      let y = y0;
      capas.forEach((alto, i) => {
        page.drawRectangle({ x: x0, y, width: 300, height: alto, borderColor: NEGRO, borderWidth: 0.8, color: i % 2 ? CLARO : undefined });
        y += alto;
      });
      page.drawLine({ start: { x: x0 + 300, y: y0 + 60 }, end: { x: x0 + 340, y: y0 + 90 }, thickness: 0.5 });
      page.drawText("Corte esquemático", { x: x0, y: y0 - 16, size: 8, font: f.r, color: GRIS });
    } else if (b.tipo === "acabado") {
      page.drawRectangle({ x: x0, y: y0, width: 300, height: 300, borderColor: NEGRO, borderWidth: 0.8 });
      for (let i = 0; i <= 300; i += 30) page.drawLine({ start: { x: x0 + i, y: y0 }, end: { x: x0 + i, y: y0 + 300 }, thickness: 0.3, color: GRIS });
      page.drawText("Muestra y modulación", { x: x0, y: y0 - 16, size: 8, font: f.r, color: GRIS });
    } else {
      page.drawRectangle({ x: x0, y: y0, width: 300, height: 300, borderColor: NEGRO, borderWidth: 0.8 });
      for (let i = 1; i < 10; i++) page.drawLine({ start: { x: x0, y: y0 + i * 30 }, end: { x: x0 + 300, y: y0 + i * 30 }, thickness: 0.3, color: GRIS });
      page.drawText(b.tipo === "ffe" ? "Cuadro de mobiliario y equipo" : "Hoja de datos", { x: x0, y: y0 - 16, size: 8, font: f.r, color: GRIS });
    }
    let y = 460;
    for (const l of lineas(b.descripcion, f.r, 10, 330)) {
      page.drawText(l, { x: 400, y, size: 10, font: f.r });
      y -= 14;
    }
    y -= 10;
    for (const punto of b.puntos) {
      for (const [i, l] of lineas(punto, f.r, 9.5, 320).entries()) {
        page.drawText(i === 0 ? `- ${l}` : `  ${l}`, { x: 400, y, size: 9.5, font: f.r });
        y -= 13;
      }
      y -= 3;
    }
    page.drawText(`Biblioteca de soluciones del corpus · ${b.id} · ejemplo`, { x: 48, y: 36, size: 8, font: f.r, color: GRIS });
    writeFileSync(join(dir, `${b.id}.pdf`), await pdf.save());
  }
}

await main();
