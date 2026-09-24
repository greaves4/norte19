// Archivos de ejemplo para el registro de movimientos.
//
// Los XML de los 5 CFDI de ejemplo se generan en el navegador con la fecha del reloj de demo, no como
// archivos estáticos: la sesión exige fechas relativas (hoy, hoy−1, hoy−6) y un archivo fijo quedaría
// desfasado al día siguiente del deploy; una ruta API usaría la hora del servidor y no respetaría
// "+24 h" ni la aceleración de la DemoBar. Los PDF/JPG de comprobante sí son estáticos (no llevan fecha)
// y los genera scripts/generar-comprobantes-fund.mts en public/fixtures/fund/ejemplos/.
import { addMinutes, startOfDay, subDays } from "date-fns";
import type { UploadFixture, UploadValue } from "@/components/shared/UploadZone";
import { CFDI_EJEMPLOS, RECEPTOR_CANCUN, type CfdiEjemplo } from "@/lib/fixtures/fund/cfdiEjemplos";
import { construirCfdiXml, fechaCfdi, uuidDesdeTexto } from "@/lib/sim/fund/cfdiXml";

const PREFIJO_GENERADO = "generado:";

export function ejemploPorId(id: string): CfdiEjemplo | undefined {
  return CFDI_EJEMPLOS.find((e) => e.id === id);
}

export function crearXmlEjemplo(id: string, hoy: Date): string {
  const ejemplo = ejemploPorId(id);
  if (!ejemplo) throw new Error(`No existe el CFDI de ejemplo "${id}".`);

  const [h, m, s] = ejemplo.hora.split(":").map(Number);
  let emision = subDays(startOfDay(hoy), ejemplo.diasAtras);
  emision.setHours(h, m, s);
  // "Hoy" nunca puede quedar en el futuro respecto al reloj de demo.
  if (emision > hoy) emision = addMinutes(hoy, -20);
  const timbrado = addMinutes(emision, 2) > hoy ? hoy : addMinutes(emision, 2);

  return construirCfdiXml({
    serie: ejemplo.serie,
    folio: ejemplo.folio,
    fecha: fechaCfdi(emision),
    lugarExpedicion: ejemplo.lugarExpedicion,
    formaPago: "04",
    emisor: ejemplo.emisor,
    receptor: RECEPTOR_CANCUN,
    conceptos: ejemplo.conceptos,
    uuid: uuidDesdeTexto(`ejemplo-${ejemplo.id}`),
    fechaTimbrado: fechaCfdi(timbrado),
  });
}

// Opciones de "Usar archivo de ejemplo" para el XML de la factura.
export const FIXTURES_XML: UploadFixture[] = CFDI_EJEMPLOS.map((e) => ({
  id: e.id,
  name: `${e.etiqueta} (${e.id}.xml)`,
  src: `${PREFIJO_GENERADO}${e.id}`,
  type: "text/xml",
}));

// Opciones de "Usar archivo de ejemplo" para el comprobante (PDF o imagen).
export const FIXTURES_COMPROBANTE: UploadFixture[] = CFDI_EJEMPLOS.map((e) => {
  const extension = e.comprobante === "pdf" ? "pdf" : "jpg";
  return {
    id: e.id,
    name: `${e.etiqueta} (${e.id}.${extension})`,
    src: rutaComprobanteEjemplo(e),
    type: e.comprobante === "pdf" ? "application/pdf" : "image/jpeg",
  };
});

export function rutaComprobanteEjemplo(e: Pick<CfdiEjemplo, "id" | "comprobante">) {
  return `/fixtures/fund/ejemplos/${e.id}.${e.comprobante === "pdf" ? "pdf" : "jpg"}`;
}

// Texto del XML sin importar si vino de un archivo real o de un ejemplo.
export async function leerXmlDeUpload(value: UploadValue, hoy: Date): Promise<string> {
  if (value.kind === "file") return value.file.text();
  const { src } = value.fixture;
  if (src.startsWith(PREFIJO_GENERADO)) return crearXmlEjemplo(src.slice(PREFIJO_GENERADO.length), hoy);
  const res = await fetch(src);
  if (!res.ok) throw new Error(`No se pudo leer ${value.fixture.name}.`);
  return res.text();
}
