// Definición declarativa del formulario dinámico: campos y documentos por tipo de persona × tipo de contrato.
// La vista renderiza desde aquí; nunca se escriben campos a mano en la vista.
import type { DefinicionCampo, DefinicionDocumento, DefinicionFormulario, TipoContrato, TipoPersona } from "@/lib/types/contratos";

const PERSONA_MORAL: DefinicionCampo[] = [
  { clave: "razonSocial", etiqueta: "Razón social", tipo: "text", requerido: true, placeholder: "Inmobiliaria del Norte, S.A. de C.V." },
  { clave: "rfc", etiqueta: "RFC", tipo: "text", requerido: true, placeholder: "12 caracteres", ayuda: "RFC de persona moral (12 caracteres)." },
  { clave: "representanteLegal", etiqueta: "Representante legal", tipo: "text", requerido: true },
  { clave: "poderNotarial", etiqueta: "Poder notarial", tipo: "text", requerido: true, placeholder: "Escritura 12,345 del 10/03/2021, Notaría 23", ayuda: "Número de escritura, fecha y notaría." },
  { clave: "domicilioFiscal", etiqueta: "Domicilio fiscal", tipo: "text", requerido: true },
];

const PERSONA_FISICA: DefinicionCampo[] = [
  { clave: "nombre", etiqueta: "Nombre completo", tipo: "text", requerido: true },
  { clave: "rfc", etiqueta: "RFC", tipo: "text", requerido: true, placeholder: "13 caracteres", ayuda: "RFC de persona física (13 caracteres)." },
  { clave: "curp", etiqueta: "CURP", tipo: "text", requerido: true, placeholder: "18 caracteres" },
  { clave: "identificacion", etiqueta: "Identificación oficial", tipo: "select", requerido: true, opciones: ["INE", "Pasaporte", "Cédula profesional"] },
  { clave: "domicilio", etiqueta: "Domicilio", tipo: "text", requerido: true },
];

const INCREMENTOS = ["INPC", "Fijo 3%", "Fijo 4%", "Fijo 5%"];

const CAMPOS_CONTRATO: Record<TipoContrato, Record<TipoPersona, DefinicionCampo[]>> = {
  arrendamiento: {
    moral: [
      { clave: "inmueble", etiqueta: "Inmueble", tipo: "text", requerido: true, placeholder: "Calle, número, colonia, ciudad" },
      { clave: "superficie", etiqueta: "Superficie (m²)", tipo: "number", requerido: true },
      { clave: "rentaMensual", etiqueta: "Renta mensual", tipo: "money", requerido: true, ayuda: "Antes de IVA." },
      { clave: "vigenciaMeses", etiqueta: "Vigencia (meses)", tipo: "number", requerido: true },
      { clave: "fechaInicio", etiqueta: "Inicio de vigencia", tipo: "date", requerido: true },
      { clave: "deposito", etiqueta: "Depósito en garantía", tipo: "select", requerido: true, opciones: ["1 mes", "2 meses", "3 meses"] },
      { clave: "incrementoAnual", etiqueta: "Incremento anual", tipo: "select", requerido: true, opciones: INCREMENTOS },
    ],
    fisica: [
      { clave: "inmueble", etiqueta: "Inmueble", tipo: "text", requerido: true, placeholder: "Calle, número, colonia, ciudad" },
      { clave: "rentaMensual", etiqueta: "Renta mensual", tipo: "money", requerido: true, ayuda: "Antes de IVA." },
      { clave: "vigenciaMeses", etiqueta: "Vigencia (meses)", tipo: "number", requerido: true },
      { clave: "fechaInicio", etiqueta: "Inicio de vigencia", tipo: "date", requerido: true },
      { clave: "aval", etiqueta: "Aval u obligado solidario", tipo: "text", requerido: true, ayuda: "Nombre completo; debe acreditar un inmueble libre de gravamen." },
    ],
  },
  desarrollo: {
    moral: [
      { clave: "proyecto", etiqueta: "Proyecto", tipo: "text", requerido: true, placeholder: "City Express León Norte, 120 habitaciones" },
      { clave: "ubicacion", etiqueta: "Ubicación del predio", tipo: "text", requerido: true },
      { clave: "montoTotal", etiqueta: "Monto total", tipo: "money", requerido: true, ayuda: "Precio alzado antes de IVA." },
      { clave: "plazoMeses", etiqueta: "Plazo de ejecución (meses)", tipo: "number", requerido: true },
      { clave: "fechaInicio", etiqueta: "Inicio de obra", tipo: "date", requerido: true },
      { clave: "anticipo", etiqueta: "Anticipo", tipo: "select", requerido: true, opciones: ["20%", "30%", "40%"] },
      { clave: "garantias", etiqueta: "Garantías", tipo: "select", requerido: true, opciones: ["Fianzas de anticipo y cumplimiento", "Carta de crédito"] },
    ],
    fisica: [
      { clave: "proyecto", etiqueta: "Proyecto o servicio profesional", tipo: "text", requerido: true, placeholder: "Proyecto arquitectónico de fachada" },
      { clave: "ubicacion", etiqueta: "Ubicación", tipo: "text", requerido: true },
      { clave: "montoTotal", etiqueta: "Honorarios totales", tipo: "money", requerido: true },
      { clave: "plazoMeses", etiqueta: "Plazo (meses)", tipo: "number", requerido: true },
      { clave: "fechaInicio", etiqueta: "Inicio", tipo: "date", requerido: true },
      { clave: "cedulaProfesional", etiqueta: "Cédula profesional", tipo: "text", requerido: true },
    ],
  },
  servicios: {
    moral: [
      { clave: "servicio", etiqueta: "Servicio", tipo: "text", requerido: true, placeholder: "Mantenimiento de subestaciones eléctricas" },
      { clave: "hoteles", etiqueta: "Hoteles que cubre", tipo: "number", requerido: true },
      { clave: "contraprestacionMensual", etiqueta: "Contraprestación mensual", tipo: "money", requerido: true },
      { clave: "vigenciaMeses", etiqueta: "Vigencia (meses)", tipo: "number", requerido: true },
      { clave: "fechaInicio", etiqueta: "Inicio", tipo: "date", requerido: true },
      { clave: "nivelServicio", etiqueta: "Nivel de servicio", tipo: "select", requerido: true, opciones: ["Estándar (respuesta 24 h)", "Crítico (respuesta 4 h)"] },
    ],
    fisica: [
      { clave: "servicio", etiqueta: "Servicio", tipo: "text", requerido: true },
      { clave: "contraprestacionMensual", etiqueta: "Honorarios mensuales", tipo: "money", requerido: true },
      { clave: "vigenciaMeses", etiqueta: "Vigencia (meses)", tipo: "number", requerido: true },
      { clave: "fechaInicio", etiqueta: "Inicio", tipo: "date", requerido: true },
    ],
  },
  confidencialidad: {
    moral: [
      { clave: "proposito", etiqueta: "Propósito", tipo: "text", requerido: true, placeholder: "Evaluación de sitios en el Bajío" },
      { clave: "vigenciaAnios", etiqueta: "Vigencia", tipo: "select", requerido: true, opciones: ["1 año", "2 años", "3 años", "5 años"] },
      { clave: "penaConvencional", etiqueta: "Pena convencional", tipo: "money", requerido: false, ayuda: "Opcional." },
    ],
    fisica: [
      { clave: "proposito", etiqueta: "Propósito", tipo: "text", requerido: true },
      { clave: "vigenciaAnios", etiqueta: "Vigencia", tipo: "select", requerido: true, opciones: ["1 año", "2 años", "3 años", "5 años"] },
    ],
  },
};

const DOCS_MORAL: DefinicionDocumento[] = [
  { clave: "actaConstitutiva", etiqueta: "Acta constitutiva", obligatorio: true },
  { clave: "poderNotarial", etiqueta: "Poder notarial del representante", obligatorio: true },
  { clave: "identificacion", etiqueta: "Identificación del representante", obligatorio: true },
  { clave: "constanciaFiscal", etiqueta: "Constancia de situación fiscal", obligatorio: true },
  { clave: "comprobanteDomicilio", etiqueta: "Comprobante de domicilio", obligatorio: false },
];

const DOCS_FISICA: DefinicionDocumento[] = [
  { clave: "identificacion", etiqueta: "Identificación oficial", obligatorio: true },
  { clave: "constanciaFiscal", etiqueta: "Constancia de situación fiscal", obligatorio: true },
  { clave: "comprobanteDomicilio", etiqueta: "Comprobante de domicilio", obligatorio: true },
];

const DOCS_CONTRATO: Record<TipoContrato, Record<TipoPersona, DefinicionDocumento[]>> = {
  arrendamiento: {
    moral: [
      { clave: "escrituraInmueble", etiqueta: "Escritura del inmueble", obligatorio: true },
      { clave: "predial", etiqueta: "Boleta predial al corriente", obligatorio: false },
    ],
    fisica: [
      { clave: "escrituraInmueble", etiqueta: "Escritura del inmueble", obligatorio: true },
      { clave: "identificacionAval", etiqueta: "Identificación del aval", obligatorio: true },
    ],
  },
  desarrollo: {
    moral: [
      { clave: "registroRepse", etiqueta: "Registro REPSE", obligatorio: true },
      { clave: "propuestaTecnica", etiqueta: "Propuesta técnica y económica", obligatorio: true },
    ],
    fisica: [{ clave: "propuestaTecnica", etiqueta: "Propuesta de honorarios", obligatorio: true }],
  },
  servicios: {
    moral: [
      { clave: "registroRepse", etiqueta: "Registro REPSE", obligatorio: true },
      { clave: "cotizacion", etiqueta: "Cotización firmada", obligatorio: true },
    ],
    fisica: [{ clave: "cotizacion", etiqueta: "Cotización firmada", obligatorio: true }],
  },
  confidencialidad: { moral: [], fisica: [] },
};

export const TIPOS_CONTRATO: TipoContrato[] = ["arrendamiento", "desarrollo", "servicios", "confidencialidad"];
export const TIPOS_PERSONA: TipoPersona[] = ["moral", "fisica"];

export const FORMULARIOS: DefinicionFormulario[] = TIPOS_CONTRATO.flatMap((tipoContrato) =>
  TIPOS_PERSONA.map((tipoPersona) => ({
    tipoPersona,
    tipoContrato,
    campos: [...(tipoPersona === "moral" ? PERSONA_MORAL : PERSONA_FISICA), ...CAMPOS_CONTRATO[tipoContrato][tipoPersona]],
    documentos: [...(tipoPersona === "moral" ? DOCS_MORAL : DOCS_FISICA), ...DOCS_CONTRATO[tipoContrato][tipoPersona]],
  })),
);

// Documentos de ejemplo para "Usar archivo de ejemplo" (public/fixtures/contratos/expediente/<clave>.pdf).
export const DOCUMENTOS_EJEMPLO: Record<string, string> = {
  actaConstitutiva: "Acta constitutiva",
  poderNotarial: "Poder notarial",
  identificacion: "Identificación oficial",
  constanciaFiscal: "Constancia de situación fiscal",
  comprobanteDomicilio: "Comprobante de domicilio",
  escrituraInmueble: "Escritura del inmueble",
  predial: "Boleta predial",
  identificacionAval: "Identificación del aval",
  registroRepse: "Registro REPSE",
  propuestaTecnica: "Propuesta técnica y económica",
  cotizacion: "Cotización firmada",
};
