// Lectura de CFDI 4.0 (RF02): parseo real del XML con fast-xml-parser.
import { XMLParser, XMLValidator } from "fast-xml-parser";

export type CfdiConcepto = { descripcion: string; claveProdServ: string; importe: number };

export type Cfdi = {
  version: string;
  uuid: string;
  rfcEmisor: string;
  nombreEmisor: string;
  rfcReceptor: string;
  nombreReceptor: string;
  fecha: string; // tal como viene en el XML: AAAA-MM-DDThh:mm:ss, hora local
  fechaTimbrado: string | null;
  subtotal: number;
  iva: number;
  total: number;
  moneda: string;
  formaPago: string | null;
  conceptos: CfdiConcepto[];
};

export class CfdiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CfdiError";
  }
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true, // cfdi:Comprobante → Comprobante, tfd:TimbreFiscalDigital → TimbreFiscalDigital
  parseAttributeValue: false, // RFC, claves y UUID se leen como texto
  isArray: (name) => ["Concepto", "Traslado"].includes(name),
});

type Nodo = Record<string, unknown>;

export function parseCfdi(xml: string): Cfdi {
  if (XMLValidator.validate(xml) !== true) throw new CfdiError("El archivo no es un XML válido.");

  const raiz = parser.parse(xml) as Nodo;
  const comprobante = raiz.Comprobante as Nodo | undefined;
  if (!comprobante) throw new CfdiError("El XML no es un CFDI: falta el nodo Comprobante.");

  const version = texto(comprobante.Version);
  if (version !== "4.0") throw new CfdiError(`Solo se aceptan CFDI 4.0; este es versión ${version || "desconocida"}.`);

  const emisor = (comprobante.Emisor ?? {}) as Nodo;
  const receptor = (comprobante.Receptor ?? {}) as Nodo;
  const timbre = ((comprobante.Complemento as Nodo | undefined)?.TimbreFiscalDigital ?? null) as Nodo | null;
  if (!timbre?.UUID) throw new CfdiError("El CFDI no está timbrado: falta el TimbreFiscalDigital con UUID.");

  const conceptos = (((comprobante.Conceptos as Nodo | undefined)?.Concepto ?? []) as Nodo[]).map((c) => ({
    descripcion: texto(c.Descripcion),
    claveProdServ: texto(c.ClaveProdServ),
    importe: numero(c.Importe),
  }));
  if (conceptos.length === 0) throw new CfdiError("El CFDI no tiene conceptos.");

  // IVA: traslados con Impuesto 002 del nodo global de impuestos (o TotalImpuestosTrasladados).
  const impuestos = (comprobante.Impuestos ?? {}) as Nodo;
  const traslados = ((impuestos.Traslados as Nodo | undefined)?.Traslado ?? []) as Nodo[];
  const ivaTraslados = traslados.filter((t) => texto(t.Impuesto) === "002").reduce((s, t) => s + numero(t.Importe), 0);
  const iva = traslados.length > 0 ? ivaTraslados : numero(impuestos.TotalImpuestosTrasladados);

  const rfcEmisor = texto(emisor.Rfc).toUpperCase();
  const rfcReceptor = texto(receptor.Rfc).toUpperCase();
  if (!rfcEmisor || !rfcReceptor) throw new CfdiError("El CFDI no trae RFC de emisor o de receptor.");

  return {
    version,
    uuid: texto(timbre.UUID).toUpperCase(),
    rfcEmisor,
    nombreEmisor: texto(emisor.Nombre),
    rfcReceptor,
    nombreReceptor: texto(receptor.Nombre),
    fecha: texto(comprobante.Fecha),
    fechaTimbrado: timbre.FechaTimbrado ? texto(timbre.FechaTimbrado) : null,
    subtotal: numero(comprobante.SubTotal),
    iva: Math.round(iva * 100) / 100,
    total: numero(comprobante.Total),
    moneda: texto(comprobante.Moneda) || "MXN",
    formaPago: comprobante.FormaPago ? texto(comprobante.FormaPago) : null,
    conceptos,
  };
}

// La fecha del CFDI no trae zona horaria: se interpreta como hora local.
export function fechaEmision(cfdi: Pick<Cfdi, "fecha">): Date {
  const [fecha, hora = "00:00:00"] = cfdi.fecha.split("T");
  const [a, m, d] = fecha.split("-").map(Number);
  const [h, mi, s] = hora.split(":").map(Number);
  return new Date(a, m - 1, d, h, mi, s || 0);
}

function texto(v: unknown) {
  return v === undefined || v === null ? "" : String(v).trim();
}

function numero(v: unknown) {
  const n = Number(texto(v));
  return Number.isFinite(n) ? n : 0;
}
