// Construye un XML de CFDI 4.0 con timbre fiscal simulado. Sin imports: lo usan la app y
// scripts/generar-comprobantes-fund.mts (que corre con Node directamente).

export type ConceptoXml = {
  claveProdServ: string;
  cantidad: number;
  claveUnidad: string; // E48 servicio, H87 pieza, KGM kilo, LTR litro
  unidad: string;
  descripcion: string;
  valorUnitario: number;
};

export type DatosCfdiXml = {
  serie: string;
  folio: string;
  fecha: string; // AAAA-MM-DDThh:mm:ss en hora local, como la emite el SAT
  lugarExpedicion: string; // código postal
  formaPago: string; // 04 tarjeta de crédito, 28 tarjeta de débito
  emisor: { rfc: string; nombre: string; regimenFiscal: string };
  receptor: { rfc: string; nombre: string; domicilioFiscal: string; regimenFiscal: string; usoCfdi: string };
  conceptos: ConceptoXml[];
  uuid: string;
  fechaTimbrado: string;
};

const TASA_IVA = 0.16;

export function redondear2(n: number) {
  return Math.round(n * 100) / 100;
}

// Totales como los calcula el emisor: importe por concepto e IVA por concepto, redondeados a 2 decimales.
export function calcularTotales(conceptos: ConceptoXml[]) {
  const partidas = conceptos.map((c) => {
    const importe = redondear2(c.cantidad * c.valorUnitario);
    return { ...c, importe, iva: redondear2(importe * TASA_IVA) };
  });
  const subtotal = redondear2(partidas.reduce((s, p) => s + p.importe, 0));
  const iva = redondear2(partidas.reduce((s, p) => s + p.iva, 0));
  return { partidas, subtotal, iva, total: redondear2(subtotal + iva) };
}

export function construirCfdiXml(d: DatosCfdiXml): string {
  const { partidas, subtotal, iva, total } = calcularTotales(d.conceptos);
  const sello = selloFicticio(d.uuid);

  const conceptos = partidas
    .map(
      (p) => `    <cfdi:Concepto ClaveProdServ="${p.claveProdServ}" Cantidad="${num(p.cantidad, 2)}" ClaveUnidad="${p.claveUnidad}" Unidad="${esc(p.unidad)}" Descripcion="${esc(p.descripcion)}" ValorUnitario="${num(p.valorUnitario)}" Importe="${num(p.importe)}" ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="${num(p.importe)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${num(p.iva)}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd" Version="4.0" Serie="${esc(d.serie)}" Folio="${esc(d.folio)}" Fecha="${d.fecha}" Sello="${sello}" FormaPago="${d.formaPago}" NoCertificado="30001000000500003416" Certificado="${sello}" SubTotal="${num(subtotal)}" Moneda="MXN" Total="${num(total)}" TipoDeComprobante="I" Exportacion="01" MetodoPago="PUE" LugarExpedicion="${d.lugarExpedicion}">
  <cfdi:Emisor Rfc="${d.emisor.rfc}" Nombre="${esc(d.emisor.nombre)}" RegimenFiscal="${d.emisor.regimenFiscal}"/>
  <cfdi:Receptor Rfc="${d.receptor.rfc}" Nombre="${esc(d.receptor.nombre)}" DomicilioFiscalReceptor="${d.receptor.domicilioFiscal}" RegimenFiscalReceptor="${d.receptor.regimenFiscal}" UsoCFDI="${d.receptor.usoCfdi}"/>
  <cfdi:Conceptos>
${conceptos}
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${num(iva)}">
    <cfdi:Traslados>
      <cfdi:Traslado Base="${num(subtotal)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${num(iva)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" xsi:schemaLocation="http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd" Version="1.1" UUID="${d.uuid}" FechaTimbrado="${d.fechaTimbrado}" RfcProvCertif="SAT970701NN3" SelloCFD="${sello}" NoCertificadoSAT="30001000000500003456" SelloSAT="${sello}"/>
  </cfdi:Complemento>
</cfdi:Comprobante>
`;
}

// AAAA-MM-DDThh:mm:ss en hora local (el CFDI no lleva zona horaria).
export function fechaCfdi(fecha: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}T${p(fecha.getHours())}:${p(fecha.getMinutes())}:${p(fecha.getSeconds())}`;
}

// UUID determinista a partir de un texto (para que los ejemplos siempre tengan el mismo folio fiscal).
export function uuidDesdeTexto(texto: string) {
  let h1 = 0x811c9dc5;
  let h2 = 0x1b873593;
  let hex = "";
  while (hex.length < 32) {
    for (const ch of texto + hex.length) {
      h1 = Math.imul(h1 ^ ch.charCodeAt(0), 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ ch.charCodeAt(0), 0x5bd1e995) >>> 0;
    }
    hex += ((h1 ^ h2) >>> 0).toString(16).padStart(8, "0");
  }
  const s = hex.slice(0, 32).toUpperCase().split("");
  s[12] = "4";
  s[16] = "89AB"[parseInt(s[16], 16) % 4];
  const u = s.join("");
  return `${u.slice(0, 8)}-${u.slice(8, 12)}-${u.slice(12, 16)}-${u.slice(16, 20)}-${u.slice(20)}`;
}

function selloFicticio(semilla: string) {
  // Base64 con apariencia de sello digital; no es una firma real.
  const base = uuidDesdeTexto(semilla).replace(/-/g, "");
  return Array.from({ length: 11 }, (_, i) => base.slice(i % 24, (i % 24) + 8)).join("+") + "==";
}

function num(n: number, decimales = 2) {
  return n.toFixed(decimales);
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
